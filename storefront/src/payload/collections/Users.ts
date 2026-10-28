import type { CollectionConfig } from "payload";
import { adminField, hasRole, isAdmin } from "../access";

// Pracownicy z dostępem do panelu (klienci sklepu są w osobnej kolekcji „customers”).
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Pracownik", plural: "Pracownicy" },
  admin: {
    useAsTitle: "email",
    group: "Ustawienia",
    defaultColumns: ["name", "email", "roles"],
    description: "Każdy pracownik loguje się swoim e-mailem. Rola decyduje, co widzi w menu. Kolor panelu ustawia sobie sam — nie zmienia sklepu dla klientów.",
  },
  auth: { tokenExpiration: 60 * 60 * 8, maxLoginAttempts: 5, lockTime: 15 * 60 * 1000 },
  access: {
    read: ({ req }) => (hasRole(req, "admin") ? true : { id: { equals: req.user?.id } }),
    create: isAdmin,
    delete: isAdmin,
    update: ({ req }) => (hasRole(req, "admin") ? true : { id: { equals: req.user?.id } }),
  },
  fields: [
    { name: "name", label: "Imię i nazwisko", type: "text" },
    { type: "row", fields: [
      { name: "jobTitle", label: "Stanowisko", type: "text", admin: { width: "50%", placeholder: "np. magazyn, obsługa klienta" } },
      { name: "phone", label: "Telefon", type: "text", admin: { width: "50%" } },
    ] },
    {
      name: "roles",
      label: "Role",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["admin"],
      saveToJWT: true,
      access: { update: adminField },
      admin: { description: "Można zaznaczyć kilka. Administrator widzi wszystko. Redaktor: produkty, kategorie, strony. Obsługa zamówień: zamówienia, klienci, zwroty. Marketing: kody, opinie, newsletter. Magazyn: produkty i powiadomienia o stanie." },
      options: [
        { label: "Administrator — cały panel", value: "admin" },
        { label: "Redaktor — produkty, kategorie, strony", value: "editor" },
        { label: "Obsługa zamówień — zamówienia i klienci", value: "orders" },
        { label: "Marketing — kody, opinie, newsletter", value: "marketing" },
        { label: "Magazyn — produkty i stany", value: "warehouse" },
      ],
    },
    {
      name: "panelTheme",
      label: "Kolor panelu",
      type: "select",
      defaultValue: "czerwony",
      saveToJWT: true,
      options: [
        { label: "Czerwony (Sonax)", value: "czerwony" },
        { label: "Zieleń", value: "zielen" },
        { label: "Granat", value: "granat" },
        { label: "Grafit", value: "grafit" },
      ],
      admin: { description: "Tylko dla tego konta. Po zapisaniu odśwież panel, jeśli kolor nie zmieni się od razu." },
    },
  ],
};
