import { getCms } from "@/lib/cms";
import { fieldErrors, formSchema } from "@/lib/forms";
import { formMails } from "@/integrations/mail/events";

// Formularze sklepu → panel:
//   contact / b2b → Wiadomości i zgłoszenia, newsletter → Newsletter,
//   review → Opinie (do moderacji), return → Zwroty i reklamacje
// Ochrona: walidacja, pole-pułapka na boty, limit 5 zgłoszeń / 10 min z jednego adresu IP.
const hits = new Map<string, number[]>();
const LIMIT = 5;
const WINDOW = 10 * 60 * 1000;

function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  list.push(now);
  hits.set(ip, list);
  return list.length > LIMIT;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ ok: false, message: "Zbyt wiele zgłoszeń. Spróbuj ponownie za kilka minut." }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Nieprawidłowe dane" }, { status: 400 });
  }

  const parsed = formSchema.safeParse(body);
  if (!parsed.success) return Response.json({ ok: false, message: "Popraw zaznaczone pola", errors: fieldErrors(parsed.error) }, { status: 422 });
  const d = parsed.data;

  // Bot wypełnił ukryte pole – udajemy sukces, nic nie zapisujemy
  if (d.website) return Response.json({ ok: true });

  const payload = await getCms();
  const meta = { referer: request.headers.get("referer"), userAgent: request.headers.get("user-agent")?.slice(0, 200) };

  switch (d.type) {
    case "newsletter": {
      const existing = await payload.find({ collection: "newsletter", where: { email: { equals: d.email.toLowerCase() } }, limit: 1, overrideAccess: true });
      const data = { email: d.email.toLowerCase(), status: "subscribed" as const, consentAt: new Date().toISOString(), source: "stopka" };
      if (existing.docs[0]) await payload.update({ collection: "newsletter", id: existing.docs[0].id, data, overrideAccess: true });
      else await payload.create({ collection: "newsletter", data, overrideAccess: true });
      break;
    }
    case "review": {
      const product = (await payload.find({ collection: "products", where: { slug: { equals: d.product } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
      if (!product) return Response.json({ ok: false, message: "Nie znaleziono produktu" }, { status: 404 });
      const review = await payload.create({
        collection: "reviews", overrideAccess: true,
        data: { product: product.id, rating: d.rating, author: d.author, email: d.email, title: d.title, content: d.content, status: "pending" },
      });
      formMails(payload, { kind: "review", name: d.author, rows: [["Produkt", product.name], ["Ocena", `${d.rating}/5`], ["Autor", d.author], ["Tytuł", d.title], ["Treść", d.content]], adminPath: `/admin/collections/reviews/${review.id}` });
      break;
    }
    case "stock-alert": {
      const product = (await payload.find({ collection: "products", where: { slug: { equals: d.product } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
      if (!product) return Response.json({ ok: false, message: "Nie znaleziono produktu" }, { status: 404 });
      const dup = await payload.count({ collection: "stock-alerts", overrideAccess: true, where: { and: [{ product: { equals: product.id } }, { email: { equals: d.email.toLowerCase() } }, { status: { equals: "waiting" } }] } });
      if (!dup.totalDocs) await payload.create({ collection: "stock-alerts", overrideAccess: true, data: { product: product.id, email: d.email.toLowerCase(), status: "waiting" } });
      break;
    }
    case "return": {
      const order = (await payload.find({ collection: "orders", where: { orderNumber: { equals: d.orderNumber.toUpperCase() } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
      const ret = await payload.create({
        collection: "returns", overrideAccess: true,
        data: {
          type: d.kind, orderNumber: d.orderNumber.toUpperCase(), order: order?.id, name: d.name, email: d.email, phone: d.phone || undefined,
          products: d.products, reason: d.reason || undefined, resolution: d.resolution, bankAccount: d.bankAccount || undefined,
        },
      });
      formMails(payload, {
        kind: "return", name: d.name, email: d.email,
        rows: [["Rodzaj", d.kind === "complaint" ? "Reklamacja" : "Zwrot"], ["Zamówienie", d.orderNumber.toUpperCase()], ["Klient", d.name], ["E-mail", d.email], ["Telefon", d.phone], ["Produkty", d.products], ["Powód", d.reason], ["Oczekiwane rozwiązanie", d.resolution], ["Konto do zwrotu", d.bankAccount]],
        adminPath: `/admin/collections/returns/${ret.id}`,
        receipt: `Otrzymaliśmy ${d.kind === "complaint" ? "reklamację" : "zgłoszenie zwrotu"} do zamówienia ${d.orderNumber.toUpperCase()}. Odpowiemy w ciągu 2 dni roboczych – zwykle szybciej. Nie odsyłaj paczki, zanim nie potwierdzimy adresu.`,
      });
      break;
    }
    default: {
      const sub = await payload.create({
        collection: "form-submissions",
        overrideAccess: true,
        data: {
          type: d.type,
          name: d.name,
          email: d.email,
          phone: d.phone || undefined,
          company: d.type === "b2b" ? d.company : undefined,
          nip: d.type === "b2b" ? d.nip.replace(/\D/g, "") : undefined,
          subject: d.type === "contact" ? d.subject : "Wniosek o konto hurtowe",
          message: d.message || undefined,
          consent: d.consent,
          meta,
        },
      });
      formMails(payload, {
        kind: d.type === "b2b" ? "b2b" : "contact", name: d.name, email: d.email,
        rows: [["Imię i nazwisko", d.name], ["E-mail", d.email], ["Telefon", d.phone], ...(d.type === "b2b" ? ([["Firma", d.company], ["NIP", d.nip]] as [string, unknown][]) : ([["Temat", d.subject]] as [string, unknown][])), ["Wiadomość", d.message]],
        adminPath: `/admin/collections/form-submissions/${sub.id}`,
        receipt: d.type === "b2b"
          ? "Otrzymaliśmy wniosek o konto hurtowe. Sprawdzimy dane firmy i odezwiemy się w ciągu 1–2 dni roboczych."
          : "Otrzymaliśmy Twoją wiadomość. Odpowiemy najszybciej, jak to możliwe – zwykle tego samego dnia roboczego.",
      });
    }
  }

  return Response.json({ ok: true });
}
