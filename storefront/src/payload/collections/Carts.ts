import type { CollectionConfig } from "payload";
import { isOrdersTeam } from "../access";

// Porzucone koszyki: zapisywane tylko, gdy klient przy zamówieniu zaznaczy zgodę na przypomnienie (POST /api/cart).
// Automat (src/integrations/mail/automations.ts) wysyła jedno przypomnienie po X godzinach – ustawienia w Maile do klientów.
export const Carts: CollectionConfig = {
  slug: "carts",
  labels: { singular: "Porzucony koszyk", plural: "Porzucone koszyki" },
  admin: {
    group: "Sprzedaż",
    useAsTitle: "email",
    defaultColumns: ["email", "summary", "total", "status", "updatedAt"],
    description: "Koszyki klientów, którzy zgodzili się na przypomnienie i nie dokończyli zamówienia. Przypomnienie włączysz w Marketing → Maile do klientów.",
  },
  access: { read: isOrdersTeam, create: () => false, update: () => false, delete: isOrdersTeam },
  defaultSort: "-updatedAt",
  fields: [
    { type: "row", fields: [
      { name: "email", label: "E-mail", type: "email", required: true, index: true, admin: { width: "50%" } },
      { name: "customer", label: "Konto klienta", type: "relationship", relationTo: "customers", admin: { width: "50%" } },
    ] },
    { name: "summary", label: "Produkty", type: "text" },
    { type: "row", fields: [
      { name: "total", label: "Wartość", type: "number", admin: { width: "33%" } },
      { name: "status", label: "Status", type: "select", defaultValue: "open", index: true, admin: { width: "33%" }, options: [
        { label: "Porzucony", value: "open" }, { label: "Przypomniano", value: "reminded" }, { label: "Zamówiony", value: "recovered" },
      ] },
      { name: "order", label: "Zamówienie", type: "relationship", relationTo: "orders", admin: { width: "33%" } },
    ] },
    { type: "row", fields: [
      { name: "consentAt", label: "Zgoda na przypomnienie", type: "date", admin: { width: "50%", date: { pickerAppearance: "dayAndTime" } } },
      { name: "remindedAt", label: "Przypomnienie wysłane", type: "date", admin: { width: "50%", date: { pickerAppearance: "dayAndTime" } } },
    ] },
    { name: "items", label: "Pozycje (zapis techniczny)", type: "json" },
    { name: "token", label: "Kod koszyka", type: "text", required: true, unique: true, index: true, admin: { hidden: true } },
  ],
};
