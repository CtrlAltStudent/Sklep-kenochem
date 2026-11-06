"use client";

import { useEffect } from "react";
import { actions } from "@/lib/store";

// Po zapisanym zamówieniu koszyk ma być pusty także wtedy, gdy formularz wysłał się przeładowaniem strony.
export function ClearCart() {
  useEffect(() => {
    actions.clear();
    try { sessionStorage.removeItem("sonax-checkout-draft"); } catch { /* przeglądarka bez pamięci */ }
  }, []);
  return null;
}
