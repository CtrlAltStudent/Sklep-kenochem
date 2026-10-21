import type { Metadata } from "next";
import Link from "next/link";
import { getBrands } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductImage } from "@/components/ProductImage";

export const metadata: Metadata = {
  title: "Marki – producenci chemii i akcesoriów",
  description: "Wszystkie marki w ofercie sklepu Sonax: SONAX, Tenzi, K2, ADBL, Kwazar, PLAK i inne. Oryginalne produkty, wysyłka w 1 dzień roboczy.",
};

export default async function BrandsPage() {
  const brands = [...(await getBrands())].sort((a, b) => a.name.localeCompare(b.name, "pl"));

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: "Marki" }]} />
      <h1 className="mt-4 text-4xl font-black tracking-tight">Marki w ofercie</h1>
      <p className="mt-2 max-w-2xl text-slate-500">
        {brands.length} producentów chemii samochodowej, myjniowej i do domu. Kupujemy u producentów i oficjalnych dystrybutorów.
      </p>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {brands.map((b) => (
          <li key={b.slug}>
            <Link
              href={`/marki/${b.slug}`}
              className="flex h-full flex-col items-center rounded-2xl bg-white p-4 text-center ring-1 ring-brand-100 transition hover:ring-accent"
            >
              <ProductImage src={b.image} alt="" sizes="120px" className="h-20 w-20" />
              <span className="mt-3 text-sm font-bold text-navy">{b.name}</span>
              <span className="text-xs text-slate-400">{b.count} prod.</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
