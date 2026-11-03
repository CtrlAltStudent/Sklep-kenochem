import { cache } from "react";
import { getHomepage } from "@/lib/cms";
import { getProducts } from "@/lib/catalog";
import { brandSlug, mediaPath } from "@/lib/data";

type Logo = {
  name?: string | null;
  link?: string | null;
  logo?: { url?: string | null; sizes?: { thumb?: { url?: string | null } | null } | null } | number | null;
};

export type ShopBrand = {
  name: string;
  slug: string;
  count: number;
  image?: string;
  href: string;
  categories: string[];
};

// Marki sklepu = loga wgrane na stronie głównej. Produkty liczymy po nazwie marki.
export const getShopBrands = cache(async (): Promise<ShopBrand[]> => {
  const [home, products] = await Promise.all([getHomepage(), getProducts()]);
  const logos = ((home as { brandLogos?: Logo[] } | null)?.brandLogos ?? []).filter((b) => b?.name?.trim());
  return logos.map((b) => {
    const name = b.name!.trim();
    const slug = brandSlug(name);
    const mine = products.filter((p) => p.brand && brandSlug(p.brand) === slug);
    const media = typeof b.logo === "object" && b.logo ? b.logo : null;
    return {
      name,
      slug,
      count: mine.length,
      image: mediaPath(media?.sizes?.thumb?.url ?? media?.url),
      href: b.link?.trim() || `/marki/${slug}`,
      categories: [...new Set(mine.map((p) => p.category).filter(Boolean))],
    };
  });
});
