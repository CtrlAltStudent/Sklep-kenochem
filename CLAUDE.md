# Sklep Sonax – kontekst projektu dla Claude

Własny sklep internetowy **sonax.sklep.pl** (chemia i kosmetyki samochodowe SONAX, dom i ogród, chemia do myjni),
prowadzony przez **KENOCHEM Kuczyński Sp. J.** (Gen. Andersa 40, 15-113 Białystok, NIP 5423224790, tel. +48 500 021 705,
e-mail sklepu: aukcje@sonax.bialystok.pl). Następca obecnego sklepu WooCommerce na sonax.sklep.pl (ok. 590 produktów, 36 kategorii).
Kod to **osobna kopia** sklepu Kenochem (repozytorium Sklep-kenochem) – poprawki wspólne trzeba nanosić w obu projektach.
Produkty: z eksportu CSV BaseLinkera. Wygląd: według wzoru od właściciela (nie kopiować kolorów Kenochem).
Komunikacja z właścicielem projektu: **po polsku**, prosto, bez żargonu.

> Poniżej część opisu pochodzi jeszcze ze sklepu Kenochem (kolory, drzewo kategorii, grafiki, stan projektu) – aktualizować w miarę przebudowy.
> Wdrożenie: `deploy/deploy.sh` wymaga jawnego `DEPLOY_SERVER` i `DEPLOY_DOMAIN` (serwer Sonax, **nie** serwer testowy Kenochem), katalog `/opt/sonax`.

## Architektura
- Kod w `storefront/` – **Next.js 16.4 (Turbopack) + React 19 + Tailwind CSS v4 + Payload CMS 3.91** w jednej aplikacji.
  - `src/app/(frontend)` – sklep, `src/app/(payload)` – panel admina (`/admin`) i API (`/api`).
  - Next 16: `params`/`searchParams` to Promise, globalne typy `PageProps<"/sciezka">`; przed `tsc` czasem `npx next typegen`.
  - Przeczytaj `storefront/AGENTS.md` – ta wersja Next różni się od znanej z treningu (dokumentacja w `node_modules/next/dist/docs/`).
- Baza: **SQLite** (`storefront/sonax.db`, lokalnie i na serwerze testowym). Docelowo PostgreSQL (adapter już w zależnościach,
  `DATABASE_URL=postgres://…` przełącza). Pakiety `payload`/`@payloadcms/*` przypięte do **3.91.0**, `.npmrc`: `legacy-peer-deps=true`.
- Integracje (systemy, które firma już ma): **BaseLinker** (zamówienia, kurierzy, stany – `src/integrations/baselinker`, tryb `BASELINKER_MOCK=1`),
  **Przelewy24** (płatności – jeszcze niepodpięte), **WAPRO** (faktury/KSeF – przez BaseLinkera, sklep nie łączy się bezpośrednio).
- Integracje = moduły: `/admin/integracje` (przegląd, „Dodaj moduł”, włącz/wyłącz) i `/admin/integracje/<id>` (klucze, synchronizacja,
  dziennik) – `src/payload/components/IntegrationsHub.tsx`. Opis modułów w `src/integrations/registry.ts`, stan i zaszyfrowane klucze
  w `integrations.json` obok bazy (`vault.ts`, `.env` jako zapas). Wyłączony moduł: BaseLinker nic nie wysyła (`integrationMode()` = "disabled"),
  InPost/ORLEN/P24 znikają z koszyka i zamówienia (`src/integrations/availability.ts`). Nowy moduł: wpis w `registry.ts` + jego efekt.
- Menu boczne panelu: własne (`src/payload/nav.ts` – działy i pozycje, `components/Nav.tsx` + `NavLinks.tsx`), ikony z
  `scripts/gen-admin-nav-icons.mjs`. Własne ekrany panelu owijać w `components/AdminPage.tsx` (inaczej brak menu).
- Listy: bogate komórki w `components/Cells.tsx` (produkt z miniaturą i kodami, zamówienie z klientem/dostawą/płatnością);
  dodatkowe kolumny zamówień to pola `ui` (bez zmian w bazie). Paski boczne edycji: `FormBits#OrderSidebar`, `#ProductSidebar`.
  Harmonogram synchronizacji: `src/instrumentation.ts` → `src/integrations/scheduler.ts` (lokalnie `INTEGRATIONS_SCHEDULER=1`).
- Katalog w sklepie: `src/lib/catalog.ts` ładuje wszystkie produkty z Payload do pamięci (cache 60 s + licznik wersji
  unieważniany hookami). Typy i drzewo kategorii: `src/lib/data.ts` (bezpieczne dla komponentów klienckich).

## Najważniejsze miejsca w kodzie
- Kategorie 3-poziomowe (dział › podkategoria › typ): drzewo w `src/lib/data.ts` (`categories`, helper `sub()`, `findType`).
  Slug typu = `<podkategoria>-<nazwa>`. Produkty przypisane regułami w `scripts/import-products.mjs` (lista `RULES`, raport `scripts/import-report.txt`).
- Dane startowe (kolejność): `node scripts/fetch-sonax-shop.mjs` (produkty i kategorie z obecnego sklepu) →
  `npm run import:csv -- "<CSV z BaseLinkera>"` (tylko produkty obecne na stronie) → `node scripts/fetch-sonax-content.mjs`
  (regulamin, polityki, blog, przewodniki) → `npm run seed` → `npm run seed:pages`. Stare adresy WordPressa: przekierowania
  w panelu (kategorie, duplikaty, wpisy) + stałe podstrony w `next.config.ts`.
  Liczniki: `counts["dział"]`, `counts["dział/pod"]`, `counts["dział/pod/typ"]`. Filtry: `src/components/Listing.tsx` (`sub`, `typ` w URL, „Zastosuj”).
- Nagłówek i menu w kolumnach: `src/components/Header.tsx`. Strona główna: `src/app/(frontend)/page.tsx` + `src/components/home/*`.
- Koszyk dwuetapowy: `/koszyk` (`components/checkout/CartView.tsx`) → `/zamowienie` (`components/checkout/Checkout.tsx`, wszystko na jednym ekranie).
  Metody dostawy/płatności z panelu (Ustawienia sklepu). Logo przewoźnika po **kodzie metody**: `orlen…`, `inpost-paczkomat…`, `inpost…`, `gls…`,
  pobranie = kod kończący się na `-cod`. Składanie zamówienia jest jeszcze **demonstracyjne** (nie zapisuje do bazy).
- Karta produktu: `src/app/(frontend)/produkt/[slug]/page.tsx` (zakładki w miejscu `ProductTabs`, karta charakterystyki z pola `sds`, piktogramy `public/ghs`).
- Panel: `src/payload.config.ts`, kolekcje `src/payload/collections/*`, komponenty panelu `src/payload/components/*`
  (pasek akcji Ctrl+K, zakładki statusów, sekcje formularzy `section()` z `src/payload/fields.ts`), motyw `src/app/(payload)/custom.scss`.
- Motyw sklepu: `src/app/(frontend)/globals.css` – dwie zielenie z logo: ciemna `brand-700 #2b6e1a` i liściowa `leaf #6cb00c`;
  klasy `.btn-kc` (gradient głównych przycisków), `.bg-kc-gradient`, `.bg-kc-gradient-deep`, `.kc-stripe`. Kontener `max-w-shop` (skaluje się na 2K/4K).
- Obrazy: `public/stock` (zdjęcia Unsplash – kategorie/branże, mapa w `src/lib/photos.ts`), `public/marks` (oficjalne logo GLS, InPost,
  ORLEN Paczka, BLIK, Przelewy24 – nie modyfikować), `public/brand` (grafiki z kenochem.com). Nowe ścieżki obrazów dopisać do
  `images.localPatterns` w `next.config.ts`.

## Polecenia (w `storefront/`)
- `npm run dev` – sklep `http://localhost:3000`, panel `/admin`.
- `npx tsc --noEmit` i `npx eslint src` – przed każdym commitem.
- Skrypty Payload zawsze z wyłączonym „push”: `npx cross-env PAYLOAD_DB_PUSH=0 NODE_OPTIONS=--no-deprecation payload run <plik.ts>`.
- `npx payload generate:importmap` po dodaniu komponentu panelu; `npx payload generate:types` po zmianie pól.
- Wdrożenie na serwer testowy: `bash deploy/deploy.sh` (Git Bash). Szczegóły serwera – w `CLAUDE.local.md` (nie ma go w gicie).

## Zasady i pułapki
- **Zmiany schematu bazy** (nowe pola/kolekcje): lokalnie Payload sam dodaje kolumny (dev „push”), ale **w produkcji push nie działa** –
  serwer testowy by się wysypał. Przed taką zmianą zaplanuj migrację albo synchronizację bazy z serwerem (za zgodą właściciela).
  Sekcje formularzy (`collapsible`, `row`, `ui`) nie zmieniają schematu.
- Budowanie (`next build`) zawsze lokalnie, nie na serwerze (mało RAM). Turbopack zapisuje w `.next/node_modules` dowiązania
  z bezwzględną ścieżką – `deploy/fix-links.mjs` naprawia je w obrazie Dockera.
- **Nie obciążać kenochem.com** (stary sklep) masowymi zapytaniami; zdjęcia z kenochem.com są wyłączone `NEXT_PUBLIC_SKIP_KENOCHEM_IMAGES=1`.
- Nie wymyślać danych udających prawdziwe: opinii, bestsellerów, nazwisk pracowników, logo z niepewnych źródeł.
  Logo/grafiki brać z oficjalnych stron „do pobrania” albo od właściciela.
- Konta testowe w panelu: tworzyć tylko na czas testu skryptem, hasło generować do pliku (nie podawać na czacie) i **usunąć po teście**.
  Nie ruszać konta właściciela.
- Commity: tylko gdy właściciel poprosi; autor = właściciel (git config), **bez** dopisków „Co-Authored-By: Claude”.
- Nie wgrywać danych wrażliwych do gita (`.env.local`, `sonax.db`, `media/`, `deploy/.dostep-*.txt`, klucze SSH) – są w `.gitignore`.

## Stan projektu (październik 2026)
Gotowe: wygląd sklepu (strona główna, kategorie 3-poziomowe z filtrami, karta produktu, koszyk + strona zamówienia, marki, promocje,
bestsellery, nowości, O nas, FAQ, B2B, kontakt, zwroty, regulamin i polityka z CMS), panel admina w stylu Shopera, integracja
BaseLinker w trybie testowym, serwer testowy na VPS (Docker + Caddy, HTTPS).

Do zrobienia przed startem (kolejność uzgodniona):
1. Prawdziwe składanie zamówień (zapis w bazie, ceny liczone na serwerze), **Przelewy24** na żywo, maile transakcyjne (np. Brevo).
2. BaseLinker na żywo + automatyczna synchronizacja stanów/cen; mapa punktów InPost / ORLEN Paczka.
3. PostgreSQL, kopie zapasowe poza serwer, monitoring (UptimeRobot, Sentry), zdjęcia produktów na własnym serwerze,
   przekierowania starych adresów z kenochem.com, instrukcja utrzymania `docs/UTRZYMANIE.md`.
4. Konta klientów (logowanie, historia zamówień), portal B2B (docelowo b2b.kenochem.com).
5. Testy całego procesu na serwerze testowym, potem przełączenie domeny kenochem.com (WooCommerce zostaje 1–2 mies. jako plan B).
