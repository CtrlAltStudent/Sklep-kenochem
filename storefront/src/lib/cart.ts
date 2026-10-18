import { FREE_SHIPPING } from "./data";
import type { CartLine } from "./store";

export type ResolvedLine = CartLine & { total: number };

export function resolveCart(cart: CartLine[]) {
  const lines: ResolvedLine[] = cart.map((l) => ({ ...l, total: l.price * l.qty }));
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const missing = Math.max(0, FREE_SHIPPING - subtotal);
  return { lines, subtotal, count, missing, progress: Math.min(1, subtotal / FREE_SHIPPING) };
}
