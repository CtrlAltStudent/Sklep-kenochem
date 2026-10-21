"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, CircleCheck, Clock3, Heart, ShoppingCart, Truck } from "lucide-react";
import { formatPrice, minPrice, unitPrice, type ProductCardData } from "@/lib/data";
import { actions, useStore } from "@/lib/store";
import { ProductImage } from "./ProductImage";

// Produkt w widoku listy (szeroki wiersz) – jak w dużych sklepach
export function ProductRow({ product }: { product: ProductCardData }) {
  const { wishlist } = useStore();
  const [added, setAdded] = useState(false);
  const liked = wishlist.some((p) => p.slug === product.slug);
  const v = product.variants.reduce((a, b) => (b.price < a.price ? b : a));
  const unit = unitPrice(v.price, v.label);
  const href = `/produkt/${product.slug}`;

  return (
    <div className="group flex gap-4 rounded-2xl bg-white p-3 ring-1 ring-brand-100 transition hover:shadow-lg hover:shadow-brand-900/5 hover:ring-brand-200 sm:gap-6 sm:p-4">
      <Link href={href} className="w-28 shrink-0 overflow-hidden rounded-xl bg-[#f3f5f1] sm:w-40">
        <ProductImage src={product.image} alt={product.name} className="aspect-square !bg-transparent" sizes="160px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:gap-6">
        <div className="min-w-0 flex-1">
          {product.brand && <p className="text-[11px] font-bold tracking-wider text-accent-dark uppercase">{product.brand}</p>}
          <Link href={href} className="line-clamp-2 font-bold text-ink hover:text-brand-700">{product.name}</Link>
          <div className="mt-2 flex flex-wrap gap-1">
            {product.variants.map((x) => <span key={x.id} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{x.label}</span>)}
          </div>
          <p className={`mt-2 flex items-center gap-3 text-xs font-medium ${product.stock > 0 ? "text-green-700" : "text-amber-700"}`}>
            {product.stock > 0
              ? <><span className="flex items-center gap-1"><CircleCheck className="h-3.5 w-3.5" /> dostępny</span><span className="flex items-center gap-1 text-slate-500"><Truck className="h-3.5 w-3.5" /> wysyłka w 24 h</span></>
              : <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> na zamówienie</span>}
          </p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 sm:mt-0 sm:w-48 sm:flex-col sm:items-end sm:justify-center">
          <div className="sm:text-right">
            {v.oldPrice && <p className="text-xs text-slate-400 line-through">{formatPrice(v.oldPrice)}</p>}
            <p className={`text-xl font-black ${v.oldPrice ? "text-red-600" : "text-navy"}`}>
              {product.variants.length > 1 && <span className="mr-1 text-xs font-medium text-slate-500">od</span>}{formatPrice(minPrice(product))}
            </p>
            {unit && <p className="text-[11px] text-slate-500">{unit}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => actions.toggleWish(product)} aria-label="Ulubione" className="grid h-11 w-11 place-items-center rounded-xl ring-1 ring-brand-100 hover:bg-brand-50">
              <Heart className={`h-4.5 w-4.5 ${liked ? "fill-red-500 text-red-500" : "text-brand-700"}`} />
            </button>
            <button onClick={() => { actions.add(product, v.id); setAdded(true); setTimeout(() => setAdded(false), 1500); }}
              className={`flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition ${added ? "bg-green-600" : "bg-brand-700 hover:bg-accent"}`}>
              {added ? <Check className="h-4.5 w-4.5" /> : <ShoppingCart className="h-4.5 w-4.5" />} <span className="hidden sm:inline">{added ? "Dodano" : "Do koszyka"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
