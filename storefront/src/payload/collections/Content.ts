import type { Block, CollectionConfig } from "payload";
import { isAdmin, isEditor, publishedOrStaff } from "../access";
import { section, seoFields, slugField } from "../fields";

// Bloki do budowania stron (regulamin, o nas, landing page promocji…)
const blocks: Block[] = [
  {
    slug: "hero",
    labels: { singular: "Baner", plural: "Banery" },
    fields: [
      { name: "image", label: "Obraz", type: "upload", relationTo: "media", required: true },
      { name: "title", label: "Tytuł", type: "text" },
      { name: "text", label: "Tekst", type: "textarea" },
      { type: "row", fields: [
        { name: "ctaLabel", label: "Przycisk – napis", type: "text", admin: { width: "50%" } },
        { name: "ctaLink", label: "Przycisk – link", type: "text", admin: { width: "50%" } },
      ] },
    ],
  },
  { slug: "richText", labels: { singular: "Tekst", plural: "Teksty" }, fields: [{ name: "content", label: "Treść", type: "richText" }] },
  {
    slug: "imageText",
    labels: { singular: "Obraz + tekst", plural: "Obraz + tekst" },
    fields: [
      { name: "image", label: "Obraz", type: "upload", relationTo: "media" },
      { name: "content", label: "Treść", type: "richText" },
      { name: "imageRight", label: "Obraz po prawej", type: "checkbox" },
    ],
  },
  {
    slug: "products",
    labels: { singular: "Siatka produktów", plural: "Siatki produktów" },
    fields: [
      { name: "title", label: "Tytuł sekcji", type: "text" },
      { name: "products", label: "Wybrane produkty", type: "relationship", relationTo: "products", hasMany: true },
      { name: "category", label: "…albo wszystkie z kategorii", type: "relationship", relationTo: "categories" },
      { name: "limit", label: "Ile pokazać", type: "number", defaultValue: 8 },
    ],
  },
  {
    slug: "faq",
    labels: { singular: "Pytania i odpowiedzi", plural: "FAQ" },
    fields: [{ name: "items", label: "Pytania", type: "array", fields: [
      { name: "q", label: "Pytanie", type: "text", required: true },
      { name: "a", label: "Odpowiedź", type: "textarea", required: true },
    ] }],
  },
];

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: { singular: "Strona", plural: "Strony" },
  admin: { group: "Treści", useAsTitle: "title", defaultColumns: ["title", "slug", "_status", "updatedAt"], components: { edit: { beforeDocumentControls: ["@/payload/components/AdminClient#ViewPageInStore"] } } },
  versions: { drafts: true, maxPerDoc: 20 },
  access: { read: publishedOrStaff, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    section("Nagłówek strony", "Tytuł i wstęp wyświetlane na górze strony.", "text", [
      { name: "title", label: "Tytuł", type: "text", required: true },
      { name: "intro", label: "Wstęp (pod tytułem)", type: "textarea" },
    ]),
    section("Zawartość strony", "Układaj stronę z bloków: tekst, zdjęcie z tekstem, produkty, FAQ…", "sparkles", [
      { name: "layout", label: "Bloki", type: "blocks", blocks },
    ]),
    section("Wygląd w Google", "Opcjonalne – puste pola uzupełnią się z tytułu.", "seo", [seoFields], { collapsed: true }),
    slugField("title"),
    { name: "template", label: "Układ strony", type: "select", defaultValue: "standard", admin: { position: "sidebar" }, options: [
      { label: "Standardowy", value: "standard" },
      { label: "Dokument prawny (spis treści, druk)", value: "legal" },
    ] },
    { name: "showInFooter", label: "Pokaż w stopce", type: "checkbox", admin: { position: "sidebar" } },
  ],
};

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: { singular: "Wpis na blogu", plural: "Blog" },
  admin: { group: "Treści", useAsTitle: "title", defaultColumns: ["title", "tag", "publishedAt", "_status"] },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 20 },
  access: { read: publishedOrStaff, create: isEditor, update: isEditor, delete: isEditor },
  fields: [
    section("Nagłówek wpisu", "Tytuł i krótka zajawka widoczne na liście artykułów.", "text", [
      { name: "title", label: "Tytuł", type: "text", required: true, admin: { placeholder: "np. Jak umyć auto bezdotykowo – krok po kroku" } },
      { name: "excerpt", label: "Zajawka", type: "textarea", admin: { placeholder: "2–3 zdania zachęcające do przeczytania", description: "Pokazywana na kafelku bloga i w podglądzie w Google." } },
    ]),
    section("Zdjęcie główne", "Najlepiej poziome, min. 1600 × 900 px.", "image", [
      { name: "cover", label: "Zdjęcie", type: "upload", relationTo: "media" },
    ]),
    section("Treść artykułu", "Pisz śródtytułami (H2/H3) – łatwiej się czyta i lepiej pozycjonuje. Wpisz „/”, żeby wstawić element.", "sparkles", [
      { name: "content", label: "Treść", type: "richText" },
    ]),
    section("Polecane produkty", "Produkty pokazywane pod artykułem – zamieniają czytelników w klientów.", "cart", [
      { name: "relatedProducts", label: "Produkty", type: "relationship", relationTo: "products", hasMany: true },
    ]),
    section("Wygląd w Google", "Opcjonalne – puste pola uzupełnią się z tytułu i zajawki.", "seo", [seoFields], { collapsed: true }),
    slugField("title"),
    { name: "tag", label: "Kategoria wpisu", type: "select", admin: { position: "sidebar" }, options: [
      { label: "Poradnik", value: "poradnik" }, { label: "Detailing", value: "detailing" }, { label: "Myjnie", value: "myjnie" },
      { label: "Dom i ogród", value: "dom" }, { label: "Biznes", value: "biznes" },
    ] },
    { name: "publishedAt", label: "Data publikacji", type: "date", admin: { position: "sidebar" } },
  ],
};

// Dziennik integracji – tylko do odczytu, zapisywany przez kod synchronizacji
export const IntegrationLogs: CollectionConfig = {
  slug: "integration-logs",
  labels: { singular: "Wpis dziennika", plural: "Dziennik integracji" },
  admin: { group: "Integracje", useAsTitle: "message", defaultColumns: ["createdAt", "type", "status", "message", "durationMs"] },
  access: { read: isAdmin, create: () => false, update: () => false, delete: isAdmin },
  defaultSort: "-createdAt",
  fields: [
    { name: "type", label: "Operacja", type: "select", index: true, options: [
      { label: "Test połączenia", value: "test" }, { label: "Synchronizacja produktów", value: "products" },
      { label: "Synchronizacja stanów i cen", value: "stock" }, { label: "Wysłanie zamówienia", value: "order" },
      { label: "E-mail", value: "email" },
    ] },
    { name: "status", label: "Wynik", type: "select", index: true, options: [
      { label: "Sukces", value: "success" }, { label: "Ostrzeżenia", value: "warning" }, { label: "Błąd", value: "error" },
    ] },
    { name: "mode", label: "Tryb", type: "select", options: [{ label: "Produkcyjny", value: "live" }, { label: "Testowy", value: "mock" }, { label: "Podgląd (bez zapisu)", value: "dry-run" }] },
    { name: "message", label: "Opis", type: "text" },
    { name: "durationMs", label: "Czas (ms)", type: "number" },
    { name: "order", label: "Zamówienie", type: "relationship", relationTo: "orders" },
    { name: "details", label: "Szczegóły", type: "json" },
  ],
};
