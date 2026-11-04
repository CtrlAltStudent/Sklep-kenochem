import type { CollectionConfig } from "payload";
import { hasRole, isAdmin, rememberRoles } from "../access";
import { panelAuth } from "../panelAuth";
import { panelLogoutEndpoint } from "../panelLogout";

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
  auth: {
    tokenExpiration: 60 * 60 * 8,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    // Sesja w bazie odrzucała ważne ciasteczko (brak użytkownika przy wylogowaniu)
    // i panel traktował konto jak bez roli. Wystarczy token na 8 godzin.
    useSessions: false,
    strategies: [panelAuth],
  },
  endpoints: [panelLogoutEndpoint],
  access: {
    read: async ({ req }) => ((await hasRole(req, "admin")) ? true : { id: { equals: req.user?.id } }),
    create: isAdmin,
    delete: isAdmin,
    update: async ({ req }) => ((await hasRole(req, "admin")) ? true : { id: { equals: req.user?.id } }),
  },
  hooks: {
    afterRead: [({ doc }) => { rememberRoles(doc.id, doc.roles); return doc; }],
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
      // Bez blokady zapisu: inaczej zapis konta pada z „Nie możesz wykonać tej akcji”,
      // choć na karcie widać rolę administratora. Roli nie zmieni nikt poza administratorem.
      hooks: {
        beforeChange: [async ({ req, value, originalDoc }) => ((await hasRole(req, "admin")) ? value : originalDoc?.roles ?? value)],
      },
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
