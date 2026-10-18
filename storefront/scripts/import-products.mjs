// Import produktów z eksportu CSV BaseLinkera do plików JSON sklepu.
// Użycie: node scripts/import-products.mjs "<ścieżka do pliku .csv>"
//   a potem: node scripts/check-images.mjs   (sprawdza i poprawia adresy zdjęć)
//
// Wynik:
//   src/data/products.json      – lekki katalog (lista, filtry, wyszukiwarka)
//   src/data/descriptions.json  – opisy HTML (ładowane tylko na stronie produktu)

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { applyImageCache, loadImageCache } from "./image-cache.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Podaj ścieżkę do pliku CSV.");
  process.exit(1);
}

const rows = parse(fs.readFileSync(file), { columns: true, delimiter: ";", bom: true, relax_quotes: true });

// --- Przypisanie do kategorii ------------------------------------------------
// Reguły sprawdzane po kolei na tekście: nazwa + kategoria z CSV + producent.
// Pierwsza pasująca reguła wygrywa.
const rules = [
  ["zapachy", "aromamarketing", /dyfuzor|olejek zapachow|aromamarketing|aroma\s/],
  ["zapachy", "neutralizatory", /neutraliz|odor|pochłaniacz|odświeżacz powietrza/],
  ["zapachy", "aromamarketing", /patyczki|świec|zapach do domu|wosk zapachow/],
  ["zapachy", "zapachy-samochodowe", /zapach|odświeżacz|choinka|perfum|fresh/],

  // Akcesoria, które łatwo pomylić z częściami myjni lub chemią
  ["sprzet-i-akcesoria", "mopy", /\bmop|wiadr|wózek|\bkij|trzonek|stelaż|rubi/],
  ["sprzet-i-akcesoria", "sciagaczki", /ściągacz|ściagacz|zbierak|skrobacz|skrobak|myjka do (my|mc)?(cia )?szyb|uchwyt myjki|teleskop/],
  ["sprzet-i-akcesoria", "ochrona-osobista", /rękawic(?!a do)|maska|okular|fartuch|odzież ochron/],
  ["chemia-samochodowa", "szyby-i-szklo", /płyn(u)? do spryskiwaczy|spryskiwaczy|odmrażacz|anty ?para|do szyb samoch/],
  ["chemia-profesjonalna", "higiena-rak", /rąk|mydł|pasta bhp|krem do/],
  ["chemia-specjalistyczna", "rolnictwo", /rolni|obór|udój|udoj|dój|gospodarstw|łodzi|jacht|cid lines|polchem|weteryn|osad|\bcip\b/],

  ["myjnie-i-urzadzenia", "czesci-do-myjek", /dysz|złącz|szybkozłącz|wąż|węża|uszczelk|o-ring|oring|zawór|pomp|filtr|przyłącz|nypel|redukcj|kolank|końcówk|obrotnic|karcher|kranzle|kärcher|mosiądz|gwint/],
  ["myjnie-i-urzadzenia", "pianownice-i-oprysk", /pianownic|lanc|pistolet|tornado|opryskiwacz|spryskiwacz ciśn|kwazar|venus|mercury|foamer/],
  ["myjnie-i-urzadzenia", "odkurzacze-i-tapicerka", /odkurzacz|ssawk|ekstrakc|parownic|myjka ciśn|myjki zimnowodne|urządzen|inżektor|generator/],
  ["myjnie-i-urzadzenia", "chemia-do-myjni", /myjni|aktywna piana|truck|bezdotyk|osuszacz|wosk na gorąco|proszek/],

  ["chemia-specjalistyczna", "myjki-ultradzwiekowe", /ultradźwięk|dpf|fap/],
  ["chemia-specjalistyczna", "smary", /smar|wd-40|wd40|olej |penetrant|silikon w spray/],
  ["chemia-specjalistyczna", "zmywacze-i-odtluszczacze", /zmywacz|odtłuszcz|odrdzew|rozpuszczal|benzyna ekstrak|kamień|kamienia/],
  ["chemia-specjalistyczna", "dezynfekcja", /dezynf|biobójcz|antybakter|wirus/],
  ["chemia-specjalistyczna", "chemia-warsztatowa", /warsztat|hamulc|silnik|techniczn|klej|uszczelniacz/],

  ["chemia-profesjonalna", "czysciwa-i-papier", /czyściw|ręcznik papier|papier|makulat|rolka/],
  ["chemia-profesjonalna", "kuchnia-i-gastronomia", /kuchn|gastro|zmywark|piekarnik|grill|naczyń|naczyn|okap|tłuszcz/],
  ["chemia-profesjonalna", "pranie-i-tekstylia", /prani|proszek do|płukan|wybiel|odplamiacz/],
  ["chemia-profesjonalna", "dywany-i-tapicerka", /dywan|wykładzin/],
  ["chemia-profesjonalna", "chemia-obiektowa", /podłóg|posadzk|sanitar|łazien|toalet|wc|obiektow|uniwersaln|eilfix|normatek|clinex/],

  ["sprzet-i-akcesoria", "szczotki-i-miotly", /szczot|mioł|zmiotk|pędzel|pędzl|vikan/],
  ["sprzet-i-akcesoria", "mikrofibry-i-gabki", /mikrofib|ściereczk|ścierk|gąbk|pad|ręcznik|aplikator|rękawica do/],
  ["sprzet-i-akcesoria", "opryskiwacze", /butelk|atomizer|spryskiwacz|dozowni|lejek|kanister/],

  ["dom-i-ogrod", "czyszczenie-zewnetrzne", /mech|glon|kostk|elewac|taras|ogrod|ogród|fotowolt|panel/],
  ["dom-i-ogrod", "odswiezanie-domu", /dom i ogród.*okna|lustr/],
  ["dom-i-ogrod", "chemia-do-domu", /dom i ogród|domu|szyb|okien/],

  ["chemia-samochodowa", "szyby-i-szklo", /szyb|glass/],
  ["chemia-samochodowa", "felgi-i-opony", /felg|opon|tire|wheel|alu remover/],
  ["chemia-samochodowa", "wnetrze-samochodu", /wnętrz|kokpit|cockpit|tapicer|skór|alcantar|plastik/],
  ["chemia-samochodowa", "pielegnacja-lakieru", /wosk|wax|lakier|polerow|pasta|powłok|ceramic|quick detailer|glinka/],
  ["chemia-samochodowa", "trudne-zabrudzenia", /owad|smoł|asfalt|żywic|etykiet|insekt|tar/],
  ["chemia-samochodowa", "elementy-zewnetrzne", /zewnętrz|uszczelk|chrom|silnik/],
  ["chemia-samochodowa", "mycie-samochodu", /szampon|piana|mycia|mycie|shampoo|foam|auto|detailing|samoch/],
];

// Gdy nic nie pasuje: preparaty → chemia obiektowa, reszta → pozostałe akcesoria.
function classify(r) {
  const text = `${r.produkt_nazwa} | ${r.kategoria_nazwa} | ${r.producent_nazwa}`.toLowerCase();
  for (const [category, subcategory, re] of rules) if (re.test(text)) return { category, subcategory };
  if (/\d\s?(ml|l|kg|g)\b|preparat|płyn|środek|koncentrat|spray/.test(text))
    return { category: "chemia-profesjonalna", subcategory: "chemia-obiektowa" };
  return { category: "sprzet-i-akcesoria", subcategory: "pozostale-akcesoria" };
}

// --- Pomocnicze ---------------------------------------------------------------
const PL = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
const slugify = (s) =>
  s.toLowerCase().replace(/[ąćęłńóśźż]/g, (c) => PL[c]).normalize("NFKD").replace(/[^\w\s-]/g, " ")
    .trim().replace(/[\s_-]+/g, "-").slice(0, 90).replace(/-+$/, "");

const NOT_BRANDS = new Set(["", "AKCESORIA DO MYJNI", "INNI PRODUCENCI", "DYFUZOR ELEKTRYCZNY", "AKCESORIA DO SPRZĄTANIA", "BRAK DANYCH", "MARKA NIEZDEFINIOWANA"]);
const brandOf = (p) => {
  const b = (p || "").split(" - ")[0].trim();
  if (NOT_BRANDS.has(b.toUpperCase())) return "";
  return b.length <= 4 ? b.toUpperCase() : b.charAt(0).toUpperCase() + b.slice(1).toLowerCase();
};

const variantLabel = (name) => {
  const m = name.match(/(\d+(?:[.,]\d+)?)\s?(ml|l|kg|g|szt)\b/i);
  if (!m) return "1 szt.";
  const unit = m[2].toLowerCase() === "l" ? "L" : m[2].toLowerCase();
  return `${m[1]} ${unit}`;
};

const cleanHtml = (html) =>
  html
    .replace(/<(script|style|iframe|object)[\s\S]*?<\/\1>/gi, "")
    .replace(/<img[^>]+src=["'](?!https?:)[^"']*["'][^>]*>/gi, "") // obrazki ze starego sklepu (ścieżki względne)
    .replace(/\s(style|class|id|width|height|border|align|on\w+)=("[^"]*"|'[^']*')/gi, "")
    .replace(/\shref=("|')\s*javascript:[^"']*\1/gi, "")
    .replace(/<\/?(div|span|font)[^>]*>/gi, "")
    .replace(/<h1/gi, "<h2").replace(/<\/h1>/gi, "</h2>")
    .replace(/<p>(\s|&nbsp;| )*<\/p>/gi, "")
    .replace(/\n{2,}/g, "\n")
    .trim();

const plainText = (html) =>
  html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();

// --- Konwersja ---------------------------------------------------------------
const slugs = new Set();
const products = [];
const descriptions = {};

for (const r of rows) {
  const price = parseFloat(String(r.cena).replace(",", "."));
  if (!r.produkt_nazwa || !(price > 0)) continue;

  let slug = slugify(r.produkt_nazwa) || `produkt-${r.produkt_id}`;
  if (slugs.has(slug)) slug = `${slug}-${r.produkt_id}`;
  slugs.add(slug);

  const images = [r.zdjecie, ...Array.from({ length: 15 }, (_, i) => r[`zdjecie_dodatkowe_${i + 1}`])]
    .filter((u) => u && /^https?:\/\//.test(u));
  const html = cleanHtml(r.opis || "");
  const text = plainText(html);

  products.push({
    id: r.produkt_id,
    slug,
    name: r.produkt_nazwa.trim(),
    brand: brandOf(r.producent_nazwa),
    ...classify(r),
    sku: r.produkt_sku || "",
    ean: r.produkt_ean || "",
    vat: parseInt(r.stawka_vat) || 23,
    stock: Math.max(0, parseInt(r.ilosc) || 0),
    variants: [{ id: "1", label: variantLabel(r.produkt_nazwa), price }],
    images: images.slice(0, 6),
    short: text.length > 220 ? text.slice(0, 217).replace(/\s\S*$/, "") + "…" : text,
  });
  descriptions[slug] = html;
}

// Zdjęcia już sprawdzone wcześniej przez check-images.mjs
applyImageCache(products, loadImageCache());

// Najnowsze produkty (najwyższe ID) oznaczamy jako nowości.
[...products].sort((a, b) => +b.id - +a.id).slice(0, 40).forEach((p) => (p.badges = ["nowosc"]));

const out = path.join(import.meta.dirname, "..", "src", "data");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "products.json"), JSON.stringify(products));
fs.writeFileSync(path.join(out, "descriptions.json"), JSON.stringify(descriptions));

const dist = {};
for (const p of products) dist[`${p.category} / ${p.subcategory}`] = (dist[`${p.category} / ${p.subcategory}`] || 0) + 1;
console.log(`Zaimportowano ${products.length} z ${rows.length} produktów.`);
console.table(Object.entries(dist).sort().map(([k, n]) => ({ kategoria: k, produktow: n })));
