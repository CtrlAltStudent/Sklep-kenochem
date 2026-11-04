import { getCms } from "@/lib/cms";

// Krótki adres produktu po numerze: /p/239 → /produkt/<adres>. Potrzebny do wzoru linku w BaseLinkerze ([product_id]).
// Tylko aktywne produkty; zły numer albo produkt ukryty → 404.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^\d{1,10}$/.test(id)) return new Response("Nie znaleziono.", { status: 404 });
  const cms = await getCms();
  const { docs } = await cms.find({
    collection: "products", where: { and: [{ id: { equals: Number(id) } }, { status: { equals: "active" } }] },
    limit: 1, depth: 0, overrideAccess: true, select: { slug: true },
  });
  const slug = docs[0]?.slug;
  if (!slug) return new Response("Nie znaleziono.", { status: 404 });
  return new Response(null, { status: 308, headers: { Location: `/produkt/${encodeURIComponent(slug)}` } });
}
