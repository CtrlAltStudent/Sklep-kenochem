// Oznacza zamówienie jako opłacone (powrót / powiadomienie z Przelewy24) i zdejmuje stany.
// Wysyłka do BaseLinkera idzie przez zwykły hook zamówienia (autoSend).

import type { Payload } from "payload";

export async function markOrderPaid(payload: Payload, orderId: string | number, transactionId?: string) {
  const order = await payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true });
  if (order.payment?.status === "paid") return { ok: true as const, already: true, orderNumber: order.orderNumber };

  await payload.update({
    collection: "orders",
    id: orderId,
    overrideAccess: true,
    data: {
      status: "paid",
      payment: {
        ...(order.payment ?? {}),
        method: order.payment?.method ?? "p24",
        status: "paid",
        provider: order.payment?.provider ?? "przelewy24",
        sessionId: order.payment?.sessionId,
        transactionId: transactionId ?? order.payment?.transactionId,
        paidAt: new Date().toISOString(),
      },
    } as never,
  });

  return { ok: true as const, already: false, orderNumber: order.orderNumber };
}
