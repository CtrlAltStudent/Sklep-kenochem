"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ProductCardData } from "@/lib/data";
import { ProductCard } from "../ProductCard";
import { useTypedPlaceholder } from "../TypedHint";

// Sekcja pojawia się płynnie przy przewijaniu
export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("is-visible"); obs.disconnect(); } }, { rootMargin: "0px 0px -10% 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

// Licznik „odliczający w górę”, gdy wejdzie w widok
export function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - start) / 1400);
        setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{v.toLocaleString("pl-PL")}{suffix}</span>;
}

// Duża wyszukiwarka w pierwszym ekranie. Pusta pokazuje frazę wpisywaną i kasowaną.
export function HeroSearch({ popular }: { popular: { label: string; href: string }[] }) {
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const hint = useTypedPlaceholder(!q && !focus);
  const router = useRouter();
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/szukaj?q=${encodeURIComponent(q.trim())}`); }}
        className="group relative hidden items-center rounded-2xl bg-white/95 p-2 sm:flex shadow-2xl shadow-black/30 ring-1 ring-white/40 backdrop-blur transition focus-within:ring-4 focus-within:ring-lime/50">
        <Search className="ml-3 h-6 w-6 shrink-0 text-brand-700" />
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Szukaj produktów"
          placeholder=""
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-ink outline-none sm:text-lg" />
        {!q && (
          <span className="pointer-events-none absolute top-1/2 left-14 -translate-y-1/2 truncate pr-36 text-base text-slate-400 sm:text-lg">
            {focus ? "Wpisz czego szukasz" : <>{hint}<span className="kc-caret" aria-hidden="true" /></>}
          </span>
        )}
        <button className="btn-kc flex items-center gap-2 rounded-xl px-5 py-3.5 font-bold text-white sm:px-7">
          <span className="hidden sm:inline">Szukaj</span> <ArrowRight className="h-5 w-5" />
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-2 text-sm sm:mt-4">
        <span className="text-white/60">Popularne:</span>
        {popular.map((p) => (
          <Link key={p.href} href={p.href} className="rounded-full bg-white/10 px-3 py-1 font-medium text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white hover:text-brand-900">
            {p.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => <ProductCard key={p.slug} product={p} priority={i < 4} />)}
    </div>
  );
}

// Karuzela produktów ze strzałkami. Ostatnia karta mieści się w całości, strzałka znika na końcu listy.
export function ProductRail({ products, itemClass }: { products: ProductCardData[]; itemClass?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [products.length]);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * Math.max(240, ref.current.clientWidth * 0.8), behavior: "smooth" });
  const item = itemClass ?? "w-[64%] min-[480px]:w-[46%] sm:w-[31%] lg:w-[23.5%] min-[1880px]:w-[19%]";
  const arrow = "absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-brand-900 shadow-xl ring-1 ring-brand-100 transition hover:scale-105 sm:h-12 sm:w-12";
  return (
    <div className="relative">
      <div ref={ref} onScroll={update} className="no-scrollbar flex snap-x snap-proximity gap-4 overflow-x-auto scroll-smooth px-1 pt-1 pb-4">
        {products.map((p) => (
          <div key={p.slug} className={`shrink-0 snap-start ${item}`}><ProductCard product={p} /></div>
        ))}
        <div className="w-2 shrink-0" aria-hidden />
      </div>
      {!edge.start && (
        <button type="button" onClick={() => scroll(-1)} aria-label="Poprzednie produkty" className={`${arrow} left-0`}>
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {!edge.end && (
        <button type="button" onClick={() => scroll(1)} aria-label="Następne produkty" className={`${arrow} right-0`}>
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

// Odliczanie do północy – „Okazje dnia” (renderowane tylko w przeglądarce, bez błędu hydracji)
export function Countdown() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const end = new Date();
      end.setHours(24, 0, 0, 0);
      setLeft(Math.max(0, end.getTime() - Date.now()));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.floor((left ?? 0) / 1000);
  const parts = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
  return (
    <div className="flex items-center gap-1.5" aria-label="Czas do końca promocji">
      {parts.map((n, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-xl font-black tabular-nums ring-1 ring-white/20 backdrop-blur sm:h-12 sm:w-12">
            {left === null ? "--" : String(n).padStart(2, "0")}
          </span>
          {i < 2 && <span className="font-black text-white/50">:</span>}
        </span>
      ))}
    </div>
  );
}
