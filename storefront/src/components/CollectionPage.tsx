import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { toCard, type Product } from "@/lib/data";
import { Breadcrumbs } from "./Breadcrumbs";
import { Listing } from "./Listing";
import { ProductCard } from "./ProductCard";

// Strona zestawienia produktów (Promocje, Bestsellery). Gdy lista jest pusta – komunikat i produkty polecane.
export function CollectionPage({ title, lead, icon: Icon, products, counts, empty, fallback }: {
  title: string; lead: string; icon: LucideIcon; products: Product[]; counts: Record<string, number>;
  empty: { title: string; text: string }; fallback: Product[];
}) {
  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: title }]} />
      <header className="bg-kc-gradient-deep relative mt-4 mb-8 overflow-hidden rounded-3xl px-6 py-9 text-white sm:px-10">
        <Icon className="absolute -right-6 -bottom-8 h-44 w-44 text-white/10" />
        <h1 className="relative text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <p className="relative mt-2 max-w-2xl text-brand-100">{lead}</p>
      </header>
      {products.length ? (
        <Listing products={products.map(toCard)} counts={counts} />
      ) : (
        <>
          <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-brand-100">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf-50 text-leaf"><Icon className="h-8 w-8" /></span>
            <h2 className="mt-4 text-xl font-black text-navy">{empty.title}</h2>
            <p className="mx-auto mt-1 max-w-lg text-slate-500">{empty.text}</p>
            <Link href="/nowosci" className="btn-kc mt-5 inline-block rounded-xl px-5 py-3 text-sm font-bold text-white">Zobacz nowości</Link>
          </div>
          {fallback.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-6 text-2xl font-black text-navy">Polecamy</h2>
              <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
                {fallback.map((p) => <ProductCard key={p.slug} product={toCard(p)} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
