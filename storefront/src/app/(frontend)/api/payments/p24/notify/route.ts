import { getCms } from "@/lib/cms";
import { p24Mode, verifyP24Notify, verifyP24Transaction, type P24NotifyBody } from "@/integrations/przelewy24";
import { markOrderPaid } from "@/integrations/checkout/markPaid";

// Powiadomienie z Przelewy24 (urlStatus). Musi odpowiedzieć "OK", inaczej P24 ponawia.
export async function POST(request: Request) {
  let body: P24NotifyBody = {};
  try {
    body = await request.json();
  } catch {
    return new Response("error", { status: 400 });
  }
  if (p24Mode() !== "mock" && !verifyP24Notify(body)) {
    console.error("P24 notify: odrzucony podpis", body.sessionId?.slice(0, 8), body.statement);
    return new Response("error", { status: 400 });
  }
  if (!body.sessionId || body.orderId == null) return new Response("error", { status: 400 });

  const payload = await getCms();
  const found = await payload.find({
    collection: "orders",
    where: { "payment.sessionId": { equals: body.sessionId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const order = found.docs[0];
  if (!order) return new Response("error", { status: 404 });

  const amountGrosze = Math.round(Number(order.total) * 100);
  if (body.amount != null && body.amount !== amountGrosze) return new Response("error", { status: 400 });
  if (!(await verifyP24Transaction(body.sessionId, amountGrosze, body.orderId))) {
    console.error("P24 notify: weryfikacja transakcji nieudana", body.statement);
    return new Response("error", { status: 400 });
  }

  await markOrderPaid(payload, order.id, String(body.orderId));
  return new Response("OK");
}
