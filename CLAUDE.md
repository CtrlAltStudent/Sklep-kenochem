# Sklep Kenochem – kontekst projektu dla Claude

Własny sklep internetowy firmy **Kenochem** (hurtownia profesjonalnej chemii samochodowej, myjniowej i obiektowej, Białystok),
budowany jako następca obecnego sklepu WooCommerce na **kenochem.com** (hosting Zenbox). Wzorce wyglądu: **agrosimex.pl**
(menu, filtry, karta produktu) i **kenochem.098.pl** (testowy sklep firmy – drzewo kategorii 3-poziomowe).
Komunikacja z właścicielem projektu: **po polsku**, prosto, bez żargonu.

## Architektura
- Kod w `storefront/` – **Next.js 16.4 (Turbopack) + React 19 + Tailwind CSS v4 + Payload CMS 3.91** w jednej aplikacji.
  - `src/app/(frontend)` – sklep, `src/app/(payload)` – panel admina (`/admin`) i API (`/api`).
  - Next 16: `params`/`searchParams` to Promise, globalne typy `PageProps<"/sciezka">`; przed `tsc` czasem `npx next typegen`.
  - Przeczytaj `storefront/AGENTS.md` – ta wersja Next różni się od znanej z treningu (dokumentacja w `node_modules/next/dist/docs/`).
- Baza: **SQLite** (`storefront/kenochem.db`, lokalnie i na serwerze testowym). Docelowo PostgreSQL (adapter już w zależnościach,
  `DATABASE_URL=postgres://…` przełącza). Pakiety `payload`/`@payloadcms/*` przypięte do **3.91.0**, `.npmrc`: `legacy-peer-deps=true`.
- Integracje (systemy, które firma już ma): **BaseLinker** (zamówienia, kurierzy, stany – `src/integrations/baselinker`, tryb `BASELINKER_MOCK=1`),
  **Przelewy24** (płatności – jeszcze niepodpięte), **WAPRO** (faktury/KSeF – przez BaseLinkera, sklep nie łączy się bezpośrednio).
- Katalog w sklepie: `src/lib/catalog.ts` ładuje wszystkie produkty z Payload do pamięci (cache 60 s + licznik wersji
  unieważniany hookami). Typy i drzewo kategorii: `src/lib/data.ts` (bezpieczne dla komponentów klienckich).

## Najważniejsze miejsca w kodzie
- Kategorie 3-poziomowe (dział › podkategoria › typ): drzewo w `src/lib/data.ts` (`categories`, helper `sub()`, `findType`).
  Slug typu = `<podkategoria>-<nazwa>`. Produkty przypisane regułami: `src/scripts/sync-categories.ts` (DRY=1 – podgląd, SHOW=n – próbki bez typu).
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
- Nie wgrywać danych wrażliwych do gita (`.env.local`, `kenochem.db`, `media/`, `deploy/.dostep-*.txt`, klucze SSH) – są w `.gitignore`.

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
