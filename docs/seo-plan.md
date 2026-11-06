# Plan SEO sklepu sonax.sklep.pl

Audyt z 5 listopada 2026, czyli dwa dni po przenosinach sklepu. Sprawdziłem tylko publiczne strony i dane. Na sklepie nic nie zostało zmienione.

## Decyzje i stan prac (6 listopada 2026)

**Decyzje właściciela:**
- Telefon +48 664 953 377 jest właściwy.
- Opinia „Władek” to test: do usunięcia.
- Piszemy „oficjalny dystrybutor SONAX”, a nie „oficjalny sklep”.
- Plik produktów jest już w Merchant Center.
- Lista 50 produktów: 35 SONAX oraz po kilka Tenzi i Plak.
- Opisy produktów są odłożone na później.
- Karty charakterystyki będą ze strony „do pobrania” (później).
- Stare adresy: listę trzeba rozszerzyć.

**Gotowe lokalnie, czeka na wgranie (za zgodą):**
- Strona kategorii: każda podkategoria ma własny nagłówek, okruszki, dane dla Google, opis z panelu, a tytuł i opis dla Google brane są z pól SEO w panelu. To naprawia punkty 3 i 4 z tabeli.
- Napis „Oficjalny dystrybutor SONAX” na stronie głównej, w opisie dla Google, w „O nas”, w stopce domyślnej formatki maili i w `llms.txt`.
- Skrypt `src/scripts/import-category-descriptions.ts` (tryb `--sql` dla bazy PostgreSQL na serwerze).

**Na sklepie (6.11, południe):**
- Poradnik [Jak przygotować auto do zimy](https://sonax.sklep.pl/blog/jak-przygotowac-auto-do-zimy) (`docs/poradniki/jak-przygotowac-auto-do-zimy.md`): na początku krótkie podsumowanie, potem lista kontrolna, proporcje płynu, sekcja pytań i 20 linków do produktów. Okładka jest tymczasowa (wspólne zdjęcie przewodników) – warto podmienić ją na zimowe zdjęcie w panelu.
- Wersje premium 10 bestsellerów SONAX (`06-premium.json`), z faktami z oficjalnych stron sonax.com: dla kogo, krok po kroku, na co uważać, pytania i odpowiedzi, pasujące produkty.
- Podstawowe opisy 11 produktów zimowych (`07-zima.json`): K2 Claren, Plak Ice Fresh, SONAX Antypara, K2 Fox, ściereczka antyroszeniowa, Cardos, DEG, K2 Kuler, Prestone, Plak Siling, SONAX Klima Power Cleaner. Stare wersje: `stare-opisy-przed-zmiana-2026-11-06-paczka2.csv`.
- Do sprawdzenia: SONAX Klima Power Cleaner – stary opis mówił o „Display 12 × 100 ml”, a w sklepie jest sprzedawany na sztuki.

**Na sklepie (6.11, przed południem):**
- Nowe opisy 50 produktów według sprzedaży ze starego sklepu (35 SONAX, 8 Tenzi, 7 Plak). Każdy ma opis, krótki opis, tytuł i opis dla Google oraz cechy do Zakupów Google. Teksty są w `docs/opisy-produktow/*.json`, poprzednie wersje w `docs/opisy-produktow/stare-opisy-przed-zmiana-2026-11-06.csv`. W każdym produkcie zaznaczono „Nie nadpisuj opisu”, więc BaseLinker ich nie skasuje.
- Usunięta testowa opinia „Władek”.

**Gotowe w kodzie, czeka na wgranie:**
- E-mail autora opinii i cena B2B nie są już widoczne w publicznym API.
- Kategorie i marki mają linki do kolejnych stron (`?strona=2`) z własnym adresem kanonicznym i tytułem „– strona 2”.
- Tytuły produktów w Google bez numerów katalogowych i wielkich liter, z zachowaną pojemnością (`src/lib/seo.ts`). Opisy dla Google przycinane do pełnego zdania.
- MPN w danych dla Google i Merchant Center to numer katalogowy producenta (SONAX 6 cyfr, Kwazar np. WTO.0332), a nie nasz SKU.
- Opisy zdjęć logo marek i zdjęć na stronie rozcieńczania.

**Do sprawdzenia przez właściciela (opisy w sklepie nie pasują do nazwy produktu):**
- SONAX Silikon do uszczelek 340100 – stary opis dotyczył Preparatu do pielęgnacji gumy. Nowy opis jest ogólny.
- SONAX Zimowy płyn 232300 – stary opis mówi o serii Xtreme. Czy to ten produkt?
- SONAX Cockpit matowy Sport-Fresh – stary opis podawał zapach Lemon Rocks.
- Plak Ściereczki do skóry – stary opis zaczynał się od „SONAX Ściereczki”.
- SONAX Xtreme Spray & Seal i SONAX Odmrażacz – w sklepie prawie nie było danych. Sposób użycia odsyła do etykiety.

**Na sklepie (6.11, rano):** opisy, tytuły i opisy dla Google w 128 ze 129 kategorii (`docs/opisy-kategorii.md`). Działy pokazują je od razu, podkategorie po wgraniu nowej strony kategorii.

## W skrócie

**Fundament jest dobry.** Google może czytać sklep: jest mapa strony, są tytuły i dane o cenach. Główne strony odpowiadają szybko.

**Najsłabsze są treści, a nie technika:**
- żadna ze 129 kategorii nie ma opisu,
- tylko 1 z 569 produktów ma własny tytuł i opis dla Google,
- pozostałe produkty mają opis strony ucięty ze zwykłego tekstu albo wzięty z szablonu.

**Najpierw trzeba zrobić trzy rzeczy:**
1. Podłączyć Search Console. Bez niej nie wiemy, co Google widzi i na jakie frazy pokazuje sklep.
2. Wyeksportować sprzedaż, żeby zacząć od produktów, które naprawdę zarabiają.
3. Poprawić stronę kategorii w kodzie. Bez tego opisy kategorii i podkategorii nie zadziałają tak, jak powinny.

**Pilne, choć to nie SEO:** adres e-mail autora opinii jest widoczny publicznie (punkt 1 w następnym rozdziale).

## Najważniejsze błędy

| # | Co jest nie tak | Dlaczego to ważne | Kto naprawia |
|---|---|---|---|
| 1 | **E-mail autora opinii da się odczytać publicznie** pod `/api/reviews`, choć w panelu pole nazywa się „niepubliczny”. Dziś jest tam jedna opinia z adresem firmowym, ale tak samo trafi tam adres każdego klienta. | Dane osobowe (RODO) | AI, po Twojej zgodzie na wgranie |
| 2 | **Opinia „Władek” wygląda na testową.** Ma 5 gwiazdek, znaczek „potwierdzony zakup” i adres sklep@kenochem.com. Gwiazdki z niej idą do danych dla Google. | Google nie akceptuje nieprawdziwych opinii | Ty sprawdzasz, potem usunięcie |
| 3 | **Kategorie są bez tekstu:** 0 z 129 ma opis. Pola SEO kategorii w panelu są wszystkie puste, a sklep ich w ogóle nie odczytuje. | To strony, które mogą się pokazywać na ogólne frazy, np. „szampon samochodowy” | AI: kod i szkice, Ty: zatwierdzasz |
| 4 | **Podkategorie mają główny nagłówek działu.** Strona „Mycie naczyń” ma tytuł dla Google poprawny, ale nagłówek „Dom i ogród”. Także dane dla Google opisują cały dział. Opis jest jeden na dział i jego podstrony, więc podkategoria nie może mieć własnego. | Google gorzej rozumie, o czym jest podstrona (w mapie jest 121 takich adresów) | AI |
| 5 | **Dalsze produkty są za przyciskiem.** Kategoria pokazuje najpierw 24 produkty, a resztę po kliknięciu „Pokaż kolejne”. Google nie klika przycisków. Do tych produktów prowadzi głównie mapa strony. | W „Mycie auta” jest 134 produkty, a linków widocznych dla Google tylko 24 | AI |
| 6 | **Opisy produktów dla Google są cięte mechanicznie.** Własny opis ma 1 produkt, 195 ma tekst z szablonu, 297 ma tekst ucięty w połowie zdania, czasem ze sklejonym nagłówkiem („…wodzie SONAX Preparat SONAX…”). | To tekst, który klient widzi w wynikach Google i który zachęca do kliknięcia | AI: kod i szkice, Ty: zatwierdzasz |
| 7 | **Długie tytuły produktów:** 440 z 569 przekracza około 60 znaków, więc Google je utnie. 58 nazw jest pisanych WIELKIMI LITERAMI. | Klient nie widzi końca nazwy, np. pojemności | AI: szkice, Ty: zatwierdzasz |
| 8 | **Karty charakterystyki i piktogramy:** 0 z 569 produktów ma je wpisane w panelu, a FAQ wspomina o kartach charakterystyki. | Bez tego nie napiszemy pewnie o bezpieczeństwie. Sprawdź też, czy obowiązki prawne dla chemii są spełnione w inny sposób. | Ty dostarczasz pliki, AI może je przypisać |
| 9 | **Stare adresy:** próbka 50 adresów pokazała, że główne reguły działają. 3 z 15 adresów opisanych jako „dobre dopasowanie” nadal dają błąd 404 (wszystkie to Freshtek One Shot: Bergamo, Kashmir, Mora Mora). 409 adresów czeka na decyzję w `docs/adresy-do-decyzji.csv`. | Stare linki mają wartość w Google, a klient trafia na pustą stronę | Ty decydujesz, AI wpisuje |
| 10 | **Różne numery telefonu:** na stronie i w danych dla Google jest +48 664 953 377, a w opisie projektu +48 500 021 705. | Dane firmy powinny być wszędzie takie same, także w wizytówce | Ty potwierdzasz |

**Mniejsze sprawy:**
- 70 produktów nie ma marki, 91 nie ma kodu EAN (lista: `docs/produkty-do-poprawy.csv`, `docs/marki-propozycje.csv`).
- Strona `/bestsellery` jest prawie pusta: tylko 1 produkt ma tę etykietę. Trzeba ją uzupełnić na podstawie sprzedaży albo schować przed Google.
- W danych dla Google i Merchant Center w miejscu numeru producenta (MPN) podajemy nasz wewnętrzny SKU.
- Żaden produkt nie ma wypisanych cech do Zakupów Google (0 z 568 w pliku).
- 12 logo marek i 6 zdjęć na stronie rozcieńczania nie ma opisu zdjęcia. Na stronie głównej 29 zdjęć też go nie ma, część może być ozdobna.
- Wersja `www` działa jako kopia sklepu, bez przekierowania. W kodzie jest to celowe, bo stary sklep powodował zapętlenie, a adres główny wskazuje wersję bez `www`, więc Google nie powinno się pogubić. Po ustaleniu DNS i wyłączeniu starego sklepu warto dodać przekierowanie.
- Przekierowanie `/brands/tenzi` prowadzi na adres z `www`, a część kategorii ma dwa przekierowania po kolei zamiast jednego.

## Co działa dobrze i nie wymaga pracy

- Mapa strony: 744 adresy, bez adresów filtrów. `robots.txt` jest poprawny.
- Plik dla Merchant Center działa i ma 568 produktów.
- Każda sprawdzona strona ma jeden główny nagłówek, tytuł i adres główny. Strona błędu poprawnie zwraca 404.
- Produkty mają dane o cenie, dostępności, dostawie i zwrotach. Każdy produkt ma zdjęcie.
- Czas odpowiedzi serwera to około 0,1–0,2 s, a przy pierwszym wejściu na niektóre strony do 0,9 s.
- Blog: 17 wpisów po 870–3060 słów, wszystkie mają tytuł i opis dla Google.

## Treści w liczbach

| Produkty (569) | Liczba |
|---|---|
| Bez opisu lub prawie bez (poniżej 30 słów) | 31, m.in. Royal WC CL 5L, SONAX Xtreme Spray & Seal 750 ml |
| Krótkie opisy (31–60 słów) | 80 |
| Dłuższe opisy (ponad 100 słów) | 391 (połowa produktów ma do 134 słów) |
| Taki sam pełny opis jak inny produkt | 43 produkty w 18 grupach (często warianty, np. opryskiwacze Orion) |
| Ten sam krótki opis co inny produkt | 43, w tym 23 razy ten sam tekst Kwazar |
| Opis ze zdaniem powtórzonym w co najmniej 3 opisach | 83 |
| Krótki opis to początek pełnego opisu | 261 (ten sam tekst dwa razy na stronie) |
| Bez krótkiego opisu | 195 |

**Opisy skopiowane od producenta.** Nie mam narzędzia, które wykryje to pewnie, więc poniżej są tylko sygnały:
- Opisy mają ten sam, reklamowy styl (251 razy „skuteczn…”, 152 razy „zapewnia”, 74 razy „formuła”).
- Zdania powtarzają się w całych seriach: pady ADBL, Freshtek One Shot, Kwazar.
- Potwierdzony przykład: zdanie o „kształcie diamentu” z padów ADBL ma swój odpowiednik po angielsku [u innego sprzedawcy](https://intercars.md/en/catalog/product/abrasive-sponge-H0HASZ).
- Trzy inne próbki nie dały trafienia, ale wyszukiwarka, której użyłem, słabo radzi sobie z polskimi cytatami. To nie dowodzi, że te teksty są oryginalne.

Zakładam, że serie ADBL, Freshtek i Kwazar pochodzą od dostawców. Reszty nie przesądzam.

**Blog.** Wpisy są, ale słabo sprzedają:
- 5 wpisów nie ma żadnego linku do produktu.
- Pole „produkty powiązane” jest puste we wszystkich 17.
- 11 opisów dla Google ma równo 160 znaków, więc wyglądają na ucięte.
- Brakuje poradników o tym, co sklep ma w dużych ilościach: opryskiwacze, chemia do myjni, pady polerskie.

## Priorytety

**Etap 1: fundament (ten tydzień)**
1. Usunięcie e-maili z publicznych danych opinii. Przy okazji sprawdzenie, czy cena B2B nie jest publiczna, bo z kodu wynika, że może być.
2. Search Console: podłączenie sklepu, zgłoszenie mapy strony, kontrola błędów.
3. Eksport sprzedaży i lista 50 produktów.
4. Decyzja o opinii testowej i o numerze telefonu.
5. Merchant Center i wizytówka Google: sprawdzenie danych.

**Etap 2: poprawki w kodzie (zaraz po tym, jedno wgranie)**
6. Własny nagłówek, opis i tytuł każdej podkategorii, odczyt pól SEO z panelu.
7. Prawdziwe linki do kolejnych stron kategorii zamiast samego przycisku.
8. Opisy produktów dla Google cięte na końcu słowa, bez sklejonego nagłówka.
9. Opisy zdjęć logo i produktów, poprawka numeru MPN.

**Etap 3: stare adresy (równolegle)**
10. Naprawa 3 adresów Freshtek i przekierowania na `www`, potem Twoje decyzje dla 34 adresów z grup 1 i 2 w `docs/adresy-do-decyzji.csv`. Grupy 3 i 4 (375 bardzo starych adresów) można zostawić, chyba że Search Console pokaże na nich ruch.

**Etap 4: treści (co tydzień, w kolejności)**
11. 7 działów, potem najważniejsze podkategorie według danych z Search Console (razem około 10).
12. 50 najlepiej sprzedających się produktów.
13. 6–10 poradników.
14. Produkty z pustymi opisami i powielonymi tekstami.

## Kto co robi

**Ty (tego AI nie zrobi samo):**

| Co | Jak | Czas |
|---|---|---|
| Search Console | Podłącz domenę na swoim koncie Google. Potem wyślij mi eksport albo zaloguj się w przeglądarce, żebym mógł czytać raporty. Na stronie głównej nie ma znacznika weryfikacji, ale własność może być już potwierdzona inaczej, więc najpierw sprawdź, czy konto istnieje. Dane ze starego sklepu będą bardzo cenne. | 15 min |
| Eksport sprzedaży | Sprzedaż produktów z ostatnich 12 miesięcy z WooCommerce albo BaseLinkera (nazwa, SKU, liczba sztuk, kwota). | 10 min |
| Merchant Center | Dodaj plik `https://sonax.sklep.pl/feed/google.xml`, wyślij mi listę błędów. | 20 min |
| Wizytówka Google | Sprawdź nazwę (w linku jest „Sonax-Polska”), adres, telefon, godziny i adres strony. | 10 min |
| Opinia „Władek” | Czy to test? Jeśli tak, usuń ją. | 2 min |
| Telefon | Który numer jest właściwy? | 1 min |
| „Oficjalny sklep SONAX” | Tak mówi opis strony głównej dla Google. Czy firma ma do tego prawo? Jeśli nie ma pewności, zmienię słowa. | 1 min |
| Karty charakterystyki | Przekaż pliki PDF kart (mogą być paczką). Zacznij od produktów z listy 50. | wg dostawcy |
| Stare adresy | Rozstrzygnij 34 adresy w `docs/adresy-do-decyzji.csv`. | 30 min |
| Zatwierdzanie | Co tydzień paczka szkiców. | 30 min |

**AI:** poprawki w kodzie (do wgrania po Twojej zgodzie), szkice opisów, tytułów i poradników, kontrola powtórzeń, lista pytań, raport z Search Console, wpisanie zatwierdzonych tekstów.

## Praca co tydzień

- **Poniedziałek: AI przygotowuje paczkę:** 10 produktów, 1 kategorię i co drugi tydzień 1 poradnik. Paczka to tabela: stary tekst, nowy tekst, skąd wzięte dane, pytania do Ciebie.
- **Do środy: Ty oznaczasz:** OK, popraw albo odrzuć. Dane o chemii, których nie da się sprawdzić, zostają jako pytanie albo wypadają.
- **Czwartek: wpisanie tylko zatwierdzonych tekstów.** Przy każdym produkcie zaznaczamy „Nie nadpisuj opisu” w zakładce BaseLinker, bo inaczej synchronizacja może skasować nowy tekst. Adres produktu się nie zmienia.
- **Piątek: krótki raport z Search Console:** co weszło do Google, jakie frazy rosną, co się psuje. Po kilku tygodniach zobaczymy, czy nowe opisy pomagają, i wtedy zdecydujemy, czy zwiększyć tempo.

**Zasady:** nic nie trafia na sklep bez Twojej zgody. Nie ma wymyślonych opinii, testów ani parametrów. Dane o chemii pochodzą wyłącznie z kart produktów albo od Ciebie. Nie kopiujemy opisów producenta.

**Propozycje poradników** (popyt sprawdzimy w Search Console przed pisaniem):
1. Opryskiwacz czy pianownica: co wybrać do mycia auta (Kwazar: 41 produktów)
2. Chemia do myjni bezdotykowej: jak dobrać preparat
3. Jak dobrać pady polerskie do maszyny i rodzaju pracy (ADBL: 37 produktów)
4. Białe plamy na lakierze po wodzie: skąd się biorą i jak je usunąć
5. Jak wyprać tapicerkę samochodową
6. Czarne plastiki zewnętrzne: czyszczenie i odświeżanie
7. Przygotowanie auta do zimy
8. Mikrofibra: jak wybrać, prać i nie porysować lakieru

## Przykładowe szkice do oceny stylu

**To są szkice, nic nie zostało wgrane.** Fakty pochodzą wyłącznie z obecnych opisów w sklepie, nie z kart charakterystyki, bo tych w panelu nie ma. Dlatego każdy szkic ma pytania, a teksty w [nawiasach] czekają na Twoje dane. Ceny i stany celowo pomijam, bo się zmieniają.

### Szkic 1: SONAX Profiline Waterspot Remover 1 L

- **Tytuł dla Google:** SONAX Waterspot Remover 1 L – ślady po wodzie
- **Opis dla Google:** Usuwa ślady po twardej wodzie: osady wapnia i magnezu z lakieru, plastików i folii. Gotowy do użycia, stosowany po umyciu auta. Pojemność 1 L.
- **Krótki opis:** Gotowy preparat do usuwania plam i zacieków po twardej wodzie. Stosowany po umyciu auta, także na folie i lakiery matowe.

> **Plamy, które zostają po wyschnięciu wody**
>
> Kiedy twarda woda wyschnie na karoserii, zostawia plamy i zacieki. To osady wapnia i magnezu. Waterspot Remover z linii SONAX Profiline służy właśnie do ich usuwania. Sięgasz po niego po umyciu auta, gdy karoseria jest już czysta, a ślady nadal widać.
>
> **Gdzie można go stosować**
> - lakier, także matowy
> - zewnętrzne elementy z plastiku
> - folie ochronne
>
> **Najważniejsze informacje**
> - gotowy do użycia
> - odczyn: pH 3,0–3,5 (w 20°C)
> - bez kwasu fluorowodorowego i solnego
> - pojemność: 1 L
>
> **Jak używać:** [z etykiety produktu]
>
> **Bezpieczeństwo:** [piktogramy i ostrzeżenia z karty charakterystyki]

*Pytania:* (1) Czy pH z obecnego opisu jest zgodne z kartą? (2) Stary opis mówi „bez agresywnych kwasów”, a pH 3 to odczyn kwaśny, więc celowo nie piszę „bezpieczny”. Zgadzasz się? (3) Proszę o sposób użycia z etykiety.

### Szkic 2: Tenzi Top Glass 5 L

- **Tytuł dla Google:** Tenzi Top Glass 5 L – płyn do szyb i luster
- **Opis dla Google:** Gotowy płyn do szyb, luster i innych twardych powierzchni. Szybko schnie, nie zostawia smug. Wydajność 1–2 ml na 1 m². Kanister 5 L.
- **Krótki opis:** Gotowy, szybkoschnący płyn do szyb i luster w opakowaniu 5 L, do domu, biura, gastronomii i samochodu.

> **Do codziennego mycia szyb i luster w większej ilości**
>
> Top Glass to gotowy płyn, którego nie trzeba rozcieńczać. Usuwa kurz, tłuste plamy i odciski palców. Szybko schnie, nie zostawia smug i nie wymaga polerowania. Zostawia świeży zapach.
>
> Opakowanie 5 L przyda się tam, gdzie szyb i luster jest dużo. Na 1 m² wystarcza 1–2 ml płynu.
>
> **Gdzie się sprawdzi:** dom i biuro, hotele i gastronomia, samochody osobowe.
>
> **Powierzchnie:** szkło, lustra i inne powierzchnie twarde.
>
> **Bezpieczeństwo:** [z karty charakterystyki]

*Pytania:* (1) Pominąłem zdanie „bezpieczny dla wszystkich typów szkła”, bo nie mam go jak sprawdzić. Zostawić je? (2) Czy z doświadczenia sklepu jest coś, co warto dodać, np. kto najczęściej kupuje?

### Szkic 3: Kwazar Orion 6 L

- **Tytuł dla Google:** Kwazar Orion 6 L – opryskiwacz z manometrem
- **Opis dla Google:** Opryskiwacz ciśnieniowy 6 L do myjni, warsztatów i firm sprzątających: manometr na rękojeści, zawór bezpieczeństwa, lanca 50 cm, regulowana końcówka.
- **Krótki opis:** Opryskiwacz ciśnieniowy 6 L z manometrem, zaworem bezpieczeństwa i lancą 50 cm, do pracy w myjni i warsztacie.

> **Opryskiwacz do codziennej pracy w myjni i warsztacie**
>
> Orion 6 L sprawdzi się w myjniach, warsztatach mechanicznych, firmach sprzątających, a także w budownictwie i drogownictwie. Ciśnienie kontrolujesz na manometrze w rękojeści lancy, a końcówką ustawisz rozpylanie od mgiełki do strumienia.
>
> **Co ułatwia pracę**
> - lanca o długości 50 cm
> - pasek naramienny, który można zamocować z dowolnej strony
> - lejek w głowicy ułatwiający nalewanie
> - podstawa ze stopkami, która pomaga przy pompowaniu
> - przezroczysty wskaźnik poziomu cieczy przy skali
>
> **Wyposażenie i bezpieczeństwo:** uszczelnienia vitonowe i zawór bezpieczeństwa.
>
> **Inne pojemności:** 3 L, 9 L i 12 L.

*Pytania:* (1) Czy ten model to „Orion Super Pro+”? W nazwie tego nie ma, a w opisie tak. (2) Czy można wypisać, do jakich preparatów się nadaje (np. kwaśnych, zasadowych)? To najczęstsze pytanie klienta, ale nie mam tych danych. (3) Warianty 3, 9 i 12 L mają dziś ten sam opis. Proponuję połączyć je w jedną kartę, jeśli to możliwe, albo zmienić początek każdego opisu.

### Szkic 4: dział „Mycie auta”

- **Tytuł dla Google:** Mycie auta – szampony, piany, chemia do felg
- **Opis dla Google:** Szampony, piany aktywne, chemia do felg i opon, szyb oraz plastików. Sklep stacjonarny w Białymstoku i wysyłka w całej Polsce.

> **Wszystko do mycia auta, od pierwszego spłukania po szyby**
>
> W tym dziale znajdziesz szampony i piany aktywne, preparaty do wstępnego mycia i dekontaminacji, chemię do felg i opon, środki do szyb i lusterek oraz do plastików, gumy i detali. Nie wiesz, od czego zacząć? Zajrzyj do przewodnika [Co kupić do mycia auta w domu](/blog/przewodnik-co-kupic-do-mycia-auta) albo [zadzwoń do nas](/kontakt).

*Pytanie:* czy tekst ma być tak krótki (nad listą lub pod nią), czy dłuższy, z poradami wyboru dla każdej grupy? Dłuższy musiałby opierać się na Twoich wskazówkach.

## Czego audyt nie sprawdził

- **Pozycji w Google i liczby stron w indeksie:** potrzebna jest Search Console. Wyszukiwarka, której użyłem, nie pokazała sklepu, ale nie jest to Google, więc niczego to nie dowodzi.
- **Szybkości na telefonie:** limit testu Google był dziś wyczerpany. Pomiar w przeglądarce (komputer, strona główna): główny obraz po około 1,3 s, bez przeskakiwania układu. Test na telefonie powtórzymy na [pagespeed.web.dev](https://pagespeed.web.dev/).
- **Sprzedaży:** dane są w panelu, a nie logowałem się tam.
- **Wszystkich stron:** techniczne sprawdzenie objęło kilkanaście stron i 65 starych adresów (próbka z 909), a dane treści obejmują wszystkie produkty, kategorie i wpisy.
- **Prawdziwości treści w 17 wpisach bloga:** liczyłem długość i linki, nie sprawdzałem faktów. Warto to zrobić przed rozbudową wpisów.
