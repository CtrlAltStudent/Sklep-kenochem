"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, CircleCheck, Clock3, Heart, ShoppingCart, Truck } from "lucide-react";
import { formatPrice, minPrice, unitPrice, type ProductCardData } from "@/lib/data";
import { actions, useStore } from "@/lib/store";
import { ProductImage } from "./ProductImage";

const badgeStyle = {
  nowosc: "bg-accent text-white",
  promocja: "bg-red-500 text-white",
  bestseller: "bg-lime text-brand-950",
};
const badgeLabel = { nowosc: "Nowość", promocja: "Promocja", bestseller: "Bestseller" };

// Karta produktu (układ wzorowany na agrosimex.pl): szare pole zdjęcia z okrągłym przyciskiem koszyka,
// wyśrodkowane marka/nazwa/cena, lista pojemności i pasek dostępności pod kartą
export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const { wishlist } = useStore();
  const [added, setAdded] = useState(false);
  const liked = wishlist.some((p) => p.slug === product.slug);
  const cheapest = product.variants.reduce((a, b) => (b.price < a.price ? b : a));
  const multi = product.variants.length > 1;
  const inStock = product.stock > 0;
  const href = `/produkt/${product.slug}`;

  const add = () => {
    actions.add(product, cheapest.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group flex h-full flex-col">
      <div className="relative flex flex-1 flex-col rounded-2xl bg-white p-2.5 ring-1 ring-brand-100/70 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-brand-900/10 group-hover:ring-brand-200">
        {/* Zdjęcie */}
        <div className="relative">
          <Link href={href} className="block overflow-hidden rounded-xl bg-[#f3f5f1]" tabIndex={-1}>
            <ProductImage src={product.image} alt={product.name} className="aspect-square !bg-transparent" priority={priority}
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw" />
          </Link>
          {!!product.badges?.length && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.badges.map((b) => (
                <span key={b} className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${badgeStyle[b]}`}>{badgeLabel[b]}</span>
              ))}
            </div>
          )}
          <button onClick={() => actions.toggleWish(product)} aria-label={liked ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
            className={`absolute top-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm ring-1 ring-brand-100 transition hover:scale-110 ${liked ? "" : "opacity-0 group-hover:opacity-100 focus:opacity-100 max-lg:opacity-100"}`}>
            <Heart className={`h-4.5 w-4.5 ${liked ? "animate-pop fill-red-500 text-red-500" : "text-brand-700"}`} />
          </button>
          <button onClick={add} aria-label={`Dodaj do koszyka: ${product.name}`}
            className={`absolute -bottom-4 right-3 grid h-11 w-11 place-items-center rounded-full text-white shadow-lg ring-4 ring-white transition hover:scale-110 active:scale-95 ${added ? "bg-green-600" : "btn-kc"}`}>
            {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
          </button>
        </div>

        {/* Opis */}
        <div className="flex flex-1 flex-col items-center px-2 pt-6 pb-2 text-center">
          {product.brand && <span className="text-[11px] font-bold tracking-wider text-accent-dark uppercase">{product.brand}</span>}
          <Link href={href} className="mt-1 line-clamp-2 min-h-[2.6rem] text-[13.5px] leading-snug font-bold text-ink transition hover:text-brand-700">
            {product.name}
          </Link>
          <div className="mt-auto pt-3">
            {cheapest.oldPrice && <div className="text-xs text-slate-400 line-through">{formatPrice(cheapest.oldPrice)}</div>}
            <div className={`text-lg leading-none ${cheapest.oldPrice ? "text-red-600" : "text-navy"}`}>
              {multi && <span className="mr-1 text-xs font-medium text-slate-500">od</span>}
              <b className="font-extrabold">{formatPrice(minPrice(product))}</b>
            </div>
            {unitPrice(cheapest.price, cheapest.label) && <div className="mt-1 text-[11px] text-slate-500">{unitPrice(cheapest.price, cheapest.label)}</div>}
            {cheapest.oldPrice && product.lowestPrice30d != null && (
              <div className="mt-0.5 text-[10px] leading-tight text-slate-400">Najniższa cena z 30 dni: {formatPrice(product.lowestPrice30d)}</div>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {product.variants.map((v) => (
                <span key={v.id} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-600">{v.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pasek dostępności pod kartą */}
      <div className="card-avail flex items-center justify-center gap-3 px-1 pt-2 text-[11px] font-medium">
        {inStock ? (
          <>
            <span className="flex items-center gap-1 text-green-700"><CircleCheck className="h-3.5 w-3.5" /> dostępny</span>
            <span className="flex items-center gap-1 text-slate-500"><Truck className="h-3.5 w-3.5" /> wysyłka w 24 h</span>
          </>
        ) : (
          <span className="flex items-center gap-1 text-amber-700"><Clock3 className="h-3.5 w-3.5" /> na zamówienie</span>
        )}
      </div>
    </div>
  );
}
