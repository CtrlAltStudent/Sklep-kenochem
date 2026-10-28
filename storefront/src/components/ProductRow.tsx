"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, CircleCheck, Clock3, Heart, ShoppingCart, Truck } from "lucide-react";
import { cardVariant, formatPrice, minPrice, showFromPrice, unitPrice, type ProductCardData } from "@/lib/data";
import { qtyDealText } from "@/lib/qtyDeal";
import { actions, useStore } from "@/lib/store";
import { ProductImage } from "./ProductImage";

// Produkt w widoku listy (szeroki wiersz) – jak w dużych sklepach
export function ProductRow({ product }: { product: ProductCardData }) {
  const { wishlist } = useStore();
  const [added, setAdded] = useState(false);
  const liked = wishlist.some((p) => p.slug === product.slug);
  const v = cardVariant(product);
  const unit = unitPrice(v.price, v.label);
  const href = `/produkt/${product.slug}`;
  const inStock = (v.stock ?? product.stock) > 0;
  const multi = showFromPrice(product);

  return (
    <div className="group flex gap-4 rounded-2xl bg-white p-3 ring-1 ring-brand-100 transition hover:shadow-lg hover:shadow-brand-900/5 hover:ring-brand-200 sm:gap-6 sm:p-4">
      <Link href={href} className={`w-28 shrink-0 overflow-hidden rounded-xl bg-[#f3f5f1] sm:w-40 ${inStock ? "" : "opacity-50 grayscale"}`}>
        <ProductImage src={product.image} alt={product.name} className="aspect-square !bg-transparent" sizes="160px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:gap-6">
        <div className="min-w-0 flex-1">
          {product.brand && <p className="text-[11px] font-bold tracking-wider text-accent-dark uppercase">{product.brand}</p>}
          <Link href={href} className="line-clamp-2 font-bold text-ink hover:text-brand-700">{product.name}</Link>
          <div className="mt-2 flex flex-wrap gap-1">
            {product.variants.map((x) => {
              const chip = product.variantDisplay === "zdjecie" && x.image ? (
                <span className="flex items-center gap-1 rounded-md bg-slate-100 pr-1.5 text-[11px] font-semibold text-slate-600">
                  <span className="relative h-6 w-6 overflow-hidden rounded-sm bg-white"><ProductImage src={x.image} alt="" className="aspect-square !bg-transparent" sizes="24px" /></span>
                  {x.label}
                </span>
              ) : (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{x.label}</span>
              );
              if (product.variantNav === "link" && x.slug && x.slug !== product.slug) {
                return <Link key={x.id} href={`/produkt/${x.slug}`}>{chip}</Link>;
              }
              return <span key={x.id}>{chip}</span>;
            })}
          </div>
          <p className={`mt-2 flex items-center gap-3 text-xs font-medium ${product.stock > 0 ? "text-green-700" : "text-amber-700"}`}>
            {product.stock > 0
              ? <><span className="flex items-center gap-1"><CircleCheck className="h-3.5 w-3.5" /> dostępny</span><span className="flex items-center gap-1 text-slate-500"><Truck className="h-3.5 w-3.5" /> wysyłka w 24 h</span></>
              : <span className="flex items-center gap-1 text-slate-500"><Clock3 className="h-3.5 w-3.5" /> chwilowo niedostępny</span>}
          </p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 sm:mt-0 sm:w-48 sm:flex-col sm:items-end sm:justify-center">
          <div className="sm:text-right">
            {v.oldPrice && <p className="text-xs text-slate-400 line-through">{formatPrice(v.oldPrice)}</p>}
            <p className={`text-xl font-black ${!inStock ? "text-slate-400" : v.oldPrice ? "text-red-600" : "text-navy"}`}>
              {multi && <span className="mr-1 text-xs font-medium text-slate-500">od</span>}{formatPrice(multi ? minPrice(product) : v.price)}
            </p>
            {unit && <p className="text-[11px] text-slate-500">{unit}</p>}
            {v.qtyDeal?.[0] && <p className="text-[11px] font-semibold text-green-700">{qtyDealText(v.qtyDeal[0])}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => actions.toggleWish(product)} aria-label="Ulubione" className="grid h-11 w-11 place-items-center rounded-xl ring-1 ring-brand-100 hover:bg-brand-50">
              <Heart className={`h-4.5 w-4.5 ${liked ? "fill-red-500 text-red-500" : "text-brand-700"}`} />
            </button>
            {inStock ? (
              <button onClick={() => { actions.add(product, v.id); setAdded(true); setTimeout(() => setAdded(false), 1500); }}
                className={`flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition ${added ? "bg-green-600" : "bg-brand-700 hover:bg-accent"}`}>
                {added ? <Check className="h-4.5 w-4.5" /> : <ShoppingCart className="h-4.5 w-4.5" />} <span className="hidden sm:inline">{added ? "Dodano" : "Do koszyka"}</span>
              </button>
            ) : (
              <Link href={href} className="flex h-11 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-500 ring-1 ring-slate-200">
                <Clock3 className="h-4.5 w-4.5" /> <span className="hidden sm:inline">Niedostępny</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
