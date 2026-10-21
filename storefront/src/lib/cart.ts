import { FREE_SHIPPING } from "./data";
import type { CartLine } from "./store";

export type ResolvedLine = CartLine & { total: number };

// freeShipping – próg z panelu (useFreeShipping() w komponentach)
export function resolveCart(cart: CartLine[], freeShipping = FREE_SHIPPING) {
  const lines: ResolvedLine[] = cart.map((l) => ({ ...l, total: l.price * l.qty }));
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const missing = Math.max(0, freeShipping - subtotal);
  return { lines, subtotal, count, missing, progress: freeShipping > 0 ? Math.min(1, subtotal / freeShipping) : 1 };
}
