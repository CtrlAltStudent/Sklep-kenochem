import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  return process.env.PAYLOAD_SECRET || "sonax-dev";
}

// Krótki klucz w adresie potwierdzenia, żeby po numerze zamówienia nie dało się otworzyć cudzych danych.
export function confirmKey(orderNumber: string, id: number) {
  return createHmac("sha256", secret()).update(`confirm:${id}:${orderNumber}`).digest("base64url").slice(0, 20);
}

export function confirmMatches(orderNumber: string, id: number, key: string) {
  if (!key) return false;
  const a = Buffer.from(confirmKey(orderNumber, id));
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}
