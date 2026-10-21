"use client";

import { useEffect, useState } from "react";
import { Check, Copy, MapPin } from "lucide-react";

export function CopyButton({ value, label = "Kopiuj" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(value.replace(/\s/g, "")).then(() => { setDone(true); setTimeout(() => setDone(false), 1800); })}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${done ? "bg-green-600 text-white" : "bg-brand-50 text-brand-800 hover:bg-brand-100"}`}
    >
      {done ? <><Check className="h-3.5 w-3.5" /> Skopiowano</> : <><Copy className="h-3.5 w-3.5" /> {label}</>}
    </button>
  );
}

// Mapa Google ładowana dopiero po kliknięciu (bez ciasteczek Google przed zgodą)
export function ConsentMap({ query, title }: { query: string; title: string }) {
  const [on, setOn] = useState(false);
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  return (
    <div className="relative h-full min-h-80 overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-brand-100">
      {on ? (
        <iframe src={src} title={title} loading="lazy" className="absolute inset-0 h-full w-full border-0" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_center,_var(--color-brand-100),_transparent_70%)] p-8 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-lg ring-1 ring-brand-100"><MapPin className="h-8 w-8 text-accent" /></span>
          <p className="max-w-xs text-sm text-slate-600">Mapa Google zostanie wczytana po kliknięciu. Google może wtedy zapisać pliki cookies.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => setOn(true)} className="rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent">Pokaż mapę</button>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer"
              className="rounded-xl border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50">Wyznacz trasę ↗</a>
          </div>
        </div>
      )}
    </div>
  );
}

// „Teraz otwarte / zamknięte” wg czasu w Polsce (Pn–Pt 8–16)
export function OpenNowBadge() {
  const [state, setState] = useState<null | boolean>(null);
  useEffect(() => {
    const check = () => {
      const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Warsaw", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
      const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
      const h = Number(parts.find((p) => p.type === "hour")?.value) + Number(parts.find((p) => p.type === "minute")?.value) / 60;
      setState(!["Sat", "Sun"].includes(wd) && h >= 8 && h < 16);
    };
    check();
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, []);
  if (state === null) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${state ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
      <span className={`h-2 w-2 rounded-full ${state ? "animate-pulse bg-green-500" : "bg-slate-400"}`} />
      {state ? "Teraz otwarte" : "Teraz zamknięte"}
    </span>
  );
}
