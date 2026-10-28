// Stałe połączenie z BaseLinkerem: zadania w tle uruchamiane przez serwer sklepu (src/instrumentation.ts).
// Co minutę sprawdzamy, czy któreś zadanie jest „do zrobienia” według ustawień z panelu
// (Integracje → Połączenia → Automatyczna synchronizacja). Jedno zadanie naraz – bez nakładania się.
//
// Domyślnie działa tylko na serwerze (npm start / Docker). Lokalnie: INTEGRATIONS_SCHEDULER=1 npm run dev.

import type { Payload } from "payload";
import type { JobId } from "./registry";
import { getAuto, getRuns, recordRun } from "./vault";

const MIN = 60_000;
let running = false;
const lastTry: Partial<Record<JobId, number>> = {};
let lastMails = 0; // automaty maili (prośba o opinię, porzucony koszyk) – co 15 minut, niezależnie od BaseLinkera

// Flaga w globalThis: instrumentation i endpointy panelu mogą być osobnymi paczkami modułów
const g = globalThis as { __sonaxScheduler?: boolean };
export const schedulerActive = () => Boolean(g.__sonaxScheduler);

function due(job: JobId, now: Date): boolean {
  const auto = getAuto();
  const last = Math.max(lastTry[job] ?? 0, Date.parse(getRuns()[job]?.at ?? "") || 0);
  const since = now.getTime() - last;
  switch (job) {
    case "stock":
      return auto.stock && since >= Math.max(5, auto.stockEveryMin) * MIN;
    case "statuses":
      return auto.statuses && since >= Math.max(5, auto.statusesEveryMin) * MIN;
    case "orders":
      return auto.orders && since >= 10 * MIN;
    case "products":
      // raz na dobę, o wybranej godzinie (albo przy pierwszej okazji po niej)
      return auto.products && now.getHours() >= auto.productsHour && new Date(last).toDateString() !== now.toDateString();
  }
}

export async function runJob(payload: Payload, job: JobId) {
  const { syncProducts, syncStock } = await import("./baselinker/sync");
  const { retryPendingOrders, syncOrderStatuses } = await import("./baselinker/shipping");
  const { blActive, integrationMode } = await import("./baselinker/client");
  if (!blActive()) return { ok: false, message: integrationMode() === "disabled" ? "Moduł BaseLinker jest wyłączony" : "BaseLinker nie jest skonfigurowany" };
  switch (job) {
    case "stock":
      return syncStock(payload, { quiet: true });
    case "products":
      return syncProducts(payload);
    case "orders":
      return retryPendingOrders(payload);
    case "statuses":
      return syncOrderStatuses(payload);
  }
}

async function tick(getPayload: () => Promise<Payload>) {
  if (running) return;
  running = true;
  try {
    const now = new Date();
    const jobs = (["orders", "statuses", "stock", "products"] as JobId[]).filter((j) => due(j, now));
    const mails = now.getTime() - lastMails >= 15 * MIN;
    if (!jobs.length && !mails) return;
    const payload = await getPayload();
    if (mails) {
      lastMails = now.getTime();
      try {
        const { runMailAutomations } = await import("./mail/automations");
        await runMailAutomations(payload);
      } catch (e) {
        payload.logger.error({ err: e }, "Automaty maili");
      }
    }
    for (const job of jobs) {
      lastTry[job] = Date.now();
      try {
        const r = await runJob(payload, job);
        recordRun(job, { at: new Date().toISOString(), ok: r.ok, message: r.message });
      } catch (e) {
        recordRun(job, { at: new Date().toISOString(), ok: false, message: (e as Error).message });
        payload.logger.error({ err: e }, `Integracje: zadanie ${job}`);
      }
    }
  } catch (e) {
    console.error("[integracje] harmonogram:", e);
  } finally {
    running = false;
  }
}

export function startScheduler(getPayload: () => Promise<Payload>) {
  if (g.__sonaxScheduler) return;
  g.__sonaxScheduler = true;
  // pierwsze sprawdzenie chwilę po starcie serwera, potem co minutę
  setTimeout(() => void tick(getPayload), MIN);
  setInterval(() => void tick(getPayload), MIN).unref?.();
  console.log("[integracje] harmonogram synchronizacji uruchomiony");
}
