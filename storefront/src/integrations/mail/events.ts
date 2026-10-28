// Kiedy sklep wysyła maile:
//   złożenie zamówienia → klient („przyjęte”) + sklep („nowe zamówienie”)
//   zmiana statusu w sklepie: opłacone / wysłane (z numerem paczki z BaseLinkera) / anulowane → klient
//   formularze (kontakt, B2B, zwrot, opinia) → sklep + potwierdzenie dla klienta
//   produkt wrócił na stan → klienci z „Powiadom o dostępności”

import type { CollectionAfterChangeHook, Payload } from "payload";
import type { Order } from "@/payload-types";
import { blActive } from "../baselinker/client";
import { orderPackages, trackingUrl } from "../baselinker/shipping";
import { mailConfig, mailReady, sendLater, sendMail, type Mail } from "./send";
import * as T from "./templates";

// Miniatury produktów z zamówienia (pierwsze zdjęcie, pełny adres – maile otwierają się poza sklepem)
async function productImages(payload: Payload, o: Order) {
  const ids = [...new Set((o.items ?? []).map((i) => (typeof i.product === "object" && i.product ? i.product.id : i.product)).filter(Boolean))] as number[];
  if (!ids.length) return {};
  const { docs } = await payload.find({ collection: "products", where: { id: { in: ids } }, depth: 1, limit: ids.length, overrideAccess: true, select: { images: true } });
  const out: Record<string, string> = {};
  for (const p of docs) {
    const first = p.images?.[0];
    const media = typeof first?.media === "object" ? first.media : null;
    const url = media?.sizes?.thumb?.url || media?.url || first?.url;
    if (url) out[String(p.id)] = url.startsWith("http") ? url : `${T.siteUrl()}${url}`;
  }
  return out;
}

export async function orderContext(payload: Payload, o: Order) {
  const store = await payload.findGlobal({ slug: "store-settings", overrideAccess: true });
  return {
    images: await productImages(payload, o).catch(() => ({})),
    shop: store as T.Shop,
    shipLabel: store.shippingMethods?.find((m) => m.code === o.shipping?.method)?.label,
    payLabel: store.paymentMethods?.find((m) => m.code === o.payment?.method)?.label,
    bank: mailConfig()?.bank ?? "",
  };
}

const toCustomer = (o: Order, b: T.Built): Mail => ({ to: o.email, ...b, order: o.id });

export function orderPlacedMails(payload: Payload, orderId: number | string) {
  sendLater(payload, async () => {
    const o = await payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true });
    const c = await orderContext(payload, o);
    const notify = mailConfig()?.notify ?? [];
    return [toCustomer(o, T.orderPlaced(o, c)), ...(notify.length ? [{ to: notify, replyTo: o.email, ...T.shopNewOrder(o, c), order: o.id }] : [])];
  });
}

// Hook kolekcji Orders: mail przy zmianie statusu (także zmienionego ręcznie w panelu)
export const orderStatusMailHook: CollectionAfterChangeHook<Order> = ({ doc, previousDoc, operation, req, context: hookContext }) => {
  if (operation !== "update" || !previousDoc || doc.status === previousDoc.status || !mailReady()) return doc;
  const status = doc.status;
  if (status !== "paid" && status !== "shipped" && status !== "cancelled") return doc;
  // Płatność „przy odbiorze” nie zmienia się na „opłacone” – nie wysyłamy maila o płatności
  if (status === "paid" && previousDoc.payment?.status === "paid") return doc;

  sendLater(req.payload, async () => {
    const c = await orderContext(req.payload, doc);
    if (status === "paid") return toCustomer(doc, T.orderPaid(doc, c));
    if (status === "cancelled") return toCustomer(doc, T.orderCancelled(doc, c));
    let parcels: T.Parcel[] = [];
    // Numer przesłany przez BaseLinkera (integracja „Inny sklep”) – link do śledzenia po metodzie dostawy
    const tracking = typeof hookContext?.trackingNumber === "string" ? hookContext.trackingNumber : "";
    if (tracking) parcels = [{ number: tracking, courier: c.shipLabel ?? "Przesyłka", url: trackingUrl(doc.shipping?.method ?? "", tracking) }];
    else if (blActive() && doc.baselinker?.orderId) {
      try {
        parcels = (await orderPackages(doc.baselinker.orderId)).filter((p) => p.number).map((p) => ({ number: p.number, courier: p.courier, url: p.url }));
      } catch {
        parcels = [];
      }
    }
    return toCustomer(doc, T.orderShipped(doc, c, parcels));
  });
  return doc;
};

// Formularz ze strony → powiadomienie do sklepu (odpowiedź trafia do klienta) + potwierdzenie dla klienta
export function formMails(payload: Payload, f: { kind: "contact" | "b2b" | "return" | "review"; name?: string; email?: string; rows: [string, unknown][]; adminPath: string; receipt?: string }) {
  sendLater(payload, async () => {
    const store = await payload.findGlobal({ slug: "store-settings", overrideAccess: true });
    const shop = store as T.Shop;
    const titles = { contact: "Nowa wiadomość ze strony", b2b: "Nowy wniosek o konto hurtowe", return: "Nowe zgłoszenie zwrotu / reklamacji", review: "Nowa opinia do moderacji" };
    const notify = mailConfig()?.notify ?? [];
    const out: Mail[] = [];
    if (notify.length) out.push({ to: notify, replyTo: f.email, ...T.shopFormNotice(shop, `${titles[f.kind]}${f.name ? ` – ${f.name}` : ""}`, f.rows, f.adminPath) });
    if (f.receipt && f.email) out.push({ to: f.email, ...T.customerReceipt(shop, "Dziękujemy – otrzymaliśmy Twoje zgłoszenie", f.receipt) });
    return out;
  });
}

// Produkt wrócił na stan: maile do oczekujących, status „Powiadomiono” tylko po udanej wysyłce
export function backInStockMails(payload: Payload, productId: number | string) {
  setTimeout(async () => {
    try {
      if (!mailReady()) return;
      const product = await payload.findByID({ collection: "products", id: productId, depth: 0, overrideAccess: true });
      const store = await payload.findGlobal({ slug: "store-settings", overrideAccess: true });
      const { docs } = await payload.find({ collection: "stock-alerts", where: { and: [{ product: { equals: productId } }, { status: { equals: "ready" } }] }, limit: 200, depth: 0, overrideAccess: true });
      const built = T.backInStock(store as T.Shop, { name: product.name, slug: String(product.slug), price: product.price });
      for (const a of docs) {
        const r = await sendMail(payload, { to: a.email, ...built });
        if (r.ok) await payload.update({ collection: "stock-alerts", id: a.id, overrideAccess: true, data: { status: "notified" } });
      }
    } catch (e) {
      payload.logger.error({ err: e }, "Powiadomienia o dostępności");
    }
  }, 0);
}

// Zwrot / reklamacja: mail do klienta przy zmianie statusu (zaakceptowane, otrzymane, zwrócone, odrzucone, zamknięte)
export const returnStatusMailHook: CollectionAfterChangeHook = ({ doc, previousDoc, operation, req }) => {
  if (operation !== "update" || !previousDoc || doc.status === previousDoc.status || !doc.email || !T.returnStatusText(doc.status) || !mailReady()) return doc;
  sendLater(req.payload, async () => {
    const store = await req.payload.findGlobal({ slug: "store-settings", overrideAccess: true });
    return { to: doc.email, ...T.returnUpdate(store as T.Shop, doc, doc.status) };
  });
  return doc;
};

// Konto założone w sklepie → mail powitalny
export const welcomeMailHook: CollectionAfterChangeHook = ({ doc, operation, req }) => {
  if (operation !== "create" || !mailReady()) return doc;
  sendLater(req.payload, async () => {
    const store = await req.payload.findGlobal({ slug: "store-settings", overrideAccess: true });
    return { to: doc.email, ...T.welcome(store as T.Shop, doc.firstName) };
  });
  return doc;
};

// Mail testowy z panelu (Integracje → Poczta → Sprawdź połączenie)
export async function testMail(payload: Payload) {
  const c = mailConfig();
  if (!c) return { ok: false, message: "Uzupełnij serwer, login i hasło skrzynki." };
  const store = await payload.findGlobal({ slug: "store-settings", overrideAccess: true });
  const built = T.customerReceipt(store as T.Shop, "Test poczty sklepu", "Jeśli to czytasz, sklep poprawnie wysyła maile przez Twoją skrzynkę. Tak będą wyglądać wiadomości do klientów.");
  const r = await sendMail(payload, { to: c.notify, ...built }, { force: true });
  return r.ok ? { ok: true, message: `Mail testowy wysłany na ${c.notify.join(", ")} – sprawdź skrzynkę (także SPAM).` } : { ok: false, message: `Serwer poczty odrzucił połączenie: ${r.message}` };
}
