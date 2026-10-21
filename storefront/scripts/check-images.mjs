// Sprawdza adresy zdjęć w src/data/products.json.
// Część plików .png na kenochem.com istnieje tylko jako .jpg – takie adresy są podmieniane,
// a zdjęcia, których nie da się pobrać, usuwane z listy.
// Wyniki trafiają do scripts/image-cache.json, więc kolejne uruchomienia (i ponowny import CSV)
// sprawdzają tylko nowe adresy.
// Użycie: node scripts/check-images.mjs

import fs from "node:fs";
import path from "node:path";
import { applyImageCache, CACHE_FILE, loadImageCache } from "./image-cache.mjs";

const file = path.join(import.meta.dirname, "..", "src", "data", "products.json");
const products = JSON.parse(fs.readFileSync(file, "utf8"));
const cache = loadImageCache();
const UA = { "User-Agent": "Mozilla/5.0 (KenochemImport)" };

async function ok(url) {
  try {
    const r = await fetch(url, { method: "HEAD", headers: UA, redirect: "follow", signal: AbortSignal.timeout(15000) });
    return r.ok && (r.headers.get("content-type") || "").startsWith("image/");
  } catch {
    return false;
  }
}

async function resolve(url) {
  if (await ok(url)) return url;
  for (const alt of [url.replace(/\.png$/i, ".jpg"), url.replace(/\.jpe?g$/i, ".png"), url.replace(/\.\w+$/, ".webp")]) {
    if (alt !== url && (await ok(alt))) return alt;
  }
  return null;
}

const queue = [...new Set(products.flatMap((p) => p.images))].filter((u) => !(u in cache));
const total = queue.length;
console.log(`Do sprawdzenia: ${total} nowych adresów (w pamięci: ${Object.keys(cache).length}).`);
let done = 0;
// Ostrożnie: kenochem.com to działający sklep na małym serwerze – max 2 zapytania naraz z przerwą.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await Promise.all(
  Array.from({ length: 2 }, async () => {
    while (queue.length) {
      const u = queue.shift();
      cache[u] = await resolve(u);
      await sleep(250);
      if (++done % 500 === 0) {
        console.log(`${done}/${total}`);
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
      }
    }
  }),
);
fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));

const stats = applyImageCache(products, cache);
fs.writeFileSync(file, JSON.stringify(products));
console.log(`Poprawiono ${stats.fixed} adresów, usunięto ${stats.dropped} niedziałających.`);
console.log(`Produkty bez zdjęcia: ${products.filter((p) => !p.images.length).length}`);
