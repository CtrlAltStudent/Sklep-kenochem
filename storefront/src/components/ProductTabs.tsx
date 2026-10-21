"use client";

import { useEffect, useState } from "react";

// Zakładki karty produktu – treść podmienia się w miejscu (bez przewijania strony).
// Wszystkie panele są w HTML (ukryte atrybutem hidden), więc Google widzi pełny opis.
export function ProductTabs({ tabs }: { tabs: { id: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  // Link #opinie (np. z gwiazdek pod nazwą) otwiera właściwą zakładkę
  useEffect(() => {
    const sync = () => {
      const id = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === id)) {
        setActive(id);
        document.getElementById("zakladki")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [tabs]);

  return (
    <div id="zakladki" className="scroll-mt-48 overflow-hidden rounded-xl bg-white ring-1 ring-brand-100">
      <div role="tablist" aria-label="Informacje o produkcie" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-brand-100 bg-slate-50 p-1.5">
        {tabs.map((t) => (
          <button key={t.id} role="tab" type="button" id={`tab-${t.id}`} aria-selected={active === t.id} aria-controls={`panel-${t.id}`}
            onClick={() => { setActive(t.id); history.replaceState(null, "", `#${t.id}`); }}
            className={`flex-1 shrink-0 rounded-lg px-5 py-3 text-sm font-bold whitespace-nowrap transition ${active === t.id ? "bg-navy text-white" : "text-slate-600 hover:bg-white hover:text-navy"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <section key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== t.id} className="p-5 sm:p-8">
          {t.content}
        </section>
      ))}
    </div>
  );
}
