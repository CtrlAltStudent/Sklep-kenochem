import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, BadgePercent, FileText, Headset, ShieldAlert, Star, TriangleAlert } from "lucide-react";
import { getCategory, toCard, usableImages } from "@/lib/data";
import { getDescription, getFeatured, getProduct, getProducts } from "@/lib/catalog";
import { getReviews } from "@/lib/cms";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CatIcon } from "@/components/CatIcon";
import { ProductBuy } from "@/components/ProductBuy";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductTabs } from "@/components/ProductTabs";
import { ReviewForm } from "@/components/forms/Forms";
import { RecentlyViewed } from "@/components/ProductExtras";
import { JsonLd, productLd } from "@/components/JsonLd";

// Opinie i stany z panelu – strona odświeżana co minutę
export const revalidate = 60;

// Przy budowaniu generujemy z góry tylko polecane produkty – resztę przy pierwszym wejściu.
export async function generateStaticParams() {
  return (await getFeatured()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/produkt/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProduct(slug);
  return { title: p?.name, description: p?.short, openGraph: p?.images[0] ? { images: [p.images[0]] } : undefined };
}

function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  return (
    <span className="flex" aria-label={`${value.toFixed(1)} na 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${className} ${value >= n - 0.25 ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
      ))}
    </span>
  );
}

export default async function ProductPage(props: PageProps<"/produkt/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const [desc, reviews, products] = await Promise.all([getDescription(slug), getReviews(slug), getProducts()]);
  const description = desc.html;
  const category = getCategory(product.category)!;
  const sub = category.children.find((s) => s.slug === product.subcategory);
  const type = sub?.types.find((t) => t.slug === product.type);
  const related = products
    .filter((p) => p.subcategory === product.subcategory && p.slug !== product.slug && usableImages(p.images).length)
    .slice(0, 4);

  const spec = [
    ["Marka", product.brand],
    ["Kategoria", [category.name, sub?.name, type?.name].filter(Boolean).join(" › ")],
    ["Pojemność / wariant", product.variants[0].label],
    ["Kod SKU", product.sku],
    ["EAN", product.ean],
    ["Stawka VAT", `${product.vat}%`],
    ["Dostępność", product.stock > 0 ? `${product.stock} szt. w magazynie` : "na zamówienie"],
  ].filter(([, v]) => v);
  const keySpec = [
    ["Pojemność", product.variants[0].label],
    ["Marka", product.brand],
    ["SKU", product.sku],
    ["EAN", product.ean],
  ].filter((r): r is [string, string] => Boolean(r[1]));


  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <JsonLd data={productLd(product, [
        { name: "Strona główna", url: "/" },
        { name: category.name, url: `/kategoria/${category.slug}` },
        ...(sub ? [{ name: sub.name, url: `/kategoria/${category.slug}?sub=${sub.slug}` }] : []),
        ...(sub && type ? [{ name: type.name, url: `/kategoria/${category.slug}?sub=${sub.slug}&typ=${type.slug}` }] : []),
        { name: product.name, url: `/produkt/${product.slug}` },
      ], reviews)} />
      <Breadcrumbs items={[
        { label: category.name, href: `/kategoria/${category.slug}` },
        ...(sub ? [{ label: sub.name, href: `/kategoria/${category.slug}?sub=${sub.slug}` }] : []),
        ...(sub && type ? [{ label: type.name, href: `/kategoria/${category.slug}?sub=${sub.slug}&typ=${type.slug}` }] : []),
        { label: product.name },
      ]} />

      <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_370px]">
        {/* GÓRA: galeria + najważniejsze informacje w jednej karcie */}
        <div className="grid gap-6 rounded-3xl bg-white p-4 ring-1 ring-brand-100 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:col-start-1">
          <ProductGallery images={usableImages(product.images)} alt={product.name} />

          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-center gap-2">
              {product.brand && <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold tracking-wide text-brand-800 uppercase ring-1 ring-brand-100">{product.brand}</span>}
              {sub && (
                <Link href={`/kategoria/${category.slug}?sub=${sub.slug}`} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-brand-100 hover:text-brand-800">
                  <CatIcon name={sub.lucide} className="h-3.5 w-3.5" /> {sub.name}
                </Link>
              )}
            </div>
            <h1 className="mt-3 text-2xl leading-tight font-black tracking-tight text-navy xl:text-[1.75rem]">{product.name}</h1>
            <a href="#opinie" className="mt-2 flex w-fit items-center gap-2 text-sm hover:underline">
              <Stars value={reviews.average} />
              {reviews.count ? <span><b>{reviews.average.toFixed(1)}</b> · {reviews.count} opinii</span> : <span className="text-slate-500">Brak opinii – bądź pierwszy</span>}
            </a>
            {product.short && <p className="mt-4 line-clamp-4 text-[15px] leading-relaxed text-slate-600">{product.short}</p>}
            <a href="#opis" className="mt-2 inline-flex w-fit items-center gap-1 text-sm font-bold text-accent-dark hover:underline">Czytaj pełny opis <ArrowDown className="h-4 w-4" /></a>

            {/* Najważniejsze parametry – jedna przejrzysta tabelka */}
            <dl className="mt-5 grid overflow-hidden rounded-2xl text-sm ring-1 ring-brand-100 sm:grid-cols-2">
              {keySpec.map(([k, v], i) => (
                <div key={k} className={`flex items-center justify-between gap-3 bg-white px-4 py-2.5 ${i > 0 ? "border-t border-brand-100" : ""} ${i === 1 ? "sm:border-t-0" : ""} ${i % 2 === 0 ? "sm:border-r sm:border-brand-100" : ""}`}>
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="truncate font-semibold text-ink tabular-nums" title={v}>{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <a href="#bezpieczenstwo" className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-slate-600 ring-1 ring-brand-100 transition hover:text-brand-800 hover:ring-leaf"><FileText className="h-4 w-4 text-leaf" /> Karta charakterystyki</a>
              <a href="tel:+48500021705" className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-slate-600 ring-1 ring-brand-100 transition hover:text-brand-800 hover:ring-leaf"><Headset className="h-4 w-4 text-leaf" /> Porada eksperta: 500 021 705</a>
            </div>

            {/* B2B – mocniej eksponowane, wypełnia wolne miejsce pod opisem */}
            <Link href="/b2b" className="group bg-kc-gradient-deep relative mt-auto flex items-center gap-4 overflow-hidden rounded-2xl p-4 text-white shadow-lg shadow-brand-900/20 sm:mt-6 lg:mt-auto">
              <span className="bg-kc-gradient grid h-11 w-11 shrink-0 place-items-center rounded-xl shadow-lg"><BadgePercent className="h-5.5 w-5.5" /></span>
              <span className="min-w-0 flex-1">
                <b className="block text-sm">Kupujesz dla firmy? Ceny hurtowe B2B</b>
                <span className="text-xs text-white/75">Indywidualne rabaty, faktura z terminem płatności, opiekun handlowy.</span>
              </span>
              <span className="hidden shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-brand-900 transition group-hover:bg-leaf group-hover:text-white sm:inline">Załóż konto</span>
            </Link>
          </div>
        </div>

        {/* PRAWA KOLUMNA: koszyk przyklejony przy przewijaniu */}
        <aside className="lg:sticky lg:top-44 lg:col-start-2 lg:row-span-2 lg:row-start-1"><ProductBuy product={product} /></aside>

        {/* DÓŁ: zakładki – treść podmienia się w miejscu */}
        <div className="min-w-0 lg:col-start-1">
          <ProductTabs tabs={[
            { id: "opis", label: "Opis produktu", content: (<>
          <h2 className="sr-only">Opis produktu – {product.name}</h2>
          {description ? (
            <div className="prose prose-slate max-w-none prose-headings:text-navy prose-h2:text-xl prose-strong:text-ink prose-img:rounded-xl prose-a:text-accent-dark" dangerouslySetInnerHTML={{ __html: description }} />
          ) : (
            <p className="text-slate-500">Opis produktu zostanie wkrótce uzupełniony.</p>
          )}
        </>) },
            { id: "specyfikacja", label: "Specyfikacja", content: (<>
          <h2 className="sr-only">Specyfikacja</h2>
          <dl className="grid overflow-hidden rounded-2xl ring-1 ring-brand-100 sm:grid-cols-2">
            {spec.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-brand-50 px-5 py-3.5 text-sm odd:bg-brand-50/40">
                <dt className="text-slate-500">{k}</dt><dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </>) },
            { id: "bezpieczenstwo", label: "Pliki i bezpieczeństwo", content: (<>
          <h2 className="sr-only">Pliki do pobrania i bezpieczeństwo</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <a className="flex cursor-pointer items-center gap-4 rounded-2xl p-5 ring-1 ring-brand-100 transition hover:bg-brand-50">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-600"><FileText className="h-6 w-6" /></span>
              <span><b className="block text-navy">Karta charakterystyki (SDS)</b><span className="text-sm text-slate-500">PDF – na życzenie wyślemy e-mailem</span></span>
            </a>
            <div className="flex items-center gap-4 rounded-2xl p-5 ring-1 ring-brand-100">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700"><ShieldAlert className="h-6 w-6" /></span>
              <span className="text-sm text-slate-600"><b className="block text-navy">Odpowiedzialność za produkt (GPSR)</b>KENOCHEM Kuczyński Sp. J., Gen. Wł. Andersa 40, 15-113 Białystok</span>
            </div>
          </div>
          <p className="mt-5 flex gap-2 text-sm text-slate-600"><TriangleAlert className="h-5 w-5 shrink-0 text-amber-500" /> Przed użyciem przeczytaj etykietę i kartę charakterystyki. Przechowuj w miejscu niedostępnym dla dzieci, stosuj rękawice ochronne.</p>
        </>) },
            { id: "opinie", label: `Opinie (${reviews.count})`, content: (<>
          <h2 className="sr-only">Opinie klientów</h2>
          <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            <div className="rounded-2xl bg-brand-50 p-6 text-center lg:self-start">
              <p className="text-5xl font-black text-navy">{reviews.count ? reviews.average.toFixed(1) : "–"}</p>
              <div className="mt-2 flex justify-center"><Stars value={reviews.average} className="h-5 w-5" /></div>
              <p className="mt-1 text-sm text-slate-500">{reviews.count} {reviews.count === 1 ? "opinia" : "opinii"}</p>
              <div className="mt-5 space-y-1.5 text-left">
                {reviews.histogram.map((n, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-6 font-semibold">{5 - i}★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-white"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${reviews.count ? (n / reviews.count) * 100 : 0}%` }} /></span>
                    <span className="w-5 text-right text-slate-500">{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {reviews.reviews.map((r) => (
                <article key={r.id} className="rounded-2xl p-5 ring-1 ring-brand-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Stars value={r.rating} />
                    <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString("pl-PL")}</span>
                  </div>
                  <h3 className="mt-2 font-bold text-navy">{r.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{r.content}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{r.author}{r.verified && <span className="ml-2 text-green-700">✔ potwierdzony zakup</span>}</p>
                  {r.reply && <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-slate-700"><b className="text-brand-800">Odpowiedź Kenochem:</b> {r.reply}</p>}
                </article>
              ))}
              <details className="group rounded-2xl ring-1 ring-brand-100" open={!reviews.count}>
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-bold text-navy">
                  Napisz opinię o produkcie <span className="text-accent transition group-open:rotate-45">＋</span>
                </summary>
                <div className="px-5 pb-6"><ReviewForm productSlug={product.slug} /></div>
              </details>
            </div>
          </div>
        </>) },
          ]} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-extrabold text-navy">Podobne produkty</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {related.map((p) => <ProductCard key={p.slug} product={toCard(p)} />)}
          </div>
        </section>
      )}
      <RecentlyViewed current={toCard(product)} />
    </div>
  );
}
