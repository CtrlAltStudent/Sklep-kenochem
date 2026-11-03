"use client";

import { useEffect } from "react";
import { actions } from "@/lib/store";
import { trackPurchaseOnce, type Ecommerce } from "@/lib/track";

// Zakup dla Google / Meta – raz, dopiero gdy płatność jest potwierdzona. Koszyk po opłaceniu jest już niepotrzebny.
export function PurchaseTrack({ data, email, phone }: { data: Ecommerce & { transaction_id: string }; email?: string; phone?: string }) {
  useEffect(() => {
    trackPurchaseOnce(data, { email, phone });
    actions.clear();
    // celowo tylko numer zamówienia: trackPurchaseOnce sam pilnuje, żeby nie wysłać drugi raz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.transaction_id]);
  return null;
}
