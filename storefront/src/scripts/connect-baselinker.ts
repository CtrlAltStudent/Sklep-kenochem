// Ustawia prawdziwe ID katalogu / magazynu / statusu po wpisaniu tokena.
// nic nie wysyła (tylko odczyt API).

import { getPayload } from "payload";
import config from "@payload-config";
import { integrationMode } from "../integrations/baselinker/client";
import { testConnection } from "../integrations/baselinker/sync";

const payload = await getPayload({ config });
console.log(`Tryb: ${integrationMode()}`);

await payload.updateGlobal({
  slug: "baselinker-settings",
  data: { inventoryId: null, priceGroupId: null, warehouseId: null, orderStatusId: null } as never,
});

const t = await testConnection(payload);
if (!t.ok || !("inventories" in t)) {
  console.log("✖", t.message);
  process.exit(1);
}

const inv = (t.inventories as { inventory_id: number; name?: string; default_price_group: number; default_warehouse: string }[] | undefined)?.[0];
const status = (t.statuses as { id: number; name?: string }[] | undefined)?.[0];
if (!inv) {
  console.log("✖ Token działa, ale konto nie ma katalogu produktów.");
  process.exit(1);
}

await payload.updateGlobal({
  slug: "baselinker-settings",
  data: {
    inventoryId: inv.inventory_id,
    priceGroupId: inv.default_price_group,
    warehouseId: inv.default_warehouse,
    orderStatusId: status?.id,
  },
});

console.log("✔ Połączenie działa");
console.log(`  Katalog: ${inv.inventory_id} ${inv.name ?? ""}`.trim());
console.log(`  Grupa cen: ${inv.default_price_group}`);
console.log(`  Magazyn: ${inv.default_warehouse}`);
console.log(`  Status nowych zamówień: ${status?.id ?? "—"} ${status?.name ?? ""}`.trim());
console.log(`  Katalogów: ${(t.inventories as unknown[])?.length ?? 0} · statusów: ${(t.statuses as unknown[])?.length ?? 0} · magazynów: ${(t.warehouses as unknown[])?.length ?? 0}`);
process.exit(0);
