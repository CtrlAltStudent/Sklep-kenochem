// Protokół „plik integracyjny” BaseLinkera (Inny sklep).
// BaseLinker sam pobiera produkty i zamówienia – wtedy widać je jako sklep, nie „ręcznie / Admin”.
// Dokumentacja: https://developers.baselinker.com/shops_api/

import { addHistory } from "../history";
import { timingSafeEqual } from "node:crypto";
import type { Payload } from "payload";
import { getKey, moduleEnabled, recordRun } from "../vault";
import type { Order, Product } from "@/payload-types";

const METHODS = [
  "FileVersion",
  "SupportedMethods",
  "ProductsCategories",
  "ProductsList",
  "ProductsData",
  "ProductsQuantity",
  "OrdersGet",
  "StatusesList",
  "DeliveryMethodsList",
  "PaymentMethodsList",
  "OrderUpdate",
] as const;

type Action = (typeof METHODS)[number];

const err = (code: string, text: string) => ({ error: true, error_code: code, error_text: text });
const json = (data: unknown, status = 200) => Response.json(data, { status });
const n = (v: unknown) => String(v ?? "").trim();
const unix = (d?: string | null) => Math.floor(new Date(d || Date.now()).getTime() / 1000);
const shopUrl = () => process.env.NEXT_PUBLIC_SERVER_URL || "";

function passOk(got: string, want: string) {
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  if (!want || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const STATUSES: Record<string, string> = {
  awaiting_payment: "Czeka na płatność",
  new: "Nowe",
  paid: "Opłacone",
  processing: "W realizacji",
  shipped: "Wysłane",
  cancelled: "Anulowane",
};

export function shopPass() {
  return getKey("baselinker.shopPass");
}

// Gdy jest hasło „Inny sklep”, BaseLinker sam zbiera zamówienia – nie pchamy ich addOrder (byłyby jako Admin).
export function shopPullEnabled() {
  return Boolean(shopPass());
}

export async function handleShopRequest(payload: Payload, request: Request) {
  if (request.method === "GET") return json(err("no_password", "To jest plik integracyjny BaseLinkera. Połączenie ustawia się w panelu BaseLinker: Integracje → Inny sklep."));

  const form = await request.formData().catch(() => null);
  if (!form) return json(err("bad_request", "Oczekiwano danych POST (formularz)."));
  const action = n(form.get("action")) as Action;
  const blPass = n(form.get("bl_pass"));
  if (!moduleEnabled("baselinker")) return json(err("no_password", "Moduł BaseLinker jest wyłączony w panelu sklepu."));
  const want = shopPass();
  if (!want) return json(err("no_password", "W sklepie nie wpisano jeszcze hasła komunikacji (Integracje → BaseLinker → Hasło sklepu)."));
  if (!blPass) return json(err("no_password", "Brak parametru bl_pass."));
  if (!passOk(blPass, want)) return json(err("invalid_password", "Nieprawidłowe hasło komunikacji."));

  try {
    switch (action) {
      case "FileVersion":
        return json({ platform: "Sonax", version: "1.0.0", standard: 4 });
      case "SupportedMethods":
        return json([...METHODS]);
      case "StatusesList":
        return json(STATUSES);
      case "DeliveryMethodsList":
        return json(await deliveryMethods(payload));
      case "PaymentMethodsList":
        return json(await paymentMethods(payload));
      case "ProductsCategories":
        return json(await categories(payload));
      case "ProductsList":
        return json(await productsList(payload, form));
      case "ProductsData":
        return json(await productsData(payload, form));
      case "ProductsQuantity":
        return json(await productsQuantity(payload, form));
      case "OrdersGet":
        return json(await ordersGet(payload, form));
      case "OrderUpdate":
        return json(await orderUpdate(payload, form));
      default:
        return json(err("unsupported_action", `Nieobsługiwana funkcja: ${action || "(pusta)"}`));
    }
  } catch (e) {
    return json(err("internal", e instanceof Error ? e.message : "Błąd sklepu"));
  }
}

async function deliveryMethods(payload: Payload) {
  const s = await payload.findGlobal({ slug: "store-settings", overrideAccess: true });
  return Object.fromEntries((s.shippingMethods ?? []).filter((m) => m.enabled !== false).map((m) => [m.code, m.label]));
}

async function paymentMethods(payload: Payload) {
  const s = await payload.findGlobal({ slug: "store-settings", overrideAccess: true });
  return Object.fromEntries((s.paymentMethods ?? []).filter((m) => m.enabled !== false).map((m) => [m.code, m.label]));
}

async function categories(payload: Payload) {
  const { docs } = await payload.find({ collection: "categories", limit: 0, pagination: false, depth: 0, overrideAccess: true });
  return Object.fromEntries(docs.map((c) => [String(c.id), (c.path || c.name).replace(/\d{3}\s/g, "").replace(/ › /g, "/")]));
}

function pageOf<T>(items: T[], pageRaw: unknown, size = 200) {
  const page = Math.max(1, Number(pageRaw) || 1);
  const pages = Math.max(1, Math.ceil(items.length / size));
  return { slice: items.slice((page - 1) * size, page * size), pages };
}

async function productsList(payload: Payload, form: FormData) {
  const where: Record<string, unknown>[] = [{ status: { equals: "active" } }];
  const sku = n(form.get("filter_sku"));
  const ean = n(form.get("filter_ean"));
  const id = n(form.get("filter_id"));
  const name = n(form.get("filter_name"));
  if (sku) where.push({ sku: { like: sku } });
  if (ean) where.push({ ean: { like: ean } });
  if (id) where.push({ id: { equals: Number(id) || id } });
  if (name) where.push({ name: { like: `%${name}%` } });
  const { docs } = await payload.find({
    collection: "products",
    where: { and: where } as never,
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    sort: "id",
  });
  const { slice, pages } = pageOf(docs, form.get("page"));
  const out: Record<string, unknown> = { pages };
  for (const p of slice) {
    out[String(p.id)] = {
      name: p.name,
      quantity: Number(p.stock ?? 0),
      price: Number(p.price ?? 0),
      sku: p.sku ?? "",
      ean: p.ean ?? "",
      currency: "PLN",
    };
  }
  return out;
}

function imageUrls(p: Product) {
  return ((p.images as { url?: string | null }[] | null) ?? []).map((i) => i.url).filter((u): u is string => Boolean(u));
}

async function productsData(payload: Payload, form: FormData) {
  const ids = n(form.get("products_id")).split(",").map((x) => x.trim()).filter(Boolean).slice(0, 100);
  if (!ids.length) return {};
  const { docs } = await payload.find({
    collection: "products",
    where: { id: { in: ids } } as never,
    limit: ids.length,
    depth: 1,
    overrideAccess: true,
  });
  const onlyImages = n(form.get("only_images")) === "1";
  const out: Record<string, unknown> = {};
  for (const p of docs) {
    const cat = typeof p.category === "object" && p.category ? p.category : null;
    out[String(p.id)] = onlyImages
      ? { images: imageUrls(p) }
      : {
          sku: p.sku ?? "",
          ean: p.ean ?? "",
          name: p.name,
          quantity: Number(p.stock ?? 0),
          price: Number(p.price ?? 0),
          currency: "PLN",
          tax: Number(p.vatRate ?? 23),
          weight: Number(p.weight ?? 0),
          description: p.descriptionHtml ?? "",
          man_name: p.brand ?? "",
          category_id: cat ? String(cat.id) : "",
          category_name: cat?.name ?? "",
          url: `${shopUrl()}/produkt/${p.slug}`,
          images: imageUrls(p),
          features: [],
        };
  }
  return out;
}

async function productsQuantity(payload: Payload, form: FormData) {
  const { docs } = await payload.find({ collection: "products", where: { status: { equals: "active" } }, limit: 0, pagination: false, depth: 0, overrideAccess: true, sort: "id" });
  const { slice, pages } = pageOf(docs, form.get("page"), 500);
  const out: Record<string, unknown> = { pages };
  for (const p of slice) out[String(p.id)] = { 0: Number(p.stock ?? 0) };
  return out;
}

async function ordersGet(payload: Payload, form: FormData) {
  const timeFrom = Number(form.get("time_from") || 0);
  const idFrom = Number(form.get("id_from") || 0);
  const onlyPaid = n(form.get("only_paid")) === "1";
  const one = n(form.get("order_id"));
  const and: Record<string, unknown>[] = [];
  if (one) and.push({ id: { equals: Number(one) || one } });
  if (timeFrom) and.push({ createdAt: { greater_than_equal: new Date(timeFrom * 1000).toISOString() } });
  if (idFrom) and.push({ id: { greater_than: idFrom } });
  // „tylko opłacone” w BaseLinkerze: opłacone online + pobranie / odbiór osobisty (płatność przy odbiorze) – też są do realizacji
  if (onlyPaid) and.push({ "payment.status": { in: ["paid", "deferred"] } });
  const { docs } = await payload.find({
    collection: "orders",
    where: and.length ? ({ and } as never) : undefined,
    limit: 100,
    depth: 0,
    overrideAccess: true,
    sort: "id",
  });
  const store = await payload.findGlobal({ slug: "store-settings", overrideAccess: true });
  const ships = new Map((store.shippingMethods ?? []).map((m) => [m.code, m]));
  const pays = new Map((store.paymentMethods ?? []).map((m) => [m.code, m]));
  const out: Record<string, unknown> = {};
  for (const o of docs as Order[]) {
    const ship = ships.get(o.shipping?.method ?? "");
    const pay = pays.get(o.payment?.method ?? "");
    const paid = o.payment?.status === "paid";
    const inv = o.invoice ?? {};
    const point = o.shipping?.point ?? {};
    out[String(o.id)] = {
      delivery_fullname: o.shipping?.fullName ?? "",
      delivery_company: o.shipping?.company ?? "",
      delivery_address: o.shipping?.street ?? "",
      delivery_city: o.shipping?.city ?? "",
      delivery_postcode: o.shipping?.postcode ?? "",
      delivery_state_code: "",
      delivery_country: "Polska",
      delivery_country_code: o.shipping?.country || "PL",
      invoice_fullname: inv.fullName ?? o.shipping?.fullName ?? "",
      invoice_company: inv.company ?? "",
      invoice_address: inv.street ?? o.shipping?.street ?? "",
      invoice_city: inv.city ?? o.shipping?.city ?? "",
      invoice_postcode: inv.postcode ?? o.shipping?.postcode ?? "",
      invoice_country: "Polska",
      invoice_country_code: inv.country || "PL",
      invoice_nip: inv.nip ?? "",
      delivery_point_id: point.code ?? "",
      delivery_point_name: point.name ?? "",
      delivery_point_address: point.address ?? "",
      delivery_point_postcode: point.postcode ?? "",
      delivery_point_city: point.city ?? "",
      phone: o.phone ?? "",
      email: o.email,
      date_add: unix(o.createdAt),
      payment_method_id: o.payment?.method ?? "",
      payment_method: pay?.baselinkerName ?? pay?.label ?? o.payment?.method ?? "",
      payment_method_cod: pay?.provider === "cod" ? 1 : 0,
      currency: "PLN",
      user_comments: o.customerNote ?? "",
      admin_comments: o.adminNote ?? "",
      status_id: o.status ?? "new",
      delivery_method_id: o.shipping?.method ?? "",
      delivery_method: ship?.baselinkerName ?? ship?.label ?? o.shipping?.method ?? "",
      delivery_price: Number(o.shipping?.price ?? 0),
      paid: paid ? 1 : 0,
      paid_time: paid && o.payment?.paidAt ? unix(o.payment.paidAt) : 0,
      want_invoice: inv.wanted ? 1 : 0,
      extra_field_1: o.orderNumber ?? "",
      extra_field_2: "",
      products: (o.items ?? []).map((item) => ({
        id: String(typeof item.product === "object" ? item.product?.id : item.product ?? ""),
        variant_id: "0",
        name: item.name,
        quantity: Number(item.quantity),
        price: Number(item.priceGross),
        weight: 0,
        tax: Number(item.vatRate ?? 23),
        ean: item.ean ?? "",
        sku: item.sku ?? "",
        attributes: item.variantLabel ? [{ name: "Wariant", value: item.variantLabel, price: 0 }] : [],
      })),
    };
  }
  await markPulled(payload, docs as Order[]);
  return out;
}

// Zamówienia oddane BaseLinkerowi: w panelu status „Wysłane” (pobrane przez BaseLinkera) + wpis w historii; ostatnie pobranie w Integracjach
async function markPulled(payload: Payload, docs: Order[]) {
  recordRun("pull", { at: new Date().toISOString(), ok: true, message: docs.length ? `BaseLinker pobrał zamówienia: ${docs.map((o) => o.orderNumber).join(", ")}` : "BaseLinker sprawdził zamówienia – brak nowych" });
  for (const o of docs) {
    if (o.baselinker?.syncStatus === "sent" || o.status === "cancelled") continue;
    await payload.update({
      collection: "orders", id: o.id, overrideAccess: true, context: { skipBaseLinker: true },
      data: { baselinker: { ...(o.baselinker ?? {}), syncStatus: "sent", lastError: "", lastAttemptAt: new Date().toISOString() } } as never,
    });
    await addHistory(payload, o.id, "Pobrane przez BaseLinkera (integracja „Inny sklep”)", "BaseLinker");
  }
}

async function orderUpdate(payload: Payload, form: FormData) {
  const ids = n(form.get("orders_ids") || form.get("order_ids")).split(",").map((x) => x.trim()).filter(Boolean);
  const type = n(form.get("update_type"));
  const value = n(form.get("update_value"));
  let counter = 0;
  for (const id of ids) {
    const order = await payload.findByID({ collection: "orders", id, depth: 0, overrideAccess: true }).catch(() => null);
    if (!order) continue;
    if (type === "status" && value && STATUSES[value]) {
      await payload.update({ collection: "orders", id, overrideAccess: true, context: { skipBaseLinker: true }, data: { status: value as Order["status"] } });
      counter++;
    } else if (type === "paid") {
      await payload.update({
        collection: "orders",
        id,
        overrideAccess: true,
        context: { skipBaseLinker: true },
        data: { payment: { ...(order.payment ?? {}), method: order.payment?.method ?? "p24", status: value === "1" ? "paid" : order.payment?.status }, status: value === "1" ? "paid" : order.status } as never,
      });
      counter++;
    } else if (type === "delivery_number") {
      // Numer przesyłki z BaseLinkera: zapis w notatce i status „Wysłane” – klient dostaje mail z numerem i linkiem do śledzenia
      const note = [order.adminNote, value && `Przesyłka: ${value}`].filter(Boolean).join("\n").slice(0, 200);
      const status = order.status === "cancelled" ? order.status : "shipped";
      await payload.update({ collection: "orders", id, overrideAccess: true, context: { skipBaseLinker: true, trackingNumber: value }, data: { adminNote: note, status } });
      counter++;
    }
  }
  return { counter };
}
