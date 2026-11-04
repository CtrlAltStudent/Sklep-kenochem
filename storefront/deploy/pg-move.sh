#!/bin/bash
# Przenosi dane sklepu z pliku SQLite do PostgreSQL i przełącza działający sklep.
# Uruchamiać na serwerze, w /opt/sonax, gdy kontener postgres już istnieje.
set -euo pipefail
cd /opt/sonax
if [ -f data/pg-moved ]; then
  echo "baza już jest na PostgreSQL"
  exit 0
fi

PW="$(grep -E '^POSTGRES_PASSWORD=' .env | head -n 1 | cut -d= -f2-)"
if [ -z "$PW" ]; then
  echo "brak POSTGRES_PASSWORD"
  exit 1
fi
URL="postgres://sonax:${PW}@postgres:5432/sonax_shop"

cp -a data/sonax.db "data/sonax.db.bak-pg"
echo "kopia pliku bazy zapisana"

docker compose up -d postgres
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  docker exec sonax-postgres pg_isready -U sonax -d sonax_shop && break
  sleep 2
done

docker rm -f sonax-pginit >/dev/null 2>&1 || true
# Next w produkcji nie tworzy tabel. Ten jednorazowy start jest w trybie development tylko po to, żeby dopisać schemat.
docker compose run -d --name sonax-pginit --no-deps \
  -e DATABASE_URL="$URL" \
  -e PAYLOAD_DB_PUSH=1 \
  -e NODE_ENV=development \
  sonax

echo "tworzę tabele"
ok=0
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40; do
  if docker exec sonax-postgres psql -U sonax -d sonax_shop -tAc "SELECT to_regclass('public.products')" | grep -q products; then
    ok=1
    break
  fi
  sleep 3
done
if [ "$ok" != 1 ]; then
  echo "tabele się nie utworzyły"
  docker logs sonax-pginit --tail 50
  exit 1
fi
kind="$(docker exec sonax-pginit printenv DATABASE_URL | cut -d: -f1)"
echo "baza startowa: $kind, push=$(docker exec sonax-pginit printenv PAYLOAD_DB_PUSH)"
docker stop sonax-pginit >/dev/null
docker rm sonax-pginit >/dev/null

NET="$(docker inspect sonax-postgres --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' | awk '{print $1}')"
echo "kopiuję dane"
docker run --rm --network "$NET" -w /app \
  -v /opt/sonax/data:/data \
  -v /opt/sonax/sqlite-to-pg.mjs:/app/sqlite-to-pg.mjs:ro \
  -e DATABASE_URL="$URL" \
  sonax-shop node sqlite-to-pg.mjs /data/sonax.db

if grep -q '^DATABASE_URL=' .env; then
  grep -v '^DATABASE_URL=' .env > .env.pg-new
  printf 'DATABASE_URL=%s\n' "$URL" >> .env.pg-new
  mv .env.pg-new .env
else
  printf 'DATABASE_URL=%s\n' "$URL" >> .env
fi

docker compose up -d sonax
echo "czekam na sklep"
sleep 8
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  code="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 15 https://sonax.sklep.pl/api/zdrowie || true)"
  if [ "$code" = "200" ]; then
    touch data/pg-moved
    pgcount="$(docker exec sonax-postgres psql -U sonax -d sonax_shop -tAc 'SELECT count(*) FROM products')"
    echo "działa, produktów: ${pgcount}"
    exit 0
  fi
  sleep 3
done
echo "sklep po przełączeniu nie odpowiedział zdrowiem"
docker logs sonax-app --tail 40
exit 1
