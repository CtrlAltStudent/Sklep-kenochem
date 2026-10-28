"use client";

// Edytor układu stron (Treści i wygląd → Układ strony): przeciągnij sekcje, żeby zmienić kolejność, oko – pokaż/ukryj,
// „Edytuj treść” – przejście do miejsca, gdzie zmienia się zawartość sekcji. Po prawej podgląd strony na żywo.
// Zapis: /api/site-layout (src/integrations/adminTools.ts), definicje sekcji: src/lib/layoutSections.ts.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, GripVertical, LayoutTemplate, Lock, Menu, Package, Pencil, RotateCcw, Save, ShoppingBag, Tags } from "lucide-react";
import { defaultLayout, mergeLayout, PAGE_LABEL, SECTIONS, type LayoutItem, type PageKind } from "@/lib/layoutSections";

type Tab = "home" | "product" | "category" | "menu";
type Layouts = Record<PageKind, LayoutItem[]>;
const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "home", label: "Strona główna", icon: LayoutTemplate },
  { id: "product", label: "Karta produktu", icon: Package },
  { id: "category", label: "Widok kategorii", icon: Tags },
  { id: "menu", label: "Menu i stopka", icon: Menu },
];

function SectionList({ kind, items, onChange, active, onActive }: {
  kind: PageKind; items: LayoutItem[]; onChange: (items: LayoutItem[]) => void; active: string; onActive: (id: string) => void;
}) {
  const drag = useRef<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const defs = SECTIONS[kind];
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    if (defs.find((d) => d.id === items[to].id)?.fixed || defs.find((d) => d.id === items[from].id)?.fixed) return;
    const next = [...items];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };
  return (
    <ol className="kc-lay__list">
      {items.map((it, i) => {
        const d = defs.find((x) => x.id === it.id)!;
        return (
          <li key={it.id}
            className={`kc-lay__row ${it.visible ? "" : "is-hidden"} ${active === it.id ? "is-active" : ""} ${over === i ? "is-over" : ""} ${d.fixed ? "is-fixed" : ""}`}
            draggable={!d.fixed}
            onDragStart={(e) => { drag.current = i; e.dataTransfer.effectAllowed = "move"; }}
            onDragOver={(e) => { e.preventDefault(); setOver(i); }}
            onDragLeave={() => setOver((o) => (o === i ? null : o))}
            onDrop={(e) => { e.preventDefault(); if (drag.current != null) move(drag.current, i); drag.current = null; setOver(null); }}
            onDragEnd={() => { drag.current = null; setOver(null); }}
            onClick={() => onActive(it.id)}>
            <span className="kc-lay__grip" aria-hidden>{d.fixed ? <Lock size={14} /> : <GripVertical size={16} />}</span>
            <span className="kc-lay__no">{i + 1}</span>
            <span className="kc-lay__text">
              <b>{d.label}</b>
              <small>{d.desc}</small>
            </span>
            <span className="kc-lay__tools" onClick={(e) => e.stopPropagation()}>
              {d.edit && <Link href={d.edit.href} className="kc-lay__edit" title={`Zmień treść: ${d.edit.label}`}><Pencil size={13} /> Edytuj treść</Link>}
              <button type="button" title="Wyżej" disabled={d.fixed || i === 0 || defs.find((x) => x.id === items[i - 1]?.id)?.fixed} onClick={() => move(i, i - 1)}><ArrowUp size={15} /></button>
              <button type="button" title="Niżej" disabled={d.fixed || i === items.length - 1} onClick={() => move(i, i + 1)}><ArrowDown size={15} /></button>
              <button type="button" className={`kc-lay__eye ${it.visible ? "is-on" : ""}`} disabled={d.locked}
                title={d.locked ? "Ta sekcja jest zawsze widoczna" : it.visible ? "Ukryj w sklepie" : "Pokaż w sklepie"}
                onClick={() => onChange(items.map((x) => (x.id === it.id ? { ...x, visible: !x.visible } : x)))}>
                {d.locked ? <Lock size={14} /> : it.visible ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Szkic strony: bloki w kolejności, wysokość wg rodzaju sekcji; ukryte nie są pokazywane
function Preview({ kind, items, active, onActive, tabs }: { kind: PageKind; items: LayoutItem[]; active: string; onActive: (id: string) => void; tabs?: LayoutItem[] }) {
  const defs = SECTIONS[kind];
  return (
    <div className="kc-lay__preview">
      <div className="kc-lay__browser"><span /><span /><span /><em>{PAGE_LABEL[kind]}</em></div>
      <div className="kc-lay__page">
        <div className="kc-lay__header">Nagłówek i menu</div>
        {items.filter((i) => i.visible).map((it) => {
          const d = defs.find((x) => x.id === it.id)!;
          return (
            <button type="button" key={it.id} onClick={() => onActive(it.id)} className={`kc-lay__block is-${d.size ?? "m"} is-${it.id} ${active === it.id ? "is-active" : ""}`}>
              {d.label}
              {it.id === "tabs" && tabs && <span className="kc-lay__tabs">{tabs.filter((t) => t.visible).map((t) => <i key={t.id}>{SECTIONS.productTabs.find((x) => x.id === t.id)?.label}</i>)}</span>}
            </button>
          );
        })}
        <div className="kc-lay__header is-footer">Stopka</div>
      </div>
    </div>
  );
}

export function LayoutEditor({ sampleProduct, sampleCategory }: { sampleProduct?: string; sampleCategory?: string }) {
  const [tab, setTab] = useState<Tab>("home");
  const [saved, setSaved] = useState<Layouts | null>(null);
  const [draft, setDraft] = useState<Layouts | null>(null);
  const [active, setActive] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/site-layout", { credentials: "include" }).then((r) => r.json()).then((j) => {
      if (j.ok) { setSaved(j.layout); setDraft(j.layout); } else setMsg({ ok: false, message: j.message ?? "Brak uprawnień" });
    }).catch(() => setMsg({ ok: false, message: "Brak połączenia" }));
  }, []);
  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (!draft) return msg ? <p className="kc-act__msg is-bad">{msg.message}</p> : <p className="kc-muted">Wczytuję układ…</p>;
  const set = (kind: PageKind, items: LayoutItem[]) => { setDraft({ ...draft, [kind]: mergeLayout(kind, items) }); setMsg(null); };
  const save = async () => {
    setBusy(true);
    const r = await fetch("/api/site-layout", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ layout: draft }) })
      .then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    setBusy(false);
    setMsg(r);
    if (r.ok) setSaved(draft);
  };
  const reset = () => {
    const kinds: PageKind[] = tab === "product" ? ["product", "productTabs"] : tab === "home" || tab === "category" ? [tab] : [];
    if (!kinds.length || !confirm(`Przywrócić domyślny układ: ${PAGE_LABEL[kinds[0]]}?`)) return;
    setDraft({ ...draft, ...Object.fromEntries(kinds.map((k) => [k, defaultLayout(k)])) });
  };
  const preview = tab === "home" ? "/" : tab === "product" ? (sampleProduct ? `/produkt/${sampleProduct}` : "/") : tab === "category" ? (sampleCategory ? `/kategoria/${sampleCategory}` : "/") : "/";

  return (
    <div className="kc-lay">
      <nav className="kc-lay__tabs-nav" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "is-active" : ""} onClick={() => { setTab(id); setActive(""); }}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>

      {tab === "menu" ? (
        <div className="kc-card kc-lay__menu">
          <Menu size={22} />
          <div>
            <b>Menu w nagłówku, pasek informacyjny i stopka</b>
            <p>Linki w menu, kolumny stopki i krótki pasek z komunikatem nad nagłówkiem (np. „Darmowa dostawa od 249 zł”). Kategorie w menu tworzą się same z drzewa kategorii.</p>
            <div className="kc-lay__menu-actions">
              <Link href="/admin/globals/navigation" className="kc-msg__send"><Pencil size={14} /> Edytuj menu i stopkę</Link>
              <Link href="/admin/collections/categories" className="kc-act__btn">Kategorie w menu</Link>
              <Link href="/admin/collections/pages" className="kc-act__btn">Podstrony w stopce</Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="kc-lay__grid">
          <div className="kc-lay__col">
            <section className="kc-card">
              <header className="kc-card__head">
                <h2>{tab === "product" ? "Bloki karty produktu" : `Sekcje: ${PAGE_LABEL[tab]}`}</h2>
                <span className="kc-muted">przeciągnij albo użyj strzałek</span>
              </header>
              <SectionList kind={tab} items={draft[tab]} onChange={(it) => set(tab, it)} active={active} onActive={setActive} />
            </section>
            {tab === "product" && (
              <section className="kc-card">
                <header className="kc-card__head"><h2>Kolejność zakładek produktu</h2><span className="kc-muted">pierwsza otwiera się sama</span></header>
                <SectionList kind="productTabs" items={draft.productTabs} onChange={(it) => set("productTabs", it)} active={active} onActive={setActive} />
              </section>
            )}
          </div>
          <Preview kind={tab} items={draft[tab]} active={active} onActive={setActive} tabs={tab === "product" ? draft.productTabs : undefined} />
        </div>
      )}

      <div className="kc-set__bar">
        <button type="button" className="kc-msg__send" disabled={!dirty || busy} onClick={save}><Save size={15} /> {busy ? "Zapisuję…" : dirty ? "Zapisz układ" : "Zapisano"}</button>
        {tab !== "menu" && <button type="button" className="kc-act__btn" onClick={reset}><RotateCcw size={15} /> Przywróć domyślny</button>}
        <a className="kc-act__btn" href={preview} target="_blank" rel="noreferrer"><ShoppingBag size={15} /> Zobacz w sklepie <ExternalLink size={12} /></a>
        {dirty && <span className="kc-muted">Masz niezapisane zmiany</span>}
        {msg && <span className={`kc-act__msg ${msg.ok ? "is-ok" : "is-bad"}`}>{msg.message}</span>}
      </div>
    </div>
  );
}
