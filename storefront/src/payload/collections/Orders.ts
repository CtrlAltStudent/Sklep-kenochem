import type { CollectionConfig } from "payload";
import { isOrdersTeam, ownOrdersOrStaff } from "../access";
import { section } from "../fields";
import { autoSendToBaseLinker } from "@/integrations/baselinker/orders";
import { orderStatusMailHook } from "@/integrations/mail/events";

const round2 = (n: number) => Math.round(n * 100) / 100;

// Zamówienie złożone w sklepie. Po opłaceniu (lub od razu – zależnie od ustawień)
// trafia do BaseLinkera, gdzie odbywa się dalsza obsługa: kurier, faktura, statusy.
export const Orders: CollectionConfig = {
  slug: "orders",
  labels: { singular: "Zamówienie", plural: "Zamówienia" },
  admin: {
    group: "Sprzedaż",
    useAsTitle: "orderNumber",
    defaultColumns: ["orderNumber", "listCustomer", "total", "status", "listDelivery", "listIntegration"],
    listSearchableFields: ["orderNumber", "email", "shipping.fullName", "invoice.nip"],
    components: { beforeListTable: ["@/payload/components/StatusTabs#OrderTabs"] },
  },
  access: { read: ownOrdersOrStaff, create: isOrdersTeam, update: isOrdersTeam, delete: isOrdersTeam },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === "create" && !data.orderNumber) {
          // Kolejny numer w roku liczony od ostatniego istniejącego (odporne na usunięte zamówienia)
          const prefix = `SX/${new Date().getFullYear()}/`;
          const last = await req.payload.find({
            collection: "orders", req, limit: 1, depth: 0, sort: "-orderNumber", overrideAccess: true,
            where: { orderNumber: { like: prefix } }, select: { orderNumber: true },
          });
          const lastNo = Number(last.docs[0]?.orderNumber?.slice(prefix.length) ?? 0);
          data.orderNumber = `${prefix}${String(lastNo + 1).padStart(5, "0")}`;
        }
        const items = (data.items ?? []) as { priceGross?: number; quantity?: number }[];
        data.subtotal = round2(items.reduce((s, i) => s + (i.priceGross ?? 0) * (i.quantity ?? 0), 0));
        data.total = round2(data.subtotal + (data.shipping?.price ?? 0));
        return data;
      },
    ],
    afterChange: [autoSendToBaseLinker, orderStatusMailHook],
  },
  fields: [
    { name: "orderNumber", label: "Numer zamówienia", type: "text", unique: true, index: true, admin: { readOnly: true, position: "sidebar", description: "Nadawany automatycznie przy zapisie.", components: { Cell: "@/payload/components/Cells#OrderNumberCell" } } },
    { name: "status", label: "Status w sklepie", type: "select", defaultValue: "new", index: true, admin: { position: "sidebar", components: { Cell: "@/payload/components/Cells#OrderStatusCell" } }, options: [
      { label: "Nowe", value: "new" },
      { label: "Oczekuje na płatność", value: "awaiting_payment" },
      { label: "Opłacone", value: "paid" },
      { label: "Przekazane do realizacji (BaseLinker)", value: "processing" },
      { label: "Wysłane do klienta", value: "shipped" },
      { label: "Anulowane", value: "cancelled" },
    ] },
    { type: "ui", name: "sidebarSummary", admin: { position: "sidebar", disableListColumn: true, components: { Field: "@/payload/components/FormBits#OrderSidebar" } } },
    {
      type: "tabs",
      tabs: [
        {
          label: "Produkty",
          fields: [
            section("Pozycje zamówienia", "Wybierz produkt – nazwa, kody i cena uzupełnią się same. Sumy liczą się przy zapisie.", "cart", [
            {
              name: "items",
              label: "Pozycje",
              type: "array",
              required: true,
              minRows: 1,
              labels: { singular: "Pozycja", plural: "Pozycje" },
              admin: { components: { RowLabel: "@/payload/components/FormBits#OrderItemLabel" } },
              fields: [
                { type: "ui", name: "autofill", admin: { components: { Field: "@/payload/components/FormBits#ProductAutofill" } } },
                { type: "row", fields: [
                  { name: "product", label: "Produkt", type: "relationship", relationTo: "products", admin: { width: "55%" } },
                  { name: "name", label: "Nazwa (w chwili zakupu)", type: "text", required: true, admin: { width: "45%" } },
                ] },
                { type: "row", fields: [
                  { name: "sku", label: "SKU", type: "text", admin: { width: "20%" } },
                  { name: "ean", label: "EAN", type: "text", admin: { width: "20%" } },
                  { name: "quantity", label: "Ilość", type: "number", required: true, min: 1, defaultValue: 1, admin: { width: "15%" } },
                  { name: "priceGross", label: "Cena brutto/szt.", type: "number", required: true, min: 0, admin: { width: "25%", step: 0.01 } },
                  { name: "vatRate", label: "VAT %", type: "number", defaultValue: 23, admin: { width: "20%" } },
                ] },
                { name: "variantLabel", label: "Wariant", type: "text" },
              ],
            },
            { type: "row", fields: [
              // Liczone w hooku przy zapisie; w formularzu pokazujemy podsumowanie na żywo (OrderSummary)
              { name: "subtotal", label: "Produkty (brutto)", type: "number", admin: { readOnly: true, width: "50%", condition: () => false } },
              { name: "total", label: "Wartość i płatność", type: "number", admin: { readOnly: true, width: "50%", condition: () => false, components: { Cell: "@/payload/components/Cells#OrderTotalCell" } } },
            ] },
            { type: "ui", name: "summary", admin: { components: { Field: "@/payload/components/FormBits#OrderSummary" } } },
            ]),
            section("Uwagi i notatki", "Wiadomość od klienta oraz notatka dla magazynu.", "message", [
              { name: "customerNote", label: "Uwagi klienta", type: "textarea", maxLength: 510, admin: { placeholder: "np. proszę o telefon przed dostawą" } },
              { name: "adminNote", label: "Notatka wewnętrzna (trafia do BaseLinkera)", type: "textarea", maxLength: 200, admin: { placeholder: "Widoczna tylko dla pracowników" } },
            ]),
          ],
        },
        {
          label: "Klient i dostawa",
          fields: [
            section("Klient", "Powiąż z kontem klienta lub wpisz dane kontaktowe gościa.", "user", [
            { name: "customer", label: "Konto klienta", type: "relationship", relationTo: "customers", admin: { description: "Opcjonalne – zamówienia gości nie mają konta." } },
            { type: "row", fields: [
              { name: "email", label: "E-mail", type: "email", required: true, admin: { width: "50%", placeholder: "klient@firma.pl" } },
              { name: "phone", label: "Telefon", type: "text", admin: { width: "50%", placeholder: "+48 …" } },
            ] },
            ]),
            section("Dostawa", "Sposób dostawy, adres odbiorcy albo paczkomat.", "truck", [
            {
              name: "shipping",
              label: false,
              type: "group",
              fields: [
                { type: "row", fields: [
                  { name: "method", label: "Kod metody dostawy", type: "text", required: true, admin: { width: "50%", description: "Kod z Ustawienia sklepu → Metody dostawy" } },
                  { name: "price", label: "Koszt dostawy brutto", type: "number", defaultValue: 0, min: 0, admin: { width: "50%", step: 0.01 } },
                ] },
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
                {
                  name: "point",
                  label: "Punkt odbioru (paczkomat)",
                  type: "group",
                  fields: [
                    { type: "row", fields: [
                      { name: "code", label: "Kod punktu", type: "text", admin: { width: "30%", placeholder: "np. BIA01M" } },
                      { name: "name", label: "Nazwa", type: "text", admin: { width: "70%" } },
                    ] },
                    { type: "row", fields: [
                      { name: "address", label: "Adres", type: "text", admin: { width: "50%" } },
                      { name: "postcode", label: "Kod", type: "text", admin: { width: "20%" } },
                      { name: "city", label: "Miasto", type: "text", admin: { width: "30%" } },
                    ] },
                  ],
                },
              ],
            },
            ]),
            section("Faktura", "Zaznacz, jeśli klient chce fakturę VAT na firmę.", "invoice", [
            {
              name: "invoice",
              label: false,
              type: "group",
              fields: [
                { name: "wanted", label: "Klient chce fakturę", type: "checkbox" },
                { type: "row", admin: { condition: (_, s) => Boolean(s?.wanted) }, fields: [
                  { name: "company", label: "Nazwa firmy", type: "text", admin: { width: "60%" } },
                  { name: "nip", label: "NIP", type: "text", admin: { width: "40%" } },
                ] },
                { type: "row", admin: { condition: (_, s) => Boolean(s?.wanted) }, fields: [
                  { name: "fullName", label: "Imię i nazwisko", type: "text", admin: { width: "40%" } },
                  { name: "street", label: "Ulica i numer", type: "text", admin: { width: "60%" } },
                ] },
                { type: "row", admin: { condition: (_, s) => Boolean(s?.wanted) }, fields: [
                  { name: "postcode", label: "Kod", type: "text", admin: { width: "30%" } },
                  { name: "city", label: "Miasto", type: "text", admin: { width: "50%" } },
                  { name: "country", label: "Kraj", type: "text", defaultValue: "PL", admin: { width: "20%" } },
                ] },
              ],
            },
            ]),
          ],
        },
        {
          label: "Płatność",
          fields: [
            section("Płatność", "Metoda i status płatności. Dane Przelewy24 uzupełniają się automatycznie.", "card", [
            {
              name: "payment",
              label: false,
              type: "group",
              fields: [
                { type: "row", fields: [
                  { name: "method", label: "Kod metody płatności", type: "text", required: true, admin: { width: "50%", description: "Kod z Ustawienia sklepu → Metody płatności" } },
                  { name: "status", label: "Status płatności", type: "select", defaultValue: "pending", index: true, admin: { width: "50%" }, options: [
                    { label: "Oczekuje", value: "pending" }, { label: "Opłacone", value: "paid" },
                    { label: "Nieudana", value: "failed" }, { label: "Zwrócona", value: "refunded" },
                    { label: "Za pobraniem / przelew odroczony", value: "deferred" },
                  ] },
                ] },
                { type: "row", fields: [
                  { name: "provider", label: "Operator", type: "select", defaultValue: "przelewy24", admin: { width: "33%" }, options: [
                    { label: "Przelewy24", value: "przelewy24" }, { label: "Przelew tradycyjny", value: "transfer" }, { label: "Brak (pobranie / termin)", value: "none" },
                  ] },
                  { name: "sessionId", label: "ID sesji P24", type: "text", admin: { width: "33%", readOnly: true } },
                  { name: "transactionId", label: "ID transakcji P24", type: "text", admin: { width: "33%", readOnly: true } },
                ] },
                { name: "paidAt", label: "Data opłacenia", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
              ],
            },
            ]),
          ],
        },
        {
          label: "BaseLinker",
          fields: [
            { type: "ui", name: "baselinkerPanel", admin: { components: { Field: "@/payload/components/OrderBaseLinkerPanel#OrderBaseLinkerPanel" } } },
            {
              name: "baselinker",
              label: "Status przekazania do BaseLinkera",
              type: "group",
              fields: [
                { type: "row", fields: [
                  { name: "syncStatus", label: "BaseLinker", type: "select", defaultValue: "pending", index: true, admin: { readOnly: true, width: "33%", components: { Cell: "@/payload/components/Cells#SyncStatusCell" } }, options: [
                    { label: "Czeka na wysłanie", value: "pending" }, { label: "Wysłane", value: "sent" },
                    { label: "Błąd", value: "error" }, { label: "Pominięte", value: "skipped" },
                  ] },
                  { name: "orderId", label: "ID zamówienia w BaseLinkerze", type: "number", admin: { readOnly: true, width: "33%" } },
                  { name: "attempts", label: "Liczba prób", type: "number", defaultValue: 0, admin: { readOnly: true, width: "33%" } },
                ] },
                { name: "lastAttemptAt", label: "Ostatnia próba", type: "date", admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
                { name: "lastError", label: "Ostatnie błędy / ostrzeżenia", type: "textarea", admin: { readOnly: true } },
              ],
            },
          ],
        },
      ],
    },
    // Kolumny listy zamówień (tylko do wyświetlania – bez kolumn w bazie)
    { type: "ui", name: "listCustomer", label: "Klient", admin: { components: { Cell: "@/payload/components/Cells#OrderCustomerCell" } } },
    { type: "ui", name: "listDelivery", label: "Dostawa", admin: { components: { Cell: "@/payload/components/Cells#OrderDeliveryCell" } } },
    { type: "ui", name: "listIntegration", label: "BaseLinker", admin: { components: { Cell: "@/payload/components/Cells#OrderIntegrationCell" } } },
  ],
};
