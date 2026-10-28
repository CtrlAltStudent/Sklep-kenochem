// Akcje na wielu zamówieniach (lista zamówień → zaznacz → pasek akcji, OrderBulkBar.tsx) i wyszukiwanie po wszystkim.
//   POST /api/order-bulk                 { ids, action: "status", status } | { ids, action: "mail", mail: "resend" | "review" | "custom", subject?, message? }
//   GET  /api/order-bulk/print?ids=1,2   – zamówienia do druku, każde na osobnej stronie
//   GET  /api/order-bulk/search?q=…      – numer, e-mail, telefon, nazwisko, firma, NIP, punkt, ID BaseLinkera, numer przesyłki
// Eksport zaznaczonych: /api/export/orders?ids=1,2 (adminTools.ts). Tylko obsługa zamówień.

import type { Endpoint, Payload, PayloadRequest, Where } from "payload";
import type { Order } from "@/payload-types";
import { hasRole } from "@/payload/access";
import { orderContext } from "./mail/events";
import { reviewProducts } from "./mail/automations";
import { mailConfig, sendMail } from "./mail/send";
import * as T from "./mail/templates";

const STATUSES = ["new", "awaiting_payment", "paid", "processing", "shipped", "cancelled"] as const;
const deny = () => Response.json({ ok: false, message: "Brak uprawnień" }, { status: 403 });
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
export const parseIds = (v: unknown) => [...new Set((Array.isArray(v) ? v : String(v ?? "").split(",")).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 200);

async function body(req: PayloadRequest) {
  try {
    return ((await req.json?.()) ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// Jedno zamówienie do druku (lista do kompletacji z polem ✓)
export function printSection(o: Order, store: { storeName?: string | null; shippingMethods?: { code: string; label: string }[] | null; paymentMethods?: { code: string; label: string }[] | null }) {
  const ship = store.shippingMethods?.find((m) => m.code === o.shipping?.method)?.label ?? o.shipping?.method;
  const pay = store.paymentMethods?.find((m) => m.code === o.payment?.method)?.label ?? o.payment?.method;
  const s = o.shipping;
  const rows = (o.items ?? []).map((i, n) => `<tr><td>${n + 1}</td><td><b>${esc(i.name)}</b>${i.variantLabel ? `<br><small>${esc(i.variantLabel)}</small>` : ""}</td><td>${esc(i.sku)}</td><td>${esc(i.ean)}</td><td class="r">${i.quantity}</td><td class="r">${T.pln(i.priceGross)}</td><td class="r">${T.pln(Number(i.priceGross) * Number(i.quantity))}</td><td class="chk"></td></tr>`).join("");
  return `<section class="order"><h1>Zamówienie ${esc(o.orderNumber)}</h1><p>${new Date(o.createdAt).toLocaleString("pl-PL")} · ${esc(store.storeName || "Sklep SONAX")}</p>
<div class="grid">
<div class="box"><b>Klient</b>${esc(s?.fullName)}${s?.company ? `<br>${esc(s.company)}` : ""}<br>${esc(o.email)}<br>${esc(o.phone)}</div>
<div class="box"><b>Dostawa – ${esc(ship)}</b>${s?.point?.code ? `Punkt: <strong>${esc(s.point.code)}</strong><br>${esc(s.point.address)} ${esc(s.point.postcode)} ${esc(s.point.city)}` : `${esc(s?.street)}<br>${esc(s?.postcode)} ${esc(s?.city)}`}</div>
<div class="box"><b>Płatność</b>${esc(pay)}<br>${o.payment?.status === "paid" ? "opłacone" : o.payment?.status === "deferred" ? "przy odbiorze" : "czeka na wpłatę"}${o.invoice?.wanted ? `<br><br><b>Faktura</b>${esc(o.invoice.company)}<br>NIP ${esc(o.invoice.nip)}` : ""}</div>
</div>
<table><thead><tr><th>#</th><th>Produkt</th><th>SKU</th><th>EAN</th><th class="r">Ilość</th><th class="r">Cena</th><th class="r">Wartość</th><th class="chk">✓</th></tr></thead><tbody>${rows}</tbody>
<tfoot><tr><td colspan="6" class="r">Dostawa</td><td class="r">${T.pln(o.shipping?.price)}</td><td></td></tr><tr><td colspan="6" class="r"><b>Razem</b></td><td class="r"><b>${T.pln(o.total)}</b></td><td></td></tr></tfoot></table>
${o.customerNote ? `<p class="note"><b>Uwagi klienta:</b> ${esc(o.customerNote)}</p>` : ""}${o.adminNote ? `<p><b>Notatka wewnętrzna:</b> ${esc(o.adminNote)}</p>` : ""}</section>`;
}

export const printPage = (title: string, sections: string[]) => `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>body{font:13px/1.45 Arial,sans-serif;color:#111;margin:24px}h1{font-size:22px;margin:0}table{width:100%;border-collapse:collapse;margin:14px 0}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f3f3f3;font-size:11px;text-transform:uppercase}.r{text-align:right;white-space:nowrap}.chk{width:28px}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:14px}.box{border:1px solid #ccc;border-radius:6px;padding:10px}.box b{display:block;font-size:11px;text-transform:uppercase;color:#666;margin-bottom:4px}small{color:#666}.note{border:2px solid #d32e2e;padding:8px;border-radius:6px}.order+.order{break-before:page;margin-top:32px}@media print{body{margin:0}button{display:none}}</style></head>
<body><button onclick="print()" style="float:right;padding:8px 14px">Drukuj</button>${sections.join("\n")}
<script>setTimeout(()=>print(),300)</script></body></html>`;

// Wyszukiwanie zamówień po wszystkim, także po numerze przesyłki (zapisanym w historii zamówienia)
export async function searchOrders(payload: Payload, q: string, limit = 10) {
  const t = q.trim();
  if (t.length < 2) return [];
  const digits = t.replace(/[\s-]/g, "");
  const or: Where[] = [
    { orderNumber: { like: t } }, { email: { like: t } }, { "shipping.fullName": { like: t } }, { "shipping.company": { like: t } },
    { "invoice.company": { like: t } }, { "invoice.nip": { like: digits } }, { "shipping.point.code": { like: t } }, { "shipping.city": { like: t } },
  ];
  if (/^\+?\d[\d\s-]{4,}$/.test(t)) or.push({ phone: { like: digits.replace(/^\+?48/, "") } });
  if (/^\d+$/.test(digits)) or.push({ "baselinker.orderId": { equals: Number(digits) } });
  // Numer przesyłki: wpis historii „Numer przesyłki z BaseLinkera: …”
  if (digits.length >= 8) {
    const logs = await payload.find({ collection: "integration-logs", where: { and: [{ type: { equals: "history" } }, { message: { contains: digits } }] }, limit: 20, depth: 0, overrideAccess: true, select: { order: true } });
    const ids = logs.docs.map((l) => (typeof l.order === "object" && l.order ? l.order.id : l.order)).filter(Boolean) as number[];
    if (ids.length) or.push({ id: { in: ids } });
  }
  const { docs } = await payload.find({ collection: "orders", where: { or }, limit, depth: 0, sort: "-createdAt", overrideAccess: true,
    select: { orderNumber: true, email: true, total: true, status: true, shipping: true, createdAt: true } });
  return docs.map((o) => ({ id: o.id, number: o.orderNumber, email: o.email, total: o.total, status: o.status, name: o.shipping?.fullName ?? "" }));
}

export const orderBulkEndpoints: Endpoint[] = [
  {
    path: "/order-bulk",
    method: "post",
    handler: async (req) => {
      if (!hasRole(req, "orders")) return deny();
      const b = await body(req);
      const ids = parseIds(b.ids);
      if (!ids.length) return Response.json({ ok: false, message: "Zaznacz zamówienia" }, { status: 400 });

      if (b.action === "status") {
        const status = String(b.status);
        if (!STATUSES.includes(status as (typeof STATUSES)[number])) return Response.json({ ok: false, message: "Nieznany status" }, { status: 400 });
        let done = 0;
        for (const id of ids) {
          // przez req – historia zapisze pracownika; hooki wyślą maile i zaktualizują BaseLinkera jak przy zmianie ręcznej
          const r = await req.payload.update({ collection: "orders", id, req, overrideAccess: true, data: { status: status as Order["status"] } }).catch(() => null);
          if (r) done++;
        }
        return Response.json({ ok: done > 0, message: `Zmieniono status: ${done} z ${ids.length}` });
      }

      if (b.action === "mail") {
        if (!mailConfig()) return Response.json({ ok: false, message: "Poczta nie jest skonfigurowana (Integracje → Poczta)." });
        const kind = String(b.mail);
        const subject = String(b.subject ?? "").trim().slice(0, 150);
        const message = String(b.message ?? "").trim().slice(0, 5000);
        if (kind === "custom" && (!subject || !message)) return Response.json({ ok: false, message: "Wpisz temat i treść wiadomości" }, { status: 400 });
        let sent = 0;
        const errors: string[] = [];
        for (const id of ids) {
          const o = await req.payload.findByID({ collection: "orders", id, depth: 0, overrideAccess: true }).catch(() => null);
          if (!o?.email || o.email.endsWith(".invalid")) continue;
          const c = await orderContext(req.payload, o);
          let built: T.Built | null = null;
          if (kind === "resend") built = T.orderPlaced(o, c);
          else if (kind === "review") {
            const products = await reviewProducts(req.payload, o);
            if (products.length) built = T.reviewRequest(o, c, products);
          } else if (kind === "custom") built = T.orderMessage(o, c, subject, message);
          if (!built) continue;
          // wysłane ręcznie przez pracownika – także gdy automat tego maila jest wyłączony
          const r = await sendMail(req.payload, { to: o.email, replyTo: c.shop.email || undefined, ...built, order: o.id }, { force: true });
          if (r.ok) sent++;
          else errors.push(`${o.orderNumber}: ${r.message}`);
        }
        return Response.json({ ok: sent > 0, message: `Wysłano: ${sent} z ${ids.length}${errors.length ? ` · błędy: ${errors.slice(0, 3).join("; ")}` : ""}` });
      }
      return Response.json({ ok: false, message: "Nieznana akcja" }, { status: 400 });
    },
  },
  {
    path: "/order-bulk/print",
    method: "get",
    handler: async (req) => {
      if (!hasRole(req, "orders")) return deny();
      const ids = parseIds(new URL(req.url ?? "http://x").searchParams.get("ids"));
      const [orders, store] = await Promise.all([
        req.payload.find({ collection: "orders", where: { id: { in: ids } }, limit: ids.length || 1, depth: 0, overrideAccess: true, sort: "createdAt" }),
        req.payload.findGlobal({ slug: "store-settings", overrideAccess: true }),
      ]);
      const html = printPage(`Zamówienia (${orders.docs.length})`, orders.docs.map((o) => printSection(o, store)));
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    },
  },
  {
    path: "/order-bulk/search",
    method: "get",
    handler: async (req) => {
      if (!hasRole(req, "orders")) return deny();
      const q = new URL(req.url ?? "http://x").searchParams.get("q") ?? "";
      return Response.json({ ok: true, docs: await searchOrders(req.payload, q.slice(0, 100)) });
    },
  },
];
