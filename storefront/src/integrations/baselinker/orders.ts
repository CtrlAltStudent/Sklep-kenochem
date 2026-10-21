// Przekazywanie zamówień ze sklepu do BaseLinkera (metoda addOrder).
//
// Przepływ:
//   zamówienie w sklepie → buildAddOrder() mapuje dane + przycina do limitów API
//   → walidacja (schemas.ts) → addOrder → zapis order_id i statusu w zamówieniu.
// Każda próba trafia do „Dziennika integracji”. Zamówienie wysłane raz nie zostanie
// wysłane ponownie (ochrona przed duplikatami w BaseLinkerze).

import type { CollectionAfterChangeHook, Payload, PayloadRequest } from "payload";
import { blActive, blCall, integrationMode, BaseLinkerError } from "./client";
import { shopPullEnabled } from "./shopProtocol";
import { addOrderSchema, formatIssues } from "./schemas";
import { writeLog } from "./log";
import type { BLAddOrder } from "./types";
import type { Order } from "@/payload-types";

const cut = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const country = (v: unknown) => (cut(v, 2).toUpperCase() || "PL");
const round2 = (n: number) => Math.round(n * 100) / 100;

type OrderDoc = Order;

export type BuildResult = { payload: BLAddOrder; warnings: string[]; errors: string[] };

export async function buildAddOrder(payload: Payload, order: OrderDoc, req?: PayloadRequest): Promise<BuildResult> {
  const warnings: string[] = [];
  const [bl, store] = await Promise.all([
    payload.findGlobal({ slug: "baselinker-settings", req, overrideAccess: true }),
    payload.findGlobal({ slug: "store-settings", req, overrideAccess: true }),
  ]);

  const shipMethod = (store.shippingMethods ?? []).find((m) => m.code === order.shipping?.method);
  const payMethod = (store.paymentMethods ?? []).find((m) => m.code === order.payment?.method);
  if (!shipMethod) warnings.push(`Metoda dostawy „${order.shipping?.method}” nie jest zdefiniowana w Ustawieniach sklepu – użyto kodu.`);
  if (!payMethod) warnings.push(`Metoda płatności „${order.payment?.method}” nie jest zdefiniowana w Ustawieniach sklepu – użyto kodu.`);

  const isCOD = payMethod?.provider === "cod";
  const paid = order.payment?.status === "paid";
  const point = order.shipping?.point ?? {};
  const inv = order.invoice ?? {};

  const products = await Promise.all(
    (order.items ?? []).map(async (item) => {
      const productId = typeof item.product === "object" ? item.product?.id : item.product;
      const product = productId
        ? await payload.findByID({ collection: "products", id: productId, depth: 0, req, overrideAccess: true }).catch(() => null)
        : null;
      if (!product?.baselinkerId) warnings.push(`„${item.name}”: produkt bez ID BaseLinkera – zostanie dodany jako pozycja tekstowa (bez powiązania z magazynem).`);
      return {
        storage: bl.productStorage ?? "db",
        storage_id: Number(bl.productStorageId ?? 0),
        product_id: product?.baselinkerId ? String(product.baselinkerId) : "",
        variant_id: 0,
        name: cut(item.name, 200),
        sku: cut(item.sku ?? product?.sku, 50),
        ean: cut(item.ean ?? product?.ean, 32),
        location: "",
        attributes: cut(item.variantLabel, 100),
        price_brutto: round2(Number(item.priceGross)),
        tax_rate: Number(item.vatRate ?? product?.vatRate ?? 23),
        quantity: Number(item.quantity),
        weight: Number(product?.weight ?? 0),
      };
    }),
  );

  const data: BLAddOrder = {
    order_status_id: Number(bl.orderStatusId ?? 0),
    ...(bl.customSourceId ? { custom_source_id: Number(bl.customSourceId) } : {}),
    date_add: Math.floor(new Date(order.createdAt ?? Date.now()).getTime() / 1000),
    currency: "PLN",
    payment_method: cut(payMethod?.baselinkerName ?? order.payment?.method, 30),
    payment_method_cod: isCOD ? "1" : "0",
    paid: paid ? "1" : "0",
    user_comments: cut(order.customerNote, 510),
    admin_comments: cut(order.adminNote, 200),
    email: cut(order.email, 150),
    phone: cut(order.phone, 100),
    user_login: "",
    delivery_method: cut(shipMethod?.baselinkerName ?? order.shipping?.method, 30),
    delivery_price: round2(Number(order.shipping?.price ?? 0)),
    delivery_fullname: cut(order.shipping?.fullName, 156),
    delivery_company: cut(order.shipping?.company, 156),
    delivery_address: cut(order.shipping?.street, 156),
    delivery_postcode: cut(order.shipping?.postcode, 100),
    delivery_city: cut(order.shipping?.city, 100),
    delivery_state: "",
    delivery_country_code: country(order.shipping?.country),
    delivery_point_id: cut(point.code, 40),
    delivery_point_name: cut(point.name, 100),
    delivery_point_address: cut(point.address, 100),
    delivery_point_postcode: cut(point.postcode, 100),
    delivery_point_city: cut(point.city, 100),
    invoice_fullname: inv.wanted ? cut(inv.fullName, 500) : "",
    invoice_company: inv.wanted ? cut(inv.company, 500) : "",
    invoice_nip: inv.wanted ? cut(String(inv.nip ?? "").replace(/[^\dA-Z]/gi, ""), 100) : "",
    invoice_address: inv.wanted ? cut(inv.street, 500) : "",
    invoice_postcode: inv.wanted ? cut(inv.postcode, 20) : "",
    invoice_city: inv.wanted ? cut(inv.city, 100) : "",
    invoice_state: "",
    invoice_country_code: inv.wanted ? country(inv.country) : "",
    want_invoice: inv.wanted ? "1" : "0",
    extra_field_1: bl.extraField1 === "none" ? "" : cut(order.orderNumber, 50),
    extra_field_2: "",
    products,
  };

  if (shipMethod?.requiresPoint && !data.delivery_point_id) warnings.push("Wybrana dostawa wymaga punktu odbioru, a nie podano kodu punktu.");
  const sum = round2(products.reduce((s, p) => s + p.price_brutto * p.quantity, 0) + data.delivery_price);
  if (order.total != null && Math.abs(sum - Number(order.total)) > 0.01)
    warnings.push(`Suma pozycji + dostawa (${sum} zł) różni się od sumy zamówienia (${order.total} zł).`);

  const parsed = addOrderSchema.safeParse(data);
  return { payload: data, warnings, errors: parsed.success ? [] : formatIssues(parsed.error) };
}

export async function sendOrderToBaseLinker(payload: Payload, orderId: number | string, opts: { force?: boolean; req?: PayloadRequest } = {}) {
  const startedAt = Date.now();
  const order = await payload.findByID({ collection: "orders", id: orderId, depth: 0, req: opts.req, overrideAccess: true });
  const prev = order.baselinker ?? {};

  if (prev.orderId && !opts.force) {
    return { ok: false as const, message: `Zamówienie jest już w BaseLinkerze (ID ${prev.orderId}). Nie wysyłam ponownie.` };
  }
  if (!blActive()) {
    return { ok: false as const, message: integrationMode() === "disabled" ? "Moduł BaseLinker jest wyłączony (Integracje → Moduły)." : "Integracja nie jest skonfigurowana: wpisz token albo włącz tryb testowy w Integracje → BaseLinker." };
  }

  const built = await buildAddOrder(payload, order, opts.req);
  const update = async (bl: Partial<NonNullable<Order["baselinker"]>>, status?: string) =>
    payload.update({
      collection: "orders", id: orderId, overrideAccess: true, req: opts.req,
      context: { skipBaseLinker: true },
      data: { ...(status ? { status: status as Order["status"] } : {}), baselinker: { ...prev, attempts: (prev.attempts ?? 0) + 1, lastAttemptAt: new Date().toISOString(), ...bl } },
    });

  if (built.errors.length) {
    const message = `Dane niepoprawne – nie wysłano: ${built.errors.join("; ")}`;
    await update({ syncStatus: "error", lastError: message });
    await writeLog(payload, { type: "order", status: "error", message, startedAt, order: orderId, details: built });
    return { ok: false as const, message, ...built };
  }

  try {
    const res = await blCall<{ order_id: number }>("addOrder", built.payload as unknown as Record<string, unknown>);
    await update({ syncStatus: "sent", orderId: res.order_id, lastError: built.warnings.join("\n") || null }, "processing");
    await writeLog(payload, {
      type: "order", status: built.warnings.length ? "warning" : "success", startedAt, order: orderId,
      message: `Zamówienie ${order.orderNumber} → BaseLinker #${res.order_id}`, details: built,
    });
    return { ok: true as const, message: `Wysłano. ID w BaseLinkerze: ${res.order_id}`, baselinkerOrderId: res.order_id, ...built };
  } catch (e) {
    const message = e instanceof BaseLinkerError ? e.message : `Błąd połączenia: ${(e as Error).message}`;
    await update({ syncStatus: "error", lastError: message });
    await writeLog(payload, { type: "order", status: "error", message, startedAt, order: orderId, details: built });
    return { ok: false as const, message, ...built };
  }
}

// Czy zamówienie ma już iść do BaseLinkera (włączona auto-wysyłka + reguła „Kiedy wysyłać”)
export async function readyToSend(payload: Payload, doc: OrderDoc, req?: PayloadRequest) {
  if (doc.baselinker?.orderId || doc.status === "cancelled") return false;
  if (!blActive()) return false;
  // Hasło „Inny sklep” = BaseLinker sam pobiera zamówienia. addOrder dawałby je jako „Admin”.
  if (shopPullEnabled()) return false;
  const bl = await payload.findGlobal({ slug: "baselinker-settings", req, overrideAccess: true });
  if (!bl.autoSend) return false;

  const store = await payload.findGlobal({ slug: "store-settings", req, overrideAccess: true });
  const pay = (store.paymentMethods ?? []).find((m) => m.code === doc.payment?.method);
  const online = !pay || pay.provider === "przelewy24";
  return bl.sendWhen === "always" || !online || doc.payment?.status === "paid";
}

// Hook kolekcji Orders: automatyczne przekazanie zamówienia zgodnie z ustawieniami.
export const autoSendToBaseLinker: CollectionAfterChangeHook = async ({ doc, req, context }) => {
  if (context.skipBaseLinker) return doc;
  if (!(await readyToSend(req.payload, doc, req))) return doc;

  // Wysyłka po zakończeniu bieżącej transakcji zapisu, żeby nie blokować klienta
  setTimeout(() => {
    sendOrderToBaseLinker(req.payload, doc.id).catch((e) => req.payload.logger.error({ err: e }, "Auto-wysyłka do BaseLinkera"));
  }, 0);
  return doc;
};
