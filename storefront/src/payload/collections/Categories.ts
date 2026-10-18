import type { CollectionConfig } from "payload";
import { anyone, isEditor } from "../access";
import { seoFields, slugField } from "../fields";
import { iconOptions } from "../iconOptions";
import { invalidateCatalogHook } from "../productHooks";

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: { singular: "Kategoria", plural: "Kategorie" },
  admin: { group: "Sklep", useAsTitle: "name", defaultColumns: ["name", "slug", "order", "baselinkerCategoryIds"], pagination: { defaultLimit: 100 } },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  defaultSort: "path",
  hooks: {
    afterChange: [invalidateCatalogHook],
    afterDelete: [invalidateCatalogHook],
    // Ścieżka „Główna › Podkategoria” – sortowanie listy jako drzewa
    beforeChange: [
      async ({ data, req }) => {
        const parentId = typeof data.parent === "object" ? data.parent?.id : data.parent;
        const pad = (n: unknown) => String(Number(n ?? 0)).padStart(3, "0");
        if (parentId) {
          // Dowolna głębokość: dział › podkategoria › typ (ścieżka rodzica + własny człon)
          const parent = await req.payload.findByID({ collection: "categories", id: parentId, depth: 0, req, overrideAccess: true });
          data.path = `${parent.path || `${pad(parent.order)} ${parent.name}`} › ${pad(data.order)} ${data.name}`;
          data.depth = (Number(parent.depth) || 0) + 1;
        } else {
          data.path = `${pad(data.order)} ${data.name}`;
          data.depth = 0;
        }
        return data;
      },
    ],
  },
  fields: [
    { name: "name", label: "Nazwa", type: "text", required: true, admin: { components: { Cell: "@/payload/components/Cells#CategoryNameCell" } } },
    { name: "parent", label: "Kategoria nadrzędna", type: "relationship", relationTo: "categories", admin: { description: "Puste = kategoria główna (widoczna w menu)." } },
    { type: "row", fields: [
      { name: "order", label: "Kolejność", type: "number", defaultValue: 0, admin: { width: "25%" } },
      { name: "lucide", label: "Ikona (konturowa)", type: "select", options: iconOptions, admin: { width: "25%" } },
      { name: "color", label: "Kolor akcentu", type: "text", admin: { width: "25%", placeholder: "#4f9a12" } },
      { name: "icon", label: "Grafika (opcjonalnie)", type: "upload", relationTo: "media", admin: { width: "25%" } },
    ] },
    { name: "path", type: "text", index: true, admin: { hidden: true } },
    { name: "depth", type: "number", admin: { hidden: true } },
    { name: "description", label: "Opis kategorii", type: "richText" },
    {
      name: "baselinkerCategoryIds",
      label: "Kategorie BaseLinkera przypisane do tej kategorii",
      type: "array",
      labels: { singular: "ID kategorii", plural: "ID kategorii" },
      admin: { description: "Produkty z tych kategorii BaseLinkera trafią tutaj przy synchronizacji. Listę ID zobaczysz w Integracje → BaseLinker → Testuj połączenie.", components: { Cell: "@/payload/components/Cells#CountCell" } },
      fields: [{ name: "id", label: "ID kategorii w BaseLinkerze", type: "number", required: true }],
    },
    seoFields,
    slugField("name"),
  ],
};
