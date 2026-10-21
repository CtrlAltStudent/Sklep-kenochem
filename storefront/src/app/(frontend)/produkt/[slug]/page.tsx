import { notFound, permanentRedirect, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, BookOpen, Download, FileText, Headset, ShieldAlert, Star, TriangleAlert } from "lucide-react";
import { brandSlug, getCategory, toCard, usableImages } from "@/lib/data";
import { getDescription, getProduct, getProducts, getSafety } from "@/lib/catalog";
import { findRedirect, getReviews } from "@/lib/cms";
import { Breadcrumbs } from "@/components/Breadcrumbs";
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
export function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: PageProps<"/produkt/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProduct(slug);
  return { title: p?.name, description: p?.short, openGraph: p?.images[0] ? { images: [p.images[0]] } : undefined };
}

// Opisy piktogramów GHS (pliki w public/ghs – domena publiczna, ONZ)
const ghsLabel: Record<string, string> = {
  GHS01: "Materiały wybuchowe", GHS02: "Łatwopalne", GHS03: "Utleniające", GHS04: "Gazy pod ciśnieniem", GHS05: "Żrące",
  GHS06: "Toksyczne", GHS07: "Drażniące / szkodliwe", GHS08: "Zagrożenie dla zdrowia", GHS09: "Niebezpieczne dla środowiska",
};

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
  if (!product) {
    const r = await findRedirect(`/produkt/${decodeURIComponent(slug)}`);
    if (r) (r.permanent ? permanentRedirect : redirect)(r.to);
    notFound();
  }
  const [desc, reviews, products, safety] = await Promise.all([getDescription(slug), getReviews(slug), getProducts(), getSafety(slug)]);
  const description = desc.html;
  // Produkt bez kategorii (albo z kategorią spoza menu) też musi się otworzyć – wtedy bez okruszków działu
  const category = getCategory(product.category);
  const sub = category?.children.find((s) => s.slug === product.subcategory);
  const type = sub?.types.find((t) => t.slug === product.type);
  const crumbs = category
    ? [
        { label: category.name, href: `/kategoria/${category.slug}` },
        ...(sub ? [{ label: sub.name, href: `/kategoria/${category.slug}?sub=${sub.slug}` }] : []),
        ...(sub && type ? [{ label: type.name, href: `/kategoria/${category.slug}?sub=${sub.slug}&typ=${type.slug}` }] : []),
      ]
    : [];
  const related = products
    .filter((p) => (product.subcategory ? p.subcategory === product.subcategory : p.category === product.category && Boolean(p.category)) && p.slug !== product.slug && usableImages(p.images).length)
    .slice(0, 4);

  const spec = [
    ["Marka", product.brand],
    ["Kategoria", [category?.name, sub?.name, type?.name].filter(Boolean).join(" › ")],
    ["Pojemność / wariant", product.variants[0].label],
    ["Kod SKU", product.sku],
    ["EAN", product.ean],
    ["Stawka VAT", `${product.vat}%`],
    ["Dostępność", product.stock > 0 ? `${product.stock} szt. w magazynie` : "na zamówienie"],
  ].filter(([, v]) => v);
  const meta = [product.brand, product.variants[0].label, product.sku && `SKU ${product.sku}`].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <JsonLd data={productLd(product, [
        { name: "Strona główna", url: "/" },
        ...crumbs.map((c) => ({ name: c.label, url: c.href })),
        { name: product.name, url: `/produkt/${product.slug}` },
      ], reviews)} />
      <Breadcrumbs items={[
        ...crumbs,
        { label: product.name },
      ]} />

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(300px,360px)] lg:gap-8">
        <ProductGallery images={usableImages(product.images)} alt={product.name} />

        <div className="min-w-0">
          {product.brand && <Link href={`/marki/${brandSlug(product.brand)}`} className="text-xs font-bold tracking-wide text-accent uppercase hover:underline">{product.brand}</Link>}
          <h1 className="mt-1 text-[1.65rem] leading-snug font-extrabold tracking-tight text-navy">{product.name}</h1>
          <a href="#opinie" className="mt-2 flex w-fit items-center gap-2 text-sm hover:underline">
            <Stars value={reviews.average} />
            {reviews.count ? <span><b>{reviews.average.toFixed(1)}</b> · {reviews.count} opinii</span> : <span className="text-slate-500">Brak opinii – bądź pierwszy</span>}
          </a>
          {meta && <p className="mt-3 text-sm text-slate-500">{meta}</p>}
          {product.short && <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{product.short}</p>}
          <a href="#opis" className="mt-2 inline-flex w-fit items-center gap-1 text-sm font-semibold text-accent hover:underline">Pełny opis <ArrowDown className="h-4 w-4" /></a>
          <div className="mt-6 flex flex-col gap-2 text-sm font-semibold text-slate-600">
            <a href={safety?.sds ?? "#bezpieczenstwo"} {...(safety?.sds ? { target: "_blank", rel: "noreferrer" } : {})} className="inline-flex items-center gap-1.5 hover:text-accent"><FileText className="h-4 w-4" /> {safety?.sds ? "Karta charakterystyki (PDF)" : "Karta charakterystyki"}</a>
            <a href="tel:+48500021705" className="inline-flex items-center gap-1.5 hover:text-accent"><Headset className="h-4 w-4" /> Porada: 500 021 705</a>
            <Link href="/blog" className="inline-flex items-center gap-1.5 hover:text-accent"><BookOpen className="h-4 w-4" /> Jak używać</Link>
          </div>
        </div>

        <div className="lg:sticky lg:top-28"><ProductBuy product={product} /></div>
      </div>

      <div className="mt-12 min-w-0">
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
            {safety?.sds ? (
              <a href={safety.sds} target="_blank" rel="noreferrer" download
                className="group flex items-center gap-4 rounded-2xl p-5 ring-1 ring-brand-100 transition hover:bg-leaf-50 hover:ring-leaf">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600"><FileText className="h-6 w-6" /></span>
                <span className="flex-1"><b className="block text-navy">Karta charakterystyki (SDS)</b><span className="text-sm text-slate-500">PDF · pobierz</span></span>
                <Download className="h-5 w-5 text-leaf transition group-hover:translate-y-0.5" />
              </a>
            ) : (
              <Link href={`/kontakt?produkt=${encodeURIComponent(`Karta charakterystyki: ${product.name}`)}`}
                className="group flex items-center gap-4 rounded-2xl p-5 ring-1 ring-brand-100 transition hover:bg-leaf-50 hover:ring-leaf">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600"><FileText className="h-6 w-6" /></span>
                <span className="flex-1"><b className="block text-navy">Karta charakterystyki (SDS)</b><span className="text-sm text-slate-500">Poproś o kartę – wyślemy ją e-mailem</span></span>
              </Link>
            )}
            <div className="flex items-center gap-4 rounded-2xl p-5 ring-1 ring-brand-100">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><ShieldAlert className="h-6 w-6" /></span>
              <span className="text-sm text-slate-600"><b className="block text-navy">Odpowiedzialność za produkt (GPSR)</b>KENOCHEM Kuczyński Sp. J., Gen. Wł. Andersa 40, 15-113 Białystok</span>
            </div>
          </div>
          {(safety?.pictograms.length || safety?.signal) ? (
            <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl bg-slate-50 p-5">
              {safety.signal && (
                <span className={`rounded-lg px-3 py-1.5 text-sm font-black tracking-wide uppercase ${safety.signal === "danger" ? "bg-red-600 text-white" : "bg-amber-400 text-amber-950"}`}>
                  {safety.signal === "danger" ? "Niebezpieczeństwo" : "Uwaga"}
                </span>
              )}
              {safety.pictograms.map((g) => (
                <span key={g} className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-500" title={ghsLabel[g] ?? g}>
                  <Image src={`/ghs/${g}.svg`} alt={ghsLabel[g] ?? g} width={56} height={56} unoptimized />
                  {g}
                </span>
              ))}
            </div>
          ) : null}
          {safety?.notes && <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-slate-600">{safety.notes}</p>}
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
                  {r.reply && <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-slate-700"><b className="text-brand-800">Odpowiedź sklepu Sonax:</b> {r.reply}</p>}
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
