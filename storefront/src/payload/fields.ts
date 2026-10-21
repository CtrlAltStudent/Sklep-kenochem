import type { Field } from "payload";

const PL: Record<string, string> = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };
export const slugify = (s: string) =>
  s.toLowerCase().replace(/[ąćęłńóśźż]/g, (c) => PL[c]).normalize("NFKD").replace(/[^\w\s-]/g, " ")
    .trim().replace(/[\s_-]+/g, "-").slice(0, 90).replace(/-+$/, "");

// Adres URL generowany automatycznie z pola tytułu/nazwy, jeśli pusty
export const slugField = (from = "name"): Field => ({
  name: "slug",
  label: "Adres URL (slug)",
  type: "text",
  index: true,
  unique: true,
  admin: { position: "sidebar", description: "Generowany automatycznie z nazwy. Zmiana psuje stare linki – dodaj przekierowanie." },
  hooks: {
    beforeValidate: [({ value, data }) => (value ? slugify(String(value)) : data?.[from] ? slugify(String(data[from])) : value)],
  },
});

export const seoFields: Field = {
  name: "seo",
  label: "SEO",
  type: "group",
  fields: [
    { name: "title", label: "Tytuł w Google", type: "text", admin: { description: "Zalecane do 60 znaków. Puste = nazwa." } },
    { name: "description", label: "Opis w Google", type: "textarea", admin: { description: "Zalecane 120–160 znaków." } },
    { name: "noindex", label: "Ukryj przed wyszukiwarkami", type: "checkbox" },
  ],
};

// Sekcja formularza w panelu: zwijana karta z ikoną, tytułem i podpowiedzią.
// Nie zmienia struktury danych (collapsible), więc można nią owijać istniejące pola.
export const section = (
  title: string,
  hint: string,
  icon: string,
  fields: Field[],
  opts: { collapsed?: boolean; condition?: (data: Record<string, unknown>) => boolean } = {},
): Field => ({
  type: "collapsible",
  label: title,
  admin: {
    initCollapsed: opts.collapsed ?? false,
    condition: opts.condition ? (data) => opts.condition!(data) : undefined,
    components: { Label: { path: "@/payload/components/FormBits#SectionLabel", clientProps: { title, hint, icon } } },
  },
  fields,
});
