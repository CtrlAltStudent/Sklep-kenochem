// Endpointy ekranu Integracje → Połączenia (pod /api/integrations/...). Tylko administrator.

import { revalidatePath } from "next/cache";
import type { Endpoint, PayloadRequest } from "payload";
import { hasRole } from "@/payload/access";
import { blCall } from "./baselinker/client";
import { testConnection } from "./baselinker/sync";
import { testInpostToken } from "./inpost";
import { testMail } from "./mail/events";
import { testP24Access } from "./przelewy24";
import { moduleById, type AutoSettings, type JobId } from "./registry";
import { runJob, schedulerActive } from "./scheduler";
import { describeVault, recordRun, setModule, updateVault, type VaultPatch } from "./vault";

const deny = () => Response.json({ ok: false, message: "Tylko administrator może zmieniać integracje" }, { status: 403 });
const body = async (req: PayloadRequest) => {
  try {
    return (await req.json?.()) ?? {};
  } catch {
    return {};
  }
};

const int = (v: unknown, min: number, max: number, def: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
const ids = (v: unknown) => (Array.isArray(v) ? v.map(Number).filter((n) => Number.isInteger(n) && n > 0) : []);

// Tylko znane pola i rozsądne wartości (np. synchronizacja nie częściej niż co 5 min)
function cleanAuto(a: Record<string, unknown> | undefined): Partial<AutoSettings> | undefined {
  if (!a) return undefined;
  const out: Partial<AutoSettings> = {};
  for (const k of ["stock", "products", "orders", "statuses"] as const) if (k in a) out[k] = Boolean(a[k]);
  if ("stockEveryMin" in a) out.stockEveryMin = int(a.stockEveryMin, 5, 1440, 15);
  if ("statusesEveryMin" in a) out.statusesEveryMin = int(a.statusesEveryMin, 5, 1440, 15);
  if ("productsHour" in a) out.productsHour = int(a.productsHour, 0, 23, 3);
  if ("shippedStatusIds" in a) out.shippedStatusIds = ids(a.shippedStatusIds);
  if ("cancelledStatusIds" in a) out.cancelledStatusIds = ids(a.cancelledStatusIds);
  return out;
}

export const integrationEndpoints: Endpoint[] = [
  {
    path: "/integrations",
    method: "get",
    handler: async (req) => (hasRole(req, "admin") ? Response.json({ ...describeVault(), scheduler: schedulerActive() }) : deny()),
  },
  {
    path: "/integrations",
    method: "post",
    handler: async (req) => {
      if (!hasRole(req, "admin")) return deny();
      const b = (await body(req)) as { keys?: Record<string, unknown>; modes?: Record<string, unknown>; auto?: Record<string, unknown> };
      const patch: VaultPatch = {
        keys: b.keys ? Object.fromEntries(Object.entries(b.keys).map(([k, v]) => [k, v == null ? null : String(v)])) : undefined,
        modes: b.modes ? Object.fromEntries(Object.entries(b.modes).map(([k, v]) => [k, String(v)])) : undefined,
        auto: cleanAuto(b.auto),
      };
      try {
        updateVault(patch, (req.user as { email?: string } | null)?.email);
        return Response.json({ ok: true, message: "Zapisano", state: { ...describeVault(), scheduler: schedulerActive() } });
      } catch (e) {
        return Response.json({ ok: false, message: (e as Error).message }, { status: 500 });
      }
    },
  },
  {
    // Dodaj / usuń / włącz / wyłącz moduł. Klucze zostają zapisane także po usunięciu modułu.
    path: "/integrations/modules/:id",
    method: "post",
    handler: async (req) => {
      if (!hasRole(req, "admin")) return deny();
      const mod = moduleById(String(req.routeParams?.id));
      if (!mod) return Response.json({ ok: false, message: "Nieznany moduł" }, { status: 404 });
      const b = (await body(req)) as { installed?: unknown; enabled?: unknown };
      const patch = {
        ...(typeof b.installed === "boolean" ? { installed: b.installed } : {}),
        ...(typeof b.enabled === "boolean" ? { enabled: b.enabled } : {}),
      };
      try {
        setModule(mod.id, patch, (req.user as { email?: string } | null)?.email);
        // koszyk i zamówienie pokazują metody zależnie od modułów – odśwież strony sklepu
        try {
          revalidatePath("/", "layout");
        } catch {
          /* poza żądaniem Next (np. skrypt) – nic do odświeżenia */
        }
        const word = patch.installed === false ? "usunięty" : patch.installed ? "dodany" : patch.enabled ? "włączony" : "wyłączony";
        return Response.json({ ok: true, message: `Moduł ${mod.name} ${word}`, state: { ...describeVault(), scheduler: schedulerActive() } });
      } catch (e) {
        return Response.json({ ok: false, message: (e as Error).message }, { status: 500 });
      }
    },
  },
  {
    path: "/integrations/test/:provider",
    method: "post",
    handler: async (req) => {
      if (!hasRole(req, "admin")) return deny();
      switch (req.routeParams?.provider) {
        case "baselinker": {
          const r = await testConnection(req.payload);
          return Response.json({ ok: r.ok, message: r.ok ? `Połączenie działa – katalogów: ${(r as { inventories?: unknown[] }).inventories?.length ?? 0}` : r.message });
        }
        case "przelewy24":
          return Response.json(await testP24Access());
        case "inpost":
          return Response.json(testInpostToken());
        case "poczta":
          return Response.json(await testMail(req.payload));
        default:
          return Response.json({ ok: false, message: "Tej integracji nie da się sprawdzić automatycznie" });
      }
    },
  },
  {
    path: "/integrations/baselinker-statuses",
    method: "get",
    handler: async (req) => {
      if (!hasRole(req, "admin")) return deny();
      try {
        const r = await blCall<{ statuses: { id: number; name: string }[] }>("getOrderStatusList");
        return Response.json({ ok: true, statuses: r.statuses.map((s) => ({ id: s.id, name: s.name })) });
      } catch (e) {
        return Response.json({ ok: false, message: (e as Error).message, statuses: [] });
      }
    },
  },
  {
    path: "/integrations/run/:job",
    method: "post",
    handler: async (req) => {
      if (!hasRole(req, "admin")) return deny();
      const job = String(req.routeParams?.job) as JobId;
      if (!["stock", "products", "orders", "statuses"].includes(job)) return Response.json({ ok: false, message: "Nieznane zadanie" }, { status: 400 });
      const r = await runJob(req.payload, job);
      recordRun(job, { at: new Date().toISOString(), ok: r.ok, message: r.message });
      return Response.json(r);
    },
  },
];
