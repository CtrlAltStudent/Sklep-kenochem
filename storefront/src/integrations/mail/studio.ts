// Konfigurator maili w panelu (/admin/maile, MailStudio.tsx). Tylko administrator.
//   GET  /api/mail-studio          – zapisane ustawienia, ostatnie zamówienia do podglądu, adres do testu
//   POST /api/mail-studio          – zapis ustawień (schowek integrations.json, bez zmian w bazie)
//   POST /api/mail-studio/preview  – podgląd maila z niezapisanych ustawień na przykładowym zamówieniu
//   POST /api/mail-studio/test     – wysyłka testowa tego podglądu

import type { Endpoint, Payload, PayloadRequest } from "payload";
import type { Order } from "@/payload-types";
import { hasRole } from "@/payload/access";
import { getMailSettings, setMailSettings } from "../vault";
import { trackingUrl } from "../baselinker/shipping";
import { cleanMailSettings, mailDef, type MailId, type MailSettings } from "./catalog";
import { orderContext } from "./events";
import { reviewProducts } from "./automations";
import { mailConfig, mailReady, sendMail } from "./send";
import * as T from "./templates";

const deny = () => Response.json({ ok: false, message: "Tylko administrator może zmieniać maile" }, { status: 403 });
const body = async (req: PayloadRequest) => {
  try {
    return ((await req.json?.()) ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
};
const userEmail = (req: PayloadRequest) => (req.user as { email?: string } | null)?.email ?? "";

// Zamówienie pokazowe, gdy w sklepie nie ma jeszcze żadnego
const fakeOrder = (): Order => ({
  id: 0, orderNumber: "SX00042", status: "new", email: "jan.kowalski@example.com", phone: "+48 600 100 200", total: 112.97,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  items: [
    { name: "SONAX Xtreme Ceramic Spray Coating 750 ml", quantity: 1, priceGross: 79.99, variantLabel: "750 ml" },
    { name: "SONAX Szampon samochodowy 1 l", quantity: 2, priceGross: 16.49 },
  ],
  shipping: { method: "inpost-paczkomat", price: 0, fullName: "Jan Kowalski", point: { code: "BIA01M", address: "ul. Lipowa 10", postcode: "15-424", city: "Białystok" } },
  payment: { method: "blik", status: "paid", provider: "przelewy24" },
} as unknown as Order);

async function sampleOrder(payload: Payload, orderId?: unknown) {
  if (orderId) {
    const o = await payload.findByID({ collection: "orders", id: String(orderId), depth: 0, overrideAccess: true }).catch(() => null);
    if (o) return o;
  }
  const { docs } = await payload.find({ collection: "orders", sort: "-createdAt", limit: 1, depth: 0, overrideAccess: true });
  return docs[0] ?? fakeOrder();
}

// Mail zbudowany na przykładowych danych (prawdziwe zamówienie, jeśli jest)
async function sample(payload: Payload, id: MailId, orderId?: unknown): Promise<T.Built> {
  const store = await payload.findGlobal({ slug: "store-settings", overrideAccess: true });
  const shop = store as T.Shop;
  const o = await sampleOrder(payload, orderId);
  const c = await orderContext(payload, o);
  const name = (o.shipping?.fullName ?? "").split(" ")[0] || "Jan";
  const first = o.items?.[0];
  switch (id) {
    case "order-placed": return T.orderPlaced(o, c);
    case "order-paid": return T.orderPaid(o, c);
    case "order-shipped": {
      const number = "620111222333444555666777";
      return T.orderShipped(o, c, o.shipping?.method === "pickup" ? [] : [{ number, courier: c.shipLabel ?? "Kurier", url: trackingUrl(o.shipping?.method ?? "", number) }]);
    }
    case "order-cancelled": return T.orderCancelled(o, c);
    case "order-message": return T.orderMessage(o, c, "Informacja o zamówieniu", "Dzień dobry,\njeden z produktów będzie dostępny dopiero w przyszłym tygodniu. Czy wysłać resztę zamówienia od razu?\n\nPozdrawiamy");
    case "shop-new-order": return T.shopNewOrder(o, c);
    case "review-request": {
      const products = o.id ? await reviewProducts(payload, o) : [];
      return T.reviewRequest(o, c, products.length ? products : (o.items ?? []).map((i) => ({ name: i.name, slug: "" })));
    }
    case "cart-reminder":
      return T.cartReminder(shop, {
        lines: (o.items ?? []).map((i) => ({ name: i.name, label: i.variantLabel ?? undefined, qty: Number(i.quantity), price: Number(i.priceGross), image: (c.images as Record<string, string> | undefined)?.[String(typeof i.product === "object" && i.product ? i.product.id : i.product)] })),
        total: (o.items ?? []).reduce((n, i) => n + Number(i.quantity) * Number(i.priceGross), 0), name,
        restoreUrl: `${T.siteUrl()}/koszyk?przywroc=przyklad`, optOutUrl: `${T.siteUrl()}/koszyk`,
      });
    case "welcome": return T.welcome(shop, name);
    case "password-reset": return T.passwordReset(shop, "przyklad", name);
    case "claim-orders": return T.claimOrders(shop, `${T.siteUrl()}/konto`, 2);
    case "account-deleted": return T.accountDeleted(shop, name);
    case "message-reply":
      return T.messageReply(shop, { name: o.shipping?.fullName || "Jan Kowalski", subject: "Pytanie o produkt", message: "Dzień dobry, czy ten wosk nadaje się do matowego lakieru?", product: first ? { name: first.name, slug: "" } : null },
        "Dzień dobry,\ndo matowego lakieru polecamy serię SONAX Profiline Matt – zwykły wosk mógłby nabłyszczyć powierzchnię.\n\nPozdrawiamy");
    case "form-receipt": return T.customerReceipt(shop, "Dziękujemy – otrzymaliśmy Twoje zgłoszenie", "Odpowiemy najszybciej, jak to możliwe – zwykle w ciągu jednego dnia roboczego.");
    case "return-update": return T.returnUpdate(shop, { number: "ZW-0007", type: "return", orderNumber: o.orderNumber }, "accepted");
    case "back-in-stock": return T.backInStock(shop, { name: first?.name ?? "SONAX Wosk twardy", slug: "", price: first?.priceGross });
    case "b2b-decision": return T.b2bDecision(shop, true, "Myjnia Przykład Sp. z o.o.");
    case "shop-form-notice":
      return T.shopFormNotice(shop, "Nowa wiadomość ze strony – Jan Kowalski", [["Imię i nazwisko", "Jan Kowalski"], ["E-mail", "jan.kowalski@example.com"], ["Wiadomość", "Czy wysyłacie za granicę?"]], "/admin/collections/form-submissions");
  }
}

const draftOf = (b: Record<string, unknown>): MailSettings => (b.settings ? cleanMailSettings(b.settings) : getMailSettings());
const idOf = (b: Record<string, unknown>) => (mailDef(String(b.id)) ? (String(b.id) as MailId) : null);

export const mailStudioEndpoints: Endpoint[] = [
  {
    path: "/mail-studio",
    method: "get",
    handler: async (req) => {
      if (!hasRole(req, "admin")) return deny();
      const { docs } = await req.payload.find({ collection: "orders", sort: "-createdAt", limit: 15, depth: 0, overrideAccess: true, select: { orderNumber: true, status: true, total: true, email: true } });
      return Response.json({
        ok: true, settings: getMailSettings(), ready: mailReady(), configured: Boolean(mailConfig()), testTo: userEmail(req),
        orders: docs.map((o) => ({ id: o.id, number: o.orderNumber, status: o.status, total: o.total })),
      });
    },
  },
  {
    path: "/mail-studio",
    method: "post",
    handler: async (req) => {
      if (!hasRole(req, "admin")) return deny();
      const b = await body(req);
      try {
        setMailSettings(cleanMailSettings(b.settings), userEmail(req));
        return Response.json({ ok: true, message: "Zapisano – maile wychodzą już w nowej wersji", settings: getMailSettings() });
      } catch (e) {
        return Response.json({ ok: false, message: (e as Error).message }, { status: 500 });
      }
    },
  },
  {
    path: "/mail-studio/preview",
    method: "post",
    handler: async (req) => {
      if (!hasRole(req, "admin")) return deny();
      const b = await body(req);
      const id = idOf(b);
      if (!id) return Response.json({ ok: false, message: "Nieznany mail" }, { status: 400 });
      try {
        const built = await T.withMailSettings(draftOf(b), () => sample(req.payload, id, b.orderId));
        return Response.json({ ok: true, ...built });
      } catch (e) {
        return Response.json({ ok: false, message: `Nie udało się zbudować podglądu: ${(e as Error).message}` });
      }
    },
  },
  {
    path: "/mail-studio/test",
    method: "post",
    handler: async (req) => {
      if (!hasRole(req, "admin")) return deny();
      if (!mailConfig()) return Response.json({ ok: false, message: "Najpierw skonfiguruj pocztę: Integracje → Poczta (SMTP)." });
      const b = await body(req);
      const id = idOf(b);
      const to = String(b.to ?? "").trim() || userEmail(req);
      if (!id || !/^\S+@\S+\.\S+$/.test(to)) return Response.json({ ok: false, message: "Podaj poprawny adres e-mail" }, { status: 400 });
      const built = await T.withMailSettings(draftOf(b), () => sample(req.payload, id, b.orderId));
      const r = await sendMail(req.payload, { to, ...built, subject: `[TEST] ${built.subject}` }, { force: true });
      return Response.json(r.ok ? { ok: true, message: `Wysłano test na ${to} – sprawdź skrzynkę (także SPAM)` } : r);
    },
  },
];
