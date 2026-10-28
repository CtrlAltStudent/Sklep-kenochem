// Maile wysyłane automatycznie przez harmonogram (src/integrations/scheduler.ts, co 15 minut):
//   prośba o opinię   – X dni po zmianie statusu na „Wysłane” (raz na zamówienie, tylko zamówienia z ostatnich 2 tygodni okna)
//   porzucony koszyk  – X godzin po ostatniej zmianie koszyka, tylko za zgodą klienta, jedno przypomnienie
// Włączanie i liczba dni/godzin: panel → Marketing → Maile do klientów.

import type { Payload } from "payload";
import type { Order } from "@/payload-types";
import { getMailSettings, getMailState, markReviewSent } from "../vault";
import { mailEnabled } from "./catalog";
import { orderContext } from "./events";
import { mailReady, sendMail } from "./send";
import * as T from "./templates";
import { priceAfterQtyDeal } from "@/lib/qtyDeal";
import type { QtyTier } from "@/lib/data";

const DAY = 86_400_000;
const anonymous = (email?: string | null) => !email || email.endsWith(".invalid");

// Produkty z zamówienia do oceny: nazwa, adres, miniatura (bez powtórzeń, najwyżej 6)
export async function reviewProducts(payload: Payload, o: Order) {
  const ids = [...new Set((o.items ?? []).map((i) => (typeof i.product === "object" && i.product ? i.product.id : i.product)).filter(Boolean))] as number[];
  if (!ids.length) return [];
  const { docs } = await payload.find({ collection: "products", where: { id: { in: ids.slice(0, 6) } }, depth: 1, limit: 6, overrideAccess: true, select: { name: true, slug: true, images: true, status: true } });
  return docs.filter((p) => p.slug && p.status === "active").map((p) => {
    const first = p.images?.[0];
    const media = typeof first?.media === "object" ? first.media : null;
    const url = media?.sizes?.thumb?.url || media?.url || first?.url || "";
    return { name: p.name, slug: String(p.slug), image: url ? (url.startsWith("http") ? url : `${T.siteUrl()}${url}`) : undefined };
  });
}

async function reviewRequests(payload: Payload) {
  const s = getMailSettings();
  if (!mailEnabled(s, "review-request")) return 0;
  const now = Date.now();
  // Zmiana statusu na „Wysłane” zapisana w historii zamówienia (src/integrations/history.ts)
  const { docs: logs } = await payload.find({
    collection: "integration-logs",
    where: { and: [
      { type: { equals: "history" } }, { message: { contains: "→ Wysłane" } },
      { createdAt: { greater_than: new Date(now - (s.review.days + 14) * DAY).toISOString() } },
      { createdAt: { less_than: new Date(now - s.review.days * DAY).toISOString() } },
    ] },
    limit: 300, depth: 0, overrideAccess: true, select: { order: true },
  });
  const sent = getMailState().reviews ?? {};
  const ids = [...new Set(logs.map((l) => (typeof l.order === "object" && l.order ? l.order.id : l.order)).filter((id) => id && !sent[String(id)]))] as number[];
  const done: number[] = [];
  for (const id of ids.slice(0, 50)) {
    const o = await payload.findByID({ collection: "orders", id, depth: 0, overrideAccess: true }).catch(() => null);
    if (!o || o.status !== "shipped") continue;
    if (anonymous(o.email)) { done.push(id); continue; }
    const products = await reviewProducts(payload, o);
    if (!products.length) { done.push(id); continue; }
    const r = await sendMail(payload, { to: o.email, ...T.reviewRequest(o, await orderContext(payload, o), products), order: o.id });
    if (r.ok) done.push(id);
  }
  markReviewSent(done);
  return done.length;
}

type SavedLine = { name?: string; label?: string; qty?: number; price?: number; image?: string; qtyDeal?: QtyTier[] };

async function cartReminders(payload: Payload) {
  const s = getMailSettings();
  if (!mailEnabled(s, "cart-reminder")) return 0;
  const now = Date.now();
  const { docs } = await payload.find({
    collection: "carts",
    where: { and: [
      { status: { equals: "open" } }, { consentAt: { exists: true } },
      { updatedAt: { less_than: new Date(now - s.cart.hours * 3600_000).toISOString() } },
      { updatedAt: { greater_than: new Date(now - 7 * DAY).toISOString() } },
    ] },
    limit: 50, depth: 1, overrideAccess: true,
  });
  if (!docs.length) return 0;
  const store = await payload.findGlobal({ slug: "store-settings", overrideAccess: true });
  let sentCount = 0;
  for (const cart of docs) {
    const set = (data: Record<string, unknown>) => payload.update({ collection: "carts", id: cart.id, overrideAccess: true, data });
    // Zamówienie złożone w międzyczasie (np. z innego urządzenia) – nie przypominamy
    const ordered = await payload.find({ collection: "orders", where: { and: [{ email: { equals: cart.email } }, { createdAt: { greater_than: cart.createdAt } }] }, limit: 1, depth: 0, overrideAccess: true, select: { orderNumber: true } });
    if (ordered.docs[0]) { await set({ status: "recovered", order: ordered.docs[0].id }); continue; }
    // Najwyżej jedno przypomnienie na adres w tygodniu
    const recent = await payload.count({ collection: "carts", where: { and: [{ email: { equals: cart.email } }, { remindedAt: { greater_than: new Date(now - 7 * DAY).toISOString() } }] }, overrideAccess: true });
    if (recent.totalDocs) { await set({ status: "reminded" }); continue; }
    const lines = (Array.isArray(cart.items) ? (cart.items as SavedLine[]) : []).filter((l) => l.name && Number(l.qty) > 0)
      .map((l) => {
        const qty = Number(l.qty);
        const priced = priceAfterQtyDeal(Number(l.price) || 0, l.qtyDeal, qty);
        const note = priced.tier ? (priced.tier.free ? `${priced.hits} szt. gratis` : `${priced.hits} szt. −${priced.tier.percent}%`) : "";
        return { name: String(l.name), label: [l.label, note].filter(Boolean).join(" · "), qty, price: priced.hits ? Math.round(priced.total / qty * 100) / 100 : Number(l.price) || 0, image: l.image };
      });
    if (!lines.length) { await set({ status: "reminded" }); continue; }
    const customer = typeof cart.customer === "object" ? cart.customer : null;
    const token = encodeURIComponent(cart.token);
    const built = T.cartReminder(store as T.Shop, {
      lines, total: Number(cart.total) || lines.reduce((n, l) => n + l.qty * l.price, 0), name: customer?.firstName ?? undefined,
      restoreUrl: `${T.siteUrl()}/koszyk?przywroc=${token}`, optOutUrl: `${T.siteUrl()}/api/cart?token=${token}&wypisz=1`,
    });
    const r = await sendMail(payload, { to: cart.email, ...built });
    if (r.ok) { await set({ status: "reminded", remindedAt: new Date().toISOString() }); sentCount++; }
  }
  return sentCount;
}

// Zapisane koszyki trzymamy najwyżej 30 dni (tak mówi polityka prywatności)
async function purgeOldCarts(payload: Payload) {
  await payload.delete({ collection: "carts", where: { updatedAt: { less_than: new Date(Date.now() - 30 * DAY).toISOString() } }, overrideAccess: true });
}

export async function runMailAutomations(payload: Payload) {
  await purgeOldCarts(payload).catch((e) => payload.logger.error({ err: e }, "Porzucone koszyki: czyszczenie"));
  if (!mailReady()) return { ok: true, message: "Poczta wyłączona – automaty maili czekają" };
  const reviews = await reviewRequests(payload);
  const carts = await cartReminders(payload);
  return { ok: true, message: `Prośby o opinię: ${reviews}, przypomnienia o koszyku: ${carts}` };
}
