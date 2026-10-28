import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, CreditCard, PackageCheck, RotateCcw, Smartphone } from "lucide-react";
import { formatPrice, freeShippingFrom, methodFreeFrom } from "@/lib/data";
import { getStoreSettings } from "@/lib/cms";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BrandMark, carrierFromCode } from "@/components/checkout/BrandMarks";
import { paymentAvailable, shippingAvailable } from "@/integrations/availability";

// Metody i ceny pochodzą z panelu (Ustawienia sklepu) – strona renderowana przy każdym wejściu
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dostawa i płatności",
  description: "Formy dostawy (InPost Paczkomat i kurier, ORLEN Paczka, odbiór osobisty) i płatności (Przelewy24, BLIK, karta, przelew, pobranie) w sklepie Sonax.",
};

const payIcon = { przelewy24: Smartphone, transfer: Banknote, cod: PackageCheck, deferred: CreditCard } as const;

export default async function DeliveryPage() {
  const s = await getStoreSettings();
  const ships = (s.shippingMethods ?? []).filter(shippingAvailable);
  const pays = (s.paymentMethods ?? []).filter(paymentAvailable);
  const free = freeShippingFrom(s);

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: "Dostawa i płatności" }]} />
      <header className="mt-4 grid gap-6 rounded-3xl bg-gradient-to-br from-brand-800 to-brand-900 p-8 text-white sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Dostawa i płatności</h1>
          <p className="mt-3 max-w-xl text-brand-100">Wysyłamy na terenie całej Polski i za granicę. Zamówienia złożone do 14:00 w dni robocze wysyłamy tego samego dnia.</p>
        </div>
        <div className="rounded-2xl bg-lime p-6 text-brand-950">
          <p className="text-sm font-semibold">Darmowa dostawa</p>
          <p className="text-4xl font-black">od {formatPrice(free)}</p>
          <p className="text-xs opacity-80">dla przesyłek kurierskich i paczkomatów</p>
        </div>
      </header>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-navy">Formy dostawy</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ships.map((m) => {
            return (
              <div key={m.code} className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-brand-100">
                <BrandMark name={carrierFromCode(m.code)} />
                <h3 className="mt-4 font-bold text-navy">{m.label}</h3>
                <p className="mt-auto pt-3 text-lg font-extrabold text-brand-800">
                  {m.price > 0 ? formatPrice(m.price) : m.code.includes("palet") ? "wycena indywidualna" : "bezpłatnie"}
                </p>
                {methodFreeFrom(m, free) != null && m.price > 0 && <p className="text-xs text-green-700">gratis od {formatPrice(methodFreeFrom(m, free)!)}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-navy">Formy płatności</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {pays.map((m) => {
            const Icon = payIcon[(m.provider ?? "transfer") as keyof typeof payIcon] ?? CreditCard;
            return (
              <div key={m.code} className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-brand-100">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5" /></span>
                <div>
                  <h3 className="font-bold text-navy">{m.label}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {m.provider === "przelewy24" && "Po wybraniu tej płatności zostaniesz przekierowany do płatności Przelewy24. Dostępne: BLIK, karta, Google Pay, Apple Pay i szybkie przelewy."}
                    {m.provider === "transfer" && "Prosimy o wpłatę bezpośrednio na nasze konto bankowe. Proszę użyć numeru zamówienia jako tytułu płatności. Zamówienie zostanie zrealizowane po zaksięgowaniu wpłaty."}
                    {m.provider === "cod" && "Płacisz kurierowi przy odbiorze przesyłki – gotówką lub kartą."}
                    {m.provider === "deferred" && "Faktura z odroczonym terminem płatności dla zweryfikowanych firm i instytucji."}
                  </p>
                  {m.b2bOnly && <span className="mt-2 inline-block rounded-full bg-lime/30 px-2.5 py-0.5 text-xs font-semibold text-brand-900">dla kont B2B</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-12 flex flex-col items-start gap-4 rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:flex-row sm:items-center sm:p-8">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700"><RotateCcw className="h-6 w-6" /></span>
        <div className="flex-1">
          <h2 className="font-bold text-navy">Zwroty i reklamacje</h2>
          <p className="text-sm text-slate-600">Masz 14 dni na odstąpienie od umowy bez podania przyczyny. Szczegóły znajdziesz w regulaminie.</p>
        </div>
        <Link href="/regulamin" className="rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white hover:bg-accent">Przeczytaj regulamin</Link>
      </section>
    </div>
  );
}
