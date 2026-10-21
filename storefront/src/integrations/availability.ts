// Które metody dostawy i płatności pokazać klientowi – zależnie od włączonych modułów
// (Integracje → Moduły). Wyłączony InPost chowa metody „inpost…”, wyłączone Przelewy24 – płatności online.
// Tylko po stronie serwera.

import type { StoreSetting } from "@/payload-types";
import { moduleEnabled } from "./vault";

type Ship = NonNullable<StoreSetting["shippingMethods"]>[number];
type Pay = NonNullable<StoreSetting["paymentMethods"]>[number];

const shipModule = (code: string) => (code.startsWith("inpost") ? "inpost" : code.startsWith("orlen") ? "orlen" : null);

export const shippingAvailable = (m: Ship) => {
  const mod = shipModule(m.code);
  return m.enabled !== false && (!mod || moduleEnabled(mod));
};

export const paymentAvailable = (m: Pay) => m.enabled !== false && (m.provider !== "przelewy24" || moduleEnabled("przelewy24"));
