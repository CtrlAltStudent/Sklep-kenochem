import fs from "node:fs";
import { parse } from "csv-parse/sync";
const rows = parse(fs.readFileSync(process.argv[2]), { columns: true, delimiter: ";", bom: true, relax_quotes: true });
const shop = JSON.parse(fs.readFileSync("scripts/sonax-shop.json", "utf8"));
const bySku = new Map();
for (const r of rows) if (r.produkt_sku) bySku.set(r.produkt_sku.trim().toLowerCase(), r);
let same = 0, diff = [], hosts = {}, shopHosts = {}, noImg = 0, stock0 = 0, oos = 0, sale = 0;
const seen = new Map();
for (const p of shop.products) {
  const r = bySku.get((p.sku || "").trim().toLowerCase());
  if (!r) continue;
  seen.set(r.produkt_id, (seen.get(r.produkt_id) || 0) + 1);
  const c = parseFloat(r.cena.replace(",", "."));
  if (Math.abs(c - p.regular) < 0.02 || Math.abs(c - p.price) < 0.02) same++; else diff.push(`${p.sku} csv=${c} sklep=${p.regular}/${p.price}`);
  if (p.price < p.regular) sale++;
  const u = r.zdjecie; if (!u) noImg++; else { const h = new URL(u).host; hosts[h] = (hosts[h] || 0) + 1; }
  if (p.images[0]) { const h = new URL(p.images[0]).host; shopHosts[h] = (shopHosts[h] || 0) + 1; }
  if (!(parseInt(r.ilosc) > 0)) stock0++;
  if (!p.inStock) oos++;
}
console.log({ same, diff: diff.length, sale, noImg, stock0, oosOnShop: oos, hosts, shopHosts });
console.log(diff.slice(0, 15).join("\n"));
console.log("duplikaty:", [...seen].filter(([, n]) => n > 1).length);
console.log("sklep kategorie na produkt:", shop.products.slice(0, 5).map((p) => p.categories));
