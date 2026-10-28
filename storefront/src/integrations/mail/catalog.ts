// Konfigurator maili (panel: Marketing → Maile do klientów): lista wszystkich maili sklepu z domyślną treścią.
// Bez importów serwerowych – z tego pliku korzysta też edytor w przeglądarce.
//
// Składnia w treściach i kodzie:
//   {{numer}}                – zmienna (tekst albo gotowy blok HTML, np. {{produkty}})
//   {{#oplacone}}…{{/oplacone}} – fragment pokazany, gdy zmienna jest ustawiona
//   {{^oplacone}}…{{/oplacone}} – fragment pokazany, gdy jej nie ma
// Panel nadpisuje temat, nagłówek, wstęp, przycisk i kod treści; puste pole = wartość domyślna z tego pliku.

export type MailId =
  | "order-placed" | "order-paid" | "order-shipped" | "order-cancelled" | "order-message" | "review-request" | "cart-reminder"
  | "welcome" | "password-reset" | "claim-orders" | "account-deleted"
  | "message-reply" | "form-receipt" | "return-update" | "back-in-stock" | "b2b-decision"
  | "shop-new-order" | "shop-form-notice";

export type MailGroup = "Zamówienia" | "Przypomnienia" | "Konto klienta" | "Obsługa klienta" | "Do sklepu";

export type MailDef = {
  id: MailId;
  group: MailGroup;
  label: string;
  when: string; // kiedy sklep wysyła ten mail
  subject: string;
  title: string;
  lead: string;
  button?: string; // napis na głównym przycisku
  body: string; // kod HTML treści (wewnątrz ramki)
  vars: [string, string][]; // zmienne do podpowiedzi w edytorze
  locked?: boolean; // nie da się wyłączyć (np. reset hasła)
  off?: boolean; // domyślnie wyłączony (nowe automaty)
  hidden?: boolean; // nie pokazywany w konfiguratorze
};

const P = (s: string) => `<p style="margin:0">${s}</p>`;
const NOTE = (s: string) => `<p style="margin:12px 0 0;color:#66727c;font-size:13px">${s}</p>`;

const ORDER_VARS: [string, string][] = [
  ["numer", "numer zamówienia, np. SX00012"], ["imie", "imię klienta"], ["kwota", "kwota zamówienia"], ["data", "data złożenia"],
  ["metoda_dostawy", "nazwa dostawy"], ["metoda_platnosci", "nazwa płatności"], ["sklep", "nazwa sklepu"], ["telefon", "telefon sklepu"],
  ["naglowek_zamowienia", "blok: numer i data nad tytułem"], ["produkty", "blok: tabela produktów z miniaturami i sumą"],
  ["dostawa_i_platnosc", "blok: adres dostawy i płatność"], ["przycisk", "blok: główny przycisk"], ["wstep", "blok: tekst wstępu"],
];
const SHOP_VARS: [string, string][] = [["sklep", "nazwa sklepu"], ["telefon", "telefon sklepu"], ["email_sklepu", "e-mail sklepu"], ["link_sklepu", "adres sklepu"], ["wstep", "blok: tekst wstępu"]];

export const MAILS: MailDef[] = [
  // ---------- Zamówienia ----------
  {
    id: "order-placed", group: "Zamówienia", label: "Zamówienie przyjęte", when: "Zaraz po złożeniu zamówienia (także ponowne wysłanie z panelu).",
    subject: "Zamówienie {{numer}} przyjęte",
    title: "Dziękujemy za zamówienie!",
    lead: "Dziękujemy za zakupy! {{#oplacone}}Zamówienie jest opłacone – przygotowujemy je do wysyłki.{{/oplacone}}{{#pobranie}}Zapłacisz przy odbiorze. Przygotowujemy zamówienie do wysyłki.{{/pobranie}}{{#przelew}}Wyślemy zamówienie, gdy wpłata pojawi się na naszym koncie.{{/przelew}}{{#czeka}}Gdy tylko potwierdzimy płatność, przygotujemy zamówienie do wysyłki.{{/czeka}}",
    button: "{{#konto}}Zobacz zamówienie w koncie{{/konto}}{{^konto}}Wróć do sklepu{{/konto}}",
    body: `{{naglowek_zamowienia}}
${P("{{wstep}}")}
{{dane_do_przelewu}}
{{produkty}}
{{dostawa_i_platnosc}}
{{przycisk}}
<p style="margin:4px 0 0;color:#66727c;font-size:13px">Masz pytanie? Odpowiedz na tego maila albo zadzwoń{{#telefon}}: {{telefon}}{{/telefon}}.</p>`,
    vars: [...ORDER_VARS, ["dane_do_przelewu", "blok: numer konta (tylko przelew tradycyjny)"], ["oplacone", "warunek: opłacone"], ["pobranie", "warunek: płatność przy odbiorze"], ["przelew", "warunek: przelew tradycyjny"], ["czeka", "warunek: czeka na płatność online"], ["konto", "warunek: klient ma konto"]],
  },
  {
    id: "order-paid", group: "Zamówienia", label: "Płatność przyjęta", when: "Gdy zamówienie zmieni status na „Opłacone”.",
    subject: "Płatność za zamówienie {{numer}} przyjęta",
    title: "Płatność przyjęta – dziękujemy!",
    lead: "Otrzymaliśmy płatność {{kwota}} za zamówienie {{numer}}. Przygotowujemy paczkę do wysyłki – numer przesyłki wyślemy w osobnym mailu.",
    body: `{{naglowek_zamowienia}}
${P("{{wstep}}")}
{{produkty}}`,
    vars: ORDER_VARS.filter(([k]) => k !== "przycisk"),
  },
  {
    id: "order-shipped", group: "Zamówienia", label: "Zamówienie wysłane", when: "Gdy zamówienie zmieni status na „Wysłane” (numer przesyłki z BaseLinkera).",
    subject: "{{#odbior_osobisty}}Zamówienie {{numer}} gotowe do odbioru{{/odbior_osobisty}}{{^odbior_osobisty}}Zamówienie {{numer}} wysłane{{/odbior_osobisty}}",
    title: "{{#odbior_osobisty}}Gotowe do odbioru{{/odbior_osobisty}}{{^odbior_osobisty}}Twoja paczka jest w drodze{{/odbior_osobisty}}",
    lead: "{{#odbior_osobisty}}Zamówienie {{numer}} czeka na odbiór w naszym sklepie.{{/odbior_osobisty}}{{^odbior_osobisty}}Zamówienie {{numer}} jest już w drodze!{{/odbior_osobisty}}",
    button: "Śledź przesyłkę",
    body: `{{naglowek_zamowienia}}
${P("{{wstep}}")}
{{paczki}}
{{#punkt}}<p style="margin:12px 0 0">Paczka trafi do punktu <b>{{punkt}}</b>{{#adres_punktu}} – {{adres_punktu}}{{/adres_punktu}}. Kod odbioru przyjdzie SMS-em od przewoźnika.</p>{{/punkt}}
{{produkty}}`,
    vars: [...ORDER_VARS.filter(([k]) => k !== "przycisk"), ["paczki", "blok: numery przesyłek z przyciskiem śledzenia"], ["punkt", "kod punktu odbioru"], ["adres_punktu", "adres punktu"], ["odbior_osobisty", "warunek: odbiór w sklepie"]],
  },
  {
    id: "order-cancelled", group: "Zamówienia", label: "Zamówienie anulowane", when: "Gdy zamówienie zmieni status na „Anulowane”.",
    subject: "Zamówienie {{numer}} anulowane",
    title: "Zamówienie anulowane",
    lead: "Zamówienie {{numer}} zostało anulowane.{{#oplacone}} Wpłacone pieniądze zwrócimy tą samą metodą płatności – zwykle w ciągu kilku dni roboczych.{{/oplacone}}",
    body: `{{naglowek_zamowienia}}
${P("{{wstep}}")}
{{produkty}}
${NOTE("Jeśli to pomyłka albo masz pytania – odpowiedz na tego maila{{#telefon}} lub zadzwoń: {{telefon}}{{/telefon}}.")}`,
    vars: [...ORDER_VARS.filter(([k]) => k !== "przycisk"), ["oplacone", "warunek: zamówienie było opłacone"]],
  },
  {
    id: "order-message", group: "Zamówienia", label: "Wiadomość do klienta (z zamówienia)", when: "Gdy wyślesz klientowi wiadomość z listy zamówień (zaznacz zamówienia → Wyślij mail → Własna wiadomość).",
    subject: "{{temat}} – zamówienie {{numer}}",
    title: "Dzień dobry{{#imie}}, {{imie}}{{/imie}}!",
    lead: "",
    body: `{{naglowek_zamowienia}}
{{#wstep}}<p style="margin:0 0 12px">{{wstep}}</p>{{/wstep}}
{{tresc_wiadomosci}}
${NOTE("Masz pytanie? Po prostu odpowiedz na tego maila.")}`,
    vars: [...ORDER_VARS.filter(([k]) => k !== "przycisk"), ["temat", "temat wpisany przy wysyłce"], ["tresc_wiadomosci", "blok: treść wpisana przy wysyłce"]],
    locked: true,
  },
  // ---------- Przypomnienia (automaty) ----------
  {
    id: "review-request", group: "Przypomnienia", label: "Prośba o opinię", when: "Kilka dni po wysłaniu zamówienia (liczbę dni ustawisz niżej). Raz na zamówienie.",
    subject: "Jak sprawdzają się produkty z zamówienia {{numer}}?",
    title: "{{#imie}}{{imie}}, jak{{/imie}}{{^imie}}Jak{{/imie}} się sprawdzają?",
    lead: "Mamy nadzieję, że zamówienie {{numer}} dotarło bez problemów. Twoja opinia pomoże innym kierowcom wybrać dobre produkty – wystarczy minuta i kilka gwiazdek.",
    button: "Oceń produkty",
    body: `${P("{{wstep}}")}
{{produkty_do_oceny}}
${NOTE("Coś jest nie tak z zamówieniem? Odpowiedz na tego maila – pomożemy.")}`,
    vars: [["numer", "numer zamówienia"], ["imie", "imię klienta"], ["sklep", "nazwa sklepu"], ["produkty_do_oceny", "blok: produkty z przyciskiem „Oceń”"], ["wstep", "blok: tekst wstępu"]],
    off: true,
  },
  {
    id: "cart-reminder", group: "Przypomnienia", label: "Porzucony koszyk", when: "Gdy klient zostawi koszyk i nie złoży zamówienia (po ilu godzinach – niżej). Tylko za zgodą klienta, jeden raz.",
    subject: "Twój koszyk czeka – {{liczba}} {{produktow}}",
    title: "{{#imie}}{{imie}}, Twój{{/imie}}{{^imie}}Twój{{/imie}} koszyk czeka",
    lead: "Zapisaliśmy Twój koszyk – wystarczy jedno kliknięcie, aby dokończyć zamówienie. Ceny i dostępność sprawdzimy jeszcze raz przy zamówieniu.",
    button: "Wróć do koszyka",
    body: `${P("{{wstep}}")}
{{koszyk}}
{{przycisk}}
<p style="margin:8px 0 0;color:#9aa3ab;font-size:12px">Wysłaliśmy to przypomnienie, bo zaznaczyłeś(-aś) zgodę przy zamówieniu. <a href="{{link_rezygnacji}}" style="color:#9aa3ab">Nie przypominaj mi więcej</a>.</p>`,
    vars: [["imie", "imię (gdy znane)"], ["liczba", "liczba produktów"], ["produktow", "„produkt/produkty/produktów”"], ["kwota", "wartość koszyka"], ["koszyk", "blok: produkty z koszyka"], ["przycisk", "blok: przycisk do koszyka"], ["link_koszyka", "adres przywracający koszyk"], ["link_rezygnacji", "adres rezygnacji z przypomnień"], ["wstep", "blok: tekst wstępu"]],
    off: true,
  },
  // ---------- Konto klienta ----------
  {
    id: "welcome", group: "Konto klienta", label: "Konto założone", when: "Po rejestracji konta w sklepie.",
    subject: "Konto w sklepie SONAX założone",
    title: "Konto założone",
    lead: "{{#imie}}{{imie}}, w{{/imie}}{{^imie}}W{{/imie}}itamy w sklepie SONAX! Twoje konto jest gotowe – zobaczysz w nim historię zamówień i status przesyłek, a przy kolejnych zakupach dane wypełnią się same.",
    button: "Przejdź do konta",
    body: `${P("{{wstep}}")}
{{przycisk}}`,
    vars: [["imie", "imię klienta"], ...SHOP_VARS, ["przycisk", "blok: przycisk do konta"]],
  },
  {
    id: "password-reset", group: "Konto klienta", label: "Nowe hasło", when: "Gdy klient kliknie „Nie pamiętam hasła”. Zawsze wysyłany.",
    subject: "Ustaw nowe hasło do konta",
    title: "Ustaw nowe hasło",
    lead: "{{#imie}}{{imie}}, o{{/imie}}{{^imie}}O{{/imie}}trzymaliśmy prośbę o ustawienie nowego hasła do konta w naszym sklepie. Link jest ważny przez godzinę.",
    button: "Ustaw nowe hasło",
    body: `${P("{{wstep}}")}
{{przycisk}}
<p style="margin:8px 0 0;color:#66727c;font-size:12px">Jeśli to nie Ty – zignoruj tę wiadomość, hasło się nie zmieni.</p>`,
    vars: [["imie", "imię klienta"], ["link", "adres ustawienia hasła"], ...SHOP_VARS, ["przycisk", "blok: przycisk"]],
    locked: true,
  },
  {
    id: "claim-orders", group: "Konto klienta", label: "Dołączenie wcześniejszych zamówień", when: "Gdy klient w koncie poprosi o dodanie zamówień złożonych bez logowania.",
    subject: "Dodaj wcześniejsze zamówienia do konta",
    title: "Wcześniejsze zamówienia",
    lead: "Znaleźliśmy {{liczba}} {{zamowien}} na ten adres e-mail przed założeniem konta. Kliknij, aby dodać je do historii w koncie.",
    button: "Dodaj do konta",
    body: `${P("{{wstep}}")}
{{przycisk}}
<p style="margin:8px 0 0;color:#66727c;font-size:12px">Link jest ważny 24 godziny.</p>`,
    vars: [["liczba", "liczba zamówień"], ["zamowien", "„zamówienie złożone / zamówienia złożone”"], ["link", "adres potwierdzenia"], ...SHOP_VARS, ["przycisk", "blok: przycisk"]],
    locked: true,
  },
  {
    id: "account-deleted", group: "Konto klienta", label: "Konto usunięte (RODO)", when: "Gdy klient sam usunie konto w sklepie.",
    subject: "Twoje konto zostało usunięte",
    title: "Konto usunięte",
    lead: "{{#imie}}{{imie}}, z{{/imie}}{{^imie}}Z{{/imie}}godnie z Twoją prośbą usunęliśmy Twoje konto w naszym sklepie. Dane osobowe w zamówieniach zostały zanonimizowane, a adres e-mail wypisany z newslettera i powiadomień.",
    body: `${P("{{wstep}}")}
${NOTE("Faktury wystawione wcześniej przechowujemy w systemie księgowym przez okres wymagany przepisami podatkowymi. Jeśli to nie Ty usunąłeś konto – odpowiedz na tego maila.")}`,
    vars: [["imie", "imię klienta"], ...SHOP_VARS],
    locked: true,
  },
  // ---------- Obsługa klienta ----------
  {
    id: "message-reply", group: "Obsługa klienta", label: "Odpowiedź na wiadomość", when: "Gdy odpowiesz klientowi w panelu: Wiadomości → Odpowiedz.",
    subject: "Re: {{temat}}{{#produkt}} – {{produkt}}{{/produkt}}",
    title: "Dzień dobry{{#imie}}, {{imie}}{{/imie}}!",
    lead: "",
    body: `{{#wstep}}<p style="margin:0 0 12px">{{wstep}}</p>{{/wstep}}
{{odpowiedz}}
{{#produkt}}<p style="margin:16px 0 0;font-size:14px">Produkt: <a href="{{link_produktu}}" style="color:{{kolor}};font-weight:700">{{produkt}}</a></p>{{/produkt}}
{{cytat}}
${NOTE("Masz kolejne pytanie? Po prostu odpowiedz na tego maila.")}`,
    vars: [["imie", "imię klienta"], ["temat", "temat wiadomości klienta"], ["produkt", "nazwa produktu (z „Zapytaj o produkt”)"], ["link_produktu", "adres produktu"], ["odpowiedz", "blok: Twoja odpowiedź"], ["cytat", "blok: cytat wiadomości klienta"], ...SHOP_VARS],
    locked: true,
  },
  {
    id: "form-receipt", group: "Obsługa klienta", label: "Potwierdzenie zgłoszenia", when: "Po wysłaniu formularza na stronie (kontakt, zwrot, opinia). Także mail testowy poczty.",
    subject: "{{tytul_formularza}}",
    title: "{{tytul_formularza}}",
    lead: "{{tekst}}",
    body: P("{{wstep}}"),
    vars: [["tytul_formularza", "tytuł potwierdzenia"], ["tekst", "tekst potwierdzenia (zależny od formularza)"], ...SHOP_VARS],
  },
  {
    id: "return-update", group: "Obsługa klienta", label: "Zwrot / reklamacja – zmiana statusu", when: "Gdy zmienisz status zgłoszenia zwrotu lub reklamacji.",
    subject: "{{rodzaj}} {{numer}} – {{status}}",
    title: "{{rodzaj}} {{numer}} – {{status}}",
    lead: "{{#zaakceptowany}}Przyjęliśmy Twoje zgłoszenie. Odeślij produkty na adres: KENOCHEM Kuczyński Sp. J., ul. Gen. Andersa 40, 15-113 Białystok – z dopiskiem numeru zgłoszenia.{{/zaakceptowany}}{{#otrzymany}}Paczka ze zwracanymi produktami do nas dotarła. Sprawdzamy ją i wkrótce damy znać o dalszych krokach.{{/otrzymany}}{{#zwrocony}}Zwrot pieniędzy został zlecony. Środki wrócą na Twoje konto zwykle w ciągu 1–3 dni roboczych.{{/zwrocony}}{{#odrzucony}}Niestety nie możemy uwzględnić zgłoszenia. Szczegóły i uzasadnienie przekażemy w osobnej wiadomości lub telefonicznie – możesz też odpowiedzieć na tego maila.{{/odrzucony}}{{#zamkniety}}Twoje zgłoszenie zostało zamknięte. Dziękujemy za cierpliwość.{{/zamkniety}}{{#zamowienie}} (zamówienie {{zamowienie}}){{/zamowienie}}",
    body: `${P("{{wstep}}")}
${NOTE("Pytania? Odpowiedz na tego maila{{#telefon}} lub zadzwoń: {{telefon}}{{/telefon}}.")}`,
    vars: [["rodzaj", "Zwrot / Reklamacja"], ["numer", "numer zgłoszenia"], ["status", "nazwa statusu"], ["zamowienie", "numer zamówienia"], ["zaakceptowany", "warunek"], ["otrzymany", "warunek"], ["zwrocony", "warunek"], ["odrzucony", "warunek"], ["zamkniety", "warunek"], ...SHOP_VARS],
  },
  {
    id: "back-in-stock", group: "Obsługa klienta", label: "Produkt znowu dostępny", when: "Gdy produkt wróci na stan – do osób z „Powiadom o dostępności”.",
    subject: "Znowu dostępny: {{produkt}}",
    title: "Produkt znowu dostępny",
    lead: "Produkt, na który czekasz, jest znowu dostępny: {{produkt}}{{#cena}} – {{cena}}{{/cena}}.",
    button: "Zobacz produkt",
    body: `${P("{{wstep}}")}
{{przycisk}}
<p style="margin:8px 0 0;color:#66727c;font-size:12px">Ilość może być ograniczona. Wysłaliśmy to powiadomienie, bo zapisałeś(-aś) się na nie w naszym sklepie.</p>`,
    vars: [["produkt", "nazwa produktu"], ["cena", "cena"], ["link", "adres produktu"], ...SHOP_VARS, ["przycisk", "blok: przycisk"]],
  },
  {
    id: "b2b-decision", group: "Obsługa klienta", label: "Decyzja o koncie hurtowym", when: "Po zatwierdzeniu lub odrzuceniu wniosku B2B.",
    subject: "{{#zatwierdzone}}Konto hurtowe zatwierdzone{{/zatwierdzone}}{{^zatwierdzone}}Wniosek o konto hurtowe{{/zatwierdzone}}",
    title: "{{#zatwierdzone}}Konto hurtowe zatwierdzone{{/zatwierdzone}}{{^zatwierdzone}}Wniosek o konto hurtowe{{/zatwierdzone}}",
    lead: "{{#zatwierdzone}}Konto hurtowe{{#firma}} dla firmy {{firma}}{{/firma}} zostało zatwierdzone. Zaloguj się w sklepie – warunki współpracy omówimy z Tobą indywidualnie.{{/zatwierdzone}}{{^zatwierdzone}}Dziękujemy za wniosek o konto hurtowe{{#firma}} dla firmy {{firma}}{{/firma}}. Na ten moment nie możemy go zatwierdzić – skontaktuj się z nami, a wyjaśnimy szczegóły.{{/zatwierdzone}}",
    button: "Przejdź do konta",
    body: `${P("{{wstep}}")}
{{#zatwierdzone}}{{przycisk}}{{/zatwierdzone}}`,
    vars: [["firma", "nazwa firmy"], ["zatwierdzone", "warunek"], ...SHOP_VARS],
    hidden: true,
  },
  // ---------- Do sklepu ----------
  {
    id: "shop-new-order", group: "Do sklepu", label: "Nowe zamówienie (do sklepu)", when: "Do sklepu (adresy z Integracje → Poczta) po każdym zamówieniu.",
    subject: "Nowe zamówienie {{numer}} – {{kwota}}",
    title: "Nowe zamówienie {{numer}}",
    lead: "{{klient}} · {{email}}{{#telefon_klienta}} · {{telefon_klienta}}{{/telefon_klienta}}",
    button: "Otwórz w panelu",
    body: `{{naglowek_zamowienia}}
${P("{{wstep}}")}
{{produkty}}
{{dostawa_i_platnosc}}
{{#uwagi}}<p style="margin:10px 0"><b>Uwagi klienta:</b><br>{{uwagi}}</p>{{/uwagi}}
{{przycisk}}`,
    vars: [...ORDER_VARS, ["klient", "odbiorca (i firma z NIP)"], ["email", "e-mail klienta"], ["telefon_klienta", "telefon klienta"], ["uwagi", "uwagi klienta"]],
  },
  {
    id: "shop-form-notice", group: "Do sklepu", label: "Nowe zgłoszenie z formularza (do sklepu)", when: "Do sklepu po wysłaniu formularza (kontakt, zwrot, opinia).",
    subject: "{{tytul_formularza}}",
    title: "{{tytul_formularza}}",
    lead: "",
    button: "Otwórz w panelu",
    body: `{{dane}}
{{przycisk}}`,
    vars: [["tytul_formularza", "rodzaj zgłoszenia i nadawca"], ["dane", "blok: pola formularza"], ["przycisk", "blok: przycisk do panelu"], ...SHOP_VARS],
  },
];

export const mailDef = (id: string) => MAILS.find((m) => m.id === id);

// Ramka wspólna dla wszystkich maili: pasek z logo, treść, atuty sklepu, stopka z danymi firmy
export const DEFAULT_FRAME = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>{{tytul}}</title></head>
<body style="margin:0;padding:0;background:{{kolor_tla}};font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#181c21;-webkit-text-size-adjust:100%">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">{{zajawka}}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{{kolor_tla}}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px">
<tr><td style="background:{{kolor_naglowka}};border-radius:18px 18px 0 0;padding:20px 28px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><a href="{{link_sklepu}}" style="text-decoration:none"><img src="{{logo}}" alt="{{sklep}}" width="132" style="display:block;border:0;height:auto;background:#fff;border-radius:8px;padding:6px 10px"></a></td>
    <td align="right" style="font-size:12px;color:#c9ced4"><a href="{{link_sklepu}}" style="color:#fff;text-decoration:none;font-weight:700">sklep</a> &nbsp;·&nbsp; <a href="{{link_sklepu}}/konto" style="color:#fff;text-decoration:none;font-weight:700">moje konto</a></td>
  </tr></table>
</td></tr>
<tr><td style="height:4px;background:{{kolor}};line-height:4px;font-size:0">&nbsp;</td></tr>
<tr><td style="background:#fff;padding:30px 28px 10px;font-size:15px;line-height:1.6">
{{postep}}<h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#181c21;font-weight:800">{{tytul}}</h1>
{{tresc}}
</td></tr>
{{#atuty}}<tr><td style="background:#fff;padding:8px 20px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f7;border-radius:12px"><tr>
<td align="center" style="padding:14px 6px;font-size:12px;line-height:1.4;color:#181c21;width:33%"><div style="font-size:18px;line-height:1;margin-bottom:4px">&#128666;</div>Wysyłka<br><b>w 24 h</b></td>
<td align="center" style="padding:14px 6px;font-size:12px;line-height:1.4;color:#181c21;width:33%"><div style="font-size:18px;line-height:1;margin-bottom:4px">&#8617;&#65039;</div><b>14 dni</b><br>na zwrot</td>
<td align="center" style="padding:14px 6px;font-size:12px;line-height:1.4;color:#181c21;width:33%"><div style="font-size:18px;line-height:1;margin-bottom:4px">&#9989;</div>Oryginalne<br><b>produkty SONAX</b></td>
</tr></table></td></tr>{{/atuty}}
<tr><td style="background:#fff;border-radius:0 0 18px 18px;padding:18px 28px 26px;font-size:12px;line-height:1.7;color:#66727c">
<b style="color:#181c21">{{sklep}}</b> – KENOCHEM Kuczyński Sp. J.<br>{{adres}}<br>{{kontakt}}{{#stopka}}<br>{{stopka}}{{/stopka}}
</td></tr>
<tr><td align="center" style="padding:16px 10px;font-size:11px;color:#9aa3ab">Ta wiadomość dotyczy Twoich zakupów w {{sklep}}. <a href="{{link_sklepu}}/regulamin" style="color:#9aa3ab">Regulamin</a> · <a href="{{link_sklepu}}/polityka-prywatnosci" style="color:#9aa3ab">Prywatność</a></td></tr>
</table></td></tr></table></body></html>`;

export const FRAME_VARS: [string, string][] = [
  ["tytul", "nagłówek maila"], ["zajawka", "tekst podglądu w skrzynce"], ["tresc", "blok: treść maila"], ["postep", "blok: pasek postępu zamówienia"],
  ["kolor", "kolor główny"], ["kolor_naglowka", "kolor paska z logo"], ["kolor_tla", "kolor tła"], ["logo", "adres logo"],
  ["sklep", "nazwa sklepu"], ["adres", "adres sklepu"], ["kontakt", "blok: telefon, e-mail, godziny"], ["stopka", "dodatkowy tekst stopki"],
  ["link_sklepu", "adres sklepu"], ["atuty", "warunek: pasek atutów włączony"],
];

// ---------- Ustawienia (zapis w schowku integrations.json, sekcja „mail”) ----------

export type MailOverride = { enabled?: boolean; subject?: string; title?: string; lead?: string; button?: string; body?: string };
export type MailBrand = { accent: string; header: string; background: string; logo: string; footer: string; perks: boolean; frame: string };
export type MailSettings = {
  brand: MailBrand;
  templates: Partial<Record<MailId, MailOverride>>;
  review: { days: number };
  cart: { hours: number };
};

export const defaultMailSettings = (): MailSettings => ({
  brand: { accent: "#d32e2e", header: "#15191e", background: "#eef0f2", logo: "", footer: "", perks: true, frame: "" },
  templates: {},
  review: { days: 7 },
  cart: { hours: 3 },
});

const color = (v: unknown, def: string) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v.trim()) ? v.trim().toLowerCase() : def);
const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);
const num = (v: unknown, min: number, max: number, def: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};

// Tylko znane pola i rozsądne długości; pusty tekst = domyślny (nie zapisujemy)
export function cleanMailSettings(raw: unknown): MailSettings {
  const d = defaultMailSettings();
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<keyof MailSettings, Record<string, unknown>>>;
  const b = r.brand ?? {};
  const out: MailSettings = {
    brand: {
      accent: color(b.accent, d.brand.accent), header: color(b.header, d.brand.header), background: color(b.background, d.brand.background),
      logo: (text(b.logo, 500) ?? "").trim(), footer: (text(b.footer, 500) ?? "").trim(), perks: typeof b.perks === "boolean" ? b.perks : true,
      frame: (text(b.frame, 60_000) ?? "").trim(),
    },
    templates: {},
    review: { days: num(r.review?.days, 1, 60, d.review.days) },
    cart: { hours: num(r.cart?.hours, 1, 72, d.cart.hours) },
  };
  for (const def of MAILS) {
    const t = (r.templates as Record<string, Record<string, unknown>> | undefined)?.[def.id];
    if (!t) continue;
    const o: MailOverride = {};
    if (typeof t.enabled === "boolean" && !def.locked && t.enabled !== !def.off) o.enabled = t.enabled;
    for (const k of ["subject", "title", "lead", "button"] as const) {
      const v = text(t[k], 2000)?.trim();
      if (v && v !== def[k]) o[k] = v;
    }
    const body = text(t.body, 60_000)?.trim();
    if (body && body !== def.body.trim()) o.body = body;
    if (Object.keys(o).length) out.templates[def.id] = o;
  }
  return out;
}

export const mailEnabled = (s: MailSettings, id: MailId) => {
  const def = mailDef(id);
  if (!def || def.locked) return true;
  return s.templates[id]?.enabled ?? !def.off;
};

// ---------- Silnik podstawiania ----------

export type Vars = Record<string, string | number | boolean | null | undefined>;
const escHtml = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const SECTION = /\{\{([#^])\s*([\w.]+)\s*\}\}([\s\S]*?)\{\{\/\s*\2\s*\}\}/g;

// text – zwykłe wartości (w HTML zamieniane na bezpieczny tekst), html – gotowe bloki HTML
export function fill(tpl: string, text: Vars, html: Record<string, string> = {}, asHtml = true): string {
  const has = (k: string) => (k in html ? Boolean(html[k]) : Boolean(text[k]) && text[k] !== "0");
  let out = tpl;
  for (let i = 0, prev = ""; i < 10 && prev !== out; i++) {
    prev = out;
    out = out.replace(SECTION, (_, kind: string, name: string, inner: string) => (has(name) === (kind === "#") ? inner : ""));
  }
  return out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k: string) => {
    if (k in html) return asHtml ? html[k] : html[k].replace(/<[^>]+>/g, "");
    const v = text[k];
    if (v == null || v === false) return "";
    return asHtml ? escHtml(v) : String(v);
  });
}

// Wersja tekstowa maila (dla prostych programów pocztowych) z gotowego HTML
export function htmlToText(html: string) {
  const strip = (s: string) => s.replace(/<[^>]+>/g, "");
  return html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<span style="display:none[\s\S]*?<\/span>/gi, "")
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, label: string) => {
      const l = strip(label).replace(/\s+/g, " ").replace(/&rarr;/g, "").trim();
      if (/^(mailto|tel):/.test(href)) return l;
      return l && l !== href ? `${l}: ${href.replace(/&amp;/g, "&")}` : href;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr|table|li)>/gi, "\n")
    .replace(/<\/td>/gi, "  ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&rarr;/g, "→").replace(/&middot;/g, "·")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .split("\n").map((l) => l.replace(/[ \t]+/g, " ").trim()).join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
