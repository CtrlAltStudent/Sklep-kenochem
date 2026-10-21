// Test składania zamówienia: InPost, ORLEN Paczka, zapis w bazie i mapowanie do BaseLinkera.
// npm run verify:checkout
// Nic nie idzie do prawdziwego P24 (P24_MOCK). BaseLinker: MOCK=1 albo tylko podgląd addOrder.

import { getPayload } from "payload";
import config from "@payload-config";
import { findPickupPoint } from "../integrations/pickup";
import { placeOrder } from "../integrations/checkout/placeOrder";
import { buildAddOrder } from "../integrations/baselinker/orders";
import { integrationMode } from "../integrations/baselinker/client";
import { p24Mode } from "../integrations/przelewy24";
import { testConnection } from "../integrations/baselinker/sync";

const payload = await getPayload({ config });
const ok = (b: boolean) => (b ? "✔" : "✖");
const fail: string[] = [];
const check = (cond: boolean, msg: string) => {
  console.log(`${ok(cond)} ${msg}`);
  if (!cond) fail.push(msg);
};

console.log(`\nBaseLinker: ${integrationMode()} · Przelewy24: ${p24Mode()}\n`);

const bl = await payload.findGlobal({ slug: "baselinker-settings" });
if (!bl.orderStatusId || !bl.inventoryId) {
  const t = await testConnection(payload);
  if (t.ok && "inventories" in t) {
    const inv = (t.inventories as { inventory_id: number; default_price_group: number; default_warehouse: string }[])[0];
    const status = (t.statuses as { id: number }[])[0];
    await payload.updateGlobal({
      slug: "baselinker-settings",
      data: {
        inventoryId: bl.inventoryId ?? inv.inventory_id,
        priceGroupId: bl.priceGroupId ?? inv.default_price_group,
        warehouseId: bl.warehouseId ?? inv.default_warehouse,
        orderStatusId: bl.orderStatusId ?? status?.id,
      },
    });
    console.log(`✔ Uzupełniono ID BaseLinkera (katalog ${inv.inventory_id}, status ${status?.id})`);
  }
}

const product = (await payload.find({
  collection: "products",
  limit: 1,
  where: { and: [{ status: { equals: "active" } }, { stock: { greater_than: 0 } }, { slug: { exists: true } }] },
})).docs[0];
if (!product?.slug) {
  console.log("✖ Brak aktywnego produktu ze stanem – nie da się przetestować koszyka.");
  process.exit(1);
}

const inpost = await findPickupPoint("inpost", "BIA01M");
check(Boolean(inpost?.code), `InPost BIA01M: ${inpost ? `${inpost.name}, ${inpost.city}` : "nie znaleziono (sprawdź internet)"}`);

const orlen = await findPickupPoint("orlen", "BIALYSTOK01");
check(orlen?.code === "BIALYSTOK01", `ORLEN BIALYSTOK01: ${orlen?.name ?? "brak"}`);

const base = {
  name: "Jan Testowy",
  email: "checkout-test@example.com",
  phone: "500021705",
  street: "Andersa 40",
  postcode: "15-113",
  city: "Białystok",
  items: [{ slug: product.slug as string, qty: 1 }],
};

const a = await placeOrder(payload, { ...base, ship: "inpost-paczkomat", pay: "p24", point: inpost?.code ?? "BIA01M" });
check(a.ok, `Zamówienie InPost + P24: ${a.ok ? a.orderNumber : a.message}`);

const b = await placeOrder(payload, { ...base, ship: "orlen-paczka", pay: "p24", point: "BIALYSTOK01" });
check(b.ok, `Zamówienie ORLEN + P24: ${b.ok ? b.orderNumber : b.message}`);

if (a.ok) {
  const order = await payload.findByID({ collection: "orders", id: a.orderId, depth: 0 });
  const preview = await buildAddOrder(payload, order);
  check(!preview.errors.length, `addOrder InPost: ${preview.errors.length ? preview.errors.join("; ") : "dane poprawne"}`);
  check(preview.payload.delivery_method.includes("InPost") || preview.payload.delivery_method.includes("Paczkomat"), `delivery_method = ${preview.payload.delivery_method}`);
  check(preview.payload.payment_method.length > 0, `payment_method = ${preview.payload.payment_method}`);
  check(Boolean(preview.payload.delivery_point_id), `delivery_point_id = ${preview.payload.delivery_point_id}`);
  preview.warnings.forEach((w) => console.log(`  ⚠ ${w}`));
}

if (b.ok) {
  const order = await payload.findByID({ collection: "orders", id: b.orderId, depth: 0 });
  const preview = await buildAddOrder(payload, order);
  check(preview.payload.delivery_method.includes("ORLEN"), `ORLEN delivery_method = ${preview.payload.delivery_method}`);
  check(preview.payload.delivery_point_id === "BIALYSTOK01", `ORLEN delivery_point_id = ${preview.payload.delivery_point_id}`);
}

await payload.delete({ collection: "orders", where: { email: { equals: "checkout-test@example.com" } } });
console.log("✔ Zamówienia testowe usunięte\n");

if (fail.length) {
  console.log(`Niepowodzenia (${fail.length}):`);
  fail.forEach((f) => console.log("  –", f));
  process.exit(1);
}
process.exit(0);
