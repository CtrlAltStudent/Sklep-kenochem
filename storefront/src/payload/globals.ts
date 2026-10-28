import { revalidatePath } from "next/cache";
import type { GlobalAfterChangeHook, GlobalConfig } from "payload";
import { productList } from "./fields";
import { anyone, isAdmin, isEditor } from "./access";

const link = [
  { name: "label", label: "Napis", type: "text" as const, required: true },
  { name: "url", label: "Link", type: "text" as const, required: true, admin: { placeholder: "/kategoria/... lub https://..." } },
];

// Po zapisie ustawień (ceny dostaw, próg darmowej dostawy, płatności) odśwież zapamiętane strony sklepu od razu
export const refreshShop: GlobalAfterChangeHook = ({ doc }) => {
  try {
    revalidatePath("/", "layout");
  } catch {
    /* zapis poza żądaniem Next (skrypt) – nie ma czego odświeżać */
  }
  return doc;
};

export const Homepage: GlobalConfig = {
  slug: "homepage",
  label: "Strona główna",
  admin: { group: "Wygląd sklepu" },
  access: { read: anyone, update: isEditor },
  hooks: { afterChange: [refreshShop] },
  versions: { drafts: true, max: 20 },
  fields: [
    {
      name: "slides",
      label: "Banery (karuzela)",
      type: "array",
      labels: { singular: "Baner", plural: "Banery" },
      admin: { description: "Zalecany rozmiar obrazu: 1920 × 625 px." },
      fields: [
        { name: "image", label: "Obraz", type: "upload", relationTo: "media", required: true },
        { type: "row", fields: [
          { name: "kicker", label: "Nadtytuł", type: "text", admin: { width: "30%" } },
          { name: "title", label: "Tytuł", type: "text", admin: { width: "70%", description: "Puste = sam obraz (np. baner z gotowym napisem)." } },
        ] },
        { name: "text", label: "Tekst", type: "textarea" },
        { type: "row", fields: [
          { name: "ctaLabel", label: "Przycisk – napis", type: "text", admin: { width: "40%" } },
          { name: "link", label: "Link", type: "text", required: true, admin: { width: "60%" } },
        ] },
        { type: "row", fields: [
          { name: "activeFrom", label: "Pokazuj od", type: "date", admin: { width: "50%" } },
          { name: "activeTo", label: "Pokazuj do", type: "date", admin: { width: "50%" } },
        ] },
      ],
    },
    { name: "perks", label: "Atuty pod banerem", type: "array", maxRows: 4, fields: [
      { name: "icon", label: "Ikona", type: "upload", relationTo: "media" },
      { name: "title", label: "Tytuł", type: "text", required: true },
      { name: "text", label: "Opis", type: "text" },
    ] },
    {
      type: "collapsible",
      label: "Siatki produktów",
      admin: { initCollapsed: false, description: "Kolejność na stronie jest taka, jak na liście. Puste pole = sklep dobiera sam." },
      fields: [
        { name: "featuredTitle", label: "Tytuł sekcji polecanych", type: "text", defaultValue: "Wybór detailerów – SONAX" },
        productList("featuredProducts", "Polecane (wybór detailerów)", "Puste = pierwsze produkty marki SONAX."),
        productList("promoProducts", "Promocje", "Własna grupa na stronie głównej i na stronie Promocje. Puste = produkty z obniżoną ceną."),
        productList("newestProducts", "Nowości", "Własna grupa. Puste = najnowsze produkty dodane w panelu."),
        productList("bestsellerProducts", "Bestsellery", "Własna grupa na stronie Bestsellery. Puste = produkty z etykietą „Bestseller”."),
      ],
    },
    {
      name: "promoBanner",
      label: "Baner promocyjny",
      type: "group",
      fields: [
        { name: "image", label: "Tło", type: "upload", relationTo: "media" },
        { name: "kicker", label: "Nadtytuł", type: "text" },
        { name: "title", label: "Tytuł", type: "text" },
        { name: "text", label: "Tekst", type: "textarea" },
        { type: "row", fields: [
          { name: "ctaLabel", label: "Przycisk", type: "text", admin: { width: "40%" } },
          { name: "link", label: "Link", type: "text", admin: { width: "60%" } },
        ] },
      ],
    },
  ],
};

export const Navigation: GlobalConfig = {
  slug: "navigation",
  label: "Menu i stopka",
  admin: { group: "Wygląd sklepu" },
  access: { read: anyone, update: isEditor },
  hooks: { afterChange: [refreshShop] },
  fields: [
    { name: "announcement", label: "Pasek ogłoszeń (na samej górze)", type: "group", fields: [
      { name: "enabled", label: "Pokaż", type: "checkbox" },
      { name: "text", label: "Tekst", type: "text" },
      { name: "link", label: "Link", type: "text" },
    ] },
    { name: "headerLinks", label: "Linki w pasku menu (obok kategorii)", type: "array", fields: link },
    { name: "footerColumns", label: "Kolumny stopki", type: "array", maxRows: 4, fields: [
      { name: "title", label: "Nagłówek", type: "text", required: true },
      { name: "links", label: "Linki", type: "array", fields: link },
    ] },
  ],
};


export const StoreSettings: GlobalConfig = {
  slug: "store-settings",
  label: "Ustawienia sklepu",
  admin: { group: "Ustawienia" },
  hooks: { afterChange: [refreshShop] },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Firma i kontakt",
          fields: [
            { name: "storeName", label: "Nazwa sklepu", type: "text", defaultValue: "Sklep SONAX" },
            { type: "row", fields: [
              { name: "phone", label: "Telefon", type: "text", defaultValue: "+48 500 021 705", admin: { width: "50%" } },
              { name: "email", label: "E-mail", type: "email", admin: { width: "50%" } },
            ] },
            { name: "address", label: "Adres", type: "textarea", defaultValue: "ul. Gen. Wł. Andersa 40, Boks 16\n15-113 Białystok" },
            { name: "hours", label: "Godziny pracy", type: "text", defaultValue: "Pn–Pt 8:00–16:00" },
            { name: "gpsrResponsible", label: "Podmiot odpowiedzialny (GPSR)", type: "textarea" },
          ],
        },
        {
          label: "Dostawa",
          fields: [
            { name: "freeShippingThreshold", label: "Darmowa dostawa od (zł brutto)", type: "number", defaultValue: 249.99 },
            {
              name: "shippingMethods",
              label: "Metody dostawy",
              type: "array",
              labels: { singular: "Metoda", plural: "Metody" },
              admin: { initCollapsed: true, components: { RowLabel: "@/payload/components/FormBits#ShippingMethodLabel" } },
              fields: [
                { type: "row", fields: [
                  { name: "code", label: "Kod (wewnętrzny)", type: "text", required: true, admin: { width: "25%", placeholder: "inpost" } },
                  { name: "label", label: "Nazwa dla klienta", type: "text", required: true, admin: { width: "45%" } },
                  { name: "price", label: "Cena brutto", type: "number", required: true, min: 0, admin: { width: "30%", step: 0.01 } },
                ] },
                { type: "row", fields: [
                  { name: "baselinkerName", label: "Nazwa w BaseLinkerze (delivery_method)", type: "text", required: true, maxLength: 30, admin: { width: "50%", description: "Maks. 30 znaków. Musi pasować do reguł kurierskich w BaseLinkerze." } },
                  { name: "requiresPoint", label: "Wymaga wyboru punktu (paczkomat)", type: "checkbox", admin: { width: "25%" } },
                  { name: "enabled", label: "Aktywna", type: "checkbox", defaultValue: true, admin: { width: "25%" } },
                ] },
                { name: "freeAboveThreshold", label: "Darmowa powyżej progu", type: "checkbox", defaultValue: true },
              ],
            },
          ],
        },
        {
          label: "Płatności",
          fields: [
            {
              name: "paymentMethods",
              label: "Metody płatności",
              type: "array",
              labels: { singular: "Metoda", plural: "Metody" },
              admin: { initCollapsed: true, components: { RowLabel: "@/payload/components/FormBits#PaymentMethodLabel" } },
              fields: [
                { type: "row", fields: [
                  { name: "code", label: "Kod (wewnętrzny)", type: "text", required: true, admin: { width: "25%", placeholder: "p24" } },
                  { name: "label", label: "Nazwa dla klienta", type: "text", required: true, admin: { width: "45%" } },
                  { name: "provider", label: "Obsługa", type: "select", defaultValue: "przelewy24", admin: { width: "30%" }, options: [
                    { label: "Przelewy24 (online)", value: "przelewy24" }, { label: "Przelew tradycyjny", value: "transfer" },
                    { label: "Za pobraniem", value: "cod" }, { label: "Termin płatności (B2B)", value: "deferred" },
                  ] },
                ] },
                { type: "row", fields: [
                  { name: "baselinkerName", label: "Nazwa w BaseLinkerze (payment_method)", type: "text", required: true, maxLength: 30, admin: { width: "50%" } },
                  { name: "b2bOnly", label: "Tylko dla zatwierdzonych kont B2B", type: "checkbox", admin: { width: "25%" } },
                  { name: "enabled", label: "Aktywna", type: "checkbox", defaultValue: true, admin: { width: "25%" } },
                ] },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const BaseLinkerSettings: GlobalConfig = {
  slug: "baselinker-settings",
  label: "BaseLinker",
  admin: { group: "Integracje", description: "Połączenie z BaseLinkerem: katalog produktów, stany, ceny i przekazywanie zamówień." },
  access: { read: isAdmin, update: isAdmin },
  fields: [
    { type: "ui", name: "connectionPanel", admin: { components: { Field: "@/payload/components/BaseLinkerPanel#BaseLinkerPanel" } } },
    {
      type: "tabs",
      tabs: [
        {
          label: "Katalog",
          description: "Skąd sklep pobiera produkty, ceny i stany. ID odczytasz przyciskiem „Testuj połączenie”.",
          fields: [
            { type: "row", fields: [
              { name: "inventoryId", label: "ID katalogu (inventory_id)", type: "number", admin: { width: "33%" } },
              { name: "priceGroupId", label: "Grupa cenowa – detal", type: "number", admin: { width: "33%" } },
              { name: "priceGroupB2BId", label: "Grupa cenowa – B2B", type: "number", admin: { width: "33%" } },
            ] },
            { type: "row", fields: [
              { name: "warehouseId", label: "Magazyn stanów (np. bl_201)", type: "text", admin: { width: "50%", description: "Klucz magazynu w formacie z API, np. „bl_201”." } },
              { name: "language", label: "Język tekstów", type: "text", defaultValue: "pl", admin: { width: "50%" } },
            ] },
            {
              name: "sync",
              label: "Co synchronizować",
              type: "group",
              fields: [
                { type: "row", fields: [
                  { name: "name", label: "Nazwy", type: "checkbox", defaultValue: true },
                  { name: "description", label: "Opisy", type: "checkbox", defaultValue: true },
                  { name: "images", label: "Zdjęcia", type: "checkbox", defaultValue: true },
                  { name: "prices", label: "Ceny", type: "checkbox", defaultValue: true },
                  { name: "stock", label: "Stany", type: "checkbox", defaultValue: true },
                  { name: "category", label: "Kategorie", type: "checkbox", defaultValue: true },
                ] },
                { name: "hideMissing", label: "Ukrywaj produkty usunięte z BaseLinkera", type: "checkbox", defaultValue: true },
                { name: "newProductsHidden", label: "Nowe produkty dodawaj jako ukryte (do sprawdzenia)", type: "checkbox", defaultValue: false },
              ],
            },
          ],
        },
        {
          label: "Zamówienia",
          description: "Jak zamówienia ze sklepu trafiają do BaseLinkera.",
          fields: [
            { type: "row", fields: [
              { name: "orderStatusId", label: "Status nowego zamówienia (order_status_id)", type: "number", admin: { width: "50%" } },
              { name: "customSourceId", label: "Źródło zamówień (custom_source_id)", type: "number", admin: { width: "50%", description: "Opcjonalnie – osobne źródło „Nowy sklep”." } },
            ] },
            { name: "autoSend", label: "Wysyłaj zamówienia automatycznie", type: "checkbox", defaultValue: false },
            { name: "sendWhen", label: "Kiedy wysyłać", type: "radio", defaultValue: "paid", options: [
              { label: "Po opłaceniu (płatności online) – pozostałe od razu", value: "paid" },
              { label: "Zawsze od razu po złożeniu", value: "always" },
            ] },
            { type: "row", fields: [
              { name: "productStorage", label: "Magazyn produktów w zamówieniu", type: "select", defaultValue: "db", admin: { width: "50%" }, options: [
                { label: "Katalog BaseLinker (db)", value: "db" }, { label: "Sklep (shop)", value: "shop" }, { label: "Hurtownia (warehouse)", value: "warehouse" },
              ] },
              { name: "productStorageId", label: "ID magazynu (storage_id)", type: "number", defaultValue: 0, admin: { width: "50%", description: "0 dla katalogu BaseLinker." } },
            ] },
            { name: "extraField1", label: "Pole dodatkowe 1 (extra_field_1)", type: "select", defaultValue: "orderNumber", options: [
              { label: "Numer zamówienia ze sklepu", value: "orderNumber" }, { label: "Nie używaj", value: "none" },
            ] },
          ],
        },
      ],
    },
    { name: "lastProductSyncAt", label: "Ostatnia synchronizacja produktów", type: "date", admin: { readOnly: true, position: "sidebar", date: { pickerAppearance: "dayAndTime" } } },
    { name: "lastStockSyncAt", label: "Ostatnia synchronizacja stanów", type: "date", admin: { readOnly: true, position: "sidebar", date: { pickerAppearance: "dayAndTime" } } },
  ],
};
