import { APIError, type CollectionAfterChangeHook, type CollectionBeforeChangeHook, type PayloadRequest } from "payload";
import type { CollectionConfig } from "payload";
import { anyone, isEditor } from "../access";
import { seoFields, slugField } from "../fields";
import { iconOptions } from "../iconOptions";
import { invalidateCatalogHook } from "../productHooks";

const parentIdOf = (value: unknown) => {
  if (value == null || value === "") return undefined;
  const id = typeof value === "object" && value && "id" in value ? (value as { id: number }).id : value;
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

async function descendantIds(req: PayloadRequest, rootId: number) {
  const banned = new Set<number>();
  let frontier = [rootId];
  while (frontier.length) {
    const { docs } = await req.payload.find({
      collection: "categories", where: { parent: { in: frontier } }, limit: 500, depth: 0, pagination: false, req, overrideAccess: true,
    });
    frontier = [];
    for (const d of docs) if (!banned.has(d.id)) { banned.add(d.id); frontier.push(d.id); }
  }
  return banned;
}

const placeInTree: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (data.name == null) data.name = originalDoc?.name;
  if (data.order == null) data.order = originalDoc?.order ?? 0;
  const parentId = data.parent === undefined ? parentIdOf(originalDoc?.parent) : parentIdOf(data.parent);
  const self = Number(originalDoc?.id);
  if (parentId && self && parentId === self) throw new APIError("Kategoria nie może być pod sobą.", 400);
  if (parentId && self && (await descendantIds(req, self)).has(parentId)) {
    throw new APIError("Nie można włożyć kategorii do jej własnej podkategorii.", 400);
  }
  const pad = (n: unknown) => String(Number(n ?? 0)).padStart(3, "0");
  if (parentId) {
    const parent = await req.payload.findByID({ collection: "categories", id: parentId, depth: 0, req, overrideAccess: true });
    data.path = `${parent.path || `${pad(parent.order)} ${parent.name}`} › ${pad(data.order)} ${data.name}`;
    data.depth = (Number(parent.depth) || 0) + 1;
    data.parent = parentId;
  } else {
    data.path = `${pad(data.order)} ${data.name}`;
    data.depth = 0;
    if (data.parent === undefined) data.parent = null;
  }
  return data;
};

// Po przeniesieniu działu odśwież ścieżki tego, co jest w środku, żeby lista została drzewem.
const refreshChildren: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (previousDoc && previousDoc.path === doc.path) return doc;
  const { docs } = await req.payload.find({
    collection: "categories", where: { parent: { equals: doc.id } }, limit: 500, depth: 0, pagination: false, req, overrideAccess: true,
  });
  for (const child of docs) {
    await req.payload.update({ collection: "categories", id: child.id, data: { parent: doc.id }, req, overrideAccess: true });
  }
  return doc;
};

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: { singular: "Kategoria", plural: "Kategorie" },
  admin: {
    group: "Sklep", useAsTitle: "name",
    defaultColumns: ["name", "parent", "order", "lucide"],
    pagination: { defaultLimit: 200, limits: [50, 100, 200] },
    components: { beforeListTable: ["@/payload/components/CategoryTree#CategoryTree"] },
  },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  defaultSort: "path",
    hooks: {
    afterDelete: [invalidateCatalogHook],
    // Ścieżka „Główna › Podkategoria” – sortowanie listy jako drzewa
    beforeChange: [placeInTree],
    afterChange: [invalidateCatalogHook, refreshChildren],
  },
  fields: [
    { name: "name", label: "Nazwa", type: "text", required: true, admin: { components: { Cell: "@/payload/components/Cells#CategoryNameCell" } } },
    { name: "parent", label: "Kategoria nadrzędna", type: "relationship", relationTo: "categories", admin: {
      sortOptions: "name",
      components: { Field: "@/payload/components/CategoryTree#CategoryParentField" },
      description: "Puste = dział w menu i na kafelkach. Na liście najpierw są działy, w tym Dom i ogród.",
    } },
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
