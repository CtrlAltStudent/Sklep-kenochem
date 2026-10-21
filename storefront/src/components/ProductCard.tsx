"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, CircleCheck, Clock3, Heart, ShoppingCart } from "lucide-react";
import { formatPrice, minPrice, unitPrice, type ProductCardData } from "@/lib/data";
import { actions, useStore } from "@/lib/store";
import { ProductImage } from "./ProductImage";

const badgeStyle = {
  nowosc: "bg-navy text-white",
  promocja: "bg-accent text-white",
  bestseller: "bg-amber-400 text-navy",
};
const badgeLabel = { nowosc: "Nowość", promocja: "Promocja", bestseller: "Hit" };

/** Karta jak w x-kom / MediaExpert: zdjęcie, nazwa i cena do lewej, pełny przycisk koszyka. */
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
    <article className="group flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-brand-100 transition hover:shadow-lg hover:ring-brand-200">
      <div className="relative">
        <Link href={href} className="block bg-[#f6f7f8]" tabIndex={-1}>
          <ProductImage src={product.image} alt={product.name} className="aspect-square !bg-transparent" priority={priority}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw" />
        </Link>
        {!!product.badges?.length && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.badges.map((b) => (
              <span key={b} className={`px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${badgeStyle[b]}`}>{badgeLabel[b]}</span>
            ))}
          </div>
        )}
        <button type="button" onClick={() => actions.toggleWish(product)} aria-label={liked ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
          className={`absolute top-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/5 transition hover:scale-105 ${liked ? "" : "opacity-0 group-hover:opacity-100 focus:opacity-100 max-lg:opacity-100"}`}>
          <Heart className={`h-4 w-4 ${liked ? "animate-pop fill-accent text-accent" : "text-slate-500"}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-3 pt-3 pb-3">
        {product.brand && <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{product.brand}</p>}
        <Link href={href} className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug font-semibold text-ink hover:text-accent">
          {product.name}
        </Link>

        <div className="mt-auto pt-2">
          {cheapest.oldPrice && <p className="text-xs text-slate-400 line-through">{formatPrice(cheapest.oldPrice)}</p>}
          <p className={`text-lg leading-none ${cheapest.oldPrice ? "text-accent" : "text-navy"}`}>
            {multi && <span className="mr-1 text-xs font-medium text-slate-500">od</span>}
            <b className="font-extrabold tabular-nums">{formatPrice(minPrice(product))}</b>
          </p>
          {unitPrice(cheapest.price, cheapest.label) && <p className="mt-0.5 text-[11px] text-slate-500">{unitPrice(cheapest.price, cheapest.label)}</p>}
          {cheapest.oldPrice && product.lowestPrice30d != null && (
            <p className="mt-0.5 text-[10px] leading-tight text-slate-400">Najniższa z 30 dni: {formatPrice(product.lowestPrice30d)}</p>
          )}
          <p className={`mt-2 flex items-center gap-1 text-[11px] font-medium ${inStock ? "text-green-700" : "text-amber-700"}`}>
            {inStock ? <><CircleCheck className="h-3.5 w-3.5" /> wysyłka 24 h</> : <><Clock3 className="h-3.5 w-3.5" /> na zamówienie</>}
          </p>
          <button type="button" onClick={add} aria-label={`Dodaj do koszyka: ${product.name}`}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white transition active:scale-[.98] ${added ? "bg-green-600" : "bg-accent hover:bg-accent-dark"}`}>
            {added ? <><Check className="h-4 w-4" /> Dodano</> : <><ShoppingCart className="h-4 w-4" /> Do koszyka</>}
          </button>
        </div>
      </div>
    </article>
  );
}
