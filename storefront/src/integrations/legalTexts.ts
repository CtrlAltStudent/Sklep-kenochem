// Nowe wersje regulaminu i polityki prywatności (23.10.2026) – dopasowane do funkcji nowego sklepu:
// konto klienta z pobraniem danych i usuwaniem konta, przypomnienie o koszyku, prośba o opinię, opinie, BaseLinker,
// Przelewy24, przewoźnicy, własny baner cookies i narzędzia Google / Meta / Microsoft.
// Zapis jako SZKIC strony (Podstrony → Regulamin / Polityka prywatności) – właściciel czyta i publikuje w panelu.
// Format: ["h2" | "h3" | "p", tekst] albo ["ul", [punkty]]; **pogrubienie**.

type Block = ["h2" | "h3" | "p", string] | ["ul", string[]];

const SELLER = "KENOCHEM KUCZYŃSKI spółka jawna z siedzibą w Białymstoku, ul. Gen. Władysława Andersa 40/16, 15-113 Białystok, wpisana do rejestru przedsiębiorców Krajowego Rejestru Sądowego pod numerem KRS 0000417794, NIP 5423224790, REGON 200690197";
const MAIL = "aukcje@sonax.bialystok.pl";

export const REGULAMIN: Block[] = [
  ["p", "**Regulamin sklepu internetowego sonax.sklep.pl** – wersja obowiązująca od 1 listopada 2026 r."],
  ["h2", "1. Postanowienia ogólne"],
  ["ul", [
    `Sklep internetowy działający pod adresem https://sonax.sklep.pl (dalej: „Sklep”) jest prowadzony przez ${SELLER}, dalej: „Sprzedawca”.`,
    `Kontakt ze Sprzedawcą: e-mail ${MAIL}, telefon +48 500 021 705 (pn–pt 8:00–16:00), pisemnie na adres siedziby Sprzedawcy.`,
    "Regulamin określa zasady korzystania ze Sklepu, zakładania i prowadzenia konta, składania zamówień, zawierania i wykonywania umów sprzedaży, płatności, dostawy, reklamacji, odstąpienia od umowy oraz korzystania z usług świadczonych drogą elektroniczną.",
    "Do korzystania ze Sklepu potrzebne są urządzenie z dostępem do Internetu, aktualna przeglądarka internetowa z włączoną obsługą JavaScript i plików cookies niezbędnych do działania koszyka oraz aktywny adres e-mail.",
    "Regulamin jest udostępniany nieodpłatnie w sposób umożliwiający jego pobranie, utrwalenie i wydrukowanie.",
  ]],
  ["h2", "2. Definicje"],
  ["ul", [
    "**Klient** – osoba fizyczna, osoba prawna albo jednostka organizacyjna dokonująca zakupów w Sklepie.",
    "**Konsument** – osoba fizyczna dokonująca z przedsiębiorcą czynności prawnej niezwiązanej bezpośrednio z jej działalnością gospodarczą lub zawodową.",
    "**Przedsiębiorca na prawach konsumenta** – osoba fizyczna zawierająca umowę bezpośrednio związaną z jej działalnością gospodarczą, gdy z treści umowy wynika, że nie ma ona dla niej charakteru zawodowego.",
    "**Towar** – produkt oferowany do sprzedaży w Sklepie.",
    "**Zamówienie** – oświadczenie Klienta zmierzające do zawarcia umowy sprzedaży Towarów wskazanych w Zamówieniu.",
    "**Konto** – bezpłatna usługa umożliwiająca Klientowi m.in. przeglądanie historii i statusu Zamówień oraz zapisanie danych i adresów.",
  ]],
  ["h2", "3. Towary, ceny i promocje"],
  ["ul", [
    "Informacje o Towarach zamieszczone w Sklepie stanowią zaproszenie do zawarcia umowy, a nie ofertę w rozumieniu Kodeksu cywilnego.",
    "Ceny są podawane w złotych polskich i zawierają podatek VAT. Cena nie obejmuje kosztów dostawy, chyba że wyraźnie wskazano inaczej.",
    "Łączna cena Towarów wraz z kosztem dostawy jest prezentowana Klientowi przed złożeniem Zamówienia.",
    "Przy informowaniu o obniżce ceny Sklep podaje również najniższą cenę Towaru z okresu 30 dni przed wprowadzeniem obniżki.",
    "Towar oznaczony jako niedostępny nie może zostać zamówiony. Klient może zapisać się na jednorazowe powiadomienie e-mail o ponownej dostępności Towaru.",
    "Sprzedawca może zmieniać ofertę i ceny; zmiany nie dotyczą Zamówień złożonych przed ich wprowadzeniem.",
  ]],
  ["h2", "4. Składanie zamówień i zawarcie umowy"],
  ["ul", [
    "Zamówienia można składać przez całą dobę. Założenie Konta nie jest wymagane – zakup jest możliwy także bez rejestracji.",
    "Klient dodaje Towary do koszyka, wybiera sposób dostawy i płatności, podaje dane do realizacji Zamówienia, sprawdza podsumowanie, akceptuje Regulamin i składa Zamówienie przyciskiem wskazującym na obowiązek zapłaty.",
    "Klient jest zobowiązany podać dane prawdziwe i kompletne. Jeżeli Klient chce otrzymać fakturę na firmę, podaje nazwę firmy i NIP.",
    "Po złożeniu Zamówienia Klient otrzymuje e-mail z potwierdzeniem jego przyjęcia. Z chwilą otrzymania tej wiadomości umowa sprzedaży zostaje zawarta.",
    "Jeżeli realizacja Zamówienia nie jest możliwa, Sprzedawca niezwłocznie poinformuje o tym Klienta i zwróci otrzymane płatności w zakresie niezrealizowanej części Zamówienia.",
    "O kolejnych etapach realizacji (przyjęcie płatności, wysłanie przesyłki wraz z numerem do śledzenia, anulowanie) Sprzedawca informuje Klienta e-mailem.",
  ]],
  ["h2", "5. Płatności"],
  ["ul", [
    "Dostępne sposoby płatności są prezentowane podczas składania Zamówienia. Mogą obejmować: BLIK, szybki przelew internetowy i płatność kartą za pośrednictwem Przelewy24 (operator: PayPro S.A. z siedzibą w Poznaniu), tradycyjny przelew bankowy oraz płatność przy odbiorze.",
    "Przy przelewie tradycyjnym dane rachunku Sprzedawcy są podane w e-mailu z potwierdzeniem Zamówienia; w tytule należy wpisać numer Zamówienia. Zamówienie jest wysyłane po zaksięgowaniu wpłaty.",
    "Płatności elektroniczne są realizowane na zasadach określonych w regulaminie operatora płatności. Sprzedawca nie otrzymuje danych karty płatniczej.",
    "Jeżeli płatność nie zostanie dokonana, Sprzedawca może wezwać Klienta do zapłaty, wyznaczając dodatkowy termin, a po jego bezskutecznym upływie odstąpić od umowy.",
    "Do każdego Zamówienia Sprzedawca wystawia dowód zakupu. Faktura VAT jest wystawiana na żądanie Klienta zgłoszone w formularzu Zamówienia i przesyłana w formie elektronicznej lub przez Krajowy System e-Faktur, zgodnie z obowiązującymi przepisami.",
  ]],
  ["h2", "6. Dostawa i odbiór"],
  ["ul", [
    "Dostawa jest realizowana na terytorium Polski. Aktualne sposoby dostawy (np. Paczkomat InPost, kurier InPost, ORLEN Paczka, kurier GLS, odbiór osobisty w siedzibie Sprzedawcy) oraz ich koszt są widoczne podczas składania Zamówienia. Wiążący jest koszt wskazany w podsumowaniu Zamówienia.",
    "Przy dostawie do punktu odbioru Klient wybiera punkt na mapie lub wpisuje jego kod. Kod odbioru przesyłki przekazuje przewoźnik SMS-em lub e-mailem.",
    "Sprzedawca wysyła Zamówienie zwykle w ciągu 1 dnia roboczego od jego opłacenia (przy płatności przy odbiorze – od złożenia Zamówienia). W braku odrębnego uzgodnienia Towar zostanie wydany nie później niż w terminie 30 dni od zawarcia umowy.",
    "Odbiór osobisty jest możliwy w dni robocze w godzinach pracy Sprzedawcy, po otrzymaniu e-maila o gotowości Zamówienia.",
    "Klient powinien, w miarę możliwości, sprawdzić stan przesyłki przy odbiorze. Brak takiego sprawdzenia nie ogranicza ustawowych praw Klienta.",
  ]],
  ["h2", "7. Zgodność Towaru z umową i reklamacje"],
  ["ul", [
    "Sprzedawca odpowiada wobec Konsumenta oraz Przedsiębiorcy na prawach konsumenta za zgodność Towaru z umową na zasadach określonych w ustawie o prawach konsumenta.",
    "Jeżeli Towar jest niezgodny z umową, Klient może żądać jego naprawy lub wymiany, a w przypadkach określonych przepisami – złożyć oświadczenie o obniżeniu ceny albo odstąpieniu od umowy.",
    `Reklamację można złożyć przez formularz na stronie „Zwroty i reklamacje”, e-mailem na adres ${MAIL} albo pisemnie na adres Sprzedawcy. Warto podać numer Zamówienia, opis problemu, żądanie oraz dane kontaktowe.`,
    "Sprzedawca odpowie na reklamację Konsumenta w terminie 14 dni od jej otrzymania, na papierze lub innym trwałym nośniku (np. e-mailem). O kolejnych etapach rozpatrywania zgłoszenia Klient jest informowany e-mailem.",
    "Koszty naprawy, wymiany oraz dostarczenia Towaru niezgodnego z umową ponosi Sprzedawca.",
    "Wobec Klientów niebędących Konsumentami ani Przedsiębiorcami na prawach konsumenta odpowiedzialność z tytułu rękojmi jest wyłączona w zakresie dopuszczonym przez prawo; nie dotyczy to praw z gwarancji producenta.",
  ]],
  ["h2", "8. Odstąpienie od umowy"],
  ["ul", [
    "Konsument oraz Przedsiębiorca na prawach konsumenta może odstąpić od umowy zawartej na odległość bez podawania przyczyny w terminie 14 dni od objęcia Towaru w posiadanie.",
    `Aby zachować termin, wystarczy przed jego upływem wysłać oświadczenie o odstąpieniu: przez formularz na stronie „Zwroty i reklamacje”, e-mailem na adres ${MAIL} albo pocztą. Skorzystanie z formularza nie jest obowiązkowe. Otrzymanie oświadczenia złożonego przez formularz Sprzedawca potwierdza e-mailem.`,
    "Towar należy odesłać niezwłocznie, nie później niż w terminie 14 dni od odstąpienia, na adres: KENOCHEM KUCZYŃSKI sp.j., ul. Gen. Władysława Andersa 40/16, 15-113 Białystok, z dopiskiem „Zwrot” i numerem zgłoszenia. Bezpośredni koszt odesłania Towaru ponosi Klient.",
    "Sprzedawca zwróci wszystkie otrzymane płatności, w tym koszt najtańszego zwykłego sposobu dostawy oferowanego w Sklepie, w terminie 14 dni od otrzymania oświadczenia – tym samym sposobem płatności, chyba że Klient zgodzi się na inny, bezkosztowy sposób. Sprzedawca może wstrzymać zwrot do chwili otrzymania Towaru lub dowodu jego odesłania.",
    "Klient odpowiada za zmniejszenie wartości Towaru wynikające z korzystania z niego w sposób wykraczający poza konieczny do stwierdzenia jego charakteru, cech i funkcjonowania.",
  ]],
  ["h2", "9. Wyjątki od prawa odstąpienia"],
  ["p", "Prawo odstąpienia nie przysługuje w przypadkach określonych w art. 38 ustawy o prawach konsumenta, w szczególności w odniesieniu do Towaru dostarczanego w zapieczętowanym opakowaniu, którego po otwarciu nie można zwrócić ze względu na ochronę zdrowia lub względy higieniczne, jeżeli opakowanie zostało otwarte po dostarczeniu, a także Towaru, który po dostarczeniu ze względu na swój charakter zostaje nierozłącznie połączony z innymi rzeczami."],
  ["h2", "10. Konto i inne usługi elektroniczne"],
  ["p", "Sprzedawca świadczy nieodpłatnie następujące usługi elektroniczne:"],
  ["ul", [
    "**Konto** – umowa zawierana na czas nieoznaczony z chwilą rejestracji. W Koncie Klient widzi historię i status Zamówień, zapisuje dane i adresy, może dołączyć Zamówienia złożone wcześniej bez logowania (po potwierdzeniu adresu e-mail) oraz pobrać kopię swoich danych.",
    "**Usunięcie Konta** – Klient może w każdej chwili samodzielnie usunąć Konto w zakładce Moje konto → Prywatność (po podaniu hasła) albo zgłaszając to Sprzedawcy. Usunięcie Konta nie wpływa na realizację zawartych wcześniej umów; dane w Zamówieniach są anonimizowane, z zastrzeżeniem danych, które Sprzedawca musi przechowywać na podstawie przepisów (np. faktury).",
    "**Formularze kontaktowe**, w tym „Zapytaj o produkt” oraz formularz zwrotów i reklamacji – umowa zawierana na czas obsługi zgłoszenia.",
    "**Powiadomienie o dostępności** – jednorazowy e-mail, gdy Towar wróci na stan.",
    "**Przypomnienie o koszyku** – jeżeli Klient zaznaczy taką zgodę w formularzu Zamówienia, a nie dokończy zakupu, Sprzedawca zapisuje zawartość koszyka i wysyła jedno przypomnienie e-mail z linkiem przywracającym koszyk. Zgodę można wycofać w każdej chwili – odznaczając pole albo klikając link w wiadomości.",
    "**Newsletter** – na podstawie odrębnej zgody; rezygnacja jest możliwa w każdej chwili.",
    "**Opinie o Towarach** – zasady opisuje pkt 11.",
  ]],
  ["p", `Zabronione jest dostarczanie treści o charakterze bezprawnym oraz działania zakłócające pracę Sklepu. Reklamacje dotyczące usług elektronicznych można składać na adres ${MAIL}; odpowiedź zostanie udzielona w terminie 14 dni.`],
  ["h2", "11. Opinie o Towarach"],
  ["ul", [
    "Opinię o Towarze może dodać każdy użytkownik Sklepu. Po zakupie Sprzedawca może poprosić Klienta e-mailem o wystawienie opinii o kupionych Towarach.",
    "Opinie są publikowane po sprawdzeniu przez Sprzedawcę (moderacji). Sprzedawca nie publikuje opinii zawierających treści bezprawne, obraźliwe, reklamowe lub niezwiązane z Towarem; nie usuwa opinii tylko dlatego, że są negatywne.",
    "Opinia oznaczona jako „Potwierdzony zakup” pochodzi od osoby, której zakup Towaru w Sklepie Sprzedawca sprawdził na podstawie Zamówienia. Pozostałe opinie nie są weryfikowane pod kątem zakupu.",
    "Sprzedawca nie zamieszcza ani nie zleca zamieszczania nieprawdziwych opinii i nie zniekształca opinii w celu promowania Towarów. Za wystawienie opinii nie przysługuje wynagrodzenie.",
  ]],
  ["h2", "12. Dane osobowe i pliki cookies"],
  ["p", "Administratorem danych osobowych Klientów jest Sprzedawca. Szczegółowe informacje o celach, podstawach i okresach przetwarzania danych, odbiorcach danych, prawach Klientów oraz plikach cookies zawiera Polityka prywatności dostępna w Sklepie."],
  ["h2", "13. Pozasądowe rozwiązywanie sporów"],
  ["ul", [
    "Konsument może skorzystać z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, w szczególności z pomocy wojewódzkiego inspektoratu Inspekcji Handlowej, stałego polubownego sądu konsumenckiego lub miejskiego albo powiatowego rzecznika konsumentów.",
    "Informacje o procedurach są dostępne na stronach polubowne.uokik.gov.pl oraz prawakonsumenta.uokik.gov.pl. Skorzystanie z nich jest dobrowolne.",
  ]],
  ["h2", "14. Postanowienia końcowe"],
  ["ul", [
    "Do umów zawieranych za pośrednictwem Sklepu stosuje się prawo polskie. Wybór prawa nie pozbawia Konsumenta ochrony wynikającej z przepisów, których nie można wyłączyć umową.",
    "Sprzedawca może zmienić Regulamin z ważnych przyczyn (zmiana przepisów, danych Sprzedawcy, sposobów płatności lub dostawy, funkcji Sklepu). Zmiany nie dotyczą Zamówień złożonych przed ich wejściem w życie. Klienci posiadający Konto zostaną poinformowani e-mailem co najmniej 14 dni wcześniej i mogą przed wejściem zmian w życie usunąć Konto.",
    "Regulamin obowiązuje od 1 listopada 2026 r.",
  ]],
];

export const POLITYKA: Block[] = [
  ["p", "Wyjaśniamy, jakie dane przetwarzamy w sklepie sonax.sklep.pl, dlaczego to robimy, komu je powierzamy i jakie prawa Ci przysługują."],
  ["h2", "1. Administrator danych"],
  ["p", `Administratorem Twoich danych osobowych jest ${SELLER} (dalej: „my”).`],
  ["p", `W sprawach prywatności napisz na ${MAIL}, zadzwoń pod +48 500 021 705 albo napisz na adres siedziby.`],
  ["h2", "2. Jakie dane przetwarzamy"],
  ["ul", [
    "dane identyfikacyjne i kontaktowe: imię i nazwisko, adres, telefon, e-mail;",
    "dane firmowe do faktury: nazwa firmy, NIP, adres;",
    "dane zamówienia, płatności i dostawy: numer zamówienia, produkty, kwoty, status płatności, wybrany punkt odbioru, numer przesyłki;",
    "dane konta: e-mail, hasło (przechowywane wyłącznie w postaci zaszyfrowanej, nie znamy go), zapisane adresy, daty zgód;",
    "zawartość koszyka – tylko jeśli zgodzisz się na przypomnienie o niedokończonym zamówieniu;",
    "treść wiadomości, pytań o produkt, zgłoszeń zwrotu i reklamacji oraz opinii (wraz z podpisem, który wybierzesz);",
    "adres e-mail do powiadomienia o dostępności produktu lub do newslettera;",
    "dane techniczne: adres IP, informacje o urządzeniu i przeglądarce, dane z plików cookies (w zakresie opisanym w pkt 7).",
  ]],
  ["h2", "3. Cele, podstawy prawne i czas przetwarzania"],
  ["ul", [
    "**Zawarcie i wykonanie umowy sprzedaży** (zamówienie, płatność, dostawa, e-maile o statusie zamówienia) – art. 6 ust. 1 lit. b RODO; przez czas realizacji umowy, a potem do przedawnienia roszczeń.",
    "**Faktury, księgowość i podatki** – art. 6 ust. 1 lit. c RODO; przez okres wymagany przepisami (co do zasady 5 lat od końca roku podatkowego).",
    "**Reklamacje, zwroty i odstąpienie od umowy** – art. 6 ust. 1 lit. b i c RODO; do zakończenia sprawy i przedawnienia roszczeń.",
    "**Konto klienta** – art. 6 ust. 1 lit. b RODO; do usunięcia konta.",
    "**Odpowiedzi na wiadomości i pytania o produkt** – art. 6 ust. 1 lit. b lub f RODO (nasz uzasadniony interes: obsługa klientów); do zakończenia korespondencji i przez okres potrzebny do wykazania jej przebiegu.",
    "**Powiadomienie o dostępności produktu** – art. 6 ust. 1 lit. b RODO; do wysłania powiadomienia albo rezygnacji.",
    "**Przypomnienie o porzuconym koszyku** – art. 6 ust. 1 lit. a RODO (Twoja zgoda zaznaczona przy zamówieniu); zapisany koszyk usuwamy po złożeniu zamówienia, wycofaniu zgody lub najpóźniej po 30 dniach. Wysyłamy najwyżej jedno przypomnienie.",
    "**Prośba o opinię po zakupie** – art. 6 ust. 1 lit. f RODO (uzasadniony interes: poznanie opinii o sprzedanych produktach); jedna wiadomość kilka dni po wysyłce zamówienia. Możesz w każdej chwili zgłosić sprzeciw, odpowiadając na wiadomość.",
    "**Publikacja opinii o produkcie** – art. 6 ust. 1 lit. a RODO (zgoda wyrażona przez dodanie opinii); do czasu usunięcia opinii.",
    "**Newsletter** – art. 6 ust. 1 lit. a RODO; do wycofania zgody.",
    "**Statystyka i reklama** (narzędzia Google, Meta, Microsoft) – art. 6 ust. 1 lit. a RODO (zgoda w banerze cookies); do wycofania zgody.",
    "**Bezpieczeństwo sklepu i dochodzenie roszczeń** – art. 6 ust. 1 lit. f RODO; przez okres potrzebny do tych celów.",
  ]],
  ["h2", "4. Komu przekazujemy dane"],
  ["p", "Dane przekazujemy tylko w zakresie potrzebnym do wykonania danej usługi. Odbiorcami mogą być:"],
  ["ul", [
    "operator systemu BaseLinker – obsługa zamówień, wysyłek i stanów magazynowych;",
    "dostawca systemu księgowego WAPRO – wystawianie faktur i ewidencja sprzedaży;",
    "przewoźnicy: InPost sp. z o.o., ORLEN Paczka sp. z o.o., GLS Poland – w zakresie potrzebnym do doręczenia przesyłki;",
    "operator płatności PayPro S.A. (Przelewy24) – przy płatności online; nie otrzymujemy danych Twojej karty;",
    "dostawcy serwera, poczty elektronicznej i kopii zapasowych sklepu;",
    "jeżeli wyrazisz zgodę w banerze cookies: Google Ireland Limited (Google Analytics, Google Ads, Google Tag Manager), Meta Platforms Ireland Limited (piksel Meta), Microsoft Ireland Operations Limited (Microsoft Clarity) – o ile dane narzędzie jest aktywne w sklepie;",
    "biuro rachunkowe, doradcy prawni, banki oraz uprawnione organy publiczne, gdy wynika to z przepisów.",
  ]],
  ["p", "Podmioty działające na nasze zlecenie przetwarzają dane zgodnie z umową powierzenia i naszymi poleceniami. Nie sprzedajemy danych osobowych."],
  ["h2", "5. Przekazywanie danych poza Europejski Obszar Gospodarczy"],
  ["p", "Niektórzy dostawcy narzędzi analitycznych i reklamowych (Google, Meta, Microsoft) mogą przetwarzać dane także poza EOG, w szczególności w USA. Odbywa się to na podstawie decyzji Komisji Europejskiej (Ramy ochrony danych UE–USA) lub standardowych klauzul umownych."],
  ["h2", "6. Twoje prawa"],
  ["ul", [
    "dostęp do danych i otrzymanie ich kopii;",
    "sprostowanie i uzupełnienie danych;",
    "usunięcie danych („prawo do bycia zapomnianym”) lub ograniczenie przetwarzania;",
    "przenoszenie danych;",
    "sprzeciw wobec przetwarzania opartego na uzasadnionym interesie, w tym wobec wiadomości z prośbą o opinię;",
    "wycofanie zgody w dowolnym momencie – bez wpływu na zgodność z prawem wcześniejszego przetwarzania.",
  ]],
  ["p", "**Masz konto?** W zakładce Moje konto → Prywatność możesz samodzielnie pobrać kopię wszystkich swoich danych (plik JSON, a zamówienia także w CSV) oraz usunąć konto. Po usunięciu konta kasujemy konto, adresy, zapis do newslettera, powiadomienia, wiadomości i zapisane koszyki, a w zamówieniach, zwrotach i opiniach usuwamy dane osobowe (zostają tylko produkty i kwoty). Faktury przechowujemy w systemie księgowym przez okres wymagany przepisami."],
  ["p", `Z pozostałych praw skorzystasz, pisząc na ${MAIL}. Możemy poprosić o informacje potwierdzające tożsamość. Odpowiemy w ciągu miesiąca.`],
  ["h2", "7. Pliki cookies i pamięć przeglądarki"],
  ["p", "Korzystamy z plików cookies i pamięci przeglądarki (localStorage). Opcjonalne narzędzia uruchamiamy dopiero po Twojej zgodzie w banerze (Google Consent Mode v2). Zgodę możesz zmienić w każdej chwili w ustawieniach cookies w stopce sklepu."],
  ["ul", [
    "**Niezbędne** (bez zgody): zawartość koszyka, ulubione i ostatnio oglądane produkty (pamięć przeglądarki), sesja zalogowanego klienta, zapamiętanie wyboru w banerze cookies, zgoda na przypomnienie o koszyku (jeśli ją zaznaczysz), zabezpieczenia i płatności.",
    "**Analityczne** (za zgodą): pomiar ruchu i zachowania na stronie – Google Analytics, Microsoft Clarity.",
    "**Marketingowe** (za zgodą): pomiar skuteczności reklam i dopasowanie reklam – Google Ads, piksel Meta.",
  ]],
  ["p", "Możesz też usunąć lub zablokować cookies w ustawieniach przeglądarki – zablokowanie niezbędnych może jednak uniemożliwić złożenie zamówienia."],
  ["h2", "8. Skarga do organu nadzorczego"],
  ["p", "Jeżeli uważasz, że przetwarzamy Twoje dane niezgodnie z prawem, możesz złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych, ul. Stanisława Moniuszki 1A, 00-014 Warszawa (uodo.gov.pl)."],
  ["h2", "9. Dobrowolność podania danych"],
  ["p", "Podanie danych jest dobrowolne, ale bez danych potrzebnych do realizacji zamówienia, wystawienia faktury, obsługi reklamacji lub odpowiedzi na wiadomość nie możemy wykonać danej usługi."],
  ["h2", "10. Zautomatyzowane decyzje i profilowanie"],
  ["p", "Nie podejmujemy wobec Ciebie decyzji wywołujących skutki prawne wyłącznie w sposób zautomatyzowany. Za Twoją zgodą narzędzia reklamowe mogą dopasowywać wyświetlane reklamy do Twoich zainteresowań."],
  ["h2", "11. Bezpieczeństwo danych"],
  ["p", "Stosujemy szyfrowane połączenie HTTPS, szyfrowanie haseł i kluczy dostępowych, kontrolę dostępu z rolami pracowników, codzienne kopie zapasowe oraz aktualizacje oprogramowania. Dostęp do danych mają tylko osoby, które potrzebują go do pracy."],
  ["h2", "12. Zmiany polityki"],
  ["p", "Politykę aktualizujemy, gdy zmieniają się przepisy, funkcje sklepu lub nasi dostawcy. Aktualna wersja jest zawsze dostępna na tej stronie, z datą ostatniej aktualizacji."],
];

// ---------- Zamiana na format edytora (Lexical) ----------

const text = (t: string, bold = false) => ({ type: "text", text: t, version: 1, detail: 0, format: bold ? 1 : 0, mode: "normal", style: "" });
const inline = (s: string) => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((part) => (part.startsWith("**") ? text(part.slice(2, -2), true) : text(part)));
const base = { version: 1, direction: "ltr", format: "", indent: 0 };

export function toLexical(blocks: Block[]) {
  const children = blocks.map(([kind, value]) => {
    if (kind === "ul") {
      return { ...base, type: "list", listType: "bullet", tag: "ul", start: 1,
        children: (value as string[]).map((item, i) => ({ ...base, type: "listitem", value: i + 1, children: inline(item) })) };
    }
    if (kind === "p") return { ...base, type: "paragraph", textFormat: 0, textStyle: "", children: inline(value as string) };
    return { ...base, type: "heading", tag: kind, children: inline(value as string) };
  });
  return { root: { ...base, type: "root", children } };
}

export const LEGAL_PAGES = [
  { slug: "regulamin", blocks: REGULAMIN, intro: "Zasady zakupów w sklepie sonax.sklep.pl – zamówienia, płatności, dostawa, zwroty, reklamacje, konto i opinie." },
  { slug: "polityka-prywatnosci", blocks: POLITYKA, intro: "Jakie dane przetwarzamy w sklepie sonax.sklep.pl, dlaczego to robimy i jakie prawa Ci przysługują." },
];
