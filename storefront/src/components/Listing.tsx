"use client";

import { toItem, track } from "@/lib/track";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, ArrowRight, BookOpen, Check, ChevronDown, LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { categories, findType, minPrice, type Category, type ProductCardData } from "@/lib/data";
import { productForm, sizeBucket, sizeBuckets } from "@/lib/facets";
import { CatIcon } from "./CatIcon";
import { ProductCard } from "./ProductCard";
import { ProductRow } from "./ProductRow";

type Sort = "recommended" | "price-asc" | "price-desc" | "name" | "new";
type Params = Record<string, string | string[] | undefined>;
const PAGE = 24;
const sortLabels: Record<Sort, string> = { recommended: "Polecane", "price-asc": "Cena: od najniższej", "price-desc": "Cena: od najwyższej", name: "Nazwa: A–Z", new: "Najnowsze" };

const by: Record<Sort, (a: ProductCardData, b: ProductCardData) => number> = {
  recommended: (a, b) => Number(b.stock > 0) - Number(a.stock > 0) || Number(!!b.image) - Number(!!a.image),
  "price-asc": (a, b) => minPrice(a) - minPrice(b),
  "price-desc": (a, b) => minPrice(b) - minPrice(a),
  name: (a, b) => a.name.localeCompare(b.name, "pl"),
  new: (a, b) => Number(!!b.badges?.includes("nowosc")) - Number(!!a.badges?.includes("nowosc")),
};
const pricePresets: [string, number, number][] = [["do 50 zł", 0, 50], ["50–150 zł", 50, 150], ["150–500 zł", 150, 500], ["od 500 zł", 500, Infinity]];

const list = (v: string | string[] | undefined) => (typeof v === "string" && v ? v.split(",") : []);
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

// Zwijana sekcja filtra w lewej kolumnie
function Section({ title, count, defaultOpen = true, children }: { title: string; count?: number; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-brand-100 py-4 last:border-b-0">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-2 text-left" aria-expanded={open}>
        <span className="font-extrabold text-navy">{title}</span>
        <span className="flex items-center gap-2">
          {!!count && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-700 px-1.5 text-[11px] font-bold text-white">{count}</span>}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && <div className="mt-3 animate-fade-in">{children}</div>}
    </section>
  );
}

function CheckRow({ checked, onChange, label, count, disabled }: { checked: boolean; onChange: () => void; label: React.ReactNode; count?: number; disabled?: boolean }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-lg px-1.5 py-1.5 text-sm transition hover:bg-brand-50 ${disabled ? "pointer-events-none opacity-40" : ""}`}>
      <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border-2 transition ${checked ? "border-brand-700 bg-brand-700 text-white" : "border-slate-300 bg-white"}`}>
        {checked && <Check className="h-3 w-3" strokeWidth={3.5} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className={`flex-1 leading-tight ${checked ? "font-semibold text-ink" : "text-slate-700"}`}>{label}</span>
      {count !== undefined && <span className="text-xs text-slate-400">({count})</span>}
    </label>
  );
}

// Suwak ceny z dwoma uchwytami
function PriceRange({ min, max, value, onChange }: { min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void }) {
  const lo = Math.max(min, value[0]);
  const hi = Number.isFinite(value[1]) ? Math.min(max, value[1]) : max;
  const pct = (v: number) => ((v - min) / Math.max(1, max - min)) * 100;
  const thumb = "pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-700 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-700";
  return (
    <div>
      <div className="relative h-5">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-brand-100" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-700" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input type="range" min={min} max={max} value={lo} aria-label="Cena minimalna" className={thumb}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi - 1), value[1]])} />
        <input type="range" min={min} max={max} value={hi} aria-label="Cena maksymalna" className={thumb}
          onChange={(e) => { const v = Math.max(Number(e.target.value), lo + 1); onChange([value[0], v >= max ? Infinity : v]); }} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input inputMode="numeric" value={value[0] || ""} placeholder={String(min)} aria-label="Cena od"
          onChange={(e) => onChange([Number(e.target.value.replace(/\D/g, "")) || 0, value[1]])}
          className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm outline-none focus:border-accent" />
        <span className="text-slate-400">–</span>
        <input inputMode="numeric" value={Number.isFinite(value[1]) ? value[1] : ""} placeholder={String(max)} aria-label="Cena do"
          onChange={(e) => onChange([value[0], Number(e.target.value.replace(/\D/g, "")) || Infinity])}
          className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm outline-none focus:border-accent" />
        <span className="text-sm text-slate-500">zł</span>
      </div>
    </div>
  );
}

// typ (3. poziom) → podkategoria
const typeSub = new Map(categories.flatMap((c) => c.children.flatMap((s) => s.types.map((t) => [t.slug, s.slug] as const))));

export function Listing({ products, category, counts, params = {} }: {
  products: ProductCardData[]; category?: Category; counts?: Record<string, number>; params?: Params;
}) {
  // Stan filtrów – startowo z adresu strony (?marka=…&cena=…)
  const [subs, setSubs] = useState<string[]>(list(params.sub));
  const [types, setTypes] = useState<string[]>(list(params.typ));
  const [cats, setCats] = useState<string[]>(list(params.kat));
  const [brands, setBrands] = useState<string[]>(list(params.marka));
  const [sizes, setSizes] = useState<string[]>(list(params.opak));
  const [forms, setForms] = useState<string[]>(list(params.rodzaj));
  const [price, setPrice] = useState<[number, number]>(() => {
    const [a, b] = one(params.cena).split("-").map(Number);
    return [a || 0, b || Infinity];
  });
  const [onlyAvailable, setOnlyAvailable] = useState(one(params.dostepne) === "1");
  const [onlyPromo, setOnlyPromo] = useState(one(params.promocje) === "1");
  const [onlyNew, setOnlyNew] = useState(one(params.nowosci) === "1");
  const [sort, setSort] = useState<Sort>((one(params.sort) as Sort) in sortLabels ? (one(params.sort) as Sort) : "recommended");
  const [view, setView] = useState<"grid" | "list">(one(params.widok) === "lista" ? "list" : "grid");
  const [shown, setShown] = useState(PAGE);
  const [brandQuery, setBrandQuery] = useState("");
  const [allBrandsOpen, setAllBrandsOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [openTree, setOpenTree] = useState<string | null>(category?.slug ?? null);

  const meta = useMemo(() => new Map(products.map((p) => [p.slug, {
    form: productForm(p.name, p.variants[0].label),
    sizes: [...new Set(p.variants.map((v) => sizeBucket(v.label)))],
    price: minPrice(p),
    promo: p.variants.some((v) => v.oldPrice),
    isNew: !!p.badges?.includes("nowosc"),
  }])), [products]);
  const bounds = useMemo(() => {
    const ps = products.map((p) => meta.get(p.slug)!.price);
    return [Math.floor(Math.min(...ps, 0)), Math.ceil(Math.max(...ps, 1))] as [number, number];
  }, [products, meta]);

  // Filtry działają dwuetapowo (jak w dużych sklepach): zaznaczenia to „szkic”,
  // lista zmienia się dopiero po kliknięciu „Zastosuj”. Liczniki przy opcjach liczone są dla szkicu.
  type F = { subs: string[]; types: string[]; cats: string[]; brands: string[]; sizes: string[]; forms: string[]; price: [number, number]; onlyAvailable: boolean; onlyPromo: boolean; onlyNew: boolean };
  const draft: F = { subs, types, cats, brands, sizes, forms, price, onlyAvailable, onlyPromo, onlyNew };
  const [applied, setApplied] = useState<F>(draft);
  const key = (f: F) => JSON.stringify({ ...f, price: [f.price[0], Number.isFinite(f.price[1]) ? f.price[1] : null] });
  const dirty = key(draft) !== key(applied);
  const loadDraft = (f: F) => { setSubs(f.subs); setTypes(f.types); setCats(f.cats); setBrands(f.brands); setSizes(f.sizes); setForms(f.forms); setPrice(f.price); setOnlyAvailable(f.onlyAvailable); setOnlyPromo(f.onlyPromo); setOnlyNew(f.onlyNew); };
  const apply = () => { setApplied(draft); setShown(PAGE); };
  const cancel = () => loadDraft(applied);
  // Zmiana od razu w obu stanach (np. usunięcie znacznika nad listą)
  const applyNow = (patch: Partial<F>) => { setApplied({ ...applied, ...patch }); loadDraft({ ...draft, ...patch }); setShown(PAGE); };

  // Zapis zastosowanych filtrów w adresie strony (bez przeładowania) – link można skopiować i wysłać
  useEffect(() => {
    const a = applied;
    const q = new URLSearchParams();
    const keep = new URLSearchParams(window.location.search).get("q");
    if (keep) q.set("q", keep);
    if (a.subs.length) q.set("sub", a.subs.join(","));
    if (a.types.length) q.set("typ", a.types.join(","));
    if (a.cats.length) q.set("kat", a.cats.join(","));
    if (a.brands.length) q.set("marka", a.brands.join(","));
    if (a.sizes.length) q.set("opak", a.sizes.join(","));
    if (a.forms.length) q.set("rodzaj", a.forms.join(","));
    if (a.price[0] > 0 || Number.isFinite(a.price[1])) q.set("cena", `${a.price[0]}-${Number.isFinite(a.price[1]) ? a.price[1] : ""}`);
    if (a.onlyAvailable) q.set("dostepne", "1");
    if (a.onlyPromo) q.set("promocje", "1");
    if (a.onlyNew) q.set("nowosci", "1");
    if (sort !== "recommended") q.set("sort", sort);
    if (view === "list") q.set("widok", "lista");
    const url = `${window.location.pathname}${q.size ? `?${q}` : ""}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", url);
  }, [applied, sort, view]);

  const empty: F = { subs: [], types: [], cats: [], brands: [], sizes: [], forms: [], price: [0, Infinity], onlyAvailable: false, onlyPromo: false, onlyNew: false };
  const reset = () => { loadDraft(empty); setApplied(empty); setShown(PAGE); };
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  // Kategoria 3. poziomu: w podkategorii z zaznaczonymi typami pokazujemy tylko te typy
  const typeOk = (p: ProductCardData, f: F) => {
    if (!f.types.length) return true;
    const sel = f.types.filter((t) => typeSub.get(t) === p.subcategory);
    return !sel.length || (!!p.type && sel.includes(p.type));
  };
  type Skip = "sub" | "type" | "cat" | "brand" | "size" | "form" | "price";
  const match = (p: ProductCardData, f: F, skip?: Skip) => {
    const m = meta.get(p.slug)!;
    return (skip === "sub" || !f.subs.length || f.subs.includes(p.subcategory)) &&
      (skip === "type" || skip === "sub" || typeOk(p, f)) &&
      (skip === "cat" || !f.cats.length || f.cats.includes(p.category)) &&
      (skip === "brand" || !f.brands.length || f.brands.includes(p.brand)) &&
      (skip === "size" || !f.sizes.length || m.sizes.some((s) => f.sizes.includes(s))) &&
      (skip === "form" || !f.forms.length || f.forms.includes(m.form)) &&
      (skip === "price" || (m.price >= f.price[0] && m.price <= f.price[1])) &&
      (!f.onlyAvailable || p.stock > 0) && (!f.onlyPromo || m.promo) && (!f.onlyNew || m.isNew);
  };
  const facet = (skip: Skip, keyFn: (p: ProductCardData) => string[]) => {
    const out = new Map<string, number>();
    for (const p of products) if (match(p, draft, skip)) for (const k of keyFn(p)) if (k) out.set(k, (out.get(k) ?? 0) + 1);
    return out;
  };

  const subCounts = facet("sub", (p) => [p.subcategory]);
  const typeCounts = facet("type", (p) => [p.type ?? ""]);
  const catCounts = facet("cat", (p) => [p.category]);
  const brandCounts = facet("brand", (p) => [p.brand]);
  const sizeCounts = facet("size", (p) => meta.get(p.slug)!.sizes);
  const formCounts = facet("form", (p) => [meta.get(p.slug)!.form]);
  const draftCount = dirty ? products.filter((p) => match(p, draft)).length : 0;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filtered = useMemo(() => products.filter((p) => match(p, applied)).sort(by[sort]), [products, applied, sort, meta]);
  // Analityka: lista produktów widoczna po filtrach (pierwsze 20) – ponownie tylko po zmianie listy
  const listKey = filtered.slice(0, 20).map((p) => p.slug).join(",");
  const lastList = useRef("");
  useEffect(() => {
    if (!listKey || lastList.current === listKey) return;
    lastList.current = listKey;
    track("view_item_list", { item_list_name: category?.name ?? "Wyniki wyszukiwania", items: filtered.slice(0, 20).map((p, i) => toItem(p, 1, undefined, i)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listKey]);

  const allBrands = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) if (p.brand) m.set(p.brand, (m.get(p.brand) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([b]) => b);
  }, [products]);
  const allForms = useMemo(() => [...new Set([...meta.values()].map((m) => m.form))].sort((a, b) => a.localeCompare(b, "pl")), [meta]);
  const brandList = allBrands.filter((b) => b.toLowerCase().includes(brandQuery.toLowerCase()));
  const visibleBrands = allBrandsOpen || brandQuery ? brandList : brandList.slice(0, 8);

  const priceActive = price[0] > 0 || Number.isFinite(price[1]);
  const offerCount = [onlyAvailable, onlyPromo, onlyNew].filter(Boolean).length;
  const countOf = (f: F) => f.subs.length + f.types.length + f.cats.length + f.brands.length + f.sizes.length + f.forms.length + (f.price[0] > 0 || Number.isFinite(f.price[1]) ? 1 : 0) + [f.onlyAvailable, f.onlyPromo, f.onlyNew].filter(Boolean).length;
  const activeCount = countOf(applied);
  const without = (arr: string[], v: string) => arr.filter((x) => x !== v);
  const ap = applied;

  const chips: { label: string; clear: () => void }[] = [
    ...ap.subs.map((s) => ({ label: category?.children.find((c) => c.slug === s)?.name ?? s, clear: () => applyNow({ subs: without(ap.subs, s), types: ap.types.filter((t) => typeSub.get(t) !== s) }) })),
    ...ap.types.map((t) => ({ label: findType(t)?.type.name ?? t, clear: () => applyNow({ types: without(ap.types, t) }) })),
    ...ap.cats.map((s) => ({ label: categories.find((c) => c.slug === s)?.name ?? s, clear: () => applyNow({ cats: without(ap.cats, s) }) })),
    ...ap.brands.map((b) => ({ label: b, clear: () => applyNow({ brands: without(ap.brands, b) }) })),
    ...ap.sizes.map((b) => ({ label: b, clear: () => applyNow({ sizes: without(ap.sizes, b) }) })),
    ...ap.forms.map((b) => ({ label: b, clear: () => applyNow({ forms: without(ap.forms, b) }) })),
    ...(ap.price[0] > 0 || Number.isFinite(ap.price[1]) ? [{ label: `${ap.price[0]}–${Number.isFinite(ap.price[1]) ? ap.price[1] : "∞"} zł`, clear: () => applyNow({ price: [0, Infinity] }) }] : []),
    ...(ap.onlyAvailable ? [{ label: "Dostępne od ręki", clear: () => applyNow({ onlyAvailable: false }) }] : []),
    ...(ap.onlyPromo ? [{ label: "Promocje", clear: () => applyNow({ onlyPromo: false }) }] : []),
    ...(ap.onlyNew ? [{ label: "Nowości", clear: () => applyNow({ onlyNew: false }) }] : []),
  ];

  // Pasek „Zastosuj” – przyklejony do dołu ekranu przy kolumnie filtrów, gdy są niezastosowane zmiany
  const applyBar = dirty && (
    <div className="sticky bottom-3 z-10 mt-3 animate-fade-in rounded-2xl bg-white p-3 shadow-xl ring-1 shadow-brand-900/15 ring-brand-200">
      <button onClick={apply} className="btn-kc w-full rounded-xl py-3 text-sm font-bold text-white">
        Zastosuj filtry <span className="font-medium opacity-80">({draftCount.toLocaleString("pl-PL")} prod.)</span>
      </button>
      <button onClick={cancel} className="mt-1 w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-brand-800">Anuluj zmiany</button>
    </div>
  );

  const filters = (
    <div>
      <div className="flex items-center justify-between pb-2">
        <p className="flex items-center gap-2 text-lg font-black text-navy"><SlidersHorizontal className="h-5 w-5 text-brand-700" /> Filtry</p>
        {countOf(draft) > 0 && <button onClick={reset} className="text-xs font-bold text-accent-dark hover:underline">Wyczyść ({countOf(draft)})</button>}
      </div>

      {category ? (
        <Section title="Podkategoria" count={subs.length}>
          {category.children.map((s) => {
            const n = subCounts.get(s.slug) ?? 0;
            const on = subs.includes(s.slug);
            if (!n && !on) return null;
            return (
              <div key={s.slug}>
                <CheckRow checked={on} count={n}
                  onChange={() => { if (on) { setSubs(without(subs, s.slug)); setTypes(types.filter((t) => typeSub.get(t) !== s.slug)); } else setSubs([...subs, s.slug]); }}
                  label={<span className="flex items-center gap-2"><CatIcon name={s.lucide} className="h-4 w-4 text-brand-700" />{s.name}</span>} />
                {/* Kategorie 3. poziomu pod zaznaczoną podkategorią */}
                {on && (
                  <div className="mb-1 ml-3 border-l-2 border-leaf-100 pl-3">
                    {s.types.map((t) => {
                      const tn = typeCounts.get(t.slug) ?? 0;
                      if (!tn && !types.includes(t.slug)) return null;
                      return <CheckRow key={t.slug} checked={types.includes(t.slug)} onChange={() => toggle(types, setTypes, t.slug)} count={tn} label={<span className="text-[13px]">{t.name}</span>} />;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </Section>
      ) : (
        <Section title="Kategoria" count={cats.length}>
          {categories.map((c) => {
            const n = catCounts.get(c.slug) ?? 0;
            if (!n && !cats.includes(c.slug)) return null;
            return <CheckRow key={c.slug} checked={cats.includes(c.slug)} onChange={() => toggle(cats, setCats, c.slug)} count={n}
              label={<span className="flex items-center gap-2"><CatIcon name={c.lucide} className="h-4 w-4 text-brand-700" />{c.name}</span>} />;
          })}
        </Section>
      )}

      <Section title="Cena" count={priceActive ? 1 : 0}>
        <PriceRange min={bounds[0]} max={bounds[1]} value={price} onChange={(v) => { setPrice(v); setShown(PAGE); }} />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pricePresets.map(([l, a, b]) => {
            const on = price[0] === a && price[1] === b;
            return <button key={l} onClick={() => { setPrice(on ? [0, Infinity] : [a, b]); setShown(PAGE); }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${on ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-900 hover:bg-brand-100"}`}>{l}</button>;
          })}
        </div>
      </Section>

      {allBrands.length > 1 && (
        <Section title="Marka" count={brands.length}>
          {allBrands.length > 8 && (
            <div className="relative mb-2">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={brandQuery} onChange={(e) => setBrandQuery(e.target.value)} placeholder="Szukaj marki" className="w-full rounded-lg border border-brand-100 py-2 pr-3 pl-9 text-sm outline-none focus:border-accent" />
            </div>
          )}
          <div className={allBrandsOpen ? "max-h-80 overflow-y-auto" : ""}>
            {visibleBrands.map((b) => <CheckRow key={b} checked={brands.includes(b)} onChange={() => toggle(brands, setBrands, b)} label={b} count={brandCounts.get(b) ?? 0} disabled={!brandCounts.get(b) && !brands.includes(b)} />)}
          </div>
          {!brandQuery && brandList.length > 8 && (
            <button onClick={() => setAllBrandsOpen(!allBrandsOpen)} className="mt-1 px-1.5 text-sm font-bold text-accent-dark hover:underline">
              {allBrandsOpen ? "Pokaż mniej" : `Pokaż wszystkie (${brandList.length})`}
            </button>
          )}
        </Section>
      )}

      <Section title="Wielkość opakowania" count={sizes.length}>
        {sizeBuckets.map((s) => {
          const n = sizeCounts.get(s) ?? 0;
          if (!n && !sizes.includes(s)) return null;
          return <CheckRow key={s} checked={sizes.includes(s)} onChange={() => toggle(sizes, setSizes, s)} label={s} count={n} />;
        })}
      </Section>

      {allForms.length > 1 && (
        <Section title="Rodzaj produktu" count={forms.length} defaultOpen={false}>
          {allForms.map((f) => {
            const n = formCounts.get(f) ?? 0;
            if (!n && !forms.includes(f)) return null;
            return <CheckRow key={f} checked={forms.includes(f)} onChange={() => toggle(forms, setForms, f)} label={f} count={n} />;
          })}
        </Section>
      )}

      <Section title="Dostępność i oferta" count={offerCount}>
        <CheckRow checked={onlyAvailable} onChange={() => { setOnlyAvailable(!onlyAvailable); setShown(PAGE); }} label="Dostępne od ręki – wysyłka 24 h" />
        <CheckRow checked={onlyPromo} onChange={() => { setOnlyPromo(!onlyPromo); setShown(PAGE); }} label="Promocje" />
        <CheckRow checked={onlyNew} onChange={() => { setOnlyNew(!onlyNew); setShown(PAGE); }} label="Nowości" />
      </Section>
    </div>
  );

  // Drzewo kategorii – pod filtrami
  const tree = (
    <nav className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-brand-100">
      <p className="px-2 pb-2 font-extrabold text-navy">Wszystkie kategorie</p>
      <ul className="space-y-0.5">
        {categories.map((c) => (
          <li key={c.slug}>
            <div className={`flex items-center rounded-xl ${category?.slug === c.slug ? "bg-brand-50" : "hover:bg-brand-50"}`}>
              <Link href={`/kategoria/${c.slug}`} className={`flex flex-1 items-center gap-2.5 px-2.5 py-2 text-sm ${category?.slug === c.slug ? "font-bold text-brand-900" : "text-slate-700"}`}>
                <CatIcon name={c.lucide} className="h-4.5 w-4.5 text-brand-700" /> {c.name}
                {counts && <span className="text-xs font-normal text-slate-400">({counts[c.slug] ?? 0})</span>}
              </Link>
              <button onClick={() => setOpenTree(openTree === c.slug ? null : c.slug)} aria-label={`Rozwiń ${c.name}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:text-brand-700">
                <ChevronDown className={`h-4 w-4 transition ${openTree === c.slug ? "rotate-180" : ""}`} />
              </button>
            </div>
            {openTree === c.slug && (
              <ul className="my-1 ml-4 space-y-0.5 border-l-2 border-brand-100 pl-2">
                {c.children.map((s) => {
                  const n = counts?.[`${c.slug}/${s.slug}`] ?? 0;
                  if (counts && !n) return null;
                  return (
                    <li key={s.slug}>
                      <Link href={`/kategoria/${c.slug}?sub=${s.slug}`} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-800">
                        <CatIcon name={s.lucide} className="h-4 w-4 text-brand-700" /> {s.name}
                        {counts && <span className="ml-auto text-xs text-slate-400">{n}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="hidden lg:block">
        <div className="rounded-2xl bg-white px-4 pt-4 pb-1 ring-1 ring-brand-100">{filters}</div>
        {applyBar}
        {tree}
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button onClick={() => setDrawer(true)} className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white lg:hidden">
            <SlidersHorizontal className="h-4 w-4" /> Filtry {activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1 text-[11px] text-brand-950">{activeCount}</span>}
          </button>
          <p className="text-sm text-slate-500"><b className="text-ink">{filtered.length.toLocaleString("pl-PL")}</b> {filtered.length === 1 ? "produkt" : "produktów"}</p>
          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <ArrowDownUp className="h-4 w-4 text-slate-400" />
              <span className="hidden text-slate-500 sm:inline">Sortuj:</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sortowanie"
                className="rounded-xl bg-white py-2 pr-2 pl-3 text-sm font-semibold ring-1 ring-brand-100 outline-none focus:ring-accent">
                {(Object.keys(sortLabels) as Sort[]).map((k) => <option key={k} value={k}>{sortLabels[k]}</option>)}
              </select>
            </label>
            <div className="hidden rounded-xl bg-white p-1 ring-1 ring-brand-100 sm:flex" role="group" aria-label="Widok">
              {([["grid", LayoutGrid, "Kafelki"], ["list", List, "Lista"]] as const).map(([v, Icon, l]) => (
                <button key={v} onClick={() => setView(v)} aria-label={l} aria-pressed={view === v}
                  className={`grid h-8 w-8 place-items-center rounded-lg transition ${view === v ? "bg-brand-700 text-white" : "text-slate-500 hover:text-brand-800"}`}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <button key={c.label} onClick={c.clear} className="flex items-center gap-1.5 rounded-full bg-brand-700 py-1 pr-2 pl-3 text-xs font-semibold text-white hover:bg-accent">
                {c.label} <X className="h-3.5 w-3.5" />
              </button>
            ))}
            <button onClick={reset} className="text-xs font-bold text-accent-dark underline">Wyczyść wszystkie</button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-12 text-center">
            <p className="font-semibold">Brak produktów spełniających kryteria</p>
            <p className="mt-1 text-sm text-slate-500">Spróbuj usunąć część filtrów.</p>
            <button onClick={reset} className="mt-4 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white">Wyczyść filtry</button>
          </div>
        ) : (
          <>
            {view === "grid" ? (
              <>
                {filtered.length > 10 && <HelpBanner />}
                <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4 min-[1880px]:grid-cols-5">
                  {filtered.slice(0, shown).map((p, i) => (
                    <ProductCard key={p.slug} product={p} priority={i < 4} />
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {filtered.slice(0, shown).map((p) => <ProductRow key={p.slug} product={p} />)}
              </div>
            )}
            {shown < filtered.length && (
              <div className="mt-12 flex flex-col items-center gap-3">
                <p className="text-sm text-slate-500">Wyświetlono {shown} z {filtered.length} produktów</p>
                <div className="h-1.5 w-60 overflow-hidden rounded-full bg-brand-100">
                  <div className="h-full bg-accent" style={{ width: `${(shown / filtered.length) * 100}%` }} />
                </div>
                <button onClick={() => setShown(shown + PAGE)} className="rounded-full border-2 border-brand-700 px-8 py-3 font-bold text-brand-700 transition hover:bg-brand-700 hover:text-white">
                  Pokaż kolejne {Math.min(PAGE, filtered.length - shown)}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-brand-950/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-end p-3">
              <button onClick={() => setDrawer(false)} aria-label="Zamknij" className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-6">{filters}{tree}</div>
            <div className="border-t border-brand-100 p-4">
              <button onClick={() => { apply(); setDrawer(false); }} className="w-full rounded-xl bg-brand-700 py-3.5 font-bold text-white">
                {dirty ? `Zastosuj – pokaż ${draftCount} produktów` : `Pokaż ${filtered.length} produktów`}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function HelpBanner() {
  return (
    <Link href="/blog" className="mb-5 flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-brand-100 hover:ring-accent">
      <span className="flex min-w-0 items-center gap-2.5">
        <BookOpen className="h-4 w-4 shrink-0 text-accent" />
        <span className="truncate"><b className="text-navy">Nie wiesz, co wybrać?</b> <span className="text-slate-500">Krótkie poradniki do mycia, felg i wnętrza.</span></span>
      </span>
      <span className="hidden shrink-0 items-center gap-1 font-bold text-accent sm:inline-flex">Czytaj <ArrowRight className="h-4 w-4" /></span>
    </Link>
  );
}
