import type { CollectionConfig } from "payload";
import { anyone, isEditor } from "../access";

export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Plik", plural: "Media" },
  admin: { group: "Treści", defaultColumns: ["filename", "alt", "updatedAt"] },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  upload: {
    staticDir: "media",
    mimeTypes: ["image/*", "application/pdf"],
    imageSizes: [
      { name: "thumb", width: 300, height: 300, fit: "inside" },
      { name: "card", width: 600, height: 600, fit: "inside" },
      { name: "banner", width: 1920, height: 625, fit: "cover" },
    ],
    adminThumbnail: "thumb",
  },
  fields: [
    { name: "alt", label: "Tekst alternatywny (opis obrazka)", type: "text" },
    { name: "kind", label: "Rodzaj", type: "select", defaultValue: "image", options: [
      { label: "Zdjęcie / grafika", value: "image" },
      { label: "Karta charakterystyki (SDS)", value: "sds" },
      { label: "Dokument", value: "document" },
    ] },
  ],
};
