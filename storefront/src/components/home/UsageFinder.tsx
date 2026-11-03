"use client";

import Link from "next/link";
import { useState } from "react";
import { CatIcon } from "@/components/CatIcon";
import type { IconName } from "@/lib/data";

export type UsageChip = { label: string; href: string; icon: IconName; count?: number };

// Szybki wybór. Pusta lista „kroków” = jeden rząd, bez zakładek. Pozycje przychodzą z drzewa kategorii albo z panelu.
export function UsageFinder({ tasks, steps, kicker, title, stepsTitle }: {
  tasks: UsageChip[];
  steps: UsageChip[];
  kicker?: string;
  title?: string;
  stepsTitle?: string;
}) {
  const [tab, setTab] = useState<"tasks" | "steps">("tasks");
  const items = tab === "steps" && steps.length ? steps : tasks;
  const heading = tab === "steps" && steps.length ? (stepsTitle || "Krok po kroku") : (title || "Co dziś czyścisz?");
  if (!tasks.length && !steps.length) return null;
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent uppercase">{kicker || "Szybki wybór"}</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{heading}</h2>
        </div>
        {steps.length > 0 && tasks.length > 0 && (
          <div role="tablist" className="flex rounded-2xl bg-white p-1 ring-1 ring-brand-100">
            {([["tasks", title || "Co czyścisz?"], ["steps", stepsTitle || "Krok po kroku"]] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition sm:px-5 ${tab === k ? "bg-navy text-white" : "text-slate-600 hover:text-navy"}`}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
        {items.map(({ label, icon, href, count }, i) => (
          <Link key={`${href}-${label}`} href={href}
            className="group relative flex flex-col items-center gap-2 rounded-xl bg-white px-2 py-4 text-center ring-1 ring-inset ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-accent">
            {tab === "steps" && steps.length > 0 && <span className="font-display absolute top-2 left-3 text-lg font-extrabold text-brand-200 group-hover:text-leaf">{String(i + 1).padStart(2, "0")}</span>}
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-navy transition group-hover:bg-accent group-hover:text-white sm:h-14 sm:w-14">
              <CatIcon name={icon} className="h-6 w-6 sm:h-7 sm:w-7" />
            </span>
            <span className="text-[13px] leading-tight font-bold text-ink">{label}</span>
            {count != null && count > 0 && <span className="text-[11px] text-slate-400">{count} prod.</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
