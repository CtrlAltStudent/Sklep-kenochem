// Tryb testowy (BASELINKER_MOCK=1): udaje odpowiedzi BaseLinkera na podstawie
// produktów z importu CSV, żeby przećwiczyć cały przepływ danych bez tokena.
// Kształt odpowiedzi odpowiada dokumentacji API.

import rawProducts from "@/data/products.json";

type CsvProduct = { id: string; name: string; sku: string; ean: string; vat: number; stock: number; variants: { price: number }[]; images: string[]; short: string };
const sample = (rawProducts as CsvProduct[]).slice(0, 120);

let nextOrderId = 9_000_001;

export function mockCall(method: string, params: Record<string, unknown>): Record<string, unknown> {
  const ok = (data: Record<string, unknown>) => ({ status: "SUCCESS", ...data });
  switch (method) {
    case "getInventories":
      return ok({
        inventories: [
          { inventory_id: 1001, name: "Katalog Sonax (TEST)", description: "", languages: ["pl"], default_language: "pl", price_groups: [101, 102], default_price_group: 101, warehouses: ["bl_201"], default_warehouse: "bl_201", reservations: false, is_default: true },
        ],
      });
    case "getInventoryPriceGroups":
      return ok({ price_groups: [
        { price_group_id: 101, name: "Detal", description: "", currency: "PLN", is_default: true },
        { price_group_id: 102, name: "Hurt B2B", description: "", currency: "PLN", is_default: false },
      ] });
    case "getInventoryWarehouses":
      return ok({ warehouses: [{ warehouse_type: "bl", warehouse_id: 201, name: "Magazyn Białystok", description: "", stock_edition: true, is_default: true }] });
    case "getOrderStatusList":
      return ok({ statuses: [
        { id: 3001, name: "Nowe zamówienia (sklep)", name_for_customer: "Przyjęte" },
        { id: 3002, name: "Opłacone", name_for_customer: "Opłacone" },
        { id: 3003, name: "Wysłane", name_for_customer: "Wysłane" },
      ] });
    case "getOrderSources":
      return ok({ sources: { personal: { "0": "Osobiście/tel." }, shop: { "5001": "Sklep Sonax" } } });
    case "getInventoryCategories":
      return ok({ categories: [
        { category_id: 501, name: "Chemia samochodowa", parent_id: 0 },
        { category_id: 502, name: "Akcesoria do myjni", parent_id: 0 },
        { category_id: 503, name: "Zapachy", parent_id: 0 },
      ] });
    case "getInventoryProductsList": {
      const page = Number(params.page ?? 1);
      if (page > 1) return ok({ products: {} });
      return ok({ products: Object.fromEntries(sample.map((p) => [p.id, {
        id: Number(p.id), ean: p.ean, sku: p.sku, name: p.name,
        prices: { "101": p.variants[0].price }, stock: { bl_201: p.stock },
      }])) });
    }
    case "getInventoryProductsData": {
      const ids = (params.products as number[]).map(String);
      return ok({ products: Object.fromEntries(sample.filter((p) => ids.includes(p.id)).map((p, i) => [p.id, {
        sku: p.sku, ean: p.ean, tax_rate: p.vat, weight: 1, category_id: 501 + (i % 3), manufacturer_id: 0,
        prices: { "101": p.variants[0].price, "102": Math.round(p.variants[0].price * 0.85 * 100) / 100 },
        stock: { bl_201: p.stock }, locations: {},
        text_fields: { name: p.name, description: `<p>${p.short}</p>` },
        images: Object.fromEntries(p.images.map((u, n) => [String(n + 1), u])),
      }])) });
    }
    case "getInventoryProductsStock":
      return ok({ products: Object.fromEntries(sample.map((p) => [p.id, { product_id: Number(p.id), stock: { bl_201: Math.max(0, p.stock - 1) } }])) });
    case "addOrder":
      return ok({ order_id: nextOrderId++ });
    // Zamówienia z „parzystym” ID udają wysłane – do przećwiczenia statusów i numerów przesyłek
    case "getOrders": {
      const id = Number(params.order_id ?? 0);
      return ok({ orders: id ? [{ order_id: id, order_status_id: id % 2 ? 3001 : 3003, delivery_method: "InPost Paczkomat 24/7" }] : [] });
    }
    case "getOrderPackages": {
      const id = Number(params.order_id ?? 0);
      return ok({ packages: id % 2 ? [] : [{
        package_id: id * 10, courier_package_nr: `6800000${id}`, courier_inner_number: "", courier_code: "inpostkurier",
        courier_other_name: "InPost", tracking_status: 2, tracking_status_date: Math.floor(Date.now() / 1000), package_type: "package",
      }] });
    }
    default:
      return { status: "ERROR", error_code: "ERROR_UNKNOWN_METHOD", error_message: `Tryb testowy nie obsługuje metody ${method}` };
  }
}
