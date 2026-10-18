import type { CollectionConfig } from "payload";
import { isOrdersTeam, selfOrStaff, hasRole } from "../access";
import { section } from "../fields";

// Konta klientów sklepu (osobne od pracowników). Logowanie przez API sklepu.
export const Customers: CollectionConfig = {
  slug: "customers",
  labels: { singular: "Klient", plural: "Klienci" },
  admin: {
    group: "Sprzedaż",
    useAsTitle: "email",
    defaultColumns: ["email", "firstName", "lastName", "accountType", "b2bStatus", "createdAt"],
    listSearchableFields: ["email", "lastName", "company", "nip"],
  },
  auth: { tokenExpiration: 60 * 60 * 24 * 30, maxLoginAttempts: 10, lockTime: 10 * 60 * 1000, verify: false },
  access: {
    read: selfOrStaff,
    update: selfOrStaff,
    create: () => true, // rejestracja w sklepie
    delete: isOrdersTeam,
    admin: () => false, // klienci nie mają wstępu do panelu
  },
  fields: [
    section("Dane osobowe", "Imię, nazwisko, telefon i rodzaj konta. E-mail i hasło są powyżej.", "user", [
    { type: "row", fields: [
      { name: "firstName", label: "Imię", type: "text", admin: { width: "50%" } },
      { name: "lastName", label: "Nazwisko", type: "text", admin: { width: "50%" } },
    ] },
    { name: "phone", label: "Telefon", type: "text", admin: { placeholder: "+48 …" } },
    { name: "accountType", label: "Typ konta", type: "radio", defaultValue: "individual", admin: { layout: "horizontal" }, options: [
      { label: "Klient indywidualny", value: "individual" }, { label: "Firma (B2B)", value: "business" },
    ] },
    ]),
    section("Firma i warunki B2B", "Weryfikacja konta hurtowego, termin płatności i rabat.", "shield", [
    {
      name: "b2b",
      label: false,
      type: "group",
      fields: [
        { type: "row", fields: [
          { name: "company", label: "Nazwa firmy", type: "text", admin: { width: "60%" } },
          { name: "nip", label: "NIP", type: "text", admin: { width: "40%" }, validate: (v: unknown) => !v || /^\d{10}$/.test(String(v).replace(/\D/g, "")) || "NIP musi mieć 10 cyfr" },
        ] },
        { name: "industry", label: "Branża", type: "select", options: [
          { label: "Myjnia samochodowa", value: "carwash" }, { label: "Detailing", value: "detailing" },
          { label: "Firma sprzątająca", value: "cleaning" }, { label: "Gastronomia / hotel", value: "horeca" },
          { label: "Instytucja publiczna", value: "public" }, { label: "Inna", value: "other" },
        ] },
        { name: "status", label: "Status konta B2B", type: "select", defaultValue: "pending",
          access: { update: ({ req }) => hasRole(req, "orders") },
          options: [
            { label: "Oczekuje na weryfikację", value: "pending" }, { label: "Zatwierdzone", value: "approved" }, { label: "Odrzucone", value: "rejected" },
          ] },
        { type: "row", fields: [
          { name: "paymentTermDays", label: "Termin płatności (dni)", type: "number", defaultValue: 0, access: { update: ({ req }) => hasRole(req, "orders") }, admin: { width: "50%" } },
          { name: "discountPercent", label: "Dodatkowy rabat %", type: "number", min: 0, max: 50, access: { update: ({ req }) => hasRole(req, "orders") }, admin: { width: "50%" } },
        ] },
      ],
    },
    ], { condition: (d) => d?.accountType === "business" }),
    section("Adresy dostaw", "Zapisane adresy – klient wybiera je w koszyku.", "pin", [
    {
      name: "addresses",
      label: "Adresy",
      type: "array",
      labels: { singular: "Adres", plural: "Adresy" },
      admin: { components: { RowLabel: "@/payload/components/FormBits#AddressLabel" } },
      fields: [
        { name: "label", label: "Nazwa adresu", type: "text", admin: { placeholder: "np. Myjnia ul. Leśna" } },
        { type: "row", fields: [
          { name: "fullName", label: "Odbiorca", type: "text", admin: { width: "50%" } },
          { name: "company", label: "Firma", type: "text", admin: { width: "50%" } },
        ] },
        { name: "street", label: "Ulica i numer", type: "text" },
        { type: "row", fields: [
          { name: "postcode", label: "Kod pocztowy", type: "text", admin: { width: "30%" } },
          { name: "city", label: "Miejscowość", type: "text", admin: { width: "50%" } },
          { name: "country", label: "Kraj", type: "text", defaultValue: "PL", admin: { width: "20%" } },
        ] },
      ],
    },
    ]),
    section("Zgody (RODO)", "Daty wyrażenia zgód – ważne przy kontroli.", "check", [
    {
      name: "consents",
      label: false,
      type: "group",
      fields: [
        { name: "newsletter", label: "Newsletter", type: "checkbox" },
        { name: "newsletterAt", label: "Data zgody na newsletter", type: "date" },
        { name: "termsAcceptedAt", label: "Akceptacja regulaminu", type: "date" },
      ],
    },
    ]),
  ],
};
