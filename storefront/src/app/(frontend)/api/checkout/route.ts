import { getCms } from "@/lib/cms";
import { checkoutInput, placeOrder } from "@/integrations/checkout/placeOrder";
import { currentCustomer } from "@/integrations/account";
import { isStaff, newSession, readSession, recordHit } from "@/lib/stats";

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 20;
}

const text = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

async function readBody(request: Request): Promise<unknown> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return request.json();
  const fd = await request.formData();
  const items: { slug: string; qty: number }[] = [];
  for (let i = 0; i < 50; i++) {
    const slug = text(fd.get(`item_slug_${i}`)).trim();
    if (!slug) break;
    items.push({ slug, qty: Math.round(Number(text(fd.get(`item_qty_${i}`)))) });
  }
  const invoice = text(fd.get("invoice"));
  return {
    name: text(fd.get("name")),
    email: text(fd.get("email")),
    phone: text(fd.get("phone")),
    street: text(fd.get("street")),
    postcode: text(fd.get("postcode")),
    city: text(fd.get("city")),
    invoice: invoice === "1" || invoice === "on" || invoice === "true",
    nip: text(fd.get("nip")) || undefined,
    company: text(fd.get("company")) || undefined,
    ship: text(fd.get("ship")),
    pay: text(fd.get("pay")),
    point: text(fd.get("point")) || undefined,
    note: text(fd.get("note")) || undefined,
    coupon: text(fd.get("coupon")) || undefined,
    blikCode: text(fd.get("blikCode")) || undefined,
    p24Terms: text(fd.get("p24Terms")) === "1",
    items,
  };
}

function reply(request: Request, body: { ok: boolean; message?: string; orderNumber?: string; confirmKey?: string }, status: number) {
  if ((request.headers.get("content-type") ?? "").includes("application/json")) {
    return Response.json(body, { status });
  }
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "sonax.sklep.pl";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const url = new URL("/zamowienie", `${proto}://${host}`);
  if (body.ok && body.orderNumber) {
    url.searchParams.set("nr", body.orderNumber);
    if (body.confirmKey) url.searchParams.set("k", body.confirmKey);
  }
  else url.searchParams.set("blad", (body.message || "Nie udało się złożyć zamówienia.").slice(0, 180));
  return Response.redirect(url, 303);
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return reply(request, { ok: false, message: "Zbyt wiele prób. Odczekaj kilka minut albo zadzwoń: 664 953 377." }, 429);

  let body: unknown;
  try {
    body = await readBody(request);
  } catch {
    return reply(request, { ok: false, message: "Nieprawidłowe dane" }, 400);
  }

  const parsed = checkoutInput.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first?.message === "Required" ? "Uzupełnij wszystkie wymagane pola." : first?.message ?? "Popraw dane w formularzu.";
    return reply(request, { ok: false, message }, 422);
  }

  try {
    const payload = await getCms();
    const customer = await currentCustomer(payload, request.headers).catch(() => null);
    const result = await placeOrder(payload, parsed.data, { ip, userAgent: request.headers.get("user-agent") ?? "" }, customer?.id);
    if (!result.ok) payload.logger.warn(`Zamówienie odrzucone: ${result.message}`);
    if (result.ok) {
      const cookie = request.headers.get("cookie");
      const session = readSession(cookie) ?? newSession();
      const email = parsed.data.email;
      const staff = isStaff(cookie);
      for (const item of parsed.data.items) recordHit({ session, path: `/produkt/${item.slug}`, kind: "buy", product: item.slug, email, orderNo: result.orderNumber, qty: item.qty, staff });
      recordHit({ session, path: "/zamowienie", kind: "order", email, orderNo: result.orderNumber, staff });
    }
    return reply(request, result, result.ok ? 200 : 400);
  } catch (e) {
    console.error("checkout", e);
    return reply(request, { ok: false, message: "Nie udało się złożyć zamówienia. Spróbuj ponownie albo zadzwoń: 664 953 377." }, 500);
  }
}
