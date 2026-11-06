# Opisy kategorii

**Stan na 6 listopada 2026:** 128 ze 129 kategorii ma opis, tytuł i opis dla Google. Wszystkie są wgrane do bazy sklepu na prośbę właściciela, a przed wgraniem zrobiono kopie bazy w `/opt/sonax/backups`. Bez opisu jest tylko pusta kategoria „Naprawa skóry”.

- Pierwsze 32 kategorie: 14 nowych opisów i 18 poprawionych opisów ze starego sklepu WooCommerce.
- Pozostałe 96: nowe opisy, oparte na produktach, które naprawdę są w danej kategorii, bez danych o chemii spoza kart produktów.
- Opisy podkategorii i ich tytuły dla Google zaczną się pokazywać po wgraniu nowej wersji strony kategorii. Działy pokazują opisy już teraz.

**Zmiana tekstu:** popraw go w panelu (Kategorie → opis i SEO) albo tutaj. Ponowne wgranie z tego pliku: `KATEGORIE="--sql plik.sql" npx cross-env PAYLOAD_DB_PUSH=0 payload run src/scripts/import-category-descriptions.ts` (w `storefront/`), a potem wykonanie pliku w psql na serwerze. Skrypt nie nadpisuje tekstów, które już są, chyba że dodasz `--nadpisz`.

Linii zaczynających się od `>` (pytania do właściciela) nie wgrywamy.

---

## mycie-auta | Mycie auta
- Źródło: nowy opis
- Tytuł w Google: Chemia do mycia auta – szampony, piany, felgi
- Opis w Google: Szampony i piany aktywne, chemia do felg i opon, szyb i plastików oraz preparaty do mycia wstępnego. Sklep w Białymstoku, wysyłka w całej Polsce.

W dziale **Mycie auta** zebraliśmy chemię do każdego etapu mycia: od usuwania trudnego brudu przed myciem, przez mycie karoserii, po felgi, szyby i plastiki. Znajdziesz tu produkty SONAX, Tenzi, K2, Plak, ADBL i Soft99, w poręcznych butelkach i w kanistrach 5 l.

- [Szampony i piany aktywne](/kategoria/mycie-auta?sub=szampony-i-piany): do mycia karoserii.
- [Pre-wash i dekontaminacja](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja): na owady, smołę, klej, żywicę, osady i do odtłuszczania.
- [Felgi i opony](/kategoria/mycie-auta?sub=felgi-i-opony): płyny do felg, także kwaśne, oraz dressingi do opon.
- [Szyby i lusterka](/kategoria/mycie-auta?sub=szyby-i-lusterka): płyny do szyb i spryskiwaczy, antypara, niewidzialne wycieraczki.
- [Plastiki, guma i detale](/kategoria/mycie-auta?sub=plastiki-guma-i-detale): plastiki zewnętrzne, uszczelki, reflektory, chrom, folie, dachy cabrio i mycie silnika.

Kompletujesz zestaw do mycia w domu? Zajrzyj do przewodnika [Co kupić do mycia auta w domu](/blog/przewodnik-co-kupic-do-mycia-auta) i poradnika [Jak prawidłowo myć samochód](/blog/jak-prawidlowo-myc-samochod). Prowadzisz myjnię? Duże opakowania i preparaty do mycia bezdotykowego są w dziale [Chemia do myjni](/kategoria/chemia-do-myjni).

## szampony-i-piany | Szampony i piany aktywne
- Źródło: nowy opis (na podstawie starego tekstu)
- Tytuł w Google: Szampony samochodowe i piany aktywne
- Opis w Google: Szampony samochodowe, piany aktywne i neutralne piany pH marek SONAX, Tenzi, ADBL i Plak, w opakowaniach od 500 ml do 10 kg. Wysyłka z Białegostoku.

Szampon i piana aktywna to podstawa każdego mycia auta. W tej kategorii są trzy grupy:

- [Szampony samochodowe](/kategoria/mycie-auta?sub=szampony-i-piany&typ=szampony-i-piany-szampony-samochodowe): do mycia ręcznego.
- [Piany aktywne](/kategoria/mycie-auta?sub=szampony-i-piany&typ=szampony-i-piany-piany-aktywne): nakładane pianownicą przed myciem.
- [Neutralne piany pH](/kategoria/mycie-auta?sub=szampony-i-piany&typ=szampony-i-piany-neutralne-piany-ph).

Opakowania są różne: od 500 ml po kanistry i 10 kg. Część produktów to koncentraty. Ile wlać do wody, policzysz w [kalkulatorze rozcieńczania](/rozcienczanie). Do nakładania piany potrzebna jest [pianownica albo opryskiwacz](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice).

Zastanawiasz się, czy piana zmyje wosk albo powłokę? Odpowiadamy w poradniku [Czy piana aktywna zmywa wosk](/blog/czy-piana-aktywna-zmywa-wosk).

## pre-wash-i-dekontaminacja | Pre-wash i dekontaminacja
- Źródło: nowy opis
- Tytuł w Google: Pre-wash i dekontaminacja – owady, smoła, osady
- Opis w Google: Środki do usuwania owadów, smoły, kleju i żywicy, osadów i rdzy oraz odtłuszczacze i IPA. Marki SONAX, Tenzi, ADBL, Soft99 i inne. Wysyłka z Białegostoku.

Nie każdy brud zejdzie szamponem. Owady, smoła, resztki kleju, żywica czy osady po wodzie wymagają osobnych preparatów. W tej kategorii znajdziesz:

- [Usuwanie owadów](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja&typ=pre-wash-i-dekontaminacja-usuwanie-owadow)
- [Usuwanie smoły, kleju i żywicy](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja&typ=pre-wash-i-dekontaminacja-usuwanie-smoly-kleju-i-zywicy)
- [Usuwanie osadów i rdzy](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja&typ=pre-wash-i-dekontaminacja-usuwanie-osadow-i-rdzy)
- [Odtłuszczacze i IPA](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja&typ=pre-wash-i-dekontaminacja-odtluszczacze-i-ipa): do odtłuszczania karoserii
- [APC i środki uniwersalne](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja&typ=pre-wash-i-dekontaminacja-apc-i-srodki-uniwersalne)

Każdy z tych preparatów służy do czegoś innego. Przed użyciem przeczytaj etykietę i sprawdź środek na małym, niewidocznym fragmencie. Więcej w poradnikach [Usuwanie owadów z lakieru](/blog/usuwanie-owadow-z-lakieru-samochodu), [Jak usunąć asfalt z lakieru](/blog/jak-usunac-asfalt-z-lakieru) i [Lakier szorstki po myciu?](/blog/lakier-szorstki-po-myciu)

## felgi-i-opony | Felgi i opony
- Źródło: nowy opis (na podstawie starego tekstu)
- Tytuł w Google: Chemia do felg i opon – płyny i dressingi
- Opis w Google: Płyny do felg, kwaśne płyny, krwawa felga, powłoki do felg i dressingi do opon. Marki K2, Tenzi, SONAX, Plak i ADBL. Sklep w Białymstoku.

Na felgach osadza się pył z hamulców i brud z drogi, którego często nie zmyje zwykły szampon. W tej kategorii znajdziesz:

- [Płyny do felg](/kategoria/mycie-auta?sub=felgi-i-opony&typ=felgi-i-opony-plyny-do-felg): do regularnego mycia.
- [Kwaśne płyny do felg](/kategoria/mycie-auta?sub=felgi-i-opony&typ=felgi-i-opony-kwasne-plyny-do-felg): stosuj zgodnie z etykietą i sprawdź, do jakich felg producent je dopuszcza.
- [Krwawa felga](/kategoria/mycie-auta?sub=felgi-i-opony&typ=felgi-i-opony-krwawa-felga): preparaty, które barwią się w kontakcie z opiłkami z hamulców.
- [Powłoki do felg](/kategoria/mycie-auta?sub=felgi-i-opony&typ=felgi-i-opony-powloki-do-felg): zabezpieczenie felg po umyciu.
- [Dressingi do opon](/kategoria/mycie-auta?sub=felgi-i-opony&typ=felgi-i-opony-dressingi-do-opon): odświeżają wygląd opon.

Do mycia felg przydadzą się też [szczotki do felg](/kategoria/akcesoria-detailingowe?sub=szczotki-i-pedzle&typ=szczotki-i-pedzle-szczotki-do-felg). Porównanie produktów znajdziesz w przewodniku [Chemia do felg i opon – co wybrać](/blog/przewodnik-chemia-do-felg-i-opon).

## wnetrze-auta | Wnętrze auta
- Źródło: nowy opis
- Tytuł w Google: Chemia do wnętrza auta – kokpit, tapicerka, skóra
- Opis w Google: Środki do kokpitu i plastików, prania tapicerki, skóry i alcantary, klimatyzacji oraz zapachy do auta. Marki SONAX, K2, Plak, Tenzi i inne.

W dziale **Wnętrze auta** znajdziesz wszystko do sprzątania kabiny:

- [Kokpit i plastiki](/kategoria/wnetrze-auta?sub=kokpit-i-plastiki): cleanery, środki matowe i z połyskiem, ściereczki.
- [Tapicerka i dywaniki](/kategoria/wnetrze-auta?sub=tapicerka-i-dywaniki): pianki, środki do prania, odplamiacze i impregnaty.
- [Skóra i alcantara](/kategoria/wnetrze-auta?sub=skora-i-alcantara): czyszczenie i pielęgnacja skóry.
- [Klimatyzacja i nawiewy](/kategoria/wnetrze-auta?sub=klimatyzacja-i-nawiewy).
- [Zapachy i neutralizatory](/kategoria/wnetrze-auta?sub=zapachy-samochodowe): zawieszki, perfumy, neutralizatory i pochłaniacze wilgoci.

Kolejność sprzątania i listę zakupów opisujemy w poradnikach [Czyszczenie wnętrza samochodu krok po kroku](/blog/czyszczenie-wnetrza-samochodu) i [Pielęgnacja wnętrza auta – co kupić](/blog/przewodnik-pielegnacja-wnetrza-auta). Do wycierania przydadzą się [mikrofibry do szyb i wnętrza](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki&typ=mikrofibry-i-reczniki-mikrofibry-do-szyb-i-wnetrza).

## polerowanie-i-ochrona | Polerowanie i ochrona lakieru
- Źródło: nowy opis
- Tytuł w Google: Polerowanie i ochrona lakieru – pasty, woski, pady
- Opis w Google: Pasty polerskie i politury, pady, woski, powłoki, sealanty i quick detailery. SONAX Profiline, ADBL, K2 i Menzerna. Sklep w Białymstoku.

Ten dział jest dla tych, którzy chcą odświeżyć lakier i go zabezpieczyć.

**Polerowanie:** [pasty polerskie i politury](/kategoria/polerowanie-i-ochrona?sub=pasty-polerskie) (tnące, wykończeniowe, one step i do usuwania rys) oraz [pady i gąbki polerskie](/kategoria/polerowanie-i-ochrona?sub=pady-polerskie). Najwięcej jest tu produktów SONAX Profiline i padów ADBL.

**Ochrona:** [woski](/kategoria/polerowanie-i-ochrona?sub=woski) (w płynie, w sprayu, twarde i koloryzujące) oraz [powłoki, sealanty i quick detailery](/kategoria/polerowanie-i-ochrona?sub=powloki-i-quick-detailery).

Nie wiesz, czy rysę da się usunąć? Zajrzyj do poradnika [Jak usunąć drobne rysy z lakieru](/blog/jak-usunac-drobne-rysy-z-lakieru). O powłokach piszemy w artykułach [Ceramiczne zabezpieczenie lakieru](/blog/ceramiczne-zabezpieczenie-lakieru) i [Powłoka ceramiczna nie kropelkuje?](/blog/powloka-ceramiczna-nie-kropelkuje)

## woski | Woski
- Źródło: nowy opis
- Tytuł w Google: Woski samochodowe – w płynie, twarde, koloryzujące
- Opis w Google: Woski do auta w płynie i w sprayu, woski twarde i pasty oraz woski koloryzujące. Głównie SONAX, a także K2, ADBL i Tenzi. Wysyłka z Białegostoku.

Wosk nakłada się na czysty lakier, żeby nadać mu połysk i ochronę. W tej kategorii są trzy rodzaje:

- [Woski w płynie i w sprayu](/kategoria/polerowanie-i-ochrona?sub=woski&typ=woski-woski-w-plynie-i-sprayu)
- [Woski twarde i pasty](/kategoria/polerowanie-i-ochrona?sub=woski&typ=woski-woski-twarde-i-pasty)
- [Woski koloryzujące](/kategoria/polerowanie-i-ochrona?sub=woski&typ=woski-woski-koloryzujace): w kilku kolorach, do lakierów w podobnym odcieniu.

Przed woskowaniem lakier powinien być czysty. Pomogą w tym [szampony](/kategoria/mycie-auta?sub=szampony-i-piany) i środki z kategorii [Pre-wash i dekontaminacja](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja). Do nakładania i zbierania wosku przydadzą się [aplikatory](/kategoria/akcesoria-detailingowe?sub=gabki-rekawice-i-aplikatory&typ=gabki-rekawice-i-aplikatory-aplikatory) i [mikrofibry do polerowania](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki&typ=mikrofibry-i-reczniki-mikrofibry-do-polerowania).

## pasty-polerskie | Pasty polerskie i politury
- Źródło: nowy opis
- Tytuł w Google: Pasty polerskie i politury – SONAX Profiline
- Opis w Google: Pasty tnące, politury wykończeniowe, produkty one step (AIO) i środki do usuwania rys. SONAX Profiline, Menzerna i K2. Sklep w Białymstoku.

W tej kategorii są:

- [Pasty tnące](/kategoria/polerowanie-i-ochrona?sub=pasty-polerskie&typ=pasty-polerskie-pasty-tnace): do pierwszego etapu polerowania.
- [Politury wykończeniowe](/kategoria/polerowanie-i-ochrona?sub=pasty-polerskie&typ=pasty-polerskie-politury-wykonczeniowe): do ostatniego etapu i podbicia połysku.
- [One step i AIO](/kategoria/polerowanie-i-ochrona?sub=pasty-polerskie&typ=pasty-polerskie-one-step-i-aio): jeden produkt zamiast kilku etapów.
- [Usuwanie rys i regeneracja](/kategoria/polerowanie-i-ochrona?sub=pasty-polerskie&typ=pasty-polerskie-usuwanie-rys-i-regeneracja): m.in. mleczka i zestawy do drobnych rys.

Najwięcej jest tu produktów SONAX Profiline w opakowaniach 250 ml i 1 l. Do pasty dobierz odpowiedni [pad polerski](/kategoria/polerowanie-i-ochrona?sub=pady-polerskie). Zanim zaczniesz, przeczytaj [Jak usunąć drobne rysy z lakieru](/blog/jak-usunac-drobne-rysy-z-lakieru).

> Pytanie 1: czy wyjaśnić oznaczenia SONAX Profiline (np. 06/04, 4/6)? Zrobię to tylko na podstawie Twojego opisu albo materiałów SONAX.
> Pytanie 2: w tej kategorii jest „QUIXX zestaw do zarysowań na powierzchniach akrylowych”, czyli do tworzyw, nie do lakieru. Przenieść go?

## akcesoria-detailingowe | Akcesoria detailingowe
- Źródło: nowy opis (na podstawie starego tekstu)
- Tytuł w Google: Akcesoria detailingowe – opryskiwacze, mikrofibry
- Opis w Google: Opryskiwacze i pianownice Kwazar, mikrofibry i ręczniki, szczotki i pędzle, gąbki, rękawice i aplikatory. SONAX, ADBL, K2. Wysyłka z Białegostoku.

Nawet najlepsza chemia działa słabiej bez dobrych narzędzi. W tym dziale znajdziesz:

- [Opryskiwacze i pianownice](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice) Kwazar, razem z częściami zamiennymi.
- [Mikrofibry i ręczniki](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki): do osuszania, polerowania, szyb i wnętrza, a także irchy.
- [Szczotki i pędzle](/kategoria/akcesoria-detailingowe?sub=szczotki-i-pedzle): do felg, wnętrza, nadwozia i na wkrętarkę.
- [Gąbki, rękawice i aplikatory](/kategoria/akcesoria-detailingowe?sub=gabki-rekawice-i-aplikatory).

Kompletujesz pierwszy zestaw? Zobacz przewodnik [Pierwszy zestaw detailingowy – od czego zacząć](/blog/przewodnik-pierwszy-zestaw-detailingowy).

## opryskiwacze-i-pianownice | Opryskiwacze i pianownice
- Źródło: nowy opis (na podstawie starego tekstu)
- Tytuł w Google: Opryskiwacze i pianownice Kwazar – części i lance
- Opis w Google: Opryskiwacze ręczne i ciśnieniowe, pianownice oraz części Kwazar: lance (także teleskopowe), wężyki, rękojeści z manometrem. Wysyłka z Białegostoku.

Opryskiwacz pozwala nałożyć chemię równo i bez marnowania: na karoserię, felgi, wnętrze albo przed myciem. Wszystkie produkty w tej kategorii to marka Kwazar.

- [Opryskiwacze ręczne](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice&typ=opryskiwacze-i-pianownice-opryskiwacze-reczne): małe, od 0,5 l.
- [Opryskiwacze ciśnieniowe](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice&typ=opryskiwacze-i-pianownice-opryskiwacze-cisnieniowe): większe, np. Orion 6 l i 9 l.
- [Pianownice](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice&typ=opryskiwacze-i-pianownice-pianownice): do nakładania piany aktywnej.
- [Części do opryskiwaczy](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice&typ=opryskiwacze-i-pianownice-czesci-do-opryskiwaczy): lance (także teleskopowe 3 m i 5 m), wężyki, rękojeści z manometrem, końcówki.

W nazwach wielu modeli zobaczysz oznaczenia **alka line** i **acid line**. Przed zakupem sprawdź, jaką chemię będziesz nakładać, i dobierz wersję opryskiwacza. Oringi i zawory do pompek są w kategorii [Serwis i warsztat › Akcesoria](/kategoria/serwis-i-warsztat?sub=akcesoria).

> Pytanie: czy można napisać wprost, że „alka line” jest do chemii zasadowej, a „acid line” do kwaśnej? Nie dopiszę tego bez Twojego potwierdzenia. Czy oringi i zawory przenieść tutaj, do „Części do opryskiwaczy”?

## chemia-do-myjni | Chemia do myjni
- Źródło: nowy opis (na podstawie starego tekstu)
- Tytuł w Google: Chemia do myjni – piany aktywne, mycie bezdotykowe
- Opis w Google: Koncentraty dla myjni: piany aktywne, mycie bezdotykowe, mycie ciężarówek, woski i preparaty specjalistyczne. Easy Wash, Tenzi, Nerta, kanistry do 25 l.

Dział dla myjni, warsztatów i firm, które myją dużo i potrzebują większych opakowań: kanistrów 5, 10, 20 i 25 l. Najwięcej jest tu produktów Easy Wash, Tenzi i Nerta.

- [Mycie bezdotykowe i piany](/kategoria/chemia-do-myjni?sub=mycie-bezdotykowe): piany aktywne i preparaty do mycia bezdotykowego.
- [Ciężarówki i pojazdy użytkowe](/kategoria/chemia-do-myjni?sub=ciezarowki-i-pojazdy-uzytkowe): piany i środki do mycia ciężarówek, aut dostawczych i plandek.
- [Woski i nabłyszczacze do myjni](/kategoria/chemia-do-myjni?sub=woski-do-myjni).
- [Preparaty specjalistyczne](/kategoria/chemia-do-myjni?sub=preparaty-specjalistyczne): m.in. na owady i smołę, do mycia aluminium, odpieniacz i preparat do flokulacji.

Koncentraty rozcieńcza się przed użyciem. W [kalkulatorze rozcieńczania](/rozcienczanie) policzysz, ile preparatu dodać do wody. Masz pytanie o dobór chemii do myjni? [Zadzwoń lub napisz](/kontakt).

## serwis-i-warsztat | Serwis i warsztat
- Źródło: nowy opis (na podstawie starego tekstu)
- Tytuł w Google: Chemia warsztatowa – smary, zmywacze, pasty do rąk
- Opis w Google: Smary, oleje i odrdzewiacze, zmywacze i odtłuszczacze, kleje i naprawy, płyny eksploatacyjne, środki do silnika i DPF oraz pasty i mydła do rąk.

Produkty do warsztatu i bieżącej obsługi auta:

- [Smary, oleje i odrdzewiacze](/kategoria/serwis-i-warsztat?sub=smary-oleje-i-odrdzewiacze)
- [Zmywacze i odtłuszczacze](/kategoria/serwis-i-warsztat?sub=zmywacze-i-odtluszczacze): m.in. zmywacz do hamulców.
- [Kleje i naprawy](/kategoria/serwis-i-warsztat?sub=kleje-i-naprawy): np. pasta i zestaw do naprawy tłumików.
- [Płyny eksploatacyjne](/kategoria/serwis-i-warsztat?sub=plyny-eksploatacyjne)
- [Silnik, DPF i podwozie](/kategoria/serwis-i-warsztat?sub=silnik-i-podwozie)
- [Pasty i mydła do rąk](/kategoria/serwis-i-warsztat?sub=mycie-rak): do zmywania smarów i oleju z dłoni.
- [Akcesoria](/kategoria/serwis-i-warsztat?sub=akcesoria): drobne części do opryskiwaczy Kwazar.

W dziale są produkty K2, SONAX, Tenzi, Royal, Kwazar i innych marek.

## dom-i-ogrod | Dom i ogród
- Źródło: nowy opis (na podstawie starego tekstu)
- Tytuł w Google: Chemia do domu i ogrodu – łazienka, kuchnia, podłogi
- Opis w Google: Środki do łazienki i WC, kuchni, podłóg, okien, mebli, elewacji i kostki oraz odświeżacze i neutralizatory zapachów. Tenzi, Royal, Freshtek.

Oprócz chemii samochodowej mamy też środki do sprzątania domu, biura i terenu wokół domu. Najwięcej jest tu produktów Tenzi, Royal i Freshtek, w butelkach i w kanistrach.

- [Łazienka i WC](/kategoria/dom-i-ogrod?sub=lazienka-i-wc): sanitariaty, kabiny prysznicowe i kamień, toalety turystyczne.
- [Kuchnia](/kategoria/dom-i-ogrod?sub=kuchnia): mycie naczyń, piekarniki i grille, AGD i odkamienianie.
- [Podłogi i posadzki](/kategoria/dom-i-ogrod?sub=podlogi-i-posadzki)
- [Okna i lustra](/kategoria/dom-i-ogrod?sub=okna-i-lustra)
- [Meble i środki specjalne](/kategoria/dom-i-ogrod?sub=meble-i-powierzchnie): meble, udrażnianie rur, pleśń i dezynfekcja.
- [Ogród, elewacje i kamień](/kategoria/dom-i-ogrod?sub=ogrod-i-elewacje): kostka brukowa, elewacje i dachy, nagrobki, panele fotowoltaiczne.
- [Odświeżacze powietrza](/kategoria/dom-i-ogrod?sub=odswiezacze-powietrza) i [neutralizatory zapachów](/kategoria/dom-i-ogrod?sub=neutralizatory).

## neutralizatory | Neutralizatory zapachów
- Źródło: nowy opis
- Tytuł w Google: Neutralizatory zapachów Freshtek One Shot
- Opis w Google: Odświeżacze i neutralizatory zapachów Freshtek One Shot w opakowaniach 250 ml i 600 ml, w wielu zapachach, także w zestawach. Wysyłka z Białegostoku.

Freshtek One Shot to odświeżacze i neutralizatory zapachów w aerozolu, w opakowaniach 250 ml i 600 ml. Do wyboru jest wiele zapachów: od owocowych i kwiatowych, przez zieloną herbatę i bambus, po wersję Smoke Killer. Kupisz je pojedynczo albo w zestawach po 6 sztuk.

Szukasz zapachu do samochodu? Zajrzyj do kategorii [Zapachy i neutralizatory do auta](/kategoria/wnetrze-auta?sub=zapachy-samochodowe).

> Pytanie: w panelu ta kategoria nazywa się „neutralizatory” (małą literą). Zmienić nazwę na „Neutralizatory zapachów”? Czy dopisać, jak stosować One Shot? Wtedy proszę o tekst z etykiety.

---

# Opisy ze starego sklepu (WooCommerce), lekko poprawione

## plastiki-guma-i-detale | Plastiki, guma i detale
- Źródło: stary sklep – Plastiki zewnętrzne i guma
- Tytuł w Google: Plastiki zewnętrzne, guma i detale auta
- Opis w Google: Preparaty do plastików zewnętrznych, listew, uszczelek i gumy, a także do reflektorów, chromu, folii, dachów cabrio i mycia silnika.

**Plastiki zewnętrzne i guma** wymagają innych produktów niż lakier: preparatów do listew, uszczelek i elementów gumowych.

W tej kategorii znajdziesz środki odświeżające, czyszczące i konserwujące tworzywa sztuczne oraz gumę na zewnątrz pojazdu. Są tu też preparaty do reflektorów i lamp, chromu i metalu, folii PPF i winylu, dachów cabrio oraz do mycia silnika.

**Do czego się przydają?**

- odświeżanie listew i plastików zewnętrznych
- pielęgnacja uszczelek i elementów gumowych
- dbanie o detale: reflektory, chrom, folie

Środki do opon znajdziesz w kategorii [Felgi i opony](/kategoria/mycie-auta?sub=felgi-i-opony).

## szyby-i-lusterka | Szyby i lusterka
- Źródło: stary sklep – Szyby, lusterka i spryskiwacze
- Tytuł w Google: Chemia do szyb i lusterek – płyny, antypara
- Opis w Google: Płyny do szyb i spryskiwaczy, antypara, niewidzialne wycieraczki, polerowanie szyb i odmrażacze. Lepsza widoczność przez cały sezon.

Szyby, lusterka i spryskiwacze odpowiadają za widoczność i komfort jazdy, dlatego wymagają regularnego mycia i pielęgnacji.

Znajdziesz tu płyny do mycia szyb, płyny i koncentraty do spryskiwaczy, środki przeciw parowaniu, niewidzialne wycieraczki, preparaty do polerowania szyb i odmrażacze.

Do wycierania szyb przydadzą się [mikrofibry do szyb i wnętrza](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki&typ=mikrofibry-i-reczniki-mikrofibry-do-szyb-i-wnetrza). Smugi widać dopiero nocą? Przeczytaj poradnik [Smugi na szybie nocą](/blog/smugi-na-szybie-noca).

## plastiki-guma-i-detale-reflektory-i-lampy | Reflektory i lampy
- Źródło: stary sklep – Lampy i reflektory
- Tytuł w Google: Reflektory i lampy – czyszczenie i odnawianie
- Opis w Google: Preparaty do czyszczenia, polerowania i odświeżania reflektorów oraz lamp przednich i tylnych. Sklep w Białymstoku, wysyłka w całej Polsce.

**Lampy i reflektory** wpływają na wygląd auta i bezpieczeństwo jazdy, a zmatowiałe klosze pogarszają widoczność.

W tej kategorii znajdziesz preparaty do czyszczenia, polerowania i odświeżania reflektorów oraz lamp przednich i tylnych.

**Najczęstsze zastosowania:**

- usuwanie matowienia z reflektorów
- przywracanie przejrzystości kloszy
- poprawa widoczności po zimie

## kokpit-i-plastiki | Kokpit i plastiki
- Źródło: stary sklep – Kokpit i plastiki wewnętrzne
- Tytuł w Google: Środki do kokpitu i plastików wewnętrznych
- Opis w Google: Środki do kokpitu i plastików we wnętrzu auta: cleanery, preparaty matowe i z połyskiem oraz ściereczki. SONAX, Plak, K2 i inne marki.

**Kokpit i plastiki wewnętrzne** szybko zbierają kurz, tłuste ślady i zabrudzenia. Potrzebują delikatnych, ale skutecznych preparatów.

W ofercie są środki czyszczące, matujące i nabłyszczające do deski rozdzielczej, drzwi i elementów plastikowych oraz gotowe ściereczki.

**Zobacz też:** [skóra i alcantara](/kategoria/wnetrze-auta?sub=skora-i-alcantara), [mikrofibry](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki).

## tapicerka-i-dywaniki | Tapicerka i dywaniki
- Źródło: stary sklep
- Tytuł w Google: Tapicerka i dywaniki – pianki, pranie, odplamiacze
- Opis w Google: Pianki i płyny do czyszczenia tapicerki, środki do prania, odplamiacze i impregnaty do tkanin. Do foteli, dywaników i wykładzin w aucie.

**Tapicerka i dywaniki** wymagają produktów, które usuwają brud z materiału bez zostawiania plam i smug.

Znajdziesz tu pianki, płyny do prania i środki do czyszczenia tkanin, weluru oraz dywaników gumowych i tekstylnych, a także odplamiacze i impregnaty.

**Najczęstsze zastosowania:**

- usuwanie plam z tapicerki
- czyszczenie dywaników i wykładzin
- odświeżanie wnętrza po sezonie

## skora-i-alcantara | Skóra i alcantara
- Źródło: stary sklep
- Tytuł w Google: Skóra i alcantara – czyszczenie i pielęgnacja
- Opis w Google: Pianki, balsamy i preparaty do czyszczenia i pielęgnacji tapicerki skórzanej oraz alcantary w samochodzie. Sklep w Białymstoku.

**Skóra i alcantara** to materiały, które wymagają delikatnego, ale skutecznego czyszczenia i regularnej konserwacji.

W tej kategorii znajdziesz pianki, balsamy i preparaty do tapicerki skórzanej oraz alcantary.

**Zobacz też:** [tapicerka i dywaniki](/kategoria/wnetrze-auta?sub=tapicerka-i-dywaniki).

## klimatyzacja-i-nawiewy | Klimatyzacja i nawiewy
- Źródło: stary sklep
- Tytuł w Google: Klimatyzacja i nawiewy – odświeżanie i czyszczenie
- Opis w Google: Preparaty do odświeżania klimatyzacji i czyszczenia nawiewów w samochodzie. Pomagają usuwać nieprzyjemne zapachy z układu wentylacji.

**Klimatyzacja i nawiewy** odpowiadają za świeże powietrze w aucie, dlatego wymagają regularnego czyszczenia.

W ofercie są preparaty do odświeżania klimatyzacji i nawiewów oraz do usuwania nieprzyjemnych zapachów z układu wentylacji.

Skąd bierze się zapach, wyjaśniamy w poradniku [Klimatyzacja śmierdzi po uruchomieniu?](/blog/klimatyzacja-smierdzi-po-uruchomieniu) **Zobacz też:** [zapachy i neutralizatory](/kategoria/wnetrze-auta?sub=zapachy-samochodowe).

## zapachy-samochodowe | Zapachy i neutralizatory
- Źródło: stary sklep
- Tytuł w Google: Zapachy do auta – zawieszki, perfumy, neutralizatory
- Opis w Google: Zawieszki zapachowe, perfumy samochodowe, neutralizatory zapachów i pochłaniacze wilgoci do auta. Najwięcej produktów K2, a także SONAX i Tenzi.

**Zapachy i neutralizatory** pomagają utrzymać przyjemny zapach we wnętrzu auta i usuwać nieprzyjemne zapachy.

Znajdziesz tu zawieszki zapachowe, perfumy samochodowe, neutralizatory zapachów oraz pochłaniacze wilgoci.

**Zobacz też:** [klimatyzacja i nawiewy](/kategoria/wnetrze-auta?sub=klimatyzacja-i-nawiewy), [neutralizatory Freshtek One Shot](/kategoria/dom-i-ogrod?sub=neutralizatory).

## powloki-i-quick-detailery | Powłoki, sealanty i quick detailery
- Źródło: stary sklep – Woski i powłoki ochronne (dopasowane do nowej kategorii)
- Tytuł w Google: Powłoki, sealanty i quick detailery do lakieru
- Opis w Google: Powłoki ceramiczne, sealanty i quick detailery do regularnej ochrony i odświeżania lakieru. SONAX, Tenzi, ADBL, Menzerna i Plak.

**Powłoki, sealanty i quick detailery** zabezpieczają lakier przed wodą i brudem. W ofercie są powłoki ceramiczne, sealanty i środki do szybkiej ochrony oraz quick detailery do regularnej pielęgnacji.

Wolisz tradycyjny wosk? Zobacz kategorię [Woski](/kategoria/polerowanie-i-ochrona?sub=woski). Budujesz pierwszy zestaw? Zajrzyj do przewodnika [Pierwszy zestaw detailingowy](/blog/przewodnik-pierwszy-zestaw-detailingowy).

## mikrofibry-i-reczniki | Mikrofibry i ręczniki
- Źródło: stary sklep
- Tytuł w Google: Mikrofibry i ręczniki do auta – osuszanie, polerowanie
- Opis w Google: Ręczniki do osuszania, mikrofibry do polerowania, do szyb i wnętrza, mikrofibry uniwersalne i irchy. SONAX, K2, ADBL i Tenzi.

**Mikrofibry i irchy** to podstawowe wyposażenie przy myciu i wykańczaniu auta: od osuszania karoserii, przez rozprowadzanie quick detailerów, po pracę we wnętrzu. Każdy z tych materiałów ma inne zastosowanie i inaczej pracuje na powierzchni.

Mikrofibry dobrze zbierają brud i wodę, dlatego często używa się ich przy lakierze, szybach i plastikach. Irchy wciąż są wybierane tam, gdzie liczy się szybkie zebranie wody z dużej powierzchni.

W praktyce to właśnie one często decydują o tym, czy po myciu auto wygląda po prostu czysto, czy naprawdę starannie.

## meble-i-powierzchnie | Meble i środki specjalne
- Źródło: stary sklep – Inne środki do domu
- Tytuł w Google: Środki do mebli, udrażniania rur i na pleśń
- Opis w Google: Środki do mebli i powierzchni, udrażniania rur oraz na pleśń i do dezynfekcji. Tenzi, Royal i inne marki. Sklep w Białymstoku.

**Meble i środki specjalne** to produkty uzupełniające codzienną chemię domową: do pielęgnacji mebli i powierzchni, udrażniania rur, usuwania pleśni i dezynfekcji.

Znajdziesz tu preparaty, które nie pasują do innych działów, a przydają się w codziennym utrzymaniu czystości. **Zobacz też:** [cały dział Dom i ogród](/kategoria/dom-i-ogrod).

## mycie-rak | Pasty i mydła do rąk
- Źródło: stary sklep – Mydła i pasty do mycia rąk
- Tytuł w Google: Pasty i mydła do mycia rąk – warsztat
- Opis w Google: Pasty i mydła do usuwania smarów, olejów i trudnych zabrudzeń z dłoni: do warsztatu, zakładu i domu. Royal, Tenzi, K2 i inne marki.

**Pasty i mydła do mycia rąk** usuwają smary, oleje i trudne zabrudzenia z dłoni w warsztacie, w zakładzie i na co dzień.

W ofercie są pasty, mydła przemysłowe i preparaty do intensywnego mycia rąk. **Zobacz też:** [Serwis i warsztat](/kategoria/serwis-i-warsztat), [Dom i ogród](/kategoria/dom-i-ogrod).

## ogrod-i-elewacje | Ogród, elewacje i kamień
- Źródło: stary sklep – Czyszczenie na zewnątrz
- Tytuł w Google: Chemia do elewacji, kostki brukowej i kamienia
- Opis w Google: Preparaty do czyszczenia kostki brukowej, elewacji i dachów, nagrobków i kamienia oraz paneli fotowoltaicznych. Głównie marka Tenzi.

**Ogród i przestrzeń na zewnątrz** wymagają skutecznej chemii do czyszczenia tarasów, podjazdów, elewacji i elementów małej architektury.

W ofercie są preparaty do usuwania zabrudzeń, mchu i osadów z powierzchni zewnętrznych, a także do nagrobków, kamienia i paneli fotowoltaicznych.

**Najczęstsze zastosowania:**

- mycie tarasów i kostki brukowej
- czyszczenie elewacji i ogrodzeń
- pielęgnacja powierzchni na zewnątrz domu

## kuchnia | Kuchnia
- Źródło: stary sklep
- Tytuł w Google: Chemia do kuchni – naczynia, piekarniki, AGD
- Opis w Google: Płyny do naczyń, środki do piekarników, grilli i odtłuszczania oraz do AGD i odkamieniania. Głównie Tenzi, w butelkach i kanistrach 5 l.

**Chemia do kuchni** to preparaty do usuwania tłuszczu, zabrudzeń i osadów z blatów, kuchenek, okapów i powierzchni roboczych, a także do mycia naczyń i odkamieniania sprzętu AGD.

**Najczęstsze zastosowania:**

- usuwanie tłuszczu i osadów po gotowaniu
- mycie blatów i powierzchni roboczych
- czyszczenie sprzętu AGD w kuchni

**Zobacz też:** [Okna i lustra](/kategoria/dom-i-ogrod?sub=okna-i-lustra), [Podłogi i posadzki](/kategoria/dom-i-ogrod?sub=podlogi-i-posadzki).

## lazienka-i-wc | Łazienka i WC
- Źródło: stary sklep – Łazienka
- Tytuł w Google: Chemia do łazienki i WC – kamień, sanitariaty
- Opis w Google: Środki do sanitariatów i WC, kabin prysznicowych i usuwania kamienia oraz do toalet turystycznych. Royal i Tenzi, także w kanistrach.

**Czyszczenie łazienki** wymaga środków do regularnej pielęgnacji armatury, płytek, kabin prysznicowych i sanitariatów, żeby nie zostawał kamień, osad ani smugi.

W ofercie są preparaty do codziennego mycia, do usuwania uporczywych nalotów oraz do toalet turystycznych.

**Na co zwrócić uwagę?**

- dobór środka do rodzaju powierzchni
- usuwanie kamienia z armatury i szyb kabiny
- regularna pielęgnacja, która zapobiega trudnym osadom

## podlogi-i-posadzki | Podłogi i posadzki
- Źródło: stary sklep – Podłogi
- Tytuł w Google: Środki do mycia podłóg i posadzek
- Opis w Google: Płyny do codziennego mycia i doczyszczania podłóg i posadzek w domu, biurze i lokalach. Tenzi i Royal, w butelkach 1 l i kanistrach 5 l.

**Środki do czyszczenia i pielęgnacji podłóg** pomagają myć i chronić posadzki w domu, biurze i przestrzeniach użytkowych.

Znajdziesz tu chemię do różnych rodzajów posadzek: od codziennego mycia po doczyszczanie.

**Najczęstsze zastosowania:**

- mycie podłóg w domu i biurze
- pielęgnacja paneli, płytek i powierzchni woskowanych
- usuwanie trudnych zabrudzeń z posadzek

## okna-i-lustra | Okna i lustra
- Źródło: stary sklep (skrócony)
- Tytuł w Google: Płyny do mycia okien i luster
- Opis w Google: Płyny do mycia okien, luster i powierzchni szklanych do domu i firmy. Tenzi, Royal i Plak, w butelkach 1 l i kanistrach 5 l.

**Czyszczenie okien i luster** wymaga środków, które zostawiają szkło przejrzyste, bez smug i zacieków.

W tej kategorii znajdziesz preparaty, które usuwają kurz, tłuste plamy i osady z powierzchni szklanych. Sprawdzają się zarówno w domu, jak i w firmie.

## odswiezacze-powietrza | Odświeżacze powietrza
- Źródło: stary sklep
- Tytuł w Google: Odświeżacze powietrza do domu i biura
- Opis w Google: Odświeżacze powietrza do domu, biura i lokali, w opakowaniach od 0,5 l do 5 l. Royal i Easy Wash. Sklep w Białymstoku, wysyłka w całej Polsce.

**Odświeżacze powietrza do domu** pomagają utrzymać przyjemny zapach w pomieszczeniach i neutralizować nieprzyjemne zapachy.

**Najczęstsze zastosowania:**

- odświeżanie salonu, kuchni i łazienki
- neutralizacja zapachów po gotowaniu
- przyjemny zapach w domu i biurze

**Zobacz też:** [neutralizatory Freshtek One Shot](/kategoria/dom-i-ogrod?sub=neutralizatory), [zapachy do auta](/kategoria/wnetrze-auta?sub=zapachy-samochodowe).

---

# Opisy pozostałych kategorii (6 listopada 2026, wgrane na prośbę właściciela)

Napisane na podstawie nazw produktów, które naprawdę są w danej kategorii. Bez danych o chemii spoza kart produktów.

## szampony-i-piany-szampony-samochodowe | Szampony samochodowe
- Źródło: nowy opis
- Tytuł w Google: Szampony samochodowe – z woskiem, ceramiczne
- Opis w Google: Szampony do ręcznego mycia auta: z woskiem, z kwarcem, ceramiczne i koncentraty 2w1. SONAX, Tenzi, Autobella – od 500 ml do 10 kg.

**Szampon samochodowy** to podstawowy środek do ręcznego mycia karoserii wiadrem i rękawicą. W tej kategorii znajdziesz kilka rodzajów:

- szampony z woskiem, np. SONAX Szampon z woskiem i Autobella Lavaincera,
- szampony z kwarcem i ceramiczne, np. Tenzi Quartz Shampoo i SONAX Xtreme Aktywny Szampon Ceramiczny,
- koncentraty, np. SONAX Xtreme Szampon 2w1,
- Tenzi Mud Off do motocykli, quadów i aut terenowych.

Opakowania: od 500 ml, przez 1–2 l, po 10 kg dla myjni i warsztatów. Ile koncentratu dodać do wiadra, sprawdzisz na etykiecie, a przeliczysz w [kalkulatorze rozcieńczania](/rozcienczanie). Do mycia przyda się [rękawica lub gąbka](/kategoria/akcesoria-detailingowe?sub=gabki-rekawice-i-aplikatory&typ=gabki-rekawice-i-aplikatory-rekawice-i-gabki-do-mycia). Jak myć krok po kroku, opisujemy w poradniku [Jak prawidłowo myć samochód](/blog/jak-prawidlowo-myc-samochod).

## szampony-i-piany-piany-aktywne | Piany aktywne
- Źródło: nowy opis
- Tytuł w Google: Piana aktywna do auta – koncentraty 1 l
- Opis w Google: Piany aktywne w koncentracie do mycia wstępnego auta: SONAX Actifoam Energy, ADBL Yeti, Shine Chemicals Snow Ultra. Do pianownicy i myjni.

**Piana aktywna** służy do mycia wstępnego. Nakładasz ją na brudne auto, zanim dotkniesz lakieru rękawicą, dzięki czemu część brudu schodzi bez tarcia.

W tej kategorii są koncentraty w butelkach 1 l:

- SONAX Actifoam Energy,
- ADBL Yeti Polinesian Forest,
- Shine Chemicals Snow Ultra.

Pianę nakłada się [pianownicą](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice&typ=opryskiwacze-i-pianownice-pianownice) albo lancą pianującą na myjni. Łagodniejsze wersje znajdziesz w kategorii [Neutralne piany pH](/kategoria/mycie-auta?sub=szampony-i-piany&typ=szampony-i-piany-neutralne-piany-ph), a duże kanistry dla myjni w dziale [Mycie bezdotykowe i piany](/kategoria/chemia-do-myjni?sub=mycie-bezdotykowe). Czy piana zmywa wosk? Odpowiadamy w poradniku [Czy piana aktywna zmywa wosk](/blog/czy-piana-aktywna-zmywa-wosk).

## szampony-i-piany-neutralne-piany-ph | Neutralne piany pH
- Źródło: nowy opis
- Tytuł w Google: Neutralna piana pH do mycia auta – Tenzi
- Opis w Google: Neutralne piany do mycia samochodu Tenzi Neutral Magic Foam: przezroczysta Clear (1 l i 5 l) i kolorowa Pink (1 l). Do pianownicy.

**Neutralna piana pH** to piana do mycia wstępnego o neutralnym odczynie, tak jak opisuje ją producent. W tej kategorii są piany Tenzi Neutral Magic Foam:

- Clear: przezroczysta, w butelce 1 l i kanistrze 5 l,
- Pink: kolorowa, w butelce 1 l.

Pianę nakłada się [pianownicą lub opryskiwaczem](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice). Mocniejsze piany do brudniejszych aut znajdziesz w kategorii [Piany aktywne](/kategoria/mycie-auta?sub=szampony-i-piany&typ=szampony-i-piany-piany-aktywne). Czy piana może osłabić wosk lub powłokę ceramiczną, wyjaśniamy w poradniku [Czy piana aktywna zmywa wosk](/blog/czy-piana-aktywna-zmywa-wosk).

## pre-wash-i-dekontaminacja-usuwanie-owadow | Usuwanie owadów
- Źródło: nowy opis
- Tytuł w Google: Płyn do usuwania owadów z lakieru i szyb
- Opis w Google: Preparaty do usuwania owadów z karoserii i szyb: SONAX, Tenzi Mosquitos, Plak Netins, Easy Wash Insekt Remover, Soft99 i inne. Wysyłka z Białegostoku.

Zaschnięte owady na zderzaku, masce i szybie trudno zmyć samym szamponem. **Płyn do usuwania owadów** nakłada się przed myciem, żeby je rozmiękczyć.

W tej kategorii znajdziesz:

- SONAX Do usuwania owadów 500 ml (do szyb i lakieru),
- Tenzi Mosquitos 1 l,
- Plak Netins 750 ml i Netins 500 ml,
- Easy Wash Insekt Remover 1 l,
- Soft99 New Pitch Cleaner (na owady i smołę),
- Royal Stain Remover (pianka na czarne smugi, zacieki i owady).

Dla myjni są większe opakowania w kategorii [Preparaty specjalistyczne](/kategoria/chemia-do-myjni?sub=preparaty-specjalistyczne). Dlaczego warto usuwać owady szybko, piszemy w poradniku [Usuwanie owadów z lakieru](/blog/usuwanie-owadow-z-lakieru-samochodu).

## pre-wash-i-dekontaminacja-usuwanie-smoly-kleju-i-zywicy | Usuwanie smoły, kleju i żywicy
- Źródło: nowy opis
- Tytuł w Google: Usuwanie smoły, kleju i żywicy z lakieru
- Opis w Google: Preparaty do usuwania smoły, asfaltu, kleju, naklejek i żywicy: SONAX, K2 Tar Remover, Easy Wash, Tenzi Rubber Off, SJD i inne.

Smoła z drogi, ślady po naklejkach i krople żywicy to zabrudzenia, które wymagają osobnych środków. W tej kategorii są:

- na **smołę i asfalt**: SONAX Preparat do usuwania smoły, K2 Tar Remover, Easy Wash Tar Remover, Decabit,
- na **klej i naklejki**: SONAX Professional Preparat do usuwania etykiet i kleju, SJD Zmywacz Cytrusowy,
- na **ślady gumy i opon**: Tenzi Rubber Off,
- na **żywicę**: Resinol.

Przed użyciem przeczytaj etykietę i sprawdź środek na małym fragmencie. Jak usunąć asfalt bez rys i zacieków, opisujemy w poradniku [Jak usunąć asfalt z lakieru](/blog/jak-usunac-asfalt-z-lakieru). Dla myjni: [Preparaty specjalistyczne](/kategoria/chemia-do-myjni?sub=preparaty-specjalistyczne).

## pre-wash-i-dekontaminacja-usuwanie-osadow-i-rdzy | Usuwanie osadów i rdzy
- Źródło: nowy opis
- Tytuł w Google: Usuwanie osadów, rdzy lotnej i betonu z auta
- Opis w Google: Preparaty do usuwania śladów twardej wody, nalotów rdzy, osadów i zaschniętego betonu z auta: SONAX Profiline, SONAX, Tenzi Betorast i inne.

W tej kategorii są preparaty na zabrudzenia, których nie usuwa zwykłe mycie:

- **ślady po twardej wodzie**: SONAX Profiline Waterspot Remover,
- **naloty rdzy i pyły**: SONAX Do usuwania nalotów rdzy,
- **rdza, kamień i beton**: Tenzi Betorast (koncentrat 5 l) i BetonCleaner Strong.

Szorstki lakier po myciu często oznacza osady, których nie widać gołym okiem. Więcej w poradniku [Lakier szorstki po myciu?](/blog/lakier-szorstki-po-myciu) Zanim użyjesz preparatu, przeczytaj etykietę i sprawdź, na jakich powierzchniach można go stosować.

## pre-wash-i-dekontaminacja-odtluszczacze-i-ipa | Odtłuszczacze i IPA
- Źródło: nowy opis
- Tytuł w Google: IPA i odtłuszczacze do lakieru – Tenzi, ADBL
- Opis w Google: Alkohol izopropylowy (IPA) i odtłuszczacze do lakieru, szyb i felg: Tenzi IPA Cleaner 1 l i 5 l, ADBL IPA, SONAX Profiline Lack Prepare.

**Odtłuszczacz i IPA** (alkohol izopropylowy) służą do odtłuszczania powierzchni, np. lakieru po polerowaniu albo przed nałożeniem wosku czy powłoki.

W tej kategorii znajdziesz:

- Tenzi IPA Cleaner 1 l i 5 l (do lakieru, szyb i felg),
- ADBL IPA 1 l,
- SONAX Profiline Lack Prepare 400 ml (przygotowanie powierzchni),
- Tenzi Odtłuszczacz uniwersalny 1 l,
- Vinet Preparat odtłuszczający 1,9 kg (koncentrat).

Po odtłuszczeniu możesz przejść do ochrony lakieru: zobacz [woski](/kategoria/polerowanie-i-ochrona?sub=woski) oraz [powłoki i sealanty](/kategoria/polerowanie-i-ochrona?sub=powloki-i-quick-detailery).

## pre-wash-i-dekontaminacja-apc-i-srodki-uniwersalne | APC i środki uniwersalne
- Źródło: nowy opis
- Tytuł w Google: APC do auta – uniwersalne środki czyszczące
- Opis w Google: APC i uniwersalne środki do mycia auta i usuwania tłustego brudu: Tenzi Brudex, Tenzi APC In, ADBL APC 5 l, SONAX Profiline pianka APC.

**APC** (z ang. all purpose cleaner) to uniwersalny środek czyszczący. Przydaje się w wielu miejscach auta, np. przy tłustym brudzie, plastikach czy progach.

W tej kategorii są:

- Tenzi Brudex 1 l i 5 l (na tłusty brud),
- Tenzi APC In 1 l (koncentrat do powierzchni wewnętrznych),
- ADBL APC 5 l,
- SONAX Profiline Pianka do czyszczenia powierzchni APC 400 ml.

Koncentraty rozcieńcza się zgodnie z etykietą, a pomoże w tym [kalkulator rozcieńczania](/rozcienczanie). Do nakładania wygodny jest [opryskiwacz ręczny](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice&typ=opryskiwacze-i-pianownice-opryskiwacze-reczne).

## felgi-i-opony-plyny-do-felg | Płyny do felg
- Źródło: nowy opis
- Tytuł w Google: Płyn do mycia felg – SONAX, K2, Plak, Tenzi
- Opis w Google: Płyny i żele do mycia felg: zasadowe, o neutralnym pH, do felg lakierowanych i nielakierowanych. SONAX, K2 Roton Pro, Plak, Tenzi, Nerta, Easy Wash.

**Płyn do felg** usuwa pył z hamulców i brud drogowy z felg i kołpaków. W tej kategorii znajdziesz środki do regularnego mycia:

- SONAX Żel do mycia felg i SONAX Xtreme Do czyszczenia felg,
- K2 Roton Pro (według producenta o neutralnym pH) i K2 Felix,
- Plak Lacer do felg lakierowanych i Plak Forlega do felg nielakierowanych,
- Tenzi En-Jee do każdego rodzaju felg, kołpaków i ogumienia,
- zasadowe preparaty dla myjni: Nerta Wheelshine Super 5 l, Easy Wash Wheel Cleaner, Lacer 10 kg.

Sprawdź na etykiecie, do jakich felg jest dany środek. Preparaty zmieniające kolor są w kategorii [Krwawa felga](/kategoria/mycie-auta?sub=felgi-i-opony&typ=felgi-i-opony-krwawa-felga), a mocniejsze w [Kwaśne płyny do felg](/kategoria/mycie-auta?sub=felgi-i-opony&typ=felgi-i-opony-kwasne-plyny-do-felg). Porównanie znajdziesz w przewodniku [Chemia do felg i opon](/blog/przewodnik-chemia-do-felg-i-opon).

## felgi-i-opony-krwawa-felga | Krwawa felga
- Źródło: nowy opis
- Tytuł w Google: Krwawa felga – płyn do felg zmieniający kolor
- Opis w Google: Płyny typu krwawa felga do usuwania opiłków z hamulców: K2 Roton, ADBL Vampire Liquid, Tenzi Prix i Tenzi Detailer Krwawa Felga.

**Krwawa felga** to potoczna nazwa preparatów, które barwią się na czerwono, gdy rozpuszczają opiłki metalu z klocków i tarcz hamulcowych. Widać wtedy, gdzie środek działa.

W tej kategorii są:

- K2 Roton 700 ml,
- ADBL Vampire Liquid 500 ml (do felg i karoserii),
- Tenzi Prix 1 l,
- Tenzi Detailer Krwawa Felga 600 ml.

Do felg przyda się [szczotka lub pędzel](/kategoria/akcesoria-detailingowe?sub=szczotki-i-pedzle&typ=szczotki-i-pedzle-szczotki-do-felg). Dlaczego pył z hamulców ma znaczenie, piszemy w artykule [Euro 7 a pył z hamulców](/blog/euro-7-pyl-z-hamulcow).

## felgi-i-opony-kwasne-plyny-do-felg | Kwaśne płyny do felg
- Źródło: nowy opis
- Tytuł w Google: Kwaśny płyn do felg – Tenzi Alux
- Opis w Google: Kwasowe preparaty do czyszczenia felg Tenzi Alux: koncentrat 1 l i 5 l oraz Alux GT 1 l gotowy do użycia. Stosuj zgodnie z etykietą.

**Kwaśny płyn do felg** to środek do zadań, przy których zwykły płyn nie wystarcza, np. przy starym, zapieczonym brudzie. W tej kategorii są preparaty Tenzi Alux:

- Alux 1 l i 5 l (koncentrat),
- Alux GT 1 l (gotowy do użycia).

Kwaśne preparaty stosuj ściśle według etykiety i sprawdź, do jakich felg producent je dopuszcza. Do regularnego mycia lepiej sprawdzą się [płyny do felg](/kategoria/mycie-auta?sub=felgi-i-opony&typ=felgi-i-opony-plyny-do-felg). Do nakładania chemii przyda się [opryskiwacz ręczny](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice&typ=opryskiwacze-i-pianownice-opryskiwacze-reczne).

## felgi-i-opony-powloki-do-felg | Powłoki do felg
- Źródło: nowy opis
- Tytuł w Google: Powłoka do felg – SONAX 250 ml
- Opis w Google: SONAX powłoka zabezpieczająca do felg 250 ml (250100). Zabezpieczenie felg po umyciu. Sklep w Białymstoku, wysyłka w całej Polsce.

**Powłoka do felg** to zabezpieczenie nakładane na czyste felgi. W tej kategorii jest SONAX powłoka zabezpieczająca do felg 250 ml (kod 250100).

Przed nałożeniem felgi muszą być dokładnie umyte. Pomogą w tym [płyny do felg](/kategoria/mycie-auta?sub=felgi-i-opony&typ=felgi-i-opony-plyny-do-felg) i [szczotki do felg](/kategoria/akcesoria-detailingowe?sub=szczotki-i-pedzle&typ=szczotki-i-pedzle-szczotki-do-felg). Sposób nakładania i czas schnięcia sprawdź na etykiecie produktu.

## felgi-i-opony-dressingi-do-opon | Dressingi do opon
- Źródło: nowy opis
- Tytuł w Google: Dressing do opon – nabłyszczanie i czernienie
- Opis w Google: Dressingi, pianki i żele do opon: efekt mokrej gumy albo mat. SONAX Xtreme, K2 Bold i Sigma, Plak Czarna Opona, ADBL. Od 400 ml do 5 l.

**Dressing do opon** odświeża wygląd gumy po umyciu auta. Możesz wybrać efekt połysku albo matu:

- **połysk**: SONAX Xtreme Wet Look, K2 Bold (600 ml i 5 l), K2 Sigma żel, Plak Czarna Opona,
- **mat**: SONAX Xtreme Środek do konserwacji opon matowy,
- **pianki do czyszczenia i pielęgnacji**: SONAX Pianka do opon, Plak Practical Line,
- **do mycia opon i gumy przed dressingiem**: ADBL Tire and Rubber Cleaner.

Dressing najwygodniej nakłada się [aplikatorem do opon](/kategoria/akcesoria-detailingowe?sub=gabki-rekawice-i-aplikatory&typ=gabki-rekawice-i-aplikatory-aplikatory). Gumę i uszczelki pielęgnują środki z kategorii [Guma i uszczelki](/kategoria/mycie-auta?sub=plastiki-guma-i-detale&typ=plastiki-guma-i-detale-guma-i-uszczelki).

## szyby-i-lusterka-plyny-do-szyb | Płyny do szyb
- Źródło: nowy opis
- Tytuł w Google: Płyn do mycia szyb samochodowych i ściereczki
- Opis w Google: Płyny do mycia szyb i lusterek w aucie oraz ściereczki do szyb: SONAX, K2 Nuta, Tenzi Glass, Soft99, Easy Wash, Plak i inne.

**Płyn do szyb** usuwa tłuste ślady, kurz i osad z szyb i lusterek, tak żeby nie zostały smugi. W tej kategorii znajdziesz:

- SONAX Płyn do mycia szyb (do tłustych zabrudzeń i nikotyny) i SONAX Xtreme Pure Water,
- K2 Nuta Glass Cleaner 750 ml,
- Tenzi Glass 1 l (koncentrat, do szyb, luster i reflektorów),
- Soft99 Glaco De Cleaner, Easy Wash Window Cleaner, Cartec Glass Cleaner XL,
- gotowe ściereczki do szyb: SONAX (25 szt.) i Plak (24 szt.).

Do wycierania przydadzą się [mikrofibry do szyb](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki&typ=mikrofibry-i-reczniki-mikrofibry-do-szyb-i-wnetrza). Szyba czysta w dzień, a w nocy widać smugi? Przeczytaj poradnik [Smugi na szybie nocą](/blog/smugi-na-szybie-noca).

## szyby-i-lusterka-plyny-do-spryskiwaczy | Płyny do spryskiwaczy
- Źródło: nowy opis
- Tytuł w Google: Płyn do spryskiwaczy – zimowy i letni, koncentraty
- Opis w Google: Zimowe i letnie płyny do spryskiwaczy oraz koncentraty: SONAX, SONAX Xtreme NanoPro, K2 Claren -80°C, Plak Ice Fresh -60°C. Od 250 ml do 4 l.

W tej kategorii są **płyny do spryskiwaczy** na zimę i na lato, gotowe i w koncentracie:

- **zimowe koncentraty**: K2 Claren (do -80°C według nazwy), Plak Ice Fresh (do -60°C), SONAX Zimowy płyn do spryskiwaczy 1 l,
- **letnie**: SONAX Letni płyn NanoPro 4 l, SONAX Letni płyn cytrynowy 4 l, SONAX Xtreme koncentrat 1:100 (250 ml), Moje Auto koncentrat 250 ml.

Koncentrat trzeba rozcieńczyć zgodnie z etykietą. Proporcję przeliczysz w [kalkulatorze rozcieńczania](/rozcienczanie). Zimą przyda się też [odmrażacz do szyb](/kategoria/mycie-auta?sub=szyby-i-lusterka&typ=szyby-i-lusterka-odmrazacze).

## szyby-i-lusterka-niewidzialne-wycieraczki-i-powloki | Niewidzialne wycieraczki i powłoki
- Źródło: nowy opis
- Tytuł w Google: Niewidzialna wycieraczka – Soft99 Glaco i inne
- Opis w Google: Niewidzialne wycieraczki i powłoki hydrofobowe do szyb: Soft99 Glaco DX i Glaco Roll-on, ADBL Hybrid Glass, Tenzi Glass Quartz GT.

**Niewidzialna wycieraczka** to powłoka na szybę, po której woda łatwiej spływa. W tej kategorii znajdziesz:

- Soft99 Glaco DX 110 ml i Glaco Roll-on Large 120 ml,
- ADBL Hybrid Glass 500 ml (płyn do szyb z niewidzialną wycieraczką),
- Tenzi Glass Quartz GT 1 l (płyn hydrofobowy).

Powłokę nakłada się na czystą, odtłuszczoną szybę. Starą powłokę i osady usuniesz środkami z kategorii [Polerowanie szyb](/kategoria/mycie-auta?sub=szyby-i-lusterka&typ=szyby-i-lusterka-polerowanie-szyb).

## szyby-i-lusterka-polerowanie-szyb | Polerowanie szyb
- Źródło: nowy opis
- Tytuł w Google: Polerowanie szyb – pasty i preparaty do szkła
- Opis w Google: Preparaty do głębokiego czyszczenia i polerowania szyb: SONAX Profiline Glass Polish, SONAX do intensywnego czyszczenia, Soft99 Glass Compound.

W tej kategorii są preparaty do **głębokiego czyszczenia i polerowania szyb**, gdy zwykły płyn nie wystarcza:

- SONAX Profiline Glass Polish 250 ml (do polerowania szyb),
- SONAX Do intensywnego czyszczenia szyb 250 ml (usuwa stare powłoki ochronne),
- Soft99 Glass Compound Z 100 ml i Glaco Glass Compound Roll-On.

Po wyczyszczeniu szyby możesz nałożyć [niewidzialną wycieraczkę](/kategoria/mycie-auta?sub=szyby-i-lusterka&typ=szyby-i-lusterka-niewidzialne-wycieraczki-i-powloki). Skąd biorą się smugi widoczne w nocy, wyjaśniamy w poradniku [Smugi na szybie nocą](/blog/smugi-na-szybie-noca).

## szyby-i-lusterka-antypara | Antypara
- Źródło: nowy opis
- Tytuł w Google: Antypara do szyb – preparaty przeciw parowaniu
- Opis w Google: Preparaty i ściereczki przeciw parowaniu szyb i lusterek w aucie: SONAX Antyroszeniowy, K2 Fox, Rain-X. Jesień i zima bez zaparowanych szyb.

**Antypara** to preparat, który ogranicza parowanie szyb od środka auta. Przydaje się jesienią i zimą. W tej kategorii znajdziesz:

- SONAX Antyroszeniowy preparat do szyb,
- SONAX Ściereczka antyroszeniowa,
- K2 Fox 150 ml,
- Rain-X Zapobiega zaparowaniu szyb i lusterek 200 ml.

Na wilgoć w kabinie pomoże też [pochłaniacz wilgoci](/kategoria/wnetrze-auta?sub=zapachy-samochodowe&typ=zapachy-samochodowe-pochlaniacze-wilgoci). Do szyb przyda się [gąbka antyroszeniowa SONAX 2w1](/kategoria/akcesoria-detailingowe?sub=gabki-rekawice-i-aplikatory&typ=gabki-rekawice-i-aplikatory-rekawice-i-gabki-do-mycia).

## szyby-i-lusterka-odmrazacze | Odmrażacze
- Źródło: nowy opis
- Tytuł w Google: Odmrażacz do szyb SONAX 500 ml
- Opis w Google: Odmrażacz do szyb SONAX 500 ml (331241). Szybkie usuwanie lodu i szronu z szyb zimą. Sklep w Białymstoku, wysyłka w całej Polsce.

**Odmrażacz do szyb** pomaga zimą szybciej pozbyć się lodu i szronu z szyby. W tej kategorii jest SONAX Odmrażacz do szyb 500 ml (kod 331241).

Na zimę przygotuj też [zimowy płyn do spryskiwaczy](/kategoria/mycie-auta?sub=szyby-i-lusterka&typ=szyby-i-lusterka-plyny-do-spryskiwaczy) i [antyparę](/kategoria/mycie-auta?sub=szyby-i-lusterka&typ=szyby-i-lusterka-antypara). Odmrażacz do zamków jest w kategorii [Płyny eksploatacyjne](/kategoria/serwis-i-warsztat?sub=plyny-eksploatacyjne).

## plastiki-guma-i-detale-plastiki-zewnetrzne | Plastiki zewnętrzne
- Źródło: nowy opis
- Tytuł w Google: Środki do plastików zewnętrznych auta
- Opis w Google: Preparaty do czarnych plastików zewnętrznych, zderzaków i przezroczystych tworzyw: SONAX, SONAX Xtreme, K2 Bono, ADBL Matt Max, Plak, Easy Wash Vinyl.

Zderzaki, listwy i nakładki z czarnego plastiku z czasem szarzeją. W tej kategorii są **środki do plastików zewnętrznych**:

- **odnowienie czarnych plastików**: SONAX Odnawia czarne plastiki zewnętrzne, SONAX Xtreme Żel do plastików zewnętrznych, K2 Bono,
- **matowy dressing**: ADBL Matt Max 1 l,
- **nabłyszczanie**: Plak do zderzaków i spojlerów, Easy Wash Vinyl 1 l i 5 l (do gumy i plastiku),
- **przezroczyste plastiki**: SONAX Do renowacji przezroczystych plastików, Soft99 Nano Hard Clear.

Przed nałożeniem plastik powinien być czysty. Pomoże [APC](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja&typ=pre-wash-i-dekontaminacja-apc-i-srodki-uniwersalne). Środki do plastików we wnętrzu są w kategorii [Kokpit i plastiki](/kategoria/wnetrze-auta?sub=kokpit-i-plastiki).

## plastiki-guma-i-detale-guma-i-uszczelki | Guma i uszczelki
- Źródło: nowy opis
- Tytuł w Google: Silikon do uszczelek i preparaty do gumy
- Opis w Google: Silikon do uszczelek SONAX i Plak Siling oraz SONAX Preparat do pielęgnacji gumy. Pielęgnacja uszczelek drzwi i elementów gumowych.

Uszczelki drzwi i bagażnika oraz inne gumowe elementy auta też wymagają pielęgnacji. W tej kategorii są:

- SONAX Silikon do uszczelek 100 ml,
- SONAX Preparat do pielęgnacji gumy 300 ml,
- Plak Siling Silikon do uszczelek 250 ml.

Silikon do uszczelek warto nałożyć jesienią, przed pierwszymi mrozami. Środki do opon znajdziesz w kategorii [Dressingi do opon](/kategoria/mycie-auta?sub=felgi-i-opony&typ=felgi-i-opony-dressingi-do-opon).

## plastiki-guma-i-detale-chrom-i-metal | Chrom i metal
- Źródło: nowy opis
- Tytuł w Google: Pasta do chromu i metalu – SONAX, Menzerna
- Opis w Google: Pasty i preparaty do czyszczenia i polerowania chromu, aluminium i metalu: SONAX Pasta do chromu i aluminium, Menzerna Metal Polish, Soft99.

W tej kategorii są środki do **chromu, aluminium i innych metali** w aucie i motocyklu:

- SONAX Pasta do chromu i aluminium 75 ml (czyści i konserwuje),
- Menzerna Metal Polish 125 g (pasta polerska do metalu),
- Soft99 Chrome Cleaner 125 ml (nieścierny środek do chromu).

Do polerowania przydadzą się [mikrofibry do polerowania](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki&typ=mikrofibry-i-reczniki-mikrofibry-do-polerowania).

## plastiki-guma-i-detale-folie-ppf-i-winyl | Folie PPF i winyl
- Źródło: nowy opis
- Tytuł w Google: Środki do folii PPF i winylu – SONAX Xtreme
- Opis w Google: SONAX Xtreme PPF + Vinyl: cleaner 750 ml do mycia folii, pasta lekkościerna 250 ml i detailer 500 ml z powłoką. Pielęgnacja folii ochronnych.

Auto oklejone folią ochronną PPF albo folią winylową potrzebuje innych środków niż lakier. W tej kategorii jest seria **SONAX Xtreme PPF + Vinyl**:

- Cleaner 750 ml: do czyszczenia folii,
- pasta lekkościerna 250 ml: do folii PPF,
- Detailer 500 ml: powłoka do folii.

Do mycia auta z folią sprawdź też [szampony samochodowe](/kategoria/mycie-auta?sub=szampony-i-piany&typ=szampony-i-piany-szampony-samochodowe) i [mikrofibry](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki).

## plastiki-guma-i-detale-dachy-cabrio | Dachy cabrio
- Źródło: nowy opis
- Tytuł w Google: Środki do dachów cabrio – czyszczenie, impregnat
- Opis w Google: Preparaty do miękkich dachów kabrioletów: SONAX Do czyszczenia dachów, SONAX Impregnat do dachów i tapicerki, Tenzi Cabrio Prot.

Miękki dach kabrioletu wymaga osobnej pielęgnacji: najpierw czyszczenia, potem impregnacji. W tej kategorii są:

- SONAX Do czyszczenia dachów w kabrioletach 500 ml,
- SONAX Impregnat do dachów i tapicerki w kabrioletach 250 ml,
- Tenzi Cabrio Prot 600 ml (do konserwacji dachów cabrio).

Do czyszczenia materiału przyda się miękka [szczotka do tapicerki](/kategoria/akcesoria-detailingowe?sub=szczotki-i-pedzle&typ=szczotki-i-pedzle-szczotki-do-wnetrza-i-tapicerki).

## plastiki-guma-i-detale-mycie-silnika | Mycie silnika
- Źródło: nowy opis
- Tytuł w Google: Preparat do mycia silnika – K2 Akra, Plak
- Opis w Google: Preparaty do mycia komory silnika i części: K2 Akra Engine & Parts Cleaner, Plak Forclean Czysty silnik, Shine Chemicals Motorcleaner.

W tej kategorii są **preparaty do mycia silnika** i części mechanicznych:

- K2 Akra Engine & Parts Cleaner 750 ml,
- Plak Forclean Czysty silnik 750 ml,
- Shine Chemicals Motorcleaner (koncentrat do silnika i skrzyni biegów).

Przed myciem komory silnika przeczytaj etykietę i zabezpiecz elementy elektryczne zgodnie z zaleceniami producenta auta. Do zabrudzeń w warsztacie zobacz też [Zmywacze i odtłuszczacze](/kategoria/serwis-i-warsztat?sub=zmywacze-i-odtluszczacze).

## pady-polerskie | Pady i gąbki polerskie
- Źródło: nowy opis
- Tytuł w Google: Pady polerskie ADBL Roller i gąbki SONAX
- Opis w Google: Pady i gąbki polerskie do maszyn DA i rotacyjnych: ADBL Roller w rozmiarach 75, 125 i 150 mm oraz gąbki SONAX 80 mm. Pady tnące i wykończeniowe.

**Pad polerski** to gąbka zakładana na talerz maszyny polerskiej. Twardość padu dobiera się do etapu pracy, razem z pastą. W tej kategorii są:

- [Pady tnące](/kategoria/polerowanie-i-ochrona?sub=pady-polerskie&typ=pady-polerskie-pady-tnace): ADBL Roller Hard Cut i Cut oraz twarde gąbki SONAX,
- [Pady polerujące i wykończeniowe](/kategoria/polerowanie-i-ochrona?sub=pady-polerskie&typ=pady-polerskie-pady-polerujace-i-wykonczeniowe): ADBL Roller Polish, Soft, Soft Polish i One Step.

Pady ADBL Roller są w wersjach do maszyn DA (oznaczenie DA) i rotacyjnych (oznaczenie R), w rozmiarach 75, 125 i 150 mm. Rozmiar dobierz do talerza swojej maszyny. Do padu potrzebna jest [pasta lub politura](/kategoria/polerowanie-i-ochrona?sub=pasty-polerskie).

## pady-polerskie-pady-tnace | Pady tnące
- Źródło: nowy opis
- Tytuł w Google: Pady tnące – ADBL Roller Hard Cut, Cut, SONAX
- Opis w Google: Twarde pady polerskie do pierwszego etapu polerowania: ADBL Roller Hard Cut i Cut (DA i R, 75–150 mm) oraz gąbki polerskie SONAX 80 mm.

**Pady tnące** to twardsze pady do pierwszego etapu polerowania, razem z [pastą tnącą](/kategoria/polerowanie-i-ochrona?sub=pasty-polerskie&typ=pasty-polerskie-pasty-tnace). W tej kategorii znajdziesz:

- ADBL Roller Hard Cut (niebieski): DA 75, DA 150 i R 125,
- ADBL Roller Cut (biały): DA 150 i R 150,
- SONAX Gąbka polerska czerwona twarda 80 mm,
- SONAX Gąbka polerska zielona średnio twarda 80 mm.

Oznaczenie DA dotyczy maszyn orbitalnych, a R maszyn rotacyjnych. Po etapie cięcia przejdź do [padów wykończeniowych](/kategoria/polerowanie-i-ochrona?sub=pady-polerskie&typ=pady-polerskie-pady-polerujace-i-wykonczeniowe). Zanim zaczniesz, przeczytaj poradnik [Jak usunąć drobne rysy z lakieru](/blog/jak-usunac-drobne-rysy-z-lakieru).

## pady-polerskie-pady-polerujace-i-wykonczeniowe | Pady polerujące i wykończeniowe
- Źródło: nowy opis
- Tytuł w Google: Pady polerujące i wykończeniowe ADBL Roller
- Opis w Google: Miękkie i średnie pady polerskie ADBL Roller: Polish, Soft, Soft Polish i One Step do maszyn DA, w rozmiarach 75, 125 i 150 mm.

**Pady polerujące i wykończeniowe** są bardziej miękkie od padów tnących. Używa się ich z politurą wykończeniową albo produktem one step. W tej kategorii są pady ADBL Roller do maszyn DA:

- Roller Polish DA 125 (średni),
- Roller Soft DA 150 (czerwony),
- Roller Soft Polish DA 75,
- Roller One Step DA 75, 125 i 150 (pomarańczowy).

Do tych padów dobierz [politurę wykończeniową](/kategoria/polerowanie-i-ochrona?sub=pasty-polerskie&typ=pasty-polerskie-politury-wykonczeniowe) albo [produkt one step](/kategoria/polerowanie-i-ochrona?sub=pasty-polerskie&typ=pasty-polerskie-one-step-i-aio). Po polerowaniu warto zabezpieczyć lakier [woskiem](/kategoria/polerowanie-i-ochrona?sub=woski) lub [sealantem](/kategoria/polerowanie-i-ochrona?sub=powloki-i-quick-detailery&typ=powloki-i-quick-detailery-sealanty-i-szybka-ochrona).

## pasty-polerskie-pasty-tnace | Pasty tnące
- Źródło: nowy opis
- Tytuł w Google: Pasta polerska tnąca – SONAX Profiline, Menzerna
- Opis w Google: Pasty tnące do pierwszego etapu polerowania: SONAX Profiline Ultimate Cut, CutMax, FS 05-04 (250 ml i 1 l) oraz Menzerna 2000 Medium Cut.

**Pasta tnąca** służy do pierwszego etapu polerowania, gdy trzeba usunąć rysy i zmatowienia. W tej kategorii znajdziesz:

- SONAX Profiline Ultimate Cut 06+/03 (250 ml i 1 l),
- SONAX Profiline CutMax 06/04 1 l,
- SONAX Profiline FS 05-04 (250 ml i 1 l),
- Menzerna 2000 Medium Cut 250 ml.

Pastę tnącą używa się z [padem tnącym](/kategoria/polerowanie-i-ochrona?sub=pady-polerskie&typ=pady-polerskie-pady-tnace). Na drugi etap dobierz [politurę wykończeniową](/kategoria/polerowanie-i-ochrona?sub=pasty-polerskie&typ=pasty-polerskie-politury-wykonczeniowe). Po polerowaniu odtłuść lakier [IPA](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja&typ=pre-wash-i-dekontaminacja-odtluszczacze-i-ipa).

## pasty-polerskie-politury-wykonczeniowe | Politury wykończeniowe
- Źródło: nowy opis
- Tytuł w Google: Politura wykończeniowa – SONAX Profiline
- Opis w Google: Politury wykończeniowe do ostatniego etapu polerowania: SONAX Profiline Perfect Finish 4/6 (250 ml i 1 l), EX 04-06 i NP 03-06 (antyhologramowa).

**Politura wykończeniowa** to ostatni etap polerowania. Wygładza lakier po paście tnącej i podbija połysk. W tej kategorii są politury SONAX Profiline:

- Perfect Finish 4/6 (250 ml i 1 l),
- EX 04-06 1 l,
- NP 03-06 1 l (pasta antyhologramowa).

Politurę stosuje się z [padem wykończeniowym](/kategoria/polerowanie-i-ochrona?sub=pady-polerskie&typ=pady-polerskie-pady-polerujace-i-wykonczeniowe). Po polerowaniu zabezpiecz lakier [woskiem](/kategoria/polerowanie-i-ochrona?sub=woski) albo [powłoką](/kategoria/polerowanie-i-ochrona?sub=powloki-i-quick-detailery).

## pasty-polerskie-one-step-i-aio | One step i AIO
- Źródło: nowy opis
- Tytuł w Google: Politura one step (AIO) – SONAX Profiline
- Opis w Google: Politury jednoetapowe SONAX Profiline: OS 02/06 All In One 1 l i XP 02/06 Express Polish 1 l na drobne zarysowania. Jeden produkt zamiast kilku etapów.

**One step** i **AIO** (z ang. all in one) to politury, które łączą kilka etapów w jednym. Sprawdzają się, gdy lakier ma drobne zarysowania, a chcesz skończyć pracę w jednym podejściu. W tej kategorii są:

- SONAX Profiline OS 02/06 All In One 1 l,
- SONAX Profiline XP 02/06 Express Polish 1 l (na drobne zarysowania).

Dobierz do nich pad [ADBL Roller One Step](/kategoria/polerowanie-i-ochrona?sub=pady-polerskie&typ=pady-polerskie-pady-polerujace-i-wykonczeniowe). Głębsze rysy wymagają [pasty tnącej](/kategoria/polerowanie-i-ochrona?sub=pasty-polerskie&typ=pasty-polerskie-pasty-tnace).

## pasty-polerskie-usuwanie-rys-i-regeneracja | Usuwanie rys i regeneracja
- Źródło: nowy opis
- Tytuł w Google: Usuwanie rys z lakieru – mleczka, pasty, zestawy
- Opis w Google: Środki do drobnych rys i odświeżenia lakieru: SONAX Zestaw do usuwania zarysowań, SONAX Pasta lekkościerna, K2 Venox, K2 Turbo, SONAX Auto Politura.

W tej kategorii są produkty do **usuwania drobnych rys** i odświeżenia lakieru bez maszyny polerskiej:

- SONAX Zestaw do usuwania zarysowań 2×25 ml,
- SONAX Pasta lekkościerna 75 ml (bez silikonu),
- SONAX Do regeneracji lakieru 250 ml i SONAX Auto Politura 250 ml,
- K2 Venox mleczko do usuwania rys z gąbką,
- K2 Turbo lekkościerna pasta woskowa 120 g,
- Quixx Zestaw do zarysowań na powierzchniach akrylowych.

Nie każdą rysę da się usunąć ręcznie. Jak to sprawdzić, piszemy w poradniku [Jak usunąć drobne rysy z lakieru](/blog/jak-usunac-drobne-rysy-z-lakieru).

## powloki-i-quick-detailery-powloki-ceramiczne | Powłoki ceramiczne
- Źródło: nowy opis
- Tytuł w Google: Powłoka ceramiczna w sprayu – SONAX 750 ml
- Opis w Google: SONAX Ceramic Spray Coating 750 ml (257400): szybka powłoka ceramiczna w sprayu do zabezpieczenia lakieru. Sklep w Białymstoku.

**Powłoka ceramiczna** to zabezpieczenie lakieru, które nakłada się po dokładnym umyciu i odtłuszczeniu auta. W tej kategorii jest SONAX Ceramic Spray Coating 750 ml (kod 257400), czyli szybka powłoka w sprayu.

Przed nałożeniem odtłuść lakier [IPA](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja&typ=pre-wash-i-dekontaminacja-odtluszczacze-i-ipa). Do odświeżania powłoki służą [quick detailery](/kategoria/polerowanie-i-ochrona?sub=powloki-i-quick-detailery&typ=powloki-i-quick-detailery-quick-detailery). Więcej w artykułach [Ceramiczne zabezpieczenie lakieru](/blog/ceramiczne-zabezpieczenie-lakieru) i [Powłoka ceramiczna nie kropelkuje?](/blog/powloka-ceramiczna-nie-kropelkuje)

## powloki-i-quick-detailery-quick-detailery | Quick detailery
- Źródło: nowy opis
- Tytuł w Google: Quick detailer do lakieru – ceramiczny, kwarcowy
- Opis w Google: Quick detailery do szybkiego odświeżenia lakieru: SONAX Ceramic Ultra Slick, SONAX Xtreme Brilliant Shine, ADBL Ceramic QD, Plak Ceramicar, Tenzi.

**Quick detailer** to szybki środek do odświeżenia lakieru między myciami albo po myciu: nadaje połysk i usuwa lekkie zabrudzenia. W tej kategorii znajdziesz:

- SONAX Ceramic Ultra Slick Detailer 750 ml,
- SONAX Xtreme Brilliant Shine Detailer 750 ml,
- ADBL Ceramic QD 500 ml,
- Plak Ceramicar Ceramic Quick Detailer 750 ml,
- Tenzi Detailer Quartz Reloader 300 ml i Tenzi Car Shine 1 l.

Quick detailer rozprowadza się [mikrofibrą](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki). Mocniejszą ochronę dają [sealanty](/kategoria/polerowanie-i-ochrona?sub=powloki-i-quick-detailery&typ=powloki-i-quick-detailery-sealanty-i-szybka-ochrona) i [powłoki ceramiczne](/kategoria/polerowanie-i-ochrona?sub=powloki-i-quick-detailery&typ=powloki-i-quick-detailery-powloki-ceramiczne).

## powloki-i-quick-detailery-sealanty-i-szybka-ochrona | Sealanty i szybka ochrona
- Źródło: nowy opis
- Tytuł w Google: Sealant do lakieru – SONAX Spray & Seal, Menzerna
- Opis w Google: Sealanty i środki do szybkiej ochrony lakieru: SONAX Xtreme Spray & Seal, SONAX Profiline Speed Protect, SONAX Polymer Netshield, Menzerna Sealant.

**Sealant** to syntetyczne zabezpieczenie lakieru, które nakłada się szybciej niż klasyczny wosk. W tej kategorii są:

- SONAX Xtreme Spray & Seal 750 ml (nakładany na mokro),
- SONAX Profiline Speed Protect 1 l,
- SONAX Profiline Polymer Netshield 340 ml,
- Menzerna Sealant w sprayu 500 ml.

Sealant nakłada się na czysty lakier. Do mycia przed aplikacją służą [szampony](/kategoria/mycie-auta?sub=szampony-i-piany&typ=szampony-i-piany-szampony-samochodowe). Do tradycyjnej ochrony zajrzyj do kategorii [Woski](/kategoria/polerowanie-i-ochrona?sub=woski).

## woski-woski-w-plynie-i-sprayu | Woski w płynie i sprayu
- Źródło: nowy opis
- Tytuł w Google: Wosk w płynie i w sprayu do auta – Carnauba
- Opis w Google: Woski do auta w płynie i sprayu: SONAX Premium Class Carnauba, SONAX Twardy wosk w płynie, SONAX Xtreme Polish&Wax, ADBL Spray Wax, Tenzi Carnauba.

**Wosk w płynie i w sprayu** to najprostszy sposób, żeby dodać lakierowi połysku i ochrony po myciu. W tej kategorii znajdziesz:

- woski z carnaubą: SONAX Premium Class Carnauba 200 ml, Tenzi Detailer Carnauba Wax i Carnauba Spray,
- SONAX Twardy wosk w płynie 250 ml i SONAX Wosk do lakierów metalizowanych 250 ml,
- politury z woskiem: SONAX Xtreme Polish&Wax 2 i 3 Hybrid NPT,
- woski na mokro: ADBL Synthetic Spray Wax 500 ml i 1 l,
- ADBL Quick Wax 1 l.

Do nakładania przyda się [aplikator](/kategoria/akcesoria-detailingowe?sub=gabki-rekawice-i-aplikatory&typ=gabki-rekawice-i-aplikatory-aplikatory), a do zbierania [mikrofibra do polerowania](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki&typ=mikrofibry-i-reczniki-mikrofibry-do-polerowania).

## woski-woski-twarde-i-pasty | Woski twarde i pasty
- Źródło: nowy opis
- Tytuł w Google: Wosk twardy w paście – Meguiar's, K2 Quantum
- Opis w Google: Twarde woski w paście do lakieru: Meguiar's Gold Class Carnauba Plus 311 g, K2 Quantum 140 g z mikrofibrą i K2 Ultra Wax 250 g.

**Wosk twardy** w paście nakłada się aplikatorem na czysty lakier, a po chwili zbiera mikrofibrą. W tej kategorii są:

- Meguiar's Gold Class Carnauba Plus Premium Paste Wax 311 g,
- K2 Quantum, syntetyczny wosk 140 g z mikrofibrą w zestawie,
- K2 Ultra Wax 250 g.

Potrzebujesz czegoś szybszego? Zobacz [woski w płynie i sprayu](/kategoria/polerowanie-i-ochrona?sub=woski&typ=woski-woski-w-plynie-i-sprayu). Do aplikacji przyda się [gąbka do nakładania wosku](/kategoria/akcesoria-detailingowe?sub=gabki-rekawice-i-aplikatory&typ=gabki-rekawice-i-aplikatory-aplikatory).

## woski-woski-koloryzujace | Woski koloryzujące
- Źródło: nowy opis
- Tytuł w Google: Wosk koloryzujący do auta – SONAX Polish&Wax Color
- Opis w Google: Woski koloryzujące SONAX Polish&Wax Color: czerwony, niebieski, srebrny, czarny i biały, w opakowaniach 250 ml i 500 ml. Także Turtle Wax srebrny.

**Wosk koloryzujący** to wosk z dodatkiem pigmentu w kolorze lakieru. Wybierz kolor najbliższy odcieniowi swojego auta. W tej kategorii znajdziesz:

- SONAX Polish&Wax Color: czerwony, niebieski, srebrny, czarny i biały, w opakowaniach 250 ml i 500 ml,
- Turtle Wax wosk koloryzujący srebrny 500 ml.

Przed woskowaniem umyj auto [szamponem](/kategoria/mycie-auta?sub=szampony-i-piany&typ=szampony-i-piany-szampony-samochodowe). Do nakładania użyj [aplikatora](/kategoria/akcesoria-detailingowe?sub=gabki-rekawice-i-aplikatory&typ=gabki-rekawice-i-aplikatory-aplikatory).

## gabki-rekawice-i-aplikatory | Gąbki, rękawice i aplikatory
- Źródło: nowy opis
- Tytuł w Google: Gąbki, rękawice i aplikatory do auta – SONAX
- Opis w Google: Rękawice i gąbki do mycia auta, gąbki do szyb i owadów oraz aplikatory do wosku, plastików i opon. SONAX, ADBL, K2 i Tenzi.

W tej kategorii są akcesoria do mycia i nakładania kosmetyków:

- [Rękawice i gąbki do mycia](/kategoria/akcesoria-detailingowe?sub=gabki-rekawice-i-aplikatory&typ=gabki-rekawice-i-aplikatory-rekawice-i-gabki-do-mycia): SONAX Rękawica z mikrofibry, gąbki do mycia, gąbka do szyb i gąbka do owadów,
- [Aplikatory](/kategoria/akcesoria-detailingowe?sub=gabki-rekawice-i-aplikatory&typ=gabki-rekawice-i-aplikatory-aplikatory): do wosku, plastików i opon.

Do osuszania po myciu przydadzą się [ręczniki z mikrofibry](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki&typ=mikrofibry-i-reczniki-reczniki-do-osuszania).

## gabki-rekawice-i-aplikatory-rekawice-i-gabki-do-mycia | Rękawice i gąbki do mycia
- Źródło: nowy opis
- Tytuł w Google: Rękawica i gąbka do mycia auta – SONAX
- Opis w Google: Rękawica z mikrofibry SONAX, gąbki do mycia samochodu, gąbka do szyb 2w1, gąbka do owadów i gąbka wymienna do P-Ball. Do ręcznego mycia auta.

**Rękawica lub gąbka do mycia** to podstawa ręcznego mycia z szamponem. W tej kategorii znajdziesz:

- SONAX Rękawica z mikrofibry (do nadwozia),
- SONAX Gąbka z mikrofibry, Gąbka do mycia samochodu i Gąbka czyszcząca (2 szt.),
- SONAX Gąbka do szyb 2w1 antyroszeniowa,
- SONAX Gąbka wymienna do P-Ball,
- Armor All Gąbka do usuwania owadów.

Do mycia potrzebny jest [szampon samochodowy](/kategoria/mycie-auta?sub=szampony-i-piany&typ=szampony-i-piany-szampony-samochodowe). Jak myć, żeby nie porysować lakieru, opisujemy w poradniku [Jak prawidłowo myć samochód](/blog/jak-prawidlowo-myc-samochod).

## gabki-rekawice-i-aplikatory-aplikatory | Aplikatory
- Źródło: nowy opis
- Tytuł w Google: Aplikator do wosku, opon i plastików
- Opis w Google: Aplikatory do nakładania wosku, dressingu i preparatów do plastików: SONAX, K2 4″, ADBL Tickler z mikrofibry i Tenzi aplikator do opon.

**Aplikator** pozwala równo nałożyć wosk, dressing albo środek do plastików bez brudzenia rąk. W tej kategorii są:

- SONAX Gąbka do nakładania wosku i SONAX Gąbka do plastików,
- K2 Aplikator 4″ do wosków i nabłyszczaczy,
- ADBL Tickler, okrągły aplikator z mikrofibry,
- Tenzi Aplikator do opon.

Pasujące produkty znajdziesz w kategoriach [Woski](/kategoria/polerowanie-i-ochrona?sub=woski), [Dressingi do opon](/kategoria/mycie-auta?sub=felgi-i-opony&typ=felgi-i-opony-dressingi-do-opon) i [Plastiki zewnętrzne](/kategoria/mycie-auta?sub=plastiki-guma-i-detale&typ=plastiki-guma-i-detale-plastiki-zewnetrzne).

## mikrofibry-i-reczniki-reczniki-do-osuszania | Ręczniki do osuszania
- Źródło: nowy opis
- Tytuł w Google: Ręcznik z mikrofibry do osuszania auta
- Opis w Google: Ręczniki z mikrofibry do osuszania lakieru: ADBL Puffy Towel XL 60×90 cm, K2 Moli XXL, K2 Flossy Pro, K2 King, SONAX 80×50 cm, ADBL Mr Gray.

**Ręcznik z mikrofibry** do osuszania zbiera wodę z lakieru po myciu i ogranicza zacieki. W tej kategorii znajdziesz:

- ADBL Puffy Towel XL 60×90 cm (840 g/m²),
- ADBL Mr Gray Towel,
- K2 Moli XXL 60×60 cm i K2 King 40×60 cm,
- K2 Flossy Pro,
- SONAX Mikrofibra do osuszania 80×50 cm.

Większy ręcznik szybciej osuszy dach i maskę. Ślady po wyschniętej wodzie usuniesz preparatem z kategorii [Usuwanie osadów i rdzy](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja&typ=pre-wash-i-dekontaminacja-usuwanie-osadow-i-rdzy).

## mikrofibry-i-reczniki-mikrofibry-do-polerowania | Mikrofibry do polerowania
- Źródło: nowy opis
- Tytuł w Google: Mikrofibra do polerowania lakieru – K2, SONAX
- Opis w Google: Mikrofibry do polerowania karoserii i zbierania wosku: K2 Bona 40×40 cm i SONAX Ściereczka do polerowania (15 szt.). Do wosków i detailerów.

**Mikrofibra do polerowania** służy do zbierania wosku, politury i quick detailera z lakieru. W tej kategorii są:

- K2 Bona, mikrofibra do polerowania karoserii 40×40 cm,
- SONAX Ściereczka do polerowania, 15 szt.

Do czego ich użyć, znajdziesz w kategoriach [Woski](/kategoria/polerowanie-i-ochrona?sub=woski) i [Quick detailery](/kategoria/polerowanie-i-ochrona?sub=powloki-i-quick-detailery&typ=powloki-i-quick-detailery-quick-detailery).

## mikrofibry-i-reczniki-mikrofibry-do-szyb-i-wnetrza | Mikrofibry do szyb i wnętrza
- Źródło: nowy opis
- Tytuł w Google: Mikrofibra do szyb, skóry i wnętrza auta
- Opis w Google: Mikrofibry do szyb i wnętrza: SONAX do szyb i wnętrza (2 szt.), SONAX do tkanin i skóry, ADBL Lea do skóry i Tenzi mikrofibra na rolce (20 szt.).

W tej kategorii są **mikrofibry do szyb i wnętrza auta**:

- SONAX Mikrofibra do szyb i wnętrza (2 szt.),
- SONAX Mikrofibra do tkanin i skóry,
- ADBL Lea, mikrofibra do czyszczenia skóry,
- Tenzi Mikrofibra na rolce, 20 szt.

Pasują do [płynów do szyb](/kategoria/mycie-auta?sub=szyby-i-lusterka&typ=szyby-i-lusterka-plyny-do-szyb), [środków do kokpitu](/kategoria/wnetrze-auta?sub=kokpit-i-plastiki) i [preparatów do skóry](/kategoria/wnetrze-auta?sub=skora-i-alcantara).

## mikrofibry-i-reczniki-mikrofibry-uniwersalne | Mikrofibry uniwersalne
- Źródło: nowy opis
- Tytuł w Google: Ściereczka z mikrofibry SONAX – uniwersalna
- Opis w Google: Uniwersalne ściereczki z mikrofibry SONAX: pojedyncza (416200) i w zestawie 2 szt. (416241). Do auta, domu i warsztatu.

**Mikrofibra uniwersalna** przyda się do wielu zadań w aucie, w domu i w warsztacie. W tej kategorii są:

- SONAX Ściereczka z mikrofibry (416200),
- SONAX Ściereczka z mikrofibry, 2 szt. (416241).

Do zadań specjalnych są osobne mikrofibry: [do osuszania](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki&typ=mikrofibry-i-reczniki-reczniki-do-osuszania), [do polerowania](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki&typ=mikrofibry-i-reczniki-mikrofibry-do-polerowania) oraz [do szyb i wnętrza](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki&typ=mikrofibry-i-reczniki-mikrofibry-do-szyb-i-wnetrza).

## mikrofibry-i-reczniki-irchy | Irchy
- Źródło: nowy opis
- Tytuł w Google: Ircha syntetyczna SONAX do osuszania auta
- Opis w Google: SONAX Ircha syntetyczna (417700) do szybkiego zbierania wody z karoserii i szyb po myciu. Sklep w Białymstoku, wysyłka w całej Polsce.

**Ircha** szybko zbiera wodę z dużej powierzchni, np. z karoserii czy szyb po myciu. W tej kategorii jest SONAX Ircha syntetyczna (kod 417700).

Wolisz mikrofibrę? Zobacz [ręczniki do osuszania](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki&typ=mikrofibry-i-reczniki-reczniki-do-osuszania).

## szczotki-i-pedzle | Szczotki i pędzle
- Źródło: nowy opis
- Tytuł w Google: Szczotki i pędzle detailingowe do auta
- Opis w Google: Szczotki do felg, pędzle detailingowe, szczotki do tapicerki i skóry, szczotki na wkrętarkę i do nadwozia. ADBL, SONAX, K2 i Soft99.

W tej kategorii są szczotki i pędzle do miejsc, do których nie dotrzesz rękawicą ani mikrofibrą:

- [Pędzle detailingowe](/kategoria/akcesoria-detailingowe?sub=szczotki-i-pedzle&typ=szczotki-i-pedzle-pedzle-detailingowe): ADBL Round Detailing Brush, pędzle Soft99,
- [Szczotki do felg](/kategoria/akcesoria-detailingowe?sub=szczotki-i-pedzle&typ=szczotki-i-pedzle-szczotki-do-felg): SONAX, K2, ADBL Wheel Sword,
- [Szczotki do wnętrza i tapicerki](/kategoria/akcesoria-detailingowe?sub=szczotki-i-pedzle&typ=szczotki-i-pedzle-szczotki-do-wnetrza-i-tapicerki), w tym do sierści,
- [Szczotki na wkrętarkę](/kategoria/akcesoria-detailingowe?sub=szczotki-i-pedzle&typ=szczotki-i-pedzle-szczotki-na-wkretarke): ADBL Twister,
- [Szczotki do mycia nadwozia](/kategoria/akcesoria-detailingowe?sub=szczotki-i-pedzle&typ=szczotki-i-pedzle-szczotki-do-mycia-nadwozia).

## szczotki-i-pedzle-pedzle-detailingowe | Pędzle detailingowe
- Źródło: nowy opis
- Tytuł w Google: Pędzle detailingowe – ADBL Round Brush, Soft99
- Opis w Google: Pędzle detailingowe ADBL Round Detailing Brush w rozmiarach 8, 12 i 16 oraz pędzle Soft99 do mycia felg 8–18 mm i 16–24 mm.

**Pędzel detailingowy** pozwala doczyścić emblematy, kratki, szczeliny, nakrętki kół i inne trudno dostępne miejsca. W tej kategorii są:

- ADBL Round Detailing Brush, rozmiary 8, 12 i 16,
- Soft99 Pędzel czerwony 8–18 mm i 16–24 mm (do mycia felg).

Pędzli używa się razem z [APC](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja&typ=pre-wash-i-dekontaminacja-apc-i-srodki-uniwersalne) albo [płynem do felg](/kategoria/mycie-auta?sub=felgi-i-opony&typ=felgi-i-opony-plyny-do-felg).

## szczotki-i-pedzle-szczotki-do-felg | Szczotki do felg
- Źródło: nowy opis
- Tytuł w Google: Szczotka do felg – SONAX, K2, ADBL Wheel Sword
- Opis w Google: Szczotki do mycia felg i trudno dostępnych miejsc: SONAX Szczotka do felg, SONAX szczotka z mikrofibry, K2, ADBL Wheel Sword.

**Szczotka do felg** dociera między ramiona felgi i za nie, tam gdzie gąbka nie sięga. W tej kategorii znajdziesz:

- SONAX Szczotka do czyszczenia felg (do trudno dostępnych miejsc),
- SONAX Szczotka z mikrofibry do czyszczenia felg,
- K2 Szczotka do mycia felg,
- ADBL Wheel Sword.

Szczotki używa się z [płynem do felg](/kategoria/mycie-auta?sub=felgi-i-opony&typ=felgi-i-opony-plyny-do-felg) lub preparatem [krwawa felga](/kategoria/mycie-auta?sub=felgi-i-opony&typ=felgi-i-opony-krwawa-felga). Do drobnych szczelin przydadzą się [pędzle detailingowe](/kategoria/akcesoria-detailingowe?sub=szczotki-i-pedzle&typ=szczotki-i-pedzle-pedzle-detailingowe).

## szczotki-i-pedzle-szczotki-do-wnetrza-i-tapicerki | Szczotki do wnętrza i tapicerki
- Źródło: nowy opis
- Tytuł w Google: Szczotka do tapicerki, skóry i sierści
- Opis w Google: Szczotki do wnętrza auta: SONAX do tapicerki i skóry, K2 Auron Brush do skóry i tapicerki oraz SONAX szczotka do usuwania sierści.

W tej kategorii są **szczotki do wnętrza auta**:

- SONAX Szczotka do czyszczenia tapicerki i skóry,
- K2 Auron Brush, szczotka do skóry i tapicerki,
- SONAX Szczotka do usuwania sierści.

Szczotką wmasowuje się [piankę do tapicerki](/kategoria/wnetrze-auta?sub=tapicerka-i-dywaniki&typ=tapicerka-i-dywaniki-pianki-do-tapicerki) albo [środek do skóry](/kategoria/wnetrze-auta?sub=skora-i-alcantara&typ=skora-i-alcantara-czyszczenie-skory). Kolejność sprzątania opisujemy w poradniku [Czyszczenie wnętrza samochodu](/blog/czyszczenie-wnetrza-samochodu).

## szczotki-i-pedzle-szczotki-na-wkretarke | Szczotki na wkrętarkę
- Źródło: nowy opis
- Tytuł w Google: Szczotka na wkrętarkę ADBL Twister
- Opis w Google: Szczotki montowane na wkrętarkę ADBL Twister: Soft 125 mm, Medium 125 mm i Medium 50 mm. Do szybkiego czyszczenia tapicerki, dywaników i plastików.

**Szczotka na wkrętarkę** przyspiesza czyszczenie dywaników, tapicerki i większych powierzchni. W tej kategorii są szczotki ADBL Twister:

- Soft 125 mm,
- Medium 125 mm,
- Medium 50 mm.

Twardość dobierz do materiału: miękką do delikatniejszych powierzchni, średnią do mocniej zabrudzonych. Szczotkę używa się z [pianką do tapicerki](/kategoria/wnetrze-auta?sub=tapicerka-i-dywaniki&typ=tapicerka-i-dywaniki-pianki-do-tapicerki) albo [APC](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja&typ=pre-wash-i-dekontaminacja-apc-i-srodki-uniwersalne).

## szczotki-i-pedzle-szczotki-do-mycia-nadwozia | Szczotki do mycia nadwozia
- Źródło: nowy opis
- Tytuł w Google: Szczotka do mycia auta – K2
- Opis w Google: K2 Szczotka do mycia ręcznego (zielona) do mycia nadwozia, kół i większych pojazdów. Sklep w Białymstoku, wysyłka w całej Polsce.

**Szczotka do mycia** przydaje się przy większych autach, kołach i mocniej zabrudzonych miejscach. W tej kategorii jest K2 Szczotka do mycia ręcznego (zielona).

Do delikatnego lakieru lepsza będzie [rękawica z mikrofibry](/kategoria/akcesoria-detailingowe?sub=gabki-rekawice-i-aplikatory&typ=gabki-rekawice-i-aplikatory-rekawice-i-gabki-do-mycia).

## opryskiwacze-i-pianownice-opryskiwacze-reczne | Opryskiwacze ręczne
- Źródło: nowy opis
- Tytuł w Google: Opryskiwacz ręczny Kwazar Mercury i Nix
- Opis w Google: Ręczne opryskiwacze Kwazar 0,5 l i 1 l: Mercury 360°, Mercury Super HD alka line, Nix HD acid line i Nix HD solvent line. Do chemii detailingowej.

**Opryskiwacz ręczny** to mały spryskiwacz do chemii używanej na co dzień: APC, płynu do felg czy środka do wnętrza. W tej kategorii są opryskiwacze Kwazar:

- Mercury 360° 0,5 l i 1 l,
- Mercury Super HD alka line 0,5 l i 1 l,
- Nix HD acid line 0,5 l,
- Nix HD solvent line 0,5 l.

Oznaczenia alka, acid i solvent line to różne wersje opryskiwaczy Kwazar. Sprawdź w opisie produktu, do jakiej chemii jest przeznaczona dana wersja. Większe modele znajdziesz w kategorii [Opryskiwacze ciśnieniowe](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice&typ=opryskiwacze-i-pianownice-opryskiwacze-cisnieniowe).

## opryskiwacze-i-pianownice-opryskiwacze-cisnieniowe | Opryskiwacze ciśnieniowe
- Źródło: nowy opis
- Tytuł w Google: Opryskiwacz ciśnieniowy Kwazar Venus, Orion, Xi6
- Opis w Google: Ciśnieniowe opryskiwacze Kwazar od 1 l do 9 l: Venus 360°, Venus Super HD, Orion 6 l i 9 l, Orion Super HD, Xi6. Do myjni, warsztatów i domu.

**Opryskiwacz ciśnieniowy** pompuje się ręcznie i rozpyla chemię równym strumieniem bez ciągłego naciskania spustu. W tej kategorii są opryskiwacze Kwazar:

- Venus 360° 1 l, 1,5 l i 2 l,
- Venus Super HD alka line, Super Acid i Super HD Solvent 1,5 l,
- Orion 6 l i 9 l oraz Orion Super HD alka line 6 l,
- Xi6 6 l.

Części zamienne (pompki, wężyki, lance, zawory) są w kategorii [Części do opryskiwaczy](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice&typ=opryskiwacze-i-pianownice-czesci-do-opryskiwaczy). Do piany aktywnej wybierz [pianownicę](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice&typ=opryskiwacze-i-pianownice-pianownice).

## opryskiwacze-i-pianownice-pianownice | Pianownice
- Źródło: nowy opis
- Tytuł w Google: Pianownica ręczna Kwazar Venus i Orion Foamer
- Opis w Google: Pianownice ciśnieniowe Kwazar do piany aktywnej: Venus Super Foamer 2 l (także HD alka i acid line) i Orion Super Foamer 6 l.

**Pianownica** to opryskiwacz, który zamienia rozcieńczoną chemię w gęstą pianę. Służy do nakładania [piany aktywnej](/kategoria/mycie-auta?sub=szampony-i-piany&typ=szampony-i-piany-piany-aktywne) przed myciem auta. W tej kategorii są pianownice Kwazar:

- Venus Super Foamer 2 l,
- Venus Super Foamer HD alka line 2 l,
- Venus Super Foamer HD acid line 2 l,
- Orion Super Foamer 6 l.

Pianownica przydaje się szczególnie wtedy, gdy myjesz auto w domu i nie masz myjki ciśnieniowej. Ile koncentratu wlać, przeliczysz w [kalkulatorze rozcieńczania](/rozcienczanie).

## opryskiwacze-i-pianownice-czesci-do-opryskiwaczy | Części do opryskiwaczy
- Źródło: nowy opis
- Tytuł w Google: Części do opryskiwaczy Kwazar – lance, pompki
- Opis w Google: Części zamienne Kwazar: lance teleskopowe 3 m i 5 m, wężyki, rękojeści z manometrem, pompki do Orion i Venus, zawory bezpieczeństwa, końcówki.

W tej kategorii są **części zamienne i akcesoria do opryskiwaczy Kwazar**:

- lance teleskopowe 3 m i 5 m,
- wężyki do opryskiwacza Orion (1,5 m i 4,5 m),
- rękojeści lancy z manometrem, także w wersji HD alka line,
- pompki do opryskiwaczy Orion Pro+ i Venus Super Pro+ 360,
- zawór bezpieczeństwa do Orion Pro+,
- zespół końcówki lancy Cleaning Pro+.

Dobierając część, sprawdź model swojego opryskiwacza w nazwie produktu. Oringi i zawory do pompek są w kategorii [Serwis i warsztat › Akcesoria](/kategoria/serwis-i-warsztat?sub=akcesoria).

## zestawy-i-inne | Czyściwa, zestawy i inne
- Źródło: nowy opis
- Tytuł w Google: Czyściwo włókninowe Krypton Detailer 300
- Opis w Google: Krypton czyściwo włókninowe Detailer 300, 111 mb, bezpyłowe. Do warsztatu, detailingu i pracy z chemią. Sklep w Białymstoku.

W tej kategorii jest **czyściwo włókninowe Krypton Detailer 300** w rolce 111 mb. Według producenta jest bezpyłowe, więc nadaje się do wycierania powierzchni przy pracy z chemią w warsztacie i przy detailingu.

Do delikatnych powierzchni lakierowanych lepsze będą [mikrofibry](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki).

## kokpit-i-plastiki-interior-detailery-i-cleanery | Interior detailery i cleanery
- Źródło: nowy opis
- Tytuł w Google: Środek do czyszczenia wnętrza auta – detailery
- Opis w Google: Cleanery i quick detailery do wnętrza auta: SONAX Xtreme Interior Detailer, SONAX Cleanstar, ADBL Interior QD, K2 Satina Pro, Easy Wash Inside Cleaner.

**Cleaner do wnętrza** czyści plastiki, kokpit i boczki drzwi, a **interior detailer** szybko je odświeża. W tej kategorii znajdziesz:

- SONAX Xtreme Interior Detailer 750 ml i SONAX Xtreme Detailer do plastików 500 ml,
- SONAX Cleanstar 750 ml i SONAX Do czyszczenia wnętrza samochodu 500 ml,
- ADBL Interior QD 1 l i Interior QD Unlimited 500 ml,
- K2 Satina Pro 1 l,
- Easy Wash Inside Cleaner 1 l i 5 l,
- Caramba Pianka do kokpitu bez silikonu.

Do wycierania użyj [mikrofibry do wnętrza](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki&typ=mikrofibry-i-reczniki-mikrofibry-do-szyb-i-wnetrza). Kolejność sprzątania opisujemy w poradniku [Czyszczenie wnętrza samochodu](/blog/czyszczenie-wnetrza-samochodu).

## kokpit-i-plastiki-kokpit-matowy | Kokpit matowy
- Źródło: nowy opis
- Tytuł w Google: Środek do kokpitu matowy – SONAX, Plak
- Opis w Google: Matowe preparaty do kokpitu: SONAX Xtreme Cockpit Matowy 500 ml, SONAX Cockpit Matowy Sport-Fresh 500 ml i Plak Mleczko do kokpitu matowe 750 ml.

**Środek do kokpitu matowy** czyści i pielęgnuje plastik, nie nadając mu połysku. Wybierz go, jeśli wolisz fabryczny, matowy wygląd deski rozdzielczej. W tej kategorii są:

- SONAX Xtreme Cockpit Matowy 500 ml,
- SONAX Cockpit Matowy Sport-Fresh 500 ml,
- Plak Mleczko do kokpitu matowe 750 ml.

Wolisz delikatny połysk? Zobacz [Kokpit z połyskiem](/kategoria/wnetrze-auta?sub=kokpit-i-plastiki&typ=kokpit-i-plastiki-kokpit-z-polyskiem). Szybkie odświeżenie w trasie zapewnią [ściereczki do kokpitu](/kategoria/wnetrze-auta?sub=kokpit-i-plastiki&typ=kokpit-i-plastiki-sciereczki-do-kokpitu).

## kokpit-i-plastiki-kokpit-z-polyskiem | Kokpit z połyskiem
- Źródło: nowy opis
- Tytuł w Google: Nabłyszczacz do kokpitu – Plak, K2 Polo Cockpit
- Opis w Google: Nabłyszczające preparaty do kokpitu i plastików wewnątrz auta: Plak 4R i 2R, Plak Nabłyszczający 750 ml, K2 Polo Cockpit 750 ml.

**Nabłyszczacz do kokpitu** czyści plastik i nadaje mu połysk. W tej kategorii są:

- Plak 4R Kokpit Nabłyszczający 750 ml (delikatny połysk, antystatyczny),
- Plak Kokpit 2R Nabłyszczający 750 ml,
- Plak Nabłyszczający 750 ml (mix zapachów),
- K2 Polo Cockpit 750 ml.

Po nałożeniu rozprowadź preparat [mikrofibrą](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki&typ=mikrofibry-i-reczniki-mikrofibry-do-szyb-i-wnetrza). Nie nakładaj nabłyszczacza na kierownicę i pedały, chyba że etykieta na to pozwala. Matowe preparaty znajdziesz w kategorii [Kokpit matowy](/kategoria/wnetrze-auta?sub=kokpit-i-plastiki&typ=kokpit-i-plastiki-kokpit-matowy).

## kokpit-i-plastiki-sciereczki-do-kokpitu | Ściereczki do kokpitu
- Źródło: nowy opis
- Tytuł w Google: Ściereczki do kokpitu – nawilżane, SONAX, Plak
- Opis w Google: Nawilżane ściereczki do kokpitu: SONAX (25 szt.) oraz Plak matowe i nabłyszczające, w zapachach grejpfrut, pomarańcza i wanilia (24 szt.).

**Ściereczki do kokpitu** to najszybszy sposób na odświeżenie plastików, np. w trasie. W tej kategorii są:

- SONAX Ściereczki do kokpitu, 25 szt.,
- Plak Ściereczki do kokpitu matowe, grejpfrut, 24 szt.,
- Plak Ściereczki do kokpitu nabłyszczające: pomarańcza i wanilia, 24 szt.

Na dokładniejsze sprzątanie zobacz [cleanery i detailery do wnętrza](/kategoria/wnetrze-auta?sub=kokpit-i-plastiki&typ=kokpit-i-plastiki-interior-detailery-i-cleanery). Ściereczki do szyb znajdziesz w kategorii [Płyny do szyb](/kategoria/mycie-auta?sub=szyby-i-lusterka&typ=szyby-i-lusterka-plyny-do-szyb).

## tapicerka-i-dywaniki-pianki-do-tapicerki | Pianki do tapicerki
- Źródło: nowy opis
- Tytuł w Google: Pianka do tapicerki samochodowej – SONAX, K2 Tapis
- Opis w Google: Pianki do czyszczenia tapicerki materiałowej i dywanów: SONAX i SONAX Xtreme, K2 Tapis, Plak, Tuff Stuff i Detap. Od 400 ml do 750 ml.

**Pianka do tapicerki** to najprostszy sposób na wyczyszczenie foteli i dywaników materiałowych bez odkurzacza piorącego. W tej kategorii znajdziesz:

- SONAX Pianka do tapicerki 400 ml (do domu i samochodu) i SONAX Xtreme Pianka do tapicerki 400 ml,
- K2 Tapis 600 ml i 750 ml,
- Plak Pianka do tapicerki i dywanów 500 ml,
- Tuff Stuff 500 ml i Detap 400 ml.

Piankę wmasuj [szczotką do tapicerki](/kategoria/akcesoria-detailingowe?sub=szczotki-i-pedzle&typ=szczotki-i-pedzle-szczotki-do-wnetrza-i-tapicerki), a potem zbierz mikrofibrą lub odkurzaczem. Na pojedyncze plamy są [odplamiacze](/kategoria/wnetrze-auta?sub=tapicerka-i-dywaniki&typ=tapicerka-i-dywaniki-odplamiacze), a na pranie całych foteli [płyny do prania tapicerki](/kategoria/wnetrze-auta?sub=tapicerka-i-dywaniki&typ=tapicerka-i-dywaniki-pranie-tapicerki-i-dywanikow).

## tapicerka-i-dywaniki-pranie-tapicerki-i-dywanikow | Pranie tapicerki i dywaników
- Źródło: nowy opis
- Tytuł w Google: Płyn do prania tapicerki i dywanów – Tenzi Textil
- Opis w Google: Płyny do prania tapicerki, dywanów i wykładzin odkurzaczem piorącym: Tenzi Textil, Textil Ex i Textil Wash (1 l i 5 l), ADBL Bonnet, Royal Per Mobil.

W tej kategorii są **płyny do prania tapicerki i dywanów**, także do odkurzaczy piorących:

- Tenzi Textil Ex 1 l i 5 l (do odkurzacza piorącego),
- Tenzi Textil 1 l i 5 l (do dywanów i wykładzin),
- Tenzi Textil Wash 1 l i 5 l (koncentrat do tapicerki i dywaników),
- ADBL Bonnet 500 ml i 1 l (do podsufitki i tapicerki),
- Royal Per Mobil 1 l (do maszynowego czyszczenia),
- Detap 10 kg.

Koncentrat rozcieńcz zgodnie z etykietą, a pomoże w tym [kalkulator rozcieńczania](/rozcienczanie). Po praniu warto zabezpieczyć materiał [impregnatem do tkanin](/kategoria/wnetrze-auta?sub=tapicerka-i-dywaniki&typ=tapicerka-i-dywaniki-impregnaty-do-tkanin).

## tapicerka-i-dywaniki-odplamiacze | Odplamiacze
- Źródło: nowy opis
- Tytuł w Google: Odplamiacz do tapicerki i alcantary
- Opis w Google: Odplamiacze do tapicerki samochodowej: SONAX Odplamiacz do tapicerki i alcantary 300 ml oraz Tenzi TopPlam Clor 5 l do powierzchni tekstylnych.

**Odplamiacz** służy do miejscowego usuwania plam z tapicerki, gdy nie trzeba prać całego fotela. W tej kategorii są:

- SONAX Odplamiacz do tapicerki i alcantary 300 ml,
- Tenzi TopPlam Clor 5 l (do powierzchni tekstylnych).

Przed użyciem sprawdź środek na niewidocznym fragmencie materiału. Do czyszczenia większych powierzchni zobacz [pianki do tapicerki](/kategoria/wnetrze-auta?sub=tapicerka-i-dywaniki&typ=tapicerka-i-dywaniki-pianki-do-tapicerki).

## tapicerka-i-dywaniki-impregnaty-do-tkanin | Impregnaty do tkanin
- Źródło: nowy opis
- Tytuł w Google: Impregnat do tapicerki – SONAX Profiline Coating
- Opis w Google: SONAX Profiline Coating 1 l (310300) – impregnat do tkanin i tapicerki samochodowej. Zabezpieczenie materiału po praniu.

**Impregnat do tkanin** nakłada się na czystą, suchą tapicerkę, żeby zabezpieczyć ją po praniu. W tej kategorii jest SONAX Profiline Coating 1 l (kod 310300).

Najpierw wypierz tapicerkę płynem z kategorii [Pranie tapicerki i dywaników](/kategoria/wnetrze-auta?sub=tapicerka-i-dywaniki&typ=tapicerka-i-dywaniki-pranie-tapicerki-i-dywanikow). Impregnat do dachów kabrioletów znajdziesz w kategorii [Dachy cabrio](/kategoria/mycie-auta?sub=plastiki-guma-i-detale&typ=plastiki-guma-i-detale-dachy-cabrio).

## skora-i-alcantara-czyszczenie-skory | Czyszczenie skóry
- Źródło: nowy opis
- Tytuł w Google: Środek do czyszczenia skóry w aucie – pianki
- Opis w Google: Pianki, mleczka i ściereczki do czyszczenia skórzanej tapicerki: SONAX Xtreme Pianka do skóry, Plak, Plak Rinpel i Rinpel. Do foteli i kierownicy.

**Środek do czyszczenia skóry** usuwa brud z foteli, kierownicy i boczków, zanim nałożysz preparat pielęgnujący. W tej kategorii są:

- SONAX Xtreme Pianka do skóry Nano Pro 250 ml,
- Plak Pianka do tapicerki skórzanej 500 ml,
- Plak Rinpel Mleczko do skóry 750 ml i Rinpel Pianka do czyszczenia skóry 400 ml,
- Plak Ściereczki do tapicerki skórzanej, 24 szt.

Do czyszczenia przyda się miękka [szczotka do skóry](/kategoria/akcesoria-detailingowe?sub=szczotki-i-pedzle&typ=szczotki-i-pedzle-szczotki-do-wnetrza-i-tapicerki). Po czyszczeniu zabezpiecz skórę środkiem z kategorii [Pielęgnacja i impregnacja skóry](/kategoria/wnetrze-auta?sub=skora-i-alcantara&typ=skora-i-alcantara-pielegnacja-i-impregnacja-skory).

## skora-i-alcantara-pielegnacja-i-impregnacja-skory | Pielęgnacja i impregnacja skóry
- Źródło: nowy opis
- Tytuł w Google: Pielęgnacja skóry w aucie – balsamy, impregnaty
- Opis w Google: Balsamy, mleczka i impregnaty do skórzanej tapicerki: Tenzi Leder Cream i Leder Care GT, Soft99 Luxury Leather, Easy Wash Leather Balm, SONAX.

**Pielęgnacja skóry** to drugi krok po czyszczeniu: preparat odżywia i zabezpiecza skórzaną tapicerkę. W tej kategorii znajdziesz:

- Tenzi Leder Cream 600 ml (zabezpieczenie i impregnacja),
- Tenzi Leder Care GT 600 ml (do skóry naturalnej i sztucznej),
- Tenzi Detailer Skóra Pielęgnacja 600 ml,
- Soft99 Luxury Leather 500 ml,
- Easy Wash Leather Balm 500 ml,
- SONAX Mleczko do czyszczenia skóry 250 ml (z woskiem pszczelim).

Preparat nakładaj na czystą skórę. Najpierw użyj środka z kategorii [Czyszczenie skóry](/kategoria/wnetrze-auta?sub=skora-i-alcantara&typ=skora-i-alcantara-czyszczenie-skory). Do wcierania przyda się [mikrofibra do skóry](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki&typ=mikrofibry-i-reczniki-mikrofibry-do-szyb-i-wnetrza).

## zapachy-samochodowe-zawieszki-zapachowe | Zawieszki zapachowe
- Źródło: nowy opis
- Tytuł w Google: Zawieszka zapachowa do auta – K2 Evos, SONAX
- Opis w Google: Zawieszki zapachowe do samochodu: drewniane K2 Evos (Viking, Hunter, Boss, Gaia, Valkiria, Angel, Unicorn), SONAX Air Freshener, Dr Marcus Sonic.

**Zawieszka zapachowa** to najprostszy sposób na przyjemny zapach w aucie. W tej kategorii znajdziesz:

- drewniane zawieszki K2 Evos w zapachach: Viking, Hunter, Boss, Gaia, Valkiria, Angel i Unicorn,
- SONAX Air Freshener 14,5 g: Alpejskie Lato i Sweet Flamingo,
- Dr Marcus Sonic (mix zapachów).

Wolisz mocniejszy zapach? Zobacz [perfumy samochodowe](/kategoria/wnetrze-auta?sub=zapachy-samochodowe&typ=zapachy-samochodowe-perfumy-samochodowe). Na nieprzyjemne zapachy lepsze będą [neutralizatory](/kategoria/wnetrze-auta?sub=zapachy-samochodowe&typ=zapachy-samochodowe-neutralizatory-zapachow).

## zapachy-samochodowe-perfumy-samochodowe | Perfumy samochodowe
- Źródło: nowy opis
- Tytuł w Google: Perfumy samochodowe K2 Evos – 50 ml
- Opis w Google: Perfumy do samochodu K2 Evos 50 ml w zapachach Boss, Hunter, Sparta, Samurai i Viking oraz Foen Boss 200 ml. Zapach do wnętrza auta.

**Perfumy samochodowe** rozpyla się we wnętrzu auta, na tapicerkę lub dywaniki. W tej kategorii są:

- K2 Evos 50 ml w zapachach: Boss, Hunter, Sparta, Samurai i Viking,
- Foen Perfumy samochodowe Boss 200 ml.

Te same zapachy Evos znajdziesz też jako [drewniane zawieszki](/kategoria/wnetrze-auta?sub=zapachy-samochodowe&typ=zapachy-samochodowe-zawieszki-zapachowe). Zapach dymu czy jedzenia lepiej najpierw zneutralizować środkiem z kategorii [Neutralizatory zapachów](/kategoria/wnetrze-auta?sub=zapachy-samochodowe&typ=zapachy-samochodowe-neutralizatory-zapachow).

> Uwaga: w tej kategorii jest też „Tenzi Top Efekt Perfume Amore 1L – płyn do mycia posadzek”. To raczej produkt do kategorii Podłogi i posadzki. Przenieść go?

## zapachy-samochodowe-neutralizatory-zapachow | Neutralizatory zapachów
- Źródło: nowy opis
- Tytuł w Google: Neutralizator zapachów do auta – SONAX Smoke Ex
- Opis w Google: Neutralizatory nieprzyjemnych zapachów w samochodzie: SONAX Smoke Ex 500 ml i Agachem Odor Stop. Na zapach dymu i inne uciążliwe zapachy.

**Neutralizator zapachów** nie przykrywa nieprzyjemnego zapachu, tylko ma go usunąć, tak jak opisują to producenci. W tej kategorii są:

- SONAX Smoke Ex 500 ml,
- Agachem Odor Stop.

Jeśli zapach dochodzi z nawiewów, zajrzyj do kategorii [Klimatyzacja i nawiewy](/kategoria/wnetrze-auta?sub=klimatyzacja-i-nawiewy) i poradnika [Klimatyzacja śmierdzi po uruchomieniu?](/blog/klimatyzacja-smierdzi-po-uruchomieniu) Neutralizatory do domu i biura znajdziesz w kategorii [Freshtek One Shot](/kategoria/dom-i-ogrod?sub=neutralizatory).

## zapachy-samochodowe-pochlaniacze-wilgoci | Pochłaniacze wilgoci
- Źródło: nowy opis
- Tytuł w Google: Pochłaniacz wilgoci do auta – Cardos
- Opis w Google: Cardos samochodowy pochłaniacz wilgoci, który według producenta zapobiega parowaniu szyb. Na jesień i zimę. Sklep w Białymstoku.

**Pochłaniacz wilgoci** zbiera nadmiar wilgoci z kabiny. Przydaje się jesienią i zimą, gdy szyby parują od środka. W tej kategorii jest Cardos samochodowy pochłaniacz wilgoci.

Na parujące szyby pomoże też [antypara](/kategoria/mycie-auta?sub=szyby-i-lusterka&typ=szyby-i-lusterka-antypara).

## ciezarowki-i-pojazdy-uzytkowe | Ciężarówki i pojazdy użytkowe
- Źródło: nowy opis
- Tytuł w Google: Chemia do mycia ciężarówek i plandek – Tenzi Truck Clean
- Opis w Google: Aktywne piany i środki do mycia ciężarówek, busów, plandek i maszyn: Tenzi Truck Clean, Super Green Specjal, Easy Wash Truck Wash, Nerta, K2 Turbo Truck.

W tej kategorii są **środki do mycia ciężarówek, aut dostawczych, autobusów, plandek i maszyn rolniczych**, głównie w kanistrach:

- Tenzi Truck Clean 1, 5, 10 i 20 l (silna aktywna piana do ciężarówek, silników i plandek),
- Tenzi Truck Clean Extra 1 l i 5 l,
- Tenzi Super Green Specjal 1, 10 i 20 l (do pojazdów ciężarowych, autobusów i maszyn rolniczych),
- Easy Wash Truck Wash 20 l (do bezdotykowego mycia ciężarówek),
- Nerta Truck Cleaner 2000 25 l, K2 Turbo Truck 5 kg, Dimer 10 kg.

Koncentraty rozcieńcza się zgodnie z etykietą. Proporcję przeliczysz w [kalkulatorze rozcieńczania](/rozcienczanie). Masz pytanie o dobór chemii do floty? [Napisz lub zadzwoń](/kontakt).

## mycie-bezdotykowe | Mycie bezdotykowe i piany
- Źródło: nowy opis
- Tytuł w Google: Chemia do myjni bezdotykowej – Easy Wash, Nerta
- Opis w Google: Koncentraty do mycia bezdotykowego i piany aktywne dla myjni: Easy Wash Diamond Wash, Super Active, Eco Wash, Nerta Sky, Power Wash, Novo Wash. Do 25 l.

W tej kategorii są **koncentraty do mycia bezdotykowego** i piany aktywne dla myjni, w opakowaniach od 1 l do 25 l:

- Easy Wash: Diamond Wash, Super Active Wash, Eco Super Active, Eco Wash,
- Nerta: Sky WE 64, Power Wash (zasadowa piana aktywna), Novo Wash, Active Diamond Foam.

Dobór chemii zależy od twardości wody, sprzętu i rodzaju zabrudzeń. Dawkowanie sprawdź na etykiecie, a przeliczysz je w [kalkulatorze rozcieńczania](/rozcienczanie). Po myciu przyda się [wosk lub nabłyszczacz do myjni](/kategoria/chemia-do-myjni?sub=woski-do-myjni). Domowe piany aktywne w butelkach 1 l są w kategorii [Piany aktywne](/kategoria/mycie-auta?sub=szampony-i-piany&typ=szampony-i-piany-piany-aktywne).

## preparaty-specjalistyczne | Preparaty specjalistyczne
- Źródło: nowy opis
- Tytuł w Google: Chemia specjalistyczna dla myjni – owady, smoła, alu
- Opis w Google: Preparaty dla myjni: usuwanie owadów (Nerta Anti Insect, Easy Wash Insekt Remover), smoły, mycie aluminium, odpieniacz Tenzi i SONAX do flokulacji.

W tej kategorii są **preparaty specjalistyczne dla myjni** w dużych opakowaniach:

- **owady**: Nerta Anti Insect 5 l i 25 l, Easy Wash Insekt Remover 5 l i 20 l,
- **smoła i klej**: Easy Wash Tar Remover 5 l,
- **aluminium**: Easy Wash Alu Cleaner 100 20 l i Eco Alu 20 l,
- **odpienianie**: Tenzi De-Foam 1 l,
- **oczyszczanie wody**: SONAX Preparat do flokulacji 25 l,
- **akcesoria**: SONAX Lejek do kanistrów 20 l.

Mniejsze opakowania do użytku domowego znajdziesz w kategoriach [Usuwanie owadów](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja&typ=pre-wash-i-dekontaminacja-usuwanie-owadow) i [Usuwanie smoły, kleju i żywicy](/kategoria/mycie-auta?sub=pre-wash-i-dekontaminacja&typ=pre-wash-i-dekontaminacja-usuwanie-smoly-kleju-i-zywicy).

## woski-do-myjni | Woski i nabłyszczacze do myjni
- Źródło: nowy opis
- Tytuł w Google: Wosk do myjni – Nerta Carwax, Tenzi Rollex
- Opis w Google: Woski polimerowe i nabłyszczacze dla myjni samochodowych: Nerta Carwax 2000 5 l (wosk z osuszaczem) i Tenzi Rollex (polimerowy nabłyszczacz).

W tej kategorii są **woski i nabłyszczacze dla myjni samochodowych**, nakładane na koniec mycia:

- Nerta Carwax 2000 5 l (wosk polimerowy z osuszaczem),
- Tenzi Rollex (polimerowy nabłyszczacz do myjni).

Dawkowanie sprawdź na etykiecie. Preparaty do samego mycia są w kategorii [Mycie bezdotykowe i piany](/kategoria/chemia-do-myjni?sub=mycie-bezdotykowe). Woski do ręcznej aplikacji znajdziesz w dziale [Woski](/kategoria/polerowanie-i-ochrona?sub=woski).

## smary-oleje-i-odrdzewiacze | Smary, oleje i odrdzewiacze
- Źródło: nowy opis
- Tytuł w Google: Smary, oleje i odrdzewiacze – SONAX SX90, K2, Holts
- Opis w Google: Odrdzewiacze i oleje penetrujące, smary i pasty warsztatowe: SONAX SX90, SONAX Olej MoS2, K2 Vulcan, Holts smar miedziany, Förch, Tenzi.

W tej kategorii są **smary, oleje i odrdzewiacze** do warsztatu i garażu:

- **odrdzewiacze i oleje**: SONAX Professional SX90 Odrdzewiacz 400 ml, SONAX SX90 Olej wielofunkcyjny 100 ml, SONAX Olej MoS2 400 ml, K2 Vulcan 500 ml, Holts preparat odrdzewiająco-penetrujący 600 ml,
- **smary i pasty**: Holts Smar miedziany w sprayu, K2 Smar do łańcucha Off-Road, Förch S439 Pasta do cylinderków hamulcowych,
- **usuwanie rdzy**: Tenzi Usuwanie rdzy 1 l.

Przed smarowaniem odtłuść część środkiem z kategorii [Zmywacze i odtłuszczacze](/kategoria/serwis-i-warsztat?sub=zmywacze-i-odtluszczacze).

## zmywacze-i-odtluszczacze | Zmywacze i odtłuszczacze
- Źródło: nowy opis
- Tytuł w Google: Zmywacz do hamulców i odtłuszczacze warsztatowe
- Opis w Google: Zmywacze do hamulców SONAX, K2 Brake Cleaner, Holts, K2 Kontakt Spray i Tenzi Super Green Specjal NF do zabrudzeń ropopochodnych.

W tej kategorii są **zmywacze i odtłuszczacze warsztatowe**:

- **zmywacze do hamulców**: SONAX Professional 400 ml, K2 Brake Cleaner 600 ml, Holts 600 ml,
- **do styków elektrycznych**: K2 Kontakt Spray 400 ml,
- **na zabrudzenia ropopochodne**: Tenzi Super Green Specjal NF 1 l i 10 l.

Do mycia komory silnika zobacz też [Mycie silnika](/kategoria/mycie-auta?sub=plastiki-guma-i-detale&typ=plastiki-guma-i-detale-mycie-silnika). Ręce po pracy umyjesz pastą z kategorii [Pasty i mydła do rąk](/kategoria/serwis-i-warsztat?sub=mycie-rak).

## kleje-i-naprawy | Kleje i naprawy
- Źródło: nowy opis
- Tytuł w Google: Pasta do tłumików, kleje i naprawy – SONAX, K2
- Opis w Google: SONAX zestaw i pasta do naprawy tłumików, Förch pasta montażowa do wydechu, Krypton cynk naprawczy, K2 Tapiflex klej tapicerski i K2 Bondix.

W tej kategorii są **kleje i środki do drobnych napraw**:

- **układ wydechowy**: SONAX Zestaw naprawczy do tłumików, SONAX Pasta naprawcza do tłumików 200 g, Förch Pasta montażowa do układu wydechowego 170 g,
- **ochrona stali**: Krypton Cynk naprawczy 500 ml (do stali galwanizowanej),
- **kleje**: K2 Tapiflex 400 ml (klej tapicerski w sprayu), K2 Bondix 3 g (klej szybkoschnący).

Przed klejeniem odtłuść powierzchnię środkiem z kategorii [Zmywacze i odtłuszczacze](/kategoria/serwis-i-warsztat?sub=zmywacze-i-odtluszczacze).

## plyny-eksploatacyjne | Płyny eksploatacyjne
- Źródło: nowy opis
- Tytuł w Google: Płyn do chłodnic i odmrażacz do zamków
- Opis w Google: Gotowe płyny do chłodnic K2 Kuler -35°C i Prestone -37°C (1 l) oraz DEG odmrażacz do zamków 25 ml. Na zimę i do bieżącej obsługi auta.

W tej kategorii są **płyny eksploatacyjne** do bieżącej obsługi auta:

- K2 Kuler -35°C zielony 1 l (gotowy płyn do chłodnic),
- Prestone płyn do chłodnic -37°C 1 l (gotowy),
- DEG Odmrażacz do zamków 25 ml.

Przed dolaniem płynu do chłodnicy sprawdź w instrukcji auta, jaki rodzaj płynu jest zalecany. Płyny do spryskiwaczy znajdziesz w kategorii [Płyny do spryskiwaczy](/kategoria/mycie-auta?sub=szyby-i-lusterka&typ=szyby-i-lusterka-plyny-do-spryskiwaczy).

## silnik-i-podwozie | Silnik, DPF i podwozie
- Źródło: nowy opis
- Tytuł w Google: Konserwacja podwozia i czyszczenie DPF – K2
- Opis w Google: K2 Durabit 1 l do konserwacji podwozia (pod pędzel) i K2 DPF Cleaner 500 ml do regeneracji filtra cząstek stałych. Sklep w Białymstoku.

W tej kategorii są środki do **silnika, filtra DPF i podwozia**:

- K2 Durabit 1 l: środek do konserwacji podwozia, nakładany pędzlem,
- K2 DPF Cleaner 500 ml: regenerator filtra cząstek stałych.

Sposób użycia i zakres stosowania sprawdź na etykiecie. Do mycia komory silnika zobacz [Mycie silnika](/kategoria/mycie-auta?sub=plastiki-guma-i-detale&typ=plastiki-guma-i-detale-mycie-silnika).

## akcesoria | Akcesoria
- Źródło: nowy opis
- Tytuł w Google: Oringi i zawory do opryskiwaczy Kwazar
- Opis w Google: Uszczelki (oringi) i grzybki zaworów do pompek opryskiwaczy Kwazar Orion i Venus. Części zamienne do opryskiwaczy ciśnieniowych.

W tej kategorii są **drobne części zamienne do opryskiwaczy Kwazar**:

- oring na kołnierz opryskiwacza i pianownicy Orion,
- oring górny do tłoka pompki Orion (46×5, do 3, 6, 9 i 12 l),
- oring do pompki Venus,
- oring 31×3 mm do pompki,
- grzybki zaworu: 29 mm do Orion i 20 mm do Venus (FPM).

Większe części (lance, wężyki, pompki, rękojeści) są w kategorii [Części do opryskiwaczy](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice&typ=opryskiwacze-i-pianownice-czesci-do-opryskiwaczy).

## lazienka-i-wc-sanitariaty-i-wc | Sanitariaty i WC
- Źródło: nowy opis
- Tytuł w Google: Środki do WC i sanitariatów – Royal, Tenzi
- Opis w Google: Płyny i żele do mycia WC, sanitariatów i pomieszczeń sanitarnych: Royal WC, Rokasat, Sanicell, Tenzi Top Efekt Sanit i Sanit Shine. 1 l i 5 l.

W tej kategorii są **środki do mycia WC i pomieszczeń sanitarnych**, do domu, biura i obiektów:

- Royal WC CM 1 l i Royal WC CL 5 l,
- Royal Rokasat 37 (mycie i dezynfekcja) i Rokasat RO-37 1 l,
- Royal 200 Sanicell 5 l (na zapach z kratek ociekowych),
- Tenzi Top Efekt Sanit 1 l i 5 l, Tenzi Sanit Shine 1 l, Tenzi WC Sani (żel),
- Yplon Żel do WC.

Na kamień i osady w kabinach prysznicowych zobacz kategorię [Kabiny prysznicowe i kamień](/kategoria/dom-i-ogrod?sub=lazienka-i-wc&typ=lazienka-i-wc-kabiny-prysznicowe-i-kamien).

## lazienka-i-wc-kabiny-prysznicowe-i-kamien | Kabiny prysznicowe i kamień
- Źródło: nowy opis
- Tytuł w Google: Środek do kabin prysznicowych i na kamień
- Opis w Google: Płyny do mycia kabin prysznicowych Tenzi (1 l i 5 l, także Shine) oraz Cilit Bang Zero Kamienia 750 ml na kamień i rdzę.

W tej kategorii są **środki do kabin prysznicowych i usuwania kamienia**:

- Tenzi Kabiny prysznicowe 1 l i 5 l,
- Tenzi Kabiny prysznicowe Shine 1 l,
- Cilit Bang Spray Zero Kamienia 750 ml (na kamień i rdzę).

Regularne mycie kabiny ogranicza osadzanie się kamienia. Do sanitariatów zobacz [Sanitariaty i WC](/kategoria/dom-i-ogrod?sub=lazienka-i-wc&typ=lazienka-i-wc-sanitariaty-i-wc), a do luster i szyb [Okna i lustra](/kategoria/dom-i-ogrod?sub=okna-i-lustra).

## lazienka-i-wc-toalety-turystyczne | Toalety turystyczne
- Źródło: nowy opis
- Tytuł w Google: Płyn do toalet turystycznych – Royal Blue Magic
- Opis w Google: Dodatki do toalet turystycznych, przenośnych i wolnostojących: Royal Blue Magic (1, 5 i 20 l), Blue Magic Aut (2 i 5 l), Flush Magic 2 l.

W tej kategorii są **płyny do toalet turystycznych**, przenośnych i wolnostojących, np. w kamperach, przyczepach i na budowach:

- Royal Blue Magic 1 l, 5 l i 20 l (dodatek do toalet wolnostojących),
- Royal Blue Magic Aut 2 l i 5 l (do toalet przenośnych),
- Royal Flush Magic 2 l (40 dawek, według producenta).

Dawkowanie sprawdź na etykiecie produktu. Do mycia sanitariatów zobacz [Sanitariaty i WC](/kategoria/dom-i-ogrod?sub=lazienka-i-wc&typ=lazienka-i-wc-sanitariaty-i-wc).

## kuchnia-mycie-naczyn | Mycie naczyń
- Źródło: nowy opis
- Tytuł w Google: Płyn do mycia naczyń 5 l – Tenzi Boberex, Royal
- Opis w Google: Płyny do ręcznego mycia naczyń w koncentracie: Tenzi Boberex 1 l i 5 l, Boberex Lemon, Tenzi Tric 5 l, Royal RO-2 dla gastronomii, Clinex.

W tej kategorii są **płyny do ręcznego mycia naczyń**, do domu i gastronomii:

- Tenzi Boberex 1 l i 5 l (skoncentrowany) i Tenzi Boberex Lemon 1 l,
- Tenzi Tric 5 l (cytrynowy),
- Royal RO-2 1 l (koncentrat dla gastronomii, mięta),
- Clinex Hand Wash 500 ml.

Kanister 5 l to wygodny zapas do domu, biura czy lokalu. Koncentrat dozuj według etykiety. Do tłuszczu na kuchence i w piekarniku zobacz [Piekarniki, grille i odtłuszczanie](/kategoria/dom-i-ogrod?sub=kuchnia&typ=kuchnia-piekarniki-grille-i-odtluszczanie).

## kuchnia-piekarniki-grille-i-odtluszczanie | Piekarniki, grille i odtłuszczanie
- Źródło: nowy opis
- Tytuł w Google: Środek do piekarnika i grilla – Tenzi Top Grill
- Opis w Google: Preparaty do piekarników, grilli, rusztów, wędzarni i płyt indukcyjnych: Tenzi Top Grill, Top Grill Black, Gran Smog, Clinex Grill, odtłuszczacz Feniks.

W tej kategorii są **środki do piekarników, grilli i usuwania tłuszczu**:

- Tenzi Top Grill 1 l (piekarniki, ruszty, piecyki) i Top Grill Black 600 ml,
- Tenzi Gran Smog 1 l (wędzarnie, piekarniki, kuchenki),
- Tenzi Płyty indukcyjne 600 ml,
- Clinex Grill 1 l,
- Feniks Professional Degreaser Ani-Fat (odtłuszczacz).

Przed użyciem przeczytaj etykietę i sprawdź, na jakich powierzchniach można stosować dany środek. Do kamienia w czajniku i ekspresie zobacz [AGD i odkamienianie](/kategoria/dom-i-ogrod?sub=kuchnia&typ=kuchnia-agd-i-odkamienianie).

## kuchnia-agd-i-odkamienianie | AGD i odkamienianie
- Źródło: nowy opis
- Tytuł w Google: Odkamieniacz i środki do ekspresów – Tenzi
- Opis w Google: Odkamieniacze i środki do AGD: Tenzi Derast 1 l, Clinex Destoner, Tenzi Gran Pres do ekspresów do kawy i Royal Rosan do automatów do bitej śmietany.

W tej kategorii są **odkamieniacze i środki do czyszczenia sprzętu AGD**:

- Tenzi Derast 1 l (według producenta bardzo silny odkamieniacz),
- Clinex Destoner 1 l (odkamieniacz),
- Tenzi Gran Pres AGD 500 g (do ekspresów do kawy),
- Royal Rosan Ro-155 5 l (do automatów do bitej śmietany).

Przed odkamienianiem sprawdź w instrukcji urządzenia, jaki środek jest dopuszczony. Inne środki kuchenne znajdziesz w kategoriach [Mycie naczyń](/kategoria/dom-i-ogrod?sub=kuchnia&typ=kuchnia-mycie-naczyn) i [Piekarniki, grille i odtłuszczanie](/kategoria/dom-i-ogrod?sub=kuchnia&typ=kuchnia-piekarniki-grille-i-odtluszczanie).

## meble-i-powierzchnie-meble-i-powierzchnie | Meble i powierzchnie
- Źródło: nowy opis
- Tytuł w Google: Płyn do mebli, ekranów i plastiku – Tenzi, Royal
- Opis w Google: Środki do mebli biurowych, ekranów LCD, plastiku i drewna w saunach: Tenzi Office Clean, Tenzi Mycie ekranów LCD, Royal Cleaner, Royal Sauna, Clinex.

W tej kategorii są **środki do mebli i różnych powierzchni** w domu i biurze:

- Tenzi Office Clean 1 l i Office Clean Spray 1 l (do mebli),
- Tenzi Mycie ekranów LCD 600 ml,
- Clinex Fast Plast 1 l (do plastiku) i Clinex Anti-Spot (odplamiacz),
- Royal Cleaner 5 l (preparat myjący na bazie mydła),
- Royal RO-403 Sauna (do drewna w saunach).

Inne środki specjalne: [Udrażnianie rur](/kategoria/dom-i-ogrod?sub=meble-i-powierzchnie&typ=meble-i-powierzchnie-udraznianie-rur) i [Pleśń i dezynfekcja](/kategoria/dom-i-ogrod?sub=meble-i-powierzchnie&typ=meble-i-powierzchnie-plesn-i-dezynfekcja).

## meble-i-powierzchnie-udraznianie-rur | Udrażnianie rur
- Źródło: nowy opis
- Tytuł w Google: Środek do udrażniania rur – Tenzi, Clinex Drill
- Opis w Google: Preparaty do udrażniania rur i kanalizacji: Tenzi Udrażniacz rur 1 l, Tenzi Penetrator 500 g w granulkach i Clinex Drill 1 l.

W tej kategorii są **środki do udrażniania rur i odpływów**:

- Tenzi Udrażniacz rur 1 l (płyn),
- Tenzi Penetrator 500 g (granulki),
- Clinex Drill 1 l (do kanalizacji).

Takie preparaty są zwykle silnie działające. Stosuj je ściśle według etykiety, w rękawicach, i nie mieszaj z innymi środkami.

## meble-i-powierzchnie-plesn-i-dezynfekcja | Pleśń i dezynfekcja
- Źródło: nowy opis
- Tytuł w Google: Środek na pleśń i płyn do dezynfekcji – Tenzi
- Opis w Google: Tenzi środek pleśniobójczy i grzybobójczy 0,6 l oraz Tenzi DS-1 GT 1 l, gotowy płyn do dezynfekcji powierzchni w gastronomii.

W tej kategorii są:

- Tenzi Środek pleśniobójczy i grzybobójczy 0,6 l,
- Tenzi DS-1 GT 1 l: gotowy do użycia płyn do dezynfekcji powierzchni w gastronomii.

Przed użyciem przeczytaj etykietę: znajdziesz na niej zakres stosowania, czas działania i zasady bezpieczeństwa. Na mech i grzyby na elewacji zobacz [Elewacje i dachy](/kategoria/dom-i-ogrod?sub=ogrod-i-elewacje&typ=ogrod-i-elewacje-elewacje-i-dachy).

## ogrod-i-elewacje-elewacje-i-dachy | Elewacje i dachy
- Źródło: nowy opis
- Tytuł w Google: Płyn do mycia elewacji i dachów – Tenzi
- Opis w Google: Preparaty do mycia elewacji i dachów oraz usuwania grzybów: Tenzi APC Out 1 l i 5 l, Tenzi Top Efekt Moss 1 l i 5 l (konserwacja elewacji).

W tej kategorii są **środki do mycia elewacji i dachów**:

- Tenzi APC Out 1 l i 5 l (do mycia elewacji i dachów),
- Tenzi Top Efekt Moss 1 l i 5 l (usuwanie grzybów i konserwacja elewacji).

Do nanoszenia na większe powierzchnie przyda się [opryskiwacz ciśnieniowy](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice&typ=opryskiwacze-i-pianownice-opryskiwacze-cisnieniowe), a do wysokich miejsc [lanca teleskopowa](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice&typ=opryskiwacze-i-pianownice-czesci-do-opryskiwaczy). Środki do kostki brukowej są w kategorii [Kostka brukowa](/kategoria/dom-i-ogrod?sub=ogrod-i-elewacje&typ=ogrod-i-elewacje-kostka-brukowa).

## ogrod-i-elewacje-kostka-brukowa | Kostka brukowa
- Źródło: nowy opis
- Tytuł w Google: Płyn do mycia kostki brukowej – Tenzi
- Opis w Google: Tenzi Doczyszczanie Kostki Brukowej 2, płyn do mycia kostki brukowej 1 l. Do podjazdów, tarasów i chodników. Sklep w Białymstoku.

**Płyn do mycia kostki brukowej** pomaga doczyścić podjazd, chodnik czy taras. W tej kategorii jest Tenzi Doczyszczanie Kostki Brukowej 2, 1 l.

Dawkowanie i sposób użycia sprawdź na etykiecie. Do mycia elewacji zobacz [Elewacje i dachy](/kategoria/dom-i-ogrod?sub=ogrod-i-elewacje&typ=ogrod-i-elewacje-elewacje-i-dachy).

## ogrod-i-elewacje-nagrobki-i-kamien | Nagrobki i kamień
- Źródło: nowy opis
- Tytuł w Google: Środek do czyszczenia nagrobków – Tenzi
- Opis w Google: Tenzi Nagrobki Czyszczenie 600 ml i Tenzi Nagrobki Konserwacja do granitu, marmuru, lastryko i kamienia. Czyszczenie i ochrona pomników.

W tej kategorii są **środki do czyszczenia i konserwacji nagrobków** oraz kamienia:

- Tenzi Nagrobki Czyszczenie 600 ml,
- Tenzi Nagrobki Konserwacja (do granitu, marmuru, lastryko i kamienia).

Najpierw wyczyść pomnik, a po wyschnięciu nałóż środek do konserwacji. Szczegóły znajdziesz na etykiecie.

## ogrod-i-elewacje-panele-fotowoltaiczne | Panele fotowoltaiczne
- Źródło: nowy opis
- Tytuł w Google: Płyn do mycia paneli fotowoltaicznych – Tenzi
- Opis w Google: Tenzi Solar Panels 1 l, płyn do mycia paneli fotowoltaicznych. Czyszczenie paneli na dachu i gruncie. Sklep w Białymstoku, wysyłka w całej Polsce.

**Płyn do mycia paneli fotowoltaicznych** usuwa kurz i brud z powierzchni paneli. W tej kategorii jest Tenzi Solar Panels 1 l.

Przed myciem sprawdź zalecenia producenta paneli. Do mycia z ziemi przyda się [lanca teleskopowa](/kategoria/akcesoria-detailingowe?sub=opryskiwacze-i-pianownice&typ=opryskiwacze-i-pianownice-czesci-do-opryskiwaczy) z opryskiwaczem.

## ogrod-i-elewacje-inne-do-ogrodu | Inne do ogrodu
- Źródło: nowy opis
- Tytuł w Google: Środki i akcesoria do ogrodu – markizy, krety
- Opis w Google: Royal Cleaning Awning, pianka do czyszczenia markiz, przedsionków i namiotów, Kunagone odstraszacz na krety i łopata do śniegu Kwazar.

W tej kategorii są różne produkty do ogrodu i wokół domu:

- Royal Cleaning Awning 500 ml (pianka do markiz, przedsionków i namiotów),
- Kunagone odstraszacz na krety,
- Kwazar łopata do śniegu.

Chemię do elewacji, kostki i kamienia znajdziesz w kategorii [Ogród, elewacje i kamień](/kategoria/dom-i-ogrod?sub=ogrod-i-elewacje).

## akcesoria-do-sprzatania | Akcesoria do sprzątania
- Źródło: nowy opis
- Tytuł w Google: Akcesoria do sprzątania – kij do miotły 120 cm
- Opis w Google: Akcesoria do sprzątania domu i posesji: plastikowy, karbowany kij do miotły 120 cm. Sklep w Białymstoku, wysyłka w całej Polsce.

W tej kategorii są **akcesoria do sprzątania**. Obecnie jest tu plastikowy, karbowany kij do miotły o długości 120 cm.

Chemię do sprzątania znajdziesz w dziale [Dom i ogród](/kategoria/dom-i-ogrod), a ściereczki i mikrofibry w kategorii [Mikrofibry i ręczniki](/kategoria/akcesoria-detailingowe?sub=mikrofibry-i-reczniki).
