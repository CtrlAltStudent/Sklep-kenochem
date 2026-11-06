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
const brandKey = (s: string) => s.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

// Marka produktu musi być jedną z marek z logiem na stronie głównej. Inna nazwa jest czyszczona.
export const brandHook: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data || !("brand" in data) || data.brand == null || String(data.brand).trim() === "") return data;
  const ctx = req.context as { brandNames?: string[] };
  if (!ctx.brandNames) {
    const home = await req.payload.findGlobal({ slug: "homepage", depth: 0, overrideAccess: true }).catch(() => null);
    ctx.brandNames = ((home as { brandLogos?: { name?: string | null }[] } | null)?.brandLogos ?? [])
      .map((b) => b.name?.trim()).filter((n): n is string => Boolean(n));
  }
  if (!ctx.brandNames.length) return data;
  const hit = ctx.brandNames.find((n) => brandKey(n) === brandKey(String(data.brand)));
  data.brand = hit ?? "";
  return data;
};

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

const imageBlock = /<(?:picture|figure)\b[^>]*>[\s\S]*?<\/(?:picture|figure)>|<img\b[^>]*>|!\[[^\]]*\]\([^)]+\)/gi;
const emptyTag = /<(p|strong|em|b|span|div|h[1-6])\b[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/\1>/gi;

// W opisie zostaje sam tekst. Obrazki z opisu (także wklejone ze starego sklepu) są usuwane.
export function stripDescriptionImages(html: string) {
  let out = html.replace(imageBlock, "");
  for (let i = 0; i < 5; i++) {
    const next = out.replace(emptyTag, "");
    if (next === out) break;
    out = next;
  }
  return out.replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br><br>").trim();
}

const droppedBlock = /<\/?(?:script|style|iframe|object|embed|form|input|button|textarea|svg|canvas|link|meta|head|html|body)\b[^>]*>/gi;
const chromeWrap = /<\/?(?:pre|code|div|span|section|article|font|center|blockquote)\b[^>]*>/gi;

// Opis wklejony z czatu albo ze starego sklepu niesie ze sobą znaczniki kodu, ramki i klasy.
// Zostawiamy sam tekst z nagłówkami, listami i tabelą – inaczej karta produktu się rozjeżdża.
export function tidyDescription(html: string) {
  let s = stripDescriptionImages(html).replace(/<!--[\s\S]*?-->/g, "").replace(droppedBlock, "").replace(chromeWrap, "");
  s = s.replace(/<([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>/g, (_full, raw: string, attrs: string | undefined) => {
    const tag = raw.toLowerCase() === "h1" ? "h2" : raw.toLowerCase();
    if (tag === "br" || tag === "hr") return `<${tag}>`;
    if (tag === "a") {
      const href = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs ?? "");
      const url = (href?.[1] ?? href?.[2] ?? "").trim();
      if (/^(https?:|mailto:|\/)/i.test(url)) return `<a href="${url.replace(/"/g, "")}">`;
      return "<a>";
    }
    if (tag === "td" || tag === "th") {
      const col = /colspan\s*=\s*"?(\d+)"?/i.exec(attrs ?? "");
      const row = /rowspan\s*=\s*"?(\d+)"?/i.exec(attrs ?? "");
      const span = [col ? `colspan="${col[1]}"` : "", row ? `rowspan="${row[1]}"` : ""].filter(Boolean).join(" ");
      return span ? `<${tag} ${span}>` : `<${tag}>`;
    }
    return `<${tag}>`;
  });
  s = s.replace(/<\/h1>/gi, "</h2>");
  s = s.replace(/<p>(?:\s|&nbsp;|<br>)*<\/p>/gi, "");
  return s.replace(/(?:<br>\s*){3,}/gi, "<br><br>").trim();
}

export const stripDescriptionImagesHook: CollectionBeforeChangeHook = ({ data }) => {
  if (typeof data?.descriptionHtml === "string" && /<img\b|<picture\b|<figure\b|!\[[^\]]*\]\(/i.test(data.descriptionHtml)) {
    data.descriptionHtml = stripDescriptionImages(data.descriptionHtml);
  }
  return data;
};

// Nazwa albo opis zmienione ręcznie w panelu → „Nie nadpisuj”, żeby synchronizacja z BaseLinkerem ich nie skasowała
export const keepEditedDescription: CollectionBeforeChangeHook = ({ data, originalDoc, req, operation }) => {
  if (operation !== "update" || req.user?.collection !== "users") return data;
  const keep = { ...(originalDoc?.keep ?? {}), ...(data.keep ?? {}) };
  let changed = false;
  if (data.descriptionHtml !== undefined && data.descriptionHtml !== originalDoc?.descriptionHtml) {
    keep.description = true;
    changed = true;
  }
  if (typeof data.name === "string" && data.name.trim() && data.name !== originalDoc?.name) {
    keep.name = true;
    changed = true;
  }
  if (changed) data.keep = keep;
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
