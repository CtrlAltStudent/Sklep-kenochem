import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, Headset, Mail, MapPin, Phone, Sparkles, Store, Truck, Warehouse, Wrench } from "lucide-react";
import { getBrands, getProducts } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/cms";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConsentMap, OpenNowBadge } from "@/components/ClientBits";

export const metadata: Metadata = {
  title: "O nas – sklep SONAX Białystok",
  description: "Sklep SONAX w Białymstoku: chemia samochodowa, kosmetyki detailingowe i środki do myjni. Sklep stacjonarny przy ul. Gen. Andersa 40 i wysyłka w całej Polsce.",
};

const mapQuery = "Gen. Władysława Andersa 40, 15-113 Białystok";

const offer = [
  { icon: Sparkles, title: "Mycie i ochrona auta", text: "Szampony, piany, felgi, szyby i plastiki – komplet do weekendowego mycia i codziennej ochrony lakieru." },
  { icon: Wrench, title: "Detailing", text: "Pasty, pady, woski, powłoki ceramiczne i akcesoria dla studiów detailingowych oraz wymagających kierowców." },
  { icon: Warehouse, title: "Chemia do myjni", text: "Koncentraty w kanistrach do myjni ręcznych i bezdotykowych – wydajne formuły, które robią robotę." },
  { icon: Store, title: "Dom, warsztat i ogród", text: "Środki do kuchni, łazienki, ogrodu i serwisu pojazdu – ta sama jakość, którą znasz z detailingu." },
];

const team = [
  { icon: Headset, title: "Doradztwo", text: "Pomagamy dobrać preparat do lakieru, felg, wnętrza i twardości wody. Zadzwoń – odpowiemy konkretnie." },
  { icon: Warehouse, title: "Magazyn i wysyłka", text: "Większość dostępnych produktów przekazujemy do wysyłki w ciągu 1 dnia roboczego." },
  { icon: Store, title: "Sklep stacjonarny", text: "Zapraszamy do Białegostoku – doradzimy na miejscu, a towar odbierzesz od ręki." },
  { icon: Truck, title: "Cała Polska", text: "Wysyłamy kurierem InPost, do Paczkomatów i punktów ORLEN Paczka. Odbiór osobisty po uzgodnieniu." },
];

export default async function AboutPage() {
  const [products, brands, s] = await Promise.all([getProducts(), getBrands(), getStoreSettings()]);
  const phone = s.phone ?? "+48 500 021 705";
  const email = s.email ?? "aukcje@sonax.bialystok.pl";
  const hours = s.hours ?? "Pn–Pt 8:00–16:00";
  const stats = [
    [`${products.length}`, "produktów w ofercie"],
    [`${brands.length}`, "marek"],
    ["1 dzień", "zwykle do wysyłki"],
    ["Białystok", "sklep stacjonarny"],
  ];

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: "O nas" }]} />

      <header className="relative isolate mt-4 overflow-hidden rounded-3xl bg-brand-950 text-white">
        <Image src="/sonax/sonax-autoo-lite-2026-08-27.webp" alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950 via-brand-950/85 to-transparent" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-full w-1/3 skew-x-[-14deg] bg-accent/50" />
        <div className="max-w-2xl px-6 py-12 sm:px-12 sm:py-20">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-lime uppercase"><BadgeCheck className="h-4 w-4" /> Oficjalny sklep SONAX w Białymstoku</p>
          <h1 className="title-sport mt-3 text-5xl sm:text-7xl">Chemia, którą znasz z myjni – u siebie w garażu</h1>
          <p className="mt-5 text-lg text-white/80">Zaczynaliśmy od akcesoriów do pielęgnacji samochodów, a potem aktywnie wprowadzaliśmy na polski rynek chemię i kosmetyki niemieckiej marki SONAX. Dziś pomagamy kierowcom, studiom detailingowym, myjniom i warsztatom.</p>
        </div>
      </header>

      <section className="-mt-8 grid grid-cols-2 gap-3 px-2 sm:px-6 lg:grid-cols-4">
        {stats.map(([v, l]) => (
          <div key={l} className="relative rounded-2xl bg-white p-5 text-center shadow-lg shadow-brand-900/10 ring-1 ring-brand-100">
            <p className="font-display text-3xl font-extrabold text-accent italic sm:text-4xl">{v}</p>
            <p className="text-sm text-slate-500">{l}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 grid items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent uppercase">Kim jesteśmy</p>
          <h2 className="title-sport mt-2 text-4xl text-navy">Od akcesoriów do pełnej oferty detailingu</h2>
          <div className="mt-4 space-y-4 text-[17px] leading-relaxed text-slate-600">
            <p>Nasza historia zaczęła się od sprzedaży akcesoriów do pielęgnacji samochodów oraz współpracy przy zabudowach aut dostawczych. Kolejnym etapem był aktywny udział we wprowadzaniu na polski rynek nowej generacji chemii i kosmetyków SONAX.</p>
            <p>Dziś dostarczamy chemię do myjni, kosmetyki do pielęgnacji auta, zapachy, chemię warsztatową i środki do domu. Obsługujemy klientów stacjonarnie w Białymstoku i przez sklep internetowy w całej Polsce.</p>
            <p>W 2009 roku firma została uhonorowana Złotym Laurem Związku Rzemiosła Polskiego za osiągnięcia menedżerskie i wkład w promocję kupiectwa.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {offer.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-white p-5 ring-1 ring-brand-100">
              <span className="bg-kc-gradient grid h-11 w-11 place-items-center rounded-xl text-white"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-3 font-black text-navy">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <p className="text-xs font-bold tracking-widest text-accent uppercase">Jak pracujemy</p>
        <h2 className="title-sport mt-2 text-4xl text-navy">Ludzie, którzy znają się na lakierze</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {team.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-gradient-to-b from-leaf-50 to-white p-5 ring-1 ring-leaf-100">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-accent shadow-sm ring-1 ring-leaf-100"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-3 font-black text-navy">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid items-stretch gap-6 lg:grid-cols-[400px_1fr]" id="sklep">
        <div className="carbon rounded-3xl p-7 text-white">
          <p className="text-xs font-bold tracking-widest text-lime uppercase">Sklep stacjonarny</p>
          <h2 className="title-sport mt-2 text-3xl">Odwiedź nas w Białymstoku</h2>
          <ul className="mt-6 space-y-4 text-sm">
            <li className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-lime" /><span className="whitespace-pre-line">{s.address ?? "ul. Gen. Wł. Andersa 40\n15-113 Białystok"}</span></li>
            <li className="flex items-center gap-3"><Clock className="h-5 w-5 shrink-0 text-lime" /><span>{hours}</span> <OpenNowBadge /></li>
            <li><a href={`tel:${phone.replace(/\s/g, "")}`} className="flex gap-3 hover:underline"><Phone className="h-5 w-5 shrink-0 text-lime" />{phone}</a></li>
            <li><a href={`mailto:${email}`} className="flex gap-3 hover:underline"><Mail className="h-5 w-5 shrink-0 text-lime" />{email}</a></li>
          </ul>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer"
            className="btn-kc mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold">Wyznacz trasę <ArrowRight className="h-4 w-4" /></a>
        </div>
        <ConsentMap query={mapQuery} title="Sklep Sonax Białystok – mapa dojazdu" />
      </section>

      <section className="mt-16 flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-white p-8 ring-1 ring-brand-100">
        <div>
          <h2 className="title-sport text-3xl text-navy">Nie wiesz, od czego zacząć?</h2>
          <p className="mt-1 text-slate-600">Przewodniki zakupowe ułożą zestaw: mycie, felgi, ochrona i wnętrze – bez zbędnych flakonów.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/blog" className="btn-kc rounded-xl px-5 py-3 text-sm font-bold text-white">Przewodniki zakupowe</Link>
          <Link href="/kontakt" className="rounded-xl px-5 py-3 text-sm font-bold text-brand-800 ring-1 ring-brand-200 hover:bg-leaf-50">Kontakt</Link>
        </div>
      </section>
    </div>
  );
}
