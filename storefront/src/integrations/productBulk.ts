// Akcje na wielu produktach (lista produktów → zaznacz → pasek, ProductBulkBar.tsx).
// POST /api/product-bulk { ids, action, ... }
// Kategoria i cena dostają „nie nadpisuj”, żeby nocna synchronizacja BaseLinkera ich nie cofnęła.

import type { Endpoint, PayloadRequest } from "payload";
import type { Product } from "@/payload-types";
import { hasRole } from "@/payload/access";
import { parseIds } from "./orderBulk";

const STATUSES = ["active", "hidden", "archived"] as const;
const BADGES = ["nowosc", "promocja", "bestseller"] as const;
const deny = () => Response.json({ ok: false, message: "Brak uprawnień" }, { status: 403 });

async function body(req: PayloadRequest) {
  try {
    return ((await req.json?.()) ?? {}) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const productBulkEndpoints: Endpoint[] = [
  {
    path: "/product-bulk",
    method: "post",
    handler: async (req) => {
      if (!hasRole(req, "editor")) return deny();
      const b = await body(req);
      const ids = parseIds(b.ids);
      if (!ids.length) return Response.json({ ok: false, message: "Zaznacz produkty" }, { status: 400 });
      const action = String(b.action ?? "");

      const { docs } = await req.payload.find({
        collection: "products",
        where: { id: { in: ids } },
        limit: ids.length,
        depth: 0,
        overrideAccess: true,
        pagination: false,
      });
      if (!docs.length) return Response.json({ ok: false, message: "Nie znaleziono produktów" }, { status: 404 });

      const save = async (p: Product, data: Record<string, unknown>) => {
        await req.payload.update({ collection: "products", id: p.id, req, overrideAccess: true, data });
      };

      let done = 0;
      const errors: string[] = [];
      const run = async (p: Product, data: Record<string, unknown>) => {
        try {
          await save(p, data);
          done++;
        } catch (e) {
          errors.push(`${p.sku || p.name}: ${(e as Error).message}`);
        }
      };

      if (action === "category") {
        const raw = b.category;
        const category = raw == null || raw === "" || raw === "none" ? null : Number(raw);
        if (category != null && !(category > 0)) return Response.json({ ok: false, message: "Wybierz kategorię" }, { status: 400 });
        if (category) {
          const exists = await req.payload.findByID({ collection: "categories", id: category, depth: 0, overrideAccess: true }).catch(() => null);
          if (!exists) return Response.json({ ok: false, message: "Nie ma takiej kategorii" }, { status: 400 });
        }
        for (const p of docs) await run(p, { category, keep: { ...(p.keep ?? {}), category: true } });
        return Response.json({ ok: done > 0, message: `Kategoria: ${done} z ${docs.length}${errors.length ? ` · ${errors.slice(0, 2).join("; ")}` : ""}. Synchronizacja z BaseLinkera jej nie cofnie.` });
      }

      if (action === "status") {
        const status = String(b.status);
        if (!STATUSES.includes(status as (typeof STATUSES)[number])) return Response.json({ ok: false, message: "Nieznana widoczność" }, { status: 400 });
        for (const p of docs) await run(p, { status });
        return Response.json({ ok: done > 0, message: `Widoczność: ${done} z ${docs.length}` });
      }

      if (action === "brand") {
        const brand = String(b.brand ?? "").trim().slice(0, 80);
        for (const p of docs) await run(p, { brand: brand || null });
        return Response.json({ ok: done > 0, message: brand ? `Marka „${brand}”: ${done} z ${docs.length}` : `Marka wyczyszczona: ${done} z ${docs.length}` });
      }

      if (action === "badge") {
        const badge = String(b.badge);
        const mode = String(b.mode);
        if (!BADGES.includes(badge as (typeof BADGES)[number]) || (mode !== "add" && mode !== "remove")) {
          return Response.json({ ok: false, message: "Wybierz etykietę" }, { status: 400 });
        }
        for (const p of docs) {
          const cur = new Set(p.badges ?? []);
          if (mode === "add") cur.add(badge as (typeof BADGES)[number]);
          else cur.delete(badge as (typeof BADGES)[number]);
          await run(p, { badges: [...cur] });
        }
        return Response.json({ ok: done > 0, message: `${mode === "add" ? "Dodano etykietę" : "Zdjęto etykietę"}: ${done} z ${docs.length}` });
      }

      if (action === "price") {
        const mode = String(b.mode);
        const value = Number(b.value);
        if (!["set", "up-percent", "down-percent", "up-amount", "down-amount"].includes(mode) || !Number.isFinite(value) || value < 0 || value > 1_000_000) {
          return Response.json({ ok: false, message: "Podaj poprawną kwotę albo procent" }, { status: 400 });
        }
        if (mode !== "set" && value === 0) return Response.json({ ok: false, message: "Podaj wartość większą od zera" }, { status: 400 });
        if ((mode === "up-percent" || mode === "down-percent") && value > 90 && mode === "down-percent") {
          return Response.json({ ok: false, message: "Obniżka nie może być większa niż 90%" }, { status: 400 });
        }
        for (const p of docs) {
          const base = Number(p.price ?? 0);
          let next = base;
          if (mode === "set") next = value;
          else if (mode === "up-percent") next = base * (1 + value / 100);
          else if (mode === "down-percent") next = base * (1 - value / 100);
          else if (mode === "up-amount") next = base + value;
          else next = base - value;
          next = round2(next);
          if (next < 0) { errors.push(`${p.sku || p.name}: cena wyszłaby ujemna`); continue; }
          await run(p, { price: next, keep: { ...(p.keep ?? {}), price: true } });
        }
        return Response.json({ ok: done > 0, message: `Cena: ${done} z ${docs.length}${errors.length ? ` · ${errors.slice(0, 2).join("; ")}` : ""}. Synchronizacja z BaseLinkera jej nie cofnie.` });
      }

      return Response.json({ ok: false, message: "Nieznana akcja" }, { status: 400 });
    },
  },
];
