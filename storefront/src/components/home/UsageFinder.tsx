"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AppWindow, Armchair, Bug, Car, CircleDot, Disc3, Droplets, Fan, Flower2, Gem, Haze, House, Lightbulb, Paintbrush, ShieldCheck,
  Sofa, Sparkles, SprayCan, Sun, Waves, Wind, Wrench, type LucideIcon,
} from "lucide-react";

// Szybki wybór na stronie głównej: „co czyścisz” albo „krok pielęgnacji” (kolejność jak przy pełnym detailingu).
// path = klucz liczników: „dział”, „dział/podkategoria” albo „dział/podkategoria/typ”
type Item = { label: string; icon: LucideIcon; path: string };

const what: Item[] = [
  { label: "Lakier", icon: Car, path: "polerowanie-i-ochrona" },
  { label: "Felgi", icon: Disc3, path: "mycie-auta/felgi-i-opony/felgi-i-opony-plyny-do-felg" },
  { label: "Opony", icon: CircleDot, path: "mycie-auta/felgi-i-opony/felgi-i-opony-dressingi-do-opon" },
  { label: "Szyby", icon: AppWindow, path: "mycie-auta/szyby-i-lusterka" },
  { label: "Reflektory", icon: Lightbulb, path: "mycie-auta/plastiki-guma-i-detale/plastiki-guma-i-detale-reflektory-i-lampy" },
  { label: "Plastiki zewnętrzne", icon: Paintbrush, path: "mycie-auta/plastiki-guma-i-detale/plastiki-guma-i-detale-plastiki-zewnetrzne" },
  { label: "Silnik", icon: Wrench, path: "mycie-auta/plastiki-guma-i-detale/plastiki-guma-i-detale-mycie-silnika" },
  { label: "Kokpit", icon: Armchair, path: "wnetrze-auta/kokpit-i-plastiki" },
  { label: "Tapicerka", icon: Sofa, path: "wnetrze-auta/tapicerka-i-dywaniki" },
  { label: "Skóra", icon: Gem, path: "wnetrze-auta/skora-i-alcantara" },
  { label: "Klimatyzacja", icon: Fan, path: "wnetrze-auta/klimatyzacja-i-nawiewy" },
  { label: "Dach cabrio", icon: Sun, path: "mycie-auta/plastiki-guma-i-detale/plastiki-guma-i-detale-dachy-cabrio" },
  { label: "Chrom i metal", icon: Sparkles, path: "mycie-auta/plastiki-guma-i-detale/plastiki-guma-i-detale-chrom-i-metal" },
  { label: "Dom i ogród", icon: House, path: "dom-i-ogrod" },
];

const steps: Item[] = [
  { label: "Owady i pre-wash", icon: Bug, path: "mycie-auta/pre-wash-i-dekontaminacja/pre-wash-i-dekontaminacja-usuwanie-owadow" },
  { label: "Piana aktywna", icon: Waves, path: "mycie-auta/szampony-i-piany/szampony-i-piany-piany-aktywne" },
  { label: "Szampon", icon: Droplets, path: "mycie-auta/szampony-i-piany/szampony-i-piany-szampony-samochodowe" },
  { label: "Dekontaminacja", icon: Haze, path: "mycie-auta/pre-wash-i-dekontaminacja" },
  { label: "Osuszanie", icon: Wind, path: "akcesoria-detailingowe/mikrofibry-i-reczniki/mikrofibry-i-reczniki-reczniki-do-osuszania" },
  { label: "Polerowanie", icon: Sparkles, path: "polerowanie-i-ochrona/pasty-polerskie" },
  { label: "Pady polerskie", icon: CircleDot, path: "polerowanie-i-ochrona/pady-polerskie" },
  { label: "Wosk", icon: Gem, path: "polerowanie-i-ochrona/woski" },
  { label: "Powłoka i QD", icon: ShieldCheck, path: "polerowanie-i-ochrona/powloki-i-quick-detailery" },
  { label: "Wnętrze", icon: Armchair, path: "wnetrze-auta" },
  { label: "Zapach", icon: Flower2, path: "wnetrze-auta/zapachy-samochodowe" },
  { label: "Akcesoria", icon: SprayCan, path: "akcesoria-detailingowe" },
];

const href = (path: string) => {
  const [cat, sub, typ] = path.split("/");
  return `/kategoria/${cat}${sub ? `?sub=${sub}` : ""}${typ ? `&typ=${typ}` : ""}`;
};

export function UsageFinder({ counts }: { counts: Record<string, number> }) {
  const [tab, setTab] = useState<"what" | "steps">("what");
  const items = (tab === "what" ? what : steps).filter((i) => counts[i.path]);
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent uppercase">Szybki wybór</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{tab === "what" ? "Co dziś czyścisz?" : "Detailing krok po kroku"}</h2>
        </div>
        <div role="tablist" className="flex rounded-2xl bg-white p-1 ring-1 ring-brand-100">
          {([["what", "Co czyścisz?"], ["steps", "Krok po kroku"]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition sm:px-5 ${tab === k ? "bg-navy text-white" : "text-slate-600 hover:text-navy"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
        {items.map(({ label, icon: Icon, path }, i) => (
          <Link key={label} href={href(path)}
            className="group relative flex flex-col items-center gap-2 rounded-xl bg-white px-2 py-4 text-center ring-1 ring-inset ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-accent">
            {tab === "steps" && <span className="font-display absolute top-2 left-3 text-lg font-extrabold text-brand-200 group-hover:text-leaf">{String(i + 1).padStart(2, "0")}</span>}
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-navy transition group-hover:bg-accent group-hover:text-white sm:h-14 sm:w-14">
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.6} />
            </span>
            <span className="text-[13px] leading-tight font-bold text-ink">{label}</span>
            <span className="text-[11px] text-slate-400">{counts[path]} prod.</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
