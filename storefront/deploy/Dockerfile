# Obraz uruchomieniowy sklepu. Aplikacja jest budowana lokalnie (next build),
# tutaj instalujemy tylko zależności produkcyjne – z binarkami dla Linuksa (sharp, libsql).
FROM node:24-bookworm-slim

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY next.config.ts tsconfig.json ./
COPY public ./public
COPY .next ./.next
COPY fix-links.mjs ./
RUN node fix-links.mjs

EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
