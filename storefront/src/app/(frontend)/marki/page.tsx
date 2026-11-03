import type { Metadata } from "next";
import Link from "next/link";
import { getShopBrands } from "@/lib/brands";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Marki w sklepie",
  description: "Marki dostępne w sklepie Sonax. Oryginalne produkty, wysyłka w 1 dzień roboczy.",
};

export default async function BrandsPage() {
  const brands = await getShopBrands();

  return (
    <div className="mx-auto max-w-shop px-4 pt-6 pb-12">
      <Breadcrumbs items={[{ label: "Marki" }]} />
      <h1 className="mt-4 text-4xl font-black tracking-tight">Marki w sklepie</h1>
      <p className="mt-2 max-w-2xl text-slate-500">
        {brands.length} {brands.length === 1 ? "marka" : "marek"} z oferty sklepu. Kliknij logo, żeby zobaczyć produkty.
      </p>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {brands.map((b) => (
          <li key={b.slug}>
            <Link
              href={b.href}
              className="flex h-full flex-col items-center justify-center rounded-2xl bg-white p-4 text-center ring-1 ring-brand-100 transition hover:ring-accent"
            >
              {b.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.image} alt="" className="h-16 w-full object-contain" />
              ) : (
                <span className="grid h-16 place-items-center text-sm font-black text-navy">{b.name}</span>
              )}
              <span className="mt-3 text-sm font-bold text-navy">{b.name}</span>
              <span className="text-xs text-slate-400">{b.count} prod.</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
