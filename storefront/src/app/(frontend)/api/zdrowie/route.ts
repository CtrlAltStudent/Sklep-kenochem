import { getCms } from "@/lib/cms";
import { blActive } from "@/integrations/baselinker/client";
import { schedulerActive } from "@/integrations/scheduler";
import { getAuto, getRuns } from "@/integrations/vault";

export const dynamic = "force-dynamic";

// Adres kontrolny dla monitoringu (UptimeRobot): 200 + „"status":"ok"” gdy wszystko działa, 503 gdy jest problem.
// Publiczny (bez hasła strony) – dlatego tylko krótkie opisy problemów, bez danych technicznych.
const MIN = 60_000;

export async function GET() {
  const problems: string[] = [];
  const started = Date.now();

  try {
    const payload = await getCms();
    const { totalDocs } = await payload.count({ collection: "products", overrideAccess: true });
    if (!totalDocs) problems.push("brak produktów w bazie");
  } catch {
    problems.push("baza danych nie odpowiada");
  }

  // Synchronizacja z BaseLinkerem: włączona, a ostatni udany przebieg dawno temu albo z błędem
  const auto = getAuto();
  const runs = getRuns();
  if (process.env.NODE_ENV === "production" && !schedulerActive()) problems.push("harmonogram synchronizacji nie działa");
  if (blActive()) {
    for (const [job, on, every] of [["stock", auto.stock, auto.stockEveryMin], ["statuses", auto.statuses, auto.statusesEveryMin]] as const) {
      if (!on) continue;
      const last = runs[job];
      const label = job === "stock" ? "stanów" : "statusów";
      if (!last || Date.now() - Date.parse(last.at) > (3 * Math.max(5, every) + 10) * MIN) problems.push(`synchronizacja ${label} z BaseLinkerem stoi`);
      else if (!last.ok) problems.push(`synchronizacja ${label} z BaseLinkerem zgłasza błąd`);
    }
  }

  const body = { status: problems.length ? "problem" : "ok", problems, ms: Date.now() - started, time: new Date().toISOString() };
  return Response.json(body, { status: problems.length ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
