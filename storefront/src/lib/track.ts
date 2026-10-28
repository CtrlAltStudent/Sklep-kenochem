"use client";

// Zdarzenia e-commerce w standardzie GA4: view_item_list, view_item, add_to_cart, remove_from_cart, view_cart,
// begin_checkout, add_shipping_info, add_payment_info, purchase.
//  - Google Tag Manager: dataLayer.push({ event, ecommerce }) – w GTM wystarczy tag GA4 „Zdarzenie” z {{Event}} i opcją „Wysyłaj dane e-commerce”,
//  - GA4 / Google Ads wpisane wprost w panelu: gtag("event", …) + konwersja „Zakup” w Ads,
//  - Meta Pixel: ViewContent / AddToCart / InitiateCheckout / AddPaymentInfo / Purchase.
// Bez zgody na cookies dane nie są zapisywane (Consent Mode – src/lib/tagsBootstrap.ts).

type W = Window & {
  dataLayer?: unknown[];
  gtag?: (...a: unknown[]) => void;
  fbq?: (...a: unknown[]) => void;
  sonaxGtag?: boolean;
  sonaxCfg?: { ads?: string; adsLabel?: string };
  sonaxConsent?: { marketing?: boolean };
};

export type TrackItem = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
  index?: number;
};

export type Ecommerce = {
  currency?: "PLN";
  value?: number;
  items: TrackItem[];
  item_list_name?: string;
  transaction_id?: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
  shipping_tier?: string;
  payment_type?: string;
};

const META: Record<string, string> = {
  view_item: "ViewContent", add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", add_payment_info: "AddPaymentInfo", purchase: "Purchase",
};
const round = (n: number) => Math.round(n * 100) / 100;

export function track(event: string, data: Ecommerce, user?: { email?: string; phone?: string }) {
  if (typeof window === "undefined") return;
  const w = window as W;
  const ecommerce = { currency: "PLN" as const, value: round(data.value ?? data.items.reduce((s, i) => s + i.price * i.quantity, 0)), ...data };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ ecommerce: null }); // czyści poprzednie dane e-commerce w GTM
  w.dataLayer.push({ event, ecommerce, ...(user && w.sonaxConsent?.marketing ? { user_data: user } : {}) });

  if (w.sonaxGtag && w.gtag) {
    if (event === "purchase" && user && w.sonaxConsent?.marketing) w.gtag("set", "user_data", { email: user.email, phone_number: user.phone });
    w.gtag("event", event, ecommerce);
    const cfg = w.sonaxCfg;
    if (event === "purchase" && cfg?.ads && cfg.adsLabel)
      w.gtag("event", "conversion", { send_to: `${cfg.ads}/${cfg.adsLabel}`, value: ecommerce.value, currency: "PLN", transaction_id: ecommerce.transaction_id });
  }
  const meta = META[event];
  if (meta && w.fbq)
    w.fbq("track", meta, {
      value: ecommerce.value, currency: "PLN", content_type: "product",
      content_ids: ecommerce.items.map((i) => i.item_id), num_items: ecommerce.items.reduce((s, i) => s + i.quantity, 0),
    }, ecommerce.transaction_id ? { eventID: ecommerce.transaction_id } : undefined);
}

// Zakup wysyłamy tylko raz na zamówienie (odświeżenie strony, powrót z płatności)
export function trackPurchaseOnce(data: Ecommerce & { transaction_id: string }, user?: { email?: string; phone?: string }) {
  try {
    const done: string[] = JSON.parse(localStorage.getItem("sonax-purchases") ?? "[]");
    if (done.includes(data.transaction_id)) return;
    localStorage.setItem("sonax-purchases", JSON.stringify([...done, data.transaction_id].slice(-20)));
  } catch {}
  track("purchase", data, user);
}

// Produkt z katalogu → pozycja zdarzenia (id = SKU, tak jak w pliku dla Merchant Center)
export const toItem = (
  p: { slug: string; sku?: string; name: string; brand?: string; category?: string; variants?: { id: string; label: string; price: number; sku?: string; slug?: string }[] },
  quantity = 1, variantId?: string, index?: number,
): TrackItem => {
  const v = p.variants?.find((x) => x.id === variantId) ?? p.variants?.[0];
  return {
    item_id: v?.sku || p.sku || v?.slug || p.slug, item_name: p.name, item_brand: p.brand || undefined, item_category: p.category || undefined,
    item_variant: v?.label, price: round(v?.price ?? 0), quantity, index,
  };
};

// Pozycja koszyka → pozycja zdarzenia
export const cartItem = (l: { slug: string; sku?: string; name: string; brand?: string; category?: string; label?: string; price: number; qty: number }): TrackItem => ({
  item_id: l.sku || l.slug, item_name: l.name, item_brand: l.brand || undefined, item_category: l.category || undefined, item_variant: l.label, price: round(l.price), quantity: l.qty,
});
