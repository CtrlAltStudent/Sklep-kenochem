// BLIK z kodem na stronie sklepu (BLIK poziom 0 przez Przelewy24) – bez przekierowania na stronę P24.
//
// 1. startBlik: rejestracja transakcji (z danymi płatnika i akceptacją regulaminu P24) → chargeByCode
// 2. klient potwierdza płatność w aplikacji banku
// 3. P24 wysyła zwykłe powiadomienie (urlStatus) → zamówienie „Opłacone”;
//    odrzucenie przychodzi dodatkowym powiadomieniem BLIK → płatność „Nieudana”, klient może podać nowy kod
// sessionId (losowy) jest jednocześnie kluczem, po którym strona pyta o stan płatności.

import { randomBytes } from "node:crypto";
import type { Payload } from "payload";
import type { Order } from "@/payload-types";
import { chargeBlikByCode, getP24Transaction, p24Mode, registerP24, verifyP24Transaction } from "../przelewy24";
import { markOrderPaid } from "./markPaid";

const serverUrl = () => process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
export const BLIK_CODE = /^\d{6}$/;
export type BlikClient = { ip: string; userAgent: string };
export type BlikState = "pending" | "paid" | "failed";

async function setPayment(payload: Payload, order: Order, patch: Partial<NonNullable<Order["payment"]>>) {
  await payload.update({
    collection: "orders",
    id: order.id,
    overrideAccess: true,
    context: { skipBaseLinker: true },
    data: { payment: { ...(order.payment ?? {}), ...patch } } as never,
  });
}

export async function startBlik(payload: Payload, order: Order, blikCode: string, client: BlikClient) {
  if (!BLIK_CODE.test(blikCode)) return { ok: false as const, message: "Kod BLIK ma 6 cyfr." };
  if (order.payment?.status === "paid") return { ok: false as const, message: "To zamówienie jest już opłacone." };

  // Każda próba to nowa transakcja w P24 (kod BLIK jest jednorazowy)
  const sessionId = `SX-${order.id}-${randomBytes(9).toString("base64url")}`;
  const amountGrosze = Math.round(Number(order.total) * 100);
  try {
    const reg = await registerP24({
      sessionId,
      amountGrosze,
      description: `Zamówienie ${order.orderNumber} – Sklep SONAX`,
      email: order.email,
      urlReturn: `${serverUrl()}/zamowienie/powrot?sessionId=${encodeURIComponent(sessionId)}`,
      urlStatus: `${serverUrl()}/api/payments/p24/notify`,
      blik: { ...client, urlNotify: `${serverUrl()}/api/payments/p24/blik-notify` },
    });
    await setPayment(payload, order, { status: "pending", provider: "przelewy24", sessionId });
    const charge = await chargeBlikByCode(reg.token, blikCode);
    if (!charge.ok) {
      await setPayment(payload, { ...order, payment: { ...order.payment, sessionId } } as Order, { status: "failed", provider: "przelewy24", sessionId });
      return { ok: false as const, sessionId, message: charge.message };
    }
    // Tryb testowy bez P24 – od razu „opłacone”
    if (p24Mode() === "mock") await markOrderPaid(payload, order.id, "mock-blik");
    return { ok: true as const, sessionId, message: "Potwierdź płatność w aplikacji banku." };
  } catch (e) {
    return { ok: false as const, message: e instanceof Error ? e.message : "Nie udało się rozpocząć płatności BLIK." };
  }
}

async function orderBySession(payload: Payload, sessionId: string) {
  const { docs } = await payload.find({ collection: "orders", where: { "payment.sessionId": { equals: sessionId } }, limit: 1, depth: 0, overrideAccess: true });
  return docs[0];
}

// Stan płatności dla strony zamówienia. Gdy powiadomienie jeszcze nie doszło, pytamy P24 wprost.
export async function blikStatus(payload: Payload, sessionId: string): Promise<{ state: BlikState; orderNumber?: string } | null> {
  const order = await orderBySession(payload, sessionId);
  if (!order) return null;
  const st = order.payment?.status;
  if (st === "paid") return { state: "paid", orderNumber: order.orderNumber ?? undefined };
  if (st === "failed") return { state: "failed", orderNumber: order.orderNumber ?? undefined };

  const trx = await getP24Transaction(sessionId);
  // 1 = wpłata przyjęta, jeszcze niepotwierdzona u P24. 2 = już potwierdzona.
  if (trx?.orderId && (trx.status === 1 || trx.status === 2)) {
    const amountGrosze = Math.round(Number(order.total) * 100);
    const confirmed = trx.status === 2 || (await verifyP24Transaction(sessionId, amountGrosze, trx.orderId));
    if (confirmed) {
      await markOrderPaid(payload, order.id, String(trx.orderId));
      return { state: "paid", orderNumber: order.orderNumber ?? undefined };
    }
  }
  return { state: "pending", orderNumber: order.orderNumber ?? undefined };
}

// Nowy kod po odrzuceniu – to samo zamówienie, nowa transakcja
export async function retryBlik(payload: Payload, sessionId: string, blikCode: string, client: BlikClient) {
  const order = await orderBySession(payload, sessionId);
  if (!order || order.payment?.method !== "blik") return { ok: false as const, message: "Nie znaleziono płatności. Odśwież stronę." };
  return startBlik(payload, order, blikCode, client);
}

export async function markBlikFailed(payload: Payload, sessionId: string) {
  const order = await orderBySession(payload, sessionId);
  if (order && order.payment?.status === "pending") await setPayment(payload, order, { status: "failed" });
}
