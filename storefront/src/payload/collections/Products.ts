import type { CollectionConfig } from "payload";
import { anyone, isEditor } from "../access";
import { seoFields, slugField } from "../fields";
import { keepEditedDescription, priceHistoryHook, stockAlertHook, invalidateCatalogHook } from "../productHooks";

// Produkt sklepu. Pola z zakładki „Ceny i magazyn” oraz nazwa/opis/zdjęcia są nadpisywane
// przez synchronizację z BaseLinkerem – chyba że zaznaczysz „Nie nadpisuj” w zakładce BaseLinker.
export const Products: CollectionConfig = {
  slug: "products",
  labels: { singular: "Produkt", plural: "Produkty" },
  admin: {
    group: "Sklep",
    useAsTitle: "name",
    defaultColumns: ["name", "price", "stock", "category", "status"],
    listSearchableFields: ["name", "sku", "ean", "brand"],
    pagination: { defaultLimit: 50 },
    components: {
      beforeListTable: ["@/payload/components/StatusTabs#ProductTabs"],
      edit: { beforeDocumentControls: ["@/payload/components/AdminClient#ViewProductInStore"] },
    },
  },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  hooks: {
    beforeChange: [priceHistoryHook, keepEditedDescription],
    afterChange: [stockAlertHook, invalidateCatalogHook],
    afterDelete: [invalidateCatalogHook],
  },
  fields: [
    // Podgląd produktu w kartach; formularz pokazuje się po „Edytuj”
    { type: "ui", name: "overview", admin: { disableListColumn: true, components: { Field: "@/payload/components/Overview#ProductOverview" } } },
    { name: "name", label: "Nazwa", type: "text", required: true, admin: { components: { Cell: "@/payload/components/Cells#ProductCell" } } },
    {
      type: "tabs",
      tabs: [
        {
          label: "Dane podstawowe",
          fields: [
            { type: "row", fields: [
              { name: "category", label: "Kategoria", type: "relationship", relationTo: "categories", index: true, admin: { width: "50%", components: { Cell: "@/payload/components/Cells#CategoryCell" } } },
              { name: "brand", label: "Marka", type: "text", index: true, admin: { width: "50%" } },
            ] },
            { name: "shortDescription", label: "Krótki opis (pod nazwą)", type: "textarea" },
            // Stare pole edytora – sklep go nie używa; widoczne tylko, jeśli ktoś coś w nim zapisał
            { name: "content", label: "Opis (stary edytor)", type: "richText", admin: { condition: (data) => Boolean(data?.content), description: "Sklep pokazuje „Opis produktu” poniżej – przenieś treść tam." } },
            { name: "descriptionHtml", label: "Opis produktu", type: "code", admin: { language: "html", components: { Field: "@/payload/components/HtmlEditor#HtmlEditor" }, description: "Synchronizacja z BaseLinkerem może nadpisać opis – zaznacz „Nie nadpisuj opisu” w zakładce BaseLinker, jeśli zmieniasz go tutaj." } },
            { name: "related", label: "Produkty powiązane („Kup razem”)", type: "relationship", relationTo: "products", hasMany: true, admin: { description: "Akcesoria i produkty uzupełniające – pokazywane na stronie produktu." } },
            { name: "badges", label: "Etykiety", type: "select", hasMany: true, options: [
              { label: "Nowość", value: "nowosc" }, { label: "Promocja", value: "promocja" }, { label: "Bestseller", value: "bestseller" },
            ] },
          ],
        },
        {
          label: "Ceny i magazyn",
          fields: [
            { type: "row", fields: [
              { name: "price", label: "Cena brutto (detal) zł", type: "number", required: true, min: 0, admin: { step: 0.01, width: "33%", components: { Cell: "@/payload/components/Cells#ProductPriceCell" } } },
              { name: "priceB2B", label: "Cena brutto B2B zł", type: "number", min: 0, admin: { step: 0.01, width: "33%", description: "Grupa cenowa B2B z BaseLinkera" } },
              { name: "vatRate", label: "VAT %", type: "number", defaultValue: 23, admin: { width: "33%" } },
            ] },
            { type: "row", fields: [
              { name: "oldPrice", label: "Cena przekreślona (ręcznie) zł", type: "number", min: 0, admin: { step: 0.01, width: "50%", description: "Zwykle zostaw puste – użyj promocji czasowej poniżej." } },
              { name: "lowestPrice30d", label: "Najniższa cena z 30 dni (Omnibus) zł", type: "number", min: 0, admin: { step: 0.01, width: "50%", readOnly: true, description: "Liczona automatycznie z historii cen." } },
            ] },
            {
              name: "sale",
              label: "Promocja czasowa",
              type: "group",
              admin: { description: "W podanym okresie sklep pokaże cenę promocyjną, przekreśloną cenę regularną i najniższą cenę z 30 dni (Omnibus)." },
              fields: [
                { type: "row", fields: [
                  { name: "price", label: "Cena promocyjna brutto zł", type: "number", min: 0, admin: { step: 0.01, width: "34%" } },
                  { name: "from", label: "Od", type: "date", admin: { width: "33%", date: { pickerAppearance: "dayAndTime" } } },
                  { name: "to", label: "Do", type: "date", admin: { width: "33%", date: { pickerAppearance: "dayAndTime" } } },
                ] },
              ],
            },
            {
              name: "priceHistory",
              label: "Historia cen (ostatnie 90 dni)",
              type: "array",
              admin: { readOnly: true, initCollapsed: true, description: "Zapisywana automatycznie przy każdej zmianie ceny." },
              fields: [{ type: "row", fields: [
                { name: "date", label: "Data", type: "date", admin: { width: "50%" } },
                { name: "price", label: "Cena", type: "number", admin: { width: "50%" } },
              ] }],
            },
            { type: "row", fields: [
              { name: "sku", label: "SKU", type: "text", index: true, admin: { width: "33%" } },
              { name: "ean", label: "EAN", type: "text", index: true, admin: { width: "33%" } },
              { name: "stock", label: "Stan magazynowy", type: "number", defaultValue: 0, admin: { width: "33%", components: { Cell: "@/payload/components/Cells#StockCell" } } },
            ] },
            { type: "row", fields: [
              { name: "unitLabel", label: "Pojemność / wariant", type: "text", admin: { width: "50%", placeholder: "np. 5 L" } },
              { name: "weight", label: "Waga (kg)", type: "number", min: 0, admin: { width: "50%" } },
            ] },
          ],
        },
        {
          label: "Zdjęcia",
          fields: [
            {
              name: "images",
              label: "Zdjęcia",
              type: "array",
              labels: { singular: "Zdjęcie", plural: "Zdjęcia" },
              admin: { description: "Pierwsze zdjęcie jest główne. Wgraj plik albo podaj adres zdjęcia (np. z BaseLinkera).", components: { Cell: "@/payload/components/Cells#ThumbCell" } },
              fields: [
                { type: "row", fields: [
                  { name: "media", label: "Plik", type: "upload", relationTo: "media", admin: { width: "40%" } },
                  { name: "url", label: "lub adres URL", type: "text", admin: { width: "60%" } },
                ] },
              ],
            },
          ],
        },
        {
          label: "Bezpieczeństwo (CLP/GPSR)",
          fields: [
            { name: "hazardPictograms", label: "Piktogramy GHS", type: "select", hasMany: true, options: [
              { label: "GHS01 – materiały wybuchowe", value: "GHS01" }, { label: "GHS02 – łatwopalne", value: "GHS02" },
              { label: "GHS03 – utleniające", value: "GHS03" }, { label: "GHS04 – gazy pod ciśnieniem", value: "GHS04" },
              { label: "GHS05 – żrące", value: "GHS05" }, { label: "GHS06 – toksyczne", value: "GHS06" },
              { label: "GHS07 – drażniące", value: "GHS07" }, { label: "GHS08 – zagrożenie dla zdrowia", value: "GHS08" },
              { label: "GHS09 – środowisko", value: "GHS09" },
            ] },
            { name: "signalWord", label: "Hasło ostrzegawcze", type: "select", options: [
              { label: "Brak", value: "none" }, { label: "Uwaga", value: "warning" }, { label: "Niebezpieczeństwo", value: "danger" },
            ] },
            { name: "sds", label: "Karta charakterystyki (PDF)", type: "upload", relationTo: "media" },
            { name: "safetyNotes", label: "Zwroty H/P i uwagi", type: "textarea" },
          ],
        },
        { label: "SEO", fields: [seoFields] },
        {
          label: "BaseLinker",
          fields: [
            { type: "row", fields: [
              { name: "baselinkerId", label: "ID produktu w BaseLinkerze", type: "number", index: true, unique: true, admin: { width: "50%" } },
              { name: "source", label: "Źródło danych", type: "select", defaultValue: "manual", admin: { width: "50%" }, options: [
                { label: "BaseLinker (synchronizacja)", value: "baselinker" }, { label: "Import CSV", value: "csv" }, { label: "Ręcznie w panelu", value: "manual" },
              ] },
            ] },
            { name: "baselinkerCategoryId", label: "ID kategorii w BaseLinkerze", type: "number", admin: { readOnly: true } },
            {
              name: "keep",
              label: "Nie nadpisuj przy synchronizacji",
              type: "group",
              admin: { description: "Zaznaczone pola zostaną zmienione tylko ręcznie w panelu." },
              fields: [
                { type: "row", fields: [
                  { name: "name", label: "Nazwa", type: "checkbox" },
                  { name: "description", label: "Opis", type: "checkbox" },
                  { name: "images", label: "Zdjęcia", type: "checkbox" },
                  { name: "category", label: "Kategoria", type: "checkbox" },
                  { name: "price", label: "Cena", type: "checkbox" },
                ] },
              ],
            },
            { name: "lastSyncedAt", label: "Ostatnia synchronizacja", type: "date", admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
          ],
        },
      ],
    },
    slugField("name"),
    { name: "status", label: "Widoczność", type: "select", defaultValue: "active", index: true, admin: { position: "sidebar", components: { Cell: "@/payload/components/Cells#ProductStatusCell" } }, options: [
      { label: "Widoczny w sklepie", value: "active" },
      { label: "Ukryty", value: "hidden" },
      { label: "Wycofany", value: "archived" },
    ] },
  ],
};
