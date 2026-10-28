import { FREE_SHIPPING, type QtyTier } from "./data";
import { priceAfterQtyDeal } from "./qtyDeal";
import type { CartLine } from "./store";

export type ResolvedLine = CartLine & { total: number; unit: number; full: number; hits: number; deal?: QtyTier };

// freeShipping – próg z panelu (useFreeShipping() w komponentach)
export function resolveCart(cart: CartLine[], freeShipping = FREE_SHIPPING) {
  const lines: ResolvedLine[] = cart.map((l) => {
    const priced = priceAfterQtyDeal(l.price, l.qtyDeal, l.qty);
    return { ...l, unit: priced.unit, full: priced.full, hits: priced.hits, deal: priced.tier, total: priced.total };
  });
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const missing = Math.max(0, freeShipping - subtotal);
  return { lines, subtotal, count, missing, progress: freeShipping > 0 ? Math.min(1, subtotal / freeShipping) : 1 };
}
