import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BadgeCheck } from "lucide-react";
import { categories, toCard } from "@/lib/data";
import { getBrands, getByBrand, getCategoryCounts } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatIcon } from "@/components/CatIcon";
import { Listing } from "@/components/Listing";

export async function generateMetadata(props: PageProps<"/marki/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const brand = (await getBrands()).find((b) => b.slug === slug);
  return brand ? { title: `${brand.name} – produkty`, description: `${brand.name}: ${brand.count} produktów w sklepie Kenochem. Oryginalne produkty, wysyłka w 24 h, ceny hurtowe dla firm.` } : {};
}

export default async function BrandPage(props: PageProps<"/marki/[slug]">) {
  const { slug } = await props.params;
  const [brands, items, counts] = await Promise.all([getBrands(), getByBrand(slug), getCategoryCounts()]);
  const brand = brands.find((b) => b.slug === slug);
  if (!brand || !items.length) notFound();
  const cats = categories.filter((c) => brand.categories.has(c.slug));

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: "Marki", href: "/marki" }, { label: brand.name }]} />
      <header className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-accent uppercase"><BadgeCheck className="h-4 w-4" /> Oryginalne produkty</p>
          <h1 className="text-3xl font-black tracking-tight text-navy uppercase sm:text-5xl">{brand.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{brand.count} produktów w {cats.length} {cats.length === 1 ? "kategorii" : "kategoriach"}</p>
        </div>
        <Link href="/marki" className="text-sm font-bold text-accent-dark hover:underline">Wszystkie marki →</Link>
      </header>
      {cats.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {cats.map((c) => (
            <span key={c.slug} className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 ring-1 ring-brand-100">
              <CatIcon name={c.lucide} className="h-4 w-4 text-brand-700" /> {c.name}
            </span>
          ))}
        </div>
      )}
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
        <BrandListing searchParams={props.searchParams} items={items.map(toCard)} counts={counts} />
      </Suspense>
    </div>
  );
}

async function BrandListing({ searchParams, items, counts }: { searchParams: Promise<Record<string, string | string[] | undefined>>; items: ReturnType<typeof toCard>[]; counts: Record<string, number> }) {
  return <Listing products={items} counts={counts} params={await searchParams} />;
}
