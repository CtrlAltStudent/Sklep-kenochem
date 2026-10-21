// Składanie zamówienia po stronie serwera: ceny i stany z bazy (nie z koszyka w przeglądarce),
// punkt InPost/ORLEN, płatność Przelewy24, a potem zapis i (gdy włączone) BaseLinker.

import { z } from "zod";
import type { Payload } from "payload";
import { freeShippingFrom } from "@/lib/data";
import { carrierFromShipping, findPickupPoint } from "../pickup";
import { p24Mode, registerP24 } from "../przelewy24";
import type { Order } from "@/payload-types";
import { paymentAvailable, shippingAvailable } from "../availability";
import { BLIK_CODE, startBlik, type BlikClient } from "./blik";
import { orderPlacedMails } from "../mail/events";

const round2 = (n: number) => Math.round(n * 100) / 100;
const serverUrl = () => process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export const checkoutInput = z.object({
  name: z.string().trim().min(3, "Podaj imię i nazwisko").max(120),
  email: z.string().trim().toLowerCase().email("Podaj prawidłowy e-mail").max(150),
  phone: z.string().trim().min(9, "Podaj numer telefonu").max(20),
  street: z.string().trim().min(3, "Podaj ulicę i numer").max(120),
  postcode: z.string().trim().regex(/^\d{2}-?\d{3}$/, "Kod pocztowy: 00-000"),
  city: z.string().trim().min(2, "Podaj miejscowość").max(80),
  invoice: z.boolean().optional(),
  nip: z.string().trim().max(20).optional(),
  company: z.string().trim().max(120).optional(),
  ship: z.string().trim().min(1).max(40),
  pay: z.string().trim().min(1).max(40),
  point: z.string().trim().max(40).optional(),
  note: z.string().trim().max(500).optional(),
  coupon: z.string().trim().max(40).optional(),
  blikCode: z.string().trim().regex(BLIK_CODE, "Kod BLIK ma 6 cyfr").optional(),
  p24Terms: z.boolean().optional(),
  items: z.array(z.object({ slug: z.string().min(1), qty: z.number().int().positive().max(99) })).min(1).max(50),
});

export type CheckoutInput = z.infer<typeof checkoutInput>;

function salePrice(p: { price: number; sale?: { price?: number | null; from?: string | null; to?: string | null } | null }) {
  const at = Date.now();
  const s = p.sale;
  if (s?.price && s.price > 0 && (!s.from || new Date(s.from).getTime() <= at) && (!s.to || new Date(s.to).getTime() >= at)) return s.price;
  return p.price;
}

export async function placeOrder(payload: Payload, raw: CheckoutInput, client: BlikClient = { ip: "127.0.0.1", userAgent: "" }, customerId?: number) {
  const store = await payload.findGlobal({ slug: "store-settings", overrideAccess: true });
  const ships = (store.shippingMethods ?? []).filter(shippingAvailable);
  const pays = (store.paymentMethods ?? []).filter(paymentAvailable);
  const ship = ships.find((m) => m.code === raw.ship);
  if (!ship) return { ok: false as const, message: "Nieznana metoda dostawy. Odśwież stronę i wybierz ponownie." };

  const isCod = raw.ship.endsWith("-cod") || raw.pay === "cod";
  const pay = isCod ? pays.find((m) => m.provider === "cod" || m.code === "cod") : pays.find((m) => m.code === raw.pay);
  if (!pay) return { ok: false as const, message: "Nieznana metoda płatności." };
  if (isCod && !raw.ship.endsWith("-cod") && ship.price === 0 && ship.code !== "pickup") {
    return { ok: false as const, message: "Pobranie jest dostępne przy kurierze za pobraniem." };
  }

  const slugs = [...new Set(raw.items.map((i) => i.slug))];
  const { docs } = await payload.find({
    collection: "products",
    where: { and: [{ slug: { in: slugs } }, { status: { equals: "active" } }] },
    limit: slugs.length,
    depth: 0,
    overrideAccess: true,
  });
  const bySlug = new Map(docs.map((d) => [d.slug, d]));

  const lines: { product: number | string; name: string; sku?: string; ean?: string; quantity: number; priceGross: number; vatRate: number; variantLabel?: string }[] = [];
  for (const item of raw.items) {
    const p = bySlug.get(item.slug);
    if (!p) return { ok: false as const, message: `Produkt „${item.slug}” nie jest już dostępny.` };
    if ((p.stock ?? 0) < item.qty) return { ok: false as const, message: `Brak wystarczającego stanu: ${p.name} (dostępne: ${p.stock ?? 0} szt.).` };
    lines.push({
      product: p.id,
      name: p.name,
      sku: p.sku ?? undefined,
      ean: p.ean ?? undefined,
      quantity: item.qty,
      priceGross: salePrice(p),
      vatRate: p.vatRate ?? 23,
      variantLabel: p.unitLabel ?? undefined,
    });
  }

  const subtotal = round2(lines.reduce((s, l) => s + l.priceGross * l.quantity, 0));
  const freeFrom = freeShippingFrom(store);

  let coupon: { code: string; discount: number; freeShipping: boolean } | null = null;
  if (raw.coupon) {
    const c = (await payload.find({ collection: "coupons", where: { code: { equals: raw.coupon.toUpperCase().replace(/\s+/g, "") } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
    const now = Date.now();
    if (!c?.active) return { ok: false as const, message: "Nieprawidłowy kod rabatowy" };
    if (c.validFrom && new Date(c.validFrom).getTime() > now) return { ok: false as const, message: "Ten kod jeszcze nie obowiązuje" };
    if (c.validTo && new Date(c.validTo).getTime() < now) return { ok: false as const, message: "Kod wygasł" };
    if (c.usageLimit && (c.usedCount ?? 0) >= c.usageLimit) return { ok: false as const, message: "Limit użyć kodu został wyczerpany" };
    if (c.minOrder && subtotal < c.minOrder) return { ok: false as const, message: `Kod działa od ${c.minOrder.toFixed(2).replace(".", ",")} zł` };
    if (c.b2bOnly) return { ok: false as const, message: "Kod jest dostępny tylko dla klientów B2B" };
    const discount =
      c.type === "percent" ? round2(subtotal * (c.value ?? 0) / 100) :
      c.type === "amount" ? Math.min(subtotal, c.value ?? 0) : 0;
    coupon = { code: c.code, discount, freeShipping: c.type === "free_shipping" };
  }

  const shipFree = ship.price === 0 || coupon?.freeShipping || (ship.freeAboveThreshold !== false && subtotal >= freeFrom);
  const shipCost = shipFree ? 0 : ship.price;
  const discount = Math.min(coupon?.discount ?? 0, subtotal);
  const total = round2(Math.max(0, subtotal - discount) + shipCost);

  const postcode = raw.postcode.replace(/^(\d{2})(\d{3})$/, "$1-$2");
  let point: { code: string; name?: string; address?: string; postcode?: string; city?: string } | undefined;
  const carrier = carrierFromShipping(ship.code);
  if (ship.requiresPoint) {
    if (!raw.point?.trim()) return { ok: false as const, message: "Wybierz punkt odbioru (wpisz kod paczkomatu / ORLEN Paczki)." };
    const found = carrier ? await findPickupPoint(carrier, raw.point) : null;
    if (!found) return { ok: false as const, message: "Nie znaleziono punktu o tym kodzie. Sprawdź kod i spróbuj ponownie." };
    point = { code: found.code, name: found.name, address: found.address, postcode: found.postcode, city: found.city };
  }

  const online = pay.provider === "przelewy24";
  // BLIK z kodem na stronie: metoda o kodzie „blik” (obsługa Przelewy24) – bez przekierowania
  const isBlik = online && pay.code === "blik" && !isCod;
  if (isBlik) {
    if (!raw.blikCode) return { ok: false as const, message: "Wpisz 6-cyfrowy kod BLIK z aplikacji banku." };
    if (!raw.p24Terms) return { ok: false as const, message: "Zaakceptuj regulamin Przelewy24, aby zapłacić BLIKIEM." };
  }
  const mode = p24Mode();
  let payStatus: NonNullable<Order["payment"]>["status"] = isCod ? "deferred" : online ? "pending" : "pending";
  if (online && mode === "mock" && !isBlik) payStatus = "paid";
  if (isCod) payStatus = "deferred";

  const order = await payload.create({
    collection: "orders",
    overrideAccess: true,
    data: {
      customer: customerId, // zalogowany klient – zamówienie trafia do historii w koncie
      email: raw.email,
      phone: raw.phone.replace(/\s+/g, ""),
      items: lines,
      customerNote: [raw.note, coupon ? `Kod rabatowy ${coupon.code} (−${discount.toFixed(2)} zł)` : ""].filter(Boolean).join("\n").slice(0, 510) || undefined,
      shipping: {
        method: ship.code,
        price: shipCost,
        fullName: raw.name,
        company: raw.invoice ? raw.company : undefined,
        street: raw.street,
        postcode,
        city: raw.city,
        country: "PL",
        point,
      },
      invoice: raw.invoice
        ? { wanted: true, company: raw.company, nip: raw.nip, fullName: raw.name, street: raw.street, postcode, city: raw.city, country: "PL" }
        : { wanted: false },
      payment: {
        method: pay.code,
        status: payStatus,
        provider: online ? "przelewy24" : isCod ? "none" : "transfer",
        paidAt: payStatus === "paid" ? new Date().toISOString() : undefined,
      },
      status: payStatus === "paid" ? "paid" : payStatus === "deferred" ? "new" : "awaiting_payment",
    } as never,
  });

  // Maile: potwierdzenie dla klienta + powiadomienie dla sklepu (w tle, gdy Poczta jest skonfigurowana)
  orderPlacedMails(payload, order.id);

  if (coupon) {
    const c = (await payload.find({ collection: "coupons", where: { code: { equals: coupon.code } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
    if (c) await payload.update({ collection: "coupons", id: c.id, overrideAccess: true, data: { usedCount: (c.usedCount ?? 0) + 1 } });
  }

  if (isBlik) {
    const blik = await startBlik(payload, order, raw.blikCode!, client);
    return {
      ok: true as const,
      orderNumber: order.orderNumber as string,
      orderId: order.id,
      total: Number(order.total),
      paid: false,
      blik: { ok: blik.ok, sessionId: "sessionId" in blik ? blik.sessionId : undefined, message: blik.message },
      message: blik.message,
    };
  }

  let redirectUrl: string | undefined;
  if (online && mode !== "mock") {
    const sessionId = `SX-${order.id}-${Date.now()}`.slice(0, 100);
    const amountGrosze = Math.round(Number(order.total) * 100);
    try {
      const p24 = await registerP24({
        sessionId,
        amountGrosze,
        description: `Zamówienie ${order.orderNumber} – Sklep SONAX`,
        email: raw.email,
        urlReturn: `${serverUrl()}/zamowienie/powrot?sessionId=${encodeURIComponent(sessionId)}`,
        urlStatus: `${serverUrl()}/api/payments/p24/notify`,
      });
      await payload.update({
        collection: "orders",
        id: order.id,
        overrideAccess: true,
        context: { skipBaseLinker: true },
        data: { payment: { ...(order.payment ?? {}), method: pay.code, status: "pending", provider: "przelewy24", sessionId } } as never,
      });
      redirectUrl = p24.redirectUrl;
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : "Nie udało się rozpocząć płatności." };
    }
  }

  return {
    ok: true as const,
    orderNumber: order.orderNumber as string,
    orderId: order.id,
    total: Number(order.total),
    paid: order.payment?.status === "paid" || order.payment?.status === "deferred",
    redirectUrl,
    message: redirectUrl
      ? "Przekierowujemy do płatności Przelewy24."
      : order.payment?.status === "deferred"
        ? "Zamówienie przyjęte. Zapłacisz przy odbiorze."
        : pay.provider === "transfer"
          ? "Zamówienie przyjęte. Wyślemy je po zaksięgowaniu przelewu."
          : "Zamówienie opłacone i przyjęte.",
  };
}
