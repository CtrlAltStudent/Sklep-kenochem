import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import { getBrands } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductImage } from "@/components/ProductImage";

export const metadata: Metadata = {
  title: "Marki – producenci chemii i akcesoriów",
  description: "Wszystkie marki w ofercie Kenochem: Kenotek, Sonax, K2, Tenzi, Vikan, Kwazar i wiele innych. Oryginalne produkty od producentów.",
};

export default async function BrandsPage() {
  const brands = await getBrands();
  const top = brands.slice(0, 12);
  const letters = [...new Set(brands.map((b) => b.name[0].toUpperCase()))].sort((a, b) => a.localeCompare(b, "pl"));
  const byLetter = letters.map((l) => [l, brands.filter((b) => b.name[0].toUpperCase() === l).sort((a, b) => a.name.localeCompare(b.name, "pl"))] as const);

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: "Marki" }]} />
      <header className="bg-kc-gradient-deep mt-4 rounded-3xl px-6 py-10 text-white sm:px-10">
        <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-leaf-300 uppercase"><BadgeCheck className="h-4 w-4" /> 100% oryginalne produkty</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Marki w naszej ofercie</h1>
        <p className="mt-3 max-w-2xl text-brand-100">{brands.length} producentów chemii samochodowej, myjniowej i obiektowej. Kupujemy bezpośrednio u producentów i oficjalnych dystrybutorów.</p>
      </header>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-black text-navy">Najpopularniejsze marki</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {top.map((b) => (
            <Link key={b.slug} href={`/marki/${b.slug}`}
              className="group relative flex flex-col items-center rounded-3xl bg-white p-4 text-center ring-1 ring-brand-100 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/10 hover:ring-leaf">
              <ProductImage src={b.image} alt="" sizes="160px" className="h-28 w-28" />
              <span className="mt-3 text-lg font-black tracking-wide text-navy uppercase group-hover:text-brand-800">{b.name}</span>
              <span className="text-xs text-slate-500">{b.count} produktów</span>
              <ArrowUpRight className="absolute top-4 right-4 h-4 w-4 text-leaf opacity-0 transition group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-black text-navy">Wszystkie marki A–Z</h2>
        <nav className="mb-6 flex flex-wrap gap-1.5" aria-label="Litery">
          {letters.map((l) => (
            <a key={l} href={`#litera-${l}`} className="grid h-9 w-9 place-items-center rounded-lg bg-white text-sm font-bold text-brand-800 ring-1 ring-brand-100 hover:bg-leaf hover:text-white hover:ring-leaf">{l}</a>
          ))}
        </nav>
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {byLetter.map(([l, list]) => (
            <div key={l} id={`litera-${l}`} className="scroll-mt-44">
              <p className="mb-2 border-b border-brand-100 pb-1 text-xl font-black text-leaf">{l}</p>
              <ul className="space-y-1">
                {list.map((b) => (
                  <li key={b.slug}>
                    <Link href={`/marki/${b.slug}`} className="flex items-baseline justify-between gap-2 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-leaf-50 hover:text-brand-800">
                      <span>{b.name}</span><span className="text-xs text-slate-400">{b.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
