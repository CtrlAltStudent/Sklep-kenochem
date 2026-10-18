"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AppWindow, Armchair, Bath, Briefcase, Building, Car, ChefHat, Disc3, Droplets, Flame, Grid2x2, Hand, Hotel, House, Sofa, Sparkles,
  SprayCan, Sun, Tractor, Trees, Truck, Wrench, type LucideIcon,
} from "lucide-react";

// Wyszukiwarka „według zastosowania” – odpowiednik wyszukiwarki według uprawy z agrosimex.pl.
// path = klucz liczników: „dział”, „dział/podkategoria” albo „dział/podkategoria/typ”
type Item = { label: string; icon: LucideIcon; path: string };

const what: Item[] = [
  { label: "Samochód", icon: Car, path: "chemia-samochodowa/mycie-samochodu" },
  { label: "Felgi i opony", icon: Disc3, path: "chemia-samochodowa/felgi-i-opony" },
  { label: "Wnętrze auta", icon: Armchair, path: "chemia-samochodowa/wnetrze-samochodu" },
  { label: "Lakier", icon: Sparkles, path: "chemia-samochodowa/pielegnacja-lakieru" },
  { label: "Szyby", icon: AppWindow, path: "chemia-samochodowa/szyby-i-szklo" },
  { label: "Ciężarówki", icon: Truck, path: "chemia-specjalistyczna/transport" },
  { label: "Kostka i taras", icon: Trees, path: "dom-i-ogrod/czyszczenie-zewnetrzne/czyszczenie-zewnetrzne-kostka-brukowa-i-kamien" },
  { label: "Panele PV", icon: Sun, path: "dom-i-ogrod/czyszczenie-zewnetrzne/czyszczenie-zewnetrzne-mycie-paneli-fotowoltaicznych" },
  { label: "Podłogi", icon: Grid2x2, path: "chemia-profesjonalna/chemia-obiektowa/chemia-obiektowa-podlogi-i-posadzki" },
  { label: "Łazienka i WC", icon: Bath, path: "chemia-profesjonalna/chemia-obiektowa/chemia-obiektowa-lazienki-i-sanitariaty" },
  { label: "Kuchnia", icon: ChefHat, path: "chemia-profesjonalna/kuchnia-i-gastronomia" },
  { label: "Dywany", icon: Sofa, path: "chemia-profesjonalna/dywany-i-tapicerka" },
  { label: "Ręce", icon: Hand, path: "chemia-profesjonalna/higiena-rak" },
  { label: "Części i silnik", icon: Wrench, path: "chemia-specjalistyczna/zmywacze-i-odtluszczacze" },
];

const who: Item[] = [
  { label: "Myjnia samoobsługowa", icon: Droplets, path: "myjnie-i-urzadzenia" },
  { label: "Detailing", icon: Sparkles, path: "chemia-samochodowa/pielegnacja-lakieru" },
  { label: "Firma sprzątająca", icon: SprayCan, path: "chemia-profesjonalna/chemia-obiektowa" },
  { label: "Gastronomia i hotele", icon: Hotel, path: "chemia-profesjonalna/kuchnia-i-gastronomia" },
  { label: "Warsztat", icon: Wrench, path: "chemia-specjalistyczna/chemia-warsztatowa" },
  { label: "Transport", icon: Truck, path: "chemia-specjalistyczna/transport" },
  { label: "Rolnictwo", icon: Tractor, path: "chemia-specjalistyczna/rolnictwo" },
  { label: "Biura i obiekty", icon: Building, path: "chemia-profesjonalna" },
  { label: "Sklepy i salony", icon: Flame, path: "zapachy/aromamarketing" },
  { label: "Dom i ogród", icon: House, path: "dom-i-ogrod" },
  { label: "Zakupy dla firmy", icon: Briefcase, path: "b2b" },
];

const href = (path: string) => {
  if (path === "b2b") return "/b2b";
  const [cat, sub, typ] = path.split("/");
  return `/kategoria/${cat}${sub ? `?sub=${sub}` : ""}${typ ? `&typ=${typ}` : ""}`;
};

export function UsageFinder({ counts }: { counts: Record<string, number> }) {
  const [tab, setTab] = useState<"what" | "who">("what");
  const items = (tab === "what" ? what : who).filter((i) => i.path === "b2b" || counts[i.path]);
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent uppercase">Szybki wybór</p>
          <h2 className="text-2xl font-black tracking-tight text-navy sm:text-4xl">Znajdź według zastosowania</h2>
        </div>
        <div role="tablist" className="flex rounded-2xl bg-white p-1 ring-1 ring-brand-100">
          {([["what", "Co myjesz?"], ["who", "Jaka branża?"]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition sm:px-5 ${tab === k ? "bg-kc-gradient text-white shadow-md shadow-leaf/25" : "text-slate-600 hover:text-brand-800"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
        {items.map(({ label, icon: Icon, path }) => (
          <Link key={label} href={href(path)}
            className="group flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-4 text-center ring-1 ring-inset ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-leaf/15 hover:ring-leaf">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-leaf-50 text-brand-700 transition group-hover:bg-leaf group-hover:text-white sm:h-14 sm:w-14">
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.6} />
            </span>
            <span className="text-[13px] leading-tight font-bold text-ink">{label}</span>
            {path !== "b2b" && <span className="text-[11px] text-slate-400">{counts[path]} prod.</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
