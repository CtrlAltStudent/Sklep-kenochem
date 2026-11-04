"use client";

// Mapa punktów ORLEN Paczka. Skrypt i sposób osadzenia są z instrukcji ORLEN
// (widget mapy): token jest przypisany do domeny sklepu, a wybrany punkt
// wpada do ukrytych pól, z których bierzemy kod i adres.

import { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";

export function OrlenMap({ token, onSelect, onClose }: { token: string; onSelect: (p: { code: string; label: string }) => void; onClose: () => void }) {
  const codeRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  useEffect(() => {
    if (!token) {
      setError("Mapa ORLEN Paczka nie ma jeszcze klucza. Wpisz kod punktu ręcznie albo dodaj klucz w panelu: Integracje → ORLEN Paczka.");
      return;
    }
    const prev = document.querySelector("script[data-orlen-widget]");
    prev?.remove();
    const s = document.createElement("script");
    s.async = true;
    s.dataset.orlenWidget = "1";
    s.src = `https://mapa.orlenpaczka.pl/widget.js?token=${encodeURIComponent(token)}&v=1.0.0&t=${Math.floor(Date.now() / 1000)}`;
    s.onerror = () => setError("Nie udało się wczytać mapy ORLEN Paczka.");
    document.head.appendChild(s);
    // Widget mierzy mapę przy starcie. Po ułożeniu okna prosimy ją, żeby wypełniła wolne miejsce.
    const kick = () => window.dispatchEvent(new Event("resize"));
    document.addEventListener("orlenWidgetInit", kick);
    const later = window.setTimeout(kick, 400);
    return () => {
      s.remove();
      document.removeEventListener("orlenWidgetInit", kick);
      window.clearTimeout(later);
    };
  }, [token]);

  useEffect(() => {
    const code = codeRef.current;
    const label = labelRef.current;
    if (!code) return;
    let last = "";
    const sync = () => {
      const next = code.value.trim();
      if (!next || next === last) return;
      last = next;
      onSelect({ code: next, label: (label?.value || "").trim() });
    };
    code.addEventListener("input", sync);
    code.addEventListener("change", sync);
    const timer = window.setInterval(sync, 400);
    return () => {
      code.removeEventListener("input", sync);
      code.removeEventListener("change", sync);
      window.clearInterval(timer);
    };
  }, [onSelect]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/60 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Wybór punktu ORLEN Paczka" onClick={onClose}>
      <div className="flex h-[92dvh] w-full max-w-5xl animate-fade-in flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[82vh] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center gap-3 border-b border-brand-100 px-4 py-3 sm:px-5">
          {/* eslint-disable-next-line @next/next/no-img-element -- oficjalne logo z public/marks */}
          <img src="/marks/orlen-paczka.png" alt="" className="h-8 w-auto" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-navy">Wybierz punkt ORLEN Paczka</h2>
            <p className="truncate text-xs text-slate-500">Automat, stacja albo punkt partnerski. Możesz też wpisać miasto.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Zamknij mapę" className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-navy">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="kc-orlen relative min-h-0 flex-1">
          {error ? (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-slate-600">
              <p><MapPin className="mx-auto mb-2 h-8 w-8 text-slate-300" />{error}</p>
            </div>
          ) : (
            <>
              <input id="orlen-point-code" ref={codeRef} readOnly tabIndex={-1} aria-hidden className="sr-only" />
              <input id="orlen-point-label" ref={labelRef} readOnly tabIndex={-1} aria-hidden className="sr-only" />
              <div
                className="orlen-widget h-full"
                data-target="#orlen-point-code"
                data-label="#orlen-point-label"
                data-type="dropoff"
                data-layout="normal"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
