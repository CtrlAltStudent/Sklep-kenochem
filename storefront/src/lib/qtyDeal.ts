import type { QtyTier } from "./data";

const round2 = (n: number) => Math.round(n * 100) / 100;

export type QtyQuote = {
  unit: number;
  total: number;
  full: number;
  hits: number;
  each: number;
  tier?: QtyTier;
};

// Co n-tą sztukę (stos). 12 sztuk przy progu 3 = 4 sztuki z rabatem. Z kilku progów zostaje ten z większą zniżką.
export function priceAfterQtyDeal(price: number, tiers: QtyTier[] | undefined, qty: number): QtyQuote {
  const full = round2(price * Math.max(0, qty));
  let best: QtyQuote | undefined;
  for (const raw of tiers ?? []) {
    const free = Boolean(raw.free) || raw.percent >= 100;
    const percent = free ? 100 : raw.percent;
    if (raw.qty < 2 || qty < raw.qty) continue;
    if (!free && (percent < 1 || percent > 90)) continue;
    const hits = Math.floor(qty / raw.qty);
    if (hits < 1) continue;
    const each = free ? 0 : round2(price * (100 - percent) / 100);
    const total = round2(price * (qty - hits) + each * hits);
    const quote: QtyQuote = {
      unit: round2(total / qty),
      total,
      full,
      hits,
      each,
      tier: { qty: raw.qty, percent, free },
    };
    if (!best || full - total > best.full - best.total) best = quote;
  }
  if (!best) return { unit: price, total: full, full, hits: 0, each: price };
  return best;
}

export function qtyDealText(tier: QtyTier) {
  return tier.free ? `Co ${tier.qty}. sztuka gratis` : `Co ${tier.qty}. sztuka −${tier.percent}%`;
}
