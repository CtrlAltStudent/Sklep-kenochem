// Historia zamówienia: kto i kiedy zmienił status / płatność, numer przesyłki (zapis w „Dzienniku integracji”, typ „Historia”).
// Na osi czasu w podglądzie zamówienia łączymy ją z mailami i przekazaniami do BaseLinkera (te same wpisy z polem „order”).

import type { CollectionAfterChangeHook, Payload, PayloadRequest } from "payload";
import type { Order } from "@/payload-types";

const STATUS: Record<string, string> = {
  new: "Nowe", awaiting_payment: "Czeka na płatność", paid: "Opłacone", processing: "W realizacji", shipped: "Wysłane", cancelled: "Anulowane",
};
const PAY: Record<string, string> = { pending: "czeka na wpłatę", paid: "opłacone", failed: "nieudana", refunded: "zwrócona", deferred: "przy odbiorze" };

// Kto zmienił: pracownik z panelu, klient (zamówienie ze sklepu) albo automat (płatność, BaseLinker)
const who = (req: PayloadRequest) => {
  const u = req.user as { collection?: string; name?: string; email?: string } | null;
  if (u?.collection === "users") return u.name || u.email || "pracownik";
  if (u?.collection === "customers") return "klient";
  return "automat";
};

export async function addHistory(payload: Payload, order: number | string, message: string, by: string, details?: Record<string, unknown>) {
  try {
    await payload.create({
      collection: "integration-logs",
      overrideAccess: true,
      data: { type: "history", status: "success", message: message.slice(0, 500), mode: "live", durationMs: 0, order: order as number, details: { by, ...details } },
    });
  } catch (e) {
    payload.logger.error({ err: e }, "Historia zamówienia");
  }
}

export const orderHistoryHook: CollectionAfterChangeHook<Order> = async ({ doc, previousDoc, operation, req, context }) => {
  const by = who(req);
  if (operation === "create") {
    await addHistory(req.payload, doc.id, by === "automat" || by === "klient" ? "Zamówienie złożone w sklepie" : `Zamówienie dodane w panelu`, by);
    return doc;
  }
  if (!previousDoc) return doc;
  if (doc.status !== previousDoc.status) {
    await addHistory(req.payload, doc.id, `Status: ${STATUS[previousDoc.status ?? ""] ?? previousDoc.status} → ${STATUS[doc.status ?? ""] ?? doc.status}`, by);
  }
  if (doc.payment?.status !== previousDoc.payment?.status) {
    await addHistory(req.payload, doc.id, `Płatność: ${PAY[previousDoc.payment?.status ?? ""] ?? "—"} → ${PAY[doc.payment?.status ?? ""] ?? doc.payment?.status}`, by);
  }
  if (typeof context?.trackingNumber === "string" && context.trackingNumber) {
    await addHistory(req.payload, doc.id, `Numer przesyłki z BaseLinkera: ${context.trackingNumber}`, "BaseLinker");
  }
  return doc;
};
