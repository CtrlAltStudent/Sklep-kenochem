// Dopisuje ORLEN Paczkę do Ustawień sklepu, jeśli jeszcze jej nie ma.
// Uruchomienie: npx cross-env PAYLOAD_DB_PUSH=0 NODE_OPTIONS=--no-deprecation payload run src/scripts/add-orlen.ts

import { getPayload } from "payload";
import config from "@payload-config";

const orlenPaczka = {
  code: "orlen-paczka",
  label: "ORLEN Paczka (punkt odbioru)",
  price: 16.5,
  baselinkerName: "ORLEN Paczka",
  requiresPoint: true,
  enabled: true,
  freeAboveThreshold: true,
};

const payload = await getPayload({ config });
const store = await payload.findGlobal({ slug: "store-settings" });
const methods = [...(store.shippingMethods ?? [])];

if (methods.some((m) => m.code.startsWith("orlen"))) {
  console.log("ORLEN Paczka już jest w cenniku.");
  process.exit(0);
}

const i = methods.findIndex((m) => m.code === "pickup");
if (i >= 0) methods.splice(i, 0, orlenPaczka);
else methods.push(orlenPaczka);

await payload.updateGlobal({
  slug: "store-settings",
  data: { shippingMethods: methods } as never,
});

console.log("Dodano ORLEN Paczkę (16,50 zł, punkt odbioru). Cena do zmiany w panelu: Ustawienia sklepu → Dostawa.");
process.exit(0);
