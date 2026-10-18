// Endpointy panelu dla integracji (pod /api/baselinker/...). Tylko dla pracowników z rolą admin
// (wysyłka zamówień: także „Obsługa zamówień”).

import type { Endpoint, PayloadRequest } from "payload";
import { hasRole } from "@/payload/access";
import { integrationMode, isMock } from "./client";
import { buildAddOrder, sendOrderToBaseLinker } from "./orders";
import { syncProducts, syncStock, testConnection } from "./sync";

const deny = () => Response.json({ ok: false, message: "Brak uprawnień" }, { status: 403 });
const body = async (req: PayloadRequest) => {
  try {
    return (await req.json?.()) ?? {};
  } catch {
    return {};
  }
};

export const baselinkerEndpoints: Endpoint[] = [
  {
    path: "/baselinker/status",
    method: "get",
    handler: async (req) => {
      if (!hasRole(req, "orders")) return deny();
      const s = await req.payload.findGlobal({ slug: "baselinker-settings", req });
      return Response.json({
        mode: integrationMode(),
        mock: isMock(),
        configured: { inventory: Boolean(s.inventoryId), priceGroup: Boolean(s.priceGroupId), warehouse: Boolean(s.warehouseId), orderStatus: Boolean(s.orderStatusId) },
        autoSend: Boolean(s.autoSend),
        lastProductSyncAt: s.lastProductSyncAt,
        lastStockSyncAt: s.lastStockSyncAt,
      });
    },
  },
  {
    path: "/baselinker/test",
    method: "post",
    handler: async (req) => (hasRole(req, "admin") ? Response.json(await testConnection(req.payload)) : deny()),
  },
  {
    path: "/baselinker/sync-products",
    method: "post",
    handler: async (req) => {
      if (!hasRole(req, "admin")) return deny();
      const { dryRun, limit } = await body(req);
      return Response.json(await syncProducts(req.payload, { dryRun: Boolean(dryRun), limit: limit ? Number(limit) : undefined }));
    },
  },
  {
    path: "/baselinker/sync-stock",
    method: "post",
    handler: async (req) => {
      if (!hasRole(req, "admin")) return deny();
      const { dryRun } = await body(req);
      return Response.json(await syncStock(req.payload, { dryRun: Boolean(dryRun) }));
    },
  },
  {
    path: "/baselinker/order-preview/:id",
    method: "get",
    handler: async (req) => {
      if (!hasRole(req, "orders")) return deny();
      const order = await req.payload.findByID({ collection: "orders", id: String(req.routeParams?.id), depth: 0, req });
      return Response.json({ ok: true, mode: integrationMode(), alreadySentId: order.baselinker?.orderId ?? null, ...(await buildAddOrder(req.payload, order, req)) });
    },
  },
  {
    path: "/baselinker/send-order/:id",
    method: "post",
    handler: async (req) => {
      if (!hasRole(req, "orders")) return deny();
      const { force } = await body(req);
      return Response.json(await sendOrderToBaseLinker(req.payload, String(req.routeParams?.id), { force: Boolean(force) && hasRole(req, "admin") }));
    },
  },
];
