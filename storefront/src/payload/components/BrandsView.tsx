import type { AdminViewServerProps } from "payload";
import { brandSlug, mediaPath } from "@/lib/data";
import { AdminPage } from "./AdminPage";
import { BrandsDesk } from "./BrandsDesk";

type Logo = { name?: string | null; logo?: { url?: string | null; sizes?: { thumb?: { url?: string | null } | null } | null } | number | null };

export async function BrandsView(props: AdminViewServerProps) {
  const { payload } = props.initPageResult.req;
  const [home, products] = await Promise.all([
    payload.findGlobal({ slug: "homepage", depth: 1, overrideAccess: true }),
    payload.find({ collection: "products", limit: 2000, depth: 0, pagination: false, overrideAccess: true, select: { name: true, brand: true } }),
  ]);
  const logos = ((home as { brandLogos?: Logo[] }).brandLogos ?? []).filter((b) => b.name?.trim());
  const names = new Set(logos.map((b) => brandSlug(b.name!)));
  const brands = logos.map((b) => {
    const name = b.name!.trim();
    const media = typeof b.logo === "object" && b.logo ? b.logo : null;
    return {
      name,
      slug: brandSlug(name),
      count: products.docs.filter((p) => p.brand && brandSlug(p.brand) === brandSlug(name)).length,
      image: mediaPath(media?.sizes?.thumb?.url ?? media?.url),
    };
  });
  const loose = products.docs
    .filter((p) => !p.brand || !names.has(brandSlug(p.brand)))
    .map((p) => ({ id: p.id, name: p.name, brand: p.brand || "" }));

  return (
    <AdminPage {...props}>
      <div className="kc-dash">
        <section className="kc-hero kc-hero--compact">
          <div>
            <p className="kc-hero__date">Katalog</p>
            <h1 className="kc-hero__title">Marki</h1>
            <p className="kc-hero__text">Na stronie Marki są tylko te loga. Produkt bez marki z tej listy nie wchodzi na żaden kafelek.</p>
          </div>
        </section>
        <BrandsDesk brands={brands} loose={loose} />
      </div>
    </AdminPage>
  );
}
