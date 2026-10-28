import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Headset, ShieldCheck, Store, Truck } from "lucide-react";
import { categories, freeShippingFrom, formatPrice, mediaPath, toCard, usableImages } from "@/lib/data";
import { getBrands, getCategoryCounts, getDeals, getFeatured, getFeaturedTitle, getNewest, getProducts } from "@/lib/catalog";
import { CatIcon } from "@/components/CatIcon";
import { categoryPhoto } from "@/lib/photos";
import { ProductGrid, Reveal } from "@/components/home/HomeBits";
import { UsageFinder } from "@/components/home/UsageFinder";
import { HomeReviews } from "@/components/home/HomeReviews";
import { getHomepage, getLatestReviews, getPosts, getStoreSettings, postDate } from "@/lib/cms";
import { HeroSlider, type Slide } from "@/components/home/HeroSlider";
import type { Media } from "@/payload-types";
import { getLayout } from "@/integrations/vault";

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

// Obraz z panelu (rozmiar „banner”, inaczej oryginał)
const mediaSrc = (m: unknown, size: "banner" | "card" | "thumb" = "banner") => {
  const media = typeof m === "object" && m ? (m as Media) : null;
  return mediaPath(media?.sizes?.[size]?.url ?? media?.url);
};
// Baner widoczny dziś (pola „Pokazuj od / do” w panelu)
const activeNow = (from?: string | null, to?: string | null) => {
  const now = Date.now();
  return (!from || new Date(from).getTime() <= now) && (!to || new Date(to).getTime() + 86_400_000 > now);
};

const perks = (freeShipping: number) => [
  { icon: Truck, title: "Wysyłka w 1 dzień roboczy", text: "InPost i ORLEN Paczka" },
  { icon: Store, title: "Odbiór w Białymstoku", text: "ul. Gen. Andersa 40" },
  { icon: ShieldCheck, title: `Darmowa dostawa od ${formatPrice(freeShipping)}`, text: "BLIK, karta, przelew" },
  { icon: Headset, title: "Doradztwo Pn–Pt 8–16", text: "500 021 705" },
];

export default async function Home() {
  const [counts, featured, featuredTitle, newest, dealsAll, products, reviews, brands, posts, store, home] = await Promise.all([
    getCategoryCounts(), getFeatured(), getFeaturedTitle(), getNewest(), getDeals(), getProducts(), getLatestReviews(), getBrands(), getPosts(), getStoreSettings(), getHomepage(),
  ]);
  const slides: Slide[] = (home?.slides ?? [])
    .filter((s) => activeNow(s.activeFrom, s.activeTo))
    .map((s) => ({ image: mediaSrc(s.image) ?? "", kicker: s.kicker ?? undefined, title: s.title ?? undefined, text: s.text ?? undefined, ctaLabel: s.ctaLabel ?? undefined, link: s.link }))
    .filter((s) => s.image);
  // Atuty pod banerem: z panelu (do 4), a gdy puste – domyślne
  const defaultPerks = perks(freeShippingFrom(store));
  const perkList = home?.perks?.length
    ? home.perks.map((p, i) => ({ icon: defaultPerks[i % 4].icon, image: mediaSrc(p.icon, "thumb"), title: p.title, text: p.text ?? "" }))
    : defaultPerks.map((p) => ({ ...p, image: undefined as string | undefined }));
  const promo = home?.promoBanner?.title ? home.promoBanner : null;
  const promoImg = promo ? mediaSrc(promo.image) : undefined;
  const withImg = (list: typeof products) => list.filter((p) => usableImages(p.images).length);
  const deals = withImg(dealsAll).slice(0, 8);
  const featuredCards = withImg(featured.length ? featured : products).slice(0, 8);
  const total = products.length;
  const articles = posts.filter((p) => p.tag !== "poradnik").slice(0, 3);

  // Sekcje strony – kolejność i widoczność z panelu (Treści i wygląd → Układ strony, src/lib/layoutSections.ts)
  const contained = (node: React.ReactNode) => <div className="mx-auto max-w-shop px-4 py-8 sm:py-10"><Reveal>{node}</Reveal></div>;
  const sections: Record<string, React.ReactNode> = {
    hero: slides.length > 0 ? <><h1 className="sr-only">Sklep SONAX – chemia i kosmetyki do auta</h1><HeroSlider slides={slides} /></> : (
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
    ),

    perks: (
      <div className="border-b border-brand-100 bg-white">
        <div className="mx-auto grid max-w-shop grid-cols-2 gap-px sm:grid-cols-4">
          {perkList.map(({ icon: Icon, image, title, text }) => (
            <div key={title} className="flex items-start gap-3 px-4 py-5 sm:px-5">
              {/* eslint-disable-next-line @next/next/no-img-element -- mała ikona z panelu */}
              {image ? <img src={image} alt="" className="mt-0.5 h-5 w-5 shrink-0 object-contain" /> : <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />}
              <div>
                <p className="text-sm font-bold text-navy">{title}</p>
                <p className="text-xs text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),

    categories: contained(<>
      <SectionTitle kicker="Kategorie" title="Co chcesz zrobić?" />
      {/* 7 kategorii: telefon – pierwsza na całą szerokość + pary, tablet – 1 + 3 + 3, komputer – 3 duże + 4 mniejsze */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-12 lg:gap-4">
        {categories.map((c, i) => (
          <Link key={c.slug} href={`/kategoria/${c.slug}`}
            className={`group relative isolate flex flex-col justify-end overflow-hidden rounded-2xl p-4 text-white sm:p-5 ${
              i === 0 ? "col-span-2 min-h-[170px] sm:col-span-3" : "min-h-[150px] sm:min-h-[170px]"
            } ${i < 3 ? "lg:col-span-4 lg:min-h-[240px]" : "lg:col-span-3 lg:min-h-[200px]"}`}>
            <Image src={categoryPhoto[c.slug]} alt="" fill sizes={i < 3 ? "(min-width: 1024px) 33vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"} className="-z-10 object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />
            <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur-sm lg:h-11 lg:w-11">
              <CatIcon name={c.lucide} className="h-5 w-5" />
            </span>
            <h3 className="text-base leading-tight font-extrabold sm:text-lg lg:text-xl">{c.name}</h3>
            <p className="mt-1 text-xs text-white/75 sm:text-sm">{(counts[c.slug] ?? 0).toLocaleString("pl-PL")} produktów</p>
          </Link>
        ))}
      </div>
    </>),

    usage: contained(<UsageFinder counts={counts} />),

    featured: featuredCards.length > 0 && contained(<>
      <SectionTitle kicker="Polecamy" title={featuredTitle} href="/marki/sonax" />
      <ProductGrid products={featuredCards.map(toCard)} />
    </>),

    deals: deals.length > 0 && contained(<>
      <SectionTitle kicker="Promocje" title="Obniżone ceny" href="/promocje" />
      <ProductGrid products={deals.map(toCard)} />
    </>),

    promo: promo && contained(
      <Link href={promo.link || "/promocje"} className="group relative isolate flex min-h-[220px] items-center overflow-hidden rounded-3xl bg-navy text-white">
        {promoImg && <Image src={promoImg} alt="" fill sizes="(min-width: 1280px) 1200px, 100vw" className="-z-10 object-cover transition duration-700 group-hover:scale-105" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/70 to-transparent" />
        <div className="max-w-xl px-6 py-10 sm:px-10">
          {promo.kicker && <p className="text-xs font-bold tracking-widest text-white/70 uppercase">{promo.kicker}</p>}
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{promo.title}</h2>
          {promo.text && <p className="mt-3 text-white/80">{promo.text}</p>}
          {promo.ctaLabel && <span className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-bold group-hover:bg-accent-dark">{promo.ctaLabel} <ArrowRight className="h-4 w-4" /></span>}
        </div>
      </Link>,
    ),

    newest: newest.length > 0 && contained(<>
      <SectionTitle kicker="Magazyn" title="Nowości" href="/nowosci" />
      <ProductGrid products={newest.slice(0, 8).map(toCard)} />
    </>),

    brands: brands.length > 0 && (
      <section className="my-8 border-y border-brand-100 bg-white py-10">
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
    ),

    reviews: contained(<HomeReviews data={reviews} />),

    about: contained(
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
      </section>,
    ),

    blog: articles.length > 0 && contained(<>
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
    </>),
  };

  return (
    <div className="pb-8">
      {getLayout("home").filter((s) => s.visible).map((s) => <Fragment key={s.id}>{sections[s.id] || null}</Fragment>)}
    </div>
  );
}
