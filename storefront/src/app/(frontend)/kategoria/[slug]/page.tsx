import { Fragment, Suspense, cache } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { toCard, usableImages } from "@/lib/data";
import { categoryPhoto } from "@/lib/photos";
import { getByCategory, getCategoryCounts, getShopCategories } from "@/lib/catalog";
import { findRedirect, getCms, getPosts } from "@/lib/cms";
import { getLayout } from "@/integrations/vault";
import { ProductGrid } from "@/components/home/HomeBits";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Listing } from "@/components/Listing";
import { RichContent } from "@/components/RichContent";
import { JsonLd } from "@/components/JsonLd";
import { siteBase } from "@/lib/site";

export async function generateStaticParams() {
  return (await getShopCategories()).map((c) => ({ slug: c.slug }));
}

type Tree = Awaited<ReturnType<typeof getShopCategories>>;

// Który poziom kategorii pokazujemy: dział, podkategoria (?sub=) czy typ (&typ=). Nieznane ?sub= / &typ= są pomijane.
function levelOf(tree: Tree, slug: string, sp: Record<string, string | string[] | undefined>) {
  const c = tree.find((x) => x.slug === slug);
  if (!c) return undefined;
  const sub = c.children.find((s) => s.slug === sp.sub);
  const type = sub?.types.find((t) => t.slug === sp.typ);
  const href = `/kategoria/${c.slug}${sub ? `?sub=${sub.slug}${type ? `&typ=${type.slug}` : ""}` : ""}`;
  // Ścieżka od działu do wybranego poziomu – do okruszków i danych dla Google
  const path = [
    { name: c.name, href: `/kategoria/${c.slug}` },
    ...(sub ? [{ name: sub.name, href: `/kategoria/${c.slug}?sub=${sub.slug}` }] : []),
    ...(sub && type ? [{ name: type.name, href }] : []),
  ];
  return { c, sub, type, href, path, name: (type ?? sub ?? c).name, levelSlug: (type ?? sub ?? c).slug };
}

// Opis i pola SEO kategorii z panelu – każdy poziom (dział, podkategoria, typ) ma własny dokument
const getCategoryDoc = cache(async (slug: string) => {
  const payload = await getCms();
  const doc = (await payload.find({ collection: "categories", where: { slug: { equals: slug } }, limit: 1, depth: 0, select: { description: true, seo: true } })).docs[0];
  return doc;
});

// Pusty edytor zapisuje akapit bez tekstu – taki opis traktujemy jak brak opisu
const hasText = (d: unknown) => /"text":"[^"]*\S/.test(JSON.stringify(d ?? null));

// Podkategoria (?sub=) i typ (&typ=) mają własny tytuł, opis i adres kanoniczny – Google traktuje je jak osobne strony,
// a filtry (marka, cena, sortowanie) wskazują kanonicznie na stronę bez filtrów. Tytuł i opis z panelu mają pierwszeństwo.
export async function generateMetadata(props: PageProps<"/kategoria/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const lvl = levelOf(await getShopCategories(), slug, await props.searchParams);
  if (!lvl) return {};
  const { c, sub, type } = lvl;
  // Kolejne strony listy (?strona=2) są osobnymi adresami z własnym adresem kanonicznym
  const sp = await props.searchParams;
  const page = Math.max(1, Number.parseInt(typeof sp.strona === "string" ? sp.strona : "", 10) || 1);
  const canonical = page > 1 ? `${lvl.href}${lvl.href.includes("?") ? "&" : "?"}strona=${page}` : lvl.href;
  const seo = (await getCategoryDoc(lvl.levelSlug))?.seo;
  const name = seo?.title?.trim() || (type ? `${type.name} – ${sub!.name}` : sub ? `${sub.name} – ${c.name}` : c.name);
  const description = seo?.description?.trim() || (type
    ? `${type.name} (${sub!.name.toLowerCase()}) w sklepie SONAX Białystok. Oryginalne produkty, wysyłka 24h InPost i ORLEN Paczka.`
    : sub
      ? `${sub.name}: ${sub.types.slice(0, 6).map((t) => t.name.toLowerCase()).join(", ")}. Sklep SONAX Białystok – wysyłka 24h.`
      : `${c.name} – ${c.children.map((s) => s.name).join(", ")}. Sklep Sonax Białystok, wysyłka InPost.`);
  const pageNote = page > 1 ? ` – strona ${page}` : "";
  return {
    title: `${name}${pageNote}`,
    description: page > 1 ? `${description.replace(/\.?$/, ".")} Strona ${page}.` : description,
    alternates: { canonical },
    robots: seo?.noindex ? { index: false, follow: true } : undefined,
    openGraph: { type: "website", siteName: "Sklep Sonax", locale: "pl_PL", title: name, description, images: [categoryPhoto[c.slug] || "/sonax/logo.png"] },
  };
}

export default async function CategoryPage(props: PageProps<"/kategoria/[slug]">) {
  await connection();
  const { slug } = await props.params;
  const category = (await getShopCategories()).find((c) => c.slug === slug);
  if (!category) {
    const r = await findRedirect(`/kategoria/${decodeURIComponent(slug)}`);
    if (r) (r.permanent ? permanentRedirect : redirect)(r.to);
    notFound();
  }
  const lvl = levelOf(await getShopCategories(), slug, await props.searchParams)!;
  const [items, counts, levelDoc, mainDoc, posts] = await Promise.all([
    getByCategory(slug), getCategoryCounts(), getCategoryDoc(lvl.levelSlug), getCategoryDoc(slug), getPosts(),
  ]);
  // Opis wybranego poziomu; podkategoria bez własnego opisu pokazuje opis działu
  const own = hasText(levelDoc?.description);
  const description = own ? levelDoc?.description : hasText(mainDoc?.description) ? mainDoc?.description : undefined;
  const descriptionTitle = own && lvl.sub ? `O kategorii: ${lvl.name}` : `O dziale: ${category.name}`;
  const shown = items.filter((p) => (!lvl.sub || p.subcategory === lvl.sub.slug) && (!lvl.type || p.type === lvl.type.slug));
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
        <h2 className="mb-4 text-2xl font-extrabold text-navy">{descriptionTitle}</h2>
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

  const origin = siteBase();
  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Sklep", item: origin },
          ...lvl.path.map((s, i) => ({ "@type": "ListItem", position: i + 2, name: s.name, item: `${origin}${s.href}` })),
        ] },
        { "@context": "https://schema.org", "@type": "CollectionPage", name: lvl.name, url: `${origin}${lvl.href}`,
          mainEntity: { "@type": "ItemList", numberOfItems: shown.length, itemListElement: shown.slice(0, 24).map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: `${origin}/produkt/${p.slug}` })) } },
      ]} />
      <Breadcrumbs items={lvl.path.map((s, i) => (i === lvl.path.length - 1 ? { label: s.name } : { label: s.name, href: s.href }))} />

      <header className="mt-3 mb-5 border-b border-brand-100 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{lvl.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{shown.length.toLocaleString("pl-PL")} produktów</p>
      </header>

      {getLayout("category").filter((s) => s.visible).map((s) => <Fragment key={s.id}>{blocks[s.id] || null}</Fragment>)}
    </div>
  );
}

async function CategoryListing({ searchParams, slug, items, counts }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>; slug: string; items: ReturnType<typeof toCard>[]; counts: Record<string, number>;
}) {
  const params = await searchParams;
  const category = (await getShopCategories()).find((c) => c.slug === slug)!;
  const activeSub = typeof params.sub === "string" ? params.sub : "";
  const activeType = typeof params.typ === "string" ? params.typ : "";
  const activeSubDef = category.children.find((s) => s.slug === activeSub);
  const subs = category.children.filter((s) => counts[`${slug}/${s.slug}`]);
  const pickedType = activeSubDef?.types.find((t) => t.slug === activeType);
  const subNav = () => subs.length > 0 && (
    <nav aria-label="Podkategorie" className="flex flex-wrap gap-2">
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
  );
  const typeNav = () => activeSubDef && (
    <div className="flex flex-wrap gap-x-1 gap-y-1">
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
  );
  return (
    <>
      {(subs.length > 0 || activeSubDef) && (
        <details className="group mb-4 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-bold text-navy ring-1 ring-brand-100 [&::-webkit-details-marker]:hidden">
            <span>{pickedType ? `${activeSubDef!.name}: ${pickedType.name}` : activeSubDef ? activeSubDef.name : "Podkategorie"} <span className="font-normal text-slate-400">{subs.length}</span></span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-3">
            {subNav()}
            {typeNav()}
          </div>
        </details>
      )}
      {subs.length > 0 && <div className="mb-5 hidden lg:block">{subNav()}</div>}
      {activeSubDef && <div className="-mt-2 mb-5 hidden border-b border-brand-100 pb-4 lg:block">{typeNav()}</div>}
      <Listing key={`${slug}|${activeSub}|${activeType}`} products={items} category={category} counts={counts} params={params} paged />
    </>
  );
}
