# Panel sklepu i integracja z BaseLinkerem

## Uruchomienie

```bash
npm run dev          # sklep: http://localhost:3000, panel: http://localhost:3000/admin
npm run seed         # dane startowe (kategorie, produkty z CSV, dostawy, płatności, banery) – można powtarzać
```

Baza danych ustawiana jest w `.env.local` (`DATABASE_URL`):
- `file:./kenochem.db` – SQLite, bez Dockera (lokalnie),
- `postgres://kenochem:kenochem_dev@127.0.0.1:5433/kenochem_shop` – PostgreSQL z `docker compose up -d` (serwer docelowy).

## Role pracowników

| Rola | Dostęp |
|---|---|
| Administrator | wszystko, w tym ustawienia i integracje |
| Redaktor | produkty, kategorie, strony, blog, banery |
| Obsługa zamówień | zamówienia, klienci, weryfikacja kont B2B |

## Podłączenie prawdziwego BaseLinkera

1. W BaseLinkerze: **Moje konto → API** → wygeneruj token.
2. W `.env.local` ustaw `BASELINKER_TOKEN=…` oraz `BASELINKER_MOCK=0`, zrestartuj `npm run dev`.
   Token jest tylko w pliku `.env.local` – nie trafia do bazy ani do repozytorium.
3. Panel → **Integracje → BaseLinker → „1. Testuj połączenie”** – pojawią się tabele z ID katalogu,
   grup cenowych, magazynów, statusów i kategorii. Wpisz je w pola zakładek *Katalog* i *Zamówienia*, zapisz.
4. **Sklep → Kategorie** – w każdej kategorii dopisz ID kategorii BaseLinkera, które mają do niej trafiać.
5. **Ustawienia sklepu → Dostawa / Płatności** – pole „Nazwa w BaseLinkerze” musi odpowiadać nazwom,
   których używają reguły kurierskie i automatyzacje w BaseLinkerze (maks. 30 znaków).
6. **„2. Podgląd synchronizacji”** – pokazuje, co się zmieni, niczego nie zapisując.
7. **„3. Synchronizuj produkty”** – produkty z importu CSV są dopasowywane po SKU/EAN (bez duplikatów).
8. Test bez przeglądarki: `npm run verify:baselinker` (przy prawdziwym tokenie wykonuje tylko odczyty;
   `VERIFY_SEND=1` wysyła zamówienie testowe – potem usuń je w BaseLinkerze).
9. Gdy wszystko się zgadza: włącz **„Wysyłaj zamówienia automatycznie”**.

## Jak zamówienie trafia do BaseLinkera

```
klient składa zamówienie → status „Nowe”
   ├─ płatność online (Przelewy24): po potwierdzeniu płatności → wysyłka do BaseLinkera
   └─ przelew / pobranie / termin B2B: wysyłka od razu
→ walidacja danych (limity i formaty z dokumentacji addOrder) → addOrder → ID zamówienia BaseLinkera
→ status „Przekazane do realizacji”, dalej: kurier, faktura, statusy – w BaseLinkerze
```

- Zamówienie z błędnymi danymi **nie jest wysyłane** – błąd widać w zakładce *BaseLinker* zamówienia
  i na pulpicie („Błędy przekazania do BaseLinkera”).
- Zamówienie wysłane raz nie zostanie wysłane ponownie (ochrona przed duplikatami).
- Każda operacja zapisuje się w **Integracje → Dziennik integracji**.
- Limit API (100 zapytań/min) jest pilnowany automatycznie.

## Pliki

| Plik | Co robi |
|---|---|
| `src/payload.config.ts` | konfiguracja panelu |
| `src/payload/collections/*` | produkty, kategorie, zamówienia, klienci, treści |
| `src/payload/globals.ts` | strona główna, menu, ustawienia sklepu, ustawienia BaseLinkera |
| `src/integrations/baselinker/client.ts` | połączenie z API, limit zapytań, ponawianie |
| `src/integrations/baselinker/schemas.ts` | walidacja danych zamówienia (addOrder) |
| `src/integrations/baselinker/orders.ts` | mapowanie i wysyłka zamówień |
| `src/integrations/baselinker/sync.ts` | synchronizacja produktów i stanów, test połączenia |
| `src/integrations/baselinker/mock.ts` | tryb testowy bez tokena |
