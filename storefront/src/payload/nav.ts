// Układ menu bocznego panelu (src/payload/components/Nav.tsx).
// Pozycja pokazuje się tylko pracownikowi, który ma dostęp do danej kolekcji / ustawień.
// Ikony: id pozycji → src/app/(payload)/nav-icons.scss (scripts/gen-admin-nav-icons.mjs).

export type NavItem = {
  id: string;
  label: string;
  href: string;
  collection?: string; // dostęp = prawo odczytu kolekcji
  global?: string; // dostęp = prawo odczytu ustawień
  adminOnly?: boolean;
  exact?: boolean; // podświetlaj tylko dokładnie ten adres
  also?: string[]; // inne adresy, przy których pozycja jest podświetlona
  badge?: { collection: string; where: Record<string, unknown>; tone: "red" | "amber" };
};

export type NavSection = { label: string; items: NavItem[] };

const col = (slug: string, label: string, extra: Partial<NavItem> = {}): NavItem => ({
  id: `nav-${slug}`,
  label,
  href: `/admin/collections/${slug}`,
  collection: slug,
  ...extra,
});
const glob = (slug: string, label: string, extra: Partial<NavItem> = {}): NavItem => ({
  id: `nav-global-${slug}`,
  label,
  href: `/admin/globals/${slug}`,
  global: slug,
  ...extra,
});

export const navSections: NavSection[] = [
  {
    label: "Start",
    items: [
      { id: "nav-dashboard", label: "Pulpit", href: "/admin", exact: true },
      { id: "nav-reports", label: "Raporty sprzedaży", href: "/admin/raporty", collection: "orders" },
    ],
  },
  {
    label: "Sprzedaż",
    items: [
      col("orders", "Zamówienia", { badge: { collection: "orders", where: { status: { in: ["new", "paid"] } }, tone: "red" } }),
      col("returns", "Zwroty i reklamacje", { badge: { collection: "returns", where: { status: { equals: "new" } }, tone: "amber" } }),
      col("customers", "Klienci"),
      col("form-submissions", "Wiadomości", { badge: { collection: "form-submissions", where: { status: { equals: "new" } }, tone: "amber" } }),
    ],
  },
  {
    label: "Katalog",
    items: [
      col("products", "Produkty"),
      col("categories", "Kategorie"),
      col("stock-alerts", "Powiadomienia o dostępności"),
    ],
  },
  {
    label: "Marketing",
    items: [
      col("coupons", "Kody rabatowe"),
      col("reviews", "Opinie", { badge: { collection: "reviews", where: { status: { equals: "pending" } }, tone: "amber" } }),
      col("newsletter", "Newsletter"),
    ],
  },
  {
    label: "Treści i wygląd",
    items: [
      glob("homepage", "Strona główna"),
      glob("navigation", "Menu i stopka"),
      col("pages", "Strony"),
      col("posts", "Blog"),
      col("media", "Zdjęcia i pliki"),
    ],
  },
  {
    label: "Integracje",
    items: [
      { id: "nav-integrations", label: "Moduły", href: "/admin/integracje", adminOnly: true, also: ["/admin/globals/baselinker-settings"] },
      col("integration-logs", "Dziennik integracji"),
    ],
  },
  {
    label: "Ustawienia",
    items: [
      glob("store-settings", "Ustawienia sklepu"),
      col("users", "Pracownicy"),
      col("redirects", "Przekierowania"),
    ],
  },
];
