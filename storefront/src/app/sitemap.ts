import type { MetadataRoute } from "next";
import { categories } from "@/lib/data";
import { getProducts } from "@/lib/catalog";
import { getCms } from "@/lib/cms";

// Mapa strony dla Google – odświeżana co godzinę
export const revalidate = 3600;

const base = (process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [products, pages] = await Promise.all([
    getProducts(),
    getCms().then((p) => p.find({ collection: "pages", where: { _status: { equals: "published" } }, limit: 200, depth: 0, select: { slug: true, updatedAt: true } })),
  ]);

  const statics = ["", "/b2b", "/kontakt", "/dostawa-i-platnosci", "/zwroty-i-reklamacje", "/nowosci", "/blog"].map((p) => ({
    url: `${base}${p}`, lastModified: now, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6,
  }));
  const cats = categories.flatMap((c) => [
    { url: `${base}/kategoria/${c.slug}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.8 },
  ]);
  const cms = pages.docs.filter((d) => d.slug).map((d) => ({ url: `${base}/${d.slug}`, lastModified: new Date(d.updatedAt), changeFrequency: "monthly" as const, priority: 0.3 }));
  const prods = products.map((p) => ({ url: `${base}/produkt/${p.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 }));

  return [...statics, ...cats, ...cms, ...prods];
}
