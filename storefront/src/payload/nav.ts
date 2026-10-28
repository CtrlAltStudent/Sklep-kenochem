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

export const navSections: NavSection[] = [
  {
    label: "Start",
    items: [
      { id: "nav-dashboard", label: "Pulpit", href: "/admin", exact: true },
      { id: "nav-reports", label: "Raporty sprzedaży", href: "/admin/raporty", collection: "orders" },
      { id: "nav-help", label: "Instrukcja", href: "/admin/pomoc" },
    ],
  },
  {
    label: "Sprzedaż",
    items: [
      col("orders", "Zamówienia", { badge: { collection: "orders", where: { status: { in: ["new", "paid"] } }, tone: "red" } }),
      col("returns", "Zwroty i reklamacje", { badge: { collection: "returns", where: { status: { equals: "new" } }, tone: "amber" } }),
      col("customers", "Klienci"),
      col("carts", "Porzucone koszyki"),
      col("form-submissions", "Wiadomości", { badge: { collection: "form-submissions", where: { status: { equals: "new" } }, tone: "amber" } }),
    ],
  },
  {
    label: "Katalog",
    items: [
      col("products", "Produkty"),
      { id: "nav-import", label: "Import / eksport", href: "/admin/import", adminOnly: true },
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
      { id: "nav-mails", label: "Maile do klientów", href: "/admin/maile", adminOnly: true },
    ],
  },
  {
    label: "Treści i wygląd",
    items: [
      // Układ strony obejmuje też edycję treści strony głównej oraz menu i stopki
      { id: "nav-content", label: "Układ strony", href: "/admin/uklad", collection: "pages", also: ["/admin/globals/homepage", "/admin/globals/navigation"] },
      col("pages", "Podstrony"),
      col("posts", "Blog"),
      col("media", "Media"),
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
      // Ustawienia sklepu = przegląd /admin/ustawienia + formularz danych sklepu (global store-settings)
      { id: "nav-settings", label: "Ustawienia sklepu", href: "/admin/ustawienia", adminOnly: true, also: ["/admin/globals/store-settings"] },
      col("users", "Pracownicy"),
      col("redirects", "Przekierowania"),
    ],
  },
];
