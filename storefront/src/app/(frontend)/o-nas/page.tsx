import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, Headset, Mail, MapPin, Phone, Store, Truck, Users, Warehouse, Wrench } from "lucide-react";
import { getBrands, getProducts } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/cms";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConsentMap, OpenNowBadge } from "@/components/ClientBits";

export const metadata: Metadata = {
  title: "O nas – hurtownia chemii z Białegostoku",
  description: "Kenochem – hurtownia profesjonalnej chemii do myjni, detailingu i sprzątania. Sklep stacjonarny w Białymstoku i wysyłka w całej Polsce. Ponad 25 lat doświadczenia.",
};

const mapQuery = "Gen. Władysława Andersa 40, 15-113 Białystok";

// Treść na podstawie strony „Informacje o sklepie” z kenochem.com
const offer = [
  { icon: Warehouse, title: "Chemia do myjni", text: "Piany aktywne, proszki, szampony i woski do myjni ręcznych, bezdotykowych, portalowych i tunelowych – dla aut osobowych i ciężarowych." },
  { icon: Wrench, title: "Detailing i warsztat", text: "Kosmetyki samochodowe, pasty, powłoki, mikrofibry i akcesoria dla firm autodetailingowych oraz chemia warsztatowa." },
  { icon: Store, title: "Sprzątanie i obiekty", text: "Chemia obiektowa i gastronomiczna, higiena rąk, czyściwa i systemy sprzątania dla firm i instytucji." },
  { icon: Truck, title: "Rolnictwo i transport", text: "Mycie maszyn, higiena budynków inwentarskich i urządzeń udojowych, mycie pojazdów ciężarowych i chłodni." },
];

const team = [
  { icon: Headset, title: "Doradcy techniczni", text: "Pomagają dobrać preparat do zabrudzenia, powierzchni i twardości wody. Doradzamy także przy nietypowych zastosowaniach." },
  { icon: Users, title: "Dział handlowy B2B", text: "Indywidualne warunki dla myjni, warsztatów, firm sprzątających i instytucji, terminy płatności i stała obsługa." },
  { icon: Warehouse, title: "Magazyn i wysyłka", text: "Zamówienia złożone do 14:00 w dni robocze wysyłamy tego samego dnia – w całej Polsce i za granicę." },
  { icon: Store, title: "Sklep stacjonarny", text: "Zapraszamy do Białegostoku – doradzimy na miejscu, a towar odbierzesz od ręki." },
];

export default async function AboutPage() {
  const [products, brands, s] = await Promise.all([getProducts(), getBrands(), getStoreSettings()]);
  const phone = s.phone ?? "+48 500 021 705";
  const email = s.email ?? "sklep@kenochem.com";
  const hours = s.hours ?? "Pn–Pt 8:00–16:00";
  const stats = [
    ["25+", "lat na rynku"],
    [`${(Math.floor(products.length / 100) * 100).toLocaleString("pl-PL")}+`, "produktów w ofercie"],
    [`${brands.length}`, "marek producentów"],
    ["24 h", "wysyłka zamówień"],
  ];

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: "O nas" }]} />

      <header className="relative isolate mt-4 overflow-hidden rounded-3xl bg-brand-950 text-white">
        <Image src="/brand/25-lat-1.jpg" alt="Kenochem – 25 lat z Wami" fill priority sizes="100vw" className="-z-10 object-cover object-right opacity-50" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950 via-brand-950/85 to-transparent" />
        <div className="max-w-2xl px-6 py-12 sm:px-12 sm:py-20">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-leaf-300 uppercase"><BadgeCheck className="h-4 w-4" /> Polska firma z Białegostoku</p>
          <h1 className="mt-3 text-4xl leading-[1.05] font-black tracking-tight sm:text-6xl">Hurtownia profesjonalnej chemii</h1>
          <p className="mt-5 text-lg text-brand-100">Jesteśmy jedną z większych hurtowni profesjonalnej chemii do myjni samochodowych, chemii do sprzątania, chemii rolniczej oraz kosmetyków dla firm autodetailingowych. Działamy w Białymstoku, a zamówienia realizujemy w całej Polsce i za granicą.</p>
        </div>
      </header>

      <section className="-mt-8 grid grid-cols-2 gap-3 px-2 sm:px-6 lg:grid-cols-4">
        {stats.map(([v, l]) => (
          <div key={l} className="relative rounded-2xl bg-white p-5 text-center shadow-lg shadow-brand-900/10 ring-1 ring-brand-100">
            <p className="text-kc-gradient text-3xl font-black sm:text-4xl">{v}</p>
            <p className="text-sm text-slate-500">{l}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 grid items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent uppercase">Kim jesteśmy</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-navy">Szeroki wybór sprawdzonej chemii w jednym miejscu</h2>
          <div className="mt-4 space-y-4 text-[17px] leading-relaxed text-slate-600">
            <p>Naszą mocną stroną jest szeroka oferta artykułów chemicznych wielu polskich i zagranicznych producentów profesjonalnej chemii. Duży wybór pozwala dopasować sprawdzony, dobrze myjący środek do każdego zastosowania.</p>
            <p>Wsłuchujemy się w opinie klientów o zakupionych produktach – także o ich nietypowych zastosowaniach – i na tej podstawie rozwijamy ofertę oraz doradzamy kolejnym firmom.</p>
            <p>Obsługujemy myjnie samoobsługowe i ręczne, firmy detailingowe, warsztaty, firmy sprzątające, gastronomię, rolnictwo oraz klientów indywidualnych.</p>
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
        <p className="text-xs font-bold tracking-widest text-accent uppercase">Zespół</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-navy">Ludzie, którzy znają się na chemii</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {team.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-gradient-to-b from-leaf-50 to-white p-5 ring-1 ring-leaf-100">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-700 shadow-sm ring-1 ring-leaf-100"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-3 font-black text-navy">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid items-stretch gap-6 lg:grid-cols-[400px_1fr]" id="sklep">
        <div className="bg-kc-gradient-deep rounded-3xl p-7 text-white">
          <p className="text-xs font-bold tracking-widest text-leaf-300 uppercase">Sklep stacjonarny</p>
          <h2 className="mt-2 text-2xl font-black">Odwiedź nas w Białymstoku</h2>
          <ul className="mt-6 space-y-4 text-sm">
            <li className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-leaf-300" /><span className="whitespace-pre-line">{s.address ?? "ul. Gen. Wł. Andersa 40, Boks 16\n15-113 Białystok"}</span></li>
            <li className="flex items-center gap-3"><Clock className="h-5 w-5 shrink-0 text-leaf-300" /><span>{hours}</span> <OpenNowBadge /></li>
            <li><a href={`tel:${phone.replace(/\s/g, "")}`} className="flex gap-3 hover:underline"><Phone className="h-5 w-5 shrink-0 text-leaf-300" />{phone}</a></li>
            <li><a href={`mailto:${email}`} className="flex gap-3 hover:underline"><Mail className="h-5 w-5 shrink-0 text-leaf-300" />{email}</a></li>
          </ul>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer"
            className="btn-kc mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold">Wyznacz trasę <ArrowRight className="h-4 w-4" /></a>
        </div>
        <ConsentMap query={mapQuery} title="Kenochem – mapa dojazdu do sklepu" />
      </section>

      <section className="mt-16 flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-white p-8 ring-1 ring-brand-100">
        <div>
          <h2 className="text-2xl font-black text-navy">Kupujesz dla firmy?</h2>
          <p className="mt-1 text-slate-600">Załóż konto B2B – indywidualne rabaty, faktura z terminem płatności i opiekun handlowy.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/b2b" className="btn-kc rounded-xl px-5 py-3 text-sm font-bold text-white">Współpraca B2B</Link>
          <Link href="/kontakt" className="rounded-xl px-5 py-3 text-sm font-bold text-brand-800 ring-1 ring-brand-200 hover:bg-leaf-50">Kontakt</Link>
        </div>
      </section>
    </div>
  );
}
