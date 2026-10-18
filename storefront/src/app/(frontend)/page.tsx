import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgePercent, Building2, Car, ChefHat, Clock3, Headset, ShieldCheck, Sparkles, Tractor, Truck, Zap } from "lucide-react";
import { blogPosts, categories, toCard, usableImages } from "@/lib/data";
import { getCategoryCounts, getFeatured, getNewest, getOnSale, getProducts, pickFrom } from "@/lib/catalog";
import { CatIcon } from "@/components/CatIcon";
import { categoryPhoto } from "@/lib/photos";
import { Countdown, CountUp, HeroSearch, ProductRail, Reveal } from "@/components/home/HomeBits";

function SectionTitle({ title, href, kicker, dark }: { title: string; href?: string; kicker?: string; dark?: boolean }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {kicker && <p className={`text-xs font-bold tracking-widest uppercase ${dark ? "text-lime" : "text-accent"}`}>{kicker}</p>}
        <h2 className={`text-2xl font-black tracking-tight sm:text-4xl ${dark ? "text-white" : "text-navy"}`}>{title}</h2>
      </div>
      {href && (
        <Link href={href} className={`flex shrink-0 items-center gap-1 text-sm font-bold transition-all hover:gap-2 ${dark ? "text-lime" : "text-accent-dark"}`}>
          Zobacz wszystkie <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

const popular = [
  { label: "Aktywna piana", href: "/szukaj?q=piana" },
  { label: "Chemia do myjni", href: "/kategoria/myjnie-i-urzadzenia?sub=chemia-do-myjni" },
  { label: "Mikrofibry", href: "/kategoria/sprzet-i-akcesoria?sub=mikrofibry-i-gabki" },
  { label: "Zapachy", href: "/kategoria/zapachy" },
];

// Segmenty klientów – jak „Zakupy dla firm” w dużych sklepach
const segments = [
  { icon: Car, title: "Myjnie samoobsługowe", text: "Chemia w kanistrach i beczkach, części do myjek, lance.", href: "/kategoria/myjnie-i-urzadzenia", img: "/stock/branza-myjnie.webp" },
  { icon: Sparkles, title: "Detailing", text: "Powłoki, woski, pady, polerki i mikrofibry.", href: "/kategoria/chemia-samochodowa?sub=pielegnacja-lakieru", img: "/stock/branza-detailing.webp" },
  { icon: Building2, title: "Firmy sprzątające", text: "Chemia obiektowa, mopy, systemy sprzątania.", href: "/kategoria/chemia-profesjonalna", img: "/stock/branza-sprzatanie.webp" },
  { icon: ChefHat, title: "Gastronomia", text: "Mycie kuchni, zmywarek i higiena HACCP.", href: "/kategoria/chemia-profesjonalna?sub=kuchnia-i-gastronomia", img: "/stock/branza-gastronomia.webp" },
  { icon: Tractor, title: "Rolnictwo", text: "Mycie maszyn, obór i przemysłu spożywczego.", href: "/kategoria/chemia-specjalistyczna?sub=rolnictwo", img: "/stock/branza-rolnictwo.webp" },
];

const perks = [
  { icon: Truck, title: "Wysyłka w 24 h", text: "Zamów do 14:00 – wyślemy dziś" },
  { icon: BadgePercent, title: "Ceny hurtowe B2B", text: "Rabaty dla firm i myjni" },
  { icon: ShieldCheck, title: "Bezpieczne płatności", text: "Przelewy24, BLIK, karta" },
  { icon: Headset, title: "Doradztwo ekspertów", text: "Pn–Pt 8–16, 500 021 705" },
];

const brandsStrip = ["Kenotek", "Kenochem", "Orion", "Tenzi", "Vikan", "Kwazar", "Eco Shine", "Sonax", "K2", "Draco", "Kala", "Cartec", "Freshtek"];

// Kafelki bento: rozmiar zależy od pozycji (pierwszy duży, dwa wysokie)
const bentoSpan = ["md:col-span-2 md:row-span-2", "md:row-span-2", "", "", "md:col-span-2", "", ""];

export default async function Home() {
  const [counts, featured, newest, onSale, products, carwash] = await Promise.all([getCategoryCounts(), getFeatured(), getNewest(), getOnSale(), getProducts(), pickFrom("myjnie-i-urzadzenia", 12)]);
  const withImg = (list: typeof products) => list.filter((p) => usableImages(p.images).length);
  const deals = withImg(onSale).slice(0, 12);
  // Gdy w panelu nie ma aktywnych promocji, ciemna sekcja pokazuje ofertę dla myjni (bez licznika)
  const hasDeals = deals.length > 0;
  const darkRail = hasDeals ? deals : carwash;
  const heroProducts = withImg(featured.length >= 3 ? featured : products).slice(0, 3);
  const total = products.length;

  return (
    <div className="space-y-20 pb-4 sm:space-y-28">
      {/* ===== HERO ===== */}
      <section className="relative isolate overflow-hidden bg-brand-950 text-white">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="aurora absolute -top-1/3 -left-1/4 h-[70vmax] w-[70vmax] rounded-full bg-brand-600/40 blur-3xl" />
          <div className="aurora absolute -right-1/4 -bottom-1/2 h-[60vmax] w-[60vmax] rounded-full bg-lime/25 blur-3xl [animation-delay:-6s]" />
          <div className="aurora absolute top-1/4 left-1/2 h-[30vmax] w-[30vmax] rounded-full bg-accent/30 blur-3xl [animation-delay:-12s]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        </div>

        <div className="mx-auto grid max-w-shop items-center gap-10 px-4 pt-14 pb-20 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:pb-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold ring-1 ring-white/20 backdrop-blur">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-lime" /></span>
              Zamów do 14:00 – wyślemy jeszcze dziś
            </span>
            <h1 className="mt-6 text-4xl leading-[1.02] font-black tracking-tight sm:text-6xl xl:text-7xl">
              Profesjonalna chemia,<br /><span className="text-shine">która robi robotę.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-brand-100/90">
              {total.toLocaleString("pl-PL")} produktów dla myjni, detailingu, firm sprzątających i rolnictwa. Hurt i detal, 25 lat doświadczenia.
            </p>
            <div className="mt-8 max-w-2xl"><HeroSearch popular={popular} /></div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-6">
              <div><p className="text-3xl font-black sm:text-4xl"><CountUp to={total} /></p><p className="text-xs text-white/60">produktów w ofercie</p></div>
              <div><p className="text-3xl font-black sm:text-4xl"><CountUp to={25} suffix=" lat" /></p><p className="text-xs text-white/60">na rynku</p></div>
              <div><p className="text-3xl font-black sm:text-4xl"><CountUp to={24} suffix=" h" /></p><p className="text-xs text-white/60">czas wysyłki</p></div>
            </div>
          </div>

          {/* Pływające karty produktów */}
          <div className="relative hidden h-[520px] lg:block">
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-lime/30 to-brand-500/10 blur-2xl" />
            {heroProducts.map((p, i) => {
              const pos = ["top-0 left-0 [--r:-6deg]", "top-12 right-0 [--r:5deg] [animation-delay:-2s]", "bottom-0 left-[36%] z-10 [--r:-2deg] [animation-delay:-4s]"][i];
              const v = p.variants[0];
              return (
                <Link key={p.slug} href={`/produkt/${p.slug}`}
                  className={`floaty absolute w-56 rounded-3xl bg-white/95 p-4 text-ink shadow-2xl shadow-black/40 ring-1 ring-white/50 backdrop-blur transition hover:scale-105 ${pos}`}>
                  <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-50">
                    <Image src={usableImages(p.images)[0]} alt={p.name} fill sizes="224px" className="object-contain p-3" priority={i === 0} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-snug font-bold">{p.name}</p>
                  <p className="mt-1 text-lg font-black text-brand-700">{v.price.toFixed(2).replace(".", ",")} zł</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pasek atutów przyklejony do dołu hero */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur">
          <div className="mx-auto grid max-w-shop grid-cols-2 gap-px px-4 lg:grid-cols-4">
            {perks.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-2.5 py-4 sm:items-center sm:gap-3 sm:py-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime/15 text-lime"><Icon className="h-5 w-5" /></span>
                <div className="min-w-0"><p className="text-sm font-bold">{title}</p><p className="text-xs leading-snug text-white/60">{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-shop space-y-20 px-4 sm:space-y-28">
        {/* ===== BENTO KATEGORII ===== */}
        <Reveal>
          <SectionTitle kicker="Asortyment" title="Odkryj kategorie" />
          <div className="grid auto-rows-[190px] grid-cols-2 gap-3 sm:gap-4 md:auto-rows-[210px] md:grid-cols-4">
            {categories.map((c, i) => {
              const big = i === 0;
              return (
                <Link key={c.slug} href={`/kategoria/${c.slug}`}
                  className={`group relative isolate overflow-hidden rounded-3xl bg-brand-950 text-white shadow-lg shadow-brand-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-900/25 ${big ? "col-span-2" : ""} ${bentoSpan[i] ?? ""}`}>
                  <Image src={categoryPhoto[c.slug]} alt="" fill sizes={big ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                    className="-z-10 object-cover transition duration-700 group-hover:scale-110" />
                  {/* przyciemnienie od dołu + zielony odcień marki */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-950 via-brand-950/55 to-brand-950/5" />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-leaf/0 via-transparent to-leaf/40 opacity-0 transition duration-500 group-hover:opacity-100" />
                  <div className="flex h-full flex-col p-4 sm:p-5">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition group-hover:bg-leaf group-hover:ring-leaf">
                      <CatIcon name={c.lucide} className="h-5 w-5" />
                    </span>
                    <div className="mt-auto">
                      <h3 className={`font-black tracking-tight drop-shadow ${big ? "text-2xl sm:text-4xl" : "text-base leading-tight sm:text-xl"}`}>{c.name}</h3>
                      <p className="mt-1 flex items-center gap-2 text-xs text-white/75">
                        <span className="rounded-full bg-leaf px-2 py-0.5 font-bold text-white">{(counts[c.slug] ?? 0).toLocaleString("pl-PL")}</span> produktów
                      </p>
                      {big && (
                        <div className="mt-4 hidden flex-wrap gap-1.5 md:flex">
                          {c.children.slice(0, 6).map((s) => <span key={s.slug} className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium ring-1 ring-white/20 backdrop-blur">{s.name}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="absolute top-4 right-4 grid h-9 w-9 place-items-center rounded-full bg-white text-brand-900 opacity-0 shadow-lg transition duration-300 group-hover:opacity-100 sm:top-5 sm:right-5">
                    <ArrowUpRight className="h-4.5 w-4.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </Reveal>

        {/* ===== OKAZJE DNIA ===== */}
        {darkRail.length > 0 && (
          <Reveal>
            <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-900 via-brand-950 to-black px-4 py-6 text-white sm:p-10">
              <div className="aurora pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-lime/20 blur-3xl" />
              <div className="relative mb-8 flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-lime uppercase"><Zap className="h-4 w-4" /> {hasDeals ? "Okazje dnia" : "Dla myjni samoobsługowych"}</p>
                  <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-5xl">{hasDeals ? "Ceny, które znikają o północy" : "Wszystko dla myjni w jednym miejscu"}</h2>
                </div>
                {hasDeals ? (
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-sm text-white/60"><Clock3 className="h-4 w-4" /> Kończy się za</span>
                    <Countdown />
                  </div>
                ) : (
                  <Link href="/kategoria/myjnie-i-urzadzenia" className="inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-3 font-bold text-brand-950 transition hover:bg-white">Cała oferta myjni <ArrowRight className="h-4 w-4" /></Link>
                )}
              </div>
              <div className="on-dark relative"><ProductRail products={darkRail.map(toCard)} /></div>
            </section>
          </Reveal>
        )}

        {/* ===== SEGMENTY ===== */}
        <Reveal>
          <SectionTitle kicker="Rozwiązania branżowe" title="Zakupy dla Twojej branży" href="/b2b" />
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
            {segments.map(({ icon: Icon, title, text, href, img }) => (
              <Link key={title} href={href}
                className="group relative isolate flex h-[360px] w-64 shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-brand-950 p-5 text-white shadow-lg shadow-brand-900/10 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand-900/25 lg:w-auto">
                <Image src={img} alt="" fill sizes="(min-width: 1024px) 20vw, 260px" className="-z-10 object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-950 via-brand-950/45 to-transparent" />
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur transition group-hover:bg-leaf group-hover:ring-leaf"><Icon className="h-5 w-5" /></span>
                <div className="mt-auto">
                  <h3 className="text-xl font-black drop-shadow">{title}</h3>
                  <p className="mt-1 text-sm text-white/80">{text}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-900 transition-all group-hover:gap-2.5 group-hover:bg-leaf group-hover:text-white">
                    Zobacz ofertę <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>

        {/* ===== POLECANE ===== */}
        {featured.length > 0 && (
          <Reveal>
            <SectionTitle kicker="Marki własne" title="Kenochem poleca" href="/szukaj?q=keno" />
            <ProductRail products={featured.map(toCard)} />
          </Reveal>
        )}
      </div>

      {/* ===== MARKI – nieskończony pasek ===== */}
      <section className="overflow-hidden border-y border-brand-100 bg-white py-8">
        <p className="mb-6 text-center text-xs font-bold tracking-widest text-slate-400 uppercase">Oficjalny dystrybutor marek</p>
        <div className="flex [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="marquee flex shrink-0 gap-4 pr-4">
            {[...brandsStrip, ...brandsStrip].map((b, i) => (
              <Link key={i} href={`/szukaj?q=${encodeURIComponent(b)}`} aria-hidden={i >= brandsStrip.length}
                tabIndex={i >= brandsStrip.length ? -1 : undefined}
                className="shrink-0 rounded-2xl bg-brand-50/60 px-8 py-4 text-lg font-black tracking-wider whitespace-nowrap text-slate-400 uppercase ring-1 ring-brand-100 transition hover:bg-white hover:text-brand-700">
                {b}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-shop space-y-20 px-4 sm:space-y-28">
        {/* ===== NOWOŚCI ===== */}
        {newest.length > 0 && (
          <Reveal>
            <SectionTitle kicker="Prosto z magazynu" title="Nowości" href="/nowosci" />
            <ProductRail products={newest.slice(0, 16).map(toCard)} />
          </Reveal>
        )}

        {/* ===== B2B CTA ===== */}
        <Reveal>
          <section className="relative isolate overflow-hidden rounded-[2rem] bg-brand-950 text-white">
            <Image src="/brand/Nowy-Kenochem-banner-1920x625-1-1-1.jpg" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-40" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950 via-brand-950/85 to-transparent" />
            <div className="grid items-center gap-8 p-8 sm:p-14 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <p className="text-xs font-bold tracking-widest text-lime uppercase">Strefa partnerów B2B</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Kupujesz dla firmy? Płać mniej.</h2>
                <p className="mt-4 max-w-xl text-brand-100">Indywidualne rabaty, faktury z odroczonym terminem, priorytetowa realizacja i opiekun handlowy. Weryfikacja konta w 1 dzień roboczy.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/b2b" className="inline-flex items-center gap-2 rounded-xl bg-lime px-6 py-3.5 font-bold text-brand-950 transition hover:bg-white">Załóż konto firmowe <ArrowRight className="h-4 w-4" /></Link>
                  <a href="tel:+48500021705" className="rounded-xl border border-white/30 px-6 py-3.5 font-semibold transition hover:bg-white/10">Zadzwoń: 500 021 705</a>
                </div>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {["Ceny hurtowe po zalogowaniu", "Darmowa dostawa od progu", "Karty charakterystyki 24/7", "Doradztwo techniczne"].map((t) => (
                  <li key={t} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold ring-1 ring-white/15 backdrop-blur">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-lime" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </Reveal>

        {/* ===== O NAS ===== */}
        <Reveal>
          <section className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-white ring-1 ring-brand-100 lg:grid-cols-2">
            <div className="p-8 sm:p-12">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold tracking-widest text-brand-800 uppercase ring-1 ring-brand-100">O nas</span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-navy sm:text-4xl">Hurtownia profesjonalnej chemii z Białegostoku</h2>
              <p className="mt-4 leading-relaxed text-slate-600">Jesteśmy jedną z większych hurtowni profesjonalnej chemii do myjni samochodowych, chemii do sprzątania, chemii rolniczej oraz kosmetyków samochodowych dla firm autodetailingowych. Znajdujemy się w Białymstoku, ale bez problemu realizujemy zamówienia z całej Polski i zagranicy.</p>
              <Link href="/informacje-o-sklepie" className="mt-6 inline-flex items-center gap-2 font-bold text-accent-dark transition-all hover:gap-3">Poznaj nas bliżej <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="relative h-72 lg:h-full lg:min-h-[420px]">
              <Image src="/brand/25-lat-1.jpg" alt="Kenochem – 25 lat z Wami" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-right" />
            </div>
          </section>
        </Reveal>

        {/* ===== BLOG ===== */}
        <Reveal>
          <SectionTitle kicker="Wiedza" title="Poradniki z bloga" href="/blog" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((b) => (
              <article key={b.slug} className="group overflow-hidden rounded-3xl bg-white ring-1 ring-brand-100 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/10">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={b.image} alt="" fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-brand-800">{b.tag}</span>
                </div>
                <div className="p-5">
                  <time className="text-xs text-slate-400">{new Date(b.date).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}</time>
                  <h3 className="mt-1 leading-snug font-bold text-navy group-hover:text-accent-dark">{b.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{b.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
