// Ustawia metody dostawy i płatności pod nowy koszyk (kolejność = kolejność w koszyku).
// Uruchomienie: npx cross-env PAYLOAD_DB_PUSH=0 payload run src/scripts/update-checkout-methods.ts
import { getPayload } from "payload";
import config from "@payload-config";

const payload = await getPayload({ config });
const s = await payload.findGlobal({ slug: "store-settings" });
const old = new Map((s.shippingMethods ?? []).map((m) => [m.code, m]));

const ship = (code: string, label: string, price: number, baselinkerName: string, extra: Partial<{ requiresPoint: boolean; enabled: boolean; freeAboveThreshold: boolean }> = {}) => ({
  ...old.get(code),
  code, label, price, baselinkerName,
  requiresPoint: extra.requiresPoint ?? false,
  enabled: extra.enabled ?? true,
  freeAboveThreshold: extra.freeAboveThreshold ?? true,
});

await payload.updateGlobal({
  slug: "store-settings",
  data: {
    shippingMethods: [
      ship("orlen", "ORLEN Paczka", 8.99, "ORLEN Paczka", { requiresPoint: true }),
      ship("inpost-paczkomat", "Paczkomat InPost 24/7", 13.99, "InPost Paczkomat 24/7", { requiresPoint: true }),
      ship("inpost-kurier", "Kurier InPost", 18.99, "InPost Kurier Standard"),
      ship("gls", "Kurier GLS", 18.99, "GLS Kurier"),
      ship("inpost-kurier-cod", "Kurier InPost – pobranie", 22.99, "InPost Kurier Pobranie", { freeAboveThreshold: false }),
      ship("gls-cod", "Kurier GLS – pobranie", 22.99, "GLS Kurier Pobranie", { freeAboveThreshold: false }),
      ship("pickup", "Odbiór osobisty – Białystok", 0, "Odbiór osobisty"),
      ship("polpaleta", "Kurier półpaleta (do 200 kg)", 0, "Kurier półpaleta", { enabled: false, freeAboveThreshold: false }),
      ship("paleta", "Kurier paleta (do 500 kg)", 0, "Kurier paleta", { enabled: false, freeAboveThreshold: false }),
    ],
    paymentMethods: [
      { code: "blik", label: "BLIK", provider: "przelewy24", baselinkerName: "Przelewy24", enabled: true },
      { code: "p24", label: "Płać przez Przelewy24", provider: "przelewy24", baselinkerName: "Przelewy24", enabled: true },
      { code: "transfer", label: "Przelew tradycyjny", provider: "transfer", baselinkerName: "Przelew bankowy", enabled: true },
      { code: "cod", label: "Płatność przy odbiorze (pobranie)", provider: "cod", baselinkerName: "Pobranie", enabled: true },
      { code: "deferred", label: "Przelew z terminem (B2B)", provider: "deferred", baselinkerName: "Przelew odroczony", b2bOnly: true, enabled: true },
    ],
  },
});
console.log("Metody dostawy i płatności zaktualizowane");
process.exit(0);
