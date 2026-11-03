import type { CollectionConfig } from "payload";
import { anyone, isCatalog, isEditor } from "../access";
import { productList, section, seoFields, slugField } from "../fields";
import { VARIANT_DISPLAY, VARIANT_NAV } from "@/lib/data";
import { brandHook, keepEditedDescription, priceHistoryHook, stockAlertHook, invalidateCatalogHook, stripDescriptionImagesHook, variantParentHook, uniqueSkuHook, unlinkVariantsHook } from "../productHooks";

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
      beforeListTable: ["@/payload/components/StatusTabs#ProductTabs", "@/payload/components/ProductBulkBar#ProductBulkBar", "@/payload/components/SidebarActions#ExportProducts"],
      edit: { beforeDocumentControls: ["@/payload/components/AdminClient#ViewProductInStore"] },
    },
  },
  access: { read: anyone, create: isEditor, update: isCatalog, delete: isEditor },
  hooks: {
    beforeChange: [stripDescriptionImagesHook, uniqueSkuHook, priceHistoryHook, keepEditedDescription, variantParentHook, brandHook],
    afterChange: [stockAlertHook, invalidateCatalogHook],
    afterDelete: [unlinkVariantsHook, invalidateCatalogHook],
  },
  fields: [
    // Podgląd produktu w kartach; formularz pokazuje się po „Edytuj”
    { type: "ui", name: "overview", admin: { disableListColumn: true, components: { Field: "@/payload/components/Overview#ProductOverview" } } },
    {
      type: "tabs",
      tabs: [
        {
          label: "Dane podstawowe",
          fields: [
            section("Nazwa i opis", "Nazwa, kategoria, marka i opisy widoczne w sklepie.", "text", [
            { name: "name", label: "Nazwa", type: "text", required: true, admin: { components: { Cell: "@/payload/components/Cells#ProductCell" } } },
            { type: "row", fields: [
              { name: "category", label: "Kategoria", type: "relationship", relationTo: "categories", index: true, admin: { width: "50%", components: { Cell: "@/payload/components/Cells#CategoryCell" } } },
              { name: "brand", label: "Marka", type: "text", index: true, admin: { width: "50%", components: { Field: "@/payload/components/BrandSelect#BrandSelect" }, description: "Lista marek jest taka jak loga na stronie głównej. Innej marki sklep nie pokazuje." } },
            ] },
            { name: "shortDescription", label: "Krótki opis (pod nazwą)", type: "textarea" },
            // Stare pole edytora – sklep go nie używa; widoczne tylko, jeśli ktoś coś w nim zapisał
            { name: "content", label: "Opis (stary edytor)", type: "richText", admin: { condition: (data) => Boolean(data?.content), description: "Sklep pokazuje „Opis produktu” poniżej – przenieś treść tam." } },
            { name: "descriptionHtml", label: "Opis produktu", type: "code", admin: { language: "html", components: { Field: "@/payload/components/HtmlEditor#HtmlEditor" }, description: "Synchronizacja z BaseLinkerem może nadpisać opis – zaznacz „Nie nadpisuj opisu” w zakładce BaseLinker, jeśli zmieniasz go tutaj." } },
            productList("related", "Produkty powiązane („Kup razem”)", "Akcesoria i produkty uzupełniające – pokazywane na stronie produktu."),
            { name: "badges", label: "Etykiety", type: "select", hasMany: true, options: [
              { label: "Nowość", value: "nowosc" }, { label: "Promocja", value: "promocja" },               { label: "Bestseller", value: "bestseller" },
            ] },
            ], { id: "opis" }),
          ],
        },
        {
          label: "Ceny i magazyn",
          fields: [
            section("Cena", "Cena detaliczna, pojemność do ceny za litr, promocja i progi ilościowe.", "tag", [
            { type: "row", fields: [
              { name: "price", label: "Cena brutto (detal) zł", type: "number", required: true, min: 0, admin: { step: 0.01, width: "33%", components: { Cell: "@/payload/components/Cells#ProductPriceCell" } } },
              { name: "priceB2B", label: "Cena brutto B2B zł", type: "number", min: 0, admin: { step: 0.01, width: "33%", description: "Grupa cenowa B2B z BaseLinkera" } },
              { name: "vatRate", label: "VAT %", type: "number", defaultValue: 23, admin: { width: "33%" } },
            ] },
            { name: "unitLabel", label: "Pojemność", type: "text", admin: { width: "50%", placeholder: "np. 5 L", description: "Ile jest w opakowaniu: 5 L, 500 ml albo 1 kg. Z tego liczy się cena za 1 l lub 1 kg. Numer modelu w nazwie (np. RO-180L) się nie liczy — wpisz prawdziwą pojemność bańki." } },
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
              name: "qtyPromo",
              label: "Rabat za większą ilość",
              type: "group",
              admin: { description: "Rabat jest na ostatniej sztuce w stosie, nie na całym zakupie. Puste daty = bez końca." },
              fields: [
                { name: "enabled", label: "Włączona", type: "checkbox", defaultValue: false },
                { type: "row", fields: [
                  { name: "from", label: "Od", type: "date", admin: { width: "50%", date: { pickerAppearance: "dayAndTime" } } },
                  { name: "to", label: "Do", type: "date", admin: { width: "50%", date: { pickerAppearance: "dayAndTime" } } },
                ] },
              ],
            },
            {
              name: "qtyTiers",
              label: "Progi rabatu",
              type: "array",
              maxRows: 4,
              labels: { singular: "Próg", plural: "Progi" },
              admin: { description: "Np. co 3. sztuka −30%: przy 12 sztukach rabat jest na 4 sztukach. Co 4. sztuka gratis: przy 12 sztukach 3 sztuki są za darmo. Gdy jest kilka progów, klient dostaje ten z większą zniżką." },
              fields: [{ type: "row", fields: [
                { name: "kind", label: "Co dostaje", type: "select", defaultValue: "percent", options: [
                  { label: "Rabat % na ostatnią sztukę", value: "percent" },
                  { label: "Ostatnia sztuka gratis", value: "free" },
                ], admin: { width: "40%" } },
                { name: "qty", label: "Co ile sztuk", type: "number", required: true, min: 2, admin: { width: "30%" } },
                { name: "percent", label: "Rabat %", type: "number", min: 1, max: 90, admin: { width: "30%", condition: (_data, sibling) => (sibling?.kind ?? "percent") !== "free" } },
              ] }],
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
            ], { id: "cena" }),
            section("Magazyn", "Kody, stan i waga przesyłki.", "package", [
            { type: "row", fields: [
              { name: "sku", label: "SKU", type: "text", index: true, admin: { width: "33%" } },
              { name: "ean", label: "EAN", type: "text", index: true, admin: { width: "33%" } },
              { name: "stock", label: "Stan magazynowy", type: "number", defaultValue: 0, admin: { width: "33%", components: { Cell: "@/payload/components/Cells#StockCell" } } },
            ] },
            { name: "weight", label: "Waga przesyłki (kg)", type: "number", min: 0, admin: { width: "50%", description: "Waga do wysyłki, nie pojemność do ceny za litr." } },
            ], { id: "magazyn" }),
          ],
        },
        {
          label: "Zestaw",
          fields: [
            section("Zestaw", "Z jakich produktów składa się ten zestaw.", "package", [
            { type: "ui", name: "bundleEditor", label: "Skład zestawu", admin: { disableListColumn: true, components: { Field: "@/payload/components/BundleEditor#BundleEditor" } } },
            { name: "bundle", label: "To jest zestaw", type: "checkbox", defaultValue: false, index: true, admin: { hidden: true, disableListColumn: true } },
            {
              name: "bundleItems",
              label: "Produkty w zestawie",
              type: "array",
              admin: { hidden: true, disableListColumn: true },
              fields: [
                { name: "product", label: "Produkt", type: "relationship", relationTo: "products" },
                { name: "sku", label: "SKU", type: "text" },
                { name: "quantity", label: "Ilość", type: "number", defaultValue: 1, min: 1 },
              ],
            },
            ], { id: "zestaw" }),
          ],
        },
        {
          label: "Warianty",
          fields: [
            section("Warianty", "Wersje tego towaru na jednej karcie w sklepie.", "settings", [
            { type: "ui", name: "variantEditor", label: "Warianty na karcie", admin: { disableListColumn: true, components: { Field: "@/payload/components/VariantEditor#VariantEditor" } } },
            { name: "variantOf", label: "Karta w sklepie", type: "relationship", relationTo: "products", index: true, filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true), admin: { hidden: true, disableListColumn: true, description: "Jeśli ustawione, ten produkt należy do grupy wariantów innej karty." } },
            { name: "variantSort", label: "Kolejność wariantu", type: "number", admin: { hidden: true, disableListColumn: true } },
            { name: "variantDisplay", label: "Wygląd wyboru w sklepie", type: "select", defaultValue: "pojemnosc", options: VARIANT_DISPLAY.map((d) => ({ label: d.label, value: d.id })), admin: { hidden: true, disableListColumn: true } },
            { name: "variantNav", label: "Strony wariantów", type: "select", defaultValue: "switch", options: VARIANT_NAV.map((d) => ({ label: d.label, value: d.id })), admin: { hidden: true, disableListColumn: true } },
            ], { id: "warianty" }),
          ],
        },
        {
          label: "Zdjęcia",
          fields: [
            section("Zdjęcia", "Pierwsze zdjęcie jest główne.", "image", [
            { type: "ui", name: "imageStrip", admin: { components: { Field: "@/payload/components/ImagePreview#ImageStrip" } } },
            {
              name: "images",
              label: "Zdjęcia",
              type: "array",
              labels: { singular: "Zdjęcie", plural: "Zdjęcia" },
              admin: {
                description: "Pierwsze zdjęcie jest główne. Wgraj plik albo podaj adres zdjęcia (np. z BaseLinkera).",
                components: { Cell: "@/payload/components/Cells#ThumbCell", RowLabel: "@/payload/components/ImagePreview#ImageRowLabel" },
              },
              fields: [
                { type: "row", fields: [
                  { name: "media", label: "Plik", type: "upload", relationTo: "media", admin: { width: "40%" } },
                  { name: "url", label: "lub adres URL", type: "text", admin: { width: "60%" } },
                ] },
              ],
            },
            ], { id: "zdjecia" }),
          ],
        },
        {
          label: "Bezpieczeństwo (CLP/GPSR)",
          fields: [
            section("Bezpieczeństwo", "Piktogramy, hasło i karta charakterystyki.", "shield", [
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
            ], { id: "bezpieczenstwo" }),
          ],
        },
        {
          label: "SEO i Google",
          fields: [
            section("SEO i Google", "Tytuł, opis i dane do Zakupów Google.", "seo", [
            // Podgląd wyniku w Google + lista kontrolna (bez zmian w bazie)
            { type: "ui", name: "seoPanel", admin: { components: { Field: "@/payload/components/SeoPanel#SeoPanel" } } },
            seoFields,
            {
              name: "seoExtra",
              label: "Pozycjonowanie",
              type: "group",
              fields: [
                { name: "focusKeyword", type: "text", admin: { hidden: true, disableListColumn: true } },
                { name: "canonical", label: "Adres kanoniczny (opcjonalnie)", type: "text", admin: { placeholder: "/produkt/inny-adres", description: "Tylko gdy ten produkt to duplikat innego – wpisz adres głównej wersji." } },
              ],
            },
            {
              name: "merchant",
              label: "Zakupy Google i reklamy",
              type: "group",
              admin: { description: "Dane do pliku /feed/google.xml (Merchant Center) i kampanii Google Ads." },
              fields: [
                { type: "row", fields: [
                  { name: "googleCategory", label: "Kategoria Google", type: "text", admin: { width: "50%", placeholder: "np. 8237 albo Pojazdy i części > Akcesoria > Środki czystości", description: "ID albo ścieżka z taksonomii Google – lepsze dopasowanie reklam." } },
                  { name: "exclude", label: "Nie pokazuj w Zakupach Google", type: "checkbox", admin: { width: "50%" } },
                ] },
                { type: "row", fields: [
                  { name: "customLabel0", label: "Etykieta reklam 0", type: "text", admin: { width: "33%", placeholder: "np. bestseller", description: "Do dzielenia kampanii w Google Ads." } },
                  { name: "customLabel1", label: "Etykieta reklam 1", type: "text", admin: { width: "33%", placeholder: "np. wysoka marża" } },
                  { name: "customLabel2", label: "Etykieta reklam 2", type: "text", admin: { width: "34%", placeholder: "np. sezon zima" } },
                ] },
                { name: "highlights", label: "Najważniejsze cechy (po jednej w linii, do 10)", type: "textarea", admin: { placeholder: "Usuwa owady w 60 sekund\nBezpieczny dla lakieru i plastików\nGotowy do użycia", description: "Pokazywane w Zakupach Google jako lista zalet produktu." } },
              ],
            },
            ], { id: "seo" }),
          ],
        },
        {
          label: "BaseLinker",
          fields: [
            section("BaseLinker", "Połączenie z katalogiem i pola, których synchronizacja nie nadpisuje.", "package", [
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
            ], { id: "baselinker-produkt" }),
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
    { type: "ui", name: "quickActions", admin: { position: "sidebar", disableListColumn: true, components: { Field: "@/payload/components/SidebarActions#ProductActions" } } },
  ],
};
