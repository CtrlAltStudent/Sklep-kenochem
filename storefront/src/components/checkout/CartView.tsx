"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock, RotateCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { formatPrice } from "@/lib/data";
import { resolveCart } from "@/lib/cart";
import { useStore } from "@/lib/store";
import { CartLineRow, FreeShippingBar } from "@/components/CartDrawer";
import { BrandMark } from "@/components/checkout/BrandMarks";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";

// Krok 1 – koszyk: przegląd produktów i przejście do dostawy i płatności
export function CartView({ minShip }: { minShip: number }) {
  const { cart } = useStore();
  const { lines, subtotal, count, missing, progress } = resolveCart(cart);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-white ring-1 ring-brand-100"><ShoppingBag className="h-10 w-10 text-brand-700" /></span>
        <h1 className="mt-6 text-2xl font-black">Twój koszyk jest pusty</h1>
        <p className="mt-2 text-slate-500">Dodaj produkty, a pojawią się tutaj.</p>
        <Link href="/" className="btn-kc mt-6 inline-block rounded-xl px-6 py-3.5 font-semibold text-white">Zacznij zakupy</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Koszyk <span className="text-lg font-semibold text-slate-400">({count} szt.)</span></h1>
        <CheckoutSteps current={0} />
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0 rounded-3xl bg-white p-4 ring-1 ring-brand-100 sm:p-6">
          <FreeShippingBar missing={missing} progress={progress} />
          <div className="mt-4 divide-y divide-brand-100">
            {lines.map((l) => <div key={l.slug + l.variantId} className="py-4 first:pt-2 last:pb-0"><CartLineRow line={l} /></div>)}
          </div>
          <Link href="/" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:underline">
            <ArrowLeft className="h-4 w-4" /> Kontynuuj zakupy
          </Link>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-40">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-brand-100">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Produkty</span><span className="font-semibold">{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Dostawa</span><span className="font-semibold">{missing === 0 ? <span className="text-green-700">Gratis</span> : `od ${formatPrice(minShip)}`}</span></div>
            </div>
            <div className="mt-4 flex items-end justify-between border-t border-brand-100 pt-4">
              <span className="font-semibold">Razem</span>
              <span className="text-3xl font-black">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Kod rabatowy wpiszesz w następnym kroku.</p>
            <Link href="/zamowienie" className="btn-kc mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-white">
              Dostawa i płatność <ArrowRight className="h-5 w-5" />
            </Link>
            <div className="mt-4 flex items-center justify-center gap-2">
              <BrandMark name="blik" /><BrandMark name="p24" /><BrandMark name="inpost" /><BrandMark name="orlen" />
            </div>
          </div>
          <ul className="grid gap-2 rounded-3xl bg-white p-5 text-[13px] text-slate-600 ring-1 ring-brand-100">
            <li className="flex items-center gap-2.5"><Truck className="h-4 w-4 text-leaf" /> Wysyłka w 24 h, darmowa od 399 zł</li>
            <li className="flex items-center gap-2.5"><Lock className="h-4 w-4 text-leaf" /> Bezpieczne płatności Przelewy24</li>
            <li className="flex items-center gap-2.5"><RotateCcw className="h-4 w-4 text-leaf" /> 14 dni na zwrot nieotwartego produktu</li>
            <li className="flex items-center gap-2.5"><ShieldCheck className="h-4 w-4 text-leaf" /> Faktura VAT na firmę</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
