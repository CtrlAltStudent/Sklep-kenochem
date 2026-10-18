import type { CollectionConfig } from "payload";
import { anyone, isAdmin, isEditor, isOrdersTeam, hasRole } from "../access";
import { section } from "../fields";

const C = "@/payload/components/Cells#";

// Kody rabatowe – sprawdzane w koszyku przez /api/coupon
export const Coupons: CollectionConfig = {
  slug: "coupons",
  labels: { singular: "Kod rabatowy", plural: "Kody rabatowe" },
  admin: {
    group: "Marketing",
    useAsTitle: "code",
    defaultColumns: ["code", "type", "value", "validTo", "usedCount", "active"],
    description: "Kody, które klient wpisuje w koszyku. Liczba użyć zwiększa się przy złożeniu zamówienia.",
  },
  access: { read: isOrdersTeam, create: isEditor, update: isEditor, delete: isEditor },
  hooks: { beforeValidate: [({ data }) => (data?.code ? { ...data, code: String(data.code).trim().toUpperCase().replace(/\s+/g, "") } : data)] },
  fields: [
    section("Kod rabatowy", "Kod, który klient wpisze w koszyku. Wielkość liter nie ma znaczenia.", "tag", [
    { type: "row", fields: [
      { name: "code", label: "Kod", type: "text", required: true, unique: true, index: true, admin: { width: "40%", placeholder: "np. WIOSNA10", components: { Cell: `${C}CodeCell` } } },
      { name: "active", label: "Aktywny", type: "checkbox", defaultValue: true, admin: { width: "20%", components: { Cell: `${C}ActiveCell` } } },
      { name: "b2bOnly", label: "Tylko konta B2B", type: "checkbox", admin: { width: "40%" } },
    ] },
    { name: "description", label: "Opis wewnętrzny", type: "text", admin: { placeholder: "np. kampania newsletter marzec", description: "Widoczny tylko w panelu – żeby pamiętać, po co jest ten kod." } },
    ]),
    section("Wartość rabatu", "Procent od produktów, stała kwota albo darmowa dostawa.", "percent", [
    { type: "row", fields: [
      { name: "type", label: "Rodzaj rabatu", type: "select", required: true, defaultValue: "percent", admin: { width: "50%" }, options: [
        { label: "Procent od produktów", value: "percent" }, { label: "Kwota (zł)", value: "amount" }, { label: "Darmowa dostawa", value: "free_shipping" },
      ] },
      { name: "value", label: "Wartość (% lub zł)", type: "number", min: 0, admin: { width: "50%", placeholder: "np. 10", condition: (d) => d?.type !== "free_shipping" } },
    ] },
    ]),
    section("Warunki i ważność", "Kiedy i na jakich zasadach kod działa. Puste pola = bez ograniczeń.", "calendar", [
    { type: "row", fields: [
      { name: "minOrder", label: "Minimalna wartość koszyka (zł)", type: "number", min: 0, admin: { width: "50%" } },
      { name: "usageLimit", label: "Limit użyć (puste = bez limitu)", type: "number", min: 1, admin: { width: "50%" } },
    ] },
    { type: "row", fields: [
      { name: "validFrom", label: "Ważny od", type: "date", admin: { width: "50%", date: { pickerAppearance: "dayAndTime" } } },
      { name: "validTo", label: "Ważny do", type: "date", admin: { width: "50%", date: { pickerAppearance: "dayAndTime" } } },
    ] },
    { name: "categories", label: "Tylko produkty z kategorii (puste = wszystkie)", type: "relationship", relationTo: "categories", hasMany: true },
    ]),
    { name: "usedCount", label: "Wykorzystano", type: "number", defaultValue: 0, admin: { readOnly: true, position: "sidebar" } },
  ],
};

// Opinie klientów o produktach – trafiają do moderacji
export const Reviews: CollectionConfig = {
  slug: "reviews",
  labels: { singular: "Opinia", plural: "Opinie o produktach" },
  admin: { group: "Marketing", useAsTitle: "title", defaultColumns: ["title", "product", "rating", "author", "status", "createdAt"], components: { beforeListTable: ["@/payload/components/StatusTabs#ReviewTabs"] } },
  access: {
    read: ({ req }) => (req.user?.collection === "users" ? true : { status: { equals: "approved" } }),
    create: () => false,
    update: ({ req }) => hasRole(req, "editor", "orders"),
    delete: ({ req }) => hasRole(req, "editor", "orders"),
  },
  defaultSort: "-createdAt",
  fields: [
    section("Opinia klienta", "Treść wystawiona przez klienta – sprawdź ją przed publikacją.", "star", [
    { name: "product", label: "Produkt", type: "relationship", relationTo: "products", required: true, index: true },
    { type: "row", fields: [
      { name: "rating", label: "Ocena", type: "number", min: 1, max: 5, required: true, admin: { width: "25%", components: { Cell: `${C}RatingCell` } } },
      { name: "author", label: "Podpis", type: "text", required: true, admin: { width: "35%" } },
      { name: "email", label: "E-mail (niepubliczny)", type: "email", admin: { width: "40%" } },
    ] },
    { name: "title", label: "Tytuł", type: "text", required: true },
    { name: "content", label: "Treść", type: "textarea", required: true },
    ]),
    section("Odpowiedź sklepu", "Pojawi się publicznie pod opinią. Odpowiadaj uprzejmie i konkretnie.", "message", [
      { name: "reply", label: "Odpowiedź (publiczna)", type: "textarea", admin: { placeholder: "Dziękujemy za opinię! …" } },
    ]),
    { name: "status", label: "Status", type: "select", defaultValue: "pending", index: true, admin: { position: "sidebar", components: { Cell: `${C}ReviewStatusCell` } }, options: [
      { label: "Do moderacji", value: "pending" }, { label: "Opublikowana", value: "approved" }, { label: "Odrzucona", value: "rejected" },
    ] },
    { name: "verified", label: "Potwierdzony zakup", type: "checkbox", admin: { position: "sidebar" } },
  ],
};

export const Newsletter: CollectionConfig = {
  slug: "newsletter",
  labels: { singular: "Subskrybent", plural: "Newsletter" },
  admin: { group: "Marketing", useAsTitle: "email", defaultColumns: ["email", "status", "source", "createdAt"], description: "Adresy zapisane przez formularz w stopce sklepu (z datą zgody – RODO)." },
  access: { read: isEditor, create: () => false, update: isEditor, delete: isEditor },
  fields: [
    { name: "email", label: "E-mail", type: "email", required: true, unique: true, index: true },
    { type: "row", fields: [
      { name: "status", label: "Status", type: "select", defaultValue: "subscribed", admin: { width: "50%", components: { Cell: `${C}NewsletterStatusCell` } }, options: [
        { label: "Zapisany", value: "subscribed" }, { label: "Wypisany", value: "unsubscribed" },
      ] },
      { name: "source", label: "Źródło", type: "text", defaultValue: "stopka", admin: { width: "50%" } },
    ] },
    { name: "consentAt", label: "Data zgody", type: "date", admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
  ],
};

// Zwroty i reklamacje zgłoszone przez formularz /zwroty-i-reklamacje
export const Returns: CollectionConfig = {
  slug: "returns",
  labels: { singular: "Zwrot / reklamacja", plural: "Zwroty i reklamacje" },
  admin: { group: "Sprzedaż", useAsTitle: "number", defaultColumns: ["number", "type", "orderNumber", "name", "status", "createdAt"], components: { beforeListTable: ["@/payload/components/StatusTabs#ReturnTabs"] } },
  access: { read: isOrdersTeam, create: () => false, update: isOrdersTeam, delete: isAdmin },
  defaultSort: "-createdAt",
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === "create" && !data.number) {
          const prefix = `${data.type === "complaint" ? "RK" : "ZW"}/${new Date().getFullYear()}/`;
          const last = await req.payload.find({ collection: "returns", req, limit: 1, depth: 0, sort: "-number", overrideAccess: true, where: { number: { like: prefix } }, select: { number: true } });
          data.number = `${prefix}${String(Number(last.docs[0]?.number?.slice(prefix.length) ?? 0) + 1).padStart(4, "0")}`;
        }
        return data;
      },
    ],
  },
  fields: [
    { name: "number", label: "Numer zgłoszenia", type: "text", unique: true, admin: { readOnly: true, position: "sidebar" } },
    { name: "status", label: "Status", type: "select", defaultValue: "new", index: true, admin: { position: "sidebar", components: { Cell: `${C}ReturnStatusCell` } }, options: [
      { label: "Nowe", value: "new" }, { label: "Zaakceptowane – czekamy na paczkę", value: "accepted" }, { label: "Towar otrzymany", value: "received" },
      { label: "Zwrot pieniędzy wykonany", value: "refunded" }, { label: "Odrzucone", value: "rejected" }, { label: "Zamknięte", value: "closed" },
    ] },
    section("Zgłoszenie", "Rodzaj zgłoszenia i zamówienie, którego dotyczy.", "invoice", [
    { type: "row", fields: [
      { name: "type", label: "Rodzaj", type: "select", required: true, admin: { width: "50%", components: { Cell: `${C}ReturnTypeCell` } }, options: [
        { label: "Zwrot (odstąpienie od umowy)", value: "return" }, { label: "Reklamacja", value: "complaint" },
      ] },
      { name: "orderNumber", label: "Numer zamówienia", type: "text", required: true, admin: { width: "50%" } },
    ] },
    { name: "order", label: "Powiązane zamówienie", type: "relationship", relationTo: "orders" },
    ]),
    section("Klient", "Dane kontaktowe osoby zgłaszającej.", "user", [
    { type: "row", fields: [
      { name: "name", label: "Imię i nazwisko", type: "text", required: true, admin: { width: "35%" } },
      { name: "email", label: "E-mail", type: "email", required: true, admin: { width: "35%" } },
      { name: "phone", label: "Telefon", type: "text", admin: { width: "30%" } },
    ] },
    ]),
    section("Produkty i powód", "Co klient odsyła i dlaczego, oraz czego oczekuje.", "package", [
    { name: "products", label: "Produkty i ilości", type: "textarea", required: true },
    { name: "reason", label: "Powód / opis wady", type: "textarea" },
    { type: "row", fields: [
      { name: "resolution", label: "Oczekiwane rozwiązanie", type: "select", admin: { width: "50%" }, options: [
        { label: "Zwrot pieniędzy", value: "refund" }, { label: "Wymiana na nowy", value: "exchange" }, { label: "Naprawa", value: "repair" }, { label: "Obniżenie ceny", value: "discount" },
      ] },
      { name: "bankAccount", label: "Numer konta do zwrotu", type: "text", admin: { width: "50%" } },
    ] },
    ]),
    section("Notatka wewnętrzna", "Widoczna tylko dla pracowników.", "message", [
      { name: "internalNote", label: "Notatka", type: "textarea", admin: { placeholder: "np. paczka dotarła uszkodzona, zdjęcia w mailu" } },
    ]),
  ],
};

// Przekierowania 301 – stare adresy z kenochem.com (WooCommerce) na nowe
export const Redirects: CollectionConfig = {
  slug: "redirects",
  labels: { singular: "Przekierowanie", plural: "Przekierowania (SEO)" },
  admin: { group: "Ustawienia", useAsTitle: "from", defaultColumns: ["from", "to", "permanent", "active"], description: "Gdy ktoś wejdzie na stary adres (np. z Google), zostanie przeniesiony na nowy." },
  access: { read: anyone, create: isEditor, update: isEditor, delete: isEditor },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data?.from) return data;
        let from = String(data.from).trim().replace(/^https?:\/\/[^/]+/i, "");
        if (!from.startsWith("/")) from = `/${from}`;
        return { ...data, from: from.length > 1 ? from.replace(/\/+$/, "") : from };
      },
    ],
  },
  fields: [
    { type: "row", fields: [
      { name: "from", label: "Stary adres", type: "text", required: true, unique: true, index: true, admin: { width: "50%", placeholder: "/sklep/stara-kategoria" } },
      { name: "to", label: "Nowy adres", type: "text", required: true, admin: { width: "50%", placeholder: "/kategoria/chemia-samochodowa" } },
    ] },
    { type: "row", fields: [
      { name: "permanent", label: "Stałe (301)", type: "checkbox", defaultValue: true, admin: { width: "50%" } },
      { name: "active", label: "Aktywne", type: "checkbox", defaultValue: true, admin: { width: "50%" } },
    ] },
  ],
};

// „Powiadom mnie, gdy produkt będzie dostępny” – zapis z karty produktu
export const StockAlerts: CollectionConfig = {
  slug: "stock-alerts",
  labels: { singular: "Powiadomienie o dostępności", plural: "Powiadomienia o dostępności" },
  admin: {
    group: "Sprzedaż",
    useAsTitle: "email",
    defaultColumns: ["email", "product", "status", "createdAt"],
    description: "Klienci czekający na produkty bez stanu. Gdy produkt wróci na magazyn, status zmienia się na „Do powiadomienia”.",
  },
  access: { read: isOrdersTeam, create: () => false, update: isOrdersTeam, delete: isOrdersTeam },
  defaultSort: "-createdAt",
  fields: [
    { name: "product", label: "Produkt", type: "relationship", relationTo: "products", required: true, index: true },
    { name: "email", label: "E-mail", type: "email", required: true },
    { name: "status", label: "Status", type: "select", defaultValue: "waiting", index: true, admin: { components: { Cell: `${C}AlertStatusCell` } }, options: [
      { label: "Czeka na dostawę", value: "waiting" }, { label: "Do powiadomienia (produkt wrócił)", value: "ready" }, { label: "Powiadomiono", value: "notified" },
    ] },
  ],
};
