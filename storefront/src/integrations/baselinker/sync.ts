// Synchronizacja katalogu BaseLinker → produkty w panelu.
//
// syncProducts: pełne dane (nazwa, opis, zdjęcia, ceny, stany, kategoria) – np. raz na dobę
// syncStock:    tylko stany i ceny – lekka, można uruchamiać często
// Oba tryby mają opcję dryRun: liczą zmiany i pokazują przykłady, niczego nie zapisując.

import type { Payload } from "payload";
import { slugify } from "@/payload/fields";
import { blCall } from "./client";
import { writeLog } from "./log";
import type { BLCategory, BLProductData, BLProductListItem, BLStockItem } from "./types";
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

type ShopCat = { id: number; name: string; parent: number | null; blIds: number[] };

async function loadShopCategories(payload: Payload) {
  const { docs } = await payload.find({ collection: "categories", limit: 0, pagination: false, depth: 0, overrideAccess: true });
  const map = new Map<number, number>();
  const used = new Set<string>();
  const rows: ShopCat[] = [];
  for (const c of docs) {
    if (c.slug) used.add(c.slug);
    const blIds = (c.baselinkerCategoryIds ?? []).map((r) => Number(r.id)).filter((n) => n > 0);
    for (const id of blIds) map.set(id, c.id);
    const parent = c.parent == null ? null : typeof c.parent === "object" ? c.parent.id : c.parent;
    rows.push({ id: c.id, name: c.name, parent, blIds });
  }
  return { map, used, rows };
}

function freshSlug(name: string, blId: number, used: Set<string>) {
  const base = slugify(name) || `kategoria-${blId}`;
  const slug = used.has(base) ? `${base}-${blId}`.slice(0, 100) : base;
  used.add(slug);
  return slug;
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

export async function syncProducts(payload: Payload, { dryRun = false, limit, ids, picks }: { dryRun?: boolean; limit?: number; ids?: number[]; picks?: { id: number; inventoryId?: number }[] } = {}) {
  const startedAt = Date.now();
  const s = await settings(payload);
  const sync = s.sync ?? {};
  const lang = s.language || "pl";
  const warehouse = s.warehouseId as string | undefined;
  const stats = { found: 0, created: 0, linked: 0, updated: 0, unchanged: 0, hidden: 0, categoriesCreated: 0, unmappedCategory: 0, bundles: 0, bundlesSkipped: 0, errors: [] as string[] };
  const samples: unknown[] = [];

  try {
    const home = Number(s.inventoryId);
    const explicit = (picks?.length ? picks : (ids ?? []).map((id) => ({ id: Number(id), inventoryId: home })))
      .map((p) => ({ id: Number(p.id), inventoryId: Number(p.inventoryId) || home }))
      .filter((p) => p.id > 0)
      .slice(0, 100);
    const seenPick = new Set<string>();
    const picked = explicit.filter((p) => {
      const k = `${p.inventoryId}:${p.id}`;
      if (seenPick.has(k)) return false;
      seenPick.add(k);
      return true;
    });
    let list = picked.length
      ? picked
      : (await listAllProducts(home)).filter((p) => !p.parent_id).map((p) => ({ id: p.id, inventoryId: home }));
    if (!picked.length && limit) list = list.slice(0, limit);
    stats.found = list.length;
    const shopCats = await loadShopCategories(payload);
    const blTrees = new Map<number, Map<number, BLCategory>>();
    const blTree = async (inventoryId: number) => {
      const cached = blTrees.get(inventoryId);
      if (cached) return cached;
      try {
        const res = await blCall<{ categories: BLCategory[] }>("getInventoryCategories", { inventory_id: inventoryId });
        const tree = new Map((res.categories ?? []).map((c) => [Number(c.category_id), c]));
        blTrees.set(inventoryId, tree);
        return tree;
      } catch (e) {
        blTrees.set(inventoryId, new Map());
        stats.errors.push(`Kategorie katalogu ${inventoryId}: ${(e as Error).message}`);
        return blTrees.get(inventoryId)!;
      }
    };
    // Brak ręcznego przypisania: utwórz w sklepie tę samą ścieżkę kategorii (rodzic › … › liść) i zapamiętaj ID BaseLinkera.
    const ensureCategory = async (blId: number, inventoryId: number): Promise<number | undefined> => {
      if (!blId) return;
      const known = shopCats.map.get(blId);
      if (known) return known;
      const tree = await blTree(inventoryId);
      const chain: BLCategory[] = [];
      const guard = new Set<number>();
      let cur = tree.get(blId);
      while (cur && !guard.has(cur.category_id)) {
        guard.add(cur.category_id);
        chain.unshift(cur);
        cur = cur.parent_id ? tree.get(Number(cur.parent_id)) : undefined;
      }
      if (!chain.length) return;
      let parentShop: number | undefined;
      for (const node of chain) {
        const hit = shopCats.map.get(node.category_id);
        if (hit) { parentShop = hit > 0 ? hit : parentShop; continue; }
        const name = (node.name || `Kategoria ${node.category_id}`).trim();
        const named = shopCats.rows.filter((c) => c.name.trim().toLowerCase() === name.toLowerCase());
        const same = named.find((c) => (c.parent ?? 0) === (parentShop ?? 0)) ?? (named.length === 1 ? named[0] : undefined);
        if (same) {
          shopCats.map.set(node.category_id, same.id);
          if (!same.blIds.includes(node.category_id)) {
            same.blIds.push(node.category_id);
            if (!dryRun) await payload.update({ collection: "categories", id: same.id, overrideAccess: true, data: { baselinkerCategoryIds: same.blIds.map((id) => ({ id })) } });
          }
          parentShop = same.id;
          continue;
        }
        stats.categoriesCreated++;
        if (dryRun) {
          shopCats.map.set(node.category_id, -node.category_id);
          parentShop = undefined;
          continue;
        }
        const created = await payload.create({
          collection: "categories",
          overrideAccess: true,
          data: { name, slug: freshSlug(name, node.category_id, shopCats.used), parent: parentShop, order: 0, baselinkerCategoryIds: [{ id: node.category_id }] },
        });
        shopCats.map.set(node.category_id, created.id);
        shopCats.rows.push({ id: created.id, name, parent: parentShop ?? null, blIds: [node.category_id] });
        parentShop = created.id;
      }
      const resolved = shopCats.map.get(blId);
      return resolved && resolved > 0 ? resolved : undefined;
    };
    type SkuRow = { id: number; name: string; sku: string; bundle?: boolean | null };
    const skuIndex = new Map<string, SkuRow[]>();
    const rememberSku = (row: SkuRow) => {
      const key = normSku(row.sku);
      if (!key) return;
      skuIndex.set(key, [...(skuIndex.get(key) ?? []).filter((x) => x.id !== row.id), row]);
    };
    const { docs: skuDocs } = await payload.find({ collection: "products", limit: 0, pagination: false, depth: 0, overrideAccess: true, select: { sku: true, name: true, bundle: true } });
    for (const d of skuDocs) if (d.sku) rememberSku({ id: d.id, name: d.name, sku: d.sku, bundle: d.bundle });
    const blSkuCache = new Map<string, string>();
    const pieceQty = (v: unknown) => {
      const n = typeof v === "number" ? v : v && typeof v === "object" && "quantity" in v ? Number((v as { quantity: unknown }).quantity) : 1;
      return Number.isFinite(n) && n > 0 ? n : 1;
    };
    const resolveBundle = async (inventoryId: number, p: BLProductData) => {
      const raw = p.bundle_products ?? {};
      const ids = [...new Set(Object.keys(raw).map(Number).filter((n) => n > 0))];
      if (!ids.length) return { ok: false as const, message: "zestaw nie ma składników w BaseLinkerze" };
      const absent = ids.filter((id) => !blSkuCache.has(`${inventoryId}:${id}`));
      for (let i = 0; i < absent.length; i += BATCH) {
        const batch = absent.slice(i, i + BATCH);
        const res = await blCall<{ products: Record<string, BLProductData> }>("getInventoryProductsData", { inventory_id: inventoryId, products: batch });
        for (const id of batch) blSkuCache.set(`${inventoryId}:${id}`, String(res.products?.[String(id)]?.sku ?? "").trim());
      }
      const parts = ids.map((id) => ({ id, sku: blSkuCache.get(`${inventoryId}:${id}`) || "", qty: pieceQty(raw[String(id)]) }));
      const noSku = parts.filter((x) => !x.sku);
      if (noSku.length) return { ok: false as const, message: `składnik bez SKU (ID ${noSku.map((x) => x.id).join(", ")})` };
      const items: { product: number; sku: string; quantity: number }[] = [];
      const problems: string[] = [];
      for (const part of parts) {
        const hits = skuIndex.get(normSku(part.sku)) ?? [];
        if (!hits.length) problems.push(`${part.sku} nie ma w sklepie`);
        else if (hits.length > 1) problems.push(`${part.sku} jest w sklepie więcej niż raz`);
        else if (hits[0].bundle) problems.push(`${part.sku} to zestaw, nie pojedynczy produkt`);
        else items.push({ product: hits[0].id, sku: hits[0].sku, quantity: part.qty });
      }
      if (problems.length) return { ok: false as const, message: problems.join("; ") };
      return { ok: true as const, items };
    };
    const seen = new Set<number>();
    const byInventory = new Map<number, number[]>();
    for (const item of list) {
      const bucket = byInventory.get(item.inventoryId) ?? [];
      bucket.push(item.id);
      byInventory.set(item.inventoryId, bucket);
    }

    for (const [inventoryId, allIds] of byInventory) {
    const fetched: { blId: number; p: BLProductData }[] = [];
    for (let i = 0; i < allIds.length; i += BATCH) {
      const batch = allIds.slice(i, i + BATCH);
      const res = await blCall<{ products: Record<string, BLProductData> }>("getInventoryProductsData", { inventory_id: inventoryId, products: batch });
      for (const [idStr, p] of Object.entries(res.products ?? {})) fetched.push({ blId: Number(idStr), p });
    }
    fetched.sort((a, b) => Number(Boolean(a.p.is_bundle)) - Number(Boolean(b.p.is_bundle)));

    for (const { blId, p } of fetched) {
        seen.add(blId);
        try {
          const existing = await findExisting(payload, blId, p);
          if (existing && !existing.baselinkerId) stats.linked++;
          const keep = existing?.keep ?? {};
          const price = (s.priceGroupId != null && p.prices?.[String(s.priceGroupId)] != null ? p.prices[String(s.priceGroupId)] : undefined) ?? Object.values(p.prices ?? {})[0];
          const priceB2B = s.priceGroupB2BId ? p.prices?.[String(s.priceGroupB2BId)] : undefined;
          const inWarehouse = warehouse && p.stock && warehouse in p.stock ? p.stock[warehouse] : undefined;
          const stock = inWarehouse != null ? inWarehouse : (!warehouse || picked.length ? Object.values(p.stock ?? {}).reduce((a, b) => a + Number(b), 0) : undefined);
          const images = Object.entries(p.images ?? {}).sort(([a], [b]) => Number(a) - Number(b)).map(([, url]) => ({ url }));
          const categoryId = sync.category === false || keep.category ? undefined : await ensureCategory(Number(p.category_id), inventoryId);
          if (p.category_id && sync.category !== false && !keep.category && !categoryId) stats.unmappedCategory++;

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
          if (p.is_bundle) {
            const resolved = await resolveBundle(inventoryId, p);
            if (!resolved.ok) {
              stats.bundlesSkipped++;
              stats.errors.push(`${p.sku || name || `#${blId}`}: zestaw pominięty – ${resolved.message}`);
              continue;
            }
            data.bundle = true;
            data.bundleItems = resolved.items;
            stats.bundles++;
          } else if (p.is_bundle === false && existing?.bundle) {
            data.bundle = false;
            data.bundleItems = [];
          }

          if (samples.length < 5) samples.push({ baselinkerId: blId, action: existing ? (existing.baselinkerId ? "update" : `link (${existing.slug})`) : "create", data });

          if (!existing) {
            stats.created++;
            if (!dryRun) {
              const created = await payload.create({ collection: "products", overrideAccess: true, data: { ...data, name: data.name ?? (name || `Produkt ${blId}`), price: data.price ?? 0, status: sync.newProductsHidden ? "hidden" : "active" } });
              if (created.sku) rememberSku({ id: created.id, name: created.name, sku: created.sku, bundle: created.bundle });
            }
          } else {
            const changed = Object.entries(data).some(([k, v]) => k !== "lastSyncedAt" && comparable(k, existing[k as keyof Product]) !== comparable(k, v));
            if (!changed) { stats.unchanged++; continue; }
            stats.updated++;
            if (!dryRun) {
              const updated = await payload.update({ collection: "products", id: existing.id, overrideAccess: true, data });
              if (updated.sku) rememberSku({ id: updated.id, name: updated.name, sku: updated.sku, bundle: updated.bundle });
            }
          }
        } catch (e) {
          stats.errors.push(`#${blId}: ${(e as Error).message}`);
        }
    }
    }

    // Produkty, których nie ma już w BaseLinkerze → ukryj (tylko przy pełnej synchronizacji)
    if (sync.hideMissing !== false && !limit && !picked.length) {
      const { docs } = await payload.find({ collection: "products", where: { and: [{ source: { equals: "baselinker" } }, { status: { equals: "active" } }] }, limit: 0, depth: 0, overrideAccess: true, pagination: false });
      for (const d of docs) {
        if (d.baselinkerId && !seen.has(Number(d.baselinkerId))) {
          stats.hidden++;
          if (!dryRun) await payload.update({ collection: "products", id: d.id, overrideAccess: true, data: { status: "hidden" } });
        }
      }
    }

    if (!dryRun) await payload.updateGlobal({ slug: "baselinker-settings", overrideAccess: true, data: { lastProductSyncAt: new Date().toISOString() } });
    const message = `${dryRun ? "[podgląd] " : ""}${picked.length ? "Wybrane produkty: " : "Produkty: "}${stats.found} w BaseLinkerze, nowe ${stats.created}, powiązane z istniejącymi (SKU/EAN) ${stats.linked}, zmienione ${stats.updated}, bez zmian ${stats.unchanged}, ukryte ${stats.hidden}` +
      (stats.bundles ? `, zestawy ${stats.bundles}` : "") +
      (stats.bundlesSkipped ? `, zestawy pominięte ${stats.bundlesSkipped}` : "") +
      (stats.categoriesCreated ? `, nowe kategorie ${stats.categoriesCreated}` : "") +
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

export type CatalogHit = {
  id: number;
  inventoryId: number;
  inventoryName: string;
  name: string;
  sku: string;
  ean: string;
  price: number | null;
  stock: number | null;
  image: string;
  variant: boolean;
  inShop: boolean;
  bundle: boolean;
  bundleMissing: string[];
};

async function listFiltered(inventoryId: number, filter: Record<string, string | number | boolean>) {
  const res = await blCall<{ products: Record<string, BLProductListItem> }>("getInventoryProductsList", {
    inventory_id: inventoryId, page: 1, include_variants: true, ...filter,
  });
  return Object.entries(res.products ?? {}).map(([key, p]) => ({
    ...p,
    id: Number(p.id || key) || 0,
    parent_id: Number(p.parent_id || 0),
  })).filter((p) => p.id > 0);
}

export type SearchField = "all" | "name" | "sku" | "ean";
export type SearchKind = "all" | "product" | "bundle";

// Szuka po nazwie (fragment), dokładnym SKU albo EAN. Warianty też wchodzą.
// field ogranicza, czego dotyczy wpis; inventoryId — jeden katalog; kind — produkt albo zestaw.
export async function searchCatalog(payload: Payload, query: string, opts: { field?: SearchField; inventoryId?: number; kind?: SearchKind } = {}) {
  const q = query.trim();
  const field: SearchField = opts.field ?? "all";
  const kind: SearchKind = opts.kind ?? "all";
  try {
    const s = await payload.findGlobal({ slug: "baselinker-settings", overrideAccess: true });
    const preferred = Number(s.inventoryId || 0);
    const inv = await blCall<{ inventories: { inventory_id: number; name?: string }[] }>("getInventories");
    const all = [...(inv.inventories ?? [])].sort((a, b) => (a.inventory_id === preferred ? -1 : b.inventory_id === preferred ? 1 : 0));
    const catalogList = all.map((c) => ({ id: c.inventory_id, name: c.name || `Katalog ${c.inventory_id}` }));
    if (q.length < 2) return { ok: true as const, message: "", products: [] as CatalogHit[], catalogs: catalogList };
    const wanted = Number(opts.inventoryId || 0);
    const catalogs = wanted ? all.filter((c) => c.inventory_id === wanted) : all;
    if (!all.length) return { ok: false as const, message: "Na koncie BaseLinkera nie ma katalogu.", products: [] as CatalogHit[], catalogs: catalogList };
    if (!catalogs.length) return { ok: false as const, message: "Nie ma takiego katalogu.", products: [] as CatalogHit[], catalogs: catalogList };

    const phrases = /[,;\n]/.test(q)
      ? [...new Set(q.split(/[,;\n]+/).map((x) => x.trim()).filter((x) => x.length >= 2))].slice(0, 20)
      : [q];

    type Row = BLProductListItem & { id: number; parent_id: number; inventoryId: number; inventoryName: string };
    const jobs: Promise<Row[]>[] = [];
    const want = (kind: SearchField) => field === "all" || field === kind;
    for (const phrase of phrases) {
      for (const catalog of catalogs) {
        const tag = async (filter: Record<string, string>) =>
          (await listFiltered(catalog.inventory_id, filter)).map((p) => ({ ...p, inventoryId: catalog.inventory_id, inventoryName: catalog.name || `Katalog ${catalog.inventory_id}` }));
        if (want("name")) jobs.push(tag({ filter_name: phrase }));
        if (!/\s/.test(phrase)) {
          if (want("sku")) {
            jobs.push(tag({ filter_sku: phrase }));
            const upper = phrase.toUpperCase();
            if (upper !== phrase) jobs.push(tag({ filter_sku: upper }));
          }
          if (want("ean") && (field === "ean" || /^\d{8,14}$/.test(phrase))) jobs.push(tag({ filter_ean: phrase }));
        }
      }
    }
    const errors: string[] = [];
    const settled = await Promise.all(jobs.map((job) => job.catch((e: Error) => {
      errors.push(e.message);
      return [] as Row[];
    })));
    const merged = new Map<string, Row>();
    for (const items of settled) for (const p of items) merged.set(`${p.inventoryId}:${p.id}`, p);
    const list = [...merged.values()].slice(0, 80);

    const images = new Map<string, string>();
    const bundleParts = new Map<string, { id: number; sku: string }[]>();
    const byInv = new Map<number, number[]>();
    for (const p of list) {
      const bucket = byInv.get(p.inventoryId) ?? [];
      bucket.push(p.id);
      byInv.set(p.inventoryId, bucket);
    }
    await Promise.all([...byInv.entries()].map(async ([inventoryId, productIds]) => {
      const data: { products: Record<string, BLProductData> } = await blCall<{ products: Record<string, BLProductData> }>("getInventoryProductsData", { inventory_id: inventoryId, products: productIds }).catch(() => ({ products: {} }));
      const extra: number[] = [];
      for (const [id, p] of Object.entries(data.products ?? {})) {
        const first = Object.entries(p.images ?? {}).sort(([a], [b]) => Number(a) - Number(b))[0];
        if (first) images.set(`${inventoryId}:${id}`, first[1]);
        if (!p.is_bundle) continue;
        const parts = Object.keys(p.bundle_products ?? {}).map(Number).filter((n) => n > 0);
        bundleParts.set(`${inventoryId}:${id}`, parts.map((partId) => ({ id: partId, sku: String(data.products?.[String(partId)]?.sku ?? "").trim() })));
        for (const partId of parts) if (!data.products?.[String(partId)]?.sku) extra.push(partId);
      }
      for (let i = 0; i < extra.length; i += 100) {
        const batch = [...new Set(extra.slice(i, i + 100))];
        const more: { products: Record<string, BLProductData> } = await blCall<{ products: Record<string, BLProductData> }>("getInventoryProductsData", { inventory_id: inventoryId, products: batch }).catch(() => ({ products: {} }));
        for (const [id, p] of Object.entries(more.products ?? {})) {
          for (const [key, parts] of bundleParts) {
            if (!key.startsWith(`${inventoryId}:`)) continue;
            const hit = parts.find((part) => String(part.id) === id && !part.sku);
            if (hit) hit.sku = String(p.sku ?? "").trim();
          }
        }
      }
    }));

    const ids = list.map((p) => p.id);
    const skus = list.map((p) => p.sku?.trim()).filter(Boolean) as string[];
    const shop = list.length
      ? (await payload.find({
          collection: "products",
          where: { or: [{ baselinkerId: { in: ids } }, ...(skus.length ? [{ sku: { in: skus } }] : [])] } as never,
          limit: 200,
          depth: 0,
          overrideAccess: true,
          select: { sku: true, baselinkerId: true },
        })).docs
      : [];
    const knownId = new Set(shop.map((p) => Number(p.baselinkerId)).filter(Boolean));
    const knownSku = new Set(shop.map((p) => normSku(p.sku)).filter(Boolean));
    const partSkus = [...bundleParts.values()].flatMap((parts) => parts.map((part) => part.sku).filter(Boolean));
    if (partSkus.length) {
      const extra = await payload.find({
        collection: "products",
        where: { or: partSkus.slice(0, 40).map((sku) => ({ sku: { like: sku } })) } as never,
        limit: 80,
        depth: 0,
        overrideAccess: true,
        select: { sku: true },
      });
      for (const d of extra.docs) knownSku.add(normSku(d.sku));
    }
    const warehouse = s.warehouseId as string | undefined;
    let products: CatalogHit[] = list.map((p) => {
      const grouped = s.priceGroupId != null ? p.prices?.[String(s.priceGroupId)] : undefined;
      const price = grouped != null ? grouped : Object.values(p.prices ?? {})[0];
      const inWarehouse = warehouse && p.stock && warehouse in p.stock ? p.stock[warehouse] : undefined;
      const stock = inWarehouse != null ? inWarehouse : Object.values(p.stock ?? {}).reduce((a, b) => a + Number(b), 0);
      return {
        id: p.id,
        inventoryId: p.inventoryId,
        inventoryName: p.inventoryName,
        name: p.name || `Produkt ${p.id}`,
        sku: p.sku || "",
        ean: p.ean || "",
        price: price == null ? null : Number(price),
        stock: Number.isFinite(Number(stock)) ? Number(stock) : null,
        image: images.get(`${p.inventoryId}:${p.id}`) || "",
        variant: p.parent_id > 0,
        inShop: knownId.has(p.id) || knownSku.has(normSku(p.sku)),
        bundle: bundleParts.has(`${p.inventoryId}:${p.id}`),
        bundleMissing: (bundleParts.get(`${p.inventoryId}:${p.id}`) ?? []).flatMap((part) => {
          if (!part.sku) return [`ID ${part.id} bez SKU`];
          return knownSku.has(normSku(part.sku)) ? [] : [part.sku];
        }),
      };
    });
    if (kind === "bundle") products = products.filter((p) => p.bundle);
    if (kind === "product") products = products.filter((p) => !p.bundle);
    products.sort((a, b) => Number(a.inShop) - Number(b.inShop) || a.name.localeCompare(b.name, "pl"));
    if (!products.length && errors.length) return { ok: false as const, message: errors[0], products, catalogs: catalogList };
    const empty = kind === "bundle" ? "W tych wynikach nie ma zestawów. Wpisz kod SKU zestawu." : "Nic nie znaleziono.";
    return { ok: true as const, message: products.length ? "" : empty, products, catalogs: catalogList };
  } catch (e) {
    return { ok: false as const, message: (e as Error).message, products: [] as CatalogHit[], catalogs: [] as { id: number; name: string }[] };
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
