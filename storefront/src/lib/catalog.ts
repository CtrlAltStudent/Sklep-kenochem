// Katalog produktów sklepu – czytany z bazy panelu (Payload), TYLKO po stronie serwera.
// Cały katalog (~3 tys. produktów) trzymamy w pamięci: odświeżany co 60 s
// i natychmiast po każdej zmianie produktu/kategorii w panelu (lib/catalogCache.ts).

import "server-only";
import { getCms } from "./cms";
import { catalogVersion } from "./catalogCache";
import { brandSlug, mediaPath, usableImages, variantDisplayOf, variantNavOf, type Product, type QtyTier, type Variant } from "./data";
import { relId, volumeMl } from "@/integrations/variants";
import type { Product as CmsProduct } from "@/payload-types";

const TTL = 60_000;
const NOT_BRANDS = new Set(["marka niezdefiniowana", "brak danych"]);

type Catalog = {
  products: Product[];
  bySlug: Map<string, Product>;
  index: { p: Product; text: string }[];
  counts: Record<string, number>;
  total: number;
};

const g = globalThis as typeof globalThis & { __kcCatalog?: { at: number; version: number; data: Promise<Catalog> } };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

function qtyDealOf(d: Pick<CmsProduct, "qtyPromo" | "qtyTiers">, at: number): QtyTier[] | undefined {
  const g = d.qtyPromo;
  if (!g?.enabled) return;
  if (g.from && new Date(g.from).getTime() > at) return;
  if (g.to && new Date(g.to).getTime() < at) return;
  const tiers = (d.qtyTiers ?? [])
    .map((t) => ({ qty: Number(t.qty), percent: Number(t.percent), free: t.kind === "free" }))
    .filter((t) => t.qty >= 2 && (t.free || (t.percent >= 1 && t.percent <= 90)))
    .sort((a, b) => a.qty - b.qty);
  return tiers.length ? tiers : undefined;
}

function saleActive(sale: CmsProduct["sale"], at: number) {
  return sale?.price != null && sale.price > 0 && (!sale.from || new Date(sale.from).getTime() <= at) && (!sale.to || new Date(sale.to).getTime() >= at);
}

async function load(): Promise<Catalog> {
  const payload = await getCms();
  const [{ docs }, cats] = await Promise.all([
    payload.find({
      collection: "products", where: { status: { equals: "active" } }, limit: 0, pagination: false, depth: 0, overrideAccess: true,
      select: {
        name: true, slug: true, brand: true, category: true, sku: true, ean: true, vatRate: true, stock: true, unitLabel: true, price: true,
        oldPrice: true, lowestPrice30d: true, sale: true, qtyPromo: true, qtyTiers: true, images: true, shortDescription: true, badges: true, updatedAt: true, createdAt: true, seo: true, seoExtra: true,
        variantOf: true, variantSort: true, variantDisplay: true, variantNav: true, bundle: true, bundleItems: true,
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
  type Row = { product: Product; parent?: number; sort: number; volume: number; bundleRaw?: NonNullable<CmsProduct["bundleItems"]> };

  const rows: Row[] = [];
  for (const d of docs) {
    if (!d.slug) continue;
    const catId = d.category == null ? undefined : typeof d.category === "object" ? d.category.id : d.category;
    const [category, subcategory, type] = slugPath(catId);
    const onSale = saleActive(d.sale, now);
    const qtyDeal = qtyDealOf(d, now);
    const price = onSale ? d.sale!.price! : d.price;
    const crossed = onSale ? d.price : d.oldPrice ?? undefined;
    const oldPrice = crossed && crossed > price ? crossed : undefined;
    const images = (d.images ?? [])
      .map((i) => (typeof i.media === "object" && i.media?.url ? mediaPath(i.media.url) : i.url))
      .filter((u): u is string => Boolean(u));
    const badges = [...(d.badges ?? [])] as NonNullable<Product["badges"]>;
    if (oldPrice && !badges.includes("promocja")) badges.unshift("promocja");
    rows.push({
      parent: relId(d.variantOf),
      sort: d.variantSort ?? 0,
      volume: volumeMl(d.unitLabel || ""),
      bundleRaw: d.bundle ? (d.bundleItems ?? []) : undefined,
      product: {
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
        variants: [{ id: "1", label: d.unitLabel || "1 szt.", price, oldPrice, slug: d.slug, sku: d.sku ?? "", ean: d.ean ?? "", stock: d.stock ?? 0, image: images[0], qtyDeal }],
        variantDisplay: variantDisplayOf(d.variantDisplay).id,
        variantNav: variantNavOf(d.variantNav).id,
        images,
        short: d.shortDescription ?? "",
        badges,
        lowestPrice30d: oldPrice ? d.lowestPrice30d ?? undefined : undefined,
        saleTo: onSale ? d.sale?.to ?? undefined : undefined,
        updatedAt: d.updatedAt,
        addedAt: d.createdAt,
        seo: { title: d.seo?.title || undefined, description: d.seo?.description || undefined, noindex: Boolean(d.seo?.noindex), canonical: d.seoExtra?.canonical || undefined },
        qtyDeal,
      },
    });
  }

  const byId = new Map(rows.map((r) => [Number(r.product.id), r]));
  for (const r of rows) {
    if (!r.bundleRaw?.length) continue;
    r.product.bundleParts = r.bundleRaw.map((item) => {
      const partId = item.product == null ? undefined : typeof item.product === "object" ? item.product.id : item.product;
      const other = partId ? byId.get(partId) : undefined;
      return {
        slug: other?.product.slug,
        name: other?.product.name || item.sku || "Produkt",
        sku: other?.product.sku || item.sku || "",
        qty: item.quantity || 1,
        image: other?.product.images[0],
      };
    });
  }
  const kidsOf = new Map<number, Row[]>();
  for (const r of rows) {
    if (!r.parent || r.parent === Number(r.product.id) || !byId.has(r.parent)) continue;
    const list = kidsOf.get(r.parent) ?? [];
    list.push(r);
    kidsOf.set(r.parent, list);
  }
  const sortRows = (list: Row[]) =>
    [...list].sort((a, b) => a.sort - b.sort || a.volume - b.volume || a.product.variants[0].label.localeCompare(b.product.variants[0].label, "pl"));

  const asVariant = (r: Row, id: string): Variant => ({ ...r.product.variants[0], id, image: r.product.images[0], qtyDeal: r.product.qtyDeal });

  const products: Product[] = [];
  for (const r of rows) {
    const id = Number(r.product.id);
    if (r.parent && byId.has(r.parent) && r.parent !== id) continue;
    const kids = sortRows(kidsOf.get(id) ?? []);
    const members = kids.length ? [r, ...kids] : [r];
    const variants = members.map((m) => asVariant(m, members.length > 1 ? m.product.id : "1"));
    const display = variantDisplayOf(r.product.variantDisplay).id;
    const nav = members.length > 1 ? variantNavOf(r.product.variantNav).id : "switch";
    const listed = nav === "link" ? members : [r];
    for (const m of listed) {
      const images = m.product.images.length ? m.product.images : (members.find((x) => x.product.images.length)?.product.images ?? []);
      const badges = [...(m.product.badges ?? [])] as NonNullable<Product["badges"]>;
      if (variants.some((v) => v.oldPrice) && !badges.includes("promocja")) badges.unshift("promocja");
      const saleTo = (nav === "link" ? [m] : members).map((x) => x.product.saleTo).filter(Boolean).sort()[0];
      const lowest = (nav === "link" ? [m] : members).map((x) => x.product.lowestPrice30d).filter((n): n is number => n != null);
      const own = asVariant(m, variants[0].id === "1" ? "1" : m.product.id);
      products.push({
        ...m.product,
        images,
        stock: nav === "link" ? (own.stock ?? m.product.stock) : variants.reduce((s, v) => s + (v.stock ?? 0), 0),
        variants,
        variantDisplay: display,
        variantNav: nav,
        badges: badges.length ? badges : undefined,
        lowestPrice30d: (nav === "link" ? own.oldPrice : variants.some((v) => v.oldPrice)) ? (lowest.length ? Math.min(...lowest) : m.product.lowestPrice30d) : undefined,
        saleTo,
      });
    }
  }

  // Liczymy każdy aktywny produkt z panelu, także wariant przypięty do innej karty.
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const p = r.product;
    if (!p.category) continue;
    counts[p.category] = (counts[p.category] ?? 0) + 1;
    if (!p.subcategory) continue;
    const k = `${p.category}/${p.subcategory}`;
    counts[k] = (counts[k] ?? 0) + 1;
    if (p.type) counts[`${k}/${p.type}`] = (counts[`${k}/${p.type}`] ?? 0) + 1;
  }

  const bySlug = new Map<string, Product>();
  for (const p of products) {
    bySlug.set(p.slug, p);
    if (p.variantNav !== "link") for (const v of p.variants) if (v.slug) bySlug.set(v.slug, p);
  }

  return {
    products,
    bySlug,
    index: products.map((p) => ({ p, text: norm(`${p.name} ${p.brand} ${p.sku} ${p.ean} ${p.variants.map((v) => `${v.sku ?? ""} ${v.ean ?? ""} ${v.label}`).join(" ")}`) })),
    counts,
    total: rows.length,
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
export const getProductTotal = async () => (await getCatalog()).total;

// Bezpieczeństwo (CLP/GPSR): karta charakterystyki, piktogramy GHS, hasło ostrzegawcze – z zakładki „Bezpieczeństwo” w panelu
export type Safety = { sds?: string; pictograms: string[]; signal?: "warning" | "danger"; notes?: string };
export const getSafety = async (slug: string) => {
  const payload = await getCms();
  const d = (await payload.find({ collection: "products", where: { slug: { equals: slug } }, limit: 1, depth: 1, overrideAccess: true, select: { sds: true, hazardPictograms: true, signalWord: true, safetyNotes: true } })).docs[0];
  if (!d) return undefined;
  const sdsUrl = typeof d.sds === "object" && d.sds?.url ? mediaPath(d.sds.url) : undefined;
  if (!sdsUrl && !d.hazardPictograms?.length && (!d.signalWord || d.signalWord === "none") && !d.safetyNotes) return undefined;
  return { sds: sdsUrl, pictograms: d.hazardPictograms ?? [], signal: d.signalWord && d.signalWord !== "none" ? d.signalWord : undefined, notes: d.safetyNotes ?? undefined };
};

export async function getDescription(slug: string) {
  const payload = await getCms();
  const d = (await payload.find({ collection: "products", where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true, select: { descriptionHtml: true, content: true } })).docs[0];
  return { html: d?.descriptionHtml ?? "", rich: d?.content };
}

export async function getRelated(slug: string) {
  const payload = await getCms();
  const d = (await payload.find({ collection: "products", where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true, select: { related: true } })).docs[0];
  const c = await getCatalog();
  const slugs = (d?.related ?? []).map((r) => (typeof r === "object" ? r.slug ?? "" : "")).filter(Boolean);
  return slugs.map((s) => c.bySlug.get(s)).filter((p): p is Product => Boolean(p));
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

// Siatki strony głównej: listy z panelu (Strona główna → Siatki produktów). Pusta lista = dobór automatyczny.
type HomeLists = { title: string; featured: (number | string)[]; promo: (number | string)[]; newest: (number | string)[]; bestsellers: (number | string)[] };
const hg = globalThis as typeof globalThis & { __sonaxHome?: { at: number; data: Promise<HomeLists> } };
const relIds = (list: unknown) =>
  (Array.isArray(list) ? list : []).map((p) => (typeof p === "object" && p ? (p as { id: number }).id : p)).filter((id) => id != null) as (number | string)[];

async function homepageLists() {
  const cached = hg.__sonaxHome;
  if (!cached || Date.now() - cached.at > TTL) {
    const data = (await getCms()).findGlobal({ slug: "homepage", depth: 0 }).then((home) => ({
      title: home.featuredTitle || "Wybór detailerów – SONAX",
      featured: relIds(home.featuredProducts),
      promo: relIds(home.promoProducts),
      newest: relIds(home.newestProducts),
      bestsellers: relIds(home.bestsellerProducts),
    }));
    hg.__sonaxHome = { at: Date.now(), data };
    data.catch(() => { if (hg.__sonaxHome?.data === data) hg.__sonaxHome = undefined; });
    return data;
  }
  return cached.data;
}

function pickListed(ids: (number | string)[], products: Product[]) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const out: Product[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    const key = String(id);
    const p = byId.get(key) ?? products.find((x) => x.variants.some((v) => v.id === key));
    if (p && !seen.has(p.slug)) { seen.add(p.slug); out.push(p); }
  }
  return out;
}

export async function getFeatured() {
  const [home, { products }] = await Promise.all([homepageLists(), getCatalog()]);
  const chosen = pickListed(home.featured, products);
  return chosen.length ? chosen : withImage(products).filter((p) => /^sonax$/i.test(p.brand)).slice(0, 12);
}
export const getFeaturedTitle = async () => (await homepageLists()).title;
export const getOnSale = async () => (await getProducts()).filter((p) => p.variants.some((v) => v.oldPrice));
export async function getDeals() {
  const [home, { products }] = await Promise.all([homepageLists(), getCatalog()]);
  const chosen = pickListed(home.promo, products);
  return chosen.length ? chosen : getOnSale();
}
export async function getNewest() {
  const [home, products] = await Promise.all([homepageLists(), getProducts()]);
  const chosen = pickListed(home.newest, products);
  if (chosen.length) return chosen;
  return withImage(products).sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? "")).slice(0, 24);
}
export const getByCategory = async (slug: string) => (await getProducts()).filter((p) => p.category === slug);
export const pickFrom = async (category: string, n: number) => withImage(await getProducts()).filter((p) => p.category === category).slice(0, n);

// Marki z liczbą produktów i zdjęciem najpopularniejszego produktu (strona /marki)
export async function getBrands() {
  const map = new Map<string, { name: string; slug: string; count: number; image?: string; categories: Set<string> }>();
  for (const p of await getProducts()) {
    if (!p.brand) continue;
    const slug = brandSlug(p.brand);
    const b = map.get(slug) ?? { name: p.brand, slug, count: 0, image: undefined, categories: new Set<string>() };
    b.count++;
    b.categories.add(p.category);
    if (!b.image) b.image = usableImages(p.images)[0];
    map.set(slug, b);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
export const getByBrand = async (slug: string) => (await getProducts()).filter((p) => p.brand && brandSlug(p.brand) === slug);
export async function getBestsellers() {
  const [home, products] = await Promise.all([homepageLists(), getProducts()]);
  const chosen = pickListed(home.bestsellers, products);
  return chosen.length ? chosen : products.filter((p) => p.badges?.includes("bestseller"));
}
