"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ProductCardData } from "@/lib/data";
import { ProductCard } from "../ProductCard";

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

// Duża wyszukiwarka w pierwszym ekranie, z rotującymi podpowiedziami
const hints = ["aktywna piana do myjni", "płyn do szyb", "wosk ceramiczny", "mikrofibra", "odtłuszczacz", "zapach do auta", "pistolet do myjki"];
export function HeroSearch({ popular }: { popular: { label: string; href: string }[] }) {
  const [q, setQ] = useState("");
  const [hint, setHint] = useState(0);
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => setHint((h) => (h + 1) % hints.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/szukaj?q=${encodeURIComponent(q.trim())}`); }}
        className="group relative hidden items-center rounded-2xl bg-white/95 p-2 sm:flex shadow-2xl shadow-black/30 ring-1 ring-white/40 backdrop-blur transition focus-within:ring-4 focus-within:ring-lime/50">
        <Search className="ml-3 h-6 w-6 shrink-0 text-brand-700" />
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Szukaj produktów"
          placeholder={`Szukaj: ${hints[hint]}…`}
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-ink outline-none placeholder:text-slate-400 sm:text-lg" />
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

// Karuzela produktów ze strzałkami (jak w dużych sklepach)
export function ProductRail({ products }: { products: ProductCardData[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  };
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <div className="group/rail relative">
      <div ref={ref} onScroll={update} className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto scroll-smooth px-4 pb-4">
        {products.map((p) => (
          <div key={p.slug} className="w-[64%] shrink-0 snap-start min-[480px]:w-[46%] sm:w-[31%] lg:w-[23.5%] min-[1880px]:w-[19%]"><ProductCard product={p} /></div>
        ))}
      </div>
      {!edge.start && (
        <button onClick={() => scroll(-1)} aria-label="Poprzednie" className="absolute top-1/3 -left-5 hidden h-12 w-12 place-items-center rounded-full bg-white text-brand-900 shadow-xl ring-1 ring-brand-100 transition hover:scale-110 md:grid">
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {!edge.end && (
        <button onClick={() => scroll(1)} aria-label="Następne" className="absolute top-1/3 -right-5 hidden h-12 w-12 place-items-center rounded-full bg-white text-brand-900 shadow-xl ring-1 ring-brand-100 transition hover:scale-110 md:grid">
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
