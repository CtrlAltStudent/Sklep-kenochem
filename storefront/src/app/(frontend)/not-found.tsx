import Link from "next/link";
import { ArrowRight, Home, Phone, Search } from "lucide-react";
import { categories } from "@/lib/data";
import { CatIcon } from "@/components/CatIcon";

// Strona 404 – zamiast ślepego zaułka: wyszukiwarka, kategorie, kontakt
export default function NotFound() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <p className="text-8xl font-black tracking-tight text-brand-100">404</p>
      <h1 className="-mt-6 text-3xl font-black text-navy sm:text-4xl">Nie znaleźliśmy tej strony</h1>
      <p className="mx-auto mt-3 max-w-lg text-slate-600">Strona mogła zostać przeniesiona albo produkt wycofany. Wyszukaj produkt lub wybierz kategorię.</p>

      <form action="/szukaj" className="relative mx-auto mt-8 max-w-xl">
        <Search className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input name="q" placeholder="Czego szukasz?" aria-label="Szukaj" className="h-14 w-full rounded-full border-2 border-brand-100 bg-white pr-32 pl-13 text-sm outline-none focus:border-accent" />
        <button className="absolute top-2 right-2 h-10 rounded-full bg-brand-700 px-6 text-sm font-bold text-white hover:bg-accent">Szukaj</button>
      </form>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.slice(0, 8).map((c) => (
          <Link key={c.slug} href={`/kategoria/${c.slug}`} className="group flex flex-col items-center gap-2 rounded-2xl bg-white p-4 ring-1 ring-brand-100 transition hover:ring-accent">
            <CatIcon name={c.lucide} className="h-7 w-7 text-brand-700 transition group-hover:scale-110" strokeWidth={1.5} />
            <span className="text-xs font-semibold text-ink">{c.name}</span>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/" className="flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white hover:bg-accent"><Home className="h-4 w-4" /> Strona główna</Link>
        <a href="tel:+48500021705" className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-brand-800 ring-1 ring-brand-200 hover:bg-brand-50"><Phone className="h-4 w-4" /> Zadzwoń: 500 021 705</a>
        <Link href="/kontakt" className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-brand-800 ring-1 ring-brand-200 hover:bg-brand-50">Napisz do nas <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}
