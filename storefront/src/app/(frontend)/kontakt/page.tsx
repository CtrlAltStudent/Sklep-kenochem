import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Building2, Clock, Landmark, Mail, MapPin, Phone, RotateCcw } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ConsentMap, CopyButton, OpenNowBadge } from "@/components/ClientBits";
import { ContactForm } from "@/components/forms/Forms";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontakt ze sklepem Sonax w Białymstoku: telefon +48 500 021 705, aukcje@sonax.bialystok.pl, ul. Gen. Andersa 40. Pn–Pt 8:00–16:00.",
};

const company = {
  name: "KENOCHEM Kuczyński Sp. J.",
  street: "ul. Gen. Władysława Andersa 40",
  city: "15-113 Białystok",
  nip: "5423224790",
  regon: "200690197",
  krs: "0000417794",
  bank: "mBank",
  account: "36 1140 2004 0000 3602 8638 0572",
  swift: "BREXPLPWMBK",
};
const mapQuery = "Gen. Władysława Andersa 40, 15-113 Białystok";

export default async function ContactPage(props: PageProps<"/kontakt">) {
  const { produkt } = await props.searchParams;
  const product = typeof produkt === "string" ? produkt.slice(0, 200) : undefined;
  const cards = [
    { icon: Phone, label: "Telefon", value: "+48 500 021 705", note: "Doradzimy w doborze chemii", action: { label: "Zadzwoń", href: "tel:+48500021705" } },
    { icon: Mail, label: "E-mail", value: "aukcje@sonax.bialystok.pl", note: "Odpowiadamy w dni robocze", action: { label: "Napisz e-mail", href: "mailto:aukcje@sonax.bialystok.pl" } },
    { icon: MapPin, label: "Adres", value: "ul. Gen. Andersa 40", note: "15-113 Białystok", action: { label: "Wyznacz trasę", href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`, external: true } },
    { icon: Clock, label: "Godziny pracy", value: "Pn–Pt 8:00–16:00", note: "Sobota i niedziela nieczynne", badge: true },
  ];

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: "Kontakt" }]} />

      <header className="carbon relative mt-4 overflow-hidden rounded-3xl px-6 py-10 text-white sm:px-10">
        <div className="pointer-events-none absolute -right-16 bottom-0 h-full w-1/3 skew-x-[-14deg] bg-accent/80" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-widest text-lime uppercase">Jesteśmy do Twojej dyspozycji</p>
            <h1 className="title-sport mt-2 text-5xl sm:text-6xl">Kontakt</h1>
            <p className="mt-3 text-white/75">Pytanie o produkt, zamówienie albo dobór chemii? Zadzwoń, napisz lub odwiedź nas w Białymstoku.</p>
          </div>
          <a href="tel:+48500021705" className="skew-cta inline-flex bg-accent px-5 py-3 font-bold text-white transition hover:bg-white hover:text-accent">
            <span className="flex items-center gap-2"><Phone className="h-5 w-5" /> 500 021 705</span>
          </a>
        </div>
      </header>

      <section className="relative z-10 -mt-6 grid gap-4 px-2 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, note, action, badge }) => (
          <div key={label} className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-xl shadow-brand-900/5 ring-1 ring-brand-100">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5" /></span>
              {badge && <OpenNowBadge />}
            </div>
            <p className="mt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
            <p className="mt-0.5 text-[17px] font-extrabold break-words text-navy">{value}</p>
            <p className="text-sm text-slate-500">{note}</p>
            {action && (
              <a href={action.href} target={action.external ? "_blank" : undefined} rel={action.external ? "noreferrer" : undefined}
                className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-bold text-accent-dark transition-all hover:gap-2">
                {action.label} <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        ))}
      </section>

      <section className="mt-10 grid items-start gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:p-10">
          <h2 className="text-2xl font-extrabold text-navy">Napisz do nas</h2>
          <p className="mt-1 mb-6 text-sm text-slate-500">Odpowiemy najszybciej, jak to możliwe. Pola oznaczone * są wymagane.</p>
          {product && <p className="mb-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900 ring-1 ring-brand-100">Pytanie dotyczy produktu: <b>{product}</b></p>}
          <ContactForm product={product} />
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:p-8">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy"><Building2 className="h-5 w-5 text-accent" /> Dane firmy</h2>
            <p className="mt-4 font-semibold">{company.name}</p>
            <p className="text-sm text-slate-600">właściciel sklepu sonax.sklep.pl<br />{company.street}<br />{company.city}</p>
            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-brand-50 pt-4">
              {[["NIP", company.nip], ["REGON", company.regon], ["KRS", company.krs]].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-mono text-[13px] font-semibold">{v}</dd></div>
              ))}
            </dl>
          </div>

          <div className="rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:p-8">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy"><Landmark className="h-5 w-5 text-accent" /> Dane do przelewu</h2>
            <p className="mt-1 text-sm text-slate-500">{company.bank} · SWIFT <span className="font-mono">{company.swift}</span></p>
            <div className="mt-4 rounded-2xl bg-brand-50 p-4">
              <p className="font-mono text-[15px] font-bold tracking-wide text-brand-900">{company.account}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">W tytule podaj numer zamówienia</span>
                <CopyButton value={company.account} label="Kopiuj numer" />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link href="/blog" className="group flex items-center gap-4 rounded-2xl bg-leaf-50 p-5 ring-1 ring-leaf-100 transition hover:bg-leaf-100">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-accent"><BookOpen className="h-5 w-5" /></span>
              <span className="text-sm"><b className="block text-brand-900">Nie wiesz, co wybrać?</b><span className="text-slate-600">Przewodniki zakupowe i poradniki</span></span>
              <ArrowRight className="ml-auto h-4 w-4 text-accent transition group-hover:translate-x-1" />
            </Link>
            <Link href="/zwroty-i-reklamacje" className="group flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-brand-100 transition hover:ring-brand-200">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><RotateCcw className="h-5 w-5" /></span>
              <span className="text-sm"><b className="block text-brand-900">Zwrot lub reklamacja</b><span className="text-slate-600">Zgłoś przez formularz</span></span>
              <ArrowRight className="ml-auto h-4 w-4 text-brand-700 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </aside>
      </section>

      <section className="mt-10 h-96">
        <ConsentMap query={mapQuery} title="Sklep Sonax Białystok – mapa dojazdu" />
      </section>
    </div>
  );
}
