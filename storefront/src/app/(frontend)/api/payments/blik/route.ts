import { getCms } from "@/lib/cms";
import { BLIK_CODE, blikStatus, retryBlik } from "@/integrations/checkout/blik";

export const dynamic = "force-dynamic";

const clientOf = (request: Request) => ({
  ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1",
  userAgent: request.headers.get("user-agent") ?? "",
});

// Strona zamówienia pyta co 2 s, czy klient potwierdził płatność w aplikacji banku
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId") ?? "";
  if (!sessionId.startsWith("SX-")) return Response.json({ ok: false }, { status: 400 });
  const st = await blikStatus(await getCms(), sessionId);
  return st ? Response.json({ ok: true, ...st }) : Response.json({ ok: false }, { status: 404 });
}

// Nowy kod BLIK dla tego samego zamówienia (po odrzuceniu albo wygaśnięciu kodu)
const tries = new Map<string, number[]>();
export async function POST(request: Request) {
  const { ip } = clientOf(request);
  const now = Date.now();
  const list = (tries.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  tries.set(ip, list);
  if (list.length > 10) return Response.json({ ok: false, message: "Zbyt wiele prób. Spróbuj za kilka minut." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { sessionId?: string; code?: string };
  if (!body.sessionId?.startsWith("SX-") || !BLIK_CODE.test(body.code ?? "")) return Response.json({ ok: false, message: "Wpisz 6-cyfrowy kod BLIK." }, { status: 400 });
  const r = await retryBlik(await getCms(), body.sessionId, body.code!, clientOf(request));
  return Response.json(r, { status: r.ok ? 200 : 400 });
}
