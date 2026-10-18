import { z } from "zod";
import { getCms } from "@/lib/cms";

// Sprawdzenie kodu rabatowego w koszyku: POST { code, subtotal, items: [{ slug, total }] }
const input = z.object({
  code: z.string().trim().min(2).max(40),
  subtotal: z.number().nonnegative(),
  items: z.array(z.object({ slug: z.string(), total: z.number().nonnegative() })).max(200).default([]),
});

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, message: "Nieprawidłowe dane" }, { status: 400 });
  const { code, subtotal, items } = parsed.data;

  const payload = await getCms();
  const coupon = (await payload.find({ collection: "coupons", where: { code: { equals: code.toUpperCase().replace(/\s+/g, "") } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
  const fail = (message: string) => Response.json({ ok: false, message });

  if (!coupon || !coupon.active) return fail("Nieprawidłowy kod rabatowy");
  const now = Date.now();
  if (coupon.validFrom && new Date(coupon.validFrom).getTime() > now) return fail("Ten kod jeszcze nie obowiązuje");
  if (coupon.validTo && new Date(coupon.validTo).getTime() < now) return fail("Kod wygasł");
  if (coupon.usageLimit && (coupon.usedCount ?? 0) >= coupon.usageLimit) return fail("Limit użyć kodu został wyczerpany");
  if (coupon.minOrder && subtotal < coupon.minOrder) return fail(`Kod działa od ${coupon.minOrder.toFixed(2).replace(".", ",")} zł w koszyku`);
  if (coupon.b2bOnly) return fail("Kod jest dostępny tylko dla zalogowanych klientów B2B");

  // Ograniczenie do kategorii: liczymy rabat tylko od pasujących produktów
  let base = subtotal;
  const catIds: number[] = (coupon.categories ?? []).map((c) => (typeof c === "object" ? c.id : c));
  if (catIds.length) {
    const slugs = items.map((i) => i.slug);
    const { docs } = await payload.find({ collection: "products", where: { slug: { in: slugs } }, limit: slugs.length, depth: 1, overrideAccess: true, select: { slug: true, category: true } });
    const allowed = new Set(
      docs.filter((p) => {
        const cat = p.category && typeof p.category === "object" ? p.category : null;
        const parent = cat?.parent ?? null;
        const parentId = parent == null ? null : typeof parent === "object" ? parent.id : parent;
        return cat && (catIds.includes(cat.id) || (parentId != null && catIds.includes(parentId)));
      }).map((p) => p.slug),
    );
    base = items.filter((i) => allowed.has(i.slug)).reduce((s, i) => s + i.total, 0);
    if (base <= 0) return fail("Kod nie obejmuje produktów w koszyku");
  }

  const discount =
    coupon.type === "percent" ? Math.round(base * (coupon.value ?? 0)) / 100 :
    coupon.type === "amount" ? Math.min(base, coupon.value ?? 0) : 0;

  return Response.json({
    ok: true,
    code: coupon.code,
    type: coupon.type,
    discount: Math.round(discount * 100) / 100,
    freeShipping: coupon.type === "free_shipping",
    message: coupon.type === "free_shipping" ? "Darmowa dostawa aktywna" : `Rabat ${coupon.type === "percent" ? `${coupon.value}%` : `${coupon.value} zł`} naliczony`,
  });
}
