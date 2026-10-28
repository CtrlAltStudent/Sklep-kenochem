// Układ stron sklepu (panel: Treści i wygląd → Układ strony): które sekcje i w jakiej kolejności.
// Opis sekcji wspólny dla panelu (edytor) i sklepu (renderowanie). Zapis: schowek integracji (vault.ts) – bez zmian w bazie.

export type PageKind = "home" | "product" | "productTabs" | "category";
export type LayoutItem = { id: string; visible: boolean };
export type SectionDef = {
  id: string;
  label: string;
  desc: string;
  edit?: { href: string; label: string }; // gdzie zmienić treść sekcji
  locked?: boolean; // zawsze widoczna (np. lista produktów w kategorii, bezpieczeństwo CLP)
  fixed?: boolean; // zawsze na swoim miejscu (np. zakup produktu na górze)
  size?: "s" | "m" | "l"; // wysokość bloku w podglądzie
  defaultHidden?: boolean;
};

const HOMEPAGE = "/admin/globals/homepage";

export const SECTIONS: Record<PageKind, SectionDef[]> = {
  home: [
    { id: "hero", label: "Baner główny", desc: "Karuzela banerów z tytułem i przyciskiem. Zdjęcie 1920 × 625 px.", edit: { href: HOMEPAGE, label: "Banery" }, size: "l" },
    { id: "perks", label: "Atuty sklepu", desc: "4 krótkie hasła pod banerem (wysyłka, odbiór, płatności, doradztwo).", edit: { href: HOMEPAGE, label: "Atuty" }, size: "s" },
    { id: "categories", label: "Kafelki kategorii", desc: "Działy sklepu ze zdjęciami i liczbą produktów.", edit: { href: "/admin/collections/categories", label: "Kategorie" }, size: "l" },
    { id: "usage", label: "Dobierz produkt do zadania", desc: "Szybki wybór: mycie, polerowanie, wnętrze, felgi…", size: "m" },
    { id: "featured", label: "Polecane produkty", desc: "Lista w Stronie głównej. Puste = produkty SONAX.", edit: { href: HOMEPAGE, label: "Polecane" }, size: "m" },
    { id: "deals", label: "Promocje", desc: "Własna grupa albo, gdy pusta, produkty z obniżoną ceną.", edit: { href: HOMEPAGE, label: "Promocje" }, size: "m" },
    { id: "promo", label: "Baner promocyjny", desc: "Szeroki baner akcji. Tło 1600 × 500 px. Widoczny, gdy ma tytuł.", edit: { href: HOMEPAGE, label: "Baner promocyjny" }, size: "m" },
    { id: "newest", label: "Nowości", desc: "Własna grupa albo, gdy pusta, najnowsze produkty dodane w panelu.", edit: { href: HOMEPAGE, label: "Nowości" }, size: "m" },
    { id: "brands", label: "Marki w sklepie", desc: "Loga marek. Bez logo = nazwy marek z produktów.", edit: { href: "/admin/globals/homepage", label: "Loga marek" }, size: "s" },
    { id: "reviews", label: "Opinie klientów", desc: "Ostatnie zatwierdzone opinie.", edit: { href: "/admin/collections/reviews", label: "Opinie" }, size: "m" },
    { id: "about", label: "O nas", desc: "Krótko o sklepie ze zdjęciem i linkiem do strony „O nas”.", size: "m" },
    { id: "blog", label: "Poradniki z bloga", desc: "3 najnowsze wpisy.", edit: { href: "/admin/collections/posts", label: "Blog" }, size: "m" },
  ],
  product: [
    { id: "main", label: "Zdjęcia, nazwa, cena i koszyk", desc: "Główna część karty produktu – zawsze na górze.", locked: true, fixed: true, size: "l" },
    { id: "tabs", label: "Opis i zakładki", desc: "Opis, specyfikacja, pliki i bezpieczeństwo, opinie – kolejność zakładek ustawisz niżej.", locked: true, size: "l" },
    { id: "related", label: "Podobne produkty", desc: "Produkty z tej samej kategorii albo wybrane w produkcie („Kup razem”).", size: "m" },
    { id: "brandMore", label: "Więcej od tej marki", desc: "Inne produkty tej samej marki.", size: "m", defaultHidden: true },
    { id: "recent", label: "Ostatnio oglądane", desc: "Produkty, które klient oglądał wcześniej.", size: "s" },
  ],
  productTabs: [
    { id: "opis", label: "Opis produktu", desc: "Opis z edytora w panelu.", locked: true, size: "s" },
    { id: "specyfikacja", label: "Specyfikacja", desc: "SKU, EAN, pojemność, marka, kategoria.", size: "s" },
    { id: "bezpieczenstwo", label: "Pliki i bezpieczeństwo", desc: "Karta charakterystyki i piktogramy – obowiązkowe (CLP/GPSR).", locked: true, size: "s" },
    { id: "opinie", label: "Opinie", desc: "Opinie klientów i formularz dodania opinii.", size: "s" },
  ],
  category: [
    { id: "listing", label: "Produkty z filtrami", desc: "Podkategorie, filtry (marka, cena, pojemność) i lista produktów.", locked: true, size: "l" },
    { id: "bestsellers", label: "Najczęściej wybierane w kategorii", desc: "Produkty z etykietą „Bestseller” z tej kategorii.", size: "m", defaultHidden: true },
    { id: "description", label: "Opis kategorii", desc: "Tekst pod listą (ważny dla Google). Edytujesz go w kategorii.", edit: { href: "/admin/collections/categories", label: "Kategorie" }, size: "m" },
    { id: "guides", label: "Poradniki", desc: "3 najnowsze wpisy z bloga pod listą produktów.", edit: { href: "/admin/collections/posts", label: "Blog" }, size: "s", defaultHidden: true },
  ],
};

export const PAGE_LABEL: Record<PageKind, string> = { home: "Strona główna", product: "Karta produktu", productTabs: "Zakładki produktu", category: "Widok kategorii" };

export const defaultLayout = (kind: PageKind): LayoutItem[] => SECTIONS[kind].map((s) => ({ id: s.id, visible: !s.defaultHidden }));

// Zapisany układ + nowe sekcje (dodane w kolejnych wersjach sklepu) na końcu; sekcje „locked” zawsze widoczne, „fixed” zawsze pierwsze
export function mergeLayout(kind: PageKind, saved?: LayoutItem[]): LayoutItem[] {
  const defs = SECTIONS[kind];
  const known = new Set(defs.map((d) => d.id));
  const list = (saved ?? []).filter((i) => known.has(i.id));
  for (const d of defs) if (!list.some((i) => i.id === d.id)) list.push({ id: d.id, visible: !d.defaultHidden });
  const fixed = defs.filter((d) => d.fixed).map((d) => d.id);
  return [...list.filter((i) => fixed.includes(i.id)), ...list.filter((i) => !fixed.includes(i.id))]
    .map((i) => (defs.find((d) => d.id === i.id)?.locked ? { ...i, visible: true } : i));
}

export function cleanLayout(raw: unknown): Partial<Record<PageKind, LayoutItem[]>> {
  const out: Partial<Record<PageKind, LayoutItem[]>> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const kind of Object.keys(SECTIONS) as PageKind[]) {
    const list = (raw as Record<string, unknown>)[kind];
    if (!Array.isArray(list)) continue;
    out[kind] = mergeLayout(kind, list
      .filter((i): i is LayoutItem => !!i && typeof i === "object" && typeof (i as LayoutItem).id === "string")
      .map((i) => ({ id: i.id, visible: Boolean(i.visible) })));
  }
  return out;
}
