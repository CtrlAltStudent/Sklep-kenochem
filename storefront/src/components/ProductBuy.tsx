"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { BadgeCheck, Check, Flag, Heart, Lock, Minus, PackageCheck, Plus, ShoppingCart, Truck } from "lucide-react";
import { formatPrice, toCard, unitPrice, type Product } from "@/lib/data";
import { priceAfterQtyDeal, qtyDealText } from "@/lib/qtyDeal";
import { actions, useStore } from "@/lib/store";
import { DispatchInfo, ProductActions, StockAlertForm } from "./ProductExtras";
import { ProductImage } from "./ProductImage";
import { useFreeShipping } from "@/lib/shopConfig";
import { toItem, track } from "@/lib/track";

function VariantChoices({ product, variantId, onChange }: { product: Product; variantId: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const photo = product.variantDisplay === "zdjecie";
  const many = product.variants.length > 15;
  const limit = photo ? 8 : 12;
  let shown = product.variants;
  if (many && !open) {
    const head = product.variants.slice(0, limit);
    const current = product.variants.find((v) => v.id === variantId);
    shown = current && !head.some((v) => v.id === current.id) ? [...head.slice(0, limit - 1), current] : head;
  }
  const hidden = product.variants.length - shown.length;
  return (
    <div className="mt-5 rounded-xl bg-white p-3 ring-1 ring-brand-100">
      <div className={`flex flex-wrap ${many ? "gap-1.5" : "gap-2"}`}>
        {shown.map((v) => {
          const ok = (v.stock ?? 0) > 0;
          const on = v.id === variantId;
          const cls = photo
            ? `block overflow-hidden rounded-lg border-2 bg-white text-left transition ${many ? "w-16" : "w-[4.75rem]"} ${on ? "border-accent" : "border-brand-100 hover:border-brand-200"} ${ok ? "" : "opacity-55"}`
            : `inline-block rounded-lg border-2 font-bold transition ${many ? "px-2.5 py-1 text-xs" : "rounded-xl px-4 py-2 text-sm"} ${on ? "border-accent bg-brand-50 text-brand-900" : "border-brand-100 hover:border-brand-200"} ${ok ? "" : "opacity-55"}`;
          const body = photo ? (
            <>
              <ProductImage src={v.image} alt={v.label} className="aspect-square !bg-[#f6f7f8]" sizes="76px" />
              <span className="block truncate px-1 py-1 text-center text-[10px] font-bold leading-tight">{v.label}{ok ? "" : " · brak"}</span>
            </>
          ) : <>{v.label}{ok ? "" : " · brak"}</>;
          if (product.variantNav === "link" && v.slug && v.slug !== product.slug) {
            return <Link key={v.id} href={`/produkt/${v.slug}`} className={cls}>{body}</Link>;
          }
          return <button key={v.id} type="button" onClick={() => onChange(v.id)} className={cls}>{body}</button>;
        })}
      </div>
      {many && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-2 text-sm font-semibold text-accent-dark hover:underline">
          {open ? "Zwiń" : `Pokaż pozostałe (${hidden})`}
        </button>
      )}
    </div>
  );
}

// Środek karty (opis, warianty, zestaw) i skrzynka z ceną obok. Warianty są na środku, żeby nie rozpychały ceny.
export function ProductStage({ product, initialVariantId, gallery, lead, extra }: {
  product: Product;
  initialVariantId?: string;
  gallery: ReactNode;
  lead: ReactNode;
  extra: ReactNode;
}) {
  const first = product.variants.find((v) => v.id === initialVariantId) ?? product.variants[0];
  const [variantId, setVariantId] = useState(first.id);
  return (
    <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(300px,360px)] lg:gap-8">
      {gallery}
      <div className="min-w-0">
        {lead}
        {product.variants.length > 1 && <VariantChoices product={product} variantId={variantId} onChange={setVariantId} />}
        {extra}
      </div>
      <div className="lg:sticky lg:top-28">
        <ProductBuy product={product} variantId={variantId} />
      </div>
    </div>
  );
}

// Pole zakupu (prawa kolumna) + przyklejony pasek „Dodaj do koszyka” na telefonie
export function ProductBuy({ product, variantId }: { product: Product; variantId: string }) {
  const freeShipping = useFreeShipping();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { wishlist } = useStore();
  const liked = wishlist.some((p) => p.slug === product.slug);
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const priced = priceAfterQtyDeal(variant.price, variant.qtyDeal, qty);
  const net = variant.price / (1 + product.vat / 100);

  useEffect(() => { setQty(1); }, [variantId]);
  const stock = variant.stock ?? product.stock;
  const inStock = stock > 0;

  // Analityka: obejrzenie produktu (raz na wejście na kartę)
  const seen = useRef("");
  useEffect(() => {
    if (seen.current === product.slug) return;
    seen.current = product.slug;
    track("view_item", { items: [toItem(product, 1, variantId)] });
  }, [product, variantId]);

  // Pasek na dole ekranu pokazujemy, gdy główny przycisk zniknie z widoku
  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const add = () => {
    if (!inStock) return;
    actions.add(toCard(product), variant.id, Math.min(qty, stock));
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
        <p className={`flex items-center gap-2 text-sm font-semibold ${inStock ? "text-green-700" : "text-slate-500"}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${inStock ? (stock > 5 ? "bg-green-500" : "bg-amber-500") : "bg-slate-400"}`} />
          {inStock ? (stock > 5 ? "Produkt dostępny" : `Ostatnie sztuki (${stock})`) : "Chwilowo niedostępny – zostaw maila, damy znać"}
        </p>

        {product.variants.length === 1 && (
          <p className="mt-4"><span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800">{variant.label}</span></p>
        )}

        <div className="mt-5">
          <div className="flex items-end gap-3">
            <span className={`text-4xl font-black tracking-tight ${variant.oldPrice ? "text-red-600" : "text-navy"}`}>{formatPrice(variant.price)}</span>
            {variant.oldPrice && <span className="pb-1 text-lg text-slate-400 line-through">{formatPrice(variant.oldPrice)}</span>}
          </div>
          {variant.qtyDeal && variant.qtyDeal.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {variant.qtyDeal.map((t) => {
                const on = priced.tier?.qty === t.qty && priced.hits > 0;
                return (
                  <li key={`${t.qty}-${t.free ? "g" : t.percent}`} className={`rounded-lg px-3 py-2 text-sm ${on ? "bg-green-50 font-semibold text-green-800" : "bg-brand-50 text-slate-700"}`}>
                    {qtyDealText(t)}{on ? ` · ${priced.hits} szt.` : ""}
                  </li>
                );
              })}
            </ul>
          )}
          {priced.hits > 0 && (
            <p className="mt-2 text-sm font-semibold text-green-800">
              Za {qty} szt. płacisz {formatPrice(priced.total)} zamiast {formatPrice(priced.full)}
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            {unitPrice(variant.price, variant.label) && <><b className="text-slate-700">{unitPrice(variant.price, variant.label)}</b> · </>}
            {formatPrice(net)} netto · zawiera {product.vat}% VAT
            {variant.oldPrice && <><br />Najniższa cena z 30 dni przed obniżką: <b>{formatPrice(product.lowestPrice30d ?? variant.oldPrice)}</b></>}
            {product.saleTo && <><br />Promocja trwa do {new Date(product.saleTo).toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}</>}
          </p>
        </div>

        {inStock ? (
        <div className="mt-5 flex gap-2">
          <div className="flex items-center rounded-xl border-2 border-brand-100">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Zmniejsz ilość" className="grid h-12 w-10 place-items-center hover:bg-brand-50"><Minus className="h-4 w-4" /></button>
            <input value={qty} onChange={(e) => setQty(Math.max(1, Math.min(stock, Number(e.target.value.replace(/\D/g, "")) || 1)))} inputMode="numeric" aria-label="Ilość"
              className="w-10 bg-transparent text-center font-bold outline-none" />
            <button onClick={() => setQty(Math.min(stock, qty + 1))} disabled={qty >= stock} aria-label="Zwiększ ilość" className="grid h-12 w-10 place-items-center hover:bg-brand-50"><Plus className="h-4 w-4" /></button>
          </div>
          <button ref={buttonRef} onClick={add}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-white shadow-lg transition active:scale-[.98] ${added ? "bg-green-600 shadow-green-600/20" : "btn-kc"}`}>
            {added ? <><Check className="h-5 w-5" /> Dodano</> : <><ShoppingCart className="h-5 w-5" /> Do koszyka</>}
          </button>
        </div>
        ) : (
          <button ref={buttonRef} type="button" disabled className="mt-5 flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-bold text-slate-500 ring-1 ring-slate-200">
            Produkt chwilowo niedostępny
          </button>
        )}
        <button onClick={() => actions.toggleWish(toCard(product))}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-800">
          <Heart className={`h-4.5 w-4.5 ${liked ? "animate-pop fill-red-500 text-red-500" : ""}`} /> {liked ? "W ulubionych" : "Dodaj do ulubionych"}
        </button>
        <div className="mt-3">{inStock ? <DispatchInfo inStock /> : <StockAlertForm slug={variant.slug || product.slug} />}</div>

        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-brand-100 pt-4 text-[12px] text-slate-600">
          {trust.map(({ icon: Icon, text }, i) => (
            <li key={i} className={`flex items-center gap-2 ${i === 0 ? "col-span-2" : ""}`}><Icon className="h-4 w-4 shrink-0 text-accent" /> <span>{text}</span></li>
          ))}
        </ul>

        <div className="mt-4"><ProductActions name={product.name} slug={product.slug} /></div>

      </div>

      {/* Pasek zakupu na telefonie */}
      <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-brand-100 bg-white/95 p-3 backdrop-blur transition-transform lg:hidden ${showBar && inStock ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-slate-500">{product.name}</p>
            <p className="text-lg font-black text-navy">{formatPrice(priced.hits > 0 ? priced.total : variant.price)}</p>
            {priced.hits > 0 && <p className="text-[11px] font-semibold text-green-700">za {qty} szt.</p>}
          </div>
          <button onClick={add} className={`flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-white ${added ? "bg-green-600" : "btn-kc"}`}>
            {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />} {added ? "Dodano" : "Do koszyka"}
          </button>
        </div>
      </div>
    </>
  );
}
