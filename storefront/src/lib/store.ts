"use client";

// Prosty magazyn stanu koszyka i ulubionych, zapisywany w localStorage.
// Pozycje przechowują migawkę produktu (nazwa, cena, zdjęcie), więc przeglądarka
// nie musi ładować całego katalogu. Docelowo koszyk będzie trzymany w backendzie.

import { useSyncExternalStore } from "react";
import type { ProductCardData } from "./data";

export type CartLine = {
  slug: string;
  variantId: string;
  qty: number;
  name: string;
  label: string;
  price: number;
  image?: string;
  category: string;
};
type State = { cart: CartLine[]; wishlist: ProductCardData[]; recent: ProductCardData[]; cartOpen: boolean };

const KEY = "sonax-store-v1";
const empty: State = { cart: [], wishlist: [], recent: [], cartOpen: false };
let state: State = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...empty, ...JSON.parse(raw), cartOpen: false };
  } catch {}
}

function set(next: Partial<State>) {
  state = { ...state, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify({ cart: state.cart, wishlist: state.wishlist, recent: state.recent }));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore() {
  return useSyncExternalStore(subscribe, () => (load(), state), () => empty);
}

export const actions = {
  add(product: ProductCardData & { images?: string[] }, variantId: string, qty = 1) {
    const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
    const cart = [...state.cart];
    const i = cart.findIndex((l) => l.slug === product.slug && l.variantId === variant.id);
    if (i >= 0) cart[i] = { ...cart[i], qty: cart[i].qty + qty, price: variant.price };
    else
      cart.push({
        slug: product.slug,
        variantId: variant.id,
        qty,
        name: product.name,
        label: variant.label,
        price: variant.price,
        image: product.image ?? product.images?.[0],
        category: product.category,
      });
    set({ cart, cartOpen: true });
  },
  setQty(slug: string, variantId: string, qty: number) {
    set({
      cart: state.cart
        .map((l) => (l.slug === slug && l.variantId === variantId ? { ...l, qty } : l))
        .filter((l) => l.qty > 0),
    });
  },
  clear() {
    set({ cart: [] });
  },
  toggleWish(product: ProductCardData) {
    set({
      wishlist: state.wishlist.some((p) => p.slug === product.slug)
        ? state.wishlist.filter((p) => p.slug !== product.slug)
        : [...state.wishlist, product],
    });
  },
  // Ostatnio oglądane (max 12, najnowszy pierwszy)
  viewed(product: ProductCardData) {
    if (state.recent[0]?.slug === product.slug) return;
    set({ recent: [product, ...state.recent.filter((p) => p.slug !== product.slug)].slice(0, 12) });
  },
  openCart(open: boolean) {
    set({ cartOpen: open });
  },
};
