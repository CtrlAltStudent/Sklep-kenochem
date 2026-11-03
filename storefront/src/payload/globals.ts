import { revalidatePath } from "next/cache";
import type { GlobalAfterChangeHook, GlobalConfig } from "payload";
import { productList, section } from "./fields";
import { iconOptions } from "./iconOptions";
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
    { type: "ui", name: "homeBoard", admin: { components: { Field: { path: "@/payload/components/SectionSheet#SectionBoard", clientProps: {
      always: true,
      sections: [
        { id: "banery", title: "Banery", hint: "Karuzela na górze strony." },
        { id: "etykiety", title: "Etykiety pod banerem", hint: "Cztery hasła: wysyłka, odbiór, płatność, telefon." },
        { id: "kafelki", title: "Kafelki kategorii", hint: "Działy, układ i kolejność." },
        { id: "skroty", title: "Dobierz produkt", hint: "Szybki wybór i krok po kroku." },
        { id: "scena", title: "Zdjęcie z produktem", hint: "Grafika i pulsujące kropki." },
        { id: "polecane", title: "Polecane", hint: "Lista produktów na stronie głównej." },
        { id: "promocje", title: "Promocje", hint: "Tytuł i lista obniżonych cen." },
        { id: "nowosci", title: "Nowości", hint: "Tytuł i lista nowości." },
        { id: "promo", title: "Baner promocyjny", hint: "Szeroki baner niżej na stronie." },
        { id: "loga", title: "Loga marek", hint: "Pasek marek." },
        { id: "onas", title: "O nas", hint: "Tekst, zdjęcie i przycisk." },
        { id: "bestsellery", title: "Bestsellery", hint: "Lista na stronie bestsellerów." },
      ],
    } } } } },
    section("Banery", "Karuzela na górze. Obraz 1920 × 625 px.", "image", [
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
    ], { id: "banery" }),
    section("Etykiety pod banerem", "Cztery hasła pod banerem. Pusta lista = teksty domyślne.", "info", [
    { name: "perks", label: "Etykiety", type: "array", maxRows: 4, fields: [
      { name: "icon", label: "Ikona", type: "upload", relationTo: "media" },
      { name: "title", label: "Tytuł", type: "text", required: true },
      { name: "text", label: "Opis", type: "text" },
    ] },
    ], { id: "etykiety" }),
    section("Loga marek", "Te loga są na stronie głównej i na stronie Marki. Nazwa musi być taka, jak przy produkcie. Kolejność na liście = kolejność na stronie.", "tag", [
    { name: "brandsTitle", label: "Tytuł paska", type: "text", admin: { placeholder: "Marki w sklepie" } },
    { name: "brandLogos", label: "Loga", type: "array", labels: { singular: "Logo", plural: "Loga" }, fields: [
      { name: "logo", label: "Logo", type: "upload", relationTo: "media", required: true },
      { type: "row", fields: [
        { name: "name", label: "Nazwa marki", type: "text", required: true, admin: { width: "50%" } },
        { name: "link", label: "Link", type: "text", admin: { width: "50%", placeholder: "/marki/sonax", description: "Puste = strona marki z nazwy." } },
      ] },
    ] },
    ], { id: "loga" }),
    section("Kafelki kategorii", "Puste pole = tekst, który jest na stronie dziś. Zapis jako szkic nie wchodzi na sklep — najpierw otwórz podgląd.", "sparkles", [
        { name: "previewLink", type: "ui", admin: { components: { Field: "@/payload/components/HomePreviewLink#HomePreviewLink" } } },
        { type: "row", fields: [
          { name: "categoryKicker", label: "Nadtytuł kafelków", type: "text", admin: { width: "40%", placeholder: "Kategorie" } },
          { name: "categoryTitle", label: "Tytuł kafelków", type: "text", admin: { width: "60%", placeholder: "Co chcesz zrobić?" } },
        ] },
        { type: "row", fields: [
          { name: "categoryStyle", label: "Układ kafelków", type: "select", defaultValue: "rowne", admin: { width: "34%" }, options: [
            { label: "Równe – dopasowują się do liczby działów", value: "rowne" },
            { label: "Pierwszy rząd większy", value: "pierwsze" },
            { label: "Szerokie, po dwa", value: "szerokie" },
          ] },
          { name: "categoryColumns", label: "Kafelków w rzędzie", type: "select", defaultValue: "4", admin: { width: "22%", condition: (_, siblingData) => siblingData?.categoryStyle !== "szerokie" && siblingData?.categoryStyle !== "pierwsze" }, options: [
            { label: "4", value: "4" }, { label: "3", value: "3" },
          ] },
          { name: "showCategoryCount", label: "Liczba produktów", type: "checkbox", defaultValue: true, admin: { width: "22%" } },
          { name: "showCategoryIcon", label: "Ikona na kafelku", type: "checkbox", defaultValue: true, admin: { width: "22%" } },
        ] },
        { name: "homeCategories", label: "Które działy na kafelkach", type: "relationship", relationTo: "categories", hasMany: true, admin: { description: "Puste = wszystkie działy, które mają produkty, w kolejności z kategorii. Tu ustawisz własną kolejność albo schowasz dział ze strony głównej. W menu zostaje." } },
    ], { id: "kafelki" }),
    section("Dobierz produkt", "Puste skróty = sklep układa je sam z kategorii, które mają produkty.", "sparkles", [
        { type: "row", fields: [
          { name: "usageKicker", label: "Nadtytuł szybkiego wyboru", type: "text", admin: { width: "34%", placeholder: "Szybki wybór" } },
          { name: "usageTitle", label: "Tytuł szybkiego wyboru", type: "text", admin: { width: "33%", placeholder: "Co dziś czyścisz?" } },
          { name: "usageStepsTitle", label: "Tytuł drugiej zakładki", type: "text", admin: { width: "33%", placeholder: "Krok po kroku" } },
        ] },
        { name: "shortcuts", label: "Własne skróty", type: "array", labels: { singular: "Skrót", plural: "Skróty" }, admin: { description: "Puste „Co czyścisz?” = sklep sam układa skróty z kategorii, które mają produkty. Nowy dział wchodzi sam. Puste „Krok po kroku” = gotowa kolejność detailingu. Wpisanie własnych skrótów zastępuje tę zakładkę." }, fields: [
          { type: "row", fields: [
            { name: "label", label: "Napis", type: "text", required: true, admin: { width: "30%" } },
            { name: "url", label: "Link", type: "text", required: true, admin: { width: "40%", placeholder: "/kategoria/neutralizatory" } },
            { name: "kind", label: "Zakładka", type: "select", defaultValue: "zadanie", admin: { width: "30%" }, options: [
              { label: "Co czyścisz?", value: "zadanie" }, { label: "Krok po kroku", value: "kroki" },
            ] },
          ] },
          { name: "icon", label: "Ikona", type: "select", options: iconOptions },
        ] },
    ], { id: "skroty" }),
    section("O nas", "Krótki blok na dole strony głównej.", "text", [
        { type: "row", fields: [
          { name: "aboutKicker", label: "Nadtytuł „O nas”", type: "text", admin: { width: "30%", placeholder: "O nas" } },
          { name: "aboutTitle", label: "Tytuł „O nas”", type: "text", admin: { width: "70%", placeholder: "Sklep SONAX z Białegostoku" } },
        ] },
        { name: "aboutText", label: "Tekst „O nas”", type: "textarea" },
        { type: "row", fields: [
          { name: "aboutLinkLabel", label: "Napis przycisku", type: "text", admin: { width: "30%", placeholder: "Poznaj nas" } },
          { name: "aboutLink", label: "Link przycisku", type: "text", admin: { width: "40%", placeholder: "/o-nas" } },
          { name: "aboutImage", label: "Zdjęcie", type: "upload", relationTo: "media", admin: { width: "30%" } },
        ] },
    ], { id: "onas" }),
    section("Polecane", "Puste = pierwsze produkty marki SONAX.", "cart", [
        { name: "featuredTitle", label: "Tytuł sekcji", type: "text", defaultValue: "Wybór detailerów – SONAX" },
        productList("featuredProducts", "Produkty", "Puste = pierwsze produkty marki SONAX."),
    ], { id: "polecane" }),
    section("Promocje", "Puste = produkty z obniżoną ceną.", "cart", [
        { name: "dealsTitle", label: "Tytuł", type: "text", admin: { placeholder: "Obniżone ceny" } },
        productList("promoProducts", "Produkty", "Własna grupa. Puste = produkty z obniżoną ceną."),
    ], { id: "promocje" }),
    section("Nowości", "Puste = najnowsze produkty dodane w panelu.", "cart", [
        { name: "newestTitle", label: "Tytuł", type: "text", admin: { placeholder: "Nowości" } },
        productList("newestProducts", "Produkty", "Własna grupa. Puste = najnowsze produkty."),
    ], { id: "nowosci" }),
    section("Bestsellery", "Puste = produkty z etykietą „Bestseller”.", "cart", [
        productList("bestsellerProducts", "Produkty", "Własna grupa na stronie Bestsellery."),
    ], { id: "bestsellery" }),
    section("Zdjęcie z produktem", "Grafika i kropki. Zapis jako szkic widać w podglądzie. Klienci zobaczą to po Publikuj.", "image", [
        { type: "row", fields: [
          { name: "sceneKicker", label: "Nadtytuł", type: "text", admin: { width: "30%", placeholder: "W warsztacie" } },
          { name: "sceneTitle", label: "Tytuł baneru", type: "text", admin: { width: "70%", placeholder: "Najedź na opryskiwacz" } },
        ] },
        { name: "sceneHint", label: "Dopisek po prawej", type: "text", admin: { placeholder: "Na telefonie wystarczy dotknąć." } },
        { name: "sceneImage", type: "upload", relationTo: "media", admin: { hidden: true } },
        { name: "sceneSpots", type: "json", admin: { hidden: true } },
        { name: "sceneEditor", type: "ui", admin: { components: { Field: "@/payload/components/SceneEditor#SceneEditor" } } },
    ], { id: "scena" }),
    section("Baner promocyjny", "Szeroki baner niżej na stronie głównej.", "image", [
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
    ], { id: "promo" }),
  ],
};

export const Navigation: GlobalConfig = {
  slug: "navigation",
  label: "Menu i stopka",
  admin: { group: "Wygląd sklepu" },
  access: { read: anyone, update: isEditor },
  hooks: { afterChange: [refreshShop] },
  fields: [
    { type: "ui", name: "navBoard", admin: { components: { Field: { path: "@/payload/components/SectionSheet#SectionBoard", clientProps: {
      always: true,
      sections: [
        { id: "pasek", title: "Pasek na górze", hint: "Czarny pasek z informacją nad menu." },
        { id: "menu", title: "Linki w menu", hint: "Obok kategorii, np. Rozcieńczanie i Kontakt." },
        { id: "stopka", title: "Stopka", hint: "Kolumny linków na dole strony." },
      ],
    } } } } },
    section("Pasek na górze", "Czarny pasek nad menu. Pusty tekst = darmowa dostawa i czas wysyłki.", "info", [
    { name: "announcement", label: "Pasek", type: "group", fields: [
      { name: "enabled", label: "Pokaż pasek", type: "checkbox", defaultValue: true },
      { name: "text", label: "Tekst", type: "text", admin: { description: "Puste = „Darmowa dostawa od … · wysyłka zwykle w 1 dzień roboczy”. Kwota darmowej dostawy jest w Ustawieniach sklepu → Dostawa." } },
      { name: "link", label: "Link (opcjonalnie)", type: "text" },
    ] },
    ], { id: "pasek" }),
    section("Linki w menu", "Obok kategorii. Pusta lista = linki wpisane w kodzie sklepu.", "link", [
    { name: "headerLinks", label: "Linki", type: "array", fields: link },
    ], { id: "menu" }),
    section("Stopka", "Najwyżej cztery kolumny.", "text", [
    { name: "footerColumns", label: "Kolumny", type: "array", maxRows: 4, fields: [
      { name: "title", label: "Nagłówek", type: "text", required: true },
      { name: "links", label: "Linki", type: "array", fields: link },
    ] },
    ], { id: "stopka" }),
  ],
};


export const StoreSettings: GlobalConfig = {
  slug: "store-settings",
  label: "Ustawienia sklepu",
  admin: { group: "Ustawienia" },
  hooks: { afterChange: [refreshShop] },
  access: { read: anyone, update: isAdmin },
  fields: [
    { type: "ui", name: "settingsBoard", admin: { components: { Field: { path: "@/payload/components/SectionSheet#SectionBoard", clientProps: {
      always: true,
      sections: [
        { id: "firma", title: "Firma i kontakt", hint: "Nazwa, telefon, adres, godziny.", tab: "Firma i kontakt" },
        { id: "dostawa-ustawienia", title: "Dostawa", hint: "Darmowa dostawa, godzina wysyłki i kurierzy.", tab: "Dostawa" },
        { id: "platnosci-ustawienia", title: "Płatności", hint: "Metody, które klient widzi w koszyku.", tab: "Płatności" },
      ],
    } } } } },
    {
      type: "tabs",
      tabs: [
        {
          label: "Firma i kontakt",
          fields: [
            section("Firma i kontakt", "Dane pokazywane w stopce, na stronie kontaktu i w mailach.", "info", [
            { name: "storeName", label: "Nazwa sklepu", type: "text", defaultValue: "Sklep SONAX" },
            { type: "row", fields: [
              { name: "phone", label: "Telefon", type: "text", defaultValue: "+48 500 021 705", admin: { width: "50%" } },
              { name: "email", label: "E-mail", type: "email", admin: { width: "50%" } },
            ] },
            { name: "address", label: "Adres", type: "textarea", defaultValue: "ul. Gen. Wł. Andersa 40, Boks 16\n15-113 Białystok" },
            { name: "hours", label: "Godziny pracy", type: "text", defaultValue: "Pn–Pt 8:00–16:00" },
            { name: "gpsrResponsible", label: "Podmiot odpowiedzialny (GPSR)", type: "textarea" },
            ], { id: "firma" }),
          ],
        },
        {
          label: "Dostawa",
          description: "Tu zmieniasz kwotę darmowej dostawy (to jest to 399 zł na stronie) i ceny kurierów.",
          fields: [
            section("Dostawa", "Kwota darmowej dostawy, godzina wysyłki i kurierzy.", "truck", [
            { name: "freeShippingThreshold", label: "Darmowa dostawa od (zł brutto)", type: "number", defaultValue: 249.99, admin: { description: "Ta kwota jest na czarnym pasku u góry, na etykiecie pod banerem, w koszyku i przy produkcie. Wpisz np. 399 albo 249. Przy kurierze niżej możesz ustawić inną kwotę — puste pole kuriera znaczy: użyj tej." } },
            { type: "row", fields: [
              { name: "sameDayShipping", label: "Wysyłka tego samego dnia", type: "checkbox", defaultValue: true, admin: { width: "40%", description: "Włączone: przy produkcie widać „zamów do godziny — wyślemy dziś”." } },
              { name: "shipCutoff", label: "Zamów do godziny", type: "text", defaultValue: "14:00", admin: { width: "30%", placeholder: "14:00", description: "Dzień roboczy, czas polski. Np. 14:00. Po tej godzinie i w weekend sklep pisze, że wyśle w najbliższy dzień roboczy. Puste = nie pokazuj." } },
            ] },
            {
              name: "shippingMethods",
              label: "Metody dostawy",
              type: "array",
              labels: { singular: "Metoda", plural: "Metody" },
              admin: { initCollapsed: true, components: { RowLabel: "@/payload/components/FormBits#ShippingMethodLabel" } },
              fields: [
                { type: "row", fields: [
                  { name: "code", label: "Kod (wewnętrzny)", type: "text", required: true, admin: { width: "40%", placeholder: "inpost" } },
                  { name: "label", label: "Nazwa dla klienta", type: "text", required: true, admin: { width: "60%" } },
                ] },
                { name: "price", label: "Cena brutto (zł)", type: "number", required: true, min: 0, admin: { step: 0.01, description: "Tyle klient płaci za tę dostawę. 0 oznacza dostawę bezpłatną." } },
                { type: "row", fields: [
                  { name: "baselinkerName", label: "Nazwa w BaseLinkerze (delivery_method)", type: "text", required: true, maxLength: 30, admin: { width: "50%", description: "Maks. 30 znaków. Musi pasować do reguł kurierskich w BaseLinkerze." } },
                  { name: "requiresPoint", label: "Wymaga wyboru punktu (paczkomat)", type: "checkbox", admin: { width: "25%" } },
                  { name: "enabled", label: "Aktywna", type: "checkbox", defaultValue: true, admin: { width: "25%" } },
                ] },
                { type: "row", fields: [
                  { name: "freeAboveThreshold", label: "Może być darmowa", type: "checkbox", defaultValue: true, admin: { width: "30%" } },
                  { name: "freeFrom", label: "Darmowa od (zł)", type: "number", min: 0, admin: { width: "35%", step: 0.01, placeholder: "jak kwota sklepu", description: "Puste = kwota sklepu z góry. Np. InPost od 199, GLS od 399.", condition: (_, row) => row?.freeAboveThreshold !== false } },
                ] },
              ],
            },
            ], { id: "dostawa-ustawienia" }),
          ],
        },
        {
          label: "Płatności",
          fields: [
            section("Płatności", "Metody widoczne przy składaniu zamówienia.", "card", [
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
            ], { id: "platnosci-ustawienia" }),
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
