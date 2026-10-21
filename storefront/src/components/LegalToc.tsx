"use client";

import { useEffect, useState } from "react";
import { List, Printer } from "lucide-react";

// Spis treści dokumentu z podświetleniem bieżącej sekcji
export function LegalToc({ headings, print = true }: { headings: { id: string; text: string; level: 2 | 3 }[]; print?: boolean }) {
  const [active, setActive] = useState(headings[0]?.id);

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-160px 0px -65% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [headings]);

  return (
    <nav aria-label="Spis treści" className="rounded-2xl border border-brand-100 bg-white p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-navy"><List className="h-4 w-4 text-accent" /> Spis treści</p>
      <ol className="no-scrollbar max-h-[55vh] space-y-0.5 overflow-y-auto text-sm">
        {headings.filter((h) => h.level === 2).map((h) => (
          <li key={h.id}>
            <a href={`#${h.id}`}
              className={`block rounded-lg border-l-2 px-3 py-1.5 leading-snug transition ${active === h.id ? "border-accent bg-brand-50 font-semibold text-brand-900" : "border-transparent text-slate-600 hover:bg-brand-50 hover:text-brand-900"}`}>
              {h.text}
            </a>
          </li>
        ))}
      </ol>
      {print && (
        <button onClick={() => window.print()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 py-2.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-50">
          <Printer className="h-4 w-4" /> Drukuj / zapisz PDF
        </button>
      )}
    </nav>
  );
}
