import type { CollectionSlug, Payload, Where } from "payload";
import { TabsBar, type StatusTab } from "./AdminClient";

type TabDef = Omit<StatusTab, "count">;

// Zakładki nad listami – jak w panelach Shoper / Shopify („Wszystkie”, „Nowe”, „Do wysyłki”…)
async function build(payload: Payload, slug: CollectionSlug, defs: TabDef[]) {
  const toWhere = (w?: TabDef["where"]): Where | undefined => w && {
    and: w.map(([field, op, v]) => ({ [field]: { [op]: op === "exists" ? v === "true" : v } })),
  };
  const counts = await Promise.all(defs.map((d) => payload.count({ collection: slug, where: toWhere(d.where), overrideAccess: true }).then((r) => r.totalDocs).catch(() => 0)));
  return <TabsBar slug={slug} tabs={defs.map((d, i) => ({ ...d, count: counts[i] }))} />;
}

export const OrderTabs = ({ payload }: { payload: Payload }) => build(payload, "orders", [
  { label: "Wszystkie" },
  { label: "Nowe", where: [["status", "equals", "new"]], tone: "navy" },
  { label: "Czeka na płatność", where: [["status", "equals", "awaiting_payment"]], tone: "amber" },
  { label: "Opłacone", where: [["status", "equals", "paid"]], tone: "green" },
  { label: "W realizacji", where: [["status", "equals", "processing"]], tone: "green" },
  { label: "Błąd BaseLinkera", where: [["baselinker.syncStatus", "equals", "error"]], tone: "red" },
  { label: "Anulowane", where: [["status", "equals", "cancelled"]], tone: "slate" },
]);

export const ProductTabs = ({ payload }: { payload: Payload }) => build(payload, "products", [
  { label: "Wszystkie" },
  { label: "Widoczne", where: [["status", "equals", "active"]], tone: "green" },
  { label: "Brak w magazynie", where: [["stock", "less_than_equal", "0"]], tone: "red" },
  { label: "Niski stan (≤ 5)", where: [["stock", "greater_than", "0"], ["stock", "less_than_equal", "5"]], tone: "amber" },
  { label: "W promocji", where: [["sale.price", "exists", "true"]], tone: "navy" },
  { label: "Ukryte", where: [["status", "equals", "hidden"]], tone: "slate" },
  { label: "Wycofane", where: [["status", "equals", "archived"]], tone: "slate" },
]);

export const ReturnTabs = ({ payload }: { payload: Payload }) => build(payload, "returns", [
  { label: "Wszystkie" },
  { label: "Nowe", where: [["status", "equals", "new"]], tone: "navy" },
  { label: "Czekamy na paczkę", where: [["status", "equals", "accepted"]], tone: "amber" },
  { label: "Towar otrzymany", where: [["status", "equals", "received"]], tone: "green" },
  { label: "Zakończone", where: [["status", "equals", "refunded"]], tone: "slate" },
]);

export const ReviewTabs = ({ payload }: { payload: Payload }) => build(payload, "reviews", [
  { label: "Wszystkie" },
  { label: "Do moderacji", where: [["status", "equals", "pending"]], tone: "amber" },
  { label: "Opublikowane", where: [["status", "equals", "approved"]], tone: "green" },
  { label: "Odrzucone", where: [["status", "equals", "rejected"]], tone: "red" },
]);
