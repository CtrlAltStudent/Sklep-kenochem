// Test całego przepływu integracji BaseLinker (bez przeglądarki).
// Uruchomienie: npm run verify:baselinker
// W trybie BASELINKER_MOCK=1 nic nie trafia do prawdziwego BaseLinkera.
// W trybie produkcyjnym (token) wykonuje TYLKO odczyty + podgląd zamówienia – nie wysyła zamówień,
// chyba że ustawisz VERIFY_SEND=1. VERIFY_KEEP=1 zostawia zamówienie testowe w panelu.

import { getPayload } from "payload";
import config from "@payload-config";
import { integrationMode } from "../integrations/baselinker/client";
import { buildAddOrder, sendOrderToBaseLinker } from "../integrations/baselinker/orders";
import { syncProducts, testConnection } from "../integrations/baselinker/sync";

const payload = await getPayload({ config });
const mode = integrationMode();
const send = process.env.VERIFY_SEND === "1" || mode === "mock";
const ok = (b: boolean) => (b ? "✔" : "✖");
console.log(`\nTryb integracji: ${mode}\n`);

// 1. Połączenie i słowniki
const t = await testConnection(payload);
console.log(`${ok(t.ok)} Test połączenia: ${t.message}`);
if (!t.ok) process.exit(1);

// 2. Uzupełnij ustawienia ID z pierwszej odpowiedzi (tylko gdy puste)
const s = await payload.findGlobal({ slug: "baselinker-settings" });
if (!s.inventoryId && "inventories" in t) {
  const inv = (t.inventories as { inventory_id: number; default_price_group: number; default_warehouse: string }[])[0];
  const status = (t.statuses as { id: number }[])[0];
  await payload.updateGlobal({ slug: "baselinker-settings", data: { inventoryId: inv.inventory_id, priceGroupId: inv.default_price_group, warehouseId: inv.default_warehouse, orderStatusId: status?.id } });
  console.log(`✔ Ustawienia uzupełnione: katalog ${inv.inventory_id}, grupa cen ${inv.default_price_group}, magazyn ${inv.default_warehouse}, status ${status?.id}`);
}

// 3. Podgląd synchronizacji produktów (bez zapisu)
const dry = await syncProducts(payload, { dryRun: true, limit: 20 });
console.log(`${ok(dry.ok)} ${dry.message}`);

// 4. Zamówienie testowe: walidacja i (w trybie testowym) wysyłka
const product = (await payload.find({ collection: "products", limit: 1, where: { sku: { exists: true } } })).docs[0];
const order = await payload.create({
  collection: "orders",
  context: { skipBaseLinker: true },
  data: {
    email: "test@example.com",
    phone: "500000000",
    items: [{ product: product.id, name: product.name, sku: product.sku, ean: product.ean, quantity: 2, priceGross: product.price, vatRate: product.vatRate ?? 23 }],
    shipping: { method: "inpost-paczkomat", price: 16.5, fullName: "Jan Testowy", street: "Testowa 1", postcode: "15-113", city: "Białystok", country: "PL", point: { code: "BIA01M", name: "Paczkomat BIA01M", address: "Testowa 1", postcode: "15-113", city: "Białystok" } },
    invoice: { wanted: true, company: "Firma Test Sp. z o.o.", nip: "123-456-32-18", street: "Firmowa 2", postcode: "15-001", city: "Białystok", country: "PL" },
    payment: { method: "p24", status: "paid", provider: "przelewy24" },
    customerNote: "Zamówienie testowe – proszę zignorować",
  },
});
console.log(`✔ Utworzono zamówienie testowe ${order.orderNumber} (razem ${order.total} zł)`);

const preview = await buildAddOrder(payload, order);
console.log(`${ok(!preview.errors.length)} Walidacja addOrder: ${preview.errors.length ? preview.errors.join("; ") : "dane poprawne"}`);
preview.warnings.forEach((w) => console.log(`  ⚠ ${w}`));
console.log("  Dane dla BaseLinkera:", JSON.stringify({ ...preview.payload, products: preview.payload.products.map((p) => `${p.quantity}× ${p.name} @ ${p.price_brutto}`) }, null, 2));

// Walidacja musi też odrzucać błędne dane
const broken = await buildAddOrder(payload, { ...order, email: "zly-email", items: [] });
console.log(`${ok(broken.errors.length > 0)} Błędne zamówienie odrzucone: ${broken.errors.join("; ")}`);

if (send) {
  const r1 = await sendOrderToBaseLinker(payload, order.id);
  console.log(`${ok(r1.ok)} Wysyłka: ${r1.message}`);
  const r2 = await sendOrderToBaseLinker(payload, order.id);
  console.log(`${ok(!r2.ok)} Ochrona przed duplikatem: ${r2.message}`);
  const after = await payload.findByID({ collection: "orders", id: order.id });
  console.log(`✔ Status w sklepie: ${after.status}, BaseLinker: ${after.baselinker?.syncStatus} #${after.baselinker?.orderId}`);
} else {
  console.log("ℹ Tryb produkcyjny – zamówienia nie wysłano (VERIFY_SEND=1, żeby wysłać).");
}

// Sprzątanie: zamówienia testowe usuwamy (chyba że --keep)
if (process.env.VERIFY_KEEP !== "1") {
  await payload.delete({ collection: "orders", where: { email: { equals: "test@example.com" } } });
  console.log("✔ Zamówienia testowe usunięte (VERIFY_KEEP=1 je zostawia)");
}

const logs = await payload.count({ collection: "integration-logs" });
console.log(`✔ Wpisów w dzienniku integracji: ${logs.totalDocs}\n`);
process.exit(0);
