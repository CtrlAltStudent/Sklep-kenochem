// Oznacza zamówienie jako opłacone (powrót / powiadomienie z Przelewy24) i zdejmuje stany.
// Wysyłka do BaseLinkera idzie przez zwykły hook zamówienia (autoSend).
// Jedna płatność = jeden zapis. Przelewy24 i BaseLinker potrafią wysłać to samo powiadomienie kilka razy naraz.

import { sql } from "drizzle-orm";
import type { Payload } from "payload";

type Drizzle = { execute: (query: ReturnType<typeof sql>) => Promise<unknown> };

export async function withOrderLock<T>(payload: Payload, orderId: string | number, run: () => Promise<T>): Promise<T> {
  const db = payload.db as { drizzle?: Drizzle };
  const key = `sonax-order-${orderId}`;
  const postgres = (process.env.DATABASE_URL ?? "").startsWith("postgres");
  let locked = false;
  if (postgres && db.drizzle) {
    await db.drizzle.execute(sql`SELECT pg_advisory_lock(hashtext(${key}))`);
    locked = true;
  }
  try {
    return await run();
  } finally {
    if (locked && db.drizzle) await db.drizzle.execute(sql`SELECT pg_advisory_unlock(hashtext(${key}))`).catch(() => undefined);
  }
}

export async function markOrderPaid(payload: Payload, orderId: string | number, transactionId?: string) {
  return withOrderLock(payload, orderId, async () => {
    const order = await payload.findByID({ collection: "orders", id: orderId, depth: 0, overrideAccess: true });
    if (order.payment?.status === "paid" || order.status === "paid" || order.status === "processing" || order.status === "shipped" || order.status === "received") {
      return { ok: true as const, already: true, orderNumber: order.orderNumber };
    }

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
  });
}
