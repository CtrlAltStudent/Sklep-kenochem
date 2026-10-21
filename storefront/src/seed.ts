// Dane startowe panelu: kategorie (3 poziomy), produkty z importu, ustawienia sklepu, przekierowania starych adresów.
// Uruchomienie: npm run seed   (bezpieczne do ponownego uruchomienia – nie tworzy duplikatów)
// Wcześniej: node scripts/fetch-sonax-shop.mjs && node scripts/import-products.mjs "<plik CSV z BaseLinkera>"

import fs from "node:fs";
import path from "node:path";
import { getPayload } from "payload";
import config from "@payload-config";
import { categories as shopCategories, type Product } from "./lib/data";

const root = process.cwd();
const payload = await getPayload({ config });
const log = (m: string) => payload.logger.info(`[seed] ${m}`);

async function upsert(collection: "categories" | "media", where: Record<string, unknown>, data: Record<string, unknown>, file?: string) {
  const found = await payload.find({ collection, where: where as never, limit: 1, depth: 0 });
  if (found.docs[0]) return found.docs[0];
  return payload.create({ collection, data: data as never, ...(file ? { filePath: file } : {}) });
}

// 1) Logo i ikona Sonax do biblioteki mediów (do użycia w banerach i e-mailach)
for (const [f, alt] of [["logo.png", "Sonax Polska – logo"], ["icon-512.png", "Sonax – ikona"]]) {
  await upsert("media", { filename: { equals: f } }, { alt }, path.join(root, "public", "sonax", f));
}

// 2) Kategorie: dział › podkategoria › typ
const catIds = new Map<string, number | string>();
for (const [i, c] of shopCategories.entries()) {
  const parent = await upsert("categories", { slug: { equals: c.slug } }, { name: c.name, slug: c.slug, order: i, color: c.color, lucide: c.lucide });
  catIds.set(c.slug, parent.id);
  for (const [j, s] of c.children.entries()) {
    const child = await upsert("categories", { slug: { equals: s.slug } }, { name: s.name, slug: s.slug, order: j, parent: parent.id, lucide: s.lucide });
    catIds.set(`${c.slug}/${s.slug}`, child.id);
    for (const [k, t] of s.types.entries()) {
      const type = await upsert("categories", { slug: { equals: t.slug } }, { name: t.name, slug: t.slug, order: k, parent: child.id });
      catIds.set(`${c.slug}/${s.slug}/${t.slug}`, type.id);
    }
  }
}
log(`kategorie: ${catIds.size}`);

// 3) Produkty z importu
const products = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "products.json"), "utf8")) as Product[];
const descriptions = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "descriptions.json"), "utf8")) as Record<string, string>;
const existing = new Set(
  (await payload.find({ collection: "products", limit: 0, pagination: false, depth: 0, select: { slug: true } })).docs.map((d) => d.slug),
);
let created = 0;
for (const p of products) {
  if (existing.has(p.slug)) continue;
  await payload.create({
    collection: "products",
    data: {
      name: p.name,
      slug: p.slug,
      category: catIds.get(`${p.category}/${p.subcategory}/${p.type}`) ?? catIds.get(`${p.category}/${p.subcategory}`) ?? catIds.get(p.category),
      brand: p.brand,
      shortDescription: p.short,
      descriptionHtml: descriptions[p.slug] ?? "",
      badges: p.badges ?? [],
      price: p.variants[0].price,
      vatRate: p.vat,
      sku: p.sku,
      ean: p.ean,
      stock: p.stock,
      unitLabel: p.variants[0].label,
      images: p.images.map((url) => ({ url })),
      source: "csv",
      status: "active",
    } as never,
  });
  if (++created % 100 === 0) log(`produkty: ${created}…`);
}
log(`produkty: dodano ${created}, wcześniej było ${existing.size}`);

// 4) Przekierowania starych adresów sonax.sklep.pl (kategorie WooCommerce, zdublowane produkty)
const redirects = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "redirects.json"), "utf8")) as { from: string; to: string }[];
let redirected = 0;
for (const r of redirects) {
  const from = r.from.replace(/\/+$/, "");
  const found = await payload.find({ collection: "redirects", where: { from: { equals: from } }, limit: 1, depth: 0 });
  if (found.docs[0]) continue;
  await payload.create({ collection: "redirects", data: { from, to: r.to, permanent: true, active: true } });
  redirected++;
}
log(`przekierowania: dodano ${redirected}`);

const orlenPaczka = {
  code: "orlen-paczka",
  label: "ORLEN Paczka (punkt odbioru)",
  price: 16.5,
  baselinkerName: "ORLEN Paczka",
  requiresPoint: true,
  enabled: true,
  freeAboveThreshold: true,
};

function withOrlenPaczka<T extends { code: string }>(methods: T[]): T[] {
  if (methods.some((m) => m.code.startsWith("orlen"))) return methods;
  const next = [...methods];
  const i = next.findIndex((m) => m.code === "pickup");
  if (i >= 0) next.splice(i, 0, orlenPaczka as unknown as T);
  else next.push(orlenPaczka as unknown as T);
  return next;
}

// 5) Ustawienia sklepu (tylko jeśli puste) + dopisz ORLEN Paczkę do istniejącego cennika
const store = await payload.findGlobal({ slug: "store-settings" });
if (!store.shippingMethods?.length) {
  await payload.updateGlobal({
    slug: "store-settings",
    data: {
      storeName: "Sklep SONAX",
      email: "aukcje@sonax.bialystok.pl",
      gpsrResponsible: "KENOCHEM Kuczyński Sp. J., Gen. Wł. Andersa 40, Boks 16, 15-113 Białystok, aukcje@sonax.bialystok.pl",
      freeShippingThreshold: 249.99,
      // Cennik jak na sonax.sklep.pl/dostawy-i-platnosci + ORLEN Paczka (ta sama cena co paczkomat)
      shippingMethods: [
        { code: "inpost-paczkomat", label: "InPost Paczkomat 24/7 (do 4 kg)", price: 16.5, baselinkerName: "InPost Paczkomat 24/7", requiresPoint: true, enabled: true, freeAboveThreshold: true },
        { code: "inpost-kurier", label: "Kurier InPost", price: 19.99, baselinkerName: "InPost Kurier Standard", requiresPoint: false, enabled: true, freeAboveThreshold: true },
        { code: "inpost-kurier-cod", label: "Kurier InPost – pobranie", price: 23.99, baselinkerName: "InPost Kurier Pobranie", requiresPoint: false, enabled: true, freeAboveThreshold: false },
        orlenPaczka,
        { code: "pickup", label: "Odbiór osobisty – Białystok, ul. Gen. Andersa 40", price: 0, baselinkerName: "Odbiór osobisty", requiresPoint: false, enabled: true, freeAboveThreshold: true },
      ],
      paymentMethods: [
        { code: "p24", label: "BLIK, szybki przelew, karta (Przelewy24)", provider: "przelewy24", baselinkerName: "Przelewy24", enabled: true },
        { code: "transfer", label: "Przelew tradycyjny (mBank)", provider: "transfer", baselinkerName: "Przelew bankowy", enabled: true },
        { code: "cod", label: "Za pobraniem", provider: "cod", baselinkerName: "Pobranie", enabled: true },
      ],
    } as never,
  });
  log("ustawienia sklepu: dostawy i płatności");
} else if (!store.shippingMethods.some((m) => m.code.startsWith("orlen"))) {
  await payload.updateGlobal({
    slug: "store-settings",
    data: { shippingMethods: withOrlenPaczka(store.shippingMethods) } as never,
  });
  log("ustawienia sklepu: dopisano ORLEN Paczkę");
}

// 6) Strona główna – polecane produkty SONAX (banery dodaje się w panelu)
const home = await payload.findGlobal({ slug: "homepage" });
if (!home.featuredProducts?.length) {
  const featured = await payload.find({ collection: "products", where: { and: [{ brand: { equals: "Sonax" } }, { stock: { greater_than: 0 } }] }, limit: 8, depth: 0, sort: "-price" });
  await payload.updateGlobal({
    slug: "homepage",
    data: { featuredTitle: "Wybór detailerów – SONAX", featuredProducts: featured.docs.map((d) => d.id), _status: "published" } as never,
  });
  log("strona główna: polecane");
}

log("gotowe ✔");
process.exit(0);
