// Import produktów Sonax: eksport CSV z BaseLinkera + lista produktów z obecnego sklepu sonax.sklep.pl.
// Bierzemy TYLKO produkty, które są teraz na stronie (scripts/sonax-shop.json – pobiera go fetch-sonax-shop.mjs).
// Z CSV: opis, EAN, VAT, stan, producent. Ze strony: nazwa, adres (slug), cena, zdjęcia.
//
// Użycie: node scripts/fetch-sonax-shop.mjs
//         node scripts/import-products.mjs "<ścieżka do pliku .csv>"
//
// Wynik:
//   src/data/products.json      – katalog (seed wgrywa go do panelu)
//   src/data/descriptions.json  – opisy HTML
//   src/data/redirects.json     – stare adresy kategorii sonax.sklep.pl → nowe
//   scripts/import-report.txt   – produkty niedopasowane do CSV i bez kategorii (do sprawdzenia przez właściciela)

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

const file = process.argv[2];
if (!file) {
  console.error("Podaj ścieżkę do pliku CSV.");
  process.exit(1);
}

const rows = parse(fs.readFileSync(file), { columns: true, delimiter: ";", bom: true, relax_quotes: true });
const shop = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "sonax-shop.json"), "utf8"));

// --- Pomocnicze ---------------------------------------------------------------
const decode = (s) =>
  (s || "").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").trim();
const norm = (s) => decode(s).toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]+/g, " ").trim();
const PL = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
const slugPart = (s) => s.toLowerCase().replace(/[ąćęłńóśźż]/g, (c) => PL[c]).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Produkty ze strony o innej nazwie niż w BaseLinkerze – sprawdzone ręcznie (ta sama pojemność i wariant)
const ALIASES = {
  "TENZI TEXTIL EX 1L – Płyn do prania dywanów tapicerki wykładzin do odkurzacza": "TEN000005",
  "TENZI LEDER CARE GT 600ML – Preparat do skóry naturalnej i sztucznej": "TEN000057",
  "ODPLAMIACZ DO TAPICERKI I ALCANTARY 300ML 252200": "SON000068",
  "TENZI BOBEREX 5L – koncentrat do ręcznego mycia naczyń": "TEN000110",
  "PLAK Ściereczki do kokpitu Matowe Grejpfrut – 24 szt": "ATAS0044",
  "TENZI Glass Quartz GT 1l. płyn do mycia szyb z powłoką ceramiczną": "TEN000052",
  "K2 EVOS BOSS PERFUMY DO SAMOCHODU 50ml": "k2000060",
  "K2 EVOS BOSS PERFUMY DO SAMOCHODU 50ml – Męski zapach": "k2000060",
  "TENZI DOCZYSZCZANIE KOSTKI BRUKOWEJ 2 1L. Środek do czyszczenia kostki brukowej poprzez szorowanie": "TEN000048",
  "FORCLEAN Czysty silnik 750 ml": "SOF000058",
};
const SKIP = /test płatności/i;

// --- Przypisanie do kategorii -------------------------------------------------
// [dział, podkategoria, typ, wyrażenie]. Typ: nazwa albo lista [nazwa, wyrażenie] (pierwsza pasująca; ostatnia bez wyrażenia = domyślna).
// Sprawdzane po kolei na nazwie produktu (małe litery, z dopiskiem #duze dla opakowań ≥ 5 l/kg) – pierwsza pasująca reguła wygrywa.
const W = "mycie-auta", P = "polerowanie-i-ochrona", IN = "wnetrze-auta", A = "akcesoria-detailingowe", M = "chemia-do-myjni", S = "serwis-i-warsztat", D = "dom-i-ogrod";
const rules = [
  // Wyjątki, które łatwo pomylić
  [W, "plastiki-guma-i-detale", "Dachy cabrio", /cabrio|kabriolet/],
  [W, "pre-wash-i-dekontaminacja", "Usuwanie osadów i rdzy", /^(?!.*felg).*(\bosad|nalotów rdzy|waterspot|beton)/],
  [IN, "skora-i-alcantara", "Naprawa skóry", /naprawczy do skóry/],
  [S, "silnik-i-podwozie", "", /dpf|podwozi|durabit/],
  [D, "ogrod-i-elewacje", "Inne do ogrodu", /łopata|kunagone|krety|awning|markiz/],

  // Chemia do myjni (duże opakowania, mycie bezdotykowe, ciężarówki)
  [M, "ciezarowki-i-pojazdy-uzytkowe", "", /truck|ciężar|lkw|dostawcz|plandek|super green specjal(?! nf)|dimer/],
  [M, "woski-do-myjni", "", /carwax|rollex|osuszacz/],
  [M, "preparaty-specjalistyczne", "", /flokul|de-?foam|lejek do kanistr|alu cleaner|eco alu|aluminium\.|(insekt|insect|tar remover).*#duze/],
  [M, "mycie-bezdotykowe", "", /bezdotyk|easy wash (diamond|eco wash|super active|eco super)|nerta (novo|sky|power|active diamond)/],

  // Zapachy i klimatyzacja
  [IN, "zapachy-samochodowe", "Perfumy samochodowe", /perfum/],
  [IN, "zapachy-samochodowe", "Zawieszki zapachowe", /zawieszk|choinka|air freshener/],
  [IN, "zapachy-samochodowe", "Pochłaniacze wilgoci", /pochłaniacz wilgoci/],
  [IN, "zapachy-samochodowe", "Neutralizatory zapachów", /odor stop|smoke ex|neutraliz/],
  [D, "odswiezacze-powietrza", "", /air magic|air fresh|odświeżacz powietrza/],
  [IN, "klimatyzacja-i-nawiewy", "", /klima|airclim|nawiew/],

  // Akcesoria
  [P, "pady-polerskie", [["Pady tnące", /cut|twarda/], ["Pady polerujące i wykończeniowe"]], /\bpad\b|roller (cut|hard|one step|polish|soft)|gąbka polersk/],
  [A, "szczotki-i-pedzle", [["Szczotki na wkrętarkę", /twister|wkrętark|montowan/], ["Pędzle detailingowe", /pędzel|detailing brush/], ["Szczotki do felg", /felg|wheel/], ["Szczotki do wnętrza i tapicerki", /tapicer|skór|sierści|auron/], ["Szczotki do mycia nadwozia"]],
    /szczotk|pędzel|brush|twister|wheel sword/],
  [A, "gabki-rekawice-i-aplikatory", [["Aplikatory", /aplikator|tickler|nakładania|do plastików|do opon/], ["Rękawice i gąbki do mycia"]], /^[^+]*(rękawic|gąbk|aplikator|tickler)/],
  [A, "mikrofibry-i-reczniki", [["Irchy", /ircha/], ["Ręczniki do osuszania", /osusz|moli|flossy|king|80x50|mr gray/], ["Mikrofibry do polerowania", /polerow|docierania|bona/], ["Mikrofibry do szyb i wnętrza", /szyb|wnętrz|tkanin|skór|\blea\b|rolce/], ["Mikrofibry uniwersalne"]],
    /^[^+]*(mikrofib|towel|ręcznik|ircha|ściereczka do polerowania)/],
  [A, "opryskiwacze-i-pianownice", [["Części do opryskiwaczy", /końcówk|lanca|pompk|rękojeść|wężyk|zawór|zespół/], ["Pianownice", /pianownic|foamer/], ["Opryskiwacze ręczne", /mercury|nix/], ["Opryskiwacze ciśnieniowe"]],
    /kwazar|opryskiwacz|pianownic|lanca teleskop|foamer/],
  [A, "zestawy-i-inne", "", /czyściwo/],

  // Dom i ogród
  [D, "kuchnia", [["Mycie naczyń", /naczy|boberex|tric\b/], ["Piekarniki, grille i odtłuszczanie", /grill|piekar|wędzar|indukc|ani-fat/], ["AGD i odkamienianie"]],
    /naczyń|naczyn|boberex|tric\b|grill|piekarnik|wędzarni|indukcyj|ekspres|agd|ani-fat|automatów do bitej|destoner|derast|odkamieniacz/],
  [D, "lazienka-i-wc", [["Toalety turystyczne", /przenośn|turyst|wolnostoj|blue magic|flush/], ["Kabiny prysznicowe i kamień", /kabin|prysznic|kamie/], ["Sanitariaty i WC"]],
    /\bwc\b|sanit|toalet|domestos|kabin|prysznic|cilit|yplon|sanicell|kratek|rokasat|wybiel|cif mleczko/],
  [D, "ogrod-i-elewacje", [["Kostka brukowa", /kostk|bruk/], ["Panele fotowoltaiczne", /solar|fotowolt/], ["Nagrobki i kamień", /nagrob|granit|marmur/], ["Elewacje i dachy"]],
    /kostk|bruk|elewac|dach|moss|apc out|nagrob|solar|fotowolt/],
  [D, "podlogi-i-posadzki", "", /podłóg|podłog|posadz|panele lamin|wood&panel|greskam|dekam|alcofloor|clean magic|sidolux|ronal|tfc coating|top ?efekt/],
  [D, "okna-i-lustra", "", /tenzi lustra|glasreiniger|top glass|pianka do szyb i luster/],
  [D, "meble-i-powierzchnie", [["Udrażnianie rur", /udrażn|drill|penetrator/], ["Pleśń i dezynfekcja", /pleś|grzybob|dezynf|ds-1/], ["Meble i powierzchnie"]],
    /mebl|office clean|lcd|ekran|steel shine|fast plast|sauna|anti-spot|royal cleaner|udrażn|drill|penetrator|pleś|grzybob|dezynfekcji powierzchni|ds-1/],
  [D, "akcesoria-do-sprzatania", "", /miotł/],

  // Serwis i warsztat
  [S, "mycie-rak", "", /rąk|hand clean|mydł|sapone|abra/],
  [S, "kleje-i-naprawy", "", /klej (szybk|uniwersal)|bondix|tapiflex|cynk|tłumik|pasta montażow/],
  [S, "smary-oleje-i-odrdzewiacze", "", /smar|olej|odrdzew|penetru|vulcan|sx90|mos2|usuwani[ae] rdzy/],
  [S, "zmywacze-i-odtluszczacze", "", /hamulc|brake|kontakt spray|super green specjal nf/],
  [S, "plyny-eksploatacyjne", "", /chłodnic|kuler|odmrażacz do zamka/],
  [S, "silnik-i-podwozie", "", /dpf|podwozi|durabit/],

  // Mycie auta
  [W, "szampony-i-piany", [["Neutralne piany pH", /neutral/], ["Piany aktywne", /pian|foam|snow|yeti/], ["Szampony samochodowe"]], /szampon|shampoo|pian[ay]\b|foam|snow ultra|actifoam|mud off/],
  [W, "pre-wash-i-dekontaminacja", "Usuwanie owadów", /owad|insekt|insect|mosquito|netins|pitch cleaner|stain remover/],
  [W, "pre-wash-i-dekontaminacja", "Usuwanie smoły, kleju i żywicy", /smoł|tar remover|żywic|etykiet|naklej|kleju|klejach|decabit|resinol/],
  [W, "pre-wash-i-dekontaminacja", "Odtłuszczacze i IPA", /\bipa\b|izopropyl|odtłuszcz|lack prepare/],
  [W, "pre-wash-i-dekontaminacja", "APC i środki uniwersalne", /\bapc\b|uniwersaln|brudex/],
  [W, "felgi-i-opony", [["Powłoki do felg", /powłok|coating/], ["Krwawa felga", /krwaw|roton(?! pro)|prix|vampire/], ["Kwaśne płyny do felg", /kwas|alux|acid/], ["Płyny do felg"]],
    /felg|kołpak|wheel|alux|prix|lacer|forlega|en-jee|vampire|roton/],
  [W, "felgi-i-opony", "Dressingi do opon", /opon|tire|czernid|\bbold\b|bono black|sigma|wet look|tre-p/],
  [W, "plastiki-guma-i-detale", "Folie PPF i winyl", /ppf/],
  [W, "plastiki-guma-i-detale", "Reflektory i lampy", /^(?!.*szyb(?!k)).*(reflektor|headlight|\blamp)/],
  [W, "plastiki-guma-i-detale", "Chrom i metal", /chrom|metal polish/],
  [W, "plastiki-guma-i-detale", "Plastiki zewnętrzne", /zewnętrzn|zderzak|tworzyw|vinyl|matt max|przezroczyst|nano hard/],
  [W, "plastiki-guma-i-detale", "Guma i uszczelki", /uszczel|gum[yaą]\b/],
  [W, "plastiki-guma-i-detale", "Mycie silnika", /silnik|engine|motorcleaner|akra/],
  [W, "szyby-i-lusterka", [["Płyny do spryskiwaczy", /spryskiwacz|claren/], ["Odmrażacze", /odmrażacz/], ["Antypara", /antypar|antyrosz|zaparow|parowani/],
    ["Polerowanie szyb", /glass polish|compound|intensywnego czyszczenia/], ["Niewidzialne wycieraczki i powłoki", /glaco(?! de cleaner)|roll-on|niewidzialn|quartz|hydrofob/], ["Płyny do szyb"]],
    /szyb(?!k)|glass|glaco|lusterk|rain-x|spryskiwacz|claren|odmrażacz|antypar|antyrosz|zaparow|parowani/],

  // Wnętrze auta
  [IN, "tapicerka-i-dywaniki", "Odplamiacze", /odplamiacz|plam/],
  [IN, "skora-i-alcantara", [["Pielęgnacja i impregnacja skóry", /pielęgn|care|cream|balm|impregn|odżywia|wosk|konserw/], ["Czyszczenie skóry"]], /skór|leather|leder|alcantar|rinpel/],
  [IN, "tapicerka-i-dywaniki", [["Impregnaty do tkanin", /impregnat|coating/], ["Pianki do tapicerki", /piank/], ["Pranie tapicerki i dywaników"]],
    /tapicer|dywan|textil|wykładzin|bonnet|detap|tuff stuff|per mobil|tkanin|podsufit/],
  [IN, "kokpit-i-plastiki", [["Ściereczki do kokpitu", /ściereczk/], ["Kokpit matowy", /mat/], ["Kokpit z połyskiem", /nabłyszcz|połysk|polo/], ["Interior detailery i cleanery"]],
    /kokpit|cockpit|plastik|satina|interior|inside cleaner|wnętrz|vinet|nabłyszczający 750|cleanstar/],

  // Polerowanie i ochrona lakieru
  [P, "woski", [["Woski koloryzujące", /koloryz|color|silver/], ["Woski w płynie i sprayu"]], /polish ?& ?wax/],
  [P, "pasty-polerskie", [["Pasty tnące", /cut|05-0|fs 05/], ["One step i AIO", /all in one|\baio\b|os 02|one step|xp 02|express/],
    ["Usuwanie rys i regeneracja", /rys|zarysow|regener|lekkościern|auto politura|venox/], ["Politury wykończeniowe"]],
    /past[ay] polersk|cutmax|\bcut\b|excut|profiline (fs|np|ex|xp|os)|perfect finish|politur|polish|lekkościern|zarysowa|regeneracji lakieru|venox/],
  [P, "woski", [["Woski koloryzujące", /koloryz|color|silver/], ["Woski w płynie i sprayu", /płyn|spray|liquid|na mokro|quick wax|spectrum|\d\s?ml\b|\d\s?l\b|0,3l/], ["Woski twarde i pasty"]],
    /wosk|wax|carnauba/],
  [P, "powloki-i-quick-detailery", [["Quick detailery", /\bqd\b|quick detailer|detailer|car shine|reloader/], ["Powłoki ceramiczne", /ceramic|ceramiczn|coating|cc36/], ["Sealanty i szybka ochrona"]],
    /ceramic|ceramiczn|coating|cc36|powłok|quartz|reloader|\bqd\b|quick detailer|detailer|car shine|speed protect|sealant|spray ?& ?seal|netsch?ield|polymer/],
];

function classify(name) {
  const big = /\b(5|10|20|25|30)\s?(l|kg|litr)/i.test(name) ? " #duze" : "";
  const text = name.toLowerCase() + big;
  for (const [category, subcategory, type, re] of rules) {
    if (!re.test(text)) continue;
    let t = type;
    if (Array.isArray(type)) t = (type.find(([, r]) => !r || r.test(text)) ?? type[type.length - 1])[0];
    return { category, subcategory, type: t ? `${subcategory}-${slugPart(t)}` : undefined };
  }
  return null;
}

// --- Marka --------------------------------------------------------------------
const NOT_BRANDS = new Set(["", "AKCESORIA DO MYJNI", "INNI PRODUCENCI", "DYFUZOR ELEKTRYCZNY", "AKCESORIA DO SPRZĄTANIA", "BRAK DANYCH", "MARKA NIEZDEFINIOWANA"]);
// Marki rozpoznawane z początku nazwy, gdy BaseLinker nie ma producenta
const NAME_BRANDS = ["SONAX", "K2", "ADBL", "TENZI", "PLAK", "KWAZAR", "SOFT99", "NERTA", "EASY WASH", "ROYAL", "CLINEX", "MENZERNA", "MEGUIAR'S", "HOLTS", "EVOS", "QUIXX",
  "AUTOBELLA", "CARAMBA", "KRYPTON", "FORCH", "PRESTONE", "TURTLE WAX", "SHINE CHEMICALS", "CARTEC", "DIMER", "RINPEL", "VINET", "WUNDERBAUM", "RAIN-X", "ARMORALL", "CARDOS", "PINGI"];
const BRAND_ALIASES = { EVOS: "K2", "EASY-WASH": "Easy wash" };
const brandCase = (b) => BRAND_ALIASES[b.toUpperCase()] ?? (b.length <= 4 ? b.toUpperCase() : b.charAt(0).toUpperCase() + b.slice(1).toLowerCase());
// Najpierw marka z nazwy (BaseLinker czasem podaje hurtownika zamiast marki, np. ATAS przy PLAK)
function brandOf(producer, name) {
  const up = name.toUpperCase().replace(/’/g, "'");
  const hit = NAME_BRANDS.find((n) => [" ", "–", "-"].some((sep) => up.startsWith(n + sep)));
  if (hit) return brandCase(hit);
  const b = (producer || "").split(" - ")[0].trim();
  return NOT_BRANDS.has(b.toUpperCase()) || /^kenochem$/i.test(b) ? "" : brandCase(b);
}

const variantLabel = (name) => {
  const m = name.match(/(\d+(?:[.,]\d+)?)\s?(ml|l|kg|g|szt)\b/i);
  if (!m) return "1 szt.";
  const unit = m[2].toLowerCase() === "l" ? "L" : m[2].toLowerCase();
  return `${m[1]} ${unit}`;
};

const cleanHtml = (html) =>
  html
    .replace(/<(script|style|iframe|object)[\s\S]*?<\/\1>/gi, "")
    .replace(/<img[^>]+src=["'](?!https?:)[^"']*["'][^>]*>/gi, "")
    .replace(/\s(style|class|id|width|height|border|align|on\w+)=("[^"]*"|'[^']*')/gi, "")
    .replace(/\shref=("|')\s*javascript:[^"']*\1/gi, "")
    .replace(/<\/?(div|span|font)[^>]*>/gi, "")
    .replace(/<h1/gi, "<h2").replace(/<\/h1>/gi, "</h2>")
    .replace(/<p>(\s|&nbsp;| )*<\/p>/gi, "")
    .replace(/\n{2,}/g, "\n")
    .trim();

const plainText = (html) =>
  html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();

// --- Dopasowanie produktów ze strony do CSV ----------------------------------
const bySku = new Map(), byName = new Map();
for (const r of rows) {
  if (r.produkt_sku) bySku.set(r.produkt_sku.trim().toLowerCase(), r);
  if (r.produkt_ean) bySku.set(r.produkt_ean.trim(), r);
  byName.set(norm(r.produkt_nazwa), r);
}

const products = [];
const descriptions = {};
const used = new Map(); // id w BaseLinkerze → slug (ten sam produkt dwa razy na stronie)
const report = { notInCsv: [], duplicates: [], noCategory: [], skipped: [] };
const productRedirects = [];

// Przy duplikatach zostaje wersja z SKU (pewne dopasowanie), druga dostaje przekierowanie
const ordered = [...shop.products].sort((a, b) => Number(Boolean(b.sku)) - Number(Boolean(a.sku)));
for (const w of ordered) {
  const name = decode(w.name);
  if (SKIP.test(name)) { report.skipped.push(name); continue; }
  const r = bySku.get((w.sku || "").trim().toLowerCase()) ?? byName.get(norm(name)) ?? (ALIASES[name] && bySku.get(ALIASES[name].toLowerCase()));
  if (!r) { report.notInCsv.push(`${w.sku || "(bez SKU)"} | ${name} | ${w.permalink}`); continue; }
  if (used.has(r.produkt_id)) {
    report.duplicates.push(`${name} → to samo co /produkt/${used.get(r.produkt_id)}`);
    productRedirects.push({ from: `/produkt/${decodeURIComponent(w.slug)}/`, to: `/produkt/${used.get(r.produkt_id)}` });
    continue;
  }

  const slug = decodeURIComponent(w.slug);
  used.set(r.produkt_id, slug);
  const cat = classify(name);
  if (!cat) report.noCategory.push(`${name} | było: ${w.categories.join(", ") || "brak"}`);

  const csvImages = [r.zdjecie, ...Array.from({ length: 15 }, (_, i) => r[`zdjecie_dodatkowe_${i + 1}`])]
    .filter((u) => u && /^https?:\/\//.test(u) && !u.includes("//kenochem.com/"));
  const images = (w.images.length ? w.images : csvImages).slice(0, 6);
  const html = cleanHtml(r.opis || "");
  const text = plainText(html);
  const price = w.price > 0 ? w.price : parseFloat(String(r.cena).replace(",", "."));

  products.push({
    id: r.produkt_id,
    wooId: w.id,
    slug,
    name,
    brand: brandOf(r.producent_nazwa, name),
    ...(cat ?? { category: "akcesoria-detailingowe", subcategory: "zestawy-i-inne" }),
    sku: r.produkt_sku || w.sku || "",
    ean: r.produkt_ean || "",
    vat: parseInt(r.stawka_vat) || 23,
    stock: Math.max(0, parseInt(r.ilosc) || 0),
    variants: [{ id: "1", label: variantLabel(name), price }],
    images,
    short: text.length > 220 ? text.slice(0, 217).replace(/\s\S*$/, "") + "…" : text,
  });
  descriptions[slug] = html;
}

// Najnowsze produkty na stronie (najwyższe ID w WooCommerce) – nowości
[...products].sort((a, b) => b.wooId - a.wooId).slice(0, 24).forEach((p) => (p.badges = ["nowosc"]));
for (const p of products) delete p.wooId;

// --- Przekierowania starych kategorii ----------------------------------------
// Stara kategoria → dział/podkategoria, do której trafiła większość jej produktów
const votes = {};
for (const w of shop.products) {
  const p = products.find((x) => x.slug === decodeURIComponent(w.slug));
  if (!p) continue;
  for (const c of w.categories) {
    votes[c] ??= {};
    const k = `${p.category}?sub=${p.subcategory}`;
    votes[c][k] = (votes[c][k] || 0) + 1;
    votes[c][p.category] = (votes[c][p.category] || 0) + 0.01;
  }
}
// Kategorie, w których głosowanie daje mylący wynik (np. szampony 5–20 l trafiły do myjni)
const CATEGORY_TARGETS = {
  "chemia-samochodowa": "/kategoria/mycie-auta",
  "pielegnacja-zewnetrzna-auta": "/kategoria/mycie-auta",
  "czyszczenie-i-pielegnacja-lakieru-samochodowego": "/kategoria/polerowanie-i-ochrona",
  "szampony-i-piany-do-auta": "/kategoria/mycie-auta?sub=szampony-i-piany",
  "woski-i-powloki-ceramiczne-do-auta": "/kategoria/polerowanie-i-ochrona",
  "akcesoria-samochodowe": "/kategoria/akcesoria-detailingowe",
  "gabki-szczotki-i-skrobaczki-samochodowe": "/kategoria/akcesoria-detailingowe",
  "zestawy-prezentowe": "/kategoria/akcesoria-detailingowe?sub=zestawy-i-inne",
  "dom-i-ogrod": "/kategoria/dom-i-ogrod",
  "akcesoria-dom-i-ogrod": "/kategoria/dom-i-ogrod?sub=akcesoria-do-sprzatania",
  "gabki-i-sciereczki": "/kategoria/dom-i-ogrod?sub=akcesoria-do-sprzatania",
};
const catById = new Map(shop.categories.map((c) => [c.id, c]));
const catPath = (c) => { const parts = []; while (c) { parts.unshift(c.slug); c = catById.get(c.parent); } return parts.join("/"); };
const redirects = shop.categories.flatMap((c) => {
  const v = votes[c.slug] ?? {};
  const total = Object.entries(v).filter(([k]) => k.includes("?")).reduce((s, [, n]) => s + n, 0);
  const [best, n] = Object.entries(v).filter(([k]) => k.includes("?")).sort((a, b) => b[1] - a[1])[0] ?? [];
  // Gdy produkty rozjechały się po wielu podkategoriach – przekierowanie na cały dział
  const to = CATEGORY_TARGETS[c.slug] ?? (!best ? "/" : n / total >= 0.6 ? `/kategoria/${best}` : `/kategoria/${best.split("?")[0]}`);
  const full = `/kategoria-produktu/${catPath(c)}/`;
  // WooCommerce otwiera kategorię także pod samym ostatnim członem adresu – takie linki są w artykułach
  const short = `/kategoria-produktu/${c.slug}/`;
  return full === short ? [{ from: full, to }] : [{ from: full, to }, { from: short, to }];
}).concat(productRedirects);

// --- Zapis --------------------------------------------------------------------
const out = path.join(import.meta.dirname, "..", "src", "data");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "products.json"), JSON.stringify(products));
fs.writeFileSync(path.join(out, "descriptions.json"), JSON.stringify(descriptions));
fs.writeFileSync(path.join(out, "redirects.json"), JSON.stringify(redirects, null, 1));

const section = (title, list) => `\n## ${title} (${list.length})\n${list.join("\n")}\n`;
fs.writeFileSync(
  path.join(import.meta.dirname, "import-report.txt"),
  `Import ${new Date().toISOString()} – na stronie: ${shop.products.length}, zaimportowano: ${products.length}\n` +
    section("Na stronie, ale brak w CSV z BaseLinkera (NIE zaimportowane)", report.notInCsv) +
    section("Ten sam produkt dwa razy na stronie (zaimportowany raz)", report.duplicates) +
    section("Bez dopasowanej kategorii (trafiły do: Akcesoria › Czyściwa, zestawy i inne)", report.noCategory) +
    section("Pominięte", report.skipped),
);

const dist = {};
for (const p of products) {
  const k = `${p.category} / ${p.subcategory}`;
  dist[k] = (dist[k] || 0) + 1;
}
console.log(`Zaimportowano ${products.length} z ${shop.products.length} produktów ze strony (CSV: ${rows.length} pozycji).`);
console.log(`Brak w CSV: ${report.notInCsv.length}, duplikaty: ${report.duplicates.length}, bez kategorii: ${report.noCategory.length}`);
console.table(Object.entries(dist).sort().map(([k, n]) => ({ kategoria: k, produktow: n })));
