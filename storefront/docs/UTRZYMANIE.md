# Utrzymanie sklepu Sonax

## Kopie zapasowe

| Gdzie | Co | Jak często | Jak długo |
|---|---|---|---|
| Serwer: `/opt/sonax/backups` | baza (`sonax-*.db.gz`), klucze integracji (`integrations-*.json`), zdjęcia z panelu (`media-*.tgz`) | baza i klucze codziennie o 3:30, zdjęcia w niedziele | 14 dni, zdjęcia – 4 kopie |
| Komputer w biurze: `Dokumenty\Sonax-kopie` | to samo, pobierane z serwera | codziennie o 8:30 (albo zaraz po włączeniu komputera) | 90 dni, zdjęcia – 8 kopii |

- Skrypt na serwerze: `/opt/sonax/backup.sh` (cron `30 3 * * *`), dziennik: `/opt/sonax/backups/backup.log`.
  Kopia bazy robiona jest bezpiecznie w trakcie pracy sklepu (`sqlite3 .backup`) i sprawdzana (`PRAGMA integrity_check`).
- Na komputerze: zadanie „Sonax - kopia zapasowa sklepu” w Harmonogramie zadań Windows, skrypt `Dokumenty\Sonax-kopie\pobierz-kopie.ps1`,
  dziennik `kopie.log` w tym samym folderze – warto raz w tygodniu zajrzeć, czy ostatni wpis to „OK”.
- Klucze integracji w `integrations-*.json` są zaszyfrowane `PAYLOAD_SECRET` z `/opt/sonax/.env` – trzymaj ten sekret osobno
  (np. w menedżerze haseł). Bez niego po odtworzeniu klucze trzeba wpisać w panelu ponownie.
- Kopie zawierają dane klientów (RODO) – nie wysyłaj ich mailem i nie wrzucaj do publicznych folderów.

### Odtworzenie bazy z kopii (na serwerze)

```bash
cd /opt/sonax
docker compose stop sonax
cp data/sonax.db data/sonax.db.przed-odtworzeniem
gunzip -c backups/sonax-RRRR-MM-DD_GGMM.db.gz > data/sonax.db
docker compose start sonax
```

Kopię z komputera wgrywa się na serwer tak samo (najpierw `scp` pliku `.db.gz` do `/opt/sonax/backups`).

## Synchronizacja z BaseLinkerem

Panel → Integracje → BaseLinker → zakładka „Synchronizacja”. Włączone: stany i ceny (co 15 min), statusy zamówień (co 15 min:
„Wysłane”, „Do odebrania” → „Wysłane do klienta” z mailem, „Anulowane” → „Anulowane”), ponawianie zamówień.
Pełne dane produktów (nazwy, opisy, zdjęcia) – wyłączone, żeby nie nadpisywać zmian zrobionych w panelu sklepu.
Każdy przebieg widać w zakładce „Dziennik”.

## Stany magazynowe po zamówieniu

Nowe zamówienie (także dodane ręcznie w panelu) od razu zmniejsza stan produktów, anulowanie go przywraca
(`src/integrations/checkout/stock.ts`). Prawdziwe stany co 15 min ustawia synchronizacja z BaseLinkerem.

## Monitoring

- Adres kontrolny: `https://<domena-sklepu>/api/zdrowie` – odpowiada `"status":"ok"` (kod 200), a przy problemie kod 503
  i krótki opis (baza nie odpowiada, harmonogram nie działa, synchronizacja z BaseLinkerem stoi lub zgłasza błąd).
- Adres jest dostępny bez hasła strony (wyjątek w `/opt/kenochem/Caddyfile`, razem z `/api/baselinker/shop`
  i powiadomieniami Przelewy24 `/api/payments/p24/notify`, `/api/payments/p24/blik-notify`).
- UptimeRobot (darmowe konto): monitor typu **Keyword**, adres jak wyżej, słowo kluczowe `"status":"ok"`
  (alert gdy go brak), sprawdzanie co 5 minut, powiadomienie mailem (opcjonalnie SMS / aplikacja).
