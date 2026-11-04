# Przekazanie pracy – sklep Sonax (stan na 23.10.2026)

Plik do wklejenia/wskazania w nowej rozmowie. Ogólny opis projektu: `CLAUDE.md`, serwer: `CLAUDE.local.md`.

## Stan
- Ostatni commit: `2aaf604`. **Wszystko później jest NIEzacommitowane** (dużo plików) – właściciel decyduje, kiedy commit (autor: Kamil, bez dopisków Claude).
- Serwer testowy https://sonax.185-193-114-233.sslip.io ma najnowszą wersję (wgrane 23.10 ok. 11:30, z konfiguratorem maili, koszykami i RODO). Baza na serwerze ma kolumny SEO i tabelę `carts` (migracje z `deploy/migrations` zastosowane; kopia przed migracją: `/opt/sonax/backups/sonax-przed-koszykami-20261023-1120.db`).

## Co powstało od ostatniego commita (najważniejsze)
- **Zamówienia:** numeracja SX00001; historia zamówienia (`src/integrations/history.ts`, logi typu „history”); szybkie akcje w prawym panelu (`SidebarActions.tsx`); eksport CSV (`/api/export/orders|products|customers`); zakładki statusów przeładowują listę (`AdminClient.tsx#TabsBar`), listy 50/stronę.
- **BaseLinker „Inny sklep”:** BL sam pobiera zamówienia (`shopProtocol.ts`); „tylko opłacone” obejmuje też pobranie/odbiór; pobrane zamówienie → syncStatus „sent” + wpis w historii; ostatnie pobranie w `vault.runs.pull` (widać w Integracje → BaseLinker).
- **Podgląd zamiast edycji** (`RecordView.tsx` + CSS `html[data-kc-view="record"]`): wiadomości (odpowiedź mailem `/api/message-tools/:id/reply`, produkt z „Zapytaj o produkt”), opinie, zwroty, klienci. Zamówienia/produkty – `Overview.tsx`.
- **Maile:** nowe szablony z miniaturami i paskiem postępu (`src/integrations/mail/templates.ts`, `events.ts`); maile zwrotów; odpowiedź na wiadomość.
- **Produkt:** brak na stanie = szary, nie do kupienia (`store.ts`, `ProductCard/Row/Buy`); zakładka „SEO i Google” (`SeoPanel.tsx`, pola `seoExtra.*`, `merchant.*`); karta produktu używa SEO z panelu; JSON-LD z dostawą i zwrotami.
- **Treści:** menu „Treści i wygląd” = Układ strony / Podstrony / Blog / Media. **Układ strony** `/admin/uklad` (`LayoutEditor.tsx`, `src/lib/layoutSections.ts`) – kolejność/widoczność sekcji: strona główna, karta produktu (+ zakładki), kategoria; zapis w vault (`getLayout`). Banery/atuty/baner promo z globalu „homepage”. Bloki podstron (`PageBlocks.tsx`), schematy podstron nad listą podstron (`ContentTemplates.tsx`).
- **Ustawienia** `/admin/ustawienia` (`SettingsHub.tsx`, `SiteSettingsPanel.tsx`): indeksowanie (auto/on/off), roboty AI, robots extra, llms.txt, plik Google, **przerwa techniczna** (`src/proxy.ts`, 503), „Odśwież sklep”. Zapis w vault `site` (`siteSettings.ts`).
- **Instrukcja panelu** `/admin/pomoc` (`src/payload/help.ts`) – aktualizować przy nowych funkcjach.
- **Google/marketing:** moduł „Google i marketing” (GTM, GA4, Ads, Search Console, Bing, Meta Pixel, Clarity) – `src/integrations/marketing.ts`; Consent Mode v2 (`src/lib/tagsBootstrap.ts`, `CookieConsent.tsx`); zdarzenia e-commerce GA4 (`src/lib/track.ts`, purchase z serwera w `placeOrder.ts`).
- **SEO techniczne:** `sitemap.ts` (kategorie z podkategoriami, zdjęcia, prawdziwe daty), `robots.ts` (dynamiczny), `/llms.txt`, `/llms-full.txt` (`src/lib/llms.ts`), `/feed/google.xml` (Merchant Center), `src/lib/site.ts` (siteIndexable).
- **Raporty** `/admin/raporty` – okresy, porównanie, wykres, tabele.

## Dodane 23.10 po południu (też niezacommitowane)
- **Konfigurator maili** `/admin/maile` (menu Marketing → Maile do klientów; `MailStudio.tsx`, `MailView.tsx`). Lista maili i treści domyślne: `src/integrations/mail/catalog.ts` (bez importów serwerowych – używa go też edytor). Składanie maila: `templates.ts#render` (zmienne `{{x}}`, warunki `{{#x}}…{{/x}}` / `{{^x}}…{{/x}}`, ramka `DEFAULT_FRAME`). Ustawienia w vault, sekcja `mail` (`getMailSettings`), puste pole = domyślne. Endpointy: `src/integrations/mail/studio.ts` (`/api/mail-studio`, `/preview`, `/test`). Mail wyłączony → `Built.skip` → `sendMail` go pomija (chyba że `force`). Wersja tekstowa liczona z HTML (`htmlToText`). Nowy mail = wpis w `MAILS` + funkcja w `templates.ts` + przykład w `studio.ts#sample`.
- **Prośba o opinię i porzucony koszyk** – `src/integrations/mail/automations.ts`, uruchamiane z `scheduler.ts` co 15 min (także bez BaseLinkera). Opinia: X dni po wpisie historii „→ Wysłane”, okno 14 dni, wysłane id w vault `mailState.reviews`. Domyślnie oba **wyłączone** – właściciel włącza w konfiguratorze.
- **Porzucone koszyki:** kolekcja `carts` (`Carts.ts`, menu Sprzedaż), `src/integrations/carts.ts`, `/api/cart` (zapis/usunięcie, przywrócenie `?token=`, rezygnacja `&wypisz=1`). Zgoda = checkbox w `/zamowienie` (widoczny tylko, gdy mail włączony); przeglądarka wysyła koszyk po każdej zmianie (`store.ts` – `setRemind`, `useRemind`, `restore`). Link z maila: `/koszyk?przywroc=<token>` (`CartView.tsx`). Po zamówieniu `placeOrder` → `markCartsOrdered`.
- **RODO w koncie:** zakładka „Prywatność” (`Account.tsx#Privacy`), `/api/account/export` (JSON, `?format=csv`), `/api/account/delete` (hasło + potwierdzenie). Logika: `src/integrations/privacy.ts` – anonimizacja zamówień/zwrotów/opinii, kasowanie newslettera, powiadomień, wiadomości, koszyków, maskowanie adresu w dzienniku, mail „Konto usunięte”.
- Instrukcja panelu (`help.ts`): rozdziały „Maile do klientów” i „RODO”.
- Test 23.10 lokalnie: wszystkie 17 maili w podglądzie, zapis/przywracanie, koszyk (zgoda, zapis, przywrócenie, rezygnacja), eksport i usunięcie konta z anonimizacją zamówienia. **Nie testowano prawdziwej wysyłki** (lokalnie poczta nieskonfigurowana) – sprawdzić „Wyślij test” na serwerze.

## Dodane 23.10 wieczorem (niezacommitowane, wgrane na serwer testowy 23.10)
- „Maile do klientów” przeniesione do menu Marketing.
- Pasek zakładek ustawień (`SettingsTabs`) został COFNIĘTY na prośbę właściciela (mieszał integracje, pracowników i przekierowania z ustawieniami, dublował kafelki). Menu: „Ustawienia sklepu” (przegląd + global), „Pracownicy”, „Przekierowania” osobno; na przeglądzie tylko kafelek danych sklepu, bez linków do innych działów.
- Nowy regulamin i polityka prywatności: treść w `src/integrations/legalTexts.ts`, endpoint `/api/content-tools/legal-drafts` zapisuje je jako SZKICE stron (opublikowana wersja bez zmian); przycisk w Ustawieniach (`LegalDrafts.tsx`). Regulamin z datą obowiązywania 1.11.2026. Polityka obiecuje usuwanie zapisanych koszyków po 30 dniach – zrobione w `automations.ts#purgeOldCarts`.
- Po 25.10: nowy wygląd panelu (zamiast kolorowych banerów z gradientem `kc-hero` – spokojne nagłówki), potem warianty produktów.

## Dodane 23.10 – integracje i zamówienia (niezacommitowane)
- **Integracje w stylu BaseLinkera** (`IntegrationsHub.tsx#ModulesOverview`, CSS `.kc-int`): zakładki „Moje integracje” (lista: logo, opis, stan, przełącznik, Ustawienia) i „Dodaj integrację” (katalog kafelków), po lewej wyszukiwarka i kategorie z licznikami. Strona modułu bez zmian.
- **Akcje na wielu zamówieniach** (`OrderBulkBar.tsx`, `src/integrations/orderBulk.ts`): po zaznaczeniu zamówień pasek – zmiana statusu (hooki jak przy ręcznej zmianie: maile, historia, BaseLinker), druk wielu (`/api/order-bulk/print?ids=`), Excel (`/api/export/orders?ids=`), mail: ponowne potwierdzenie / prośba o opinię / własna wiadomość (nowy szablon `order-message`, zablokowany).
- **Wyszukiwanie zamówień po wszystkim:** `searchOrders` (`/api/order-bulk/search`) – numer, e-mail, telefon, nazwisko, firma, NIP, punkt, miasto, ID BaseLinkera, numer przesyłki (z historii). Używa go Ctrl+K; lista ma rozszerzone `listSearchableFields`.

## PLAN po 25.10 – przebudowa ustawień i integracji (uzgodnione z właścicielem)
Zasada: **każda rzecz ma jedno miejsce** – bez kafelków + zakładek prowadzących w to samo miejsce, bez linków do innych działów menu.
1. **Ustawienia sklepu** (wzór: Shoper „Konfiguracja”, IdoSell, WooCommerce → Ustawienia): jeden ekran z pionowym podmenu po lewej i formularzem po prawej. Sekcje tylko o sklepie: Dane sklepu i kontakt (nazwa, firma, adres, godziny, GPSR) · Dostawa · Płatności · Zamówienia (np. numeracja, dane do przelewu – dziś w Poczcie) · Teksty prawne · Widoczność i SEO (indeksowanie, AI, llms, Merchant) · Przerwa techniczna i narzędzia. Formularz globalu store-settings podzielić na te sekcje (bez zakładek Payload) albo własne formularze na vault/global. NIE ma tu integracji, maili, pracowników, przekierowań, wyglądu.
2. **Pracownicy** i **Przekierowania** – osobne pozycje menu (np. dział „Administracja” / przekierowania przy SEO). **Maile** tylko w Marketingu.
3. ~~**Integracje** – przebudowa przeglądu zrobiona 23.10~~; zostało: strona pojedynczej integracji (zakładka Dziennik dla każdej) –: u góry „Moje integracje” i „Dodaj integrację”; katalog z kategoriami po lewej (Płatności, Kurierzy, Sprzedaż i magazyn, Poczta, Marketing i analityka), wyszukiwarka, kafelki z logo, opisem i stanem (aktywna / wyłączona / błąd / niekonfigurowana); strona integracji: nagłówek z logo, przełącznik, zakładki „Konfiguracja”, „Synchronizacja” (jeśli jest), „Dziennik”, przycisk „Usuń integrację”. Kod: `IntegrationsHub.tsx`, `registry.ts` (dodać kategorię, logo, opis).
4. Razem z tym nowy, spokojny styl nagłówków stron panelu (koniec gradientów `kc-hero`).

## Decyzje właściciela
- Bez panelu B2B (ukryty w klientach). Bez automatycznego anulowania nieopłaconych zamówień.
- Faktury robi WAPRO – sklep tylko przekazuje do BaseLinkera, że klient chce fakturę (+ dane firmy).

## DO ZROBIENIA – kolejność ustalona
Punkty 1–4 zrobione i wgrane 23.10 (opis wyżej) – zostaje test prawdziwej wysyłki („Wyślij test” w Maile do klientów).
1. ~~**Konfigurator maili w panelu:** lista wszystkich maili do klientów, edycja treści (tytuł, tekst, kolory/logo) i pełnego kodu HTML, **podgląd na żywo** na przykładowym zamówieniu, wysyłka testowa. Zapis bez zmian w bazie (vault) albo z migracją. Dziś szablony są w kodzie (`templates.ts`) – konfigurator ma je nadpisywać, domyślne zostają jako zapas.~~
2. ~~**Mail z prośbą o opinię** (np. X dni po statusie „Wysłane”, link do opinii produktu) – ustawiany w konfiguratorze (włącz/wyłącz, po ilu dniach). Harmonogram: `src/integrations/scheduler.ts`.~~
3. ~~**Porzucone koszyki:** zapis koszyka zalogowanego klienta / klienta, który podał e-mail w zamówieniu; przypomnienie po X godzinach (zgoda, link do koszyka), w konfiguratorze.~~
4. ~~**RODO dla klienta:** w koncie „Pobierz moje dane” (JSON/CSV) i „Usuń konto” (anonimizacja zamówień, usunięcie konta, mail potwierdzający). `src/integrations/account.ts`, `src/components/account/Account.tsx`.~~
5. **Wielowariantowość** (po odnowieniu limitu 25.10): jedna karta produktu z wariantami (np. 500 ml / 1 L / 5 L), małe narzędzie w panelu do łączenia produktów w warianty. Typ `Variant` już istnieje w `src/lib/data.ts` (dziś zawsze 1 wariant). Zmiana bazy → migracja.

Przed przenosinami domeny (osobno): zdjęcia produktów na nasz serwer (1051 zdjęć wskazuje na stary `www.sonax.sklep.pl/wp-content` – po przepięciu domeny znikną!), pełny test na żywo, sprawdzenie przekierowań starych adresów (122 w panelu), teksty prawne, InPost token dla nowej domeny, adres „Inny sklep” w BaseLinkerze, Search Console/Merchant.

## Pułapki techniczne (ważne)
- **Zmiany bazy:** push wyłączony (`PAYLOAD_DB_PUSH=0`). Sposób: skopiuj `sonax.db`, uruchom Payload na kopii z `PAYLOAD_DB_PUSH=1 DATABASE_URL=file:<kopia>`, porównaj kolumny (PRAGMA table_info), zapisz `ALTER TABLE` w `deploy/migrations/*.sql`, zastosuj lokalnie; na serwerze **za zgodą właściciela**: kopia `sqlite3 … ".backup …"`, potem plik SQL, potem deploy. Przykład: `deploy/migrations/2026-10-23-produkt-seo-google.sql`. Push na Windows przebudowuje też inne tabele (kodowanie) – dlatego porównujemy tylko kolumny.
- **Ustawienia bez bazy:** `integrations.json` (vault) – sekcje `values/secrets/modules/auto/runs/site/layout`. Dobry sposób na nowe ustawienia bez migracji.
- **Edycja plików:** skrypty `python - <<'PYEOF'` w tym środowisku psują `\n`, `\r`, `\s` w wstawianym tekście (zamieniają na prawdziwe znaki). Teksty z ukośnikami wstawiać narzędziem Edit/Write albo przez `chr(92)`.
- **Import w konfiguracji Payload:** pliki ładowane przez `payload.config.ts` (endpointy w `adminTools.ts` itd.) nie mogą importować `src/lib/catalog.ts` (server-only) – `generate:importmap` się wywali.
- Po nowym komponencie panelu: `npx payload generate:importmap`; po polach: `npx payload generate:types`. Ikony menu: `node scripts/gen-admin-nav-icons.mjs` (mapa w skrypcie).
- **Test w przeglądarce:** konto admina tylko tymczasowo – skrypt `src/scripts/_tmp-test-user.ts` (tworzy, zapisuje token do pliku w scratchpad), potem usunąć konto i skrypt. Panel rysuje pola dopiero, gdy są widoczne – w ukrytym podglądzie grupy pól wyglądają na puste.
- **Wdrożenie** (z `storefront/`, w tle): `DEPLOY_SERVER=root@185.193.114.233 DEPLOY_DOMAIN=sonax.185-193-114-233.sslip.io bash deploy/deploy.sh`, potem sprawdzić `docker exec sonax-app node -e fetch…` (strona za hasłem). Zawsze pytać właściciela przed wgraniem.
- Sprawdzenie przed końcem: `npx tsc --noEmit`, `npx eslint src` (1 stare ostrzeżenie w `placeOrder.ts` – `total` nieużywane).
