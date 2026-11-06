"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Beaker, Droplets } from "lucide-react";
import { ProductImage } from "./ProductImage";

export type DilutionExample = {
  name: string;
  slug: string;
  image?: string;
  price: string;
  ratio: number;
  note: string;
};

const PRESETS = [5, 10, 20, 50, 100, 200];

const amount = (liters: number) =>
  liters < 1
    ? `${Math.max(1, Math.round(liters * 1000))} ml`
    : `${liters.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} l`;

export function DilutionGuide({ examples }: { examples: DilutionExample[] }) {
  const [ratio, setRatio] = useState(examples[0]?.ratio ?? 10);
  const [liters, setLiters] = useState(10);
  const [picked, setPicked] = useState(examples[0]?.slug ?? "");

  const mix = useMemo(() => {
    const safe = Math.min(500, Math.max(1, ratio));
    const total = Math.min(100, Math.max(0.25, liters));
    const product = total / (1 + safe);
    return { safe, total, product, water: total - product, fromBottle: 1 + safe };
  }, [ratio, liters]);

  const waterPct = (mix.water / mix.total) * 100;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-8">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:p-8">
          <p className="text-xs font-bold tracking-widest text-accent uppercase">Jak czytać proporcję</p>
          <h2 className="mt-2 text-2xl font-extrabold text-navy">1:10 to jedna miarka preparatu i dziesięć miarek wody</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
            Gotowego płynu jest wtedy jedenaście miarek. Im większa liczba po dwukropku, tym mniej koncentratu w wiadrze.
            Proporcje przy przykładach są wzięte z opisów produktów w tym sklepie. Na butelce może być inna dla mocnego brudu — zawsze sprawdź etykietę.
          </p>
        </section>

        <section id="kalkulator" className="rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-accent uppercase">Kalkulator</p>
              <h2 className="mt-1 text-2xl font-extrabold text-navy">Ile wlać do wody</h2>
            </div>
            <p className="text-sm text-slate-500">Z 1 litra koncentratu wyjdzie <b className="text-navy">{amount(mix.fromBottle)}</b> gotowego płynu</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {PRESETS.map((n) => (
              <button key={n} type="button" onClick={() => { setRatio(n); setPicked(""); }}
                className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${ratio === n && !picked ? "bg-navy text-white" : "bg-brand-50 text-brand-900 hover:bg-brand-100"}`}>
                1:{n}
              </button>
            ))}
            <label className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-900">
              1:
              <input value={ratio} onChange={(e) => { setRatio(Math.max(1, Math.min(500, Number(e.target.value.replace(/\D/g, "")) || 1))); setPicked(""); }}
                inputMode="numeric" aria-label="Własna proporcja" className="w-14 bg-transparent text-center outline-none" />
            </label>
          </div>

          <label className="mt-6 block text-sm font-semibold text-slate-600">
            Ile gotowego płynu chcesz zrobić: <b className="text-navy">{amount(mix.total)}</b>
            <input type="range" min={1} max={20} step={1} value={Math.min(20, Math.max(1, liters))} onChange={(e) => setLiters(Number(e.target.value))}
              className="mt-2 w-full accent-leaf" />
          </label>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div key={`p-${mix.product}`} className="animate-fade-in rounded-2xl bg-leaf-50 p-5">
              <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-leaf uppercase"><Beaker className="h-4 w-4" /> Preparat</p>
              <p className="mt-1 text-3xl font-black text-navy">{amount(mix.product)}</p>
            </div>
            <div key={`w-${mix.water}`} className="animate-fade-in rounded-2xl bg-sky-50 p-5">
              <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-sky-700 uppercase"><Droplets className="h-4 w-4" /> Woda</p>
              <p className="mt-1 text-3xl font-black text-navy">{amount(mix.water)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">Rękawice, okulary, jeśli etykieta tego wymaga. Nie mieszaj różnych preparatów w jednym wiadrze.</p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold text-navy">Przykłady z naszego sklepu</h2>
          <p className="mt-2 text-sm text-slate-500">Kliknij produkt, a kalkulator podstawi jego proporcję.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {examples.map((ex) => (
              <li key={ex.slug}>
                <button type="button" onClick={() => { setRatio(ex.ratio); setPicked(ex.slug); document.getElementById("kalkulator")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                  className={`flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 transition hover:ring-leaf ${picked === ex.slug ? "ring-2 ring-leaf" : "ring-brand-100"}`}>
                  <ProductImage src={ex.image} alt={ex.name} className="h-16 w-16 shrink-0 rounded-xl" sizes="64px" />
                  <span className="min-w-0">
                    <span className="block font-bold text-navy">{ex.name}</span>
                    <span className="mt-0.5 block text-sm text-slate-500">{ex.note}</span>
                    <span className="mt-1 block text-sm font-bold text-accent">1:{ex.ratio} · {ex.price}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="lg:sticky lg:top-28">
        <div className="rounded-3xl bg-kc-gradient-deep p-6 text-white">
          <p className="text-xs font-bold tracking-widest text-white/70 uppercase">1 : {mix.safe}</p>
          <div className="relative mx-auto mt-4 h-72 w-40">
            <span key={mix.safe} className="absolute top-0 left-1/2 h-3.5 w-3.5 -translate-x-1/2 animate-bounce rounded-full bg-sky-300" />
            <div className="absolute inset-x-4 top-8 bottom-3 overflow-hidden rounded-b-[2rem] border-x-[5px] border-b-[5px] border-white/70 bg-white/10">
              <div className="absolute inset-x-0 bottom-0 bg-sky-300/80 transition-all duration-700 ease-out" style={{ height: `${Math.max(12, waterPct)}%` }} />
              <div className="absolute inset-x-0 bottom-0 bg-leaf transition-all duration-700 ease-out" style={{ height: `${Math.max(4, 100 - waterPct)}%` }} />
            </div>
            <div className="absolute inset-x-2 top-6 h-3 rounded-full border-4 border-white/80" />
          </div>
          <p className="mt-2 text-center text-sm text-white/80">Zielone to preparat, niebieskie to woda.</p>
          <Link href={picked ? `/produkt/${picked}` : "/kategoria/chemia-do-myjni"} className="btn-kc mt-5 flex items-center justify-center rounded-xl py-3 text-sm font-bold text-white">
            {picked ? "Zobacz ten produkt" : "Chemia do myjni"}
          </Link>
        </div>
      </aside>
    </div>
  );
}
