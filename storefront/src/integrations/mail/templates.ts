// Szablony maili sklepu: prosty układ tabelowy z wbudowanymi stylami (działa w Gmailu, Outlooku, na telefonie).
// Treści domyślne i lista maili: catalog.ts. Właściciel zmienia je w panelu (Marketing → Maile do klientów) –
// zmiany leżą w schowku integrations.json, a ten plik składa z nich gotowy mail (HTML + wersja tekstowa).
// Tylko po stronie serwera.

import { AsyncLocalStorage } from "node:async_hooks";
import type { Order, StoreSetting } from "@/payload-types";
import { getMailSettings } from "../vault";
import { DEFAULT_FRAME, fill, htmlToText, mailDef, mailEnabled, type MailId, type MailSettings, type Vars } from "./catalog";

const DARK = "#181c21";
const MUTED = "#66727c";
const BORDER = "#e5e7eb";
const SOFT = "#f5f6f7";
const GREEN = "#15803d";

export const siteUrl = () => (process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000").replace(/\/$/, "");
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const pln = (n: unknown) => `${Number(n ?? 0).toFixed(2).replace(".", ",")} zł`;

export type Shop = Pick<StoreSetting, "storeName" | "phone" | "email" | "address" | "hours">;
// skip = mail wyłączony w konfiguratorze (sendMail go pominie)
export type Built = { subject: string; html: string; text: string; skip?: boolean };

// Podgląd w konfiguratorze: szablony liczone z niezapisanej wersji ustawień
const draft = new AsyncLocalStorage<MailSettings>();
export const withMailSettings = <R,>(s: MailSettings, fn: () => R) => draft.run(s, fn);
const settings = () => draft.getStore() ?? getMailSettings();
const accent = () => settings().brand.accent;

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 10px"><tr><td style="background:${accent()};border-radius:12px"><a href="${esc(href)}" style="display:inline-block;padding:14px 26px;color:#fff;font-weight:700;text-decoration:none;font-size:15px">${esc(label)} &rarr;</a></td></tr></table>`;

type Data = {
  vars?: Vars;
  blocks?: Record<string, string> | ((buttonLabel: string) => Record<string, string>);
  link?: string; // adres głównego przycisku ({{przycisk}})
  top?: string; // blok nad tytułem (pasek postępu)
  preheader?: string;
};

// Złożenie maila: treści z panelu (albo domyślne) → zmienne → ramka
function render(id: MailId, shop: Shop, d: Data): Built {
  const s = settings();
  const def = mailDef(id)!;
  const o = s.templates[id] ?? {};
  const b = s.brand;
  const vars: Vars = {
    sklep: shop.storeName || "Sklep SONAX", telefon: shop.phone, email_sklepu: shop.email, link_sklepu: siteUrl(),
    kolor: b.accent, kolor_naglowka: b.header, kolor_tla: b.background, ...d.vars,
  };
  const plain = (t: string) => fill(t, vars, {}, false).replace(/[ \t]+/g, " ").trim();
  const subject = plain(o.subject ?? def.subject).replace(/\s+/g, " ");
  const title = plain(o.title ?? def.title);
  const lead = plain(o.lead ?? def.lead);
  const label = plain(o.button ?? def.button ?? "");
  const blocks = {
    ...(d.link && label ? { przycisk: button(d.link, label) } : {}),
    ...(typeof d.blocks === "function" ? d.blocks(label) : d.blocks),
    wstep: esc(lead).replace(/\n/g, "<br>"),
  };
  const body = fill(o.body ?? def.body, vars, blocks);
  const contact = [
    shop.phone && `tel. <a href="tel:${esc(String(shop.phone).replace(/\s/g, ""))}" style="color:${MUTED};text-decoration:none">${esc(shop.phone)}</a>`,
    shop.email && `<a href="mailto:${esc(shop.email)}" style="color:${MUTED}">${esc(shop.email)}</a>`,
    shop.hours && esc(shop.hours),
  ].filter(Boolean).join(" &nbsp;·&nbsp; ");
  const frameVars: Vars = {
    ...vars, tytul: title, zajawka: d.preheader ?? lead, logo: b.logo || `${siteUrl()}/sonax/logo.png`, stopka: b.footer, atuty: b.perks,
    adres: String(shop.address ?? "").replace(/\n/g, ", "),
  };
  const html = fill(b.frame || DEFAULT_FRAME, frameVars, { tresc: body, postep: d.top ?? "", kontakt: contact });
  return { subject, html, text: `${title}\n\n${htmlToText(body)}`, skip: !mailEnabled(s, id) };
}

// ---------- Zamówienie ----------

const shipName = (code = "") =>
  code.includes("paczkomat") ? "Paczkomat InPost" : code.startsWith("inpost") ? "Kurier InPost" : code.startsWith("orlen") ? "ORLEN Paczka" : code.startsWith("gls") ? "Kurier GLS" : code === "pickup" ? "Odbiór osobisty" : code;

type Ctx = { shop: Shop; shipLabel?: string; payLabel?: string; bank?: string; images?: Record<string, string> };

// Pasek postępu: przyjęte → opłacone → wysłane (aktualny krok w kolorze sklepu)
const STEPS = ["Przyjęte", "Opłacone", "Wysłane", "U Ciebie"];
function progress(step: number) {
  const cells = STEPS.map((s, n) => {
    const done = n <= step;
    return `<td align="center" style="width:25%;padding:0 2px;font-size:11px;font-weight:700;color:${done ? DARK : "#9aa3ab"}">
<div style="height:6px;border-radius:3px;background:${n < step ? GREEN : n === step ? accent() : BORDER};margin-bottom:6px"></div>${done && n < step ? "&#10003; " : ""}${s}</td>`;
  }).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px"><tr>${cells}</tr></table>`;
}
const chip = (o: Order) => `<p style="margin:0 0 6px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${MUTED}">Zamówienie <b style="color:${DARK}">${esc(o.orderNumber)}</b> · ${new Date(o.createdAt).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}</p>`;
const productId = (p: unknown) => String(typeof p === "object" && p ? (p as { id: unknown }).id : p ?? "");

const thumb = (img?: string) =>
  img
    ? `<img src="${esc(img)}" alt="" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:contain;border-radius:10px;background:${SOFT};border:1px solid ${BORDER}">`
    : `<div style="width:64px;height:64px;border-radius:10px;background:${SOFT};border:1px solid ${BORDER}"></div>`;

type Line = { name: string; label?: string | null; qty: number; price: number; image?: string };
function linesTable(lines: Line[], totals: [string, string][], total: number) {
  const rows = lines.map((i) => `<tr>
<td style="padding:12px 12px 12px 0;border-bottom:1px solid ${BORDER};width:64px;vertical-align:top">${thumb(i.image)}</td>
<td style="padding:12px 8px 12px 0;border-bottom:1px solid ${BORDER};vertical-align:top;font-size:14px;line-height:1.4"><b>${esc(i.name)}</b>${i.label ? `<br><span style="color:${MUTED};font-size:12px">${esc(i.label)}</span>` : ""}<br><span style="color:${MUTED};font-size:12px">${i.qty} szt. × ${pln(i.price)}</span></td>
<td align="right" style="padding:12px 0;border-bottom:1px solid ${BORDER};white-space:nowrap;font-weight:700;vertical-align:top;font-size:14px">${pln(i.price * i.qty)}</td></tr>`).join("");
  const line = ([k, v]: [string, string]) => `<tr><td style="padding:3px 0;color:${MUTED};font-size:14px">${k}</td><td align="right" style="padding:3px 0;font-size:14px">${v}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0">${rows}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 6px;background:${SOFT};border-radius:12px"><tr><td style="padding:14px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${totals.map(line).join("")}
<tr><td style="padding:10px 0 0;border-top:1px solid ${BORDER};font-size:16px;font-weight:800">Razem</td><td align="right" style="padding:10px 0 0;border-top:1px solid ${BORDER};font-size:20px;font-weight:800;color:${accent()}">${pln(total)}</td></tr>
</table></td></tr></table>`;
}

function itemsTable(o: Order, c?: Ctx) {
  const lines = (o.items ?? []).map((i) => ({ name: i.name, label: i.variantLabel, qty: Number(i.quantity), price: Number(i.priceGross), image: c?.images?.[productId(i.product)] }));
  const subtotal = lines.reduce((n, i) => n + i.price * i.qty, 0);
  const ship = Number(o.shipping?.price) ? pln(o.shipping?.price) : `<span style="color:${GREEN};font-weight:700">gratis</span>`;
  return linesTable(lines, [["Produkty", pln(subtotal)], ["Dostawa", ship]], Number(o.total));
}

function deliveryBox(o: Order, c: Ctx) {
  const s = o.shipping;
  const where = s?.point?.code
    ? `Punkt odbioru: <b>${esc(s.point.code)}</b>${s.point.address ? `<br>${esc(s.point.address)}, ${esc(s.point.postcode)} ${esc(s.point.city)}` : ""}`
    : s?.method === "pickup"
      ? "Odbiór osobisty w sklepie – damy znać, gdy paczka będzie gotowa."
      : `${esc(s?.fullName)}<br>${esc(s?.street)}<br>${esc(s?.postcode)} ${esc(s?.city)}`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;font-size:14px;line-height:1.5;border:1px solid ${BORDER};border-radius:12px"><tr>
<td style="padding:14px 16px;vertical-align:top;width:50%;border-right:1px solid ${BORDER}"><span style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:.06em">Dostawa</span><br><b>${esc(c.shipLabel || shipName(s?.method ?? ""))}</b><br>${where}</td>
<td style="padding:14px 16px;vertical-align:top"><span style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:.06em">Płatność</span><br><b>${esc(c.payLabel || o.payment?.method)}</b><br>${o.payment?.status === "paid" ? "opłacone" : o.payment?.status === "deferred" ? "przy odbiorze" : "czeka na wpłatę"}</td>
</tr></table>`;
}

// Zmienne i bloki wspólne dla maili o zamówieniu
function orderData(o: Order, c: Ctx): { vars: Vars; blocks: Record<string, string> } {
  const pay = o.payment?.status;
  const transfer = o.payment?.provider === "transfer";
  return {
    vars: {
      numer: o.orderNumber, imie: (o.shipping?.fullName ?? "").split(" ")[0], kwota: pln(o.total),
      data: new Date(o.createdAt).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }),
      metoda_dostawy: c.shipLabel || shipName(o.shipping?.method ?? ""), metoda_platnosci: c.payLabel || o.payment?.method,
      oplacone: pay === "paid", pobranie: pay === "deferred", przelew: pay !== "paid" && pay !== "deferred" && transfer, czeka: pay !== "paid" && pay !== "deferred" && !transfer,
      konto: Boolean(o.customer), odbior_osobisty: o.shipping?.method === "pickup",
      punkt: o.shipping?.point?.code, adres_punktu: o.shipping?.point?.address ? `${o.shipping.point.address}, ${o.shipping.point.city ?? ""}`.trim() : "",
    },
    blocks: {
      naglowek_zamowienia: chip(o), produkty: itemsTable(o, c), dostawa_i_platnosc: deliveryBox(o, c),
      dane_do_przelewu: transfer && c.bank && pay !== "paid"
        ? `<div style="margin:16px 0;padding:14px 16px;border:2px dashed ${accent()};border-radius:12px;font-size:14px"><b>Dane do przelewu</b><br>${esc(c.bank)}<br>Kwota: <b>${pln(o.total)}</b><br>Tytuł: <b>${esc(o.orderNumber)}</b></div>`
        : "",
    },
  };
}

export function orderPlaced(o: Order, c: Ctx): Built {
  const d = orderData(o, c);
  return render("order-placed", c.shop, { ...d, link: o.customer ? `${siteUrl()}/konto` : siteUrl(), top: progress(o.payment?.status === "paid" ? 1 : 0) });
}

export function orderPaid(o: Order, c: Ctx): Built {
  return render("order-paid", c.shop, { ...orderData(o, c), top: progress(1) });
}

export type Parcel = { number: string; courier: string; url: string };

export function orderShipped(o: Order, c: Ctx, parcels: Parcel[]): Built {
  const d = orderData(o, c);
  const list = (label: string) => parcels.map((p) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 0;border:2px solid ${GREEN};border-radius:12px"><tr><td style="padding:14px 16px;font-size:14px"><span style="color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:.06em">Numer przesyłki</span><br><b style="font-size:17px">${esc(p.number)}</b><br>${esc(p.courier)}${p.url && label ? button(p.url, label) : ""}</td></tr></table>`).join("");
  return render("order-shipped", c.shop, { vars: d.vars, blocks: (label) => ({ ...d.blocks, paczki: list(label) }), top: progress(2) });
}

export function orderCancelled(o: Order, c: Ctx): Built {
  return render("order-cancelled", c.shop, orderData(o, c));
}

// Własna wiadomość do klienta wysłana z listy zamówień (akcja na wielu zamówieniach)
export function orderMessage(o: Order, c: Ctx, subject: string, message: string): Built {
  const d = orderData(o, c);
  return render("order-message", c.shop, {
    vars: { ...d.vars, temat: subject },
    blocks: { ...d.blocks, tresc_wiadomosci: `<div style="white-space:pre-line">${esc(message)}</div>` },
    preheader: message.slice(0, 120),
  });
}

// Powiadomienie dla sklepu o nowym zamówieniu
export function shopNewOrder(o: Order, c: Ctx): Built {
  const d = orderData(o, c);
  const who = `${o.shipping?.fullName ?? ""}${o.invoice?.wanted && o.invoice.company ? ` (${o.invoice.company}, NIP ${o.invoice.nip})` : ""}`;
  return render("shop-new-order", c.shop, {
    vars: { ...d.vars, klient: who, email: o.email, telefon_klienta: o.phone },
    blocks: { ...d.blocks, uwagi: o.customerNote ? esc(o.customerNote).replace(/\n/g, "<br>") : "" },
    link: `${siteUrl()}/admin/collections/orders/${o.id}`,
  });
}

// ---------- Automaty: prośba o opinię, porzucony koszyk ----------

export function reviewRequest(o: Order, c: Ctx, products: { name: string; slug: string; image?: string }[]): Built {
  const d = orderData(o, c);
  const list = (label: string) => products.map((p) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 0;border:1px solid ${BORDER};border-radius:12px"><tr>
<td style="padding:12px;width:64px;vertical-align:middle">${thumb(p.image)}</td>
<td style="padding:12px 8px;vertical-align:middle;font-size:14px;line-height:1.4"><b>${esc(p.name)}</b><br><span style="color:#f5a524;font-size:18px;letter-spacing:2px">&#9733;&#9733;&#9733;&#9733;&#9733;</span></td>
<td align="right" style="padding:12px;vertical-align:middle"><a href="${esc(`${siteUrl()}/produkt/${p.slug}#opinie`)}" style="display:inline-block;padding:10px 16px;border-radius:10px;background:${accent()};color:#fff;font-weight:700;font-size:13px;text-decoration:none;white-space:nowrap">${esc(label || "Oceń")}</a></td>
</tr></table>`).join("");
  return render("review-request", c.shop, { vars: d.vars, blocks: (label) => ({ produkty_do_oceny: list(label) }) });
}

export type CartMailLine = { name: string; label?: string; qty: number; price: number; image?: string };
const plural = (n: number, one: string, few: string, many: string) => (n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many);

export function cartReminder(shop: Shop, cart: { lines: CartMailLine[]; total: number; name?: string; restoreUrl: string; optOutUrl: string }): Built {
  const n = cart.lines.reduce((s, l) => s + l.qty, 0);
  const image = (u?: string) => (u && !u.startsWith("http") ? `${siteUrl()}${u}` : u);
  return render("cart-reminder", shop, {
    vars: { imie: cart.name, liczba: n, produktow: plural(n, "produkt", "produkty", "produktów"), kwota: pln(cart.total), link_koszyka: cart.restoreUrl, link_rezygnacji: cart.optOutUrl },
    blocks: { koszyk: linesTable(cart.lines.map((l) => ({ ...l, image: image(l.image) })), [], cart.total) },
    link: cart.restoreUrl,
  });
}

// ---------- Formularze i dostępność ----------

export function shopFormNotice(shop: Shop, title: string, rows: [string, unknown][], adminPath: string): Built {
  const list = rows.filter(([, v]) => v != null && v !== "").map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:${MUTED};vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0">${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("");
  return render("shop-form-notice", shop, {
    vars: { tytul_formularza: title },
    blocks: { dane: `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">${list}</table>` },
    link: `${siteUrl()}${adminPath}`,
  });
}

export function customerReceipt(shop: Shop, title: string, lead: string): Built {
  return render("form-receipt", shop, { vars: { tytul_formularza: title, tekst: lead } });
}

// ---------- Konta klientów ----------

export function passwordReset(shop: Shop, token: string, name?: string | null): Built {
  const url = `${siteUrl()}/konto/nowe-haslo?token=${encodeURIComponent(token)}`;
  return render("password-reset", shop, { vars: { imie: name, link: url }, link: url });
}

export function welcome(shop: Shop, name?: string | null): Built {
  return render("welcome", shop, { vars: { imie: name }, link: `${siteUrl()}/konto` });
}

export function claimOrders(shop: Shop, url: string, count: number): Built {
  return render("claim-orders", shop, { vars: { liczba: count, zamowien: count === 1 ? "zamówienie złożone" : "zamówienia złożone", link: url }, link: url });
}

export function accountDeleted(shop: Shop, name?: string | null): Built {
  return render("account-deleted", shop, { vars: { imie: name } });
}

// ---------- Odpowiedź na wiadomość z formularza (panel → Wiadomości) ----------

export function messageReply(shop: Shop, m: { name?: string | null; subject?: string | null; message?: string | null; product?: { name: string; slug: string } | null }, reply: string): Built {
  const quote = (m.message ?? "").slice(0, 2000);
  return render("message-reply", shop, {
    vars: { imie: m.name?.split(" ")[0], temat: m.subject || "Twoja wiadomość", produkt: m.product?.name, link_produktu: m.product ? `${siteUrl()}/produkt/${m.product.slug}` : "" },
    blocks: {
      odpowiedz: `<div style="white-space:pre-line">${esc(reply)}</div>`,
      cytat: quote ? `<div style="margin:22px 0 0;padding:12px 16px;border-left:3px solid ${BORDER};color:${MUTED};font-size:13px;white-space:pre-line"><b>Twoja wiadomość:</b>\n${esc(quote)}</div>` : "",
    },
    preheader: reply.slice(0, 120),
  });
}

// ---------- Zwroty, reklamacje, konta B2B ----------

const RETURN_STATUS: Record<string, [flag: string, label: string]> = {
  accepted: ["zaakceptowany", "zaakceptowany"],
  received: ["otrzymany", "towar otrzymany"],
  refunded: ["zwrocony", "pieniądze zwrócone"],
  rejected: ["odrzucony", "nieuwzględniony"],
  closed: ["zamkniety", "zamknięty"],
};
// Czy przy tym statusie wysyłamy mail do klienta
export const returnStatusText = (s: string) => (RETURN_STATUS[s] ? RETURN_STATUS[s][1] : "");

export function returnUpdate(shop: Shop, r: { number?: string | null; type?: string | null; orderNumber?: string | null }, status: string): Built {
  const [flag, label] = RETURN_STATUS[status] ?? ["", status];
  return render("return-update", shop, { vars: { rodzaj: r.type === "complaint" ? "Reklamacja" : "Zwrot", numer: r.number, status: label, zamowienie: r.orderNumber, [flag]: true } });
}

export function b2bDecision(shop: Shop, approved: boolean, company?: string | null): Built {
  return render("b2b-decision", shop, { vars: { zatwierdzone: approved, firma: company }, link: `${siteUrl()}/konto` });
}

export function backInStock(shop: Shop, product: { name: string; slug: string; price?: number | null }): Built {
  const url = `${siteUrl()}/produkt/${product.slug}`;
  return render("back-in-stock", shop, { vars: { produkt: product.name, cena: product.price ? pln(product.price) : "", link: url }, link: url });
}
