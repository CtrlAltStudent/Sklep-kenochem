"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

// Zgody na pliki cookies (RODO) + Google Consent Mode v2. Wybór zapisany w przeglądarce na 12 miesięcy.
// Po zapisie: aktualizacja zgód w Google (gtag „consent update”) i załadowanie narzędzi, na które klient się zgodził
// (window.sonaxTags ze skryptu startowego src/lib/tagsBootstrap.ts).
type Consent = { necessary: true; analytics: boolean; marketing: boolean; at: string };
const KEY = "sonax-consent-v1";

const YEAR = 365 * 24 * 60 * 60 * 1000;

declare global {
  interface Window {
    sonaxConsent?: Consent;
    sonaxTags?: (analytics: boolean, marketing: boolean) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function openCookieSettings() {
  window.dispatchEvent(new Event("sonax:cookies"));
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    let saved: Consent | null = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch {}
    // zgoda ważna 12 miesięcy – potem pytamy ponownie
    if (saved && Date.now() - new Date(saved.at).getTime() < YEAR) {
      window.sonaxConsent = saved;
    } else {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const show = () => {
      setAnalytics(window.sonaxConsent?.analytics ?? false);
      setMarketing(window.sonaxConsent?.marketing ?? false);
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener("sonax:cookies", show);
    return () => window.removeEventListener("sonax:cookies", show);
  }, []);

  const save = (a: boolean, m: boolean) => {
    const c: Consent = { necessary: true, analytics: a, marketing: m, at: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {}
    window.sonaxConsent = c;
    const g = (b: boolean) => (b ? "granted" : "denied");
    window.gtag?.("consent", "update", { analytics_storage: g(a), ad_storage: g(m), ad_user_data: g(m), ad_personalization: g(m) });
    window.dataLayer?.push({ event: "consent_update", consent_analytics: a, consent_marketing: m });
    window.sonaxTags?.(a, m);
    setOpen(false);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={openCookieSettings}
          className="fixed bottom-4 left-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-white text-brand-700 shadow-lg ring-1 ring-brand-100 hover:bg-brand-50"
          aria-label="Ustawienia cookies"
          title="Ustawienia cookies"
        >
          <Cookie className="h-6 w-6" />
        </button>
      )}
    {open && <div className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl animate-fade-in rounded-3xl bg-white p-5 shadow-2xl ring-1 shadow-brand-900/20 ring-brand-100 sm:p-6" role="dialog" aria-label="Ustawienia plików cookies">
      <div className="flex gap-4">
        <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 sm:grid"><Cookie className="h-6 w-6" /></span>
        <div className="flex-1">
          <p className="font-extrabold text-navy">Szanujemy Twoją prywatność</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Używamy plików cookies niezbędnych do działania sklepu (koszyk, logowanie). Za Twoją zgodą także analitycznych i marketingowych.
            Szczegóły w <Link href="/polityka-prywatnosci" className="font-semibold text-accent-dark underline">polityce prywatności</Link>.
          </p>
          {details && (
            <div className="mt-4 space-y-2">
              {[
                ["Niezbędne", "Koszyk, ulubione, bezpieczeństwo – zawsze włączone", true, () => {}, true],
                ["Analityczne", "Statystyki odwiedzin i nagrania sesji bez danych osobowych (np. Google Analytics, Microsoft Clarity)", analytics, () => setAnalytics(!analytics), false],
                ["Marketingowe", "Pomiar skuteczności i dopasowanie reklam (np. Google Ads, Meta – Facebook/Instagram)", marketing, () => setMarketing(!marketing), false],
              ].map(([title, desc, on, toggle, locked]) => (
                <label key={title as string} className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-brand-50/60 px-4 py-3">
                  <span className="text-sm"><b className="block text-ink">{title as string}</b><span className="text-slate-500">{desc as string}</span></span>
                  <input type="checkbox" checked={on as boolean} disabled={locked as boolean} onChange={toggle as () => void} className="peer sr-only" />
                  <span className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-brand-700 peer-disabled:opacity-60 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
                </label>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => save(true, true)} className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent">Akceptuj wszystkie</button>
            <button onClick={() => save(false, false)} className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-accent">Tylko niezbędne</button>
            {details
              ? <button onClick={() => save(analytics, marketing)} className="rounded-xl px-5 py-2.5 text-sm font-bold text-brand-800 ring-1 ring-brand-200 hover:bg-brand-50">Zapisz wybór</button>
              : <button onClick={() => setDetails(true)} className="rounded-xl px-5 py-2.5 text-sm font-bold text-brand-800 ring-1 ring-brand-200 hover:bg-brand-50">Ustawienia</button>}
          </div>
        </div>
      </div>
    </div>}
    </>
  );
}

// Link „Ustawienia cookies” w stopce
export function CookieSettingsLink() {
  return <button onClick={openCookieSettings} className="hover:text-white">Ustawienia cookies</button>;
}
