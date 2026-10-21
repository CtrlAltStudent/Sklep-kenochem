"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Check, Flag, Heart, Lock, Minus, PackageCheck, Plus, ShoppingCart, Truck } from "lucide-react";
import { formatPrice, toCard, unitPrice, type Product } from "@/lib/data";
import { actions, useStore } from "@/lib/store";
import { DispatchInfo, ProductActions, StockAlertForm } from "./ProductExtras";
import { useFreeShipping } from "@/lib/shopConfig";

// Pole zakupu (prawa kolumna) + przyklejony pasek „Dodaj do koszyka” na telefonie
export function ProductBuy({ product }: { product: Product }) {
  const freeShipping = useFreeShipping();
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { wishlist } = useStore();
  const liked = wishlist.some((p) => p.slug === product.slug);
  const variant = product.variants.find((v) => v.id === variantId)!;
  const net = variant.price / (1 + product.vat / 100);
  const inStock = product.stock > 0;

  // Pasek na dole ekranu pokazujemy, gdy główny przycisk zniknie z widoku
  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const add = () => {
    actions.add(toCard(product), variant.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const trust = [
    { icon: Truck, text: <>Darmowa dostawa od <b>{formatPrice(freeShipping)}</b></> },
    { icon: Lock, text: <>BLIK, karta, przelew</> },
    { icon: BadgeCheck, text: <>Oryginalne produkty</> },
    { icon: PackageCheck, text: <><b>14 dni</b> na zwrot</> },
    { icon: Flag, text: <>Polska firma, 25 lat</> },
  ];

  return (
    <>
      <div className="rounded-xl bg-white p-5 ring-1 ring-brand-100">
        <p className={`flex items-center gap-2 text-sm font-semibold ${inStock ? "text-green-700" : "text-amber-700"}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${inStock ? (product.stock > 5 ? "bg-green-500" : "bg-amber-500") : "bg-amber-500"}`} />
          {inStock ? (product.stock > 5 ? "Produkt dostępny" : `Ostatnie sztuki (${product.stock})`) : "Na zamówienie – zapytaj o termin"}
        </p>

        {product.variants.length > 1 ? (
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">Pojemność</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button key={v.id} onClick={() => setVariantId(v.id)}
                  className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition ${v.id === variantId ? "border-accent bg-brand-50 text-brand-900" : "border-brand-100 hover:border-brand-200"}`}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4"><span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800">{variant.label}</span></p>
        )}

        <div className="mt-5">
          <div className="flex items-end gap-3">
            <span className={`text-4xl font-black tracking-tight ${variant.oldPrice ? "text-red-600" : "text-navy"}`}>{formatPrice(variant.price)}</span>
            {variant.oldPrice && <span className="pb-1 text-lg text-slate-400 line-through">{formatPrice(variant.oldPrice)}</span>}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {unitPrice(variant.price, variant.label) && <><b className="text-slate-700">{unitPrice(variant.price, variant.label)}</b> · </>}
            {formatPrice(net)} netto · zawiera {product.vat}% VAT
            {variant.oldPrice && <><br />Najniższa cena z 30 dni przed obniżką: <b>{formatPrice(product.lowestPrice30d ?? variant.oldPrice)}</b></>}
            {product.saleTo && <><br />Promocja trwa do {new Date(product.saleTo).toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}</>}
          </p>
        </div>

        <div className="mt-5 flex gap-2">
          <div className="flex items-center rounded-xl border-2 border-brand-100">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Zmniejsz ilość" className="grid h-12 w-10 place-items-center hover:bg-brand-50"><Minus className="h-4 w-4" /></button>
            <input value={qty} onChange={(e) => setQty(Math.max(1, Math.min(999, Number(e.target.value.replace(/\D/g, "")) || 1)))} inputMode="numeric" aria-label="Ilość"
              className="w-10 bg-transparent text-center font-bold outline-none" />
            <button onClick={() => setQty(qty + 1)} aria-label="Zwiększ ilość" className="grid h-12 w-10 place-items-center hover:bg-brand-50"><Plus className="h-4 w-4" /></button>
          </div>
          <button ref={buttonRef} onClick={add}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-white shadow-lg transition active:scale-[.98] ${added ? "bg-green-600 shadow-green-600/20" : "btn-kc"}`}>
            {added ? <><Check className="h-5 w-5" /> Dodano</> : <><ShoppingCart className="h-5 w-5" /> Do koszyka</>}
          </button>
        </div>
        <button onClick={() => actions.toggleWish(toCard(product))}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-800">
          <Heart className={`h-4.5 w-4.5 ${liked ? "animate-pop fill-red-500 text-red-500" : ""}`} /> {liked ? "W ulubionych" : "Dodaj do ulubionych"}
        </button>
        <div className="mt-3">{inStock ? <DispatchInfo inStock /> : <StockAlertForm slug={product.slug} />}</div>

        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-brand-100 pt-4 text-[12px] text-slate-600">
          {trust.map(({ icon: Icon, text }, i) => (
            <li key={i} className={`flex items-center gap-2 ${i === 0 ? "col-span-2" : ""}`}><Icon className="h-4 w-4 shrink-0 text-accent" /> <span>{text}</span></li>
          ))}
        </ul>

        <div className="mt-4"><ProductActions name={product.name} slug={product.slug} /></div>

      </div>

      {/* Pasek zakupu na telefonie */}
      <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-brand-100 bg-white/95 p-3 backdrop-blur transition-transform lg:hidden ${showBar ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-slate-500">{product.name}</p>
            <p className="text-lg font-black text-navy">{formatPrice(variant.price)}</p>
          </div>
          <button onClick={add} className={`flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-white ${added ? "bg-green-600" : "btn-kc"}`}>
            {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />} {added ? "Dodano" : "Do koszyka"}
          </button>
        </div>
      </div>
    </>
  );
}
