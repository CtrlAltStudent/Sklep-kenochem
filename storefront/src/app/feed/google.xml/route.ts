import { getShopCategories } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog";
import { getCms, getStoreSettings } from "@/lib/cms";
import { freeShippingFrom, methodFreeFrom } from "@/lib/data";
import { shippingAvailable } from "@/integrations/availability";
import { absUrl, siteBase } from "@/lib/site";
import { getSite } from "@/integrations/vault";
import { mpnOf } from "@/lib/seo";

// /feed/google.xml – plik produktów dla Google Merchant Center (Zakupy Google, kampanie Performance Max, remarketing).
// Merchant Center: Produkty → Źródła danych → „Plik zaplanowany” z tym adresem. Odświeżany co godzinę.
// id = SKU (to samo item_id wysyłają zdarzenia GA4/Ads – src/lib/track.ts), stany i promocje z bazy sklepu przy każdym pobraniu.
// Plik nie może być „zapamiętany” z chwili wgrywania – Google i automaty brały wtedy stare zdjęcia i stany.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const googleCategory: Record<string, string> = {
  "mycie-auta": "Vehicles & Parts > Vehicle Maintenance, Care & Decor > Vehicle Cleaning",
  "polerowanie-i-ochrona": "Vehicles & Parts > Vehicle Maintenance, Care & Decor > Vehicle Cleaning",
  "wnetrze-auta": "Vehicles & Parts > Vehicle Maintenance, Care & Decor > Vehicle Cleaning",
  "akcesoria-detailingowe": "Vehicles & Parts > Vehicle Maintenance, Care & Decor > Vehicle Cleaning",
  "chemia-do-myjni": "Vehicles & Parts > Vehicle Maintenance, Care & Decor > Vehicle Cleaning",
  "serwis-i-warsztat": "Vehicles & Parts > Vehicle Maintenance, Care & Decor > Vehicle Repair & Specialty Tools",
  "dom-i-ogrod": "Home & Garden > Household Supplies > Household Cleaning Supplies",
};

const xml = (s: unknown) => String(s ?? "").replace(/[<>&'"\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] ?? "");
const money = (n: number) => `${n.toFixed(2)} PLN`;
const text = (html?: string | null) => (html ?? "").replace(/<(br|\/p|\/li|\/h\d)[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
const gtin = (ean?: string) => (ean && /^\d{8}$|^\d{12,14}$/.test(ean.trim()) ? ean.trim() : "");

export async function GET() {
  const site = getSite();
  if (!site.feedEnabled) return new Response("Not found", { status: 404 });
  const [products, store, cms, categories] = await Promise.all([getProducts(), getStoreSettings(), getCms(), getShopCategories()]);
  const { docs } = await cms.find({ collection: "products", limit: 0, pagination: false, depth: 0, overrideAccess: true, where: { status: { equals: "active" } }, select: { slug: true, name: true, descriptionHtml: true, shortDescription: true, sale: true, merchant: true, seo: true } });
  const extra = new Map(docs.map((d) => [d.slug, d]));

  // Koszt dostawy w pliku: najtańsza płatna metoda; od progu darmowej dostawy – 0 zł
  const ships = (store.shippingMethods ?? []).filter(shippingAvailable).filter((m) => !m.code.endsWith("-cod") && m.code !== "pickup" && m.price > 0);
  const cheapest = ships.reduce((a, m) => (!a || m.price < a.price ? m : a), undefined as (typeof ships)[number] | undefined);
  const free = freeShippingFrom(store);

  const path = (p: (typeof products)[number]) => {
    const c = categories.find((x) => x.slug === p.category);
    const s = c?.children.find((x) => x.slug === p.subcategory);
    const t = s?.types.find((x) => x.slug === p.type);
    return [c?.name, s?.name, t?.name].filter(Boolean).join(" > ");
  };

  // Każda pojemność to osobna pozycja (własny SKU i adres). item_group_id łączy je w Zakupach Google.
  const seen = new Set<string>();
  const items: string[] = [];
  for (const p of products) {
    if (!p.images.length) continue;
    const main = extra.get(p.slug);
    if (main?.merchant?.exclude) continue;
    const description = (text(main?.descriptionHtml) || p.short || p.name).slice(0, 4900);
    for (const v of p.variants) {
      if (!(v.price > 0)) continue;
      const stock = v.stock ?? p.stock;
      if (!site.feedOutOfStock && stock <= 0) continue;
      const slug = v.slug || p.slug;
      const row = extra.get(slug) ?? main;
      if (row?.merchant?.exclude) continue;
      const id = (v.sku || slug).slice(0, 50);
      if (seen.has(id)) continue;
      seen.add(id);
      const g = gtin(v.ean || p.ean);
      const mpn = mpnOf(row?.name ?? p.name, p.brand);
      const regular = v.oldPrice ?? v.price;
      const saleTo = row?.sale?.to ? new Date(row.sale.to) : null;
      const saleFrom = row?.sale?.from ? new Date(row.sale.from) : new Date(Date.now() - 86_400_000);
      const shipFrom = cheapest ? methodFreeFrom(cheapest, free) : null;
      const shipPrice = cheapest ? (shipFrom != null && v.price >= shipFrom ? 0 : cheapest.price) : null;
      items.push([
        "<item>",
        `<g:id>${xml(id)}</g:id>`,
        `<g:title>${xml((v.label && v.label !== "1 szt." && !p.name.includes(v.label) ? `${p.name} ${v.label}` : p.name).slice(0, 150))}</g:title>`,
        `<g:description>${xml(description)}</g:description>`,
        `<g:link>${xml(absUrl(`/produkt/${slug}`))}</g:link>`,
        `<g:image_link>${xml(absUrl(p.images[0]))}</g:image_link>`,
        ...p.images.slice(1, 10).map((u) => `<g:additional_image_link>${xml(absUrl(u))}</g:additional_image_link>`),
        `<g:availability>${stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>`,
        `<g:price>${money(regular)}</g:price>`,
        v.oldPrice ? `<g:sale_price>${money(v.price)}</g:sale_price>` : "",
        v.oldPrice && saleTo ? `<g:sale_price_effective_date>${saleFrom.toISOString()}/${saleTo.toISOString()}</g:sale_price_effective_date>` : "",
        `<g:condition>new</g:condition>`,
        p.brand ? `<g:brand>${xml(p.brand)}</g:brand>` : "",
        g ? `<g:gtin>${g}</g:gtin>` : "",
        // MPN = numer katalogowy producenta z nazwy (SONAX 275300, Kwazar WTO.0332), nie nasz SKU
        mpn ? `<g:mpn>${xml(mpn)}</g:mpn>` : "",
        !g && !(p.brand && mpn) ? "<g:identifier_exists>no</g:identifier_exists>" : "",
        path(p) ? `<g:product_type>${xml(path(p))}</g:product_type>` : "",
        `<g:google_product_category>${xml(row?.merchant?.googleCategory || googleCategory[p.category] || googleCategory["mycie-auta"])}</g:google_product_category>`,
        ...([0, 1, 2] as const).map((n) => { const l = row?.merchant?.[`customLabel${n}`]; return l ? `<g:custom_label_${n}>${xml(l.slice(0, 100))}</g:custom_label_${n}>` : ""; }),
        ...(row?.merchant?.highlights ?? "").split(/\r?\n/).map((h) => h.trim()).filter(Boolean).slice(0, 10).map((h) => `<g:product_highlight>${xml(h.slice(0, 150))}</g:product_highlight>`),
        v.label && v.label !== "1 szt." ? `<g:size>${xml(v.label)}</g:size>` : "",
        p.variants.length > 1 ? `<g:item_group_id>${xml(p.slug.slice(0, 50))}</g:item_group_id>` : "",
        shipPrice != null ? `<g:shipping><g:country>PL</g:country><g:service>${xml(cheapest!.label)}</g:service><g:price>${money(shipPrice)}</g:price><g:min_handling_time>0</g:min_handling_time><g:max_handling_time>1</g:max_handling_time></g:shipping>` : `<g:min_handling_time>0</g:min_handling_time><g:max_handling_time>1</g:max_handling_time>`,
        "</item>",
      ].filter(Boolean).join(""));
    }
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Sklep SONAX – Białystok</title>
<link>${xml(siteBase())}</link>
<description>Chemia i kosmetyki samochodowe SONAX</description>
${items.join("\n")}
</channel>
</rss>`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, must-revalidate",
    },
  });
}
