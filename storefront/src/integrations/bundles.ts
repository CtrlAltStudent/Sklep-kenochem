// Zestaw = produkt sklepu, którego skład to inne produkty po unikalnym SKU.
// GET/POST /api/product-tools/:id/bundle  oraz wyszukiwanie składników.

import type { Endpoint, Payload } from "payload";
import type { Product } from "@/payload-types";
import { hasRole } from "@/payload/access";

const deny = () => Response.json({ ok: false, message: "Brak uprawnień" }, { status: 403 });
const idOf = (v: unknown) => Number(v);
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

const thumb = (p: Pick<Product, "images">) => {
  const first = p.images?.[0];
  const media = first && typeof first.media === "object" ? first.media : null;
  return media?.thumbnailURL || media?.url || first?.url || "";
};

async function load(payload: Payload, id: number) {
  return payload.findByID({ collection: "products", id, depth: 1, overrideAccess: true });
}

export const bundleEndpoints: Endpoint[] = [
  {
    path: "/product-tools/:id/bundle",
    method: "get",
    handler: async (req) => {
      if (!hasRole(req, "editor", "orders")) return deny();
      const id = idOf(req.routeParams?.id);
      const doc = await load(req.payload, id).catch(() => null);
      if (!doc) return Response.json({ ok: false, message: "Nie ma takiego produktu." }, { status: 404 });
      const items = (doc.bundleItems ?? []).map((row) => {
        const product = row.product && typeof row.product === "object" ? row.product : null;
        return {
          productId: product?.id ?? (typeof row.product === "number" ? row.product : 0),
          name: product?.name || row.sku || "Produkt",
          sku: product?.sku || row.sku || "",
          quantity: row.quantity || 1,
          slug: product?.slug || "",
          thumb: product ? thumb(product) : "",
        };
      }).filter((row) => row.productId);
      return Response.json({ ok: true, bundle: Boolean(doc.bundle), sku: doc.sku || "", items });
    },
  },
  {
    path: "/product-tools/:id/bundle/search",
    method: "get",
    handler: async (req) => {
      if (!hasRole(req, "editor", "orders")) return deny();
      const id = idOf(req.routeParams?.id);
      const q = String(req.searchParams.get("q") ?? "").trim();
      if (q.length < 2) return Response.json({ ok: true, hits: [] });
      const { docs } = await req.payload.find({
        collection: "products",
        where: { and: [{ id: { not_equals: id } }, { or: [{ name: { like: q } }, { sku: { like: q } }, { ean: { like: q } }] }] } as never,
        limit: 12,
        depth: 0,
        overrideAccess: true,
        select: { name: true, sku: true, price: true, stock: true, images: true, bundle: true, status: true },
      });
      return Response.json({
        ok: true,
        hits: docs.map((d) => ({
          id: d.id,
          name: d.name,
          sku: d.sku || "",
          price: d.price,
          stock: d.stock ?? 0,
          thumb: thumb(d),
          bundle: Boolean(d.bundle),
          status: d.status,
        })),
      });
    },
  },
  {
    path: "/product-tools/:id/bundle",
    method: "post",
    handler: async (req) => {
      if (!hasRole(req, "editor")) return deny();
      const id = idOf(req.routeParams?.id);
      const body = (await req.json?.()) as { items?: { productId?: number; quantity?: number }[] } | null;
      const current = await load(req.payload, id).catch(() => null);
      if (!current) return Response.json({ ok: false, message: "Nie ma takiego produktu." }, { status: 404 });
      if (!norm(current.sku)) return Response.json({ ok: false, message: "Najpierw wpisz unikalne SKU tego zestawu i zapisz produkt." }, { status: 400 });

      const raw = Array.isArray(body?.items) ? body.items : [];
      const wanted = new Map<number, number>();
      for (const row of raw) {
        const productId = Number(row?.productId);
        const quantity = Math.round(Number(row?.quantity) || 0);
        if (!productId || productId === id || quantity < 1 || quantity > 999) continue;
        wanted.set(productId, quantity);
      }
      if (raw.length && !wanted.size) return Response.json({ ok: false, message: "Wybierz produkty, które wchodzą w zestaw." }, { status: 400 });

      const items: { product: number; sku: string; quantity: number }[] = [];
      const problems: string[] = [];
      for (const [productId, quantity] of wanted) {
        const p = await req.payload.findByID({ collection: "products", id: productId, depth: 0, overrideAccess: true }).catch(() => null);
        if (!p) { problems.push(`Produkt #${productId} nie istnieje`); continue; }
        const sku = String(p.sku ?? "").trim();
        if (!sku) { problems.push(`„${p.name}” nie ma SKU`); continue; }
        if (p.bundle) { problems.push(`${sku} to zestaw, nie pojedynczy produkt`); continue; }
        const { docs } = await req.payload.find({
          collection: "products",
          where: { and: [{ sku: { like: sku } }, { id: { not_equals: p.id } }] } as never,
          limit: 10,
          depth: 0,
          overrideAccess: true,
          select: { sku: true, name: true },
        });
        if (docs.some((d) => norm(d.sku) === norm(sku))) problems.push(`${sku} jest w sklepie więcej niż raz`);
        else items.push({ product: p.id, sku, quantity });
      }
      if (problems.length) return Response.json({ ok: false, message: problems.join(". ") + "." }, { status: 400 });

      await req.payload.update({
        collection: "products",
        id,
        req,
        overrideAccess: true,
        data: { bundle: items.length > 0, bundleItems: items },
      });
      return Response.json({ ok: true, message: items.length ? `Zestaw zapisany (${items.length} ${items.length === 1 ? "produkt" : "produktów"}).` : "Zestaw wyczyszczony – to zwykły produkt." });
    },
  },
];
