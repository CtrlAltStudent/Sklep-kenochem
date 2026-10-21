import type { MetadataRoute } from "next";
import { categories } from "@/lib/data";
import { getBrands, getProducts } from "@/lib/catalog";
import { getCms, getPosts } from "@/lib/cms";

// Mapa strony dla Google – odświeżana co godzinę
export const revalidate = 3600;

const base = (process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [products, pages, brands, posts] = await Promise.all([
    getProducts(),
    getCms().then((p) => p.find({ collection: "pages", where: { _status: { equals: "published" } }, limit: 200, depth: 0, select: { slug: true, updatedAt: true } })),
    getBrands(),
    getPosts(),
  ]);

  const statics = ["", "/kontakt", "/dostawa-i-platnosci", "/czas-realizacji", "/zwroty-i-reklamacje", "/nowosci", "/blog", "/promocje", "/bestsellery", "/marki", "/o-nas", "/faq", "/regulamin", "/polityka-prywatnosci"].map((p) => ({
    url: `${base}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6,
  }));
  const cats = categories.flatMap((c) => [
    { url: `${base}/kategoria/${c.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 },
  ]);
  const cms = pages.docs.filter((d) => d.slug).map((d) => ({ url: `${base}/${d.slug}`, lastModified: new Date(d.updatedAt), changeFrequency: "monthly" as const, priority: 0.3 }));
  const brandPages = brands.map((b) => ({ url: `${base}/marki/${b.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 }));
  const prods = products.map((p) => ({ url: `${base}/produkt/${p.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 }));
  const blog = posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.publishedAt ? new Date(p.publishedAt) : now, changeFrequency: "monthly" as const, priority: 0.5 }));

  return [...statics, ...cats, ...cms, ...brandPages, ...prods, ...blog];
}
