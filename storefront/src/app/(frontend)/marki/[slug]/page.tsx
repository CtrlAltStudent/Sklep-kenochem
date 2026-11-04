import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BadgeCheck } from "lucide-react";
import { toCard } from "@/lib/data";
import { getByBrand, getCategoryCounts, getShopCategories } from "@/lib/catalog";
import { getShopBrands } from "@/lib/brands";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatIcon } from "@/components/CatIcon";
import { Listing } from "@/components/Listing";
import { JsonLd } from "@/components/JsonLd";
import { siteBase } from "@/lib/site";

export async function generateMetadata(props: PageProps<"/marki/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const brand = (await getShopBrands()).find((b) => b.slug === slug);
  const title = brand ? `${brand.name} – produkty` : undefined;
  const description = brand ? `${brand.name}: ${brand.count} produktów w sklepie Sonax. Oryginalne produkty, wysyłka zwykle w 1 dzień roboczy.` : undefined;
  return brand ? { title, description, alternates: { canonical: `/marki/${brand.slug}` }, openGraph: { type: "website", siteName: "Sklep Sonax", locale: "pl_PL", title, description } } : {};
}

export default async function BrandPage(props: PageProps<"/marki/[slug]">) {
  const { slug } = await props.params;
  const [brands, items, counts, categories] = await Promise.all([getShopBrands(), getByBrand(slug), getCategoryCounts(), getShopCategories()]);
  const brand = brands.find((b) => b.slug === slug);
  if (!brand) notFound();
  const cats = categories.filter((c) => brand.categories.includes(c.slug));

  const origin = siteBase();
  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Sklep", item: origin },
          { "@type": "ListItem", position: 2, name: "Marki", item: `${origin}/marki` },
          { "@type": "ListItem", position: 3, name: brand.name, item: `${origin}/marki/${brand.slug}` },
        ] },
        { "@context": "https://schema.org", "@type": "CollectionPage", name: brand.name, url: `${origin}/marki/${brand.slug}`,
          mainEntity: { "@type": "ItemList", numberOfItems: items.length, itemListElement: items.slice(0, 24).map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: `${origin}/produkt/${p.slug}` })) } },
      ]} />
      <Breadcrumbs items={[{ label: "Marki", href: "/marki" }, { label: brand.name }]} />
      <header className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-accent uppercase"><BadgeCheck className="h-4 w-4" /> Oryginalne produkty</p>
          {brand.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.image} alt={brand.name} className="mb-3 h-14 w-40 object-contain object-left" />
          )}
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
      {items.length ? (
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
          <BrandListing searchParams={props.searchParams} items={items.map(toCard)} counts={counts} />
        </Suspense>
      ) : (
        <p className="rounded-2xl bg-white p-8 text-slate-500 ring-1 ring-brand-100">Nie ma jeszcze produktów tej marki.</p>
      )}
    </div>
  );
}

async function BrandListing({ searchParams, items, counts }: { searchParams: Promise<Record<string, string | string[] | undefined>>; items: ReturnType<typeof toCard>[]; counts: Record<string, number> }) {
  return <Listing products={items} counts={counts} params={await searchParams} />;
}
