// Ustawienia techniczne sklepu (panel: Ustawienia → Widoczność i technika). Bez haseł – bezpieczne także dla panelu w przeglądarce.
// Zapis w schowku integracji (integrations.json obok bazy) – zmiana nie wymaga zmian w bazie danych.

export type SiteSettings = {
  indexing: "auto" | "on" | "off"; // auto = włączone na domenie docelowej, wyłączone na serwerze testowym
  aiBots: boolean; // czy roboty AI (ChatGPT, Claude, Perplexity, Gemini) mogą czytać sklep
  robotsExtra: string; // dodatkowe ścieżki do zablokowania, po jednej w linii (np. /promocje-stare)
  llmsEnabled: boolean;
  llmsIntro: string; // dodatkowy opis sklepu na początku llms.txt
  feedEnabled: boolean;
  feedOutOfStock: boolean; // produkty niedostępne w pliku Merchant Center (jako out_of_stock)
  maintenance: boolean; // przerwa techniczna – klienci widzą komunikat, panel działa
  maintenanceText: string;
};

export const defaultSite: SiteSettings = {
  indexing: "auto",
  aiBots: true,
  robotsExtra: "",
  llmsEnabled: true,
  llmsIntro: "",
  feedEnabled: true,
  feedOutOfStock: true,
  maintenance: false,
  maintenanceText: "Trwa przerwa techniczna – wracamy za chwilę. Zamówienia telefoniczne: +48 500 021 705.",
};

// Roboty AI blokowane, gdy aiBots = false
export const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "anthropic-ai", "PerplexityBot", "Google-Extended", "CCBot", "Applebot-Extended", "Bytespider"];

export function cleanSite(raw: Partial<Record<keyof SiteSettings, unknown>>): Partial<SiteSettings> {
  const out: Partial<SiteSettings> = {};
  if (raw.indexing === "auto" || raw.indexing === "on" || raw.indexing === "off") out.indexing = raw.indexing;
  for (const k of ["aiBots", "llmsEnabled", "feedEnabled", "feedOutOfStock", "maintenance"] as const) if (typeof raw[k] === "boolean") out[k] = raw[k] as boolean;
  if (typeof raw.robotsExtra === "string")
    out.robotsExtra = raw.robotsExtra.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith("/")).slice(0, 50).join("\n");
  if (typeof raw.llmsIntro === "string") out.llmsIntro = raw.llmsIntro.slice(0, 3000);
  if (typeof raw.maintenanceText === "string") out.maintenanceText = raw.maintenanceText.slice(0, 500);
  return out;
}
