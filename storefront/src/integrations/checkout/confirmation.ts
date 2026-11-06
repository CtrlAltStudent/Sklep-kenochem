import type { Order } from "@/payload-types";
import { getCms } from "@/lib/cms";
import { SHOP_PHONE } from "@/lib/data";
import { bankDetails } from "@/lib/bank";
import { mailConfig } from "../mail/send";
import { confirmMatches } from "./confirmKey";

export type ConfirmItem = { name: string; label?: string | null; qty: number; price: number; line: number; sku: string; image?: string };

export type ConfirmOrder = {
  number: string;
  created: string;
  email: string;
  total: number;
  shipPrice: number;
  shipLabel: string;
  where: string;
  payLabel: string;
  kind: "transfer" | "cod" | "paid" | "online";
  items: ConfirmItem[];
  bank: ReturnType<typeof bankDetails>;
  phone: string;
};

function abs(url: string) {
  if (url.startsWith("http")) return url;
  const site = (process.env.NEXT_PUBLIC_SERVER_URL || "https://sonax.sklep.pl").replace(/\/$/, "");
  return `${site}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function imagesOf(ids: number[]) {
  if (!ids.length) return {} as Record<string, string>;
  const payload = await getCms();
  const { docs } = await payload.find({
    collection: "products",
    where: { id: { in: ids } },
    depth: 1,
    limit: ids.length,
    overrideAccess: true,
    select: { images: true },
  });
  const out: Record<string, string> = {};
  for (const p of docs) {
    const first = p.images?.[0];
    const media = typeof first?.media === "object" ? first.media : null;
    const url = media?.sizes?.thumb?.url || media?.url || first?.url;
    if (url) out[String(p.id)] = abs(url);
  }
  return out;
}

export async function loadConfirmation(nr: string, key: string): Promise<ConfirmOrder | null> {
  if (!nr || !key) return null;
  const payload = await getCms();
  const found = await payload.find({
    collection: "orders",
    where: { orderNumber: { equals: nr } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const o = found.docs[0] as Order | undefined;
  if (!o?.orderNumber || !confirmMatches(o.orderNumber, o.id, key)) return null;

  const store = await payload.findGlobal({ slug: "store-settings", overrideAccess: true });
  const ship = store.shippingMethods?.find((m) => m.code === o.shipping?.method);
  const pay = store.paymentMethods?.find((m) => m.code === o.payment?.method);
  const ids = [...new Set((o.items ?? []).map((i) => (typeof i.product === "object" && i.product ? i.product.id : i.product)).filter((id): id is number => typeof id === "number"))];
  const images = await imagesOf(ids).catch(() => ({} as Record<string, string>));
  const point = o.shipping?.point;
  const where = point?.code
    ? `Punkt odbioru ${point.code}${point.address ? `, ${point.address}, ${point.postcode ?? ""} ${point.city ?? ""}` : ""}`
    : o.shipping?.method === "pickup"
      ? "Odbiór osobisty w sklepie, ul. Gen. Andersa 40, Białystok. Zadzwonimy, gdy paczka będzie gotowa."
      : [o.shipping?.fullName, o.shipping?.street, `${o.shipping?.postcode ?? ""} ${o.shipping?.city ?? ""}`.trim()].filter(Boolean).join(", ");
  const paid = o.payment?.status === "paid";
  const cod = o.payment?.status === "deferred" || o.payment?.provider === "none";
  const transfer = o.payment?.provider === "transfer";
  const kind = paid ? "paid" : transfer ? "transfer" : cod ? "cod" : "online";

  return {
    number: o.orderNumber,
    created: new Date(o.createdAt).toLocaleString("pl-PL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    email: o.email,
    total: Number(o.total),
    shipPrice: Number(o.shipping?.price ?? 0),
    shipLabel: ship?.label || o.shipping?.method || "Dostawa",
    where,
    payLabel: pay?.label || (transfer ? "Przelew tradycyjny" : o.payment?.method || "Płatność"),
    kind,
    items: (o.items ?? []).map((i) => ({
      name: i.name,
      label: i.variantLabel,
      qty: Number(i.quantity),
      price: Number(i.priceGross),
      line: Number(i.priceGross) * Number(i.quantity),
      sku: i.sku || i.name,
      image: images[String(typeof i.product === "object" && i.product ? i.product.id : i.product)],
    })),
    bank: bankDetails(mailConfig()?.bank),
    phone: store.phone || SHOP_PHONE,
  };
}
