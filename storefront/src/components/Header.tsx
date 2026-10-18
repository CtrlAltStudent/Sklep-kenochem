"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Briefcase, ChevronDown, ChevronRight, Clock, Heart, Loader2, Menu, Phone, Search, ShoppingCart, Sparkles, Truck, User, X,
} from "lucide-react";
import { categoryPhoto } from "@/lib/photos";
import { categories, formatPrice, minPrice, FREE_SHIPPING, type ProductCardData } from "@/lib/data";
import { resolveCart } from "@/lib/cart";
import { actions, useStore } from "@/lib/store";
import { CatIcon } from "./CatIcon";
import { ProductImage } from "./ProductImage";

export type CategoryCounts = Record<string, number>; // "kategoria" i "kategoria/podkategoria" → liczba produktów

export function Logo({ className = "h-11 w-auto" }: { className?: string }) {
  return (
    <Link href="/" className="shrink-0" aria-label="Kenochem – strona główna">
      <Image src="/brand/logo-e1772107192548.webp" alt="Kenochem" width={420} height={139} priority className={className} />
    </Link>
  );
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

function SearchBox({ onDone }: { onDone?: () => void }) {
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const [res, setRes] = useState<{ q: string; total: number; items: ProductCardData[] } | null>(null);
  const router = useRouter();
  const term = q.trim();
  const loading = term.length >= 2 && res?.q !== term;
  const subHits = term.length >= 2
    ? categories.flatMap((c) => [{ c, s: null as null | (typeof c.children)[number] }, ...c.children.map((s) => ({ c, s }))])
        .filter(({ c, s }) => norm(s ? s.name : c.name).includes(norm(term))).slice(0, 4)
    : [];

  // Podpowiedzi z /api/search, z małym opóźnieniem, żeby nie odpytywać przy każdym znaku
  useEffect(() => {
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => setRes({ q: term, ...d }))
        .catch(() => {});
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [term]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term) return;
    router.push(`/szukaj?q=${encodeURIComponent(term)}`);
    setFocus(false);
    onDone?.();
  };

  return (
    <form onSubmit={submit} className="relative w-full" role="search">
      <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        placeholder="Czego szukasz? Wpisz produkt, markę, SKU lub EAN"
        aria-label="Szukaj produktów"
        className="h-12 w-full rounded-full border-2 border-brand-100 bg-brand-50 pr-14 pl-12 text-sm transition outline-none focus:border-accent focus:bg-white"
      />
      <button aria-label="Szukaj" className="btn-kc absolute top-1.5 right-1.5 grid h-9 w-11 place-items-center rounded-full text-white">
        <Search className="h-4.5 w-4.5" />
      </button>

      {focus && term.length >= 2 && (
        <div className="absolute inset-x-0 top-14 z-50 animate-fade-in overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-2xl">
          {subHits.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-brand-100 p-3">
              {subHits.map(({ c, s }) => (
                <Link key={c.slug + (s?.slug ?? "")} href={s ? `/kategoria/${c.slug}?sub=${s.slug}` : `/kategoria/${c.slug}`} onClick={onDone}
                  className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-900 hover:bg-brand-100">
                  <CatIcon name={s ? s.lucide : c.lucide} className="h-4 w-4 text-brand-700" /> {s ? s.name : c.name}
                </Link>
              ))}
            </div>
          )}
          {loading && !res?.items.length ? (
            <p className="flex items-center gap-2 p-4 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Szukam…</p>
          ) : !res?.items.length ? (
            <p className="p-4 text-sm text-slate-500">Brak wyników dla „{term}”.</p>
          ) : (
            <>
              <ul className={`p-2 transition-opacity ${loading ? "opacity-50" : ""}`}>
                {res.items.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/produkt/${p.slug}`} onClick={onDone} className="flex items-center gap-3 rounded-xl p-2 hover:bg-brand-50">
                      <ProductImage src={p.image} alt="" sizes="48px" className="h-12 w-12 shrink-0 rounded-lg ring-1 ring-brand-100" />
                      <span className="flex-1 text-sm leading-tight">{p.name}</span>
                      <span className="text-sm font-bold whitespace-nowrap text-navy">{formatPrice(minPrice(p))}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button className="w-full bg-brand-50 py-2.5 text-center text-sm font-semibold text-accent-dark hover:bg-brand-100">
                Pokaż wszystkie wyniki ({res.total}) →
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
}

// Panel kategorii po najechaniu: kafelki podkategorii z ikonami i liczbą produktów + zdjęcie kategorii
function MegaPanel({ slug, counts, onClose, onEnter }: { slug: string; counts: CategoryCounts; onClose: () => void; onEnter: () => void }) {
  const cat = categories.find((c) => c.slug === slug)!;
  return (
    <div onMouseEnter={onEnter} className="absolute inset-x-0 top-full z-40 hidden animate-fade-in rounded-b-3xl bg-white shadow-2xl shadow-brand-950/30 lg:block">
      <div className="kc-stripe" />
      <div className="mx-auto grid max-h-[calc(100vh-200px)] max-w-shop grid-cols-[1fr_280px] gap-8 overflow-y-auto px-6 py-7">
        <div>
          <div className="mb-5 flex items-end justify-between">
            <h3 className="flex items-center gap-3 text-xl font-extrabold text-navy">
              <span className="bg-kc-gradient grid h-11 w-11 place-items-center rounded-xl text-white shadow-lg shadow-leaf/30"><CatIcon name={cat.lucide} className="h-5.5 w-5.5" /></span>
              {cat.name}
              <span className="rounded-full bg-leaf-50 px-2.5 py-0.5 text-xs font-bold text-leaf-700 ring-1 ring-leaf-100">{counts[cat.slug] ?? 0} produktów</span>
            </h3>
            <Link href={`/kategoria/${cat.slug}`} onClick={onClose} className="flex items-center gap-1 text-sm font-bold text-accent-dark transition-all hover:gap-2">
              Zobacz całą kategorię <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {/* Kolumny: podkategoria (nagłówek) + kategorie 3. poziomu – jak na kenochem.098.pl / agrosimex */}
          <div className="columns-3 gap-6 xl:columns-4">
            {cat.children.map((s) => {
              const n = counts[`${cat.slug}/${s.slug}`] ?? 0;
              if (!n) return null;
              const types = s.types.filter((t) => counts[`${cat.slug}/${s.slug}/${t.slug}`]);
              return (
                <div key={s.slug} className="mb-5 break-inside-avoid">
                  <Link href={`/kategoria/${cat.slug}?sub=${s.slug}`} onClick={onClose}
                    className="group flex items-center gap-2.5 rounded-xl py-1 pr-2 transition hover:text-brand-800">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-leaf-50 text-brand-700 ring-1 ring-leaf-100 transition group-hover:bg-leaf group-hover:text-white group-hover:ring-leaf">
                      <CatIcon name={s.lucide} className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-sm leading-tight font-extrabold text-navy group-hover:text-brand-800">{s.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-leaf" />
                  </Link>
                  {types.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 border-l-2 border-leaf-100 pl-3 ml-[18px]">
                      {types.map((t) => (
                        <li key={t.slug}>
                          <Link href={`/kategoria/${cat.slug}?sub=${s.slug}&typ=${t.slug}`} onClick={onClose}
                            className="flex items-baseline justify-between gap-2 rounded-md px-2 py-1 text-[13px] text-slate-600 transition hover:bg-leaf-50 hover:text-brand-800">
                            <span>{t.name}</span>
                            <span className="text-[11px] text-slate-400">{counts[`${cat.slug}/${s.slug}/${t.slug}`]}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="group relative isolate sticky top-0 flex min-h-[320px] flex-col justify-end self-start overflow-hidden rounded-2xl p-5 text-white">
          <Image src={categoryPhoto[cat.slug] ?? "/brand/mYCIE-AUTA-1.jpg"} alt="" fill sizes="280px" className="-z-10 object-cover transition duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-950/95 via-brand-900/50 to-transparent" />
          <span className="text-xs font-bold tracking-widest text-leaf-300 uppercase">{counts[cat.slug] ?? 0} produktów</span>
          <p className="mt-1 text-xl leading-tight font-black">{cat.name}</p>
          <Link href={`/kategoria/${cat.slug}`} onClick={onClose} className="btn-kc mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold">
            Przeglądaj <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/b2b" onClick={onClose} className="mt-3 text-xs font-semibold text-white/80 underline-offset-2 hover:text-white hover:underline">Kupujesz dla firmy? Ceny hurtowe B2B →</Link>
        </div>
      </div>
    </div>
  );
}

function MobileMenu({ onClose, counts }: { onClose: () => void; counts: CategoryCounts }) {
  const [open, setOpen] = useState<string | null>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 animate-fade-in bg-brand-950/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-brand-100 p-4">
          <Logo className="h-9 w-auto" />
          <button onClick={onClose} aria-label="Zamknij menu" className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4"><SearchBox onDone={onClose} /></div>
        <nav className="flex-1 overflow-y-auto px-2">
          {categories.map((c) => (
            <div key={c.slug} className="border-b border-brand-50">
              <button onClick={() => setOpen(open === c.slug ? null : c.slug)} className="flex w-full items-center gap-3 px-3 py-3 text-left font-semibold text-ink">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><CatIcon name={c.lucide} /></span>
                <span className="flex-1">{c.name}<span className="block text-xs font-normal text-slate-400">{counts[c.slug] ?? 0} produktów</span></span>
                <ChevronDown className={`h-4 w-4 transition ${open === c.slug ? "rotate-180" : ""}`} />
              </button>
              {open === c.slug && (
                <div className="grid animate-fade-in gap-0.5 pb-3 pl-4">
                  <Link href={`/kategoria/${c.slug}`} onClick={onClose} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-accent-dark">
                    <ArrowRight className="h-4 w-4" /> Wszystkie w kategorii
                  </Link>
                  {c.children.filter((s) => counts[`${c.slug}/${s.slug}`]).map((s) => {
                    const types = s.types.filter((t) => counts[`${c.slug}/${s.slug}/${t.slug}`]);
                    const subOpen = openSub === s.slug;
                    return (
                      <div key={s.slug}>
                        <div className="flex items-center">
                          <Link href={`/kategoria/${c.slug}?sub=${s.slug}`} onClick={onClose} className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 active:bg-brand-50">
                            <CatIcon name={s.lucide} className="h-4.5 w-4.5 text-brand-700" /> {s.name}
                          </Link>
                          {types.length > 0 && (
                            <button onClick={() => setOpenSub(subOpen ? null : s.slug)} aria-label={`Rozwiń ${s.name}`} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 active:bg-brand-50">
                              <ChevronDown className={`h-4 w-4 transition ${subOpen ? "rotate-180" : ""}`} />
                            </button>
                          )}
                        </div>
                        {subOpen && (
                          <div className="mb-1 ml-5 grid animate-fade-in border-l-2 border-leaf-100 pl-3">
                            {types.map((t) => (
                              <Link key={t.slug} href={`/kategoria/${c.slug}?sub=${s.slug}&typ=${t.slug}`} onClick={onClose} className="rounded-md px-2 py-1.5 text-[13px] text-slate-600 active:bg-leaf-50">
                                {t.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="grid grid-cols-3 gap-2 border-t border-brand-100 p-4 text-sm font-semibold">
          <Link href="/b2b" onClick={onClose} className="btn-kc rounded-xl py-3 text-center text-white">B2B</Link>
          <Link href="/promocje" onClick={onClose} className="rounded-xl bg-brand-50 py-3 text-center">Promocje</Link>
          <Link href="/nowosci" onClick={onClose} className="rounded-xl bg-brand-50 py-3 text-center">Nowości</Link>
          <Link href="/bestsellery" onClick={onClose} className="rounded-xl bg-brand-50 py-3 text-center">Bestsellery</Link>
          <Link href="/marki" onClick={onClose} className="rounded-xl bg-brand-50 py-3 text-center">Marki</Link>
          <Link href="/kontakt" onClick={onClose} className="rounded-xl bg-brand-50 py-3 text-center">Kontakt</Link>
        </div>
      </aside>
    </div>
  );
}

export function Header({ counts }: { counts: CategoryCounts }) {
  const { cart, wishlist } = useStore();
  const { count, subtotal } = resolveCart(cart);
  const [active, setActive] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Krótkie opóźnienia, żeby panel nie migał przy przejeżdżaniu myszą
  const hoverCat = (slug: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(slug), active ? 60 : 140);
  };
  const keep = () => { if (timer.current) clearTimeout(timer.current); };
  const leave = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setActive(null), 180); };

  return (
    <>
      <div className="bg-kc-gradient-deep text-xs text-brand-100">
        <div className="mx-auto flex max-w-shop items-center justify-between gap-4 px-4 py-2">
          <div className="flex items-center gap-5">
            <a href="tel:+48500021705" className="flex items-center gap-1.5 hover:text-white"><Phone className="h-3.5 w-3.5" /> +48 500 021 705</a>
            <span className="hidden items-center gap-1.5 sm:flex"><Clock className="h-3.5 w-3.5" /> Pn–Pt 8:00–16:00</span>
          </div>
          <span className="hidden items-center gap-1.5 font-medium text-lime md:flex">
            <Truck className="h-3.5 w-3.5" /> Darmowa dostawa od {formatPrice(FREE_SHIPPING)} · wysyłka w 24 h
          </span>
          <div className="flex items-center gap-4">
            <Link href="/promocje" className="hidden hover:text-white lg:block">Promocje</Link>
            <Link href="/bestsellery" className="hidden hover:text-white lg:block">Bestsellery</Link>
            <Link href="/nowosci" className="hidden items-center gap-1 hover:text-white sm:flex"><Sparkles className="h-3.5 w-3.5" /> Nowości</Link>
            <Link href="/marki" className="hidden hover:text-white lg:block">Marki</Link>
            <Link href="/blog" className="hidden hover:text-white xl:block">Poradniki</Link>
            <Link href="/kontakt" className="hidden hover:text-white sm:block">Kontakt</Link>
            <Link href="/b2b" className="flex items-center gap-1.5 rounded-md bg-lime px-2 py-0.5 font-bold text-brand-950 hover:bg-white"><Briefcase className="h-3.5 w-3.5" /> Strefa B2B</Link>
          </div>
        </div>
      </div>

      <div className="kc-stripe" />
      <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur transition-shadow ${scrolled ? "shadow-lg shadow-brand-900/5" : ""}`}>
        <div className="mx-auto flex max-w-shop items-center gap-4 px-4 py-3 lg:gap-8">
          <button onClick={() => setMobile(true)} aria-label="Otwórz menu" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <Logo className="h-10 w-auto sm:h-12" />
          <div className="hidden flex-1 md:block"><SearchBox /></div>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link href="/b2b" className="bg-kc-gradient-deep mr-2 hidden items-center gap-2 rounded-xl py-2 pr-3.5 pl-2.5 text-white shadow-md shadow-brand-900/20 transition hover:brightness-125 xl:flex">
              <span className="bg-kc-gradient grid h-8 w-8 place-items-center rounded-lg"><Briefcase className="h-4.5 w-4.5" /></span>
              <span className="text-left text-[11px] leading-tight">Dla firm<br /><b className="text-sm">Ceny B2B</b></span>
            </Link>
            <Link href="/konto" className="hidden flex-col items-center rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-brand-50 sm:flex">
              <User className="h-5.5 w-5.5 text-brand-800" /> Konto
            </Link>
            <Link href="/ulubione" className="relative flex flex-col items-center rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-brand-50">
              <Heart className="h-5.5 w-5.5 text-brand-800" /> Ulubione
              {wishlist.length > 0 && <span className="absolute top-0 right-2 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{wishlist.length}</span>}
            </Link>
            <button onClick={() => actions.openCart(true)} className="btn-kc relative flex items-center gap-3 rounded-xl py-2 pr-4 pl-3 text-white">
              <span className="relative">
                <ShoppingCart className="h-5.5 w-5.5" />
                {count > 0 && <span key={count} className="absolute -top-2 -right-2 grid h-4.5 min-w-4.5 animate-pop place-items-center rounded-full bg-lime px-1 text-[10px] font-bold text-brand-950">{count}</span>}
              </span>
              <span className="hidden text-left text-[11px] leading-tight sm:block">
                Koszyk<br /><b className="text-sm">{formatPrice(subtotal)}</b>
              </span>
            </button>
          </div>
        </div>
        <div className="px-4 pb-3 md:hidden"><SearchBox /></div>

        {/* Pasek kategorii z ikonami (wzorowany na agrosimex.pl) */}
        <nav className="relative hidden border-t border-brand-100 lg:block" onMouseLeave={leave} aria-label="Kategorie">
          <ul className="mx-auto grid max-w-shop grid-cols-7 px-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/kategoria/${c.slug}`} onMouseEnter={() => hoverCat(c.slug)} onFocus={() => setActive(c.slug)}
                  className={`group relative flex h-full items-center gap-2.5 px-3 py-3 text-[13px] leading-tight font-semibold transition ${active === c.slug ? "bg-leaf-50 text-brand-800" : "text-slate-700 hover:bg-leaf-50/60 hover:text-brand-800"}`}>
                  <CatIcon name={c.lucide} className={`h-6 w-6 shrink-0 transition ${active === c.slug ? "text-leaf" : "text-brand-700 group-hover:text-leaf"}`} strokeWidth={1.5} />
                  <span>{c.name}</span>
                  <span className={`bg-kc-gradient absolute inset-x-0 bottom-0 h-[3px] rounded-t-full transition ${active === c.slug ? "opacity-100" : "opacity-0"}`} />
                </Link>
              </li>
            ))}
          </ul>
          {active && (
            <>
              {/* Przyciemnienie strony pod panelem – panel wyraźnie odcina się od tła */}
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-full z-30 hidden h-screen animate-fade-in bg-brand-950/55 backdrop-blur-[2px] lg:block" />
              <MegaPanel slug={active} counts={counts} onEnter={keep} onClose={() => setActive(null)} />
            </>
          )}
        </nav>
      </header>

      {mobile && <MobileMenu counts={counts} onClose={() => setMobile(false)} />}
    </>
  );
}
