import type { Metadata } from "next";
import { Building2, Handshake, Phone, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { B2BForm } from "@/components/forms/Forms";

export const metadata: Metadata = {
  title: "Dla firm – konto hurtowe (B2B)",
  description: "Chemia SONAX dla myjni, detailingu, warsztatów i firm sprzątających. Złóż wniosek o konto hurtowe – warunki ustalamy indywidualnie.",
};

const perks = [
  { icon: Handshake, title: "Warunki ustalane indywidualnie", text: "Ceny i rabaty dopasowane do skali zakupów Twojej firmy." },
  { icon: Building2, title: "Faktura VAT na firmę", text: "Dokumenty przez nasz system księgowy – bez dodatkowych formalności." },
  { icon: Truck, title: "Szybka wysyłka", text: "Większość produktów wysyłamy w 1 dzień roboczy, także w większych ilościach." },
  { icon: Phone, title: "Doradztwo", text: "Pomożemy dobrać chemię do myjni, detailingu czy serwisu: +48 500 021 705." },
];

// Wniosek o konto hurtowe: formularz trafia do panelu (Wiadomości) z mailem do sklepu
export default function B2BPage() {
  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: "Dla firm (B2B)" }]} />

      <header className="carbon relative mt-4 overflow-hidden rounded-3xl px-6 py-10 text-white sm:px-10">
        <div className="pointer-events-none absolute -right-16 bottom-0 h-full w-1/3 skew-x-[-14deg] bg-accent/80" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold tracking-widest text-lime uppercase">Myjnie · detailing · warsztaty · firmy sprzątające</p>
          <h1 className="title-sport mt-2 text-5xl sm:text-6xl">Dla firm</h1>
          <p className="mt-3 text-white/75">Kupujesz chemię SONAX regularnie lub w większych ilościach? Złóż wniosek o konto hurtowe – odezwiemy się w ciągu 1 dnia roboczego.</p>
        </div>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-brand-100">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-accent"><Icon className="h-5 w-5" /></span>
              <span><b className="block text-navy">{title}</b><span className="text-sm text-slate-600">{text}</span></span>
            </div>
          ))}
        </section>
        <section className="rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:p-8">
          <h2 className="text-2xl font-black text-navy">Wniosek o konto hurtowe</h2>
          <p className="mt-1 mb-5 text-sm text-slate-600">Sprawdzimy dane firmy i przygotujemy warunki współpracy.</p>
          <B2BForm />
        </section>
      </div>
    </div>
  );
}
