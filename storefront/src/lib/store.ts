"use client";

// Prosty magazyn stanu koszyka i ulubionych, zapisywany w localStorage.
// Pozycje przechowują migawkę produktu (nazwa, cena, zdjęcie), więc przeglądarka
// nie musi ładować całego katalogu. Docelowo koszyk będzie trzymany w backendzie.

import { useSyncExternalStore } from "react";
import type { ProductCardData } from "./data";
import { track } from "./track";

export type CartLine = {
  slug: string;
  variantId: string;
  qty: number;
  name: string;
  label: string;
  price: number;
  image?: string;
  category: string;
  max?: number; // stan magazynowy w chwili dodania – więcej nie da się kupić
  sku?: string;
  brand?: string;
  qtyDeal?: { qty: number; percent: number; free?: boolean }[];
};

// pozycja koszyka → pozycja zdarzenia analityki (src/lib/track.ts)
const lineItem = (l: CartLine, quantity: number) => ({
  item_id: l.sku || l.slug, item_name: l.name, item_brand: l.brand || undefined, item_category: l.category, item_variant: l.label, price: l.price, quantity,
});
type State = { cart: CartLine[]; wishlist: ProductCardData[]; recent: ProductCardData[]; cartOpen: boolean };

const KEY = "sonax-store-v1";
const empty: State = { cart: [], wishlist: [], recent: [], cartOpen: false };
let state: State = empty;
let loaded = false;
const listeners = new Set<() => void>();

// Przypomnienie o porzuconym koszyku: zgoda zaznaczona przy zamówieniu → koszyk trafia do sklepu po każdej zmianie
// (POST /api/cart, kolekcja „Porzucone koszyki”). Token łączy koszyk z linkiem „Wróć do koszyka” w mailu.
type Remind = { email: string; token: string };
const REMIND_KEY = "sonax-remind-v1";
let remind: Remind | null = null;
let syncTimer: ReturnType<typeof setTimeout> | undefined;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...empty, ...JSON.parse(raw), cartOpen: false };
    remind = JSON.parse(localStorage.getItem(REMIND_KEY) ?? "null");
  } catch {}
}

const postCart = (body: Record<string, unknown>) =>
  fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(() => {});

function syncCart(delay = 1500) {
  if (!remind) return;
  const r = remind;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => postCart({ token: r.token, email: r.email, consent: true, items: state.cart }), delay);
}

function set(next: Partial<State>) {
  state = { ...state, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify({ cart: state.cart, wishlist: state.wishlist, recent: state.recent }));
  } catch {}
  if (next.cart) syncCart();
  listeners.forEach((l) => l());
}

// Adres, na który przypomnimy o koszyku ("" = brak zgody)
export function useRemind() {
  return useSyncExternalStore(subscribe, () => (load(), remind?.email ?? ""), () => "");
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
    const stock = variant.stock ?? product.stock;
    if (stock <= 0) return;
    const slug = variant.slug || product.slug;
    const cart = [...state.cart];
    const i = cart.findIndex((l) => l.slug === slug && l.variantId === variant.id);
    if (i >= 0) cart[i] = { ...cart[i], qty: Math.min(cart[i].qty + qty, stock), price: variant.price, max: stock, qtyDeal: variant.qtyDeal };
    else
      cart.push({
        slug,
        variantId: variant.id,
        qty: Math.min(qty, stock),
        max: stock,
        sku: variant.sku || product.sku,
        brand: product.brand,
        name: product.name,
        label: variant.label,
        price: variant.price,
        image: product.image ?? product.images?.[0],
        category: product.category,
        qtyDeal: variant.qtyDeal,
      });
    set({ cart, cartOpen: true });
    const line = cart.find((l) => l.slug === slug && l.variantId === variant.id);
    if (line) track("add_to_cart", { items: [lineItem(line, Math.min(qty, stock))] });
  },
  setQty(slug: string, variantId: string, qty: number) {
    const before = state.cart.find((l) => l.slug === slug && l.variantId === variantId);
    if (before) {
      const next = Math.max(0, before.max ? Math.min(qty, before.max) : qty);
      if (next > before.qty) track("add_to_cart", { items: [lineItem(before, next - before.qty)] });
      if (next < before.qty) track("remove_from_cart", { items: [lineItem(before, before.qty - next)] });
    }
    set({
      cart: state.cart
        .map((l) => (l.slug === slug && l.variantId === variantId ? { ...l, qty: l.max ? Math.min(qty, l.max) : qty } : l))
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
  // Zgoda na przypomnienie o koszyku (email) albo jej wycofanie (null)
  setRemind(email: string | null) {
    load();
    if (!email) {
      if (remind) postCart({ token: remind.token, consent: false });
      remind = null;
    } else {
      const token = remind?.token ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`);
      remind = { email, token };
      syncCart(0);
    }
    try {
      if (remind) localStorage.setItem(REMIND_KEY, JSON.stringify(remind));
      else localStorage.removeItem(REMIND_KEY);
    } catch {}
    listeners.forEach((l) => l());
  },
  // Koszyk z linku w mailu („Wróć do koszyka”)
  restore(lines: CartLine[]) {
    if (lines.length) set({ cart: lines, cartOpen: false });
  },
};
