"use client";

// Ustawienia sklepu potrzebne w komponentach przeglądarki (np. próg darmowej dostawy z panelu).
// Wartości wstawia główny układ strony: src/app/(frontend)/layout.tsx.

import { createContext, useContext } from "react";
import { FREE_SHIPPING } from "./data";

type ShopConfig = { freeShipping: number };

const Ctx = createContext<ShopConfig>({ freeShipping: FREE_SHIPPING });

export function ShopConfigProvider({ value, children }: { value: ShopConfig; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useFreeShipping = () => useContext(Ctx).freeShipping;
