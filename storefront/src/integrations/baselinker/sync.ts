// Synchronizacja katalogu BaseLinker → produkty w panelu.
//
// syncProducts: pełne dane (nazwa, opis, zdjęcia, ceny, stany, kategoria) – np. raz na dobę
// syncStock:    tylko stany i ceny – lekka, można uruchamiać często
// Oba tryby mają opcję dryRun: liczą zmiany i pokazują przykłady, niczego nie zapisując.

import type { Payload } from "payload";
import { blCall } from "./client";
import { writeLog } from "./log";
import type { BLProductData, BLProductListItem, BLStockItem } from "./types";
import type { BaselinkerSetting, Product } from "@/payload-types";

const BATCH = 100; // produktów na jedno zapytanie getInventoryProductsData

type Settings = BaselinkerSetting;

async function settings(payload: Payload): Promise<Settings> {
  const s = await payload.findGlobal({ slug: "baselinker-settings", overrideAccess: true });
  if (!s.inventoryId) throw new Error("Ustaw „ID katalogu (inventory_id)” w Integracje → BaseLinker.");
  return s;
}

// Teksty mają klucze typu "name", "name|pl" albo "name|pl|1234" (nadpisanie dla źródła).
function textField(fields: Record<string, unknown>, key: string, lang: string): string {
  const v = fields[`${key}|${lang}`] ?? fields[key];
  return typeof v === "string" ? v : "";
}

async function listAllProducts(inventoryId: number) {
  const all: BLProductListItem[] = [];
  for (let page = 1; ; page++) {
    const res = await blCall<{ products: Record<string, BLProductListItem> }>("getInventoryProductsList", { inventory_id: inventoryId, page });
    const items = Object.values(res.products ?? {});
    all.push(...items);
    if (items.length < 1000) break; // API zwraca do 1000 produktów na stronę
  }
  return all;
}

async function categoryMap(payload: Payload) {
  const { docs } = await payload.find({ collection: "categories", limit: 1000, depth: 0, overrideAccess: true });
  const map = new Map<number, number>();
  for (const c of docs) for (const r of c.baselinkerCategoryIds ?? []) map.set(Number(r.id), c.id);
  return map;
}

// Istniejący produkt: po ID BaseLinkera, a jeśli go brak (np. produkty z importu CSV) – po SKU, potem po EAN.
// Dzięki temu pierwsza synchronizacja nie tworzy duplikatów, tylko „podpina” istniejące produkty.
async function findExisting(payload: Payload, blId: number, p: BLProductData): Promise<Product | undefined> {
  const by = async (where: Record<string, unknown>) =>
    (await payload.find({ collection: "products", where: where as never, limit: 1, depth: 0, overrideAccess: true })).docs[0];
  // SQLite LIKE porównuje SKU bez rozróżniania wielkości liter (Son000061 = son000061)
  const sku = p.sku?.trim();
  const ean = p.ean?.trim();
  return (
    (await by({ baselinkerId: { equals: blId } })) ??
    (sku ? await by({ and: [{ sku: { like: sku } }, { baselinkerId: { exists: false } }] }) : undefined) ??
    (ean ? await by({ and: [{ ean: { like: ean } }, { baselinkerId: { exists: false } }] }) : undefined)
  );
}

const normSku = (v: unknown) => String(v ?? "").trim().toLowerCase();
const normEan = (v: unknown) => String(v ?? "").replace(/\D/g, "");

// Lekkie spięcie: tylko wpisuje ID BaseLinkera po SKU/EAN. Nie nadpisuje nazw, cen ani zdjęć.
// Przeszukuje wszystkie katalogi na koncie, najpierw ten ustawiony w panelu (Sonax).
export async function linkBySku(payload: Payload) {
  const startedAt = Date.now();
  const s = await payload.findGlobal({ slug: "baselinker-settings", overrideAccess: true });
  const preferred = Number(s.inventoryId || 0);
  const stats = { catalogs: 0, inBl: 0, linked: 0, already: 0, unmatched: 0 };
  try {
    const inv = await blCall<{ inventories: { inventory_id: number; name?: string }[] }>("getInventories");
    const catalogs = [...(inv.inventories ?? [])].sort((a, b) => (a.inventory_id === preferred ? -1 : b.inventory_id === preferred ? 1 : 0));
    const shop = await payload.find({ collection: "products", limit: 0, pagination: false, depth: 0, overrideAccess: true });
    const bySku = new Map<string, Product[]>();
    const byEan = new Map<string, Product[]>();
    for (const p of shop.docs) {
      const sku = normSku(p.sku);
      if (sku) bySku.set(sku, [...(bySku.get(sku) ?? []), p]);
      const ean = normEan(p.ean);
      if (ean) byEan.set(ean, [...(byEan.get(ean) ?? []), p]);
    }
    const takenShop = new Set<string | number>();
    const takenBl = new Set<number>();

    for (const catalog of catalogs) {
      stats.catalogs++;
      const list = await listAllProducts(catalog.inventory_id);
      stats.inBl += list.length;
      for (const item of list) {
        if (item.parent_id) continue;
        const candidates = (normSku(item.sku) && bySku.get(normSku(item.sku))) || (normEan(item.ean) && byEan.get(normEan(item.ean))) || [];
        const shopP = candidates.find((p) => !takenShop.has(p.id));
        if (!shopP) continue;
        takenShop.add(shopP.id);
        takenBl.add(item.id);
        if (shopP.baselinkerId) { stats.already++; continue; }
        stats.linked++;
        await payload.update({
          collection: "products",
          id: shopP.id,
          overrideAccess: true,
          data: { baselinkerId: item.id, lastSyncedAt: new Date().toISOString() },
        });
      }
    }
    stats.unmatched = shop.docs.filter((p) => !p.baselinkerId && !takenShop.has(p.id)).length;
    const message = `Powiązano po SKU/EAN: ${stats.linked} nowych, ${stats.already} już miało ID, bez pary ${stats.unmatched} (katalogów ${stats.catalogs}, produktów w BaseLinkerze ${stats.inBl}).`;
    await writeLog(payload, { type: "products", status: "success", message, startedAt, details: { stats } });
    return { ok: true, message, stats };
  } catch (e) {
    const message = (e as Error).message;
    await writeLog(payload, { type: "products", status: "error", message, startedAt, details: { stats } });
    return { ok: false, message, stats };
  }
}

// Porównanie wartości bez pól technicznych (np. id wierszy tablicy zdjęć)
const comparable = (key: string, v: unknown) =>
  JSON.stringify(key === "images" ? ((v as { url?: string | null }[] | null) ?? []).map((i) => i.url ?? null) : key === "category" && v && typeof v === "object" ? (v as { id: unknown }).id : v ?? null);

export async function syncProducts(payload: Payload, { dryRun = false, limit }: { dryRun?: boolean; limit?: number } = {}) {
  const startedAt = Date.now();
  const s = await settings(payload);
  const sync = s.sync ?? {};
  const lang = s.language || "pl";
  const warehouse = s.warehouseId as string | undefined;
  const stats = { found: 0, created: 0, linked: 0, updated: 0, unchanged: 0, hidden: 0, unmappedCategory: 0, errors: [] as string[] };
  const samples: unknown[] = [];

  try {
    let list = await listAllProducts(Number(s.inventoryId));
    list = list.filter((p) => !p.parent_id); // warianty obsługujemy w ramach produktu-rodzica
    if (limit) list = list.slice(0, limit);
    stats.found = list.length;
    const cats = await categoryMap(payload);
    const seen = new Set<number>();

    for (let i = 0; i < list.length; i += BATCH) {
      const ids = list.slice(i, i + BATCH).map((p) => p.id);
      const res = await blCall<{ products: Record<string, BLProductData> }>("getInventoryProductsData", { inventory_id: Number(s.inventoryId), products: ids });

      for (const [idStr, p] of Object.entries(res.products ?? {})) {
        const blId = Number(idStr);
        seen.add(blId);
        try {
          const existing = await findExisting(payload, blId, p);
          if (existing && !existing.baselinkerId) stats.linked++;
          const keep = existing?.keep ?? {};
          const price = s.priceGroupId ? p.prices?.[String(s.priceGroupId)] : Object.values(p.prices ?? {})[0];
          const priceB2B = s.priceGroupB2BId ? p.prices?.[String(s.priceGroupB2BId)] : undefined;
          const stock = warehouse ? p.stock?.[warehouse] : Object.values(p.stock ?? {}).reduce((a, b) => a + Number(b), 0);
          const images = Object.entries(p.images ?? {}).sort(([a], [b]) => Number(a) - Number(b)).map(([, url]) => ({ url }));
          const categoryId = cats.get(p.category_id);
          if (p.category_id && !categoryId) stats.unmappedCategory++;

          const data: Partial<Product> = {
            baselinkerId: blId,
            baselinkerCategoryId: p.category_id || null,
            source: "baselinker",
            sku: p.sku,
            ean: p.ean,
            vatRate: p.tax_rate,
            weight: p.weight,
            lastSyncedAt: new Date().toISOString(),
          };
          const name = textField(p.text_fields ?? {}, "name", lang);
          if (sync.name !== false && !keep.name && name) data.name = name;
          if (sync.description !== false && !keep.description) data.descriptionHtml = textField(p.text_fields ?? {}, "description", lang);
          if (sync.images !== false && !keep.images && images.length) data.images = images;
          if (sync.prices !== false && !keep.price && price != null) data.price = Number(price);
          if (sync.prices !== false && priceB2B != null) data.priceB2B = Number(priceB2B);
          if (sync.stock !== false && stock != null) data.stock = Number(stock);
          if (sync.category !== false && !keep.category && categoryId) data.category = categoryId;

          if (samples.length < 5) samples.push({ baselinkerId: blId, action: existing ? (existing.baselinkerId ? "update" : `link (${existing.slug})`) : "create", data });

          if (!existing) {
            stats.created++;
            if (!dryRun) await payload.create({ collection: "products", overrideAccess: true, data: { ...data, name: data.name ?? (name || `Produkt ${blId}`), price: data.price ?? 0, status: sync.newProductsHidden ? "hidden" : "active" } });
          } else {
            const changed = Object.entries(data).some(([k, v]) => k !== "lastSyncedAt" && comparable(k, existing[k as keyof Product]) !== comparable(k, v));
            if (!changed) { stats.unchanged++; continue; }
            stats.updated++;
            if (!dryRun) await payload.update({ collection: "products", id: existing.id, overrideAccess: true, data });
          }
        } catch (e) {
          stats.errors.push(`#${blId}: ${(e as Error).message}`);
        }
      }
    }

    // Produkty, których nie ma już w BaseLinkerze → ukryj (tylko przy pełnej synchronizacji)
    if (sync.hideMissing !== false && !limit) {
      const { docs } = await payload.find({ collection: "products", where: { and: [{ source: { equals: "baselinker" } }, { status: { equals: "active" } }] }, limit: 0, depth: 0, overrideAccess: true, pagination: false });
      for (const d of docs) {
        if (d.baselinkerId && !seen.has(Number(d.baselinkerId))) {
          stats.hidden++;
          if (!dryRun) await payload.update({ collection: "products", id: d.id, overrideAccess: true, data: { status: "hidden" } });
        }
      }
    }

    if (!dryRun) await payload.updateGlobal({ slug: "baselinker-settings", overrideAccess: true, data: { lastProductSyncAt: new Date().toISOString() } });
    const message = `${dryRun ? "[podgląd] " : ""}Produkty: ${stats.found} w BaseLinkerze, nowe ${stats.created}, powiązane z istniejącymi (SKU/EAN) ${stats.linked}, zmienione ${stats.updated}, bez zmian ${stats.unchanged}, ukryte ${stats.hidden}` +
      (stats.unmappedCategory ? `, bez przypisanej kategorii ${stats.unmappedCategory}` : "") + (stats.errors.length ? `, błędy ${stats.errors.length}` : "");
    await writeLog(payload, { type: "products", status: stats.errors.length ? "warning" : "success", message, startedAt, dryRun, details: { stats, samples } });
    return { ok: true, message, stats, samples };
  } catch (e) {
    const message = (e as Error).message;
    await writeLog(payload, { type: "products", status: "error", message, startedAt, dryRun, details: { stats } });
    return { ok: false, message, stats, samples };
  }
}

// quiet: uruchomienie automatyczne – do dziennika tylko gdy coś się zmieniło albo był błąd
export async function syncStock(payload: Payload, { dryRun = false, quiet = false }: { dryRun?: boolean; quiet?: boolean } = {}) {
  const startedAt = Date.now();
  try {
    const s = await settings(payload);
    const warehouse = s.warehouseId as string | undefined;
    let changed = 0, checked = 0;
    const samples: unknown[] = [];

    for (let page = 1; ; page++) {
      const res = await blCall<{ products: Record<string, BLStockItem> }>("getInventoryProductsStock", { inventory_id: Number(s.inventoryId), page });
      const items = Object.values(res.products ?? {});
      for (const it of items) {
        checked++;
        const qty = warehouse ? Number(it.stock?.[warehouse] ?? 0) : Object.values(it.stock ?? {}).reduce((a, b) => a + Number(b), 0);
        const existing = (await payload.find({ collection: "products", where: { baselinkerId: { equals: it.product_id } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
        if (!existing || Number(existing.stock) === qty) continue;
        changed++;
        if (samples.length < 10) samples.push({ name: existing.name, from: existing.stock, to: qty });
        if (!dryRun) await payload.update({ collection: "products", id: existing.id, overrideAccess: true, data: { stock: qty } });
      }
      if (items.length < 1000) break;
    }

    if (!dryRun) await payload.updateGlobal({ slug: "baselinker-settings", overrideAccess: true, data: { lastStockSyncAt: new Date().toISOString() } });
    const message = `${dryRun ? "[podgląd] " : ""}Stany: sprawdzono ${checked}, zmieniono ${changed}`;
    if (!quiet || changed) await writeLog(payload, { type: "stock", status: "success", message, startedAt, dryRun, details: { samples } });
    return { ok: true, message, samples };
  } catch (e) {
    const message = (e as Error).message;
    await writeLog(payload, { type: "stock", status: "error", message, startedAt, dryRun });
    return { ok: false, message };
  }
}

// Test połączenia: pobiera wszystko, czego potrzeba do uzupełnienia ustawień
export async function testConnection(payload: Payload) {
  const startedAt = Date.now();
  try {
    const inv = await blCall<{ inventories: unknown[] }>("getInventories");
    const [groups, warehouses, statuses, sources] = await Promise.all([
      blCall<{ price_groups: unknown[] }>("getInventoryPriceGroups"),
      blCall<{ warehouses: unknown[] }>("getInventoryWarehouses"),
      blCall<{ statuses: unknown[] }>("getOrderStatusList"),
      blCall<{ sources: unknown }>("getOrderSources"),
    ]);
    const s = await payload.findGlobal({ slug: "baselinker-settings", overrideAccess: true });
    let categories: unknown[] = [];
    if (s.inventoryId) {
      try {
        categories = (await blCall<{ categories: unknown[] }>("getInventoryCategories", { inventory_id: Number(s.inventoryId) })).categories;
      } catch {
        categories = [];
      }
    }
    const result = { inventories: inv.inventories, priceGroups: groups.price_groups, warehouses: warehouses.warehouses, statuses: statuses.statuses, sources: sources.sources, categories };
    await writeLog(payload, { type: "test", status: "success", message: "Połączenie z BaseLinkerem działa", startedAt, details: result });
    return { ok: true, message: "Połączenie działa", ...result };
  } catch (e) {
    const message = (e as Error).message;
    await writeLog(payload, { type: "test", status: "error", message, startedAt });
    return { ok: false, message };
  }
}
