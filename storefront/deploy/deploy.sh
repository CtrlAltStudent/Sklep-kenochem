#!/usr/bin/env bash
# Wysyła nową wersję sklepu na serwer testowy.
#   bash deploy/deploy.sh              – zbuduj i wyślij aplikację (dane na serwerze zostają)
#   bash deploy/deploy.sh --with-data  – dodatkowo NADPISZ bazę i pliki media na serwerze lokalnymi
set -euo pipefail

SERVER="${DEPLOY_SERVER:-root@185.193.114.233}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/kenochem_vps}"
DOMAIN="${DEPLOY_DOMAIN:-185-193-114-233.sslip.io}"
REMOTE=/opt/kenochem
SSH=(ssh -i "$KEY" -o BatchMode=yes "$SERVER")

cd "$(dirname "$0")/.."

echo "▸ Budowanie (adres: https://$DOMAIN)…"
NEXT_PUBLIC_SERVER_URL="https://$DOMAIN" NEXT_PUBLIC_SKIP_KENOCHEM_IMAGES=1 npx next build

echo "▸ Pakowanie…"
PKG="$(mktemp -d)/app.tgz"
tar -czf "$PKG" --exclude=.next/cache --exclude=.next/dev \
  package.json package-lock.json .npmrc next.config.ts tsconfig.json public .next \
  -C deploy Dockerfile fix-links.mjs
echo "  $(du -h "$PKG" | cut -f1)"

echo "▸ Wysyłanie na serwer…"
"${SSH[@]}" "mkdir -p $REMOTE/app $REMOTE/data $REMOTE/media"
scp -i "$KEY" -o BatchMode=yes -q "$PKG" deploy/docker-compose.yml deploy/Caddyfile "$SERVER:$REMOTE/"

if [[ "${1:-}" == "--with-data" ]]; then
  echo "▸ Wysyłanie bazy i plików media (nadpisanie danych na serwerze)…"
  sqlite3 kenochem.db ".backup '$(dirname "$PKG")/kenochem.db'" 2>/dev/null || cp kenochem.db "$(dirname "$PKG")/kenochem.db"
  "${SSH[@]}" "cd $REMOTE && docker compose stop app 2>/dev/null || true"
  scp -i "$KEY" -o BatchMode=yes -q "$(dirname "$PKG")/kenochem.db" "$SERVER:$REMOTE/data/kenochem.db"
  tar -czf "$(dirname "$PKG")/media.tgz" media
  scp -i "$KEY" -o BatchMode=yes -q "$(dirname "$PKG")/media.tgz" "$SERVER:$REMOTE/media.tgz"
  "${SSH[@]}" "cd $REMOTE && tar -xzf media.tgz && rm media.tgz"
fi

echo "▸ Uruchamianie…"
"${SSH[@]}" "set -e; cd $REMOTE && rm -rf app.new && mkdir app.new && tar -xzf app.tgz -C app.new && rm app.tgz \
  && rm -rf app.old && mv app app.old && mv app.new app \
  && docker compose up -d --build --remove-orphans && docker image prune -f >/dev/null && rm -rf app.old"

rm -rf "$(dirname "$PKG")"
echo "✔ Gotowe: https://$DOMAIN"
