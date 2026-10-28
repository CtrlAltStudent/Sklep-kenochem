// Droga powrotna z BaseLinkera do sklepu: statusy zamówień i przesyłki kurierskie.
//
// Kurierów (InPost, GLS, ORLEN Paczka) podłącza się w BaseLinkerze – tam powstają etykiety.
// Sklep co kilkanaście minut pyta o zamówienia „w realizacji” i:
//   - status BaseLinkera z listy „wysłane” → w sklepie „Wysłane do klienta”
//   - status z listy „anulowane” → „Anulowane”
// Numery przesyłek pokazujemy na żywo w zakładce BaseLinker zamówienia (getOrderPackages).

import type { Payload } from "payload";
import { getAuto } from "../vault";
import { blCall } from "./client";
import { writeLog } from "./log";
import { readyToSend, sendOrderToBaseLinker } from "./orders";
import type { Order } from "@/payload-types";

type BLPackage = {
  package_id: number;
  courier_package_nr: string;
  courier_code: string;
  courier_other_name?: string;
  tracking_status?: number;
  tracking_status_date?: number;
  tracking_url?: string;
};

// Kody statusów śledzenia z dokumentacji getOrderPackages
const TRACKING: Record<number, string> = {
  0: "Brak informacji", 1: "Etykieta utworzona", 2: "Nadana", 3: "Nie doręczono", 4: "W doręczeniu", 5: "Doręczona",
  6: "Zwrot", 7: "Awizo", 8: "Czeka w punkcie", 9: "Zagubiona", 10: "Anulowana", 11: "W drodze",
};

export const trackingUrl = (code: string, nr: string) => {
  const c = code.toLowerCase();
  const n = encodeURIComponent(nr);
  if (c.includes("inpost") || c.includes("paczkomat")) return `https://inpost.pl/sledzenie-przesylek?number=${n}`;
  if (c.includes("gls")) return `https://gls-group.com/PL/pl/sledzenie-paczek?match=${n}`;
  if (c.includes("orlen") || c.includes("ruch")) return `https://www.orlenpaczka.pl/sledz-paczke/?numer=${n}`;
  return "";
};

export async function orderPackages(blOrderId: number) {
  const res = await blCall<{ packages: BLPackage[] }>("getOrderPackages", { order_id: blOrderId });
  return (res.packages ?? []).map((p) => ({
    number: p.courier_package_nr,
    courier: p.courier_other_name || p.courier_code,
    status: TRACKING[p.tracking_status ?? 0] ?? "—",
    statusDate: p.tracking_status_date ? new Date(p.tracking_status_date * 1000).toISOString() : null,
    url: p.tracking_url || trackingUrl(p.courier_code, p.courier_package_nr),
  }));
}

const DAY = 86_400_000;
const MAX_PER_RUN = 60; // limit API BaseLinkera: 100 zapytań/min – zostawiamy zapas na resztę

export async function syncOrderStatuses(payload: Payload) {
  const startedAt = Date.now();
  const auto = getAuto();
  const shipped = new Set(auto.shippedStatusIds.map(Number));
  const cancelled = new Set(auto.cancelledStatusIds.map(Number));
  if (!shipped.size && !cancelled.size) return { ok: false, message: "Wskaż w panelu, które statusy BaseLinkera oznaczają „wysłane”." };

  const { docs } = await payload.find({
    collection: "orders",
    overrideAccess: true,
    depth: 0,
    limit: MAX_PER_RUN,
    sort: "updatedAt",
    where: { and: [{ status: { equals: "processing" } }, { "baselinker.orderId": { exists: true } }, { createdAt: { greater_than: new Date(Date.now() - 60 * DAY).toISOString() } }] },
  });

  let toShipped = 0, toCancelled = 0;
  const errors: string[] = [];
  for (const o of docs) {
    try {
      const res = await blCall<{ orders: { order_status_id: number }[] }>("getOrders", { order_id: o.baselinker?.orderId, get_unconfirmed_orders: true });
      const st = Number(res.orders?.[0]?.order_status_id);
      const next: Order["status"] | null = shipped.has(st) ? "shipped" : cancelled.has(st) ? "cancelled" : null;
      if (!next) continue;
      await payload.update({ collection: "orders", id: o.id, overrideAccess: true, context: { skipBaseLinker: true }, data: { status: next } });
      if (next === "shipped") toShipped++;
      else toCancelled++;
    } catch (e) {
      errors.push(`${o.orderNumber}: ${(e as Error).message}`);
    }
  }

  const message = `Statusy: sprawdzono ${docs.length}, wysłane ${toShipped}, anulowane ${toCancelled}` + (errors.length ? `, błędy ${errors.length}` : "");
  if (toShipped || toCancelled || errors.length)
    await writeLog(payload, { type: "order", status: errors.length ? "warning" : "success", message, startedAt, details: { errors } });
  return { ok: !errors.length, message };
}

// Zamówienia, które powinny już być w BaseLinkerze, a nie są (np. chwilowa awaria) – ponów wysyłkę
export async function retryPendingOrders(payload: Payload) {
  const { docs } = await payload.find({
    collection: "orders",
    overrideAccess: true,
    depth: 0,
    limit: 20,
    where: {
      and: [
        { "baselinker.orderId": { exists: false } },
        { "baselinker.syncStatus": { in: ["pending", "error"] } },
        { "baselinker.attempts": { less_than: 5 } },
        { status: { not_equals: "cancelled" } },
        { createdAt: { greater_than: new Date(Date.now() - 14 * DAY).toISOString() } },
      ],
    },
  });
  let sent = 0, failed = 0;
  for (const o of docs) {
    if (!(await readyToSend(payload, o))) continue;
    const r = await sendOrderToBaseLinker(payload, o.id);
    if (r.ok) sent++;
    else failed++;
  }
  return { ok: !failed, message: sent || failed ? `Zamówienia: wysłano ${sent}, nieudane ${failed}` : "Brak zamówień do ponowienia" };
}
