import type { CollectionConfig } from "payload";
import { adminField, hasRole, isAdmin } from "../access";

// Pracownicy z dostępem do panelu (klienci sklepu są w osobnej kolekcji „customers”).
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Pracownik", plural: "Pracownicy" },
  admin: { useAsTitle: "email", group: "Ustawienia", defaultColumns: ["name", "email", "roles"] },
  auth: { tokenExpiration: 60 * 60 * 8, maxLoginAttempts: 5, lockTime: 15 * 60 * 1000 },
  access: {
    read: ({ req }) => (hasRole(req, "admin") ? true : { id: { equals: req.user?.id } }),
    create: isAdmin,
    delete: isAdmin,
    update: ({ req }) => (hasRole(req, "admin") ? true : { id: { equals: req.user?.id } }),
  },
  fields: [
    { name: "name", label: "Imię i nazwisko", type: "text" },
    {
      name: "roles",
      label: "Role",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["admin"],
      saveToJWT: true,
      access: { update: adminField },
      options: [
        { label: "Administrator", value: "admin" },
        { label: "Redaktor treści i produktów", value: "editor" },
        { label: "Obsługa zamówień", value: "orders" },
      ],
    },
  ],
};
