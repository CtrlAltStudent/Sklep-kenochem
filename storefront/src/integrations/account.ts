// Konto klienta w sklepie (po stronie serwera): kto jest zalogowany, jego zamówienia,
// dołączanie wcześniejszych zamówień „gościa” po potwierdzeniu adresu e-mail (podpisany link z maila).

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Payload } from "payload";
import type { Customer, Order } from "@/payload-types";

export async function currentCustomer(payload: Payload, headers: Headers): Promise<Customer | null> {
  try {
    const { user } = await payload.auth({ headers });
    return user?.collection === "customers" ? (user as unknown as Customer) : null;
  } catch {
    return null;
  }
}

// Bez danych technicznych (sesja płatności, błędy BaseLinkera) – tylko to, co klient powinien widzieć
export const publicOrder = (o: Order) => ({
  id: o.id,
  number: o.orderNumber,
  createdAt: o.createdAt,
  status: o.status,
  total: o.total,
  shippingCost: o.shipping?.price ?? 0,
  items: (o.items ?? []).map((i) => ({ name: i.name, variant: i.variantLabel ?? "", qty: i.quantity, price: i.priceGross })),
  shipping: { method: o.shipping?.method ?? "", point: o.shipping?.point?.code ?? "", address: [o.shipping?.street, [o.shipping?.postcode, o.shipping?.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") },
  payment: { method: o.payment?.method ?? "", status: o.payment?.status ?? "" },
  hasParcels: Boolean(o.baselinker?.orderId),
});

export async function customerOrders(payload: Payload, c: Customer) {
  const [mine, guest] = await Promise.all([
    payload.find({ collection: "orders", where: { customer: { equals: c.id } }, sort: "-createdAt", limit: 100, depth: 0, overrideAccess: true }),
    payload.count({ collection: "orders", where: { and: [{ email: { equals: c.email } }, { customer: { exists: false } }] }, overrideAccess: true }),
  ]);
  return { orders: mine.docs.map(publicOrder), guestCount: guest.totalDocs };
}

// ---------- Link „dodaj wcześniejsze zamówienia” (ważny 24 h) ----------

const secret = () => `${process.env.PAYLOAD_SECRET ?? ""}:claim-orders`;
const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

export function claimToken(c: Customer) {
  const body = Buffer.from(JSON.stringify({ c: c.id, e: c.email.toLowerCase(), x: Date.now() + 24 * 3600_000 })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export async function claimOrders(payload: Payload, token: string): Promise<number | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const want = Buffer.from(sign(body));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  const data = JSON.parse(Buffer.from(body, "base64url").toString()) as { c: number; e: string; x: number };
  if (data.x < Date.now()) return null;
  const customer = await payload.findByID({ collection: "customers", id: data.c, depth: 0, overrideAccess: true }).catch(() => null);
  if (!customer || customer.email.toLowerCase() !== data.e) return null;
  const { docs } = await payload.find({ collection: "orders", where: { and: [{ email: { equals: customer.email } }, { customer: { exists: false } }] }, limit: 200, depth: 0, overrideAccess: true });
  for (const o of docs) {
    await payload.update({ collection: "orders", id: o.id, overrideAccess: true, context: { skipBaseLinker: true }, data: { customer: customer.id } });
  }
  return docs.length;
}
