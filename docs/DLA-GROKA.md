# Sklep Sonax – pełny stan dla Groka (4.11.2026)

Dotyczy **wyłącznie żywego sklepu https://sonax.sklep.pl** (serwer `185.193.112.21`). Sprawdzone z zewnątrz, zwykłymi zapytaniami (bez logowania i bez wejścia na serwer), chyba że napisano inaczej.

Powiązane pliki:
- `CLAUDE.md` – architektura i zasady. Część rzeczy nieaktualna (np. „składanie zamówień demonstracyjne”, pozostałości po Kenochem).
- `CLAUDE.local.md` – adresy serwerów i wdrożenie. Hasła tylko w plikach podanych tam; nie przepisywać ich nigdzie.
- `docs/PRZEKAZANIE.md` – opis mechanizmów z 23.10 (częściowo nieaktualny stan, pułapki techniczne nadal ważne).
- `docs/produkty-do-poprawy.csv` – 228 produktów z brakami.
- `docs/stare-adresy-404.csv` – 908 starych adresów z propozycjami celów.

## 1. Podział pracy (decyzja właściciela)
- **Grok:** cała reszta sklepu.
- **Claude:** dane produktów i przekierowania.
- **Grok nie zmienia danych produktów.** Claude nie zmienia pozostałych części bez uzgodnienia.

Pracujemy na tym samym folderze (`storefront/`), a wdrożenie wysyła cały folder, razem z niezapisanymi zmianami drugiej strony. Serwer dev na porcie 3000 działa z tego folderu – nie zatrzymywać go bez uzgodnienia. Przed wdrożeniem sprawdzić `git status` i uzgodnić je z właścicielem.

## 2. Stałe decyzje właściciela
- Bez panelu B2B.
- Bez automatycznego anulowania nieopłaconych zamówień.
- Faktury robi WAPRO. Sklep tylko przekazuje do BaseLinkera, że klient chce fakturę, wraz z danymi firmy.
- Komunikacja z właścicielem po polsku, prosto, bez żargonu.
- Commit tylko na prośbę właściciela (autor: właściciel, bez dopisków o AI).
- Nie wymyślać danych udających prawdziwe (opinie, EAN, logo, nazwiska).
- Konta testowe tylko na czas testu, potem usunąć. Nie ruszać konta właściciela.

## 3. Zmiany czekające na wgranie (lokalnie, NIE na żywo)
**Aktualizacja – Grok potwierdził: przekierowania i produkty zostają po stronie Claude.** Grok dodaje automatyczne przekierowanie po zmianie adresu (`rememberOldAddress`, `src/payload/slugRedirect`), Claude tego nie rusza.

Doszło: 252 reguły w `storefront/next.config.ts` (tablica `legacyRedirects`; muszą być w tym pliku, bo na serwer nie trafia folder `src`). **Już działają na żywym sklepie.** Razem przekierowanych 502 z 908 martwych adresów: wszystkie stare kategorie (397), 85 produktów, marki, autorzy, `/sklep/page/N`, `/about-us`, `/cart`, `/shop`. Cele sprawdzone na żywym sklepie, reguły zasymulowane dla wszystkich adresów (bez pętli), próbka sprawdzona na serwerze lokalnym. Obecnych stron nie przechwytują. Zostaje 404: 401 starych produktów bez pewnego odpowiednika (celowo, czekają na dziennik 404) i kilka śmieciowych adresów.

`storefront/next.config.ts`:
- `/sklep` → `/` zamiast `/szukaj` (które ma noindex);
- 23 stare adresy produktów → produkt lub kategoria (cele sprawdzone na żywym sklepie, reguły sprawdzone wyrywkowo lokalnie);
- `test-platnosci-001-zl-nie-kupowac` celowo zostaje 404.

**Właściciel ma jeszcze potwierdzić 3 cele:**
- `autobella…25-kg` → `…10-kg`
- `royal-clean-magic…nektaryna-1-l` → `royal-cleaner-magic-nektarynka-plyn-5l`
- `adbl-twister-soft-50mm…` → `adbl-twister-medium-50mm…`

Jeśli Grok wgrywa przed Claude: te reguły wejdą razem z nim, bo są w tym samym folderze. Właściciel jeszcze nie zdecydował, kto wgrywa.

Wynik audytu po poprawkach Groka: 742 strony i 1257 zdjęć odpowiadają 200, plik Google i mapa strony są aktualne. Wcześniejsze błędy 502 (80 stron, 543 zdjęcia) wystąpiły tylko w jednym przebiegu. Przyczyna nieustalona (wgrywanie albo obciążenie przez 4 równoległe zapytania); przy 3 nie wystąpiły.

## 4. Priorytety – co zostało

### Pilne (poza danymi Google)
1. **Kopie zapasowe żywego sklepu – do sprawdzenia.** Zadanie na komputerze („Sonax - kopia zapasowa sklepu”, `Dokumenty\Sonax-kopie\pobierz-kopie.ps1`) pobiera z serwera **testowego** `185.193.114.233`, nie z żywego. Nie wiadomo, czy nowy serwer robi kopie.
2. **Niesprawdzone na żywo** (wymaga serwera, kont lub testowego zamówienia): zamówienia, płatności P24, BaseLinker, maile, monitoring.

### Google i dane strukturalne (kod – dla Groka)
| # | Brak | Zweryfikowano |
|---|---|---|
| 1 | Dane `Store`: brak `sameAs`, `geo`, `priceRange`, `image`, `hasMap`, `areaServed` | na stronach |
| 2 | Brak `WebSite` z wyszukiwarką (`SearchAction`) | strona główna |
| 3 | Kategorie i marki: tylko `Store`; brak `BreadcrumbList` i listy produktów (`CollectionPage`/`ItemList`) | na stronach |
| 4 | Blog: `og:type=article`, ale brak `BlogPosting`/`Article` (autor, data, obraz) | na stronach |
| 5 | Kategorie, produkty, wpisy: brak `og:site_name` i `og:locale`; kategorie bez `og:type` | na stronach |
| 6 | 7 głównych kategorii: nie znaleziono opisu na stronie (wyszukiwane po znaczniku `section.mt-16`, sprawdzić, czy opisy są w bazie) | do potwierdzenia |
| 7 | Kategorie: 0 nagłówków `h2` | na stronach |
| 8 | Obrazy bez `alt`: strona główna 25/60, produkt 5/17 (część może być ozdobna) | na stronach |
| 9 | Plik Google: brak `handling_time`, `shipping_weight`, `unit_pricing_measure`, `custom_label_*`, `product_highlight`, `shipping_label`. Część wynika z pustych danych; `sale_price` jest w kodzie, ale nie ma go przy żadnym produkcie (patrz niżej) | plik |
| 10 | 194 produkty nie mają `description` w danych `Product` (przy poprzednim audycie prawie wszystkie miały). Propozycja: tekst zapasowy z nazwy i marki, tak jak w opisie strony | na stronach |
| 11 | Promocje: `sale_price` 0 w pliku i 0 przekreślonych cen na `/promocje` (8 kart). Sprawdzić, czy są promocje i czy nie powinno ich być w pliku | plik i strona |
| 12 | Dwa telefony: `664 953 377` (nagłówek, dane Google) i `500 021 705` (treść wielu stron). Właściciel ma wskazać właściwy lub potwierdzić oba | na stronach |
| 13 | CSP nie ustawione (HSTS i pozostałe są). Ostrożnie, bo GTM i P24 wymagają wyjątków | nagłówki |
| 14 | Brak `/apple-touch-icon.png`, `manifest`, `security.txt`, kanału RSS bloga. Niski priorytet | adresy |

### Mechanizmy, których nie ma w kodzie
1. **Dziennik błędów 404 w panelu:** adres, liczba wejść, ostatnia data i przycisk „Dodaj przekierowanie”. Dziś nikt nie wie, które stare adresy naprawdę ktoś odwiedza. **To najważniejszy mechanizm.**
2. **Automatyczne przekierowanie po zmianie adresu** – w trakcie (Grok).
3. **Import i eksport przekierowań z CSV**, wykrywanie pętli i łańcuchów, licznik użyć.
4. ~~Reguły ze wzorcem dla starych adresów~~ – zrobione, na żywo, `next.config.ts`.
5. **Pola w panelu** na profile (Facebook, Instagram, YouTube, wizytówka Google) i współrzędne sklepu. W ustawieniach sklepu ich nie ma, a są potrzebne do `sameAs` i `geo`.
6. **IndexNow** dla Bing (po dodaniu lub zmianie produktu). Opcjonalnie.
7. **Prośby o opinię:** automat istnieje, ale tylko 1 z 569 produktów ma ocenę w danych. Sprawdzić, czy wysyłka działa. Opcjonalnie opinie Google Customer Reviews (po zgodzie właściciela).

## 5. Stare adresy (przekierowania – zakres Claude)
Źródło: publiczne archiwum web.archive.org, 1301 adresów stron. **Archiwum nie pokazuje, co jest dziś w Google ani co ktoś odwiedza** – to tylko historia, więc priorytety ustalić po danych z Search Console lub dziennika 404.

| Typ | Martwe | Plan |
|---|---|---|
| `/produkt/*` | ok. 486 poza już dodanymi | 15 dobrych dopasowań, 101 do sprawdzenia, 370 bez odpowiednika (dopasowanie jest automatyczne i słabe, trzeba je przejrzeć) |
| `/kategoria-produktu/*` | 397, w tym 204 kolejne strony list | 231 z propozycją kategorii, reszta ręcznie; najlepiej reguły ze wzorcem |
| `/brand/*`, `/about-us`, `/cart`, `/index.php`, `/author/*`, `/blog/page/2`, `/sklep/page/*` | ok. 20 | proste reguły, propozycje w CSV |

`/shop`, `*.php`, `*.swf`, `/tag-produktu/*`: niski priorytet (pozostałości starszych sklepów).

Dobrze działa: 36/36 kategorii `/kategoria-produktu/<slug>/` z ostatniej wersji WooCommerce oraz 565/589 produktów (24 pozostałe to właśnie te z sekcji 3). Przekierowania z końcowym ukośnikiem mają jeden lub dwa kroki; 39 ma dwa.

## 6. Dane produktów (zakres Claude, nic jeszcze nie zmieniono)
`docs/produkty-do-poprawy.csv`, stan z pliku Google (568 produktów):
- brak marki 107 (62 z propozycją z nazwy, np. Freshtek 35, Soft99 11, Clinex 10);
- brak EAN 89 (Royal 19, Kwazar 15, Sonax 13) – tylko prawdziwe numery;
- słaby opis dla Google 30 (np. „Producent: Kwazar”), krótki opis produktu 8;
- nazwa WIELKIMI LITERAMI 23, nazwa ponad 90 znaków 12;
- `sonax-sciereczka-mikrofibry-416-200` jest w mapie strony, ale nie w pliku Google (przyczyna nieustalona).

Ciężkie zdjęcia: 194 oryginały ponad 1 MB (największe 3,3 MB). Sklep pokazuje lżejsze wersje, więc to niski priorytet.

Przed zmianą danych na żywo: kopia bazy, zgoda właściciela na każdą partię i sprawdzenie, czy synchronizacja z BaseLinkerem ich nie nadpisze.

Marki: zapisane 4.11 (patrz sekcja 10). Synchronizacja BaseLinkera nie nadpisuje pola marki.

## 7. Co działa – nie psuć
- 742 strony 200; mapa strony bez duplikatów, canonical zgodny z adresem, jeden `h1` na stronę, brak zdublowanych tytułów, wszystkie mają `og:image`.
- 404 działa prawdziwie (produkt, kategoria, blog, adres nieznany). `/wp-admin`, `/.env` → 404.
- Plik Google: 568 produktów, unikalne id, zdjęcia 200, ceny i dostępność zgodne ze stronami, kategoria Google przy wszystkich, odświeżanie co 5 min.
- Opisy Google bez kodu HTML. HTTP → HTTPS działa. Mediana czasu strony 0,24 s.
- `www.sonax.sklep.pl` celowo bez przekierowania (notatka w `deploy/Caddyfile.solo`: stary sklep odsyła odwrotnie, telefony kręciłyby się w kółko). Canonical wskazuje wersję bez `www`. Wrócić do przekierowania, gdy stary sklep i DNS nie będą potrzebne. Notatka w `CLAUDE.local.md` mówi co innego i do poprawy.
- Tag Manager `GTM-P74HX7ZG` ładuje się po zgodzie; tryb Consent Mode: `basic`. GA4/Ads/Meta/Clarity puste w sklepie (zawartości kontenera nie sprawdzono).

## 8. Kroki właściciela na kontach (nie w kodzie)
- Search Console: weryfikacja domeny (na stronie nie ma kodu; mogła być zrobiona przez DNS), zgłoszenie `/sitemap.xml`.
- Merchant Center: plik `/feed/google.xml`, ustawienia dostawy i zwrotów, połączenie z Google Ads.
- Bing Webmaster: import z Search Console.
- Wizytówka Google (Business Profile): adres i telefon zgodne z danymi sklepu.
- Polityka prywatności: lista używanych narzędzi (Google, Meta, Clarity).
- Poczta: DKIM i DMARC. Monitoring: UptimeRobot na `/api/zdrowie`.
- Podać: linki do profili społecznościowych i właściwy numer telefonu.

## 9. Pułapki techniczne
- **Zmiany bazy:** push wyłączony (`PAYLOAD_DB_PUSH=0`), migracje w `storefront/deploy/migrations`. Na serwerze: kopia bazy, zgoda właściciela, potem SQL, potem wdrożenie.
- **Pliki generowane przy budowaniu** mogą zapisać dane z lokalnej bazy (tak było z plikiem Google i mapą strony). Nowe pliki z danymi mają powstawać przy zapytaniu.
- **`payload.config.ts` i to, co ładuje:** nie importować `src/lib/catalog.ts` (server-only), bo `generate:importmap` się wywali.
- **Panel** rysuje pola dopiero, gdy są widoczne; w ukrytym oknie testowym grupy pól wyglądają na puste.
- **Audyty żywego sklepu:** maks. 3 zapytania naraz.
- Skrypty audytu nie są w repozytorium; można je odtworzyć z opisu powyżej.

## 10. Opisy produktów – ustalenia (4.11)
Porównanie: żywy sklep, stary WooCommerce Sonax (publiczne API na `193.143.77.38`) i eksport domyślny BaseLinkera.
- **Opisy Sonax są już na żywym sklepie:** 520 z 523 porównywalnych produktów ma opis zgodny z WooCommerce; 216 różni się od domyślnego opisu BaseLinkera.
- Wyjątki: `docs/opisy-do-sprawdzenia.csv` (3 Tenzi z innym opisem, 4 bez opisu w starym sklepie, 41 spoza starego sklepu).
- **Zagrożenie:** pełna synchronizacja produktów z BaseLinkera (`sync.ts`) bierze opis domyślny i nadpisuje opis Sonax, gdy włączone jest „Opisy” i produkt nie ma „Nie nadpisuj opisu”. Nie uruchamiać jej, dopóki to nie jest wyłączone.
- Marki: **zapisane na żywo 4.11** dla 105 produktów (`docs/marki-propozycje.csv`), po kopii `/opt/sonax/backups/przed-marki-2026-11-04-1403.dump`. Bez marki zostały 2: `BetonCleaner Strong`, `Kij do miotły`.
- Żywa baza to PostgreSQL (`sonax-postgres`); plik `/opt/sonax/data/sonax.db` jest nieaktualny.
