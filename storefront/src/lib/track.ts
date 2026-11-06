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
const YEAR = 365 * 24 * 60 * 60 * 1000;

type Buyer = { email?: string; phone?: string };
type OrderData = { customer: { billing: { email_hash?: string; phone_hash?: string } } };

// Zgoda czytana też wprost z zapisu: po powrocie z płatności zakup bywa wysyłany, zanim baner cookies ustawi window.sonaxConsent.
function marketingConsent(w: W): boolean {
  if (w.sonaxConsent) return !!w.sonaxConsent.marketing;
  try {
    const s = JSON.parse(localStorage.getItem("sonax-consent-v1") ?? "null");
    return !!s?.marketing && Date.now() - new Date(s.at).getTime() < YEAR;
  } catch {
    return false;
  }
}

// Telefon w formacie wymaganym przez Google (+48…); numeru, którego nie da się ustalić, nie wysyłamy
function phoneE164(raw: string): string {
  const p = raw.replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(p)) return p;
  const d = p.replace(/\D/g, "").replace(/^00/, "");
  if (/^\d{9}$/.test(d)) return `+48${d}`;
  if (/^48\d{9}$/.test(d)) return `+${d}`;
  return "";
}

async function sha256(s: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Konwersje rozszerzone: kontener GTM czyta skróty SHA-256 z orderData.customer.billing (*_hash). Tylko skróty, nigdy jawne dane.
async function hashedBuyer(user: Buyer): Promise<OrderData | undefined> {
  try {
    const email = (user.email ?? "").trim().toLowerCase();
    const phone = phoneE164(user.phone ?? "");
    if (!email && !phone) return undefined;
    return { customer: { billing: { ...(email ? { email_hash: await sha256(email) } : {}), ...(phone ? { phone_hash: await sha256(phone) } : {}) } } };
  } catch {
    return undefined; // brak szyfrowania w przeglądarce nie może zablokować liczenia zakupu
  }
}

export function track(event: string, data: Ecommerce, user?: Buyer, orderData?: OrderData) {
  if (typeof window === "undefined") return;
  const w = window as W;
  const ecommerce = { currency: "PLN" as const, value: round(data.value ?? data.items.reduce((s, i) => s + i.price * i.quantity, 0)), ...data };
  const consent = marketingConsent(w);
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ ecommerce: null }); // czyści poprzednie dane e-commerce w GTM
  w.dataLayer.push({
    event,
    // id + google_business_vertical: tego oczekuje remarketing dynamiczny Google Ads
    ecommerce: { ...ecommerce, items: ecommerce.items.map((i) => ({ ...i, id: i.item_id, google_business_vertical: "retail" })) },
    ...(user && consent ? { user_data: user } : {}),
    ...(orderData && consent ? { orderData } : {}),
  });

  if (w.sonaxGtag && w.gtag) {
    if (event === "purchase" && user && consent) w.gtag("set", "user_data", { email: user.email, phone_number: user.phone });
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
export function trackPurchaseOnce(data: Ecommerce & { transaction_id: string }, user?: Buyer) {
  try {
    const done: string[] = JSON.parse(localStorage.getItem("sonax-purchases") ?? "[]");
    if (done.includes(data.transaction_id)) return;
    localStorage.setItem("sonax-purchases", JSON.stringify([...done, data.transaction_id].slice(-20)));
  } catch {}
  if (!user || !marketingConsent(window as W)) {
    track("purchase", data, user);
    return;
  }
  void hashedBuyer(user).then((orderData) => track("purchase", data, user, orderData));
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
