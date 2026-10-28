import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/cms";
import { freeShippingFrom } from "@/lib/data";
import { Checkout, type PayMethod, type ShipMethod } from "@/components/checkout/Checkout";
import { paymentAvailable, shippingAvailable } from "@/integrations/availability";
import { inpostWidgetToken } from "@/integrations/inpost";
import { moduleEnabled } from "@/integrations/vault";
import { cartRemindersOn } from "@/integrations/carts";

export const metadata: Metadata = { title: "Dostawa i płatność", robots: { index: false } };
// Zawsze świeże: ceny dostaw, włączone moduły i token mapy InPost z panelu
export const dynamic = "force-dynamic";

// Metody dostawy i płatności z panelu: Ustawienia sklepu → Dostawa / Płatności (kolejność jak w panelu)
export default async function CheckoutPage() {
  const s = await getStoreSettings();
  const shipping: ShipMethod[] = (s.shippingMethods ?? [])
    .filter(shippingAvailable)
    .map((m) => ({ code: m.code, label: m.label, price: m.price, requiresPoint: Boolean(m.requiresPoint), freeAboveThreshold: m.freeAboveThreshold !== false }));
  // Pobranie wybiera się przełącznikiem przy dostawie, a płatności B2B wymagają konta firmowego
  const payments: PayMethod[] = (s.paymentMethods ?? [])
    .filter((m) => paymentAvailable(m) && m.provider !== "cod" && !m.b2bOnly)
    .map((m) => ({ code: m.code, label: m.label, provider: m.provider ?? "przelewy24" }));
  // Token Geowidget jest publiczny (InPost wiąże go z domeną sklepu) – trafia do przeglądarki z założenia
  const inpostToken = moduleEnabled("inpost") ? inpostWidgetToken() : "";
  return <Checkout shipping={shipping} payments={payments} freeThreshold={freeShippingFrom(s)} inpostToken={inpostToken} cartReminder={cartRemindersOn()} />;
}
