// Adres sklepu i to, czy wyszukiwarki mogą go indeksować. Tylko po stronie serwera.
// Panel (Ustawienia → Widoczność i technika): „Automatycznie” – serwer testowy (sslip.io, localhost) nie trafia do Google,
// domena docelowa tak; „Włączone” / „Wyłączone” – wymuszenie. Zapasowo SITE_INDEX=1/0 w .env.

import { getSite } from "@/integrations/vault";

export const siteBase = () => (process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000").replace(/\/$/, "");

export function siteIndexable() {
  const mode = getSite().indexing;
  if (mode === "on") return true;
  if (mode === "off") return false;
  const flag = process.env.SITE_INDEX;
  if (flag === "1") return true;
  if (flag === "0") return false;
  return !/localhost|127\.0\.0\.1|sslip\.io|nip\.io/.test(siteBase());
}

// Pełny adres (mapa strony, feed, llms.txt – zawsze bezwzględne URL-e)
export const absUrl = (path?: string | null) => {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${siteBase()}${path.startsWith("/") ? "" : "/"}${path}`;
};
