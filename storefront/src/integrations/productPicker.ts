// Wyszukiwarka produktów do list w panelu (siatki strony głównej, „kup razem”, podstrony).
// GET /api/product-picker?q=fraza  oraz  ?ids=1,2,3 (odświeżenie już wybranych).

import type { Endpoint } from "payload";
import type { Product } from "@/payload-types";
import { hasRole } from "@/payload/access";

const deny = () => Response.json({ ok: false, message: "Brak uprawnień" }, { status: 403 });

const thumb = (p: Pick<Product, "images">) => {
  const first = p.images?.[0];
  const media = first && typeof first.media === "object" ? first.media : null;
  return media?.thumbnailURL || media?.url || first?.url || "";
};

const row = (d: Pick<Product, "id" | "name" | "sku" | "brand" | "unitLabel" | "price" | "stock" | "images" | "status">) => ({
  id: d.id,
  name: d.name,
  sku: d.sku || "",
  brand: d.brand || "",
  unit: d.unitLabel || "",
  price: d.price,
  stock: d.stock ?? 0,
  thumb: thumb(d),
  status: d.status,
});

export const productPickerEndpoints: Endpoint[] = [
  {
    path: "/product-picker",
    method: "get",
    handler: async (req) => {
      if (!hasRole(req, "editor", "orders")) return deny();
      const ids = String(req.searchParams.get("ids") ?? "").split(",").map((n) => Number(n)).filter((n) => n > 0).slice(0, 80);
      const q = String(req.searchParams.get("q") ?? "").trim();
      if (!ids.length && q.length < 2) return Response.json({ ok: true, hits: [] });
      const where = ids.length
        ? { id: { in: ids } }
        : { and: [{ status: { not_equals: "archived" } }, { or: [{ name: { like: q } }, { sku: { like: q } }, { ean: { like: q } }] }] };
      const { docs } = await req.payload.find({
        collection: "products",
        where: where as never,
        limit: ids.length || 12,
        depth: 1,
        overrideAccess: true,
        select: { name: true, sku: true, brand: true, unitLabel: true, price: true, stock: true, images: true, status: true },
      });
      const hits = docs.map((d) => row(d));
      if (ids.length) hits.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      return Response.json({ ok: true, hits });
    },
  },
];
