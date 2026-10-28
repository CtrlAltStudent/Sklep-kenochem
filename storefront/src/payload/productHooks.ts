import { APIError, type CollectionAfterChangeHook, type CollectionAfterDeleteHook, type CollectionBeforeChangeHook } from "payload";
import { invalidateCatalog } from "@/lib/catalogCache";
import { backInStockMails } from "@/integrations/mail/events";
import { relId, unlinkDeletedParent } from "@/integrations/variants";

const DAY = 24 * 60 * 60 * 1000;
const round2 = (n: number) => Math.round(n * 100) / 100;

type Sale = { price?: number | null; from?: string | null; to?: string | null } | null | undefined;

// Cena obowiązująca w danej chwili (promocja czasowa ma pierwszeństwo)
export function effectivePrice(price: number, sale: Sale, at = Date.now()) {
  const active = sale?.price != null && sale.price > 0 && (!sale.from || new Date(sale.from).getTime() <= at) && (!sale.to || new Date(sale.to).getTime() >= at);
  return { price: active ? sale!.price! : price, onSale: active };
}

// Historia cen + najniższa cena z 30 dni (dyrektywa Omnibus): liczona z cen sprzed rozpoczęcia promocji
export const priceHistoryHook: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const price = Number(data.price ?? originalDoc?.price ?? 0);
  const sale = (data.sale ?? originalDoc?.sale) as Sale;
  const now = Date.now();
  const { price: current } = effectivePrice(price, sale, now);

  const history: { date: string; price: number }[] = ((data.priceHistory ?? originalDoc?.priceHistory ?? []) as { date?: string | null; price?: number | null }[])
    .filter((h) => h.date && h.price != null && now - new Date(h.date).getTime() < 90 * DAY)
    .map((h) => ({ date: h.date!, price: Number(h.price) }));
  // Pierwszy zapis w trakcie promocji: zapamiętaj też cenę regularną sprzed jej startu
  if (!history.length && current !== price) {
    const start = sale?.from ? new Date(sale.from).getTime() : now;
    history.push({ date: new Date(start - 1000).toISOString(), price: round2(price) });
  }
  if (!history.length || history[history.length - 1].price !== current) history.push({ date: new Date(now).toISOString(), price: round2(current) });
  data.priceHistory = history;

  // Okno 30 dni przed rozpoczęciem promocji (albo przed „teraz”)
  const ref = sale?.from && effectivePrice(price, sale, now).onSale ? new Date(sale.from).getTime() : now;
  const before = history.filter((h) => new Date(h.date).getTime() <= ref && ref - new Date(h.date).getTime() <= 30 * DAY).map((h) => h.price);
  // Cena obowiązująca na początku okna też się liczy
  const startPrice = [...history].reverse().find((h) => new Date(h.date).getTime() <= ref - 30 * DAY)?.price;
  const candidates = [...before, ...(startPrice != null ? [startPrice] : [])];
  data.lowestPrice30d = candidates.length ? round2(Math.min(...candidates)) : round2(price);
  return data;
};

// Produkt wrócił na stan → zgłoszenia „powiadom o dostępności” czekają na wysyłkę
export const stockAlertHook: CollectionAfterChangeHook = async ({ doc, previousDoc, req, operation }) => {
  if (operation !== "update" || !(Number(previousDoc?.stock ?? 0) <= 0 && Number(doc.stock ?? 0) > 0)) return doc;
  await req.payload.update({
    collection: "stock-alerts", req, overrideAccess: true,
    where: { and: [{ product: { equals: doc.id } }, { status: { equals: "waiting" } }] },
    data: { status: "ready" },
  });
  backInStockMails(req.payload, doc.id);
  return doc;
};

// Opis zmieniony ręcznie w panelu → zaznacz „Nie nadpisuj opisu”, żeby synchronizacja z BaseLinkerem go nie skasowała
export const keepEditedDescription: CollectionBeforeChangeHook = ({ data, originalDoc, req, operation }) => {
  if (operation !== "update" || req.user?.collection !== "users") return data;
  if (data.descriptionHtml !== undefined && data.descriptionHtml !== originalDoc?.descriptionHtml) {
    data.keep = { ...(originalDoc?.keep ?? {}), ...(data.keep ?? {}), description: true };
  }
  return data;
};

// Sklep czyta katalog z pamięci podręcznej – po każdej zmianie odświeżamy ją od razu
export const invalidateCatalogHook: CollectionAfterChangeHook & CollectionAfterDeleteHook = ({ doc }) => {
  invalidateCatalog();
  return doc;
};

// Nie można wskazać samego siebie jako karty; wariant wariantu spłaszczamy do głównej karty
export const variantParentHook: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (!("variantOf" in (data ?? {}))) return data;
  const self = Number(originalDoc?.id ?? data?.id);
  const parent = relId(data?.variantOf);
  if (!parent) {
    data.variantOf = null;
    return data;
  }
  if (self && parent === self) {
    data.variantOf = null;
    return data;
  }
  const p = await req.payload.findByID({ collection: "products", id: parent, depth: 0, overrideAccess: true }).catch(() => null);
  const grand = relId(p?.variantOf);
  if (grand && grand !== parent) data.variantOf = grand;
  return data;
};

const normSku = (v: unknown) => String(v ?? "").trim().toLowerCase();

// Kod SKU jest kluczem zestawów i importu – drugi produkt nie może dostać tego samego kodu.
export const uniqueSkuHook: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (!data || !("sku" in data)) return data;
  const sku = String(data.sku ?? "").trim();
  data.sku = sku || null;
  if (!sku || normSku(originalDoc?.sku) === normSku(sku)) return data;
  const self = Number(originalDoc?.id || 0);
  const { docs } = await req.payload.find({
    collection: "products",
    where: { and: [{ sku: { like: sku } }, ...(self ? [{ id: { not_equals: self } }] : [])] } as never,
    limit: 20,
    depth: 0,
    overrideAccess: true,
    req,
    select: { name: true, sku: true },
  });
  const other = docs.find((d) => normSku(d.sku) === normSku(sku));
  if (other) throw new APIError(`SKU „${sku}” jest już przy produkcie „${other.name}”. Kod SKU musi być unikalny.`, 400);
  return data;
};

export const unlinkVariantsHook: CollectionAfterDeleteHook = async ({ id, req }) => {
  await unlinkDeletedParent(req.payload, Number(id));
  invalidateCatalog();
};
