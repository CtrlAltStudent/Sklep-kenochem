#!/usr/bin/env bash
# Wysyła nową wersję sklepu na serwer testowy.
#   bash deploy/deploy.sh              – zbuduj i wyślij aplikację (dane na serwerze zostają)
#   bash deploy/deploy.sh --with-data  – dodatkowo NADPISZ bazę i pliki media na serwerze lokalnymi
set -euo pipefail

# Serwer i domena Sonax muszą być podane jawnie – ten sam skrypt w sklepie Kenochem wskazuje jego serwer
SERVER="${DEPLOY_SERVER:?Ustaw DEPLOY_SERVER, np. root@adres-serwera-sonax}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/sonax_vps}"
DOMAIN="${DEPLOY_DOMAIN:?Ustaw DEPLOY_DOMAIN, np. test.sonax.sklep.pl}"
REMOTE=/opt/sonax
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
  sqlite3 sonax.db ".backup '$(dirname "$PKG")/sonax.db'" 2>/dev/null || cp sonax.db "$(dirname "$PKG")/sonax.db"
  "${SSH[@]}" "cd $REMOTE && docker compose stop app 2>/dev/null || true"
  scp -i "$KEY" -o BatchMode=yes -q "$(dirname "$PKG")/sonax.db" "$SERVER:$REMOTE/data/sonax.db"
  tar -czf "$(dirname "$PKG")/media.tgz" media
  scp -i "$KEY" -o BatchMode=yes -q "$(dirname "$PKG")/media.tgz" "$SERVER:$REMOTE/media.tgz"
  "${SSH[@]}" "cd $REMOTE && tar -xzf media.tgz && rm media.tgz"
fi

echo "▸ Uruchamianie…"
# Bez profilu solo — nie startujemy Caddy (porty 80/443 trzyma Kenochem).
"${SSH[@]}" "set -e; cd $REMOTE && rm -rf app.new && mkdir app.new && tar -xzf app.tgz -C app.new && rm app.tgz \
  && rm -rf app.old && mv app app.old && mv app.new app \
  && docker stop sonax-app >/dev/null 2>&1 || true \
  && docker compose up -d --build --remove-orphans && docker image prune -f >/dev/null && rm -rf app.old \
  && docker exec kenochem-caddy-1 caddy reload --config /etc/caddy/Caddyfile >/dev/null || true"

rm -rf "$(dirname "$PKG")"
echo "✔ Gotowe: https://$DOMAIN"
