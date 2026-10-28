// Łączenie pojemności w jedną kartę sklepu. Każdy wariant to nadal osobny produkt
// (SKU, stan, cena, ID BaseLinkera). W sklepie widać jedną kartę z wyborem pojemności.

import type { Endpoint, Payload } from "payload";
import { hasRole } from "@/payload/access";
import { invalidateCatalog } from "@/lib/catalogCache";
import { VARIANT_DISPLAY, VARIANT_NAV, variantDisplayOf, variantNavOf, type VariantDisplay, type VariantNav } from "@/lib/data";

export const nameKey = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[0-9]+([.,][0-9]+)?\s*(ml|l|litr[oa]?y?|kg|g|szt\.?)/gi, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const volumeMl = (label: string) => {
  const s = label.toLowerCase().replace(",", ".");
  const m = s.match(/([\d.]+)\s*(ml|l\b|litr)/);
  if (!m) return 0;
  return m[2].startsWith("l") && m[2] !== "ml" ? Number(m[1]) * 1000 : Number(m[1]);
};

export const relId = (v: unknown): number | undefined => {
  if (v == null || v === "") return undefined;
  if (typeof v === "object" && v && "id" in v) {
    const n = Number((v as { id: number }).id);
    return n > 0 ? n : undefined;
  }
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const deny = () => Response.json({ ok: false, message: "Brak uprawnień" }, { status: 403 });
const idOf = (v: unknown) => Number(v);

type P = {
  id: number;
  name: string;
  slug?: string | null;
  sku?: string | null;
  ean?: string | null;
  unitLabel?: string | null;
  price: number;
  stock?: number | null;
  variantOf?: unknown;
  variantSort?: number | null;
  variantDisplay?: string | null;
  variantNav?: string | null;
  status?: string | null;
  brand?: string | null;
  images?: { url?: string | null; media?: unknown }[] | null;
};

const thumb = (p: P) => {
  const first = p.images?.[0];
  const media = first && typeof first.media === "object" && first.media ? (first.media as { thumbnailURL?: string; url?: string }) : null;
  return media?.thumbnailURL || media?.url || first?.url || "";
};

async function load(payload: Payload, id: number) {
  return payload.findByID({ collection: "products", id, depth: 0, overrideAccess: true }) as Promise<P>;
}

async function childrenOf(payload: Payload, mainId: number) {
  const { docs } = await payload.find({
    collection: "products",
    where: { variantOf: { equals: mainId } },
    limit: 50,
    depth: 0,
    overrideAccess: true,
    sort: "variantSort",
  });
  return docs as P[];
}

async function mainOf(payload: Payload, p: P): Promise<P> {
  const parent = relId(p.variantOf);
  if (!parent || parent === p.id) return p;
  const m = await load(payload, parent).catch(() => null);
  return m ?? p;
}

function sortMembers(list: P[]) {
  return [...list].sort((a, b) => {
    const sa = a.variantSort ?? 0, sb = b.variantSort ?? 0;
    if (sa !== sb) return sa - sb;
    const va = volumeMl(a.unitLabel || ""), vb = volumeMl(b.unitLabel || "");
    if (va !== vb) return va - vb;
    return (a.unitLabel || a.name).localeCompare(b.unitLabel || b.name, "pl");
  });
}

function member(p: P, mainId: number, thisId: number) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug || "",
    sku: p.sku || "",
    ean: p.ean || "",
    unitLabel: p.unitLabel || "1 szt.",
    price: p.price,
    stock: p.stock ?? 0,
    isMain: p.id === mainId,
    isThis: p.id === thisId,
    sort: p.variantSort ?? 0,
    status: p.status || "active",
    thumb: thumb(p),
  };
}

async function group(payload: Payload, id: number) {
  const current = await load(payload, id);
  const main = await mainOf(payload, current);
  const kids = await childrenOf(payload, main.id);
  const members = sortMembers([main, ...kids.filter((k) => k.id !== main.id)]);
  return { current, main, members };
}

async function setOf(payload: Payload, id: number, variantOf: number | null, variantSort?: number) {
  await payload.update({
    collection: "products",
    id,
    overrideAccess: true,
    data: { variantOf: variantOf as never, ...(variantSort != null ? { variantSort } : {}) },
  });
}

export const variantEndpoints: Endpoint[] = [
  {
    path: "/product-tools/:id/variants",
    method: "get",
    handler: async (req) => {
      if (!hasRole(req, "editor", "orders")) return deny();
      const id = idOf(req.routeParams?.id);
      const { current, main, members } = await group(req.payload, id);
      const key = nameKey(current.name);
      const brand = (current.brand || "").trim();
      const taken = new Set(members.map((m) => m.id));
      const { docs } = await req.payload.find({
        collection: "products",
        where: {
          and: [
            { id: { not_in: [...taken] } },
            { status: { equals: "active" } },
            ...(brand ? [{ brand: { equals: brand } }] : []),
          ],
        } as never,
        limit: 80,
        depth: 0,
        overrideAccess: true,
        select: { name: true, slug: true, sku: true, unitLabel: true, price: true, stock: true, brand: true, images: true, variantOf: true },
      });
      const suggestions = (docs as P[])
        .filter((d) => nameKey(d.name) === key && nameKey(d.name))
        .slice(0, 8)
        .map((d) => ({ id: d.id, name: d.name, sku: d.sku || "", unitLabel: d.unitLabel || "", price: d.price, stock: d.stock ?? 0, thumb: thumb(d) }));
      return Response.json({
        ok: true,
        thisId: id,
        mainId: main.id,
        mainName: main.name,
        isChild: current.id !== main.id,
        display: variantDisplayOf(main.variantDisplay).id,
        nav: variantNavOf(main.variantNav).id,
        members: members.map((m) => member(m, main.id, id)),
        suggestions,
      });
    },
  },
  {
    path: "/product-tools/:id/variants/search",
    method: "get",
    handler: async (req) => {
      if (!hasRole(req, "editor", "orders")) return deny();
      const id = idOf(req.routeParams?.id);
      const q = String(req.searchParams.get("q") ?? "").trim();
      if (q.length < 2) return Response.json({ ok: true, hits: [] });
      const { members } = await group(req.payload, id);
      const taken = new Set(members.map((m) => m.id));
      const { docs } = await req.payload.find({
        collection: "products",
        where: {
          and: [
            { id: { not_in: [...taken, id] } },
            { or: [{ name: { like: `%${q}%` } }, { sku: { like: `%${q}%` } }, { ean: { like: `%${q}%` } }] },
          ],
        } as never,
        limit: 12,
        depth: 0,
        overrideAccess: true,
        select: { name: true, slug: true, sku: true, unitLabel: true, price: true, stock: true, images: true, variantOf: true, status: true },
      });
      return Response.json({
        ok: true,
        hits: (docs as P[]).map((d) => ({
          id: d.id,
          name: d.name,
          sku: d.sku || "",
          unitLabel: d.unitLabel || "",
          price: d.price,
          stock: d.stock ?? 0,
          status: d.status,
          thumb: thumb(d),
          alreadyInGroup: Boolean(relId(d.variantOf)),
        })),
      });
    },
  },
  {
    path: "/product-tools/:id/variants",
    method: "post",
    handler: async (req) => {
      if (!hasRole(req, "editor")) return deny();
      const id = idOf(req.routeParams?.id);
      const body = (await req.json?.()) as { action?: string; productId?: number; order?: number[]; unitLabel?: string; display?: string; nav?: string } | null;
      const action = body?.action;
      const { main, members } = await group(req.payload, id);

      if (action === "add") {
        const otherId = Number(body?.productId);
        if (!otherId || otherId === main.id) return Response.json({ ok: false, message: "Wybierz inny produkt." });
        const other = await load(req.payload, otherId);
        const otherMain = await mainOf(req.payload, other);
        const toMove = otherMain.id === other.id ? [other, ...(await childrenOf(req.payload, other.id))] : [other];
        let sort = Math.max(0, ...members.map((m) => m.variantSort ?? 0));
        for (const p of toMove) {
          if (p.id === main.id) continue;
          sort += 1;
          await setOf(req.payload, p.id, main.id, p.variantSort || sort);
        }
        invalidateCatalog();
        return Response.json({ ok: true, message: toMove.length > 1 ? `Dodano ${toMove.length} pojemności.` : `Dodano „${other.unitLabel || other.name}”.` });
      }

      if (action === "remove") {
        const otherId = Number(body?.productId);
        if (!otherId) return Response.json({ ok: false, message: "Brak produktu." });
        if (otherId === main.id) return Response.json({ ok: false, message: "Nie można odłączyć karty. Najpierw wskaż inną kartę przyciskiem „To jest karta w sklepie”." });
        await setOf(req.payload, otherId, null, 0);
        invalidateCatalog();
        return Response.json({ ok: true, message: "Odłączono – produkt znów ma własną kartę w sklepie." });
      }

      if (action === "makeMain") {
        const otherId = Number(body?.productId);
        if (!otherId) return Response.json({ ok: false, message: "Brak produktu." });
        if (otherId === main.id) return Response.json({ ok: true, message: "To już jest karta w sklepie." });
        const ids = members.map((m) => m.id);
        if (!ids.includes(otherId)) return Response.json({ ok: false, message: "Ten produkt nie jest w tej grupie." });
        const look = variantDisplayOf(main.variantDisplay).id;
        const nav = variantNavOf(main.variantNav).id;
        for (const p of members) await setOf(req.payload, p.id, p.id === otherId ? null : otherId, p.variantSort ?? 0);
        await req.payload.update({ collection: "products", id: otherId, overrideAccess: true, data: { variantDisplay: look, variantNav: nav } });
        invalidateCatalog();
        const neu = await load(req.payload, otherId);
        return Response.json({ ok: true, message: `Kartą w sklepie jest teraz „${neu.name}”.`, mainId: otherId });
      }

      if (action === "sort") {
        const order = (body?.order ?? []).map(Number).filter(Boolean);
        for (const [i, pid] of order.entries()) {
          if (!members.some((m) => m.id === pid)) continue;
          await req.payload.update({ collection: "products", id: pid, overrideAccess: true, data: { variantSort: i + 1 } });
        }
        invalidateCatalog();
        return Response.json({ ok: true });
      }

      if (action === "label") {
        const otherId = Number(body?.productId);
        const unitLabel = String(body?.unitLabel ?? "").trim().slice(0, 40);
        if (!otherId || !unitLabel) return Response.json({ ok: false, message: `Podaj ${variantDisplayOf(main.variantDisplay).label.toLowerCase()}, np. ${variantDisplayOf(main.variantDisplay).placeholder.replace("np. ", "")}.` });
        await req.payload.update({ collection: "products", id: otherId, overrideAccess: true, data: { unitLabel } });
        invalidateCatalog();
        return Response.json({ ok: true });
      }

      if (action === "display") {
        const display = VARIANT_DISPLAY.some((d) => d.id === body?.display) ? (body!.display as VariantDisplay) : "pojemnosc";
        await req.payload.update({ collection: "products", id: main.id, overrideAccess: true, data: { variantDisplay: display } });
        invalidateCatalog();
        return Response.json({ ok: true, message: `W sklepie: ${variantDisplayOf(display).label.toLowerCase()}.` });
      }

      if (action === "nav") {
        const nav = VARIANT_NAV.some((d) => d.id === body?.nav) ? (body!.nav as VariantNav) : "switch";
        await req.payload.update({ collection: "products", id: main.id, overrideAccess: true, data: { variantNav: nav } });
        invalidateCatalog();
        return Response.json({ ok: true, message: nav === "link" ? "Każdy wariant ma swoją stronę w sklepie." : "Warianty są na jednej karcie." });
      }

      return Response.json({ ok: false, message: "Nieznana czynność." });
    },
  },
];

export async function unlinkDeletedParent(payload: Payload, deletedId: number) {
  const { docs } = await payload.find({
    collection: "products",
    where: { variantOf: { equals: deletedId } },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  });
  for (const d of docs) await setOf(payload, d.id, null, 0);
}
