// Wspólny kształt punktu odbioru (InPost Paczkomat albo ORLEN Paczka).
// Te pola trafiają 1:1 do zamówienia i do BaseLinkera (delivery_point_*).

import { findInpostPoint } from "./inpost";
import { findOrlenPoint } from "./orlen";

export type PickupCarrier = "inpost" | "orlen";
export type PickupPoint = {
  carrier: PickupCarrier;
  code: string;
  name: string;
  address: string;
  postcode: string;
  city: string;
};

export const carrierFromShipping = (code: string): PickupCarrier | null =>
  code.startsWith("orlen") ? "orlen" : code.includes("paczkomat") || code.startsWith("inpost-paczkomat") ? "inpost" : null;

export async function findPickupPoint(carrier: PickupCarrier, code: string): Promise<PickupPoint | null> {
  return carrier === "orlen" ? findOrlenPoint(code) : findInpostPoint(code);
}
