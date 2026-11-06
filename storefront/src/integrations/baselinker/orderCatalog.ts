// Numer produktu w zamówieniu dla BaseLinkera.
// W sklepie zapisany jest numer z katalogu „Kenochem główny”. Zamówienia Sonaxu mają iść z numerem z katalogu „Sonax”
// (tam te same towary mają inne numery i swoje zdjęcia). Wynik trzymamy w pliku obok bazy, żeby nie pytać BaseLinkera przy każdym pobraniu.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { dataDir } from "@/lib/dataDir";
import { blActive, blCall } from "./client";

const CATALOG = 24536;

type Cache = Record<string, number>;
let mem: Cache | null = null;

function file() {
  return path.join(dataDir(), "bl-order-ids.json");
}

function load(): Cache {
  if (mem) return mem;
  try {
    mem = JSON.parse(readFileSync(file(), "utf8")) as Cache;
  } catch {
    mem = {};
  }
  return mem;
}

function save(cache: Cache) {
  mem = cache;
  try {
    const dir = dataDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(file(), JSON.stringify(cache));
  } catch {
    // brak pliku nie blokuje zamówienia – wtedy idzie numer ze sklepu
  }
}

export async function catalogIds(skus: string[]) {
  const cache = load();
  const map = new Map<string, number>();
  const need: string[] = [];
  for (const raw of skus) {
    const sku = raw.trim().toLowerCase();
    if (!sku) continue;
    if (cache[sku]) map.set(sku, cache[sku]);
    else if (!need.includes(sku)) need.push(raw.trim());
  }
  if (!need.length || !blActive()) return map;
  let changed = false;
  for (const raw of need) {
    try {
      const res = await blCall<{ products?: Record<string, { sku?: string }> }>("getInventoryProductsList", { inventory_id: CATALOG, filter_sku: raw });
      const hit = Object.entries(res.products ?? {}).find(([, p]) => (p.sku ?? "").toLowerCase() === raw.toLowerCase());
      if (!hit) continue;
      const id = Number(hit[0]);
      cache[raw.toLowerCase()] = id;
      map.set(raw.toLowerCase(), id);
      changed = true;
    } catch {
      // bez numeru z katalogu zostaje numer sklepu, zdjęcie i tak wraca z naszego sklepu
    }
  }
  if (changed) save(cache);
  return map;
}

export async function skusForCatalogIds(ids: number[]) {
  const cache = load();
  const reverse = new Map<number, string>();
  for (const [sku, id] of Object.entries(cache)) reverse.set(Number(id), sku);
  const missing = ids.filter((id) => id > 0 && !reverse.has(id));
  if (!missing.length || !blActive()) return reverse;
  try {
    const res = await blCall<{ products?: Record<string, { sku?: string }> }>("getInventoryProductsData", { inventory_id: CATALOG, products: missing });
    let changed = false;
    for (const [id, p] of Object.entries(res.products ?? {})) {
      const sku = (p.sku ?? "").trim();
      if (!sku) continue;
      reverse.set(Number(id), sku);
      cache[sku.toLowerCase()] = Number(id);
      changed = true;
    }
    if (changed) save(cache);
  } catch {
    // zdjęcie da się oddać po numerze sklepu
  }
  return reverse;
}

const CATALOG_STORAGE = 24536;
let linking = false;
let linkedAt = 0;

type BLLine = { order_product_id: number; storage?: string; storage_id?: number | string; product_id?: string; sku?: string };
type BLOrder = { order_id: number; order_source?: string; extra_field_1?: string; date_add?: number; date_confirmed?: number; products?: BLLine[] };

// Pozycja ze sklepu jest tylko numerem i linkiem do strony. Po podmianie na katalog BaseLinkera klik otwiera produkt w katalogu, a zdjęcie bierze się stamtąd.
export function scheduleCatalogLink() {
  const now = Date.now();
  if (linking || now - linkedAt < 60_000) return;
  linking = true;
  setTimeout(() => {
    linkCatalogLines()
      .catch(() => undefined)
      .finally(() => {
        linking = false;
        linkedAt = Date.now();
      });
  }, 8000);
}

export async function linkCatalogLines() {
  if (!blActive()) return;
  let from = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
  for (let page = 0; page < 8; page++) {
    const res = await blCall<{ orders?: BLOrder[] }>("getOrders", { date_from: from, get_unconfirmed_orders: true });
    const orders = res.orders ?? [];
    for (const order of orders) {
      if (order.order_source !== "shop" || !String(order.extra_field_1 ?? "").startsWith("SX")) continue;
      for (const line of order.products ?? []) {
        if (line.storage === "db" && Number(line.storage_id) === CATALOG_STORAGE) continue;
        const sku = (line.sku ?? "").trim();
        if (!sku) continue;
        const id = (await catalogIds([sku])).get(sku.toLowerCase());
        if (!id) continue;
        await blCall("setOrderProductFields", {
          order_id: order.order_id,
          order_product_id: line.order_product_id,
          storage: "db",
          storage_id: CATALOG_STORAGE,
          product_id: String(id),
        });
      }
    }
    if (orders.length < 100) break;
    const last = orders[orders.length - 1];
    const next = Number(last.date_add || last.date_confirmed || 0) + 1;
    if (!next || next <= from) break;
    from = next;
  }
}
