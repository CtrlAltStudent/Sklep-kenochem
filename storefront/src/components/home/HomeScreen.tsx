import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Headset, ShieldCheck, Store, Truck } from "lucide-react";
import { brandSlug, freeShippingFrom, formatPrice, mediaPath, toCard, usableImages, type Category, type IconName } from "@/lib/data";
import { getBrands, getCategoryCounts, getProductTotal, getProducts, getShopCategories, productsFromIds } from "@/lib/catalog";
import { ProductGrid, Reveal } from "@/components/home/HomeBits";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { ShopScene } from "@/components/home/ShopScene";
import { UsageFinder, type UsageChip } from "@/components/home/UsageFinder";
import { HomeReviews } from "@/components/home/HomeReviews";
import { BrandStrip } from "@/components/home/BrandStrip";
import { getHomepage, getLatestReviews, getPosts, getStoreSettings, postDate } from "@/lib/cms";
import { getGoogleReviews } from "@/integrations/vault";
import { HeroSlider, type Slide } from "@/components/home/HeroSlider";
import type { Media } from "@/payload-types";
import { getLayout } from "@/integrations/vault";
import { layoutFromIds } from "@/lib/layoutSections";
import type { TileStyle } from "@/lib/tileLayout";

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

const mediaSrc = (m: unknown, size: "banner" | "card" | "thumb" = "banner") => {
  const media = typeof m === "object" && m ? (m as Media) : null;
  return mediaPath(media?.sizes?.[size]?.url ?? media?.url);
};
const activeNow = (from?: string | null, to?: string | null) => {
  const now = Date.now();
  return (!from || new Date(from).getTime() <= now) && (!to || new Date(to).getTime() + 86_400_000 > now);
};
const perks = (freeShipping: number, phone: string, hours: string) => [
  { icon: Truck, title: "Wysyłka 24h", text: "InPost i ORLEN Paczka" },
  { icon: Store, title: "Odbiór w Białymstoku", text: "ul. Gen. Andersa 40" },
  { icon: ShieldCheck, title: `Darmowa dostawa od ${formatPrice(freeShipping)}`, text: "BLIK, karta, przelew" },
  { icon: Headset, title: `Doradztwo ${hours}`, text: phone.replace(/^\+48\s*/, "") },
];

const text = (v: unknown, fallback: string) => (typeof v === "string" && v.trim() ? v.trim() : fallback);

function autoTasks(departments: Category[], counts: Record<string, number>): UsageChip[] {
  const chips: UsageChip[] = [];
  for (const c of departments) {
    const subs = c.children.filter((s) => (counts[`${c.slug}/${s.slug}`] ?? 0) > 0);
    if (subs.length) {
      for (const s of subs) chips.push({ label: s.name, href: `/kategoria/${c.slug}?sub=${s.slug}`, icon: s.lucide, count: counts[`${c.slug}/${s.slug}`] ?? 0 });
    } else if ((counts[c.slug] ?? 0) > 0) {
      chips.push({ label: c.name, href: `/kategoria/${c.slug}`, icon: c.lucide, count: counts[c.slug] ?? 0 });
    }
  }
  return chips.sort((a, b) => (b.count ?? 0) - (a.count ?? 0)).slice(0, 14);
}

const STEP_PATHS: { label: string; icon: IconName; path: string }[] = [
  { label: "Owady i pre-wash", icon: "Bug", path: "mycie-auta/pre-wash-i-dekontaminacja/pre-wash-i-dekontaminacja-usuwanie-owadow" },
  { label: "Piana aktywna", icon: "Droplets", path: "mycie-auta/szampony-i-piany/szampony-i-piany-piany-aktywne" },
  { label: "Szampon", icon: "Droplets", path: "mycie-auta/szampony-i-piany/szampony-i-piany-szampony-samochodowe" },
  { label: "Dekontaminacja", icon: "FlaskConical", path: "mycie-auta/pre-wash-i-dekontaminacja" },
  { label: "Osuszanie", icon: "Wind", path: "akcesoria-detailingowe/mikrofibry-i-reczniki/mikrofibry-i-reczniki-reczniki-do-osuszania" },
  { label: "Polerowanie", icon: "Sparkles", path: "polerowanie-i-ochrona/pasty-polerskie" },
  { label: "Wosk", icon: "Sparkles", path: "polerowanie-i-ochrona/woski" },
  { label: "Powłoka i QD", icon: "ShieldCheck", path: "polerowanie-i-ochrona/powloki-i-quick-detailery" },
  { label: "Wnętrze", icon: "Armchair", path: "wnetrze-auta" },
  { label: "Akcesoria", icon: "SprayCan", path: "akcesoria-detailingowe" },
];

function stepHref(path: string) {
  const [cat, sub, typ] = path.split("/");
  return `/kategoria/${cat}${sub ? `?sub=${sub}` : ""}${typ ? `&typ=${typ}` : ""}`;
}

function defaultSteps(counts: Record<string, number>): UsageChip[] {
  return STEP_PATHS.flatMap((s) => (counts[s.path] ? [{ label: s.label, href: stepHref(s.path), icon: s.icon, count: counts[s.path] }] : []));
}

function customChips(list: { label?: string | null; url?: string | null; kind?: string | null; icon?: string | null }[] | null | undefined, kind: string): UsageChip[] {
  return (list ?? []).flatMap((s) => {
    if ((s.kind || "zadanie") !== kind || !s.label || !s.url) return [];
    return [{ label: s.label, href: s.url, icon: (s.icon || "Shapes") as IconName }];
  });
}

// draft = szkic z panelu (klienci go nie widzą). sectionIds = kolejność sekcji z edytora, zanim ktoś kliknie „Zapisz układ”.
export async function HomeScreen({ draft = false, sectionIds = null }: { draft?: boolean; sectionIds?: string[] | null }) {
  const [counts, products, productTotal, reviews, brands, posts, store, homeDoc, departments] = await Promise.all([
    getCategoryCounts(), getProducts(), getProductTotal(), getLatestReviews(), getBrands(), getPosts(), getStoreSettings(), getHomepage(draft), getShopCategories(),
  ]);
  const home = homeDoc as (typeof homeDoc & {
    categoryKicker?: string | null; categoryTitle?: string | null; categoryStyle?: string | null; categoryColumns?: string | null;
    showCategoryCount?: boolean | null; showCategoryIcon?: boolean | null;
    homeCategories?: ({ slug?: string | null } | number)[] | null;
    usageKicker?: string | null; usageTitle?: string | null; usageStepsTitle?: string | null;
    shortcuts?: { label?: string | null; url?: string | null; kind?: string | null; icon?: string | null }[] | null;
    dealsTitle?: string | null; newestTitle?: string | null; brandsTitle?: string | null;
    aboutKicker?: string | null; aboutTitle?: string | null; aboutText?: string | null; aboutLinkLabel?: string | null; aboutLink?: string | null; aboutImage?: unknown;
    sceneKicker?: string | null; sceneTitle?: string | null; sceneHint?: string | null;
    sceneImage?: unknown; sceneSpots?: { x?: number; y?: number; productIds?: number[] }[] | null;
  }) | null;

  const slides: Slide[] = (home?.slides ?? [])
    .filter((s) => activeNow(s.activeFrom, s.activeTo))
    .map((s) => ({ image: mediaSrc(s.image) ?? "", kicker: s.kicker ?? undefined, title: s.title ?? undefined, text: s.text ?? undefined, ctaLabel: s.ctaLabel ?? undefined, link: s.link }))
    .filter((s) => s.image);
  const defaultPerks = perks(freeShippingFrom(store), store.phone || "+48 664 953 377", store.hours || "Pn–Pt 8–16");
  const perkList = home?.perks?.length
    ? home.perks.map((p, i) => ({ icon: defaultPerks[i % 4].icon, image: mediaSrc(p.icon, "thumb"), title: p.title, text: p.text ?? "" }))
    : defaultPerks.map((p) => ({ ...p, image: undefined as string | undefined }));
  const promo = home?.promoBanner?.title ? home.promoBanner : null;
  const promoImg = promo ? mediaSrc(promo.image) : undefined;
  const withImg = (list: typeof products) => list.filter((p) => usableImages(p.images).length);
  const featuredChosen = productsFromIds(home?.featuredProducts, products);
  const featuredCards = withImg(featuredChosen.length ? featuredChosen : products.filter((p) => /^sonax$/i.test(p.brand))).slice(0, 8);
  const dealsChosen = productsFromIds(home?.promoProducts, products);
  const deals = withImg(dealsChosen.length ? dealsChosen : products.filter((p) => p.variants.some((v) => v.oldPrice))).slice(0, 8);
  const newestChosen = productsFromIds(home?.newestProducts, products);
  const newest = (newestChosen.length ? newestChosen : [...products].sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? ""))).slice(0, 8);
  const featuredTitle = home?.featuredTitle || "Wybór detailerów – SONAX";
  const brandLogos = (home?.brandLogos ?? []).flatMap((b) => {
    const src = mediaSrc(b.logo, "thumb");
    if (!src || !b.name) return [];
    return [{ name: b.name, src, href: b.link?.trim() || `/marki/${brandSlug(b.name)}` }];
  });
  const articles = posts.filter((p) => p.tag !== "poradnik").slice(0, 3);

  const picked = (home?.homeCategories ?? []).flatMap((c) => (typeof c === "object" && c?.slug ? [c.slug] : []));
  const tileCats = (picked.length ? picked.flatMap((slug) => { const c = departments.find((d) => d.slug === slug); return c ? [c] : []; }) : departments.filter((c) => (counts[c.slug] ?? 0) > 0));
  const style: TileStyle = home?.categoryStyle === "pierwsze" || home?.categoryStyle === "szerokie" ? home.categoryStyle : "rowne";
  const columns: 3 | 4 = home?.categoryColumns === "3" ? 3 : 4;
  const taskCustom = customChips(home?.shortcuts, "zadanie");
  const stepCustom = customChips(home?.shortcuts, "kroki");
  const tasks = taskCustom.length ? taskCustom : autoTasks(departments, counts);
  const steps = stepCustom.length ? stepCustom : defaultSteps(counts);
  const aboutImg = mediaSrc(home?.aboutImage, "card") || "/sonax/sonax-autoo-lite-2026-08-27.webp";

  const contained = (node: React.ReactNode) => <div className="mx-auto max-w-shop px-4 py-8 sm:py-10"><Reveal>{node}</Reveal></div>;
  const sections: Record<string, React.ReactNode> = {
    hero: slides.length > 0 ? <><h1 className="sr-only">Sklep SONAX – chemia i kosmetyki do auta</h1><HeroSlider slides={slides} /></> : (
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <Image src="/sonax/sonax-autoo-lite-2026-08-27.webp" alt="" fill priority sizes="100vw" className="-z-10 object-cover object-[70%_center]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy from-[15%] via-navy/80 to-navy/20" />
        <div className="mx-auto max-w-shop px-4 py-16 sm:py-24">
          <p className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">Oficjalny sklep SONAX · Białystok</p>
          <h1 className="mt-4 max-w-xl text-4xl font-extrabold tracking-tight sm:text-6xl">Chemia i kosmetyki<br />do auta</h1>
          <p className="mt-5 max-w-lg text-base text-white/80 sm:text-lg">{productTotal.toLocaleString("pl-PL")} produktów do mycia, polerowania i ochrony. Większość zamówień wysyłamy w 24h.</p>
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
          {perkList.map(({ icon: Icon, image, title, text: line }) => (
            <div key={title} className="flex items-start gap-3 px-4 py-5 sm:px-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {image ? <img src={image} alt="" className="mt-0.5 h-5 w-5 shrink-0 object-contain" /> : <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />}
              <div>
                <p className="text-sm font-bold text-navy">{title}</p>
                <p className="text-xs text-slate-500">{line}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    categories: tileCats.length > 0 && contained(<>
      <SectionTitle kicker={text(home?.categoryKicker, "Kategorie")} title={text(home?.categoryTitle, "Co chcesz zrobić?")} />
      <CategoryTiles categories={tileCats} counts={counts} style={style} columns={columns} showCount={home?.showCategoryCount !== false} showIcon={home?.showCategoryIcon !== false} />
    </>),
    scene: (() => {
      const saved = (Array.isArray(home?.sceneSpots) ? home.sceneSpots : []).flatMap((item) => {
        const x = Number(item?.x);
        const y = Number(item?.y);
        const cards = (item?.productIds ?? []).flatMap((id) => {
          const product = products.find((p) => p.id === String(id));
          return product ? [toCard(product)] : [];
        });
        return Number.isFinite(x) && Number.isFinite(y) && cards.length ? [{ x, y, products: cards }] : [];
      });
      const fallback = products.find((p) => p.slug === "kwazar-venus-opryskiwacz-2-l-360");
      const view = saved.length ? saved : fallback ? [{ x: 37.5, y: 72.5, products: [toCard(fallback)] }] : [];
      if (!view.length) return null;
      const picture = typeof home?.sceneImage === "object" && home.sceneImage ? mediaPath((home.sceneImage as { url?: string | null }).url) : "";
      return (
        <ShopScene
          kicker={text(home?.sceneKicker, "W warsztacie")}
          title={text(home?.sceneTitle, "Najedź na opryskiwacz")}
          hint={text(home?.sceneHint, "Na telefonie wystarczy dotknąć.")}
          image={picture || "/sonax/warsztat-venus.jpg"}
          spots={view}
        />
      );
    })(),
    usage: contained(<UsageFinder tasks={tasks} steps={steps} kicker={home?.usageKicker ?? undefined} title={home?.usageTitle ?? undefined} stepsTitle={home?.usageStepsTitle ?? undefined} />),
    featured: featuredCards.length > 0 && contained(<>
      <SectionTitle kicker="Polecamy" title={featuredTitle} href="/marki/sonax" />
      <ProductGrid products={featuredCards.map(toCard)} />
    </>),
    deals: deals.length > 0 && contained(<>
      <SectionTitle kicker="Promocje" title={text(home?.dealsTitle, "Obniżone ceny")} href="/promocje" />
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
      <SectionTitle kicker="Magazyn" title={text(home?.newestTitle, "Nowości")} href="/nowosci" />
      <ProductGrid products={newest.map(toCard)} />
    </>),
    brands: (brandLogos.length > 0 || brands.length > 0) && (
      <section className="my-8 border-y border-brand-100 bg-white py-8">
        <p className="mb-4 text-center text-xs font-bold tracking-widest text-slate-400 uppercase">{text(home?.brandsTitle, "Marki w sklepie")}</p>
        <BrandStrip items={brandLogos.length > 0
          ? brandLogos
          : brands.map((b) => ({ name: b.name, href: `/marki/${b.slug}` }))} />
      </section>
    ),
    reviews: contained(<HomeReviews data={reviews} google={getGoogleReviews()} />),
    about: contained(
      <section className="grid overflow-hidden rounded-xl bg-white ring-1 ring-brand-100 lg:grid-cols-2">
        <div className="p-8 sm:p-10">
          <p className="text-xs font-bold tracking-widest text-accent uppercase">{text(home?.aboutKicker, "O nas")}</p>
          <h2 className="mt-2 text-3xl font-extrabold text-navy">{text(home?.aboutTitle, "Sklep SONAX z Białegostoku")}</h2>
          <p className="mt-4 leading-relaxed text-slate-600">{text(home?.aboutText, "Zaczynaliśmy od akcesoriów do pielęgnacji samochodów, a potem wprowadzaliśmy na polski rynek chemię SONAX. Dziś obsługujemy kierowców, studia detailingowe, myjnie i warsztaty – stacjonarnie i online.")}</p>
          <Link href={text(home?.aboutLink, "/o-nas")} className="mt-6 inline-flex items-center gap-2 font-bold text-accent hover:gap-3">{text(home?.aboutLinkLabel, "Poznaj nas")} <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="relative min-h-[240px] lg:min-h-0">
          <Image src={aboutImg} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
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

  const layout = sectionIds ? layoutFromIds("home", sectionIds) : getLayout("home");
  return (
    <div className="pb-8">
      {layout.filter((s) => s.visible).map((s) => <Fragment key={s.id}>{sections[s.id] || null}</Fragment>)}
    </div>
  );
}
