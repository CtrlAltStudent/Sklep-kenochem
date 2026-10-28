// Porzucone koszyki (kolekcja „carts”): zapis koszyka klienta, który przy zamówieniu zgodził się na przypomnienie.
// Przeglądarka wysyła koszyk po każdej zmianie (src/lib/store.ts → POST /api/cart), automat maili przypomina po X godzinach.
// Tylko po stronie serwera.

import type { Payload } from "payload";
import { getMailSettings } from "./vault";
import { mailEnabled } from "./mail/catalog";
import { priceAfterQtyDeal } from "@/lib/qtyDeal";
import type { QtyTier } from "@/lib/data";

export const cartRemindersOn = () => mailEnabled(getMailSettings(), "cart-reminder");
export const validToken = (t: unknown): t is string => typeof t === "string" && /^[\w-]{16,64}$/.test(t);

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// Pozycje jak w koszyku przeglądarki (CartLine) – tylko znane pola
function tiersOf(raw: unknown): QtyTier[] | undefined {
  if (!Array.isArray(raw)) return;
  const tiers = raw.slice(0, 4).flatMap((t) => {
    if (!t || typeof t !== "object") return [];
    const qty = num((t as { qty?: unknown }).qty);
    const percent = num((t as { percent?: unknown }).percent);
    const free = (t as { free?: unknown }).free === true;
    return qty >= 2 && (free || (percent >= 1 && percent <= 90)) ? [{ qty, percent: free ? 100 : percent, free }] : [];
  });
  return tiers.length ? tiers : undefined;
}

export function cleanLines(raw: unknown) {
  return (Array.isArray(raw) ? raw : []).slice(0, 50).map((l: Record<string, unknown>) => ({
    slug: str(l.slug, 200), variantId: str(l.variantId, 100), qty: Math.max(0, Math.min(999, Math.round(num(l.qty)))),
    name: str(l.name, 300), label: str(l.label, 120), price: Math.max(0, num(l.price)), image: str(l.image, 500) || undefined,
    category: str(l.category, 200), max: l.max == null ? undefined : num(l.max), sku: str(l.sku, 80) || undefined, brand: str(l.brand, 80) || undefined,
    qtyDeal: tiersOf(l.qtyDeal),
  })).filter((l) => l.slug && l.name && l.qty > 0);
}

const lineTotal = (l: { price: number; qty: number; qtyDeal?: QtyTier[] }) => priceAfterQtyDeal(l.price, l.qtyDeal, l.qty).total;

export async function saveCart(payload: Payload, input: { token: string; email: string; items: unknown; customer?: number }) {
  const items = cleanLines(input.items);
  const { docs } = await payload.find({ collection: "carts", where: { token: { equals: input.token } }, limit: 1, depth: 0, overrideAccess: true });
  let cur: (typeof docs)[number] | undefined = docs[0];
  // Koszyk po złożonym zamówieniu zostaje w historii – nowe zakupy zapisujemy jako nowy koszyk
  if (cur?.status === "recovered") {
    await payload.update({ collection: "carts", id: cur.id, overrideAccess: true, data: { token: `${cur.token}-z${cur.id}` } });
    cur = undefined;
  }
  if (!items.length) {
    if (cur) await payload.delete({ collection: "carts", id: cur.id, overrideAccess: true });
    return;
  }
  const data = {
    email: input.email, customer: input.customer ?? cur?.customer ?? undefined, items,
    total: Math.round(items.reduce((n, l) => n + lineTotal(l), 0) * 100) / 100,
    summary: items.map((l) => `${l.qty}× ${l.name}`).join(", ").slice(0, 500),
  };
  if (cur) await payload.update({ collection: "carts", id: cur.id, overrideAccess: true, data: data as never });
  else await payload.create({ collection: "carts", overrideAccess: true, data: { ...data, token: input.token, status: "open", consentAt: new Date().toISOString() } as never });
}

export async function removeCart(payload: Payload, token: string) {
  const { docs } = await payload.find({ collection: "carts", where: { and: [{ token: { equals: token } }, { status: { not_equals: "recovered" } }] }, limit: 1, depth: 0, overrideAccess: true });
  if (docs[0]) await payload.delete({ collection: "carts", id: docs[0].id, overrideAccess: true });
}

export async function loadCart(payload: Payload, token: string) {
  const { docs } = await payload.find({ collection: "carts", where: { token: { equals: token } }, limit: 1, depth: 0, overrideAccess: true });
  return docs[0] && docs[0].status !== "recovered" ? cleanLines(docs[0].items) : null;
}

// Po złożeniu zamówienia: koszyki z tym adresem oznaczamy jako „Zamówiony” (przypomnienie już nie wyjdzie)
export async function markCartsOrdered(payload: Payload, email: string, orderId: number) {
  try {
    const { docs } = await payload.find({ collection: "carts", where: { and: [{ email: { equals: email.toLowerCase() } }, { status: { not_equals: "recovered" } }] }, limit: 20, depth: 0, overrideAccess: true });
    for (const c of docs) await payload.update({ collection: "carts", id: c.id, overrideAccess: true, data: { status: "recovered", order: orderId } });
  } catch (e) {
    payload.logger.error({ err: e }, "Porzucone koszyki: oznaczenie zamówienia");
  }
}
