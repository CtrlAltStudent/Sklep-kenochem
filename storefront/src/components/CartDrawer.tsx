"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { formatPrice } from "@/lib/data";
import { qtyDealText } from "@/lib/qtyDeal";
import { resolveCart, type ResolvedLine } from "@/lib/cart";
import { actions, useStore } from "@/lib/store";
import { ProductImage } from "./ProductImage";
import { useFreeShipping } from "@/lib/shopConfig";

export function FreeShippingBar({ missing, progress }: { missing: number; progress: number }) {
  return (
    <div className="rounded-xl bg-brand-50 p-3">
      <p className="flex items-center gap-2 text-sm">
        <Truck className="h-4 w-4 text-accent-dark" />
        {missing > 0 ? (
          <>Brakuje Ci <b>{formatPrice(missing)}</b> do darmowej dostawy</>
        ) : (
          <b className="text-green-700">Masz darmową dostawę! 🎉</b>
        )}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100">
        <div className="h-full rounded-full bg-gradient-to-r from-accent to-lime transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

export function CartLineRow({ line, compact }: { line: ResolvedLine; compact?: boolean }) {
  const { slug, variantId, qty } = line;
  return (
    <div className="flex gap-3">
      <Link href={`/produkt/${slug}`} onClick={() => actions.openCart(false)} className="shrink-0">
        <ProductImage src={line.image} alt={line.name} sizes="96px" className={`${compact ? "h-20 w-20" : "h-24 w-24"} rounded-xl border border-brand-100`} />
      </Link>
      <div className="flex flex-1 flex-col">
        <Link href={`/produkt/${slug}`} onClick={() => actions.openCart(false)} className="line-clamp-2 text-sm leading-snug font-semibold hover:text-accent-dark">
          {line.name}
        </Link>
        <span className="text-xs text-slate-500">
          {line.label} · {formatPrice(line.price)} / szt.
          {line.hits > 0 && line.deal ? <span className="font-semibold text-green-700"> · {qtyDealText(line.deal)} ({line.hits} szt.)</span> : null}
        </span>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center rounded-lg border border-brand-100">
            <button onClick={() => actions.setQty(slug, variantId, qty - 1)} aria-label="Zmniejsz" className="grid h-8 w-8 place-items-center hover:bg-brand-50">
              {qty === 1 ? <Trash2 className="h-3.5 w-3.5 text-red-500" /> : <Minus className="h-3.5 w-3.5" />}
            </button>
            <span className="w-8 text-center text-sm font-semibold">{qty}</span>
            <button onClick={() => actions.setQty(slug, variantId, qty + 1)} aria-label="Zwiększ" className="grid h-8 w-8 place-items-center hover:bg-brand-50">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-right">
            {line.hits > 0 && <span className="block text-xs font-normal text-slate-400 line-through">{formatPrice(line.full)}</span>}
            <span className="font-bold">{formatPrice(line.total)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { cart, cartOpen } = useStore();
  const { lines, subtotal, missing, progress } = resolveCart(cart, useFreeShipping());

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && actions.openCart(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cartOpen]);

  if (!cartOpen) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-brand-950/50 backdrop-blur-sm" onClick={() => actions.openCart(false)} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-brand-100 p-5">
          <h2 className="text-lg font-bold">Twój koszyk</h2>
          <button onClick={() => actions.openCart(false)} aria-label="Zamknij koszyk" className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 hover:bg-brand-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-50"><ShoppingBag className="h-9 w-9 text-brand-700" /></span>
            <p className="font-semibold">Koszyk jest pusty</p>
            <p className="text-sm text-slate-500">Dodaj produkty, a pojawią się tutaj.</p>
            <button onClick={() => actions.openCart(false)} className="rounded-xl bg-brand-900 px-5 py-3 text-sm font-semibold text-white hover:bg-accent">
              Kontynuuj zakupy
            </button>
          </div>
        ) : (
          <>
            <div className="p-5 pb-0"><FreeShippingBar missing={missing} progress={progress} /></div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {lines.map((l) => <CartLineRow key={l.slug + l.variantId} line={l} compact />)}
            </div>
            <div className="space-y-3 border-t border-brand-100 p-5">
              <div className="flex justify-between text-lg">
                <span>Suma</span><b>{formatPrice(subtotal)}</b>
              </div>
              <p className="text-xs text-slate-500">Ceny brutto. Koszt dostawy obliczymy w kolejnym kroku.</p>
              <Link href="/koszyk" onClick={() => actions.openCart(false)}
                className="block rounded-xl bg-accent py-3.5 text-center font-bold text-white transition hover:bg-accent-dark">
                Przejdź do kasy
              </Link>
              <button onClick={() => actions.openCart(false)} className="w-full py-2 text-sm font-semibold text-slate-600 hover:text-brand-900">
                Kontynuuj zakupy
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
