// Stany magazynowe w sklepie po zamówieniu:
//   nowe zamówienie → stan produktów spada od razu (nikt nie kupi tej samej ostatniej sztuki)
//   anulowanie → stan wraca, przywrócenie anulowanego → znowu spada
// Prawdziwym źródłem stanów jest BaseLinker – synchronizacja co 15 min i tak nadpisuje stany jego danymi.

import type { CollectionAfterChangeHook, Payload, PayloadRequest } from "payload";
import type { Order } from "@/payload-types";

async function adjust(payload: Payload, req: PayloadRequest, order: Order, sign: 1 | -1) {
  for (const item of order.items ?? []) {
    const id = typeof item.product === "object" ? item.product?.id : item.product;
    const qty = Number(item.quantity ?? 0);
    if (!id || !qty) continue;
    try {
      const p = await payload.findByID({ collection: "products", id, depth: 0, overrideAccess: true, req });
      const stock = Math.max(0, Number(p.stock ?? 0) + sign * qty);
      await payload.update({ collection: "products", id, overrideAccess: true, req, data: { stock } });
    } catch (e) {
      payload.logger.error({ err: e }, `Stan produktu ${id} po zamówieniu ${order.orderNumber}`);
    }
  }
}

export const orderStockHook: CollectionAfterChangeHook<Order> = async ({ doc, previousDoc, operation, req }) => {
  const was = operation === "create" ? null : previousDoc?.status;
  const now = doc.status;
  if (operation === "create" && now !== "cancelled") await adjust(req.payload, req, doc, -1);
  else if (was && was !== "cancelled" && now === "cancelled") await adjust(req.payload, req, doc, 1);
  else if (was === "cancelled" && now !== "cancelled") await adjust(req.payload, req, doc, -1);
  return doc;
};
