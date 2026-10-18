import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/cms";
import { CartView } from "@/components/checkout/CartView";

export const metadata: Metadata = { title: "Koszyk", robots: { index: false } };

// Krok 1 – koszyk. Najtańsza dostawa („od … zł”) z panelu: Ustawienia sklepu → Dostawa
export default async function CartPage() {
  const s = await getStoreSettings();
  const prices = (s.shippingMethods ?? []).filter((m) => m.enabled !== false && m.price > 0).map((m) => m.price);
  return <CartView minShip={prices.length ? Math.min(...prices) : 0} />;
}
