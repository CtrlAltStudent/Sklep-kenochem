// Moduł „Google i marketing”: identyfikatory narzędzi (z panelu Integracje → Moduły) dla sklepu.
// Wszystkie wartości są publiczne (i tak trafiają do przeglądarki) – to nie są hasła.
// Tylko po stronie serwera (czyta schowek integracji).

import { getKey, getMode, moduleEnabled } from "./vault";

export type MarketingConfig = {
  mode: "basic" | "advanced";
  gtm: string;
  ga4: string;
  ads: string;
  adsLabel: string;
  pixel: string;
  clarity: string;
};

const clean = (v: string, re: RegExp) => (re.test(v.trim()) ? v.trim() : "");

export function marketingConfig(): MarketingConfig | null {
  if (!moduleEnabled("google")) return null;
  const c: MarketingConfig = {
    mode: getMode("google") === "advanced" ? "advanced" : "basic",
    gtm: clean(getKey("google.gtmId").toUpperCase(), /^GTM-[A-Z0-9]{4,12}$/),
    ga4: clean(getKey("google.ga4Id").toUpperCase(), /^G-[A-Z0-9]{4,14}$/),
    ads: clean(getKey("google.adsId").toUpperCase(), /^AW-\d{6,14}$/),
    adsLabel: clean(getKey("google.adsLabel"), /^[\w-]{4,40}$/),
    pixel: clean(getKey("meta.pixelId"), /^\d{8,20}$/),
    clarity: clean(getKey("clarity.id"), /^[a-z0-9]{6,16}$/i),
  };
  return c.gtm || c.ga4 || c.ads || c.pixel || c.clarity ? c : null;
}

// Kody weryfikacji domeny (meta w <head>) – działają także bez zgody na cookies
export function siteVerification() {
  if (!moduleEnabled("google")) return {};
  const google = getKey("google.verification").trim().replace(/^.*content="([^"]+)".*$/, "$1");
  const bing = getKey("bing.verification").trim().replace(/^.*content="([^"]+)".*$/, "$1");
  return { google: google || undefined, other: bing ? { "msvalidate.01": bing } : undefined };
}

// „Zapisz i sprawdź” w panelu: poprawność formatu każdego identyfikatora
export function testMarketing() {
  const checks: [string, string, RegExp, string][] = [
    ["google.gtmId", "Tag Manager", /^GTM-[A-Z0-9]{4,12}$/i, "GTM-XXXXXXX"],
    ["google.ga4Id", "GA4", /^G-[A-Z0-9]{4,14}$/i, "G-XXXXXXXXXX"],
    ["google.adsId", "Google Ads", /^AW-\d{6,14}$/i, "AW-123456789"],
    ["google.adsLabel", "etykieta konwersji", /^[\w-]{4,40}$/, "sama etykieta, bez AW-…/"],
    ["meta.pixelId", "Meta Pixel", /^\d{8,20}$/, "same cyfry"],
    ["clarity.id", "Clarity", /^[a-z0-9]{6,16}$/i, "litery i cyfry"],
  ];
  const ok: string[] = [];
  const bad: string[] = [];
  for (const [key, name, re, hint] of checks) {
    const v = getKey(key).trim();
    if (!v) continue;
    if (re.test(v)) ok.push(name);
    else bad.push(`${name}: zły format (oczekiwane ${hint})`);
  }
  if (getKey("google.adsId") && !getKey("google.adsLabel")) bad.push("Google Ads: brak etykiety konwersji „Zakup” – zakupy nie będą liczone jako konwersje");
  if (getKey("google.gtmId") && (getKey("google.ga4Id") || getKey("google.adsId"))) bad.push("Uwaga: wpisany jest GTM i GA4/Ads – jeśli te same tagi są też w GTM, zakupy policzą się podwójnie");
  if (!ok.length && !bad.length) return { ok: false, message: "Nie wpisano żadnego identyfikatora." };
  return {
    ok: !bad.some((b) => b.includes("zły format")),
    message: [ok.length ? `Działa: ${ok.join(", ")}. Zgody: ${getMode("google") === "advanced" ? "tryb zaawansowany" : "tryb podstawowy"}.` : "", ...bad].filter(Boolean).join(" "),
  };
}
