// Szablony maili sklepu: prosty układ tabelowy z wbudowanymi stylami (działa w Gmailu, Outlooku, na telefonie).
// Każdy mail ma też wersję tekstową – lepsza dostarczalność i czytelność w prostych programach.

import type { Order, StoreSetting } from "@/payload-types";

const RED = "#d32e2e";
const DARK = "#181c21";
const MUTED = "#66727c";
const BORDER = "#e5e7eb";

export const siteUrl = () => (process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000").replace(/\/$/, "");
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const pln = (n: unknown) => `${Number(n ?? 0).toFixed(2).replace(".", ",")} zł`;

export type Shop = Pick<StoreSetting, "storeName" | "phone" | "email" | "address" | "hours">;
export type Built = { subject: string; html: string; text: string };

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px"><tr><td style="background:${RED};border-radius:10px"><a href="${esc(href)}" style="display:inline-block;padding:13px 22px;color:#fff;font-weight:700;text-decoration:none;font-size:15px">${esc(label)}</a></td></tr></table>`;

// Wspólna ramka: logo, treść, stopka z danymi sklepu
export function layout(shop: Shop, title: string, body: string, preheader = "") {
  const contact = [shop.phone && `tel. ${esc(shop.phone)}`, shop.email && `<a href="mailto:${esc(shop.email)}" style="color:${MUTED}">${esc(shop.email)}</a>`, shop.hours && esc(shop.hours)].filter(Boolean).join(" · ");
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:${DARK}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid ${BORDER}">
<tr><td style="padding:22px 28px;border-bottom:3px solid ${RED}"><a href="${siteUrl()}"><img src="${siteUrl()}/sonax/logo.png" alt="${esc(shop.storeName || "Sklep SONAX")}" width="150" style="display:block;border:0;height:auto"></a></td></tr>
<tr><td style="padding:28px 28px 8px;font-size:15px;line-height:1.6">
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:${DARK}">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 28px 26px;font-size:12px;line-height:1.6;color:${MUTED};border-top:1px solid ${BORDER}">
<b style="color:${DARK}">${esc(shop.storeName || "Sklep SONAX")}</b> – KENOCHEM Kuczyński Sp. J.<br>${esc(shop.address || "").replace(/\n/g, ", ")}<br>${contact}
</td></tr></table></td></tr></table></body></html>`;
}

// ---------- Zamówienie ----------

const shipName = (code = "") =>
  code.includes("paczkomat") ? "Paczkomat InPost" : code.startsWith("inpost") ? "Kurier InPost" : code.startsWith("orlen") ? "ORLEN Paczka" : code.startsWith("gls") ? "Kurier GLS" : code === "pickup" ? "Odbiór osobisty" : code;

type Ctx = { shop: Shop; shipLabel?: string; payLabel?: string; bank?: string };

function itemsTable(o: Order) {
  const rows = (o.items ?? []).map((i) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid ${BORDER}">${esc(i.name)}${i.variantLabel ? `<br><span style="color:${MUTED};font-size:13px">${esc(i.variantLabel)}</span>` : ""}</td>
<td style="padding:10px 8px;border-bottom:1px solid ${BORDER};white-space:nowrap;color:${MUTED}">${Number(i.quantity)} ×</td>
<td align="right" style="padding:10px 0;border-bottom:1px solid ${BORDER};white-space:nowrap;font-weight:700">${pln(Number(i.priceGross) * Number(i.quantity))}</td></tr>`).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 6px;font-size:14px">${rows}
<tr><td colspan="2" style="padding:10px 0 2px;color:${MUTED}">Dostawa</td><td align="right" style="padding:10px 0 2px">${Number(o.shipping?.price) ? pln(o.shipping?.price) : "gratis"}</td></tr>
<tr><td colspan="2" style="padding:6px 0;font-size:16px;font-weight:700">Razem</td><td align="right" style="padding:6px 0;font-size:18px;font-weight:800;color:${RED}">${pln(o.total)}</td></tr></table>`;
}

function deliveryBox(o: Order, c: Ctx) {
  const s = o.shipping;
  const where = s?.point?.code
    ? `Punkt odbioru: <b>${esc(s.point.code)}</b>${s.point.address ? `<br>${esc(s.point.address)}, ${esc(s.point.postcode)} ${esc(s.point.city)}` : ""}`
    : s?.method === "pickup"
      ? "Odbiór osobisty w sklepie – damy znać, gdy paczka będzie gotowa."
      : `${esc(s?.fullName)}<br>${esc(s?.street)}<br>${esc(s?.postcode)} ${esc(s?.city)}`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;font-size:14px;background:#f9fafb;border-radius:12px"><tr>
<td style="padding:14px 16px;vertical-align:top;width:50%"><span style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:.06em">Dostawa</span><br><b>${esc(c.shipLabel || shipName(s?.method ?? ""))}</b><br>${where}</td>
<td style="padding:14px 16px;vertical-align:top"><span style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:.06em">Płatność</span><br><b>${esc(c.payLabel || o.payment?.method)}</b><br>${o.payment?.status === "paid" ? "opłacone" : o.payment?.status === "deferred" ? "przy odbiorze" : "czeka na wpłatę"}</td>
</tr></table>`;
}

const textItems = (o: Order) =>
  (o.items ?? []).map((i) => `- ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ""} × ${i.quantity} = ${pln(Number(i.priceGross) * Number(i.quantity))}`).join("\n") +
  `\nDostawa: ${Number(o.shipping?.price) ? pln(o.shipping?.price) : "gratis"}\nRazem: ${pln(o.total)}`;

export function orderPlaced(o: Order, c: Ctx): Built {
  const transfer = o.payment?.provider === "transfer";
  const waiting = o.payment?.status === "pending";
  const lead = o.payment?.status === "paid"
    ? "Dziękujemy za zakupy! Zamówienie jest opłacone – przygotowujemy je do wysyłki."
    : o.payment?.status === "deferred"
      ? "Dziękujemy za zakupy! Zapłacisz przy odbiorze. Przygotowujemy zamówienie do wysyłki."
      : transfer
        ? "Dziękujemy za zakupy! Wyślemy zamówienie, gdy wpłata pojawi się na naszym koncie."
        : "Dziękujemy za zakupy! Gdy tylko potwierdzimy płatność, przygotujemy zamówienie do wysyłki.";
  const bankBox = transfer && c.bank
    ? `<div style="margin:16px 0;padding:14px 16px;border:2px dashed ${RED};border-radius:12px;font-size:14px"><b>Dane do przelewu</b><br>${esc(c.bank)}<br>Kwota: <b>${pln(o.total)}</b><br>Tytuł: <b>${esc(o.orderNumber)}</b></div>`
    : "";
  return {
    subject: `Zamówienie ${o.orderNumber} przyjęte`,
    html: layout(c.shop, `Zamówienie ${o.orderNumber} przyjęte`, `<p style="margin:0">${lead}</p>${bankBox}${itemsTable(o)}${deliveryBox(o, c)}
<p style="margin:14px 0 0;color:${MUTED};font-size:13px">Masz pytanie? Odpowiedz na tego maila albo zadzwoń${c.shop.phone ? `: ${esc(c.shop.phone)}` : ""}.</p>`, lead),
    text: `Zamówienie ${o.orderNumber} przyjęte\n\n${lead}\n\n${transfer && c.bank ? `Dane do przelewu: ${c.bank}\nKwota: ${pln(o.total)}\nTytuł: ${o.orderNumber}\n\n` : ""}${textItems(o)}\n\nDostawa: ${c.shipLabel || shipName(o.shipping?.method ?? "")}${o.shipping?.point?.code ? ` – punkt ${o.shipping.point.code}` : ""}\nPłatność: ${c.payLabel || o.payment?.method}${waiting ? " (czeka na wpłatę)" : ""}`,
  };
}

export function orderPaid(o: Order, c: Ctx): Built {
  const lead = `Otrzymaliśmy płatność ${pln(o.total)} za zamówienie ${o.orderNumber}. Przygotowujemy paczkę do wysyłki – numer przesyłki wyślemy w osobnym mailu.`;
  return { subject: `Płatność za zamówienie ${o.orderNumber} przyjęta`, html: layout(c.shop, "Płatność przyjęta – dziękujemy!", `<p style="margin:0">${esc(lead)}</p>${itemsTable(o)}`, lead), text: `${lead}\n\n${textItems(o)}` };
}

export type Parcel = { number: string; courier: string; url: string };

export function orderShipped(o: Order, c: Ctx, parcels: Parcel[]): Built {
  const pickup = o.shipping?.method === "pickup";
  const lead = pickup ? `Zamówienie ${o.orderNumber} czeka na odbiór w naszym sklepie.` : `Zamówienie ${o.orderNumber} jest już w drodze!`;
  const list = parcels.map((p) => `<p style="margin:6px 0">${esc(p.courier)}: <b>${esc(p.number)}</b></p>${p.url ? button(p.url, "Śledź przesyłkę") : ""}`).join("");
  const point = o.shipping?.point?.code ? `<p style="margin:12px 0 0">Paczka trafi do punktu <b>${esc(o.shipping.point.code)}</b>${o.shipping.point.address ? ` – ${esc(o.shipping.point.address)}, ${esc(o.shipping.point.city)}` : ""}. Kod odbioru przyjdzie SMS-em od przewoźnika.</p>` : "";
  return {
    subject: pickup ? `Zamówienie ${o.orderNumber} gotowe do odbioru` : `Zamówienie ${o.orderNumber} wysłane`,
    html: layout(c.shop, pickup ? "Gotowe do odbioru" : "Twoja paczka jest w drodze", `<p style="margin:0">${esc(lead)}</p>${list}${point}${itemsTable(o)}`, lead),
    text: `${lead}\n\n${parcels.map((p) => `${p.courier}: ${p.number}${p.url ? ` – ${p.url}` : ""}`).join("\n")}\n\n${textItems(o)}`,
  };
}

export function orderCancelled(o: Order, c: Ctx): Built {
  const paid = o.payment?.status === "paid";
  const lead = `Zamówienie ${o.orderNumber} zostało anulowane.${paid ? " Wpłacone pieniądze zwrócimy tą samą metodą płatności – zwykle w ciągu kilku dni roboczych." : ""}`;
  return {
    subject: `Zamówienie ${o.orderNumber} anulowane`,
    html: layout(c.shop, "Zamówienie anulowane", `<p style="margin:0">${esc(lead)}</p><p style="margin:12px 0 0;color:${MUTED};font-size:13px">Jeśli to pomyłka albo masz pytania – odpowiedz na tego maila${c.shop.phone ? ` lub zadzwoń: ${esc(c.shop.phone)}` : ""}.</p>`, lead),
    text: `${lead}\n\nPytania? Odpowiedz na tego maila${c.shop.phone ? ` lub zadzwoń: ${c.shop.phone}` : ""}.`,
  };
}

// Powiadomienie dla sklepu o nowym zamówieniu
export function shopNewOrder(o: Order, c: Ctx): Built {
  const admin = `${siteUrl()}/admin/collections/orders/${o.id}`;
  const who = `${o.shipping?.fullName ?? ""}${o.invoice?.wanted && o.invoice.company ? ` (${o.invoice.company}, NIP ${o.invoice.nip})` : ""}`;
  return {
    subject: `Nowe zamówienie ${o.orderNumber} – ${pln(o.total)}`,
    html: layout(c.shop, `Nowe zamówienie ${o.orderNumber}`, `<p style="margin:0">${esc(who)} · <a href="mailto:${esc(o.email)}">${esc(o.email)}</a>${o.phone ? ` · ${esc(o.phone)}` : ""}</p>${itemsTable(o)}${deliveryBox(o, c)}${o.customerNote ? `<p style="margin:10px 0"><b>Uwagi klienta:</b><br>${esc(o.customerNote).replace(/\n/g, "<br>")}</p>` : ""}${button(admin, "Otwórz w panelu")}`),
    text: `Nowe zamówienie ${o.orderNumber}\n${who} · ${o.email} · ${o.phone ?? ""}\n\n${textItems(o)}\n\n${admin}`,
  };
}

// ---------- Formularze i dostępność ----------

export function shopFormNotice(shop: Shop, title: string, rows: [string, unknown][], adminPath: string): Built {
  const list = rows.filter(([, v]) => v != null && v !== "").map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:${MUTED};vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0">${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("");
  return {
    subject: title,
    html: layout(shop, title, `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">${list}</table>${button(`${siteUrl()}${adminPath}`, "Otwórz w panelu")}`),
    text: `${title}\n\n${rows.filter(([, v]) => v != null && v !== "").map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${siteUrl()}${adminPath}`,
  };
}

export function customerReceipt(shop: Shop, title: string, lead: string): Built {
  return { subject: title, html: layout(shop, title, `<p style="margin:0">${esc(lead)}</p>`, lead), text: `${title}\n\n${lead}` };
}

// ---------- Konta klientów ----------

export function passwordReset(shop: Shop, token: string, name?: string | null): Built {
  const url = `${siteUrl()}/konto/nowe-haslo?token=${encodeURIComponent(token)}`;
  const lead = `${name ? `${name}, o` : "O"}trzymaliśmy prośbę o ustawienie nowego hasła do konta w naszym sklepie. Link jest ważny przez godzinę.`;
  return {
    subject: "Ustaw nowe hasło do konta",
    html: layout(shop, "Ustaw nowe hasło", `<p style="margin:0">${esc(lead)}</p>${button(url, "Ustaw nowe hasło")}<p style="margin:8px 0 0;color:${MUTED};font-size:12px">Jeśli to nie Ty – zignoruj tę wiadomość, hasło się nie zmieni.</p>`, lead),
    text: `${lead}

${url}

Jeśli to nie Ty – zignoruj tę wiadomość.`,
  };
}

export function welcome(shop: Shop, name?: string | null): Built {
  const lead = `${name ? `${name}, w` : "W"}itamy w sklepie SONAX! Twoje konto jest gotowe – zobaczysz w nim historię zamówień i status przesyłek, a przy kolejnych zakupach dane wypełnią się same.`;
  return { subject: "Konto w sklepie SONAX założone", html: layout(shop, "Konto założone", `<p style="margin:0">${esc(lead)}</p>${button(`${siteUrl()}/konto`, "Przejdź do konta")}`, lead), text: `${lead}

${siteUrl()}/konto` };
}

export function claimOrders(shop: Shop, url: string, count: number): Built {
  const lead = `Znaleźliśmy ${count} ${count === 1 ? "zamówienie złożone" : "zamówienia złożone"} na ten adres e-mail przed założeniem konta. Kliknij, aby dodać je do historii w koncie.`;
  return { subject: "Dodaj wcześniejsze zamówienia do konta", html: layout(shop, "Wcześniejsze zamówienia", `<p style="margin:0">${esc(lead)}</p>${button(url, "Dodaj do konta")}<p style="margin:8px 0 0;color:${MUTED};font-size:12px">Link jest ważny 24 godziny.</p>`, lead), text: `${lead}

${url}` };
}

export function backInStock(shop: Shop, product: { name: string; slug: string; price?: number | null }): Built {
  const url = `${siteUrl()}/produkt/${product.slug}`;
  const lead = `Produkt, na który czekasz, jest znowu dostępny: ${product.name}${product.price ? ` – ${pln(product.price)}` : ""}.`;
  return {
    subject: `Znowu dostępny: ${product.name}`,
    html: layout(shop, "Produkt znowu dostępny", `<p style="margin:0">${esc(lead)}</p>${button(url, "Zobacz produkt")}<p style="margin:8px 0 0;color:${MUTED};font-size:12px">Ilość może być ograniczona. Wysłaliśmy to powiadomienie, bo zapisałeś(-aś) się na nie w naszym sklepie.</p>`, lead),
    text: `${lead}\n\n${url}`,
  };
}
