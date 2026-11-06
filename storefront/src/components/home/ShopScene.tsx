"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import { formatPrice, type ProductCardData } from "@/lib/data";
import { actions } from "@/lib/store";
import { ProductImage } from "@/components/ProductImage";

export type SceneSpotView = { x: number; y: number; cardX?: number; cardY?: number; products: ProductCardData[] };

export function ShopScene({ kicker, title, hint, image, spots }: {
  kicker: string;
  title: string;
  hint: string;
  image: string;
  spots: SceneSpotView[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [added, setAdded] = useState("");

  const add = (product: ProductCardData) => {
    const variant = product.variants.find((v) => (v.stock ?? product.stock) > 0) ?? product.variants[0];
    if (!variant || (variant.stock ?? product.stock) <= 0) return;
    actions.add(product, variant.id);
    setAdded(product.slug);
    setTimeout(() => setAdded(""), 1600);
  };

  return (
    <section className="mx-auto max-w-shop px-4 py-8 sm:py-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          {kicker && <p className="text-xs font-bold tracking-widest text-accent uppercase">{kicker}</p>}
          <h2 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{title}</h2>
        </div>
        {hint && <p className="hidden text-sm text-slate-500 sm:block">{hint}</p>}
      </div>
      <div className="relative aspect-[1600/640] overflow-hidden rounded-3xl bg-slate-200" onMouseLeave={() => setOpen(null)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {spots.map((spot, i) => (
          <button
            key={`${spot.x}-${spot.y}-${i}`}
            type="button"
            aria-expanded={open === i}
            aria-label={spot.products[0]?.name || "Produkt"}
            onMouseEnter={() => setOpen(i)}
            onFocus={() => setOpen(i)}
            onClick={() => setOpen(open === i ? null : i)}
            className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          >
            <span className="absolute inset-0 grid place-items-center">
              <span className="absolute h-8 w-8 animate-ping rounded-full bg-white/80" />
              <span className="relative h-3.5 w-3.5 rounded-full border-2 border-white bg-accent shadow" />
            </span>
          </button>
        ))}
        {open != null && spots[open] && (() => {
          const spot = spots[open];
          const placed = Number.isFinite(spot.cardX) && Number.isFinite(spot.cardY);
          return (
          <div
            className={placed ? "absolute z-10 max-h-[80%] overflow-auto" : "absolute right-3 bottom-3 left-3 z-10 max-h-[70%] overflow-auto sm:top-4 sm:right-4 sm:bottom-auto sm:left-auto sm:w-80"}
            style={placed ? { left: `${spot.cardX}%`, top: `${spot.cardY}%`, width: `min(20rem, ${Math.max(28, 100 - (spot.cardX ?? 0))}%)` } : undefined}
            onMouseEnter={() => setOpen(open)}
          >
            <ul className="space-y-2">
              {spots[open].products.map((product) => {
                const variant = product.variants.find((v) => (v.stock ?? product.stock) > 0) ?? product.variants[0];
                const inStock = (variant?.stock ?? product.stock) > 0;
                return (
                  <li key={product.slug} className="flex gap-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-brand-100">
                    <Link href={`/produkt/${product.slug}`} className="shrink-0">
                      <ProductImage src={product.image} alt="" className="h-16 w-16 rounded-xl" sizes="64px" />
                    </Link>
                    <div className="min-w-0">
                      <Link href={`/produkt/${product.slug}`} className="line-clamp-2 text-sm font-bold text-navy hover:text-accent">{product.name}</Link>
                      <p className="mt-1 text-sm font-black text-navy">{variant ? formatPrice(variant.price) : ""}{!inStock && <span className="ml-2 text-xs font-semibold text-slate-400">chwilowo brak</span>}</p>
                      <button type="button" disabled={!inStock} onClick={() => add(product)} className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white ${added === product.slug ? "bg-green-600" : "btn-kc"} disabled:bg-slate-200 disabled:text-slate-500`}>
                        {added === product.slug ? <><Check className="h-3.5 w-3.5" /> Dodano</> : <><ShoppingCart className="h-3.5 w-3.5" /> Do koszyka</>}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          );
        })()}
      </div>
    </section>
  );
}
