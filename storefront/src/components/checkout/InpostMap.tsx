"use client";

// Wybór paczkomatu z mapy InPost (Geowidget v5) w oknie nad stroną zamówienia.
// Skrypt i style InPost ładujemy dopiero przy pierwszym otwarciu mapy. Token z panelu
// (Integracje → InPost) jest publiczny i działa tylko na domenie, dla której go wygenerowano.

import { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";

const CSS = "https://geowidget.inpost.pl/inpost-geowidget.css";
const JS = "https://geowidget.inpost.pl/inpost-geowidget.js";
const EVENT = "sonaxinpostpoint"; // nazwa zdarzenia z atrybutu onpoint – widget wysyła je z danymi punktu

export type InpostPoint = { code: string; label: string };

type GeoPoint = {
  name?: string;
  location_description?: string;
  address?: { line1?: string; line2?: string };
  address_details?: { city?: string; post_code?: string; street?: string; building_number?: string };
};

let loading: Promise<void> | null = null;
function loadWidget() {
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    if (!document.querySelector(`link[href="${CSS}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = CSS;
      document.head.appendChild(l);
    }
    if (customElements.get("inpost-geowidget")) return resolve();
    const s = document.createElement("script");
    s.src = JS;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Nie udało się wczytać mapy InPost."));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export const pointLabel = (p: GeoPoint) => {
  const d = p.address_details;
  const street = d ? [d.street, d.building_number].filter(Boolean).join(" ") : p.address?.line1;
  const city = d ? [d.post_code, d.city].filter(Boolean).join(" ") : p.address?.line2;
  return [street, city].filter(Boolean).join(", ") + (p.location_description ? ` · ${p.location_description}` : "");
};

export function InpostMap({ token, cod, onSelect, onClose }: { token: string; cod: boolean; onSelect: (p: InpostPoint) => void; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    loadWidget().then(() => alive && setReady(true)).catch((e: Error) => alive && setError(e.message));
    return () => { alive = false; };
  }, []);

  // Element widgetu tworzymy ręcznie: jego atrybuty (token, config…) mają w klasie tylko gettery,
  // a React 19 próbowałby ustawić je jako właściwości
  useEffect(() => {
    const el = host.current;
    if (!ready || !el) return;
    const w = document.createElement("inpost-geowidget");
    w.setAttribute("token", token);
    w.setAttribute("language", "pl");
    w.setAttribute("config", cod ? "parcelCollectPayment" : "parcelCollect");
    w.setAttribute("onpoint", EVENT);
    w.style.display = "block";
    w.style.height = "100%";
    el.appendChild(w);
    return () => { el.innerHTML = ""; };
  }, [ready, token, cod]);

  // Zdarzenie z widgetu (bąbelkuje z elementu <inpost-geowidget>)
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const handler = (e: Event) => {
      const p = (e as CustomEvent<GeoPoint>).detail;
      if (!p?.name) return;
      onSelect({ code: p.name, label: pointLabel(p) });
    };
    el.addEventListener(EVENT, handler);
    return () => el.removeEventListener(EVENT, handler);
  }, [onSelect]);

  // Esc zamyka, strona pod spodem się nie przewija
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/60 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Wybór paczkomatu InPost" onClick={onClose}>
      <div className="flex h-[92dvh] w-full max-w-5xl animate-fade-in flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[82vh] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center gap-3 border-b border-brand-100 px-4 py-3 sm:px-5">
          {/* eslint-disable-next-line @next/next/no-img-element -- oficjalne logo z public/marks */}
          <img src="/marks/inpost-paczkomat.svg" alt="" className="h-8 w-auto" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-navy">Wybierz paczkomat</h2>
            <p className="truncate text-xs text-slate-500">Wpisz miasto lub ulicę albo zaznacz punkt na mapie{cod ? " – pokazujemy punkty z płatnością przy odbiorze" : ""}.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Zamknij mapę" className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div ref={box} className="relative min-h-0 flex-1">
          {error ? (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-slate-600">
              <p><MapPin className="mx-auto mb-2 h-8 w-8 text-slate-300" />{error} Zamknij okno i wpisz kod paczkomatu ręcznie.</p>
            </div>
          ) : (
            <>
              {!ready && <div className="absolute inset-0 grid place-items-center text-sm text-slate-500">Wczytuję mapę InPost…</div>}
              <div ref={host} className="h-full" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
