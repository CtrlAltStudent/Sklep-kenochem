import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Headset, ShieldCheck, Store, Truck } from "lucide-react";
import { categories, freeShippingFrom, formatPrice, mediaPath, toCard, usableImages } from "@/lib/data";
import { getBrands, getCategoryCounts, getFeatured, getFeaturedTitle, getNewest, getOnSale, getProducts } from "@/lib/catalog";
import { CatIcon } from "@/components/CatIcon";
import { categoryPhoto } from "@/lib/photos";
import { ProductGrid, Reveal } from "@/components/home/HomeBits";
import { UsageFinder } from "@/components/home/UsageFinder";
import { HomeReviews } from "@/components/home/HomeReviews";
import { getLatestReviews, getPosts, getStoreSettings, postDate } from "@/lib/cms";
import type { Media } from "@/payload-types";

function SectionTitle({ title, href, kicker }: { title: string; href?: string; kicker?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {kicker && <p className="text-xs font-bold tracking-widest text-accent uppercase">{kicker}</p>}
        <h2 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-bold text-accent hover:gap-2">
          Wszystkie <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

const perks = (freeShipping: number) => [
  { icon: Truck, title: "Wysyłka w 1 dzień roboczy", text: "InPost i ORLEN Paczka" },
  { icon: Store, title: "Odbiór w Białymstoku", text: "ul. Gen. Andersa 40" },
  { icon: ShieldCheck, title: `Darmowa dostawa od ${formatPrice(freeShipping)}`, text: "BLIK, karta, przelew" },
  { icon: Headset, title: "Doradztwo Pn–Pt 8–16", text: "500 021 705" },
];

export default async function Home() {
  const [counts, featured, featuredTitle, newest, onSale, products, reviews, brands, posts, store] = await Promise.all([
    getCategoryCounts(), getFeatured(), getFeaturedTitle(), getNewest(), getOnSale(), getProducts(), getLatestReviews(), getBrands(), getPosts(), getStoreSettings(),
  ]);
  const withImg = (list: typeof products) => list.filter((p) => usableImages(p.images).length);
  const deals = withImg(onSale).slice(0, 8);
  const featuredCards = withImg(featured.length ? featured : products).slice(0, 8);
  const total = products.length;
  const articles = posts.filter((p) => p.tag !== "poradnik").slice(0, 3);

  return (
    <div className="pb-8">
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <Image src="/sonax/sonax-autoo-lite-2026-08-27.webp" alt="" fill priority sizes="100vw" className="-z-10 object-cover object-[70%_center]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy from-[15%] via-navy/80 to-navy/20" />
        <div className="mx-auto max-w-shop px-4 py-16 sm:py-24">
          <p className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Oficjalny sklep SONAX · Białystok</p>
          <h1 className="mt-4 max-w-xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            Chemia i kosmetyki<br />do auta
          </h1>
          <p className="mt-5 max-w-lg text-base text-white/80 sm:text-lg">
            {total.toLocaleString("pl-PL")} produktów do mycia, polerowania i ochrony. Większość zamówień wysyłamy w 1 dzień roboczy.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/kategoria/mycie-auta" className="rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent-dark">Przeglądaj chemię</Link>
            <Link href="/marki/sonax" className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-navy hover:bg-slate-100">Produkty SONAX</Link>
          </div>
        </div>
      </section>

      <div className="border-b border-brand-100 bg-white">
        <div className="mx-auto grid max-w-shop grid-cols-2 gap-px sm:grid-cols-4">
          {perks(freeShippingFrom(store)).map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3 px-4 py-5 sm:px-5">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-bold text-navy">{title}</p>
                <p className="text-xs text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-shop space-y-16 px-4 py-12 sm:space-y-20 sm:py-16">
        <Reveal>
          <SectionTitle kicker="Kategorie" title="Co chcesz zrobić?" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {categories.map((c) => (
              <Link key={c.slug} href={`/kategoria/${c.slug}`}
                className="group relative isolate flex min-h-[140px] flex-col justify-end overflow-hidden rounded-xl p-3 text-white">
                <Image src={categoryPhoto[c.slug]} alt="" fill sizes="(min-width: 1280px) 14vw, 50vw" className="-z-10 object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy/90 via-navy/35 to-transparent" />
                <span className="mb-2 grid h-8 w-8 place-items-center rounded-md bg-white/15 backdrop-blur-sm">
                  <CatIcon name={c.lucide} className="h-4 w-4" />
                </span>
                <h3 className="text-sm leading-tight font-bold">{c.name}</h3>
                <p className="mt-0.5 text-[11px] text-white/70">{(counts[c.slug] ?? 0).toLocaleString("pl-PL")} prod.</p>
              </Link>
            ))}
          </div>
        </Reveal>

        <Reveal><UsageFinder counts={counts} /></Reveal>

        {featuredCards.length > 0 && (
          <Reveal>
            <SectionTitle kicker="Polecamy" title={featuredTitle} href="/marki/sonax" />
            <ProductGrid products={featuredCards.map(toCard)} />
          </Reveal>
        )}

        {deals.length > 0 && (
          <Reveal>
            <SectionTitle kicker="Promocje" title="Obniżone ceny" href="/promocje" />
            <ProductGrid products={deals.map(toCard)} />
          </Reveal>
        )}

        {newest.length > 0 && (
          <Reveal>
            <SectionTitle kicker="Magazyn" title="Nowości" href="/nowosci" />
            <ProductGrid products={newest.slice(0, 8).map(toCard)} />
          </Reveal>
        )}
      </div>

      {brands.length > 0 && (
        <section className="border-y border-brand-100 bg-white py-10">
          <div className="mx-auto max-w-shop px-4">
            <p className="mb-5 text-center text-xs font-bold tracking-widest text-slate-400 uppercase">Marki w sklepie</p>
            <div className="flex flex-wrap justify-center gap-2">
              {brands.slice(0, 16).map((b) => (
                <Link key={b.slug} href={`/marki/${b.slug}`}
                  className="rounded-lg bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-brand-100 hover:text-accent hover:ring-accent">
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-shop space-y-16 px-4 py-12 sm:py-16">
        <Reveal><HomeReviews data={reviews} /></Reveal>

        <Reveal>
          <section className="grid overflow-hidden rounded-xl bg-white ring-1 ring-brand-100 lg:grid-cols-2">
            <div className="p-8 sm:p-10">
              <p className="text-xs font-bold tracking-widest text-accent uppercase">O nas</p>
              <h2 className="mt-2 text-3xl font-extrabold text-navy">Sklep SONAX z Białegostoku</h2>
              <p className="mt-4 leading-relaxed text-slate-600">Zaczynaliśmy od akcesoriów do pielęgnacji samochodów, a potem wprowadzaliśmy na polski rynek chemię SONAX. Dziś obsługujemy kierowców, studia detailingowe, myjnie i warsztaty – stacjonarnie i online.</p>
              <Link href="/o-nas" className="mt-6 inline-flex items-center gap-2 font-bold text-accent hover:gap-3">Poznaj nas <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="relative min-h-[240px] lg:min-h-0">
              <Image src="/sonax/sonax-autoo-lite-2026-08-27.webp" alt="Mycie samochodu" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
          </section>
        </Reveal>

        {articles.length > 0 && (
          <Reveal>
            <SectionTitle kicker="Wiedza" title="Poradniki z bloga" href="/blog" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((b) => {
                const cover = typeof b.cover === "object" ? (b.cover as Media | null) : null;
                const src = mediaPath(cover?.sizes?.card?.url ?? cover?.url);
                return (
                  <Link key={b.id} href={`/blog/${b.slug}`} className="group overflow-hidden rounded-xl bg-white ring-1 ring-brand-100 hover:shadow-md">
                    <div className="relative aspect-[16/10] bg-brand-100">
                      {src && <Image src={src} alt="" fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />}
                    </div>
                    <div className="p-4">
                      <time className="text-xs text-slate-400">{postDate(b.publishedAt)}</time>
                      <h3 className="mt-1 font-bold text-navy group-hover:text-accent">{b.title}</h3>
                      {b.excerpt && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{b.excerpt}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
