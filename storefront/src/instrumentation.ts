// Uruchamiane raz przy starcie serwera Next.js: harmonogram synchronizacji z BaseLinkerem.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const enabled = process.env.INTEGRATIONS_SCHEDULER ?? (process.env.NODE_ENV === "production" ? "1" : "0");
  if (enabled !== "1") return;

  const { startScheduler } = await import("./integrations/scheduler");
  startScheduler(async () => {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    return getPayload({ config });
  });
}
