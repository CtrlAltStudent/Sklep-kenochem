// Typy, kategorie i funkcje pomocnicze – bezpieczne do użycia w komponentach klienckich.
// Sam katalog produktów (kilka MB) ładuje tylko serwer – patrz lib/catalog.ts.

export type Category = {
  slug: string;
  name: string;
  lucide: IconName; // ikona konturowa (menu, listy)
  color: string; // kolor akcentu kategorii
  children: Subcategory[];
};

// 2. poziom (podkategoria) z listą kategorii 3. poziomu („typ”, np. Mycie samochodu › Aktywne piany)
export type Subcategory = { slug: string; name: string; lucide: IconName; types: { slug: string; name: string }[] };

// Nazwy ikon Lucide używanych dla kategorii (komponent: components/CatIcon.tsx)
export type IconName =
  | "Car" | "Droplets" | "Bug" | "Disc3" | "AppWindow" | "Armchair" | "Sparkles" | "ShieldCheck" | "ShowerHead" | "FlaskConical"
  | "Cog" | "SprayCan" | "Fan" | "Brush" | "Eraser" | "Layers" | "PaintRoller" | "Pipette" | "HardHat" | "Shapes" | "Building2"
  | "Building" | "ChefHat" | "Shirt" | "Sofa" | "Hand" | "Scroll" | "House" | "Bath" | "Trees" | "Frame" | "Flower2" | "Wind"
  | "AirVent" | "Flame" | "TestTubeDiagonal" | "Wrench" | "Droplet" | "Fuel" | "AudioWaveform" | "Tractor" | "ShieldPlus" | "Truck";

export const VARIANT_DISPLAY = [
  { id: "pojemnosc", label: "Pojemność", hint: "Przyciski 500 ml / 1 L / 5 L", placeholder: "np. 1 L" },
  { id: "zdjecie", label: "Zdjęcie", hint: "Miniatury opakowań do kliknięcia", placeholder: "np. czerwony" },
  { id: "dlugosc", label: "Długość", hint: "Przyciski 5 m / 10 m / 25 m", placeholder: "np. 10 m" },
  { id: "waga", label: "Waga", hint: "Przyciski 1 kg / 5 kg / 10 kg", placeholder: "np. 5 kg" },
  { id: "kolor", label: "Kolor", hint: "Przyciski z nazwą koloru", placeholder: "np. czarny" },
  { id: "opakowanie", label: "Opakowanie", hint: "Sztuka, komplet, zestaw", placeholder: "np. 12 szt." },
  { id: "inny", label: "Etykieta", hint: "Własny podpis na przycisku", placeholder: "np. zestaw" },
] as const;
export type VariantDisplay = (typeof VARIANT_DISPLAY)[number]["id"];
export const variantDisplayOf = (id?: string | null) => VARIANT_DISPLAY.find((x) => x.id === id) ?? VARIANT_DISPLAY[0];

export const VARIANT_NAV = [
  { id: "switch", label: "Jedna karta", hint: "Pozostałe warianty znikają z list. Klient przełącza je na tej stronie, bez zmiany adresu." },
  { id: "link", label: "Osobne strony", hint: "Każdy wariant jest widoczny w sklepie jak zwykły produkt. Kliknięcie otwiera jego kartę – i odwrotnie." },
] as const;
export type VariantNav = (typeof VARIANT_NAV)[number]["id"];
export const variantNavOf = (id?: string | null) => VARIANT_NAV.find((x) => x.id === id) ?? VARIANT_NAV[0];

export type QtyTier = { qty: number; percent: number; free?: boolean };
export type Variant = { id: string; label: string; price: number; oldPrice?: number; slug?: string; sku?: string; ean?: string; stock?: number; image?: string; qtyDeal?: QtyTier[] };

// Najtańsza pojemność, którą da się kupić (albo najtańsza w ogóle, gdy wszystkie są na wyczerpaniu)
export const buyVariant = (p: { variants: Variant[] }) => {
  const ok = p.variants.filter((v) => (v.stock ?? 0) > 0);
  return (ok.length ? ok : p.variants).reduce((a, b) => (b.price < a.price ? b : a));
};

// Na liście: w trybie osobnych stron kupujemy ten produkt, nie najtańszego brata
export const cardVariant = (p: { slug: string; variants: Variant[]; variantNav?: string }) =>
  p.variantNav === "link" ? (p.variants.find((v) => v.slug === p.slug) ?? p.variants[0]) : buyVariant(p);
export const showFromPrice = (p: { variants: Variant[]; variantNav?: string }) => p.variantNav !== "link" && p.variants.length > 1;

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  type?: string; // kategoria 3. poziomu (slug), jeśli produkt jest do niej przypisany
  sku: string;
  ean: string;
  vat: number;
  stock: number;
  variants: Variant[];
  variantDisplay?: VariantDisplay;
  variantNav?: VariantNav;
  images: string[];
  short: string;
  badges?: ("nowosc" | "promocja" | "bestseller")[];
  lowestPrice30d?: number; // Omnibus – tylko gdy jest cena przekreślona
  saleTo?: string; // koniec promocji czasowej
  updatedAt?: string; // ostatnia zmiana w panelu (mapa strony, feed Google)
  addedAt?: string; // data dodania produktu – siatka „Nowości”, gdy nie wybrano ręcznie
  seo?: { title?: string; description?: string; noindex?: boolean; canonical?: string }; // zakładka „SEO i Google”
  bundleParts?: { slug?: string; name: string; sku: string; qty: number; image?: string }[];
  qtyDeal?: QtyTier[];
};

// Lekka wersja produktu wysyłana do przeglądarki (listy, koszyk, ulubione).
export type ProductCardData = Pick<Product, "slug" | "sku" | "name" | "brand" | "category" | "subcategory" | "type" | "stock" | "variants" | "variantDisplay" | "variantNav" | "badges" | "lowestPrice30d"> & {
  image?: string;
};

export const usableImages = (images: string[]) => images.filter(Boolean);

export const toCard = (p: Product): ProductCardData => ({
  slug: p.slug,
  sku: p.sku,
  name: p.name,
  brand: p.brand,
  category: p.category,
  subcategory: p.subcategory,
  type: p.type,
  stock: p.stock,
  variants: p.variants,
  variantDisplay: p.variantDisplay,
  variantNav: p.variantNav,
  badges: p.badges,
  image: usableImages(p.images)[0],
  lowestPrice30d: p.lowestPrice30d,
});

export const FREE_SHIPPING = 249.99;
// Kwota pokazywana na stronie (pasek, etykieta, koszyk). Ustawienia sklepu → Dostawa.
export const freeShippingFrom = (s: { freeShippingThreshold?: number | null }) =>
  typeof s.freeShippingThreshold === "number" && s.freeShippingThreshold >= 0 ? s.freeShippingThreshold : FREE_SHIPPING;

type ShipFree = { price: number; freeAboveThreshold?: boolean | null; freeFrom?: number | null };

// Od ilu złotych ta metoda jest gratis. null = nigdy (np. pobranie). Puste „Darmowa od” = kwota sklepu.
export const methodFreeFrom = (m: ShipFree, shopDefault: number): number | null => {
  if (m.freeAboveThreshold === false) return null;
  if (typeof m.freeFrom === "number" && m.freeFrom >= 0) return m.freeFrom;
  return shopDefault;
};

export const isShippingFree = (m: ShipFree, subtotal: number, shopDefault: number, couponFree = false) => {
  if (m.price === 0 || couponFree) return true;
  const from = methodFreeFrom(m, shopDefault);
  return from != null && subtotal >= from;
};

// Payload podaje pliki z pełnym adresem serwera (serverURL) – w sklepie używamy ścieżki, żeby działało na każdej domenie
export const mediaPath = (url?: string | null) => (url ? url.replace(/^https?:\/\/[^/]+(?=\/api\/media\/)/, "") : undefined);

// Adres kategorii 3. poziomu: <podkategoria>-<nazwa>, np. mycie-samochodu-aktywne-piany (nazwy się powtarzają między działami)
const PL_CHARS: Record<string, string> = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
export const slugPart = (s: string) => s.toLowerCase().replace(/[ąćęłńóśźż]/g, (c) => PL_CHARS[c]).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sub = (slug: string, name: string, lucide: IconName, types: string[]): Subcategory => ({
  slug, name, lucide, types: types.map((t) => ({ slug: `${slug}-${slugPart(t)}`, name: t })),
});

// Drzewo kategorii Sonax: dział › podkategoria › typ produktu.
// Zbudowane na bazie kategorii z sonax.sklep.pl, rozbite drobniej pod detailing. Przypisanie produktów: scripts/import-products.mjs
export const categories: Category[] = [
  {
    slug: "mycie-auta",
    name: "Mycie auta",
    lucide: "Droplets",
    color: "#0b5cd5",
    children: [
      sub("szampony-i-piany", "Szampony i piany aktywne", "Droplets", ["Szampony samochodowe", "Piany aktywne", "Neutralne piany pH"]),
      sub("pre-wash-i-dekontaminacja", "Pre-wash i dekontaminacja", "Bug", ["Usuwanie owadów", "Usuwanie smoły, kleju i żywicy", "Odtłuszczacze i IPA", "APC i środki uniwersalne", "Usuwanie osadów i rdzy"]),
      sub("felgi-i-opony", "Felgi i opony", "Disc3", ["Płyny do felg", "Krwawa felga", "Kwaśne płyny do felg", "Dressingi do opon", "Powłoki do felg"]),
      sub("szyby-i-lusterka", "Szyby i lusterka", "AppWindow", ["Płyny do szyb", "Niewidzialne wycieraczki i powłoki", "Polerowanie szyb", "Antypara", "Płyny do spryskiwaczy", "Odmrażacze"]),
      sub("plastiki-guma-i-detale", "Plastiki, guma i detale", "ShieldCheck", ["Plastiki zewnętrzne", "Guma i uszczelki", "Folie PPF i winyl", "Reflektory i lampy", "Chrom i metal", "Dachy cabrio", "Mycie silnika"]),
    ],
  },
  {
    slug: "polerowanie-i-ochrona",
    name: "Polerowanie i ochrona lakieru",
    lucide: "Sparkles",
    color: "#e30613",
    children: [
      sub("pasty-polerskie", "Pasty polerskie i politury", "Sparkles", ["Pasty tnące", "Politury wykończeniowe", "One step i AIO", "Usuwanie rys i regeneracja"]),
      sub("pady-polerskie", "Pady i gąbki polerskie", "Disc3", ["Pady tnące", "Pady polerujące i wykończeniowe"]),
      sub("woski", "Woski", "Flame", ["Woski twarde i pasty", "Woski w płynie i sprayu", "Woski koloryzujące"]),
      sub("powloki-i-quick-detailery", "Powłoki, sealanty i quick detailery", "ShieldPlus", ["Powłoki ceramiczne", "Quick detailery", "Sealanty i szybka ochrona"]),
    ],
  },
  {
    slug: "wnetrze-auta",
    name: "Wnętrze auta",
    lucide: "Armchair",
    color: "#0b5cd5",
    children: [
      sub("kokpit-i-plastiki", "Kokpit i plastiki", "Car", ["Kokpit matowy", "Kokpit z połyskiem", "Ściereczki do kokpitu", "Interior detailery i cleanery"]),
      sub("tapicerka-i-dywaniki", "Tapicerka i dywaniki", "Sofa", ["Pianki do tapicerki", "Pranie tapicerki i dywaników", "Odplamiacze", "Impregnaty do tkanin"]),
      sub("skora-i-alcantara", "Skóra i alcantara", "Armchair", ["Czyszczenie skóry", "Pielęgnacja i impregnacja skóry", "Naprawa skóry"]),
      sub("klimatyzacja-i-nawiewy", "Klimatyzacja i nawiewy", "AirVent", []),
      sub("zapachy-samochodowe", "Zapachy i neutralizatory", "Wind", ["Perfumy samochodowe", "Zawieszki zapachowe", "Neutralizatory zapachów", "Pochłaniacze wilgoci"]),
    ],
  },
  {
    slug: "akcesoria-detailingowe",
    name: "Akcesoria detailingowe",
    lucide: "Brush",
    color: "#0b5cd5",
    children: [
      sub("mikrofibry-i-reczniki", "Mikrofibry i ręczniki", "Layers", ["Ręczniki do osuszania", "Mikrofibry do polerowania", "Mikrofibry do szyb i wnętrza", "Mikrofibry uniwersalne", "Irchy"]),
      sub("gabki-rekawice-i-aplikatory", "Gąbki, rękawice i aplikatory", "Hand", ["Rękawice i gąbki do mycia", "Aplikatory"]),
      sub("szczotki-i-pedzle", "Szczotki i pędzle", "Brush", ["Pędzle detailingowe", "Szczotki do felg", "Szczotki do wnętrza i tapicerki", "Szczotki na wkrętarkę", "Szczotki do mycia nadwozia"]),
      sub("opryskiwacze-i-pianownice", "Opryskiwacze i pianownice", "SprayCan", ["Opryskiwacze ręczne", "Opryskiwacze ciśnieniowe", "Pianownice", "Części do opryskiwaczy"]),
      sub("zestawy-i-inne", "Czyściwa, zestawy i inne", "Shapes", []),
    ],
  },
  {
    slug: "chemia-do-myjni",
    name: "Chemia do myjni",
    lucide: "ShowerHead",
    color: "#0b5cd5",
    children: [
      sub("mycie-bezdotykowe", "Mycie bezdotykowe i piany", "ShowerHead", []),
      sub("ciezarowki-i-pojazdy-uzytkowe", "Ciężarówki i pojazdy użytkowe", "Truck", []),
      sub("woski-do-myjni", "Woski i nabłyszczacze do myjni", "Sparkles", []),
      sub("preparaty-specjalistyczne", "Preparaty specjalistyczne", "FlaskConical", []),
    ],
  },
  {
    slug: "serwis-i-warsztat",
    name: "Serwis i warsztat",
    lucide: "Wrench",
    color: "#0b5cd5",
    children: [
      sub("silnik-i-podwozie", "Silnik, DPF i podwozie", "Cog", []),
      sub("zmywacze-i-odtluszczacze", "Zmywacze i odtłuszczacze", "Droplet", []),
      sub("smary-oleje-i-odrdzewiacze", "Smary, oleje i odrdzewiacze", "Fuel", []),
      sub("plyny-eksploatacyjne", "Płyny eksploatacyjne", "FlaskConical", []),
      sub("kleje-i-naprawy", "Kleje i naprawy", "Wrench", []),
      sub("mycie-rak", "Pasty i mydła do rąk", "Hand", []),
    ],
  },
  {
    slug: "dom-i-ogrod",
    name: "Dom i ogród",
    lucide: "House",
    color: "#0b5cd5",
    children: [
      sub("kuchnia", "Kuchnia", "ChefHat", ["Mycie naczyń", "Piekarniki, grille i odtłuszczanie", "AGD i odkamienianie"]),
      sub("lazienka-i-wc", "Łazienka i WC", "Bath", ["Sanitariaty i WC", "Kabiny prysznicowe i kamień", "Toalety turystyczne"]),
      sub("podlogi-i-posadzki", "Podłogi i posadzki", "PaintRoller", []),
      sub("okna-i-lustra", "Okna i lustra", "Frame", []),
      sub("meble-i-powierzchnie", "Meble i środki specjalne", "Building", ["Meble i powierzchnie", "Udrażnianie rur", "Pleśń i dezynfekcja"]),
      sub("odswiezacze-powietrza", "Odświeżacze powietrza", "AirVent", []),
      sub("ogrod-i-elewacje", "Ogród, elewacje i kamień", "Trees", ["Kostka brukowa", "Elewacje i dachy", "Nagrobki i kamień", "Panele fotowoltaiczne", "Inne do ogrodu"]),
      sub("akcesoria-do-sprzatania", "Akcesoria do sprzątania", "Scroll", []),
    ],
  },
];

// Szybkie wyszukiwanie kategorii 3. poziomu po slugu
export const findType = (typeSlug: string) => {
  for (const c of categories) for (const s of c.children) {
    const t = s.types.find((x) => x.slug === typeSlug);
    if (t) return { category: c, sub: s, type: t };
  }
  return undefined;
};

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const minPrice = (p: { variants: Variant[] }) => Math.min(...p.variants.map((x) => x.price));
// Cena jednostkowa (wymóg ustawy o informowaniu o cenach): zł/l lub zł/kg z etykiety pojemności
export function unitPrice(price: number, label: string): string | null {
  const m = label.match(/([\d.,]+)\s*(ml|l|kg|g)\b/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  if (!n) return null;
  const u = m[2].toLowerCase();
  const base = u === "ml" || u === "g" ? n / 1000 : n;
  const unit = u === "ml" || u === "l" ? "l" : "kg";
  if (base === 1) return null; // dla 1 l / 1 kg cena jednostkowa = cena
  return `${new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(price / base)}/${unit}`;
}

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n);

// Adres strony marki: /marki/<slug>
export const brandSlug = (brand: string) => slugPart(brand);
