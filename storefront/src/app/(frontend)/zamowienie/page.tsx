import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/cms";
import { FREE_SHIPPING } from "@/lib/data";
import { Checkout, type PayMethod, type ShipMethod } from "@/components/checkout/Checkout";

export const metadata: Metadata = { title: "Dostawa i płatność", robots: { index: false } };

// Metody dostawy i płatności z panelu: Ustawienia sklepu → Dostawa / Płatności (kolejność jak w panelu)
export default async function CheckoutPage() {
  const s = await getStoreSettings();
  const shipping: ShipMethod[] = (s.shippingMethods ?? [])
    .filter((m) => m.enabled !== false)
    .map((m) => ({ code: m.code, label: m.label, price: m.price, requiresPoint: Boolean(m.requiresPoint), freeAboveThreshold: m.freeAboveThreshold !== false }));
  // Pobranie wybiera się przełącznikiem przy dostawie, a płatności B2B wymagają konta firmowego
  const payments: PayMethod[] = (s.paymentMethods ?? [])
    .filter((m) => m.enabled !== false && m.provider !== "cod" && !m.b2bOnly)
    .map((m) => ({ code: m.code, label: m.label, provider: m.provider ?? "przelewy24" }));
  return <Checkout shipping={shipping} payments={payments} freeThreshold={s.freeShippingThreshold ?? FREE_SHIPPING} />;
}
