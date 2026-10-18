// Wspólna pamięć wyników sprawdzania zdjęć (adres → działający adres albo null).
import fs from "node:fs";
import path from "node:path";

export const CACHE_FILE = path.join(import.meta.dirname, "image-cache.json");

export function loadImageCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

// Podmienia adresy według pamięci; adresy jeszcze niesprawdzone zostawia bez zmian.
export function applyImageCache(products, cache) {
  let fixed = 0, dropped = 0;
  for (const p of products) {
    const out = [];
    for (const u of p.images) {
      if (!(u in cache)) out.push(u);
      else if (cache[u] === null) dropped++;
      else {
        if (cache[u] !== u) fixed++;
        out.push(cache[u]);
      }
    }
    p.images = [...new Set(out)];
  }
  return { fixed, dropped };
}
