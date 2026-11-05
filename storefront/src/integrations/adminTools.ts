// Szybkie akcje z prawego panelu edycji (FormBits: OrderActions / ProductActions). Tylko dla pracowników.
//   GET  /api/order-tools/:id/print      – zamówienie do druku (magazyn, PDF)
//   POST /api/order-tools/:id/resend     – ponowne potwierdzenie zamówienia mailem do klienta
//   GET  /api/product-tools/:id/stats    – sprzedaż z 30 dni i liczba oczekujących na dostępność
//   POST /api/product-tools/:id/refresh  – stan i cena z BaseLinkera teraz (bez czekania na synchronizację)

import type { Endpoint, PayloadRequest } from "payload";
import { revalidatePath } from "next/cache";
import { hasRole } from "@/payload/access";
import { invalidateCatalog } from "@/lib/catalogCache";
import { siteBase, siteIndexable } from "@/lib/site";
import { cleanSite } from "./siteSettings";
import { getLayout, getSite, setLayout, setSite, vaultPath } from "./vault";
import { cleanLayout, SECTIONS, type PageKind } from "@/lib/layoutSections";
import { blActive } from "./baselinker/client";
import { fetchOffer } from "./baselinker/sync";
import { getP24Transaction, p24Mode, refundP24 } from "./przelewy24";
import { addHistory } from "./history";
import { mailConfig, sendMail } from "./mail/send";
import * as T from "./mail/templates";
import { LEGAL_PAGES, toLexical } from "./legalTexts";
import { parseIds, printPage, printSection } from "./orderBulk";

// Wyczyść pamięć sklepu: katalog produktów i zapamiętane strony (Next)
function refreshAll() {
  invalidateCatalog();
  for (const p of ["/sitemap.xml", "/llms.txt", "/llms-full.txt", "/feed/google.xml"]) try { revalidatePath(p); } catch { /* poza Next */ }
  try { revalidatePath("/", "layout"); } catch { /* poza Next */ }
}

const deny = () => Response.json({ ok: false, message: "Brak uprawnień" }, { status: 403 });
const idOf = (req: PayloadRequest) => String(req.routeParams?.id ?? "");

// CSV dla Excela: średnik, cudzysłowy, BOM (polskie znaki)
const csvCell = (v: unknown) => {
  const t = v == null ? "" : String(v);
  return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
const csv = (rows: unknown[][]) => "\uFEFF" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
const plNum = (n: unknown) => (n == null || n === "" ? "" : String(Number(n).toFixed(2)).replace(".", ","));
const ORDER_ST: Record<string, string> = { new: "Nowe", awaiting_payment: "Czeka na płatność", paid: "Opłacone", processing: "W realizacji", shipped: "Wysłane", cancelled: "Anulowane" };
const PAY_ST: Record<string, string> = { pending: "czeka na wpłatę", paid: "opłacone", failed: "nieudana", refunded: "zwrócona", deferred: "przy odbiorze" };
const B2B_ST: Record<string, string> = { pending: "czeka na weryfikację", approved: "zatwierdzone", rejected: "odrzucone" };
const plDate = (d: unknown) => (d ? new Date(String(d)).toLocaleString("pl-PL") : "");


// Treść edytora (Lexical) dla przykładowych bloków: nagłówek + akapity
const lex = (heading: string, ...paragraphs: string[]) => {
  const text = (t: string) => ({ type: "text", text: t, version: 1, detail: 0, format: 0, mode: "normal", style: "" });
  const node = (type: string, t: string, extra: Record<string, unknown> = {}) => ({ type, version: 1, direction: "ltr", format: "", indent: 0, children: [text(t)], ...extra });
  return {
    root: { type: "root", version: 1, direction: "ltr", format: "", indent: 0,
      children: [node("heading", heading, { tag: "h2" }), ...paragraphs.map((p) => node("paragraph", p, { textFormat: 0, textStyle: "" }))] },
  };
};
const faq = (...qa: [string, string][]) => ({ blockType: "faq", items: qa.map(([q, a]) => ({ q, a })) });
const PAGE_TEMPLATES: Record<string, () => unknown[]> = {
  promo: () => [
    { blockType: "hero", title: "Tytuł promocji", text: "Hasło akcji, np. −20% na woski SONAX do końca miesiąca.", ctaLabel: "Zobacz produkty", ctaLink: "/promocje" },
    { blockType: "richText", content: lex("Na czym polega promocja", "Opisz zasady: jakie produkty, do kiedy, czy łączy się z innymi rabatami.") },
    { blockType: "products", title: "Produkty w promocji", limit: 8 },
    faq(["Do kiedy trwa promocja?", "Wpisz datę zakończenia."], ["Czy rabat łączy się z kodami?", "Wpisz zasady łączenia rabatów."]),
  ],
  info: () => [
    { blockType: "richText", content: lex("Najważniejsze informacje", "Główna treść strony – krótkie akapity czyta się najlepiej.") },
    { blockType: "imageText", content: lex("Nagłówek przy zdjęciu", "Tekst obok zdjęcia, np. o firmie, magazynie lub zespole.") },
    faq(["Pytanie, które często zadają klienci?", "Krótka, konkretna odpowiedź."]),
  ],
  brand: () => [
    { blockType: "hero", title: "Nazwa marki lub serii", text: "Jedno zdanie o tym, co wyróżnia markę.", ctaLabel: "Zobacz produkty", ctaLink: "/marki/sonax" },
    { blockType: "imageText", content: lex("O marce", "Historia, technologia, dla kogo są produkty."), imageRight: true },
    { blockType: "products", title: "Produkty marki", limit: 12 },
  ],
  guide: () => [
    { blockType: "richText", content: lex("Czego potrzebujesz", "Wstęp: co osiągniemy i ile to zajmie. Wypisz potrzebne produkty i akcesoria.") },
    { blockType: "imageText", content: lex("Krok 1", "Opis pierwszego kroku – dodaj zdjęcie obok.") },
    { blockType: "imageText", content: lex("Krok 2", "Opis drugiego kroku."), imageRight: true },
    { blockType: "products", title: "Produkty użyte w poradniku", limit: 4 },
  ],
};

export const adminToolEndpoints: Endpoint[] = [
  {
    // Układ stron (Treści i wygląd → Układ strony): kolejność i widoczność sekcji
    path: "/site-layout",
    method: "get",
    handler: async (req) => {
      if (!(await hasRole(req, "admin", "editor"))) return deny();
      return Response.json({ ok: true, layout: Object.fromEntries((Object.keys(SECTIONS) as PageKind[]).map((k) => [k, getLayout(k)])) });
    },
  },
  {
    path: "/site-layout",
    method: "post",
    handler: async (req) => {
      if (!(await hasRole(req, "admin", "editor"))) return deny();
      const body = ((await req.json?.().catch(() => ({}))) ?? {}) as Record<string, unknown>;
      setLayout(cleanLayout(body.layout), (req.user as { email?: string } | null)?.email);
      refreshAll();
      return Response.json({ ok: true, message: "Układ zapisany – sklep już go pokazuje" });
    },
  },
  {
    // Ustawienia techniczne (Ustawienia → Widoczność i technika): odczyt + stan plików dla wyszukiwarek
    path: "/site-settings",
    method: "get",
    handler: async (req) => {
      if (!(await hasRole(req, "admin"))) return deny();
      const active = { status: { equals: "active" } } as const;
      const count = (where: object) => req.payload.count({ collection: "products", overrideAccess: true, where: where as never }).then((r) => r.totalDocs);
      const [products, inStock, imgs] = await Promise.all([
        count(active), count({ and: [active, { stock: { greater_than: 0 } }] }),
        req.payload.find({ collection: "products", where: active, limit: 0, pagination: false, depth: 0, overrideAccess: true, select: { images: true } }),
      ]);
      const withImages = imgs.docs.filter((d) => d.images?.some((i) => i.media || i.url)).length;
      return Response.json({
        ok: true, settings: getSite(), base: siteBase(), indexable: siteIndexable(),
        stats: { products, inStock, withImages },
        server: { node: process.version, vault: vaultPath(), scheduler: process.env.INTEGRATIONS_SCHEDULER !== "0", startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString() },
      });
    },
  },
  {
    path: "/site-settings",
    method: "post",
    handler: async (req) => {
      if (!(await hasRole(req, "admin"))) return deny();
      const body = ((await req.json?.().catch(() => ({}))) ?? {}) as Record<string, unknown>;
      setSite(cleanSite(body), (req.user as { email?: string } | null)?.email);
      refreshAll();
      return Response.json({ ok: true, message: "Zapisano – sklep odświeżony", settings: getSite(), indexable: siteIndexable() });
    },
  },
  {
    // „Odśwież sklep”: katalog z bazy od nowa + wszystkie zapamiętane strony, mapa strony, llms.txt i plik Google
    path: "/site-tools/refresh",
    method: "post",
    handler: async (req) => {
      if (!(await hasRole(req, "admin", "editor"))) return deny();
      refreshAll();
      return Response.json({ ok: true, message: "Sklep odświeżony – zmiany widać od razu" });
    },
  },
  {
    // Odpowiedź na wiadomość z formularza: mail do klienta (odpowiedź klienta wraca na adres sklepu), wpis w wątku, status „Załatwione”
    path: "/message-tools/:id/reply",
    method: "post",
    handler: async (req) => {
      if (!(await hasRole(req, "orders"))) return deny();
      const body = ((await req.json?.().catch(() => ({}))) ?? {}) as { text?: string };
      const text = String(body.text ?? "").trim().slice(0, 8000);
      if (text.length < 2) return Response.json({ ok: false, message: "Wpisz treść odpowiedzi" }, { status: 400 });
      if (!mailConfig()) return Response.json({ ok: false, message: "Poczta nie jest skonfigurowana – Integracje → Moduły → Poczta (SMTP)." });
      const m = await req.payload.findByID({ collection: "form-submissions", id: idOf(req), depth: 0, overrideAccess: true });
      const meta = (m.meta ?? {}) as { product?: { name: string; slug: string }; replies?: { at: string; by: string; text: string }[] };
      const store = await req.payload.findGlobal({ slug: "store-settings", overrideAccess: true });
      const sent = await sendMail(req.payload, { to: m.email, replyTo: store.email || undefined, ...T.messageReply(store as T.Shop, { name: m.name, subject: m.subject, message: m.message, product: meta.product }, text) });
      if (!sent.ok) return Response.json({ ok: false, message: `Mail nie wyszedł: ${sent.message}` });
      const u = req.user as { name?: string; email?: string } | null;
      await req.payload.update({
        collection: "form-submissions", id: m.id, overrideAccess: true,
        data: { status: "done", meta: { ...meta, replies: [...(meta.replies ?? []), { at: new Date().toISOString(), by: u?.name || u?.email || "pracownik", text }] } },
      });
      return Response.json({ ok: true, message: `Odpowiedź wysłana na ${m.email}` });
    },
  },
  {
    // Nowa podstrona z gotowego schematu (Treści i wygląd → „Utwórz stronę”): szkic z przykładowymi blokami
    path: "/content-tools/page-template",
    method: "post",
    handler: async (req) => {
      if (!(await hasRole(req, "editor"))) return deny();
      const body = ((await req.json?.().catch(() => ({}))) ?? {}) as { template?: string; title?: string };
      const title = String(body.title ?? "").trim().slice(0, 120);
      const layout = PAGE_TEMPLATES[String(body.template)];
      if (!title || !layout) return Response.json({ ok: false, message: "Podaj tytuł i wybierz schemat" }, { status: 400 });
      const doc = await req.payload.create({
        collection: "pages", draft: true, overrideAccess: true, req,
        data: { title, intro: "Krótki wstęp pod tytułem – 1–2 zdania zachęty.", layout: layout(), _status: "draft" } as never,
      });
      return Response.json({ ok: true, id: doc.id });
    },
  },
  {
    // Nowe wersje regulaminu i polityki prywatności (src/integrations/legalTexts.ts) jako SZKICE – opublikowana wersja się nie zmienia
    path: "/content-tools/legal-drafts",
    method: "post",
    handler: async (req) => {
      if (!(await hasRole(req, "admin"))) return deny();
      const done: { slug: string; id: number | string }[] = [];
      for (const p of LEGAL_PAGES) {
        const { docs } = await req.payload.find({ collection: "pages", where: { slug: { equals: p.slug } }, limit: 1, depth: 0, overrideAccess: true });
        if (!docs[0]) continue;
        await req.payload.update({
          collection: "pages", id: docs[0].id, draft: true, overrideAccess: true, req,
          data: { intro: p.intro, layout: [{ blockType: "richText", content: toLexical(p.blocks) }] } as never,
        });
        done.push({ slug: p.slug, id: docs[0].id });
      }
      return Response.json(done.length
        ? { ok: true, message: "Zapisano szkice – otwórz stronę, przeczytaj i kliknij „Opublikuj zmiany”.", pages: done }
        : { ok: false, message: "Nie znaleziono stron regulaminu i polityki prywatności" });
    },
  },
  {
    // Oś czasu zamówienia: historia zmian, maile i przekazania do BaseLinkera
    path: "/order-tools/:id/history",
    method: "get",
    handler: async (req) => {
      if (!(await hasRole(req, "orders"))) return deny();
      const { docs } = await req.payload.find({
        collection: "integration-logs", where: { order: { equals: idOf(req) } }, sort: "createdAt", limit: 200, depth: 0, overrideAccess: true,
      });
      return Response.json({
        ok: true,
        events: docs.map((l) => ({ at: l.createdAt, type: l.type, status: l.status, message: l.message, by: (l.details as { by?: string } | null)?.by ?? "" })),
      });
    },
  },
  {
    // Karta klienta: liczba zamówień, suma zakupów, ostatnie zamówienie
    path: "/customer-tools/:id/stats",
    method: "get",
    handler: async (req) => {
      if (!(await hasRole(req, "orders"))) return deny();
      const c = await req.payload.findByID({ collection: "customers", id: idOf(req), depth: 0, overrideAccess: true });
      const { docs } = await req.payload.find({
        collection: "orders", depth: 0, limit: 1000, pagination: false, overrideAccess: true, sort: "-createdAt",
        where: { or: [{ customer: { equals: c.id } }, { email: { equals: c.email.toLowerCase() } }] }, select: { orderNumber: true, total: true, status: true, createdAt: true },
      });
      const valid = docs.filter((o) => o.status !== "cancelled");
      return Response.json({
        ok: true, orders: valid.length, spent: valid.reduce((s, o) => s + Number(o.total ?? 0), 0),
        last: docs[0] ? { id: docs[0].id, number: docs[0].orderNumber, at: docs[0].createdAt } : null, email: c.email,
      });
    },
  },
  {
    // Decyzja o koncie B2B: zatwierdź / odrzuć + mail do klienta
    path: "/customer-tools/:id/b2b",
    method: "post",
    handler: async (req) => {
      if (!(await hasRole(req, "orders"))) return deny();
      const body = ((await req.json?.().catch(() => ({}))) ?? {}) as { decision?: string };
      const approved = body.decision === "approved";
      if (!approved && body.decision !== "rejected") return Response.json({ ok: false, message: "Nieznana decyzja" }, { status: 400 });
      const c = await req.payload.findByID({ collection: "customers", id: idOf(req), depth: 0, overrideAccess: true });
      await req.payload.update({ collection: "customers", id: c.id, overrideAccess: true, data: { accountType: "business", b2b: { ...(c.b2b ?? {}), status: approved ? "approved" : "rejected" } } as never });
      let mail = "";
      if (mailConfig()) {
        const store = await req.payload.findGlobal({ slug: "store-settings", overrideAccess: true });
        const r = await sendMail(req.payload, { to: c.email, ...T.b2bDecision(store as T.Shop, approved, c.b2b?.company) });
        mail = r.ok ? " Klient dostał maila." : ` Mail nie wyszedł: ${r.message}`;
      }
      return Response.json({ ok: true, message: `${approved ? "Konto B2B zatwierdzone" : "Wniosek odrzucony"}.${mail}` });
    },
  },
  {
    // Eksport do Excela: /api/export/orders|products|customers[?days=30]
    path: "/export/:kind",
    method: "get",
    handler: async (req) => {
      const kind = String(req.routeParams?.kind ?? "");
      const days = Number(new URL(req.url ?? "http://x").searchParams.get("days") ?? 0);
      // ?ids=1,2,3 – tylko zaznaczone (akcje na wielu zamówieniach), ?days=30 – ostatnie dni
      const ids = parseIds(new URL(req.url ?? "http://x").searchParams.get("ids"));
      const since = ids.length ? { id: { in: ids } } : days > 0 ? { createdAt: { greater_than: new Date(Date.now() - days * 86_400_000).toISOString() } } : undefined;
      let rows: unknown[][] = [];
      if (kind === "orders") {
        if (!(await hasRole(req, "orders"))) return deny();
        const store = await req.payload.findGlobal({ slug: "store-settings", overrideAccess: true });
        const ship = (c?: string | null) => store.shippingMethods?.find((m) => m.code === c)?.label ?? c ?? "";
        const pay = (c?: string | null) => store.paymentMethods?.find((m) => m.code === c)?.label ?? c ?? "";
        const { docs } = await req.payload.find({ collection: "orders", depth: 0, limit: 0, pagination: false, overrideAccess: true, sort: "-createdAt", where: since as never });
        rows = [["Numer", "Data", "Status", "Klient", "E-mail", "Telefon", "Firma", "NIP", "Miasto", "Dostawa", "Punkt", "Płatność", "Status płatności", "Produkty (szt.)", "Wartość produktów", "Dostawa (zł)", "Razem (zł)", "ID BaseLinker"]];
        for (const o of docs) rows.push([
          o.orderNumber, plDate(o.createdAt), ORDER_ST[o.status ?? ""] ?? o.status, o.shipping?.fullName, o.email, o.phone, o.invoice?.wanted ? o.invoice.company : "", o.invoice?.wanted ? o.invoice.nip : "",
          o.shipping?.city, ship(o.shipping?.method), o.shipping?.point?.code, pay(o.payment?.method), PAY_ST[o.payment?.status ?? ""] ?? o.payment?.status,
          (o.items ?? []).reduce((s, i) => s + Number(i.quantity ?? 0), 0), plNum(o.subtotal), plNum(o.shipping?.price), plNum(o.total), o.baselinker?.orderId,
        ]);
      } else if (kind === "products") {
        if (!(await hasRole(req, "editor", "orders"))) return deny();
        const { docs } = await req.payload.find({ collection: "products", depth: 1, limit: 0, pagination: false, overrideAccess: true, sort: "name" });
        rows = [["Nazwa", "SKU", "EAN", "Marka", "Kategoria", "Cena (zł)", "Cena promocyjna", "Cena B2B", "VAT %", "Stan", "Widoczność", "ID BaseLinker", "Adres w sklepie"]];
        for (const p of docs) rows.push([
          p.name, p.sku, p.ean, p.brand, typeof p.category === "object" ? p.category?.name : "", plNum(p.price), plNum(p.sale?.price), plNum(p.priceB2B), p.vatRate, p.stock,
          ({ active: "widoczny", hidden: "ukryty", archived: "wycofany" } as Record<string, string>)[p.status ?? ""] ?? p.status, p.baselinkerId, p.slug ? `/produkt/${p.slug}` : "",
        ]);
      } else if (kind === "customers") {
        if (!(await hasRole(req, "orders"))) return deny();
        const { docs } = await req.payload.find({ collection: "customers", depth: 0, limit: 0, pagination: false, overrideAccess: true, sort: "-createdAt", where: since as never });
        rows = [["E-mail", "Imię", "Nazwisko", "Telefon", "Typ konta", "Firma", "NIP", "Status B2B", "Newsletter", "Założone"]];
        for (const c of docs) rows.push([
          c.email, c.firstName, c.lastName, c.phone, c.accountType === "business" ? "firma" : "indywidualny", c.b2b?.company, c.b2b?.nip, c.accountType === "business" ? B2B_ST[c.b2b?.status ?? ""] ?? "" : "", c.consents?.newsletter ? "tak" : "nie", plDate(c.createdAt),
        ]);
      } else {
        return Response.json({ ok: false, message: "Nieznany eksport" }, { status: 404 });
      }
      const name = `${({ orders: "zamowienia", products: "produkty", customers: "klienci" } as Record<string, string>)[kind]}-${new Date().toISOString().slice(0, 10)}.csv`;
      return new Response(csv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` } });
    },
  },
  {
    path: "/order-tools/:id/print",
    method: "get",
    handler: async (req) => {
      if (!(await hasRole(req, "orders"))) return deny();
      const o = await req.payload.findByID({ collection: "orders", id: idOf(req), depth: 0, overrideAccess: true });
      const store = await req.payload.findGlobal({ slug: "store-settings", overrideAccess: true });
      const html = printPage(`Zamówienie ${o.orderNumber}`, [printSection(o, store)]);
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    },
  },
  {
    path: "/order-tools/:id/resend",
    method: "post",
    handler: async (req) => {
      if (!(await hasRole(req, "orders"))) return deny();
      if (!mailConfig()) return Response.json({ ok: false, message: "Poczta nie jest skonfigurowana (Integracje → Poczta)." });
      const o = await req.payload.findByID({ collection: "orders", id: idOf(req), depth: 0, overrideAccess: true });
      const store = await req.payload.findGlobal({ slug: "store-settings", overrideAccess: true });
      const built = T.orderPlaced(o, {
        shop: store as T.Shop,
        shipLabel: store.shippingMethods?.find((m) => m.code === o.shipping?.method)?.label,
        payLabel: store.paymentMethods?.find((m) => m.code === o.payment?.method)?.label,
        bank: mailConfig()?.bank ?? "",
      });
      const r = await sendMail(req.payload, { to: o.email, ...built, order: o.id });
      return Response.json(r.ok ? { ok: true, message: `Wysłano ponownie na ${o.email}` } : { ok: false, message: r.message });
    },
  },
  {
    // Zmiana statusu bez zapisu całego formularza (ten przy Postgresie potrafił zawiesić panel)
    path: "/order-tools/:id/status",
    method: "post",
    handler: async (req) => {
      if (!(await hasRole(req, "orders"))) return deny();
      const body = ((await req.json?.().catch(() => ({}))) ?? {}) as { status?: string };
      const status = String(body.status ?? "");
      if (!ORDER_ST[status]) return Response.json({ ok: false, message: "Nieznany status" }, { status: 400 });
      try {
        const updated = await req.payload.update({
          collection: "orders", id: idOf(req), req, overrideAccess: true, data: { status: status as "new" },
        });
        return Response.json({ ok: true, message: `Status: ${ORDER_ST[updated.status ?? status] ?? status}` });
      } catch (e) {
        const err = e as { message?: string; data?: { errors?: { message?: string }[] } };
        const field = err.data?.errors?.map((x) => x.message).filter(Boolean).slice(0, 2).join(", ");
        return Response.json({ ok: false, message: (field || err.message || "Nie udało się zapisać").slice(0, 220) }, { status: 400 });
      }
    },
  },
  {
    path: "/order-tools/:id/delete",
    method: "post",
    handler: async (req) => {
      if (!(await hasRole(req, "orders"))) return deny();
      const id = idOf(req);
      try {
        const order = await req.payload.findByID({ collection: "orders", id, depth: 0, overrideAccess: true });
        if (order.status !== "cancelled") {
          await req.payload.update({
            collection: "orders", id, req, overrideAccess: true, context: { skipMail: true }, data: { status: "cancelled" },
          });
        }
        await req.payload.delete({ collection: "orders", id, req, overrideAccess: true });
        return Response.json({ ok: true, message: `Usunięto zamówienie ${order.orderNumber}` });
      } catch (e) {
        const err = e as { message?: string };
        return Response.json({ ok: false, message: (err.message || "Nie udało się usunąć").slice(0, 220) }, { status: 400 });
      }
    },
  },
  {
    path: "/product-tools/:id/stats",
    method: "get",
    handler: async (req) => {
      if (!(await hasRole(req, "editor", "orders"))) return deny();
      const id = idOf(req);
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const [orders, waiting] = await Promise.all([
        req.payload.find({
          collection: "orders", depth: 0, limit: 500, overrideAccess: true, pagination: false,
          where: { and: [{ "items.product": { equals: id } }, { createdAt: { greater_than: since } }, { status: { not_equals: "cancelled" } }] },
          select: { items: true },
        }),
        req.payload.count({ collection: "stock-alerts", overrideAccess: true, where: { and: [{ product: { equals: id } }, { status: { in: ["waiting", "ready"] } }] } }),
      ]);
      let qty = 0, revenue = 0;
      for (const o of orders.docs) for (const i of o.items ?? []) {
        const pid = typeof i.product === "object" ? i.product?.id : i.product;
        if (String(pid) !== id) continue;
        qty += Number(i.quantity ?? 0);
        revenue += Number(i.quantity ?? 0) * Number(i.priceGross ?? 0);
      }
      return Response.json({ ok: true, orders: orders.docs.length, qty, revenue, waiting: waiting.totalDocs });
    },
  },
  {
    path: "/return-tools/:id/refund",
    method: "post",
    handler: async (req) => {
      if (!(await hasRole(req, "orders"))) return deny();
      const ret = await req.payload.findByID({ collection: "returns", id: idOf(req), depth: 0, overrideAccess: true }).catch(() => null);
      if (!ret) return Response.json({ ok: false, message: "Nie ma takiego zgłoszenia." });
      if (ret.status === "refunded") return Response.json({ ok: true, message: "Zwrot był już oznaczony jako wykonany." });
      const orderId = typeof ret.order === "object" && ret.order ? ret.order.id : ret.order;
      const order = orderId
        ? await req.payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true }).catch(() => null)
        : (await req.payload.find({ collection: "orders", where: { orderNumber: { equals: ret.orderNumber } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
      if (!order) return Response.json({ ok: false, message: "Nie znalazłem zamówienia powiązanego z tym zgłoszeniem." });
      if (order.payment?.status === "refunded") {
        await req.payload.update({ collection: "returns", id: ret.id, overrideAccess: true, data: { status: "refunded" } });
        return Response.json({ ok: true, message: "Płatność była już zwrócona. Zgłoszenie oznaczone jako zwrot wykonany." });
      }
      if (ret.type === "complaint" && ret.resolution && ret.resolution !== "refund") {
        return Response.json({ ok: false, message: "To zgłoszenie nie jest zwrotem pieniędzy. Oznacz je bez wysyłania przelewu." });
      }
      if (order.payment?.provider !== "przelewy24" || !order.payment.sessionId) {
        return Response.json({ ok: false, message: "To zamówienie nie było płatne online. Zwróć przelewem na konto z zgłoszenia i kliknij „Oznacz jako zwrócone (bez Przelewy24)”." });
      }
      const full = Math.round(Number(order.total ?? 0) * 100);
      const body = ((await req.json?.().catch(() => ({}))) ?? {}) as { amount?: number | string };
      let amount = full;
      if (body.amount != null && String(body.amount).trim() !== "") {
        const asked = Math.round(Number(String(body.amount).replace(",", ".")) * 100);
        if (!Number.isFinite(asked) || asked <= 0) return Response.json({ ok: false, message: "Podaj kwotę większą od zera." });
        if (asked > full) return Response.json({ ok: false, message: "Kwota jest większa niż wartość zamówienia." });
        amount = asked;
      }
      if (amount <= 0) return Response.json({ ok: false, message: "Zamówienie ma kwotę 0 zł – nie ma czego zwracać." });
      let p24OrderId = Number(order.payment.transactionId);
      if (!p24OrderId) {
        const tx = await getP24Transaction(order.payment.sessionId);
        p24OrderId = tx?.orderId ?? 0;
        if (tx?.status === 3) {
          await req.payload.update({ collection: "orders", id: order.id, overrideAccess: true, data: { payment: { ...order.payment, status: "refunded", transactionId: String(p24OrderId || order.payment.transactionId || "") } } });
          await req.payload.update({ collection: "returns", id: ret.id, overrideAccess: true, data: { status: "refunded" } });
          return Response.json({ ok: true, message: "Przelewy24 ma już ten zwrot. Oznaczyłem zamówienie i zgłoszenie." });
        }
      }
      if (!p24OrderId) return Response.json({ ok: false, message: "Brak numeru transakcji Przelewy24. Zwrot trzeba zrobić w panelu P24." });
      const result = await refundP24({
        sessionId: order.payment.sessionId,
        orderId: p24OrderId,
        amountGrosze: amount,
        description: `Zwrot ${ret.number || order.orderNumber}`,
      });
      if (!result.ok) return Response.json(result);
      const partial = amount < full;
      if (!partial) await req.payload.update({ collection: "orders", id: order.id, overrideAccess: true, data: { payment: { ...order.payment, status: "refunded", transactionId: String(p24OrderId) } } });
      if (!partial) await req.payload.update({ collection: "returns", id: ret.id, overrideAccess: true, data: { status: "refunded" } });
      const who = req.user && "email" in req.user ? String(req.user.email) : "panel";
      const zl = (amount / 100).toFixed(2).replace(".", ",");
      await addHistory(req.payload, order.id, partial
        ? `Częściowy zwrot ${zl} zł przez Przelewy24 (zostało ${((full - amount) / 100).toFixed(2).replace(".", ",")} zł)`
        : `Zwrot ${zl} zł przez Przelewy24 (${ret.number || "zgłoszenie"})`, who);
      const test = p24Mode() === "mock" ? " Tryb testowy – pieniądze nie wyszły." : "";
      const left = partial ? ` Zostało ${((full - amount) / 100).toFixed(2).replace(".", ",")} zł. Zgłoszenie zostaje otwarte.` : "";
      return Response.json({ ok: true, message: `${result.message} Kwota: ${zl} zł.${left}${test}` });
    },
  },
  {
    path: "/product-tools/:id/refresh",
    method: "post",
    handler: async (req) => {
      if (!(await hasRole(req, "editor", "orders"))) return deny();
      if (!blActive()) return Response.json({ ok: false, message: "Moduł BaseLinker jest wyłączony albo nieskonfigurowany." });
      const p = await req.payload.findByID({ collection: "products", id: idOf(req), depth: 0, overrideAccess: true });
      if (!p.baselinkerId) return Response.json({ ok: false, message: "Produkt nie jest powiązany z BaseLinkerem." });
      try {
        const offer = await fetchOffer(req.payload, Number(p.baselinkerId));
        if (!offer) return Response.json({ ok: false, message: "BaseLinker nie zwrócił tego produktu w żadnym katalogu." });
        const { data: d, catalog, settings: s } = offer;
        const warehouse = s.warehouseId as string | undefined;
        const stock = warehouse ? Number(d.stock?.[warehouse] ?? 0) : Object.values(d.stock ?? {}).reduce((a, b) => a + Number(b), 0);
        const priceRaw = s.priceGroupId ? d.prices?.[String(s.priceGroupId)] : Object.values(d.prices ?? {})[0];
        const data: { stock: number; price?: number; lastSyncedAt: string } = { stock: Math.max(0, stock), lastSyncedAt: new Date().toISOString() };
        if (priceRaw != null && !p.keep?.price) data.price = Number(priceRaw);
        await req.payload.update({ collection: "products", id: p.id, overrideAccess: true, data });
        return Response.json({ ok: true, message: `Stan: ${data.stock} szt.${data.price != null ? `, cena: ${T.pln(data.price)}` : ""} (katalog ${catalog})` });
      } catch (e) {
        return Response.json({ ok: false, message: (e as Error).message });
      }
    },
  },
];
