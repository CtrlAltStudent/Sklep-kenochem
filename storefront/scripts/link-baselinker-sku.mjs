// Jednorazowe spięcie produktów sklepu z BaseLinkerem po SKU/EAN (bez zmiany nazw i cen).
import { DatabaseSync } from "node:sqlite";

const token = process.env.BASELINKER_TOKEN?.trim();
const dbPath = (process.env.DATABASE_URL || "file:/data/sonax.db").replace(/^file:/, "");
const preferred = Number(process.env.BASELINKER_INVENTORY_ID || 24536);
if (!token) {
  console.error("Brak BASELINKER_TOKEN");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const normSku = (v) => String(v ?? "").trim().toLowerCase();
const normEan = (v) => String(v ?? "").replace(/\D/g, "");

async function bl(method, parameters = {}) {
  const res = await fetch("https://api.baselinker.com/connector.php", {
    method: "POST",
    headers: { "X-BLToken": token, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ method, parameters: JSON.stringify(parameters) }),
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json();
  if (json.status !== "SUCCESS") throw new Error(`${method}: ${json.error_code} ${json.error_message}`);
  await sleep(700);
  return json;
}

async function listAll(inventoryId) {
  const all = [];
  for (let page = 1; ; page++) {
    const res = await bl("getInventoryProductsList", { inventory_id: inventoryId, page });
    const items = Object.values(res.products ?? {});
    all.push(...items);
    if (items.length < 1000) break;
  }
  return all;
}

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA busy_timeout=8000;");
const shop = db.prepare("SELECT id, sku, ean, baselinker_id FROM products").all();
const bySku = new Map();
const byEan = new Map();
for (const p of shop) {
  const sku = normSku(p.sku);
  if (sku) bySku.set(sku, [...(bySku.get(sku) ?? []), p]);
  const ean = normEan(p.ean);
  if (ean) byEan.set(ean, [...(byEan.get(ean) ?? []), p]);
}

const inv = await bl("getInventories");
const catalogs = [...(inv.inventories ?? [])].sort((a, b) => (a.inventory_id === preferred ? -1 : b.inventory_id === preferred ? 1 : 0));
console.log("Katalogi:", catalogs.map((c) => `${c.inventory_id} ${c.name}`).join(" | "));

const takenShop = new Set();
let linked = 0;
let already = 0;
let inBl = 0;
const perCat = [];

const upd = db.prepare("UPDATE products SET baselinker_id = ?, updated_at = datetime('now') WHERE id = ? AND baselinker_id IS NULL");

for (const catalog of catalogs) {
  const list = await listAll(catalog.inventory_id);
  inBl += list.length;
  let catLinked = 0;
  for (const item of list) {
    if (item.parent_id) continue;
    const sku = normSku(item.sku);
    const ean = normEan(item.ean);
    const candidates = (sku && bySku.get(sku)) || (ean && byEan.get(ean)) || [];
    const shopP = candidates.find((p) => !takenShop.has(p.id));
    if (!shopP) continue;
    takenShop.add(shopP.id);
    if (shopP.baselinker_id) {
      already++;
      continue;
    }
    const r = upd.run(item.id, shopP.id);
    if (r.changes) {
      linked++;
      catLinked++;
      shopP.baselinker_id = item.id;
    }
  }
  perCat.push(`${catalog.name || catalog.inventory_id}: ${list.length} w BL, spięto ${catLinked}`);
}

db.prepare("UPDATE baselinker_settings SET auto_send = 1, send_when = 'paid', extra_field1 = 'orderNumber', updated_at = datetime('now')").run();
db.close();

const unmatched = shop.filter((p) => !p.baselinker_id && !takenShop.has(p.id)).length;
console.log(perCat.join("\n"));
console.log(`Spięto ${linked}, już miało ID ${already}, bez pary ${unmatched}, produktów w BL ${inBl}`);
console.log("Auto-wysyłka zamówień: włączona. Numer ze sklepu idzie w polu extra_field_1.");
