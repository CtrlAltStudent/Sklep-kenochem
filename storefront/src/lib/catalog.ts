// Katalog produktów sklepu – czytany z bazy panelu (Payload), TYLKO po stronie serwera.
// Cały katalog (~3 tys. produktów) trzymamy w pamięci: odświeżany co 60 s
// i natychmiast po każdej zmianie produktu/kategorii w panelu (lib/catalogCache.ts).

import "server-only";
import { getCms } from "./cms";
import { catalogVersion } from "./catalogCache";
import { usableImages, type Product } from "./data";
import type { Product as CmsProduct } from "@/payload-types";

const TTL = 60_000;
const NOT_BRANDS = new Set(["marka niezdefiniowana", "brak danych"]);

type Catalog = {
  products: Product[];
  bySlug: Map<string, Product>;
  index: { p: Product; text: string }[];
  counts: Record<string, number>;
  related: Map<string, string[]>;
  html: Map<string, string>;
  rich: Map<string, unknown>;
};

const g = globalThis as typeof globalThis & { __kcCatalog?: { at: number; version: number; data: Promise<Catalog> } };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

function saleActive(sale: CmsProduct["sale"], at: number) {
  return sale?.price != null && sale.price > 0 && (!sale.from || new Date(sale.from).getTime() <= at) && (!sale.to || new Date(sale.to).getTime() >= at);
}

async function load(): Promise<Catalog> {
  const payload = await getCms();
  const [{ docs }, cats] = await Promise.all([
    payload.find({
      collection: "products", where: { status: { equals: "active" } }, limit: 0, pagination: false, depth: 1, overrideAccess: true,
      select: {
        name: true, slug: true, brand: true, category: true, sku: true, ean: true, vatRate: true, stock: true, unitLabel: true, price: true,
        oldPrice: true, lowestPrice30d: true, sale: true, images: true, shortDescription: true, badges: true, descriptionHtml: true, content: true, related: true,
      },
    }),
    payload.find({ collection: "categories", limit: 0, pagination: false, depth: 0, overrideAccess: true, select: { slug: true, parent: true } }),
  ]);

  // id kategorii → [dział, podkategoria, typ] (slugi zgodne z menu sklepu). Produkt może wisieć na dowolnym poziomie.
  const catById = new Map(cats.docs.map((c) => [c.id, c]));
  const parentOf = (c: (typeof cats.docs)[number]) => {
    const id = c.parent == null ? undefined : typeof c.parent === "object" ? c.parent.id : c.parent;
    return id != null ? catById.get(id) : undefined;
  };
  const slugPath = (id: number | undefined): [string, string, string] => {
    let c = id != null ? catById.get(id) : undefined;
    const chain: string[] = [];
    while (c && chain.length < 5) { chain.unshift(c.slug ?? ""); c = parentOf(c); }
    return [chain[0] ?? "", chain[1] ?? "", chain[2] ?? ""];
  };

  const now = Date.now();
  const products: Product[] = [];
  const related = new Map<string, string[]>();
  const html = new Map<string, string>();
  const rich = new Map<string, unknown>();

  for (const d of docs) {
    if (!d.slug) continue;
    const catId = d.category == null ? undefined : typeof d.category === "object" ? d.category.id : d.category;
    const [category, subcategory, type] = slugPath(catId);
    const onSale = saleActive(d.sale, now);
    const price = onSale ? d.sale!.price! : d.price;
    const crossed = onSale ? d.price : d.oldPrice ?? undefined;
    const oldPrice = crossed && crossed > price ? crossed : undefined;
    const images = (d.images ?? [])
      .map((i) => (typeof i.media === "object" && i.media?.url ? i.media.url : i.url))
      .filter((u): u is string => Boolean(u));
    const badges = [...(d.badges ?? [])] as NonNullable<Product["badges"]>;
    if (oldPrice && !badges.includes("promocja")) badges.unshift("promocja");

    products.push({
      id: String(d.id),
      slug: d.slug,
      name: d.name,
      brand: d.brand && !NOT_BRANDS.has(d.brand.toLowerCase()) ? d.brand : "",
      category,
      subcategory,
      type: type || undefined,
      sku: d.sku ?? "",
      ean: d.ean ?? "",
      vat: d.vatRate ?? 23,
      stock: d.stock ?? 0,
      variants: [{ id: "1", label: d.unitLabel || "1 szt.", price, oldPrice }],
      images,
      short: d.shortDescription ?? "",
      badges,
      lowestPrice30d: oldPrice ? d.lowestPrice30d ?? undefined : undefined,
      saleTo: onSale ? d.sale?.to ?? undefined : undefined,
    });
    if (d.related?.length) related.set(d.slug, d.related.map((r) => (typeof r === "object" ? r.slug ?? "" : "")).filter(Boolean));
    if (d.descriptionHtml) html.set(d.slug, d.descriptionHtml);
    if (d.content) rich.set(d.slug, d.content);
  }

  const counts: Record<string, number> = {};
  for (const p of products) {
    counts[p.category] = (counts[p.category] ?? 0) + 1;
    const k = `${p.category}/${p.subcategory}`;
    counts[k] = (counts[k] ?? 0) + 1;
    if (p.type) counts[`${k}/${p.type}`] = (counts[`${k}/${p.type}`] ?? 0) + 1;
  }

  return {
    products,
    bySlug: new Map(products.map((p) => [p.slug, p])),
    index: products.map((p) => ({ p, text: norm(`${p.name} ${p.brand} ${p.sku} ${p.ean}`) })),
    counts,
    related,
    html,
    rich,
  };
}

export function getCatalog(): Promise<Catalog> {
  const v = catalogVersion();
  const c = g.__kcCatalog;
  if (!c || c.version !== v || Date.now() - c.at > TTL) {
    const data = load();
    g.__kcCatalog = { at: Date.now(), version: v, data };
    data.catch(() => { if (g.__kcCatalog?.data === data) g.__kcCatalog = undefined; });
    return data;
  }
  return c.data;
}

export const getProducts = async () => (await getCatalog()).products;
export const getProduct = async (slug: string) => (await getCatalog()).bySlug.get(slug);
export const getCategoryCounts = async () => (await getCatalog()).counts;

export async function getDescription(slug: string) {
  const c = await getCatalog();
  return { html: c.html.get(slug) ?? "", rich: c.rich.get(slug) };
}

export async function getRelated(slug: string) {
  const c = await getCatalog();
  return (c.related.get(slug) ?? []).map((s) => c.bySlug.get(s)).filter((p): p is Product => Boolean(p));
}

// Wyszukiwanie: wszystkie słowa zapytania muszą wystąpić (bez polskich znaków, bez wielkości liter)
export async function searchProducts(q: string, limit = Infinity) {
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const out: Product[] = [];
  for (const { p, text } of (await getCatalog()).index) {
    if (words.every((w) => text.includes(w))) {
      out.push(p);
      if (out.length >= limit) break;
    }
  }
  return out;
}

const withImage = (list: Product[]) => list.filter((p) => usableImages(p.images).length && p.stock > 0);

// Polecane: marki własne Kenochem / Kenotek
export const getFeatured = async () => withImage(await getProducts()).filter((p) => /kenochem|kenotek/i.test(p.brand)).slice(0, 8);
export const getNewest = async () => (await getProducts()).filter((p) => p.badges?.includes("nowosc") && usableImages(p.images).length);
export const getOnSale = async () => (await getProducts()).filter((p) => p.variants.some((v) => v.oldPrice));
export const getByCategory = async (slug: string) => (await getProducts()).filter((p) => p.category === slug);
export const pickFrom = async (category: string, n: number) => withImage(await getProducts()).filter((p) => p.category === category).slice(0, n);
