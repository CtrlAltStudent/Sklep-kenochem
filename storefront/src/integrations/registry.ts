// Moduły integracji (Integracje → Moduły): opis, pola na klucze, tryby i instrukcja podłączenia.
// Moduł można dodać do sklepu, włączyć / wyłączyć i usunąć – stan trzyma src/integrations/vault.ts.
// Bez żadnych wartości – plik jest bezpieczny także dla komponentów panelu w przeglądarce.

export type KeyField = {
  key: string; // nazwa w schowku (src/integrations/vault.ts)
  label: string;
  env: string[]; // zapasowo z .env, gdy w panelu pusto
  secret?: boolean; // hasło – w panelu widać tylko końcówkę
  optional?: boolean; // nie blokuje statusu „podłączone”
  hint?: string;
  placeholder?: string;
};

export type ModeOption = { value: string; label: string };

export type ModuleId = "baselinker" | "przelewy24" | "inpost" | "orlen" | "poczta";
export type ModuleCategory = "Sprzedaż i magazyn" | "Płatności" | "Dostawa" | "Komunikacja";

export type Provider = {
  id: ModuleId;
  name: string;
  category: ModuleCategory;
  logo?: string;
  what: string;
  whenOff: string; // co się dzieje po wyłączeniu modułu
  guide: string[]; // kroki podłączenia (proste zdania, HTML niedozwolony)
  where: string; // skąd wziąć klucze
  fields: KeyField[];
  mode?: { key: string; env: (env: NodeJS.ProcessEnv) => string | undefined; options: ModeOption[]; fallback: string };
  testable: boolean;
};

export const providers: Provider[] = [
  {
    id: "baselinker",
    name: "BaseLinker",
    category: "Sprzedaż i magazyn",
    whenOff: "Sklep przestaje wysyłać zamówienia do BaseLinkera i nie pobiera stanów ani statusów. Zamówienia nadal się zapisują w sklepie.",
    guide: [
      "W BaseLinkerze: Moje konto → API → wygeneruj token i wklej go obok. Wybierz „Na żywo” i kliknij „Zapisz i sprawdź”.",
      "W zakładce „Katalog i zamówienia” kliknij „Testuj połączenie i pobierz ID”, wpisz ID katalogu, grupy cen, magazynu i statusu nowych zamówień.",
      "Żeby zamówienia nie wchodziły jako „Admin”: w BaseLinkerze Integracje → Dodaj integrację → Inny sklep (nie ruszaj starego sklepu „Sonax” – to WooCommerce). Wklej hasło komunikacji obok. Adres pliku: /api/baselinker/shop na adresie tego sklepu.",
      "W BaseLinkerze utwórz reguły płatności: „Przelewy24”, „Przelew bankowy”, „Pobranie” oraz reguły kurierskie o nazwach takich jak metody dostawy w Ustawieniach sklepu.",
      "Produkty w BaseLinkerze powinny mieć to samo SKU co w sklepie – wtedy łączą się z magazynem.",
      "Na koniec w zakładce „Synchronizacja” włącz automatyczne stany i statusy zamówień.",
    ],
    what: "Produkty, ceny i stany z magazynu, przekazywanie zamówień, kurierzy i faktury (WAPRO).",
    where: "BaseLinker → Moje konto → API → „Wygeneruj nowy token”.",
    fields: [
      { key: "baselinker.token", label: "Token API", env: ["BASELINKER_TOKEN"], secret: true, placeholder: "np. 3001234-3009876-ABCD…" },
      {
        key: "baselinker.shopPass",
        label: "Hasło komunikacji sklepu (Inny sklep)",
        env: ["BASELINKER_SHOP_PASS"],
        secret: true,
        optional: true,
        hint: "Z BaseLinkera: Integracje → Dodaj integrację → Inny sklep → „Hasło komunikacji”. Po wpisaniu zamówienia wchodzą jako sklep, nie jako Admin.",
        placeholder: "wklej hasło z BaseLinkera",
      },
    ],
    mode: {
      key: "baselinker.mode",
      env: (e) => (e.BASELINKER_MOCK === "1" ? "mock" : undefined),
      fallback: "live",
      options: [
        { value: "live", label: "Na żywo – prawdziwe konto BaseLinker" },
        { value: "mock", label: "Testowy – dane przykładowe, nic nie idzie do BaseLinkera" },
      ],
    },
    testable: true,
  },
  {
    id: "przelewy24",
    name: "Przelewy24",
    category: "Płatności",
    whenOff: "Płatności Przelewy24 (BLIK, przelew online, karta) znikają z zamówienia. Zostają przelew tradycyjny i pobranie.",
    guide: [
      "W panelu Przelewy24: Moje dane → Dane API i konfiguracja. Skopiuj ID sprzedawcy, klucz CRC i klucz API.",
      "Na start wybierz „Sandbox” (klucze z sandbox.przelewy24.pl) i zrób zamówienie testowe.",
      "Adres powrotu i powiadomień sklep ustawia sam – nic nie trzeba wpisywać w Przelewy24.",
      "Gdy wszystko działa, wklej klucze produkcyjne i przełącz na „Na żywo”.",
    ],
    logo: "/marks/przelewy24.svg",
    what: "Płatności online: BLIK, szybki przelew, karta.",
    where: "Panel Przelewy24 → Moje dane → Dane API i konfiguracja (ID sprzedawcy, CRC, klucz do raportów/API).",
    fields: [
      { key: "p24.merchantId", label: "ID sprzedawcy (Merchant ID)", env: ["P24_MERCHANT_ID"], placeholder: "np. 123456" },
      { key: "p24.posId", label: "ID punktu (POS ID)", env: ["P24_POS_ID"], hint: "Zwykle takie samo jak ID sprzedawcy – można zostawić puste.", placeholder: "jak ID sprzedawcy" },
      { key: "p24.crc", label: "Klucz CRC", env: ["P24_CRC"], secret: true },
      { key: "p24.apiKey", label: "Klucz API (do raportów)", env: ["P24_API_KEY"], secret: true },
    ],
    mode: {
      key: "p24.mode",
      env: (e) => (e.P24_MOCK === "1" ? "mock" : e.P24_SANDBOX === "1" ? "sandbox" : undefined),
      fallback: "live",
      options: [
        { value: "live", label: "Na żywo – prawdziwe płatności" },
        { value: "sandbox", label: "Sandbox – testowe płatności Przelewy24" },
        { value: "mock", label: "Bez płatności – zamówienie od razu opłacone (tylko testy)" },
      ],
    },
    testable: true,
  },
  {
    id: "inpost",
    name: "InPost",
    category: "Dostawa",
    whenOff: "Metody dostawy InPost (Paczkomat i Kurier) znikają z koszyka i zamówienia.",
    guide: [
      "Konto kurierskie InPost podłącza się w BaseLinkerze: Integracje → Dodaj integrację → Kurierzy → InPost. Tam powstają etykiety.",
      "Token Geowidget (mapa paczkomatów) wygenerujesz w manager.inpost.pl → Moje konto → API, dla domeny sklepu.",
      "Bez tokena klient wpisuje kod paczkomatu (np. BIA01M) – sklep sprawdza go w InPost.",
      "Nazwy metod dostawy w Ustawieniach sklepu muszą być takie same jak w regułach kurierskich BaseLinkera.",
    ],
    logo: "/marks/inpost-paczkomat.svg",
    what: "Mapa paczkomatów przy zamówieniu. Kod paczkomatu (np. BIA01M) sklep sprawdza także bez tokena.",
    where: "manager.inpost.pl → Moje konto → API → „Token do Geowidgetu” (dla domeny sklepu).",
    fields: [{ key: "inpost.geowidgetToken", label: "Token Geowidget (mapa)", env: ["NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN", "INPOST_GEOWIDGET_TOKEN"], secret: true, optional: true, hint: "Opcjonalnie – tylko do mapy punktów." }],
    testable: true,
  },
  {
    id: "orlen",
    name: "ORLEN Paczka",
    category: "Dostawa",
    whenOff: "Dostawa ORLEN Paczka znika z koszyka i zamówienia.",
    guide: [
      "Konto ORLEN Paczki podłącza się w BaseLinkerze: Integracje → Dodaj integrację → Kurierzy → ORLEN Paczka.",
      "Klucz mapy punktów dostaniesz od opiekuna ORLEN Paczki. Bez niego klient wpisuje kod punktu – ten sam kod idzie do BaseLinkera.",
    ],
    logo: "/marks/orlen-paczka.png",
    what: "Mapa punktów ORLEN Paczka przy zamówieniu. Bez klucza klient wpisuje kod punktu.",
    where: "Od opiekuna ORLEN Paczki (klucz do mapy punktów dla domeny sklepu).",
    fields: [{ key: "orlen.mapKey", label: "Klucz mapy punktów", env: ["NEXT_PUBLIC_ORLEN_MAP_KEY", "ORLEN_MAP_KEY"], secret: true, optional: true, hint: "Opcjonalnie – tylko do mapy punktów." }],
    testable: false,
  },
  {
    id: "poczta",
    name: "Poczta (SMTP)",
    category: "Komunikacja",
    what: "Maile do klientów: potwierdzenie zamówienia, płatności, wysyłki z numerem paczki, anulowania, odpowiedzi na formularze i „produkt znów dostępny”.",
    whenOff: "Sklep nie wysyła żadnych maili – ani do klientów, ani powiadomień do sklepu. Zamówienia nadal się zapisują.",
    where: "Dane skrzynki z panelu hostingu (serwer poczty, login, hasło). Zwykle serwer to nazwa domeny, login to pełny adres e-mail.",
    guide: [
      "Wpisz serwer poczty (np. sonax.bialystok.pl), login (pełny adres skrzynki) i hasło. Wybierz szyfrowanie – najczęściej SSL, port 465.",
      "Adres nadawcy musi być tą samą skrzynką co login – inaczej serwer poczty odrzuci wysyłkę.",
      "„Kopie do sklepu” – na ten adres przychodzą powiadomienia o nowych zamówieniach i wiadomościach z formularzy.",
      "Kliknij „Sprawdź połączenie” – sklep wyśle maila testowego na adres kopii (albo nadawcy).",
      "Żeby maile nie trafiały do spamu, poproś hostingodawcę o włączenie DKIM i rekordu DMARC dla domeny nadawcy.",
    ],
    fields: [
      { key: "mail.host", label: "Serwer poczty (SMTP)", env: ["SMTP_HOST"], placeholder: "np. sonax.bialystok.pl" },
      { key: "mail.port", label: "Port", env: ["SMTP_PORT"], optional: true, hint: "Puste = 465 dla SSL, 587 dla STARTTLS.", placeholder: "465" },
      { key: "mail.user", label: "Login skrzynki", env: ["SMTP_USER"], placeholder: "aukcje@sonax.bialystok.pl" },
      { key: "mail.password", label: "Hasło skrzynki", env: ["SMTP_PASSWORD"], secret: true },
      { key: "mail.from", label: "Adres nadawcy", env: ["MAIL_FROM"], optional: true, hint: "Puste = login skrzynki.", placeholder: "aukcje@sonax.bialystok.pl" },
      { key: "mail.fromName", label: "Nazwa nadawcy", env: ["MAIL_FROM_NAME"], optional: true, placeholder: "Sklep SONAX" },
      { key: "mail.notify", label: "Kopie do sklepu (nowe zamówienia, wiadomości)", env: ["MAIL_NOTIFY"], optional: true, hint: "Puste = adres nadawcy. Kilka adresów oddziel przecinkiem." },
      { key: "mail.bank", label: "Dane do przelewu tradycyjnego (w mailu)", env: ["MAIL_BANK"], optional: true, placeholder: "mBank 00 0000 0000 0000 0000 0000 0000, KENOCHEM Kuczyński Sp. J.", hint: "Pokazywane w potwierdzeniu, gdy klient wybrał przelew tradycyjny." },
    ],
    mode: {
      key: "mail.security",
      env: (e) => (e.SMTP_SECURE === "0" ? "starttls" : undefined),
      fallback: "ssl",
      options: [
        { value: "ssl", label: "SSL/TLS (zwykle port 465)" },
        { value: "starttls", label: "STARTTLS (zwykle port 587)" },
      ],
    },
    testable: true,
  },
];

export const moduleById = (id: string) => providers.find((p) => p.id === id);

// Moduły w przygotowaniu – widoczne w katalogu, jeszcze nie do dodania
export const upcoming: { name: string; category: ModuleCategory; what: string }[] = [
  { name: "GLS – mapa punktów", category: "Dostawa", what: "Odbiór w punktach GLS ParcelShop z wyborem na mapie." },
];

// Stan modułu w sklepie
export type ModuleState = { installed: boolean; enabled: boolean };

// Ustawienia automatycznej synchronizacji (bez haseł)
export type AutoSettings = {
  stock: boolean; // stany i ceny z BaseLinkera
  stockEveryMin: number;
  products: boolean; // pełne dane produktów raz na dobę
  productsHour: number;
  orders: boolean; // ponawianie wysyłki zamówień, które nie doszły
  statuses: boolean; // statusy zamówień i numery przesyłek z BaseLinkera
  statusesEveryMin: number;
  shippedStatusIds: number[]; // statusy BaseLinkera = „wysłane”
  cancelledStatusIds: number[]; // statusy BaseLinkera = „anulowane”
};

export const defaultAuto: AutoSettings = {
  stock: false,
  stockEveryMin: 15,
  products: false,
  productsHour: 3,
  orders: false,
  statuses: false,
  statusesEveryMin: 15,
  shippedStatusIds: [],
  cancelledStatusIds: [],
};

export type JobId = "stock" | "products" | "orders" | "statuses";
export type JobRun = { at: string; ok: boolean; message: string };
