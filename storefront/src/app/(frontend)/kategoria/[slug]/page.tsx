import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories, getCategory, toCard } from "@/lib/data";
import { getByCategory, getCategoryCounts } from "@/lib/catalog";
import { getCms } from "@/lib/cms";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatIcon } from "@/components/CatIcon";
import { Listing } from "@/components/Listing";
import { RichContent } from "@/components/RichContent";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/kategoria/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const c = getCategory(slug);
  return { title: c?.name, description: c ? `${c.name} – ${c.children.map((s) => s.name).join(", ")}. Hurt i detal, wysyłka w 24 h.` : undefined };
}

// Opis kategorii z panelu (Sklep → Kategorie → Opis) – pokazywany pod listą produktów (SEO)
async function getCategoryDescription(slug: string) {
  const payload = await getCms();
  const doc = (await payload.find({ collection: "categories", where: { slug: { equals: slug } }, limit: 1, depth: 0, select: { description: true } })).docs[0];
  return doc?.description;
}

export default async function CategoryPage(props: PageProps<"/kategoria/[slug]">) {
  const { slug } = await props.params;
  const category = getCategory(slug);
  if (!category) notFound();
  const [items, counts, description] = await Promise.all([getByCategory(slug), getCategoryCounts(), getCategoryDescription(slug)]);

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: category.name }]} />
      <header className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-700 text-white shadow-lg shadow-brand-700/20">
            <CatIcon name={category.lucide} className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-navy sm:text-4xl">{category.name}</h1>
            <p className="text-sm text-slate-500">{items.length.toLocaleString("pl-PL")} produktów w {category.children.length} podkategoriach</p>
          </div>
        </div>
      </header>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
        <CategoryListing searchParams={props.searchParams} slug={slug} items={items.map(toCard)} counts={counts} />
      </Suspense>

      {description && (
        <section className="mt-16 rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:p-10">
          <RichContent data={description} />
        </section>
      )}
    </div>
  );
}

async function CategoryListing({ searchParams, slug, items, counts }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>; slug: string; items: ReturnType<typeof toCard>[]; counts: Record<string, number>;
}) {
  const params = await searchParams;
  const category = getCategory(slug)!;
  const activeSub = typeof params.sub === "string" ? params.sub : "";
  return (
    <>
      {/* Skróty podkategorii – zmiana ?sub= tworzy listę od nowa (key), więc filtr zawsze się ustawia */}
      <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1">
        {category.children.map((s) => {
          const n = counts[`${slug}/${s.slug}`] ?? 0;
          if (!n) return null;
          const on = activeSub === s.slug;
          return (
            <Link key={s.slug} href={on ? `/kategoria/${slug}` : `/kategoria/${slug}?sub=${s.slug}`} scroll={false}
              className={`group flex shrink-0 items-center gap-2.5 rounded-2xl py-2 pr-4 pl-2 text-sm font-semibold whitespace-nowrap ring-1 transition ${on ? "bg-kc-gradient text-white ring-transparent shadow-lg shadow-leaf/25" : "bg-white ring-brand-100 hover:ring-leaf"}`}>
              <span className={`grid h-9 w-9 place-items-center rounded-xl transition ${on ? "bg-white/20 text-white" : "bg-leaf-50 text-brand-700 group-hover:bg-leaf group-hover:text-white"}`}><CatIcon name={s.lucide} className="h-4.5 w-4.5" /></span>
              {s.name} <span className={`text-xs font-normal ${on ? "text-white/80" : "text-slate-400"}`}>{n}</span>
            </Link>
          );
        })}
      </div>
      <Listing key={`${slug}|${activeSub}`} products={items} category={category} counts={counts} params={params} />
    </>
  );
}
