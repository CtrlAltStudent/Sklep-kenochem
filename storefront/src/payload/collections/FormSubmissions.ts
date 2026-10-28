import type { CollectionConfig } from "payload";
import { isOrdersTeam } from "../access";

// Wiadomości z formularzy sklepu (kontakt, zgłoszenia B2B).
// Tworzone wyłącznie przez API sklepu (/api/forms) – po walidacji i ochronie antyspamowej.
export const FormSubmissions: CollectionConfig = {
  slug: "form-submissions",
  labels: { singular: "Zgłoszenie", plural: "Wiadomości i zgłoszenia" },
  admin: {
    group: "Sprzedaż",
    useAsTitle: "title",
    defaultColumns: ["title", "listProduct", "email", "status", "createdAt"],
    listSearchableFields: ["name", "email", "company", "nip"],
    description: "Wiadomości z formularza kontaktowego i pytania o produkty. Kliknij wiadomość, żeby odpowiedzieć klientowi mailem.",
  },
  access: { read: isOrdersTeam, create: () => false, update: isOrdersTeam, delete: isOrdersTeam },
  defaultSort: "-createdAt",
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const d = { ...originalDoc, ...data }; // przy zmianie statusu / odpowiedzi przychodzi tylko część pól
        data.title = d.type === "b2b" ? `B2B: ${d.company || d.name}` : `${d.subject || "Wiadomość"} – ${d.name}`;
        return data;
      },
    ],
  },
  fields: [
    { name: "title", type: "text", admin: { hidden: true } },
    { type: "ui", name: "conversation", admin: { disableListColumn: true, components: { Field: "@/payload/components/MessageView#MessageView" } } },
    { type: "ui", name: "listProduct", label: "Produkt", admin: { components: { Cell: "@/payload/components/MessageView#ProductCell" } } },
    { type: "row", fields: [
      { name: "type", label: "Rodzaj", type: "select", required: true, admin: { width: "50%" }, options: [
        { label: "Kontakt", value: "contact" }, { label: "Wniosek B2B", value: "b2b" },
      ] },
      { name: "status", label: "Status", type: "select", defaultValue: "new", index: true, admin: { width: "50%", components: { Cell: "@/payload/components/Cells#SubmissionStatusCell" } }, options: [
        { label: "Nowe", value: "new" }, { label: "W trakcie", value: "in_progress" }, { label: "Załatwione", value: "done" }, { label: "Spam", value: "spam" },
      ] },
    ] },
    { type: "row", fields: [
      { name: "name", label: "Imię i nazwisko", type: "text", required: true, admin: { width: "50%" } },
      { name: "email", label: "E-mail", type: "email", required: true, admin: { width: "50%" } },
    ] },
    { type: "row", fields: [
      { name: "phone", label: "Telefon", type: "text", admin: { width: "33%" } },
      { name: "company", label: "Firma", type: "text", admin: { width: "33%" } },
      { name: "nip", label: "NIP", type: "text", admin: { width: "33%" } },
    ] },
    { name: "subject", label: "Temat", type: "text" },
    { name: "message", label: "Wiadomość", type: "textarea" },
    { name: "consent", label: "Zgoda na przetwarzanie danych", type: "checkbox", admin: { readOnly: true } },
    { name: "customer", label: "Utworzone konto klienta", type: "relationship", relationTo: "customers", admin: { description: "Po zatwierdzeniu wniosku B2B możesz powiązać tu konto klienta." } },
    { name: "internalNote", label: "Notatka wewnętrzna", type: "textarea" },
    { name: "meta", label: "Dane techniczne", type: "json", admin: { readOnly: true, description: "Strona, z której wysłano, przeglądarka." } },
  ],
};
