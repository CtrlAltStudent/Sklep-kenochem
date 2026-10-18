import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, ClipboardList, PackageCheck, Phone, ShieldCheck, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ReturnForm } from "@/components/forms/Forms";

export const metadata: Metadata = {
  title: "Zwroty i reklamacje",
  description: "Zwróć produkt w ciągu 14 dni lub zgłoś reklamację online. Formularz zwrotu i reklamacji sklepu Kenochem.",
};

const steps = [
  { icon: ClipboardList, title: "Wypełnij formularz", text: "Podaj numer zamówienia i produkty, które chcesz zwrócić lub zareklamować." },
  { icon: CalendarClock, title: "Poczekaj na odpowiedź", text: "W ciągu 1 dnia roboczego wyślemy numer zgłoszenia i instrukcję wysyłki." },
  { icon: Truck, title: "Odeślij paczkę", text: "Zapakuj produkty bezpiecznie i nadaj na adres podany w wiadomości." },
  { icon: PackageCheck, title: "Gotowe", text: "Zwrot pieniędzy w ciągu 14 dni od otrzymania przesyłki." },
];

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: "Zwroty i reklamacje" }]} />
      <header className="mt-4 rounded-3xl bg-gradient-to-br from-brand-800 to-brand-900 px-6 py-10 text-white sm:px-10">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Zwroty i reklamacje</h1>
        <p className="mt-3 max-w-2xl text-brand-100">Masz 14 dni na zwrot produktu bez podania przyczyny. Reklamację możesz zgłosić w każdej chwili – rozpatrzymy ją w ciągu 14 dni.</p>
      </header>

      <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="relative rounded-2xl bg-white p-5 ring-1 ring-brand-100">
            <span className="absolute top-4 right-4 text-3xl font-black text-brand-100">{i + 1}</span>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5" /></span>
            <h2 className="mt-4 font-bold text-navy">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{text}</p>
          </li>
        ))}
      </ol>

      <section className="mt-10 grid items-start gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:p-10">
          <h2 className="mb-6 text-2xl font-extrabold text-navy">Formularz zgłoszenia</h2>
          <ReturnForm />
        </div>
        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-brand-100">
            <h3 className="flex items-center gap-2 font-extrabold text-navy"><ShieldCheck className="h-5 w-5 text-accent" /> Ważne informacje</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Zwracany produkt powinien być nieotwarty i nieuszkodzony – chemia po otwarciu nie podlega zwrotowi ze względów bezpieczeństwa.</li>
              <li>• Koszt odesłania zwrotu ponosi kupujący; przy uznanej reklamacji zwracamy koszty przesyłki.</li>
              <li>• Do paczki dołącz numer zgłoszenia, który otrzymasz e-mailem.</li>
            </ul>
            <Link href="/regulamin" className="mt-4 inline-block text-sm font-bold text-accent-dark hover:underline">Pełne zasady w regulaminie →</Link>
          </div>
          <a href="tel:+48500021705" className="flex items-center gap-4 rounded-2xl bg-lime/20 p-5 ring-1 ring-lime/40">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-brand-700"><Phone className="h-5 w-5" /></span>
            <span className="text-sm"><b className="block text-brand-900">Wolisz porozmawiać?</b><span className="text-slate-600">+48 500 021 705 · Pn–Pt 8–16</span></span>
          </a>
        </aside>
      </section>
    </div>
  );
}
