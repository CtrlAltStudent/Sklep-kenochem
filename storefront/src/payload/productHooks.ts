import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionBeforeChangeHook } from "payload";
import { invalidateCatalog } from "@/lib/catalogCache";
import { backInStockMails } from "@/integrations/mail/events";

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
