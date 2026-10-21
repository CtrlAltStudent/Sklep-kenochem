import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/cms";
import { CartView } from "@/components/checkout/CartView";
import { shippingAvailable } from "@/integrations/availability";

export const metadata: Metadata = { title: "Koszyk", robots: { index: false } };

// Krok 1 – koszyk. Metody i najtańsza dostawa („od … zł”) z panelu: Ustawienia sklepu → Dostawa
export default async function CartPage() {
  const s = await getStoreSettings();
  const shipping = (s.shippingMethods ?? [])
    .filter(shippingAvailable)
    .map((m) => ({ code: m.code, label: m.label, price: m.price, freeAboveThreshold: m.freeAboveThreshold !== false }));
  const prices = shipping.filter((m) => m.price > 0).map((m) => m.price);
  return <CartView minShip={prices.length ? Math.min(...prices) : 0} shipping={shipping} />;
}
