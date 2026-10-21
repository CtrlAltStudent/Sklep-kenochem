// Pobiera listę produktów i kategorii z obecnego sklepu WooCommerce sonax.sklep.pl (publiczne Store API).
// Wynik: scripts/sonax-shop.json – używany przez import-products.mjs do wyboru produktów (tylko te ze strony)
// i przekierowań starych adresów.
// Użycie: node scripts/fetch-sonax-shop.mjs

import fs from "node:fs";
import path from "node:path";

const BASE = "https://www.sonax.sklep.pl/wp-json/wc/store/v1";
const UA = { "User-Agent": "Mozilla/5.0 (SonaxImport)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return { data: await r.json(), pages: +(r.headers.get("x-wp-totalpages") || 1) };
}

const { data: categories } = await get(`${BASE}/products/categories?per_page=100`);

const products = [];
for (let page = 1, pages = 1; page <= pages; page++) {
  const res = await get(`${BASE}/products?per_page=100&page=${page}`);
  pages = res.pages;
  products.push(...res.data);
  console.log(`strona ${page}/${pages}: ${products.length}`);
  await sleep(1000);
}

const out = {
  fetchedAt: new Date().toISOString(),
  categories: categories.map((c) => ({ id: c.id, parent: c.parent, name: c.name, slug: c.slug, count: c.count })),
  products: products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    permalink: p.permalink,
    sku: p.sku,
    price: +p.prices.price / 10 ** p.prices.currency_minor_unit,
    regular: +p.prices.regular_price / 10 ** p.prices.currency_minor_unit,
    inStock: p.is_in_stock,
    categories: p.categories.map((c) => c.slug),
    images: p.images.map((i) => i.src),
  })),
};
fs.writeFileSync(path.join(import.meta.dirname, "sonax-shop.json"), JSON.stringify(out, null, 1));
console.log(`Zapisano ${out.products.length} produktów, ${out.categories.length} kategorii.`);
