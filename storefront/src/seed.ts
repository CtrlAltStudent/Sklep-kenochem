// Dane startowe panelu: kategorie, produkty z importu CSV, ustawienia sklepu, banery.
// Uruchomienie: npm run seed   (bezpieczne do ponownego uruchomienia – nie tworzy duplikatów)

import fs from "node:fs";
import path from "node:path";
import { getPayload } from "payload";
import config from "@payload-config";
import { categories as shopCategories, type Product } from "./lib/data";

const root = process.cwd();
const payload = await getPayload({ config });
const log = (m: string) => payload.logger.info(`[seed] ${m}`);

async function upsert(collection: "categories" | "media", where: Record<string, unknown>, data: Record<string, unknown>, file?: string) {
  const found = await payload.find({ collection, where: where as never, limit: 1, depth: 0 });
  if (found.docs[0]) return found.docs[0];
  return payload.create({ collection, data: data as never, ...(file ? { filePath: file } : {}) });
}

// 1) Media z /public/brand (banery, ikony)
const brand = path.join(root, "public", "brand");
const media: Record<string, number | string> = {};
for (const f of fs.readdirSync(brand)) {
  const doc = await upsert("media", { filename: { equals: f } }, { alt: f.replace(/[-_]/g, " ").replace(/\.\w+$/, "") }, path.join(brand, f));
  media[f] = doc.id;
}
log(`media: ${Object.keys(media).length}`);

// 2) Kategorie (główne + podkategorie)
const catIds = new Map<string, number | string>();
for (const [i, c] of shopCategories.entries()) {
  const icon = media[path.basename(c.icon)];
  const parent = await upsert("categories", { slug: { equals: c.slug } }, { name: c.name, slug: c.slug, order: i, color: c.color, icon, lucide: c.lucide });
  catIds.set(c.slug, parent.id);
  for (const [j, s] of c.children.entries()) {
    const child = await upsert("categories", { slug: { equals: s.slug } }, { name: s.name, slug: s.slug, order: j, parent: parent.id, lucide: s.lucide });
    catIds.set(`${c.slug}/${s.slug}`, child.id);
  }
}
log(`kategorie: ${catIds.size}`);

// 3) Produkty z importu CSV
const products = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "products.json"), "utf8")) as Product[];
const descriptions = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "descriptions.json"), "utf8")) as Record<string, string>;
const existing = new Set(
  (await payload.find({ collection: "products", limit: 0, pagination: false, depth: 0, select: { slug: true } })).docs.map((d) => d.slug),
);
let created = 0;
for (const p of products) {
  if (existing.has(p.slug)) continue;
  await payload.create({
    collection: "products",
    data: {
      name: p.name,
      slug: p.slug,
      category: catIds.get(`${p.category}/${p.subcategory}`) ?? catIds.get(p.category),
      brand: p.brand,
      shortDescription: p.short,
      descriptionHtml: descriptions[p.slug] ?? "",
      badges: p.badges ?? [],
      price: p.variants[0].price,
      vatRate: p.vat,
      sku: p.sku,
      ean: p.ean,
      stock: p.stock,
      unitLabel: p.variants[0].label,
      images: p.images.map((url) => ({ url })),
      source: "csv",
      status: "active",
    } as never,
  });
  if (++created % 250 === 0) log(`produkty: ${created}…`);
}
log(`produkty: dodano ${created}, wcześniej było ${existing.size}`);

// 4) Ustawienia sklepu (tylko jeśli puste)
const store = await payload.findGlobal({ slug: "store-settings" });
if (!store.shippingMethods?.length) {
  await payload.updateGlobal({
    slug: "store-settings",
    data: {
      freeShippingThreshold: 399,
      shippingMethods: [
        { code: "inpost", label: "InPost Paczkomat 24/7", price: 14.99, baselinkerName: "InPost Paczkomaty", requiresPoint: true, enabled: true, freeAboveThreshold: true },
        { code: "dpd", label: "Kurier DPD", price: 17.99, baselinkerName: "Kurier DPD", requiresPoint: false, enabled: true, freeAboveThreshold: true },
        { code: "pickup", label: "Odbiór osobisty – Białystok", price: 0, baselinkerName: "Odbiór osobisty", requiresPoint: false, enabled: true, freeAboveThreshold: true },
      ],
      paymentMethods: [
        { code: "p24", label: "BLIK, szybki przelew, karta (Przelewy24)", provider: "przelewy24", baselinkerName: "Przelewy24", enabled: true },
        { code: "transfer", label: "Przelew tradycyjny", provider: "transfer", baselinkerName: "Przelew bankowy", enabled: true },
        { code: "cod", label: "Za pobraniem", provider: "cod", baselinkerName: "Pobranie", enabled: false },
        { code: "deferred", label: "Przelew z terminem (B2B / instytucje)", provider: "deferred", baselinkerName: "Przelew odroczony", b2bOnly: true, enabled: true },
      ],
    } as never,
  });
  log("ustawienia sklepu: dostawy i płatności");
}

// 5) Strona główna – banery (tylko jeśli puste)
const home = await payload.findGlobal({ slug: "homepage" });
if (!home.slides?.length) {
  const featured = await payload.find({ collection: "products", where: { brand: { in: ["Kenochem", "Kenotek"] } }, limit: 8, depth: 0 });
  await payload.updateGlobal({
    slug: "homepage",
    data: {
      slides: [
        { image: media["mYCIE-AUTA-1.jpg"], kicker: "Chemia samochodowa", title: "Profesjonalne mycie samochodu", text: "Aktywne piany, szampony i preparaty, których używają najlepsze myjnie w Polsce.", ctaLabel: "Zobacz produkty", link: "/kategoria/chemia-samochodowa?sub=mycie-samochodu" },
        { image: media["Nowy-Kenochem-banner-1920x625-5.jpg"], kicker: "Dom i ogród", title: "Mech nie ma szans", text: "Skuteczne preparaty do kostki, dachów i elewacji.", ctaLabel: "Sprawdź", link: "/kategoria/dom-i-ogrod?sub=czyszczenie-zewnetrzne" },
        { image: media["Nowy-Kenochem-banner-1920x625-1-1-1.jpg"], kicker: "Pielęgnacja lakieru", title: "Czysty samochód bez wysiłku", text: "Woski, powłoki i quick detailery z efektem perlenia.", ctaLabel: "Kup teraz", link: "/kategoria/chemia-samochodowa?sub=pielegnacja-lakieru" },
        { image: media["slider-k-2026.jpg"], kicker: "Wnętrze samochodu", title: "Detailing wnętrza", text: "Tapicerka, plastiki i skóra – wszystko w jednym miejscu.", ctaLabel: "Zobacz", link: "/kategoria/chemia-samochodowa?sub=wnetrze-samochodu" },
        { image: media["25-lat-1.jpg"], link: "/b2b" },
      ],
      perks: [
        { icon: media["Wysylka-i-platnosci.png"], title: "Szybka wysyłka", text: "Zamów do 14:00 – wyślemy dziś" },
        { icon: media["Sprzedaz-hurtowa.png"], title: "Sprzedaż hurtowa", text: "Ceny B2B dla firm i myjni" },
        { icon: media["o-nas.png"], title: "25 lat doświadczenia", text: "Twój dostawca chemii z Białegostoku" },
      ],
      featuredProducts: featured.docs.map((d) => d.id),
      _status: "published",
    } as never,
  });
  log("strona główna: banery");
}

log("gotowe ✔");
process.exit(0);
