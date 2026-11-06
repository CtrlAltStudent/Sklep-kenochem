// Protokół „plik integracyjny” BaseLinkera (Inny sklep).
// BaseLinker sam pobiera produkty i zamówienia – wtedy widać je jako sklep, nie „ręcznie / Admin”.
// Dokumentacja: https://developers.baselinker.com/shops_api/

import { addHistory } from "../history";
import { markOrderPaid, withOrderLock } from "../checkout/markPaid";
import { timingSafeEqual } from "node:crypto";
import type { Payload } from "payload";
import { catalogIds, scheduleCatalogLink, skusForCatalogIds } from "./orderCatalog";
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
const shopUrl = () => (process.env.NEXT_PUBLIC_SERVER_URL || "https://sonax.sklep.pl").replace(/\/$/, "");

function absolute(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `${shopUrl()}${url.startsWith("/") ? url : `/${url}`}`;
}

// Pierwsze zdjęcie (indeks 0) jest miniaturą w zamówieniu. Adres musi być pełny – sam „/api/…” nie otworzy się w BaseLinkerze.
function imageUrls(p: Product) {
  const rows = (p.images ?? []) as { url?: string | null; media?: { url?: string | null } | number | null }[];
  const out: string[] = [];
  for (const row of rows) {
    const media = row.media && typeof row.media === "object" ? row.media : null;
    const raw = media?.url || row.url || "";
    if (raw) out.push(absolute(raw));
  }
  return out;
}

function passOk(got: string, want: string) {
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  if (!want || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const STATUSES: Record<string, string> = {
  new: "Nowe",
  awaiting_payment: "Nieopłacone",
  paid: "Opłacone",
  processing: "Przekazane do realizacji",
  shipped: "Wysłane",
  received: "Odebrane",
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
  if (id) where.push({ or: [{ id: { equals: Number(id) || id } }, { baselinkerId: { equals: Number(id) || id } }] });
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

async function productsData(payload: Payload, form: FormData) {
  const ids = n(form.get("products_id")).split(",").map((x) => x.trim()).filter(Boolean).slice(0, 100);
  if (!ids.length) return {};
  const nums = ids.map((x) => Number(x)).filter((x) => x > 0);
  const { docs } = await payload.find({
    collection: "products",
    where: { or: [{ id: { in: nums } }, { baselinkerId: { in: nums } }] } as never,
    limit: Math.max(ids.length, 1),
    depth: 1,
    overrideAccess: true,
  });
  const onlyImages = n(form.get("only_images")) === "1";
  const wanted = new Set(ids);
  const out: Record<string, unknown> = {};
  for (const p of docs) {
    const cat = typeof p.category === "object" && p.category ? p.category : null;
    const body = onlyImages
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
    const keys = [String(p.id), p.baselinkerId ? String(p.baselinkerId) : ""].filter((k) => wanted.has(k));
    for (const key of keys.length ? keys : [String(p.id)]) out[key] = body;
  }
  const missing = nums.filter((id) => !out[String(id)]);
  if (missing.length) {
    const byCatalog = await skusForCatalogIds(missing);
    const skus = [...new Set([...byCatalog.values()])];
    if (skus.length) {
      const more = await payload.find({
        collection: "products",
        where: { sku: { in: skus } } as never,
        limit: skus.length,
        depth: 1,
        overrideAccess: true,
      });
      for (const id of missing) {
        const sku = byCatalog.get(id);
        const p = sku ? more.docs.find((d) => (d.sku ?? "").toLowerCase() === sku.toLowerCase()) : undefined;
        if (!p) continue;
        const cat = typeof p.category === "object" && p.category ? p.category : null;
        out[String(id)] = onlyImages
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
    }
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
  // Nieopłacone (przelew tradycyjny i niedokończona płatność online) też oddajemy. W BaseLinkerze widać paid=0 i da się sprawdzić wpłatę na koncie.
  if (onlyPaid) and.push({ or: [
    { "payment.status": { in: ["paid", "deferred"] } },
    { status: { equals: "awaiting_payment" } },
    { "payment.provider": { equals: "transfer" } },
    { "payment.status": { equals: "pending" } },
  ] });
  const found = await payload.find({
    collection: "orders",
    where: and.length ? ({ and } as never) : undefined,
    limit: 100,
    depth: 0,
    overrideAccess: true,
    sort: "id",
  });
  const docs = [...found.docs];
  const seen = new Set(docs.map((d) => d.id));
  const since = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
  const held = await payload.find({
    collection: "orders",
    where: {
      and: [
        { createdAt: { greater_than: since } },
        { status: { not_in: ["cancelled", "shipped", "received"] } },
        { "baselinker.syncStatus": { equals: "pending" } },
        { or: [{ status: { equals: "awaiting_payment" } }, { "payment.status": { equals: "pending" } }, { "payment.provider": { equals: "transfer" } }] },
      ],
    } as never,
    limit: 50,
    depth: 0,
    overrideAccess: true,
  });
  for (const extra of held.docs) if (!seen.has(extra.id)) docs.push(extra);
  const store = await payload.findGlobal({ slug: "store-settings", overrideAccess: true });
  const ships = new Map((store.shippingMethods ?? []).map((m) => [m.code, m]));
  const pays = new Map((store.paymentMethods ?? []).map((m) => [m.code, m]));
  const catalog = await catalogIds((docs as Order[]).flatMap((o) => (o.items ?? []).map((item) => item.sku ?? "")));
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
      products: (o.items ?? []).map((item) => {
        const shopId = typeof item.product === "object" ? item.product?.id : item.product;
        const catalogId = catalog.get((item.sku ?? "").trim().toLowerCase());
        return {
        id: String(catalogId || shopId || ""),
        variant_id: "0",
        name: item.name,
        quantity: Number(item.quantity),
        price: Number(item.priceGross),
        weight: 0,
        tax: Number(item.vatRate ?? 23),
        ean: item.ean ?? "",
        sku: item.sku ?? "",
        attributes: item.variantLabel ? [{ name: "Wariant", value: item.variantLabel, price: 0 }] : [],
        };
      }),
    };
  }
  await markPulled(payload, docs as Order[]);
  scheduleCatalogLink();
  return out;
}

// Zamówienia oddane BaseLinkerowi: w panelu status „Wysłane” (pobrane przez BaseLinkera) + wpis w historii; ostatnie pobranie w Integracjach
async function markPulled(payload: Payload, docs: Order[]) {
  recordRun("pull", { at: new Date().toISOString(), ok: true, message: docs.length ? `BaseLinker pobrał zamówienia: ${docs.map((o) => o.orderNumber).join(", ")}` : "BaseLinker sprawdził zamówienia – brak nowych" });
  for (const o of docs) {
    if (o.baselinker?.syncStatus === "sent" || o.status === "cancelled") continue;
    // Nieopłacone zostaje „nieopłacone” w sklepie. W BaseLinkerze i tak jest, ze znacznikiem paid=0.
    const unpaid = o.payment?.status === "pending" || o.payment?.status === "failed";
    const handoff = !unpaid && (o.status === "new" || o.status === "paid" || o.status === "awaiting_payment");
    await payload.update({
      collection: "orders", id: o.id, overrideAccess: true, context: { skipBaseLinker: true, skipMail: true },
      data: {
        ...(handoff ? { status: "processing" } : {}),
        baselinker: { ...(o.baselinker ?? {}), syncStatus: "sent", lastError: "", lastAttemptAt: new Date().toISOString() },
      } as never,
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
      await withOrderLock(payload, id, async () => {
        const fresh = await payload.findByID({ collection: "orders", id, depth: 0, overrideAccess: true });
        if (fresh.status === value) return;
        await payload.update({ collection: "orders", id, overrideAccess: true, context: { skipBaseLinker: true }, data: { status: value as Order["status"] } });
      });
      counter++;
    } else if (type === "paid" && value === "1") {
      await markOrderPaid(payload, id, order.payment?.transactionId ?? undefined);
      counter++;
    } else if (type === "delivery_number" && value) {
      // Numer przesyłki zostaje przy zamówieniu. Ten sam numer drugi raz nie wysyła kolejnego maila.
      await withOrderLock(payload, id, async () => {
        const fresh = await payload.findByID({ collection: "orders", id, depth: 0, overrideAccess: true });
        if (fresh.shipping?.trackingNumber === value && (fresh.status === "shipped" || fresh.status === "received" || fresh.status === "cancelled")) return;
        const status = fresh.status === "cancelled" || fresh.status === "received" ? fresh.status : "shipped";
        await payload.update({
          collection: "orders", id, overrideAccess: true, context: { skipBaseLinker: true, trackingNumber: value },
          data: { status, shipping: { trackingNumber: value } } as never,
        });
      });
      counter++;
    }
  }
  return { counter };
}
