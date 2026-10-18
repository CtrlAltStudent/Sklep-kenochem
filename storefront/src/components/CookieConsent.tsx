"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

// Zgody na pliki cookies (RODO). Wybór zapisany w przeglądarce; skrypty analityczne/marketingowe
// powinny sprawdzać window.kenochemConsent przed uruchomieniem.
type Consent = { necessary: true; analytics: boolean; marketing: boolean; at: string };
const KEY = "kenochem-consent-v1";

declare global {
  interface Window { kenochemConsent?: Consent }
}

export function openCookieSettings() {
  window.dispatchEvent(new Event("kenochem:cookies"));
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    let saved: Consent | null = null;
    try { saved = JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch {}
    if (saved) {
      window.kenochemConsent = saved;
    } else {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const show = () => {
      setAnalytics(window.kenochemConsent?.analytics ?? false);
      setMarketing(window.kenochemConsent?.marketing ?? false);
      setDetails(true);
      setOpen(true);
    };
    window.addEventListener("kenochem:cookies", show);
    return () => window.removeEventListener("kenochem:cookies", show);
  }, []);

  const save = (a: boolean, m: boolean) => {
    const c: Consent = { necessary: true, analytics: a, marketing: m, at: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {}
    window.kenochemConsent = c;
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl animate-fade-in rounded-3xl bg-white p-5 shadow-2xl ring-1 shadow-brand-900/20 ring-brand-100 sm:p-6" role="dialog" aria-label="Ustawienia plików cookies">
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
                ["Analityczne", "Statystyki odwiedzin, które pomagają ulepszać sklep", analytics, () => setAnalytics(!analytics), false],
                ["Marketingowe", "Dopasowane reklamy w innych serwisach", marketing, () => setMarketing(!marketing), false],
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
    </div>
  );
}

// Link „Ustawienia cookies” w stopce
export function CookieSettingsLink() {
  return <button onClick={openCookieSettings} className="hover:text-white">Ustawienia cookies</button>;
}
