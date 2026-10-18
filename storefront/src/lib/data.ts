// Typy, kategorie i funkcje pomocnicze – bezpieczne do użycia w komponentach klienckich.
// Sam katalog produktów (kilka MB) ładuje tylko serwer – patrz lib/catalog.ts.

export type Category = {
  slug: string;
  name: string;
  icon: string; // ikona z /public/brand (z kenochem.com)
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

export type Variant = { id: string; label: string; price: number; oldPrice?: number };

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
  images: string[];
  short: string;
  badges?: ("nowosc" | "promocja" | "bestseller")[];
  lowestPrice30d?: number; // Omnibus – tylko gdy jest cena przekreślona
  saleTo?: string; // koniec promocji czasowej
};

// Lekka wersja produktu wysyłana do przeglądarki (listy, koszyk, ulubione).
export type ProductCardData = Pick<Product, "slug" | "name" | "brand" | "category" | "subcategory" | "type" | "stock" | "variants" | "badges" | "lowestPrice30d"> & {
  image?: string;
};

// Awaryjnie: NEXT_PUBLIC_SKIP_KENOCHEM_IMAGES=1 w .env.local wyłącza zdjęcia z kenochem.com
// (np. gdy serwer starego sklepu nie odpowiada) – zostają zdjęcia z innych serwerów.
const skipKenochem = process.env.NEXT_PUBLIC_SKIP_KENOCHEM_IMAGES === "1";
export const usableImages = (images: string[]) =>
  skipKenochem ? images.filter((u) => !u.includes("//kenochem.com/")) : images;

export const toCard = (p: Product): ProductCardData => ({
  slug: p.slug,
  name: p.name,
  brand: p.brand,
  category: p.category,
  subcategory: p.subcategory,
  type: p.type,
  stock: p.stock,
  variants: p.variants,
  badges: p.badges,
  image: usableImages(p.images)[0],
  lowestPrice30d: p.lowestPrice30d,
});

export const FREE_SHIPPING = 399;

// Adres kategorii 3. poziomu: <podkategoria>-<nazwa>, np. mycie-samochodu-aktywne-piany (nazwy się powtarzają między działami)
const PL_CHARS: Record<string, string> = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
export const slugPart = (s: string) => s.toLowerCase().replace(/[ąćęłńóśźż]/g, (c) => PL_CHARS[c]).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sub = (slug: string, name: string, lucide: IconName, types: string[]): Subcategory => ({
  slug, name, lucide, types: types.map((t) => ({ slug: `${slug}-${slugPart(t)}`, name: t })),
});

// Drzewo kategorii jak na kenochem.098.pl: dział › podkategoria › typ produktu
export const categories: Category[] = [
  {
    slug: "chemia-samochodowa",
    name: "Chemia samochodowa",
    icon: "/brand/SamochodNaZewnatrz2.png",
    lucide: "Car",
    color: "#4f9a12",
    children: [
      sub("mycie-samochodu", "Mycie samochodu", "Droplets", ["Aktywne piany", "Szampony samochodowe", "Pre-wash i TFR", "APC do samochodu", "Preparaty do mocnych zabrudzeń"]),
      sub("trudne-zabrudzenia", "Trudne zabrudzenia", "Bug", ["Usuwanie owadów", "Usuwanie smoły, asfaltu, kleju i żywicy", "Deironizery i osady metaliczne"]),
      sub("felgi-i-opony", "Felgi i opony", "Disc3", ["Płyny do felg", "Krwawa felga", "Neutralne płyny do felg", "Kwaśne płyny do felg", "Dressingi i czernidła do opon"]),
      sub("szyby-i-szklo", "Szyby i szkło", "AppWindow", ["Płyny do szyb samochodowych", "Niewidzialne wycieraczki", "Odmrażacze do szyb", "Antypara", "Płyny do spryskiwaczy"]),
      sub("wnetrze-samochodu", "Wnętrze samochodu", "Armchair", ["Kokpit i plastiki", "Tapicerka materiałowa", "Skóra samochodowa", "Klimatyzacja samochodowa", "Zapachy i neutralizatory do samochodu"]),
      sub("pielegnacja-lakieru", "Pielęgnacja lakieru", "Sparkles", ["Pasty polerskie", "Cleanery, politury i AIO", "Quick detailery", "Woski samochodowe", "Powłoki ceramiczne i ochronne"]),
      sub("elementy-zewnetrzne", "Elementy zewnętrzne", "ShieldCheck", ["Plastiki zewnętrzne", "Gumy i uszczelki", "Chrom i metale", "Dachy cabrio", "Czyszczenie silnika", "Konserwacja podwozia"]),
    ],
  },
  {
    slug: "myjnie-i-urzadzenia",
    name: "Myjnie i urządzenia",
    icon: "/brand/MaszynyUrzadzenia2.png",
    lucide: "ShowerHead",
    color: "#1f5f8b",
    children: [
      sub("chemia-do-myjni", "Chemia do myjni", "FlaskConical", ["Aktywne piany do myjni", "Proszki do myjni samochodowych", "Szampony do myjni", "Woski osuszające i hydrowoski", "Preparaty do felg do myjni", "Preparaty do owadów, smoły i asfaltu"]),
      sub("czesci-do-myjek", "Części do myjek", "Cog", ["Lance i pistolety", "Węże i bębny", "Dysze do myjek", "Szybkozłącza i adaptery", "Filtry, redukcje i zawory", "Akcesoria do myjek"]),
      sub("pianownice-i-oprysk", "Pianownice i oprysk", "SprayCan", ["Pianownice ręczne", "Pianownice do myjek", "Opryskiwacze ciśnieniowe", "Opryskiwacze pianujące"]),
      sub("odkurzacze-i-tapicerka", "Odkurzacze i tapicerka", "Fan", ["Odkurzacze", "Odkurzacze piorące", "Pistolety piorące", "Tornadory", "Akcesoria do odkurzaczy"]),
      sub("wyposazenie-stanowisk-mycia", "Wyposażenie stanowisk mycia", "ShowerHead", ["Szczotki do myjni", "Ściągaczki do wody", "Płyny do szyb do myjni", "Pokrowce i folie na stanowiska mycia", "Uchwyty do dywaników"]),
    ],
  },
  {
    slug: "sprzet-i-akcesoria",
    name: "Sprzęt i akcesoria czyszczące",
    icon: "/brand/Akcesoria2.png",
    lucide: "Brush",
    color: "#2f7d32",
    children: [
      sub("szczotki-i-miotly", "Szczotki, miotły i zmiotki", "Brush", ["Szczotki Vikan", "Szczotki do kostki brukowej", "Szczotki do mycia samochodu", "Szczotki do podłóg", "Miotły przemysłowe", "Zmiotki i szufelki"]),
      sub("sciagaczki", "Ściągaczki i zbieranie wody", "Eraser", ["Ściągaczki do szyb", "Ściągaczki do podłogi", "Ściągaczki do wody", "Gumowe ściągaczki Vikan", "Akcesoria do ściągaczek"]),
      sub("mikrofibry-i-gabki", "Mikrofibry, gąbki i pady", "Layers", ["Mikrofibry uniwersalne", "Mikrofibry do szyb", "Ręczniki do osuszania", "Gąbki i rękawice", "Pady i futra polerskie"]),
      sub("mopy", "Mopy i systemy sprzątania", "PaintRoller", ["Mopy i stelaże", "Kije i drążki teleskopowe", "Wiadra i wyciskarki", "Wózki sprzątające", "Worki na odpady"]),
      sub("opryskiwacze", "Opryskiwacze i dozowanie", "Pipette", ["Opryskiwacze ciśnieniowe", "Opryskiwacze pneumatyczne", "Dozowniki", "Pompki", "Butelki i opakowania"]),
      sub("ochrona-osobista", "Ochrona osobista", "HardHat", ["Rękawiczki", "Pokrowce i folie ochronne", "Akcesoria ochronne"]),
      sub("pozostale-akcesoria", "Zestawy i pozostałe akcesoria", "Shapes", ["Zestawy akcesoriów czyszczących"]),
    ],
  },
  {
    slug: "chemia-profesjonalna",
    name: "Chemia profesjonalna",
    icon: "/brand/ChemiaObiektowaDom2.png",
    lucide: "Building2",
    color: "#17344a",
    children: [
      sub("chemia-obiektowa", "Chemia obiektowa", "Building", ["Podłogi i posadzki", "Łazienki i sanitariaty", "Mycie powierzchni", "Szyby i lustra", "Ekologiczne środki czystości"]),
      sub("kuchnia-i-gastronomia", "Kuchnia i gastronomia", "ChefHat", ["Ręczne mycie naczyń", "Chemia do zmywarek", "Płyny nabłyszczające do zmywarek", "Odtłuszczanie kuchni", "Czyszczenie pieców, grilli i frytkownic", "Odkamienianie urządzeń"]),
      sub("pranie-i-tekstylia", "Pranie i tekstylia", "Shirt", ["Proszki do prania", "Płyny i żele do prania", "Płyny do płukania", "Pranie odzieży roboczej", "Odplamiacze"]),
      sub("dywany-i-tapicerka", "Dywany i tapicerka", "Sofa", ["Pranie dywanów", "Pranie tapicerki", "Odplamiacze", "Neutralizatory zapachów"]),
      sub("higiena-rak", "Higiena rąk, BHP i dozowniki", "Hand", ["Mydła i żele do rąk", "Pasty BHP", "Kremy do rąk", "Dezynfekcja rąk", "Dozowniki do mydła"]),
      sub("czysciwa-i-papier", "Czyściwa i papier", "Scroll", ["Czyściwa przemysłowe", "Ręczniki papierowe", "Papier toaletowy", "Podajniki i dozowniki", "Chusteczki i ściereczki"]),
    ],
  },
  {
    slug: "dom-i-ogrod",
    name: "Dom i ogród",
    icon: "/brand/Ogrod2.png",
    lucide: "House",
    color: "#6aa50f",
    children: [
      sub("chemia-do-domu", "Chemia do domu", "Bath", ["Kuchnia i odtłuszczanie", "Łazienka i WC", "Podłogi", "Szyby i lustra", "Pranie", "Dywany i tapicerka", "Meble", "Środki ekologiczne"]),
      sub("czyszczenie-zewnetrzne", "Czyszczenie zewnętrzne", "Trees", ["Kostka brukowa i kamień", "Elewacje", "Dachy", "Mycie paneli fotowoltaicznych", "Usuwanie mchu i zabrudzeń", "Markizy i zadaszenia"]),
      sub("akcesoria-domowe", "Akcesoria domowe", "House", ["Mycie okien", "Mycie podłóg", "Ściereczki do kurzu", "Worki na śmieci", "Miotły i szczotki", "Mopy i wiadra", "Zmywanie naczyń"]),
      sub("odswiezanie-domu", "Odświeżanie domu", "Frame", ["Odświeżacze powietrza", "Neutralizatory zapachów", "Zapachy do domu"]),
    ],
  },
  {
    slug: "zapachy",
    name: "Zapachy i aromamarketing",
    icon: "/brand/Arommarketing2.png",
    lucide: "Flower2",
    color: "#8a5bb5",
    children: [
      sub("zapachy-samochodowe", "Zapachy samochodowe", "Wind", ["Perfumy samochodowe", "Zawieszki zapachowe", "Puszki zapachowe", "Zapachy do klimatyzacji"]),
      sub("neutralizatory", "Odświeżacze i neutralizatory", "AirVent", ["Odświeżacze w sprayu", "One Shot", "Neutralizatory zapachów", "Automatyczne odświeżacze i wkłady", "Neutralizatory do pomieszczeń i pojazdów"]),
      sub("zapachy-do-domu", "Zapachy do domu i biura", "Flower2", ["Saszetki zapachowe", "Patyczki zapachowe", "Świece zapachowe", "Olejki i esencje zapachowe"]),
      sub("aromamarketing", "Aromamarketing", "Flame", ["Dyfuzory zapachowe", "Olejki do dyfuzorów"]),
    ],
  },
  {
    slug: "chemia-specjalistyczna",
    name: "Chemia specjalistyczna",
    icon: "/brand/Chemia-warsztatowa2.png",
    lucide: "TestTubeDiagonal",
    color: "#b4541a",
    children: [
      sub("chemia-warsztatowa", "Chemia warsztatowa i techniczna", "Wrench", ["Mycie części i narzędzi", "Chemia techniczna", "Czyściwa warsztatowe", "Utrzymanie czystości w warsztacie", "Dodatki do paliwa"]),
      sub("zmywacze-i-odtluszczacze", "Zmywacze, odtłuszczacze i odrdzewiacze", "Droplet", ["Zmywacze do hamulców", "Odtłuszczacze przemysłowe", "Odrdzewiacze", "Usuwanie kleju i etykiet"]),
      sub("smary", "Smary i preparaty techniczne", "Fuel", ["Smary techniczne", "Smary do łańcuchów", "Smary ceramiczne, miedziowe i grafitowe", "Testery i kleje techniczne"]),
      sub("myjki-ultradzwiekowe", "Myjki ultradźwiękowe i DPF", "AudioWaveform", ["Płyny do myjek ultradźwiękowych", "Czyszczenie DPF/FAP", "Preparaty do trudnych zabrudzeń"]),
      sub("rolnictwo", "Rolnictwo i gospodarstwo", "Tractor", ["Mycie maszyn rolniczych", "Higiena budynków inwentarskich", "Mycie i dezynfekcja urządzeń udojowych", "Chemia do wędzarni", "Urządzenia pianujące"]),
      sub("transport", "Transport i pojazdy specjalne", "Truck", ["Mycie pojazdów ciężarowych", "Komory ładunkowe i chłodnie", "Dezynfekcja pojazdów"]),
      sub("dezynfekcja", "Dezynfekcja specjalistyczna", "ShieldPlus", ["Dezynfekcja powierzchni", "Dezynfekcja pojazdów specjalistyczna", "Produkty specjalistyczne", "Uzdatnianie wody"]),
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

export const blogPosts = [
  { slug: "jak-myc-auto-bezdotykowo", title: "Mycie bezdotykowe krok po kroku – jak nie porysować lakieru", date: "2026-10-02", excerpt: "Aktywna piana, czas działania, ciśnienie i odległość lancy. Wszystko, co musisz wiedzieć.", tag: "Poradnik", image: "/brand/mYCIE-AUTA-1.jpg" },
  { slug: "mech-na-kostce", title: "Mech na kostce brukowej? Tak pozbędziesz się go na cały sezon", date: "2026-09-18", excerpt: "Porównujemy metody mechaniczne i chemiczne oraz podpowiadamy, kiedy najlepiej działać.", tag: "Dom i ogród", image: "/brand/Nowy-Kenochem-banner-1920x625-5.jpg" },
  { slug: "powloki-hydrofobowe", title: "Powłoki hydrofobowe – jak działają i jak je utrzymać", date: "2026-09-05", excerpt: "Wosk, sealant czy ceramika? Wyjaśniamy różnice i podpowiadamy, jak dbać o efekt perlenia.", tag: "Detailing", image: "/brand/Nowy-Kenochem-banner-1920x625-1-1-1.jpg" },
  { slug: "detailing-wnetrza", title: "Detailing wnętrza: od czego zacząć", date: "2026-08-21", excerpt: "Kolejność prac, dobór preparatów do plastików, tapicerki i skóry.", tag: "Poradnik", image: "/brand/slider-k-2026.jpg" },
];

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
