import { Fragment, Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categories, getCategory, toCard, usableImages } from "@/lib/data";
import { getByCategory, getCategoryCounts } from "@/lib/catalog";
import { getCms, getPosts } from "@/lib/cms";
import { getLayout } from "@/integrations/vault";
import { ProductGrid } from "@/components/home/HomeBits";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Listing } from "@/components/Listing";
import { RichContent } from "@/components/RichContent";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

// Podkategoria (?sub=) i typ (&typ=) mają własny tytuł, opis i adres kanoniczny – Google traktuje je jak osobne strony,
// a filtry (marka, cena, sortowanie) wskazują kanonicznie na stronę bez filtrów.
export async function generateMetadata(props: PageProps<"/kategoria/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const sp = await props.searchParams;
  const c = getCategory(slug);
  if (!c) return {};
  const sub = c.children.find((s) => s.slug === sp.sub);
  const type = sub?.types.find((t) => t.slug === sp.typ);
  const canonical = `/kategoria/${c.slug}${sub ? `?sub=${sub.slug}${type ? `&typ=${type.slug}` : ""}` : ""}`;
  const name = type ? `${type.name} – ${sub!.name}` : sub ? `${sub.name} – ${c.name}` : c.name;
  const description = type
    ? `${type.name} (${sub!.name.toLowerCase()}) w sklepie SONAX Białystok. Oryginalne produkty, wysyłka w 24 h InPost i ORLEN Paczka.`
    : sub
      ? `${sub.name}: ${sub.types.slice(0, 6).map((t) => t.name.toLowerCase()).join(", ")}. Sklep SONAX Białystok – wysyłka w 24 h.`
      : `${c.name} – ${c.children.map((s) => s.name).join(", ")}. Sklep Sonax Białystok, wysyłka InPost.`;
  return { title: name, description, alternates: { canonical } };
}

async function getCategoryDescription(slug: string) {
  const payload = await getCms();
  const doc = (await payload.find({ collection: "categories", where: { slug: { equals: slug } }, limit: 1, depth: 0, select: { description: true } })).docs[0];
  return doc?.description;
}

export default async function CategoryPage(props: PageProps<"/kategoria/[slug]">) {
  const { slug } = await props.params;
  const category = getCategory(slug);
  if (!category) notFound();
  const [items, counts, description, posts] = await Promise.all([getByCategory(slug), getCategoryCounts(), getCategoryDescription(slug), getPosts()]);
  const bestsellers = items.filter((p) => p.badges?.includes("bestseller") && p.stock > 0 && usableImages(p.images).length).slice(0, 4);

  // Bloki widoku kategorii – kolejność i widoczność z panelu (Treści i wygląd → Układ strony)
  const blocks: Record<string, React.ReactNode> = {
    listing: (
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-white" />}>
        <CategoryListing searchParams={props.searchParams} slug={slug} items={items.map(toCard)} counts={counts} />
      </Suspense>
    ),
    bestsellers: bestsellers.length > 0 && (
      <section className="mt-14">
        <h2 className="mb-6 text-2xl font-extrabold text-navy">Najczęściej wybierane: {category.name.toLowerCase()}</h2>
        <ProductGrid products={bestsellers.map(toCard)} />
      </section>
    ),
    description: description && (
      <section className="mt-16 rounded-xl bg-white p-6 ring-1 ring-brand-100 sm:p-10">
        <RichContent data={description} />
      </section>
    ),
    guides: posts.length > 0 && (
      <section className="mt-14">
        <h2 className="mb-6 text-2xl font-extrabold text-navy">Poradniki</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {posts.slice(0, 3).map((b) => (
            <Link key={b.id} href={`/blog/${b.slug}`} className="rounded-xl bg-white p-5 ring-1 ring-brand-100 hover:shadow-md">
              <h3 className="font-bold text-navy">{b.title}</h3>
              {b.excerpt && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{b.excerpt}</p>}
            </Link>
          ))}
        </div>
      </section>
    ),
  };

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: category.name }]} />

      <header className="mt-3 mb-5 border-b border-brand-100 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{category.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{items.length.toLocaleString("pl-PL")} produktów</p>
      </header>

      {getLayout("category").filter((s) => s.visible).map((s) => <Fragment key={s.id}>{blocks[s.id] || null}</Fragment>)}
    </div>
  );
}

async function CategoryListing({ searchParams, slug, items, counts }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>; slug: string; items: ReturnType<typeof toCard>[]; counts: Record<string, number>;
}) {
  const params = await searchParams;
  const category = getCategory(slug)!;
  const activeSub = typeof params.sub === "string" ? params.sub : "";
  const activeType = typeof params.typ === "string" ? params.typ : "";
  const activeSubDef = category.children.find((s) => s.slug === activeSub);
  const subs = category.children.filter((s) => counts[`${slug}/${s.slug}`]);
  return (
    <>
      {subs.length > 0 && (
        <nav aria-label="Podkategorie" className="mb-5 flex flex-wrap gap-2">
          <Link href={`/kategoria/${slug}`} scroll={false}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${!activeSub ? "bg-accent text-white" : "bg-white text-slate-700 ring-1 ring-brand-100 hover:ring-accent"}`}>
            Wszystkie
          </Link>
          {subs.map((s) => {
            const n = counts[`${slug}/${s.slug}`] ?? 0;
            const on = activeSub === s.slug;
            return (
              <Link key={s.slug} href={on ? `/kategoria/${slug}` : `/kategoria/${slug}?sub=${s.slug}`} scroll={false}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${on ? "bg-accent text-white" : "bg-white text-slate-700 ring-1 ring-brand-100 hover:ring-accent"}`}>
                {s.name} <span className={on ? "text-white/80" : "text-slate-400"}>{n}</span>
              </Link>
            );
          })}
        </nav>
      )}
      {activeSubDef && (
        <div className="-mt-2 mb-5 flex flex-wrap gap-x-1 gap-y-1 border-b border-brand-100 pb-4">
          {activeSubDef.types.map((ty) => {
            const n = counts[`${slug}/${activeSub}/${ty.slug}`] ?? 0;
            if (!n) return null;
            const on = activeType === ty.slug;
            return (
              <Link key={ty.slug} href={on ? `/kategoria/${slug}?sub=${activeSub}` : `/kategoria/${slug}?sub=${activeSub}&typ=${ty.slug}`} scroll={false}
                className={`px-3 py-1.5 text-[13px] font-semibold transition ${on ? "border-b-2 border-accent text-navy" : "text-slate-500 hover:text-navy"}`}>
                {ty.name} <span className="text-slate-400">{n}</span>
              </Link>
            );
          })}
        </div>
      )}
      <Listing key={`${slug}|${activeSub}|${activeType}`} products={items} category={category} counts={counts} params={params} />
    </>
  );
}
