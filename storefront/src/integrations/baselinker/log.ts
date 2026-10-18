import type { Payload } from "payload";
import { integrationMode } from "./client";

type LogInput = {
  type: "test" | "products" | "stock" | "order";
  status: "success" | "warning" | "error";
  message: string;
  startedAt: number;
  details?: unknown;
  order?: number | string;
  dryRun?: boolean;
};

// Zapis do kolekcji „Dziennik integracji” – błędy zapisu dziennika nie mogą przerwać synchronizacji.
export async function writeLog(payload: Payload, l: LogInput) {
  try {
    await payload.create({
      collection: "integration-logs",
      overrideAccess: true,
      data: {
        type: l.type,
        status: l.status,
        message: l.message.slice(0, 500),
        mode: l.dryRun ? "dry-run" : integrationMode() === "mock" ? "mock" : "live",
        durationMs: Date.now() - l.startedAt,
        order: l.order as number | undefined,
        details: (l.details ?? null) as Record<string, unknown> | null,
      },
    });
  } catch (e) {
    payload.logger.error({ err: e }, "Nie udało się zapisać dziennika integracji");
  }
}
