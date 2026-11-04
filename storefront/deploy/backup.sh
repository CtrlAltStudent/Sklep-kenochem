#!/bin/sh
# Codzienna kopia sklepu na żywo: baza PostgreSQL i plik ustawień (bez haseł w dzienniku).
# Uruchamia cron na serwerze sklepu. Nie dotyczy serwera testowego.
set -eu
DIR=/opt/sonax/backups
mkdir -p "$DIR"
STAMP=$(date +%Y%m%d-%H%M)
DUMP="$DIR/sonax-$STAMP.dump"
docker exec sonax-postgres sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U sonax -d sonax_shop -Fc' > "$DUMP"
if [ ! -s "$DUMP" ]; then
  rm -f "$DUMP"
  echo "kopia bazy pusta" >&2
  exit 1
fi
if [ -f /opt/sonax/data/integrations.json ]; then
  cp /opt/sonax/data/integrations.json "$DIR/integrations-$STAMP.json"
fi
# Zdjęcia tylko w niedzielę – plik jest duży.
if [ "$(date +%u)" = "7" ] && [ -d /opt/sonax/data/media ]; then
  tar -C /opt/sonax/data -czf "$DIR/media-$STAMP.tgz" media
fi
find "$DIR" -type f -mtime +14 -delete
echo "ok $STAMP"
