import type { MetadataRoute } from "next";
import { categories } from "@/lib/data";
import { getBrands, getCategoryCounts, getProducts } from "@/lib/catalog";
import { getCms, getPosts } from "@/lib/cms";
import { absUrl, siteBase, siteIndexable } from "@/lib/site";

// Mapa strony dla Google i Bing – odświeżana co godzinę.
// Zawiera: strony stałe, kategorie z podkategoriami i typami (tylko niepuste), produkty ze zdjęciami,
// marki, wpisy bloga i opublikowane strony z panelu. Daty = prawdziwa ostatnia zmiana, bez duplikatów.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!siteIndexable()) return []; // serwer testowy nie ma mapy dla wyszukiwarek
  const base = siteBase();
  const [products, pages, brands, posts, counts] = await Promise.all([
    getProducts(),
    getCms().then((p) => p.find({ collection: "pages", where: { _status: { equals: "published" } }, limit: 500, depth: 0, select: { slug: true, updatedAt: true, seo: true } })),
    getBrands(),
    getPosts(),
    getCategoryCounts(),
  ]);
  const newest = products.reduce((d, p) => (p.updatedAt && p.updatedAt > d ? p.updatedAt : d), "");
  const catalogDate = newest ? new Date(newest) : undefined;

  const out = new Map<string, MetadataRoute.Sitemap[number]>();
  const add = (e: MetadataRoute.Sitemap[number]) => { if (!out.has(e.url)) out.set(e.url, e); };

  add({ url: base, lastModified: catalogDate, changeFrequency: "daily", priority: 1 });
  for (const p of ["/promocje", "/nowosci", "/bestsellery", "/marki", "/blog", "/kontakt", "/dostawa-i-platnosci", "/zwroty-i-reklamacje", "/o-nas", "/faq"])
    add({ url: `${base}${p}`, lastModified: ["/promocje", "/nowosci", "/bestsellery"].includes(p) ? catalogDate : undefined, changeFrequency: "weekly", priority: 0.6 });

  // Kategorie: dział → podkategoria (?sub=) → typ (&typ=), tylko te z produktami
  for (const c of categories) {
    if (!counts[c.slug]) continue;
    add({ url: `${base}/kategoria/${c.slug}`, lastModified: catalogDate, changeFrequency: "daily", priority: 0.8 });
    for (const s of c.children) {
      if (!counts[`${c.slug}/${s.slug}`]) continue;
      add({ url: `${base}/kategoria/${c.slug}?sub=${s.slug}`, lastModified: catalogDate, changeFrequency: "daily", priority: 0.7 });
      for (const t of s.types) if (counts[`${c.slug}/${s.slug}/${t.slug}`])
        add({ url: `${base}/kategoria/${c.slug}?sub=${s.slug}&typ=${t.slug}`, lastModified: catalogDate, changeFrequency: "weekly", priority: 0.6 });
    }
  }

  for (const p of products) {
    const images = p.images.slice(0, 5).map(absUrl).filter(Boolean);
    const slugs = p.variantNav === "link"
      ? [p.slug]
      : [p.slug, ...p.variants.map((v) => v.slug).filter((s): s is string => Boolean(s) && s !== p.slug)];
    for (const slug of slugs) {
      const v = p.variants.find((x) => x.slug === slug);
      add({
        url: `${base}/produkt/${slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
        changeFrequency: "weekly",
        priority: (v?.stock ?? p.stock) > 0 ? 0.7 : 0.4,
        images,
      });
    }
  }
  for (const b of brands) add({ url: `${base}/marki/${b.slug}`, lastModified: catalogDate, changeFrequency: "weekly", priority: 0.5 });
  for (const p of posts) add({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt ? new Date(p.updatedAt) : p.publishedAt ? new Date(p.publishedAt) : undefined, changeFrequency: "monthly", priority: 0.5 });
  for (const d of pages.docs)
    if (d.slug && !d.seo?.noindex) add({ url: `${base}/${d.slug}`, lastModified: new Date(d.updatedAt), changeFrequency: "monthly", priority: d.slug.startsWith("regulamin") || d.slug.startsWith("polityka") ? 0.2 : 0.5 });

  return [...out.values()];
}
