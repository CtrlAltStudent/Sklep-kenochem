// Typy, kategorie i funkcje pomocnicze – bezpieczne do użycia w komponentach klienckich.
// Sam katalog produktów (kilka MB) ładuje tylko serwer – patrz lib/catalog.ts.

export type Category = {
  slug: string;
  name: string;
  icon: string; // ikona z /public/brand (z kenochem.com)
  lucide: IconName; // ikona konturowa (menu, listy)
  color: string; // kolor akcentu kategorii
  children: { slug: string; name: string; lucide: IconName }[];
};

// Nazwy ikon Lucide używanych dla kategorii (komponent: components/CatIcon.tsx)
export type IconName =
  | "Car" | "Droplets" | "Bug" | "Disc3" | "AppWindow" | "Armchair" | "Sparkles" | "ShieldCheck" | "ShowerHead" | "FlaskConical"
  | "Cog" | "SprayCan" | "Fan" | "Brush" | "Eraser" | "Layers" | "PaintRoller" | "Pipette" | "HardHat" | "Shapes" | "Building2"
  | "Building" | "ChefHat" | "Shirt" | "Sofa" | "Hand" | "Scroll" | "House" | "Bath" | "Trees" | "Frame" | "Flower2" | "Wind"
  | "AirVent" | "Flame" | "TestTubeDiagonal" | "Wrench" | "Droplet" | "Fuel" | "AudioWaveform" | "Tractor" | "ShieldPlus";

export type Variant = { id: string; label: string; price: number; oldPrice?: number };

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
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
export type ProductCardData = Pick<Product, "slug" | "name" | "brand" | "category" | "subcategory" | "stock" | "variants" | "badges" | "lowestPrice30d"> & {
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
  stock: p.stock,
  variants: p.variants,
  badges: p.badges,
  image: usableImages(p.images)[0],
  lowestPrice30d: p.lowestPrice30d,
});

export const FREE_SHIPPING = 399;

export const categories: Category[] = [
  {
    slug: "chemia-samochodowa",
    name: "Chemia samochodowa",
    icon: "/brand/SamochodNaZewnatrz2.png",
    lucide: "Car",
    color: "#4f9a12",
    children: [
      { slug: "mycie-samochodu", name: "Mycie samochodu", lucide: "Droplets" },
      { slug: "trudne-zabrudzenia", name: "Trudne zabrudzenia", lucide: "Bug" },
      { slug: "felgi-i-opony", name: "Felgi i opony", lucide: "Disc3" },
      { slug: "szyby-i-szklo", name: "Szyby i szkło", lucide: "AppWindow" },
      { slug: "wnetrze-samochodu", name: "Wnętrze samochodu", lucide: "Armchair" },
      { slug: "pielegnacja-lakieru", name: "Pielęgnacja lakieru", lucide: "Sparkles" },
      { slug: "elementy-zewnetrzne", name: "Elementy zewnętrzne", lucide: "ShieldCheck" },
    ],
  },
  {
    slug: "myjnie-i-urzadzenia",
    name: "Myjnie i urządzenia",
    icon: "/brand/MaszynyUrzadzenia2.png",
    lucide: "ShowerHead",
    color: "#1f5f8b",
    children: [
      { slug: "chemia-do-myjni", name: "Chemia do myjni", lucide: "FlaskConical" },
      { slug: "czesci-do-myjek", name: "Części do myjek", lucide: "Cog" },
      { slug: "pianownice-i-oprysk", name: "Pianownice i oprysk", lucide: "SprayCan" },
      { slug: "odkurzacze-i-tapicerka", name: "Odkurzacze i urządzenia", lucide: "Fan" },
    ],
  },
  {
    slug: "sprzet-i-akcesoria",
    name: "Sprzęt i akcesoria",
    icon: "/brand/Akcesoria2.png",
    lucide: "Brush",
    color: "#2f7d32",
    children: [
      { slug: "szczotki-i-miotly", name: "Szczotki, miotły i zmiotki", lucide: "Brush" },
      { slug: "sciagaczki", name: "Ściągaczki i myjki do szyb", lucide: "Eraser" },
      { slug: "mikrofibry-i-gabki", name: "Mikrofibry, gąbki i pady", lucide: "Layers" },
      { slug: "mopy", name: "Mopy i systemy sprzątania", lucide: "PaintRoller" },
      { slug: "opryskiwacze", name: "Opryskiwacze i dozowanie", lucide: "Pipette" },
      { slug: "ochrona-osobista", name: "Ochrona osobista", lucide: "HardHat" },
      { slug: "pozostale-akcesoria", name: "Pozostałe akcesoria", lucide: "Shapes" },
    ],
  },
  {
    slug: "chemia-profesjonalna",
    name: "Chemia profesjonalna",
    icon: "/brand/ChemiaObiektowaDom2.png",
    lucide: "Building2",
    color: "#17344a",
    children: [
      { slug: "chemia-obiektowa", name: "Chemia obiektowa", lucide: "Building" },
      { slug: "kuchnia-i-gastronomia", name: "Kuchnia i gastronomia", lucide: "ChefHat" },
      { slug: "pranie-i-tekstylia", name: "Pranie i tekstylia", lucide: "Shirt" },
      { slug: "dywany-i-tapicerka", name: "Dywany i tapicerka", lucide: "Sofa" },
      { slug: "higiena-rak", name: "Higiena rąk i BHP", lucide: "Hand" },
      { slug: "czysciwa-i-papier", name: "Czyściwa i papier", lucide: "Scroll" },
    ],
  },
  {
    slug: "dom-i-ogrod",
    name: "Dom i ogród",
    icon: "/brand/Ogrod2.png",
    lucide: "House",
    color: "#6aa50f",
    children: [
      { slug: "chemia-do-domu", name: "Chemia do domu", lucide: "Bath" },
      { slug: "czyszczenie-zewnetrzne", name: "Czyszczenie zewnętrzne", lucide: "Trees" },
      { slug: "odswiezanie-domu", name: "Okna i lustra", lucide: "Frame" },
    ],
  },
  {
    slug: "zapachy",
    name: "Zapachy i aromamarketing",
    icon: "/brand/Arommarketing2.png",
    lucide: "Flower2",
    color: "#8a5bb5",
    children: [
      { slug: "zapachy-samochodowe", name: "Zapachy samochodowe", lucide: "Wind" },
      { slug: "neutralizatory", name: "Odświeżacze i neutralizatory", lucide: "AirVent" },
      { slug: "aromamarketing", name: "Dyfuzory, olejki i świece", lucide: "Flame" },
    ],
  },
  {
    slug: "chemia-specjalistyczna",
    name: "Chemia specjalistyczna",
    icon: "/brand/Chemia-warsztatowa2.png",
    lucide: "TestTubeDiagonal",
    color: "#b4541a",
    children: [
      { slug: "chemia-warsztatowa", name: "Chemia warsztatowa i techniczna", lucide: "Wrench" },
      { slug: "zmywacze-i-odtluszczacze", name: "Zmywacze i odtłuszczacze", lucide: "Droplet" },
      { slug: "smary", name: "Smary i preparaty techniczne", lucide: "Fuel" },
      { slug: "myjki-ultradzwiekowe", name: "Myjki ultradźwiękowe i DPF", lucide: "AudioWaveform" },
      { slug: "rolnictwo", name: "Rolnictwo, przemysł spożywczy, łodzie", lucide: "Tractor" },
      { slug: "dezynfekcja", name: "Dezynfekcja specjalistyczna", lucide: "ShieldPlus" },
    ],
  },
];

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
