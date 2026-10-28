// Treść instrukcji panelu (ekran /admin/pomoc). Proste zdania, bez żargonu.
// Linki w nawiasach [tekst](/admin/...) zamieniają się w przyciski. Aktualizować razem z nowymi funkcjami.

export type HelpSection = { id: string; title: string; intro?: string; steps: string[]; tips?: string[] };

export const HELP: HelpSection[] = [
  {
    id: "start",
    title: "Pierwsze kroki",
    intro: "Panel jest pod adresem sklepu + /admin. Menu po lewej jest podzielone na działy: Sprzedaż, Katalog, Marketing, Treści i wygląd, Integracje, Ustawienia.",
    steps: [
      "Ctrl+K (lub pole „Szukaj” u góry) – szybkie wyszukiwanie zamówień, produktów i klientów z każdego miejsca panelu.",
      "Przycisk „+ Dodaj” u góry – nowe zamówienie, produkt, kod rabatowy, strona.",
      "Ikona słońca/księżyca – jasny lub ciemny motyw panelu. „Sklep” – otwiera sklep w nowej karcie.",
      "Liczby przy pozycjach menu (czerwone/żółte) to rzeczy czekające na Ciebie: nowe zamówienia, wiadomości, zwroty, opinie.",
      "Pulpit pokazuje sprzedaż dnia, ostatnie zamówienia i to, co wymaga uwagi.",
    ],
  },
  {
    id: "zamowienia",
    title: "Zamówienia",
    intro: "Każde zamówienie ze sklepu trafia tu od razu i (jeśli BaseLinker jest włączony) do BaseLinkera. Numery: SX00001, SX00002…",
    steps: [
      "[Zamówienia](/admin/collections/orders) – zakładki nad listą filtrują po statusie (Nowe, Czeka na płatność, Opłacone, Wysłane…). „Wszystkie” pokazuje całą listę; na dole wybierzesz, ile pozycji na stronę (do 200).",
      "Kliknij zamówienie – zobaczysz podgląd jak w BaseLinkerze: produkty, klient, dostawa, płatność, przesyłki, historia. „Edytuj” przy karcie otwiera edycję tej części.",
      "Prawy panel – szybkie akcje: Oznacz jako opłacone / wysłane, Anuluj (stany wracają, klient dostaje maila), Wyślij ponownie potwierdzenie, Drukuj, Inne zamówienia klienta.",
      "Karta „Historia zamówienia” zapisuje każdą zmianę statusu i płatności (kto i kiedy), wysłane maile i przekazania do BaseLinkera.",
      "Eksport do Excela – odnośnik nad listą (ostatnie 30 dni lub wszystko).",
    ],
    tips: [
      "Zmiana statusu na Opłacone / Wysłane / Anulowane wysyła klientowi maila automatycznie.",
      "Stany produktów zmniejszają się przy złożeniu zamówienia, a wracają po anulowaniu.",
    ],
  },
  {
    id: "platnosci",
    title: "Płatności",
    steps: [
      "BLIK – klient wpisuje kod na stronie zamówienia, bez przekierowania. Płatność potwierdza się sama.",
      "Przelewy24 (szybki przelew, karta) – klient wraca ze strony P24, status zmienia się automatycznie na Opłacone.",
      "Przelew tradycyjny – po zaksięgowaniu wpłaty kliknij w zamówieniu „Oznacz jako opłacone”. Numer konta w mailu ustawisz w Integracje → Poczta → „Dane do przelewu”.",
      "Pobranie – zamówienie ma status płatności „przy odbiorze”, nic nie trzeba oznaczać.",
      "Nazwy i kolejność metod płatności: [Ustawienia sklepu → Płatności](/admin/globals/store-settings).",
    ],
  },
  {
    id: "wysylka",
    title: "Wysyłka, kurierzy i BaseLinker",
    steps: [
      "Etykiety kurierskie (InPost, ORLEN Paczka, GLS) robisz w BaseLinkerze – tak jak dotąd.",
      "Gdy w BaseLinkerze zamówienie dostanie status „wysłane” i numer paczki, sklep sam zmieni status na Wysłane i wyśle klientowi maila z linkiem do śledzenia.",
      "Integracja „Inny sklep”: BaseLinker sam pobiera zamówienia ze sklepu co kilka minut (także „za pobraniem” i „odbiór osobisty”). Po pobraniu zamówienie ma w panelu status BaseLinker „Wysłane”, a w historii wpis „Pobrane przez BaseLinkera”. Kiedy ostatnio pobierał – Integracje → BaseLinker → Synchronizacja.",
      "Kwota darmowej dostawy (to, co na stronie widać jako np. 399 zł) i ceny kurierów: [Ustawienia sklepu → Dostawa](/admin/globals/store-settings). Na górze zakładki jest kwota dla całego sklepu. Przy kurierze pole „Darmowa od” — puste znaczy tę samą kwotę, wpisana liczba to własny próg (np. InPost taniej, GLS drożej). Odznacz „Może być darmowa”, żeby metoda nigdy nie była gratis (pobranie).",
      "Połączenie z BaseLinkerem, synchronizacja stanów i statusów: [Integracje → Moduły](/admin/integracje).",
    ],
    tips: ["Jeśli zamówienie nie dotarło do BaseLinkera, w zakładce „Błąd BaseLinkera” zobaczysz powód; sklep ponawia wysyłkę sam co kilkanaście minut."],
  },
  {
    id: "produkty",
    title: "Produkty i magazyn",
    steps: [
      "[Produkty](/admin/collections/products) – zakładki: Widoczne, Brak w magazynie, Niski stan, W promocji, Ukryte. Zaznacz kwadraciki, żeby naraz zmienić kategorię, widoczność, markę, etykietę albo cenę.",
      "Opis produktu: edytor wizualny (pogrubienie, nagłówki, listy, zdjęcia), zakładka HTML i Podgląd – możesz się między nimi przełączać.",
      "Promocja: w zakładce cen wpisz cenę promocyjną i daty – sklep pokaże przekreśloną cenę i najniższą cenę z 30 dni (Omnibus).",
      "Rabat za ilość: w „Ceny i magazyn” włącz promocję i dodaj próg. „Co 3 sztuki, rabat 30%” obniża tylko co trzecią sztukę (przy 12 sztukach są 4 takie sztuki). „Ostatnia sztuka gratis” przy progu 4 daje co czwartą za darmo. Ustawiasz to na produkcie, który klient kupuje.",
      "Produkt bez stanu jest w sklepie wyszarzony i nie da się go kupić; klient może zostawić maila – dostanie powiadomienie, gdy towar wróci.",
      "Prawy panel: sprzedaż z 30 dni, „Pobierz stan i cenę z BaseLinkera” (od razu, bez czekania na synchronizację).",
      "Wybrane produkty z BaseLinkera: [Katalog → Import / eksport](/admin/import). Wpisz nazwę, kod albo kilka kodów po przecinku, zaznacz pozycje i kliknij „Zaciągnij do sklepu”. Filtr „Tylko zestawy” pokazuje zestawy – zaciągną się tylko wtedy, gdy każdy składnik jest już w sklepie i ma unikalne SKU.",
      "Zestaw układasz też ręcznie: otwórz produkt, zakładka „Zestaw”, dodaj produkty po nazwie albo SKU. Na stronie produktu klient widzi rozwijaną listę składników.",
      "Kilka wersji tego samego towaru: w zakładce „Warianty” połącz produkty. „Jedna karta” – klient przełącza na tej stronie. „Osobne strony” – każdy wariant jest widoczny w sklepie i klik przenosi na jego kartę. Wygląd wyboru: pojemność, zdjęcie, długość, waga, kolor albo opakowanie.",
    ],
    tips: [
      "Jeśli zmieniasz opis w panelu, zaznacz w zakładce BaseLinker „Nie nadpisuj opisu” – inaczej nocna synchronizacja przywróci opis z BaseLinkera.",
      "Zakładka „SEO i Google”: podgląd wyniku w Google z licznikiem znaków, ocena SEO z listą rzeczy do poprawy, fraza kluczowa, dane do Zakupów Google (kategoria Google, etykiety reklam, najważniejsze cechy, wykluczenie z reklam).",
    ],
  },
  {
    id: "klienci",
    title: "Klienci i wiadomości",
    steps: [
      "[Wiadomości](/admin/collections/form-submissions) – pytania z formularza kontaktowego i „Zapytaj o produkt”. Kolumna „Produkt” pokazuje, czego dotyczy pytanie.",
      "Wiadomość otwiera się jako podgląd (bez pól do edycji) – „Edytuj dane” w rogu, gdy naprawdę trzeba coś poprawić. Tak samo opinie, zwroty i klienci.",
      "Kliknij wiadomość → wpisz odpowiedź (albo wybierz „Szybką odpowiedź”) → „Wyślij odpowiedź”. Klient dostaje maila, a jego odpowiedź wraca na skrzynkę sklepu. Wiadomość zmienia status na Załatwione.",
      "[Klienci](/admin/collections/customers) – konta ze sklepu. W prawym panelu: liczba zamówień, suma zakupów, ostatnie zamówienie.",
    ],
  },
  {
    id: "zwroty",
    title: "Zwroty i reklamacje",
    steps: [
      "Klient zgłasza zwrot formularzem na stronie „Zwroty i reklamacje” – zgłoszenie trafia do [Zwroty i reklamacje](/admin/collections/returns).",
      "Prawy panel: Zaakceptuj → Towar otrzymany → Zwrot pieniędzy wykonany (albo Odrzuć / Zamknij). Przy każdym kroku klient dostaje maila.",
      "Pieniądze za zwrot zlecasz w Przelewy24 lub w banku – panel tylko zapisuje, że zwrot wykonano.",
    ],
  },
  {
    id: "opinie",
    title: "Opinie",
    steps: [
      "Nowe opinie czekają w [Opinie](/admin/collections/reviews) w zakładce „Do moderacji” – w sklepie nie są widoczne.",
      "Otwórz opinię → prawy panel: „Opublikuj opinię” lub „Odrzuć”. Widać też, którego produktu dotyczy.",
      "Pole „Odpowiedź (publiczna)” – Twoja odpowiedź pod opinią w sklepie.",
    ],
  },
  {
    id: "tresci",
    title: "Treści i wygląd strony",
    steps: [
      "[Układ strony](/admin/uklad) – zakładki: Strona główna, Karta produktu, Widok kategorii, Menu i stopka. Przeciągnij sekcję (albo strzałki), żeby zmienić kolejność; oko – pokaż / ukryj; „Edytuj treść” – zmiana zawartości sekcji. Po prawej podgląd strony. Na koniec „Zapisz układ”.",
      "Baner główny: w Układzie strony przy „Baner główny” → Edytuj treść → Banery – kilka banerów w karuzeli, każdy z tytułem, przyciskiem i datami „pokazuj od – do”. Zdjęcie 1920 × 625 px.",
      "[Strona główna](/admin/globals/homepage): etykiety pod banerem, loga marek i siatki produktów. Pasek na samej górze: [Menu i stopka](/admin/globals/navigation). Telefon i godziny: [Ustawienia sklepu](/admin/globals/store-settings).",
      "[Strona główna](/admin/globals/homepage) → „Siatki produktów”: wyszukaj produkt po nazwie albo SKU, ułóż strzałkami. Puste pole: polecane = SONAX, promocje = obniżona cena, nowości = data dodania, bestsellery = etykieta „Bestseller”.",
      "SEO produktu i podstrony: zakładka „SEO i Google” albo „Wygląd w Google”. Wpisz jedną frazę kluczową. Ocena pokazuje, co poprawić – tytuł, opis, zdjęcia, EAN – i podaje gotowe zdanie do wklejenia.",
      "[Podstrony](/admin/collections/pages) – nad listą „Nowa podstrona z gotowego schematu” (promocja, informacyjna, marka, poradnik) → podmień teksty i zdjęcia → „Opublikuj”.",
      "[Blog](/admin/collections/posts) – wpisy i poradniki. [Media](/admin/collections/media) – wszystkie zdjęcia i pliki sklepu (banery, zdjęcia produktów, PDF).",
    ],
    tips: ["Po kliknięciu „Opublikuj” zmiana jest w sklepie od razu. „Zapisz szkic” – zapisuje bez pokazywania klientom."],
  },
  {
    id: "marketing",
    title: "Marketing: rabaty, Google, Facebook",
    steps: [
      "[Kody rabatowe](/admin/collections/coupons) – procent, kwota albo darmowa dostawa, z datami i limitem użyć.",
      "Google i Facebook: [Integracje → Google i marketing](/admin/integracje/google). Najprościej wpisać tylko Google Tag Manager (GTM-…) i resztę ustawić w GTM.",
      "Sklep sam wysyła zdarzenia sprzedaży: obejrzenie produktu, dodanie do koszyka, zamówienie, zakup z wartością – Google Analytics i Google Ads widzą przychody.",
      "Zakupy Google: w Merchant Center dodaj „Plik zaplanowany” z adresem sklepu + /feed/google.xml.",
      "Search Console: wybierz weryfikację „Tag HTML”, wklej kod w module Google i marketing, potem zgłoś mapę strony: /sitemap.xml.",
    ],
    tips: ["Cookies: nic z Google/Facebooka nie startuje, dopóki klient nie zgodzi się w banerze (wymóg RODO i Google Consent Mode v2)."],
  },
  {
    id: "raporty",
    title: "Raporty sprzedaży",
    steps: [
      "[Raporty](/admin/raporty) – wybierz okres (dziś, 7/30/90 dni, miesiąc, rok albo własne daty).",
      "Każda liczba ma porównanie z poprzednim okresem (strzałka w górę/dół). Wykres – najedź na słupek po szczegóły.",
      "Niżej: najlepsze produkty (z aktualnym stanem), najlepsi klienci, kategorie, dostawy, płatności, dni tygodnia, godziny i miasta.",
    ],
  },
  {
    id: "ustawienia",
    title: "Ustawienia i technika",
    steps: [
      "[Ustawienia sklepu](/admin/ustawienia) – dane sklepu, dostawa, płatności, teksty prawne, widoczność w Google, przerwa techniczna.",
      "Regulamin i polityka prywatności: w Ustawieniach przycisk „Zapisz jako szkice do przeczytania” wgrywa nowe wersje jako szkic. Otwórz stronę, przeczytaj (możesz poprawić tekst) i kliknij „Opublikuj zmiany”.",
      "Widoczność w Google: „Automatycznie” (zalecane) – serwer testowy jest ukryty, domena docelowa widoczna.",
      "Asystenci AI: pozwól lub zablokuj ChatGPT/Claude/Perplexity; pliki llms.txt opisują sklep dla AI.",
      "Przerwa techniczna: wyłącza sklep dla klientów z komunikatem – Ty (zalogowany) nadal widzisz sklep.",
      "„Odśwież sklep teraz” – gdy zmiana z panelu nie jest jeszcze widoczna w sklepie.",
      "Pracownicy: [Pracownicy](/admin/collections/users). Role: Administrator (wszystko), Redaktor (produkty i strony), Obsługa zamówień, Marketing (kody, opinie, newsletter), Magazyn (produkty i stany). Kolor panelu każdy ustawia u siebie.",
    ],
  },
  {
    id: "maile",
    title: "Maile do klientów – kiedy wychodzą",
    steps: [
      "Złożenie zamówienia → „Dziękujemy za zamówienie” (z miniaturami produktów; przy przelewie – dane do wpłaty). Do sklepu – powiadomienie o nowym zamówieniu.",
      "Opłacone → „Płatność przyjęta”. Wysłane → numer paczki i link do śledzenia. Anulowane → informacja o anulowaniu.",
      "Zwroty – mail przy każdej zmianie statusu. Wiadomości – Twoja odpowiedź z panelu.",
      "Konto klienta: powitanie, reset hasła. Produkt wrócił na stan → mail do osób, które zostawiły adres.",
      "Każdy wysłany mail jest zapisany w [Dziennik integracji](/admin/collections/integration-logs) (typ: E-mail).",
      "Zmiana treści i wyglądu: [Maile do klientów](/admin/maile). Po lewej lista maili (zielona kropka = wysyłany). „Treść” – temat, nagłówek, wstęp i napis na przycisku; „Kod HTML” – pełny kod treści. „Wygląd wszystkich maili” – kolory, logo, stopka i kod ramki.",
      "Podgląd po prawej zmienia się od razu, na prawdziwym zamówieniu (wybór zamówienia nad podglądem). Ikony: komputer / telefon / wersja tekstowa. „Wyślij test” – mail na podany adres z dopiskiem [TEST].",
      "Zmienne w nawiasach, np. {{numer}}, sklep wypełni sam – kliknij zmienną pod polem, żeby ją wstawić. Puste pole = tekst domyślny. „Przywróć domyślną treść” cofa zmiany jednego maila.",
      "Prośba o opinię: w Maile do klientów → „Prośba o opinię” włącz i ustaw, po ilu dniach od wysyłki. Klient dostaje produkty z przyciskiem „Oceń” (raz na zamówienie).",
      "Porzucony koszyk: włącz „Porzucony koszyk” i ustaw liczbę godzin. Przy zamówieniu klient może zaznaczyć zgodę na przypomnienie – tylko wtedy koszyk trafia do [Porzucone koszyki](/admin/collections/carts). Mail ma przycisk „Wróć do koszyka” i link do rezygnacji.",
    ],
    tips: ["Automaty (opinia, koszyk) sprawdzają co 15 minut. Wyłączony mail się nie wysyła – zostaje tylko w podglądzie."],
  },
  {
    id: "rodo",
    title: "RODO – dane klientów",
    steps: [
      "Klient sam pobiera swoje dane w koncie: Moje konto → Prywatność → „Wszystkie dane (JSON)” albo „Zamówienia (CSV)”.",
      "Tam też „Usuń konto” (po wpisaniu hasła). Konto, adresy, newsletter, powiadomienia, wiadomości i zapisane koszyki znikają; w zamówieniach i zwrotach zostają produkty i kwoty, bez imienia, adresu, e-maila, telefonu i NIP. Klient dostaje mail z potwierdzeniem.",
      "Prośba o usunięcie danych mailem od klienta bez konta: usuń wpisy ręcznie (Newsletter, Wiadomości, Powiadomienia o dostępności, Porzucone koszyki).",
    ],
    tips: ["Faktury są w WAPRO, a kopie zamówień w BaseLinkerze – tam dane zostają tak długo, jak wymagają przepisy podatkowe."],
  },
  {
    id: "bezpieczenstwo",
    title: "Kopie zapasowe i bezpieczeństwo",
    steps: [
      "Baza sklepu kopiuje się codziennie o 3:30 na serwerze, a komputer w biurze pobiera kopie (zadanie „Sonax – kopia zapasowa sklepu” w Harmonogramie zadań Windows, folder Dokumenty\\Sonax-kopie).",
      "Stan sklepu sprawdza adres /api/zdrowie – podepnij go w UptimeRobot, żeby dostać SMS/mail, gdy sklep przestanie działać.",
      "Każdy pracownik ma własne konto – nie udostępniaj hasła. Usunięcie konta pracownika odcina mu dostęp od razu.",
    ],
  },
  {
    id: "problemy",
    title: "Co zrobić, gdy…",
    steps: [
      "…zmiana z panelu nie widać w sklepie → Ustawienia → „Odśwież sklep teraz” (albo odczekaj minutę).",
      "…zamówienie nie poszło do BaseLinkera → zakładka „Błąd BaseLinkera” pokazuje powód; po poprawce sklep ponowi wysyłkę sam.",
      "…mail nie doszedł do klienta → Dziennik integracji, typ E-mail – zobaczysz, czy wyszedł i ewentualny błąd. Integracje → Poczta → „Sprawdź połączenie”.",
      "…klient nie może zapłacić → Integracje → Przelewy24 → „Zapisz i sprawdź”. Klient może też wybrać przelew tradycyjny.",
      "…coś nie działa w całym sklepie → Integracje → „Sprawdź wszystkie połączenia”, potem /api/zdrowie. W razie potrzeby włącz przerwę techniczną.",
    ],
  },
];
