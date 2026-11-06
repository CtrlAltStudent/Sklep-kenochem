import { clientIp, clientTech, deviceOf, isBot, isStaff, newSession, readSession, recordHit, sessionCookie, sourceOf, type HitKind } from "@/lib/stats";

export const runtime = "nodejs";

const kinds = new Set<HitKind>(["view", "here", "notfound", "search"]);

function categoryFilter(path: string, raw: unknown) {
  if (!path.startsWith("/kategoria/") || typeof raw !== "string") return null;
  const query = new URLSearchParams(raw.slice(0, 200));
  const sub = query.get("sub") ?? "";
  const typ = query.get("typ") ?? "";
  if (!/^[a-z0-9-]{0,80}$/.test(sub) || !/^[a-z0-9-]{0,80}$/.test(typ)) return null;
  const kept = new URLSearchParams();
  if (sub) kept.set("sub", sub);
  if (typ) kept.set("typ", typ);
  return kept.toString() || null;
}

export async function POST(request: Request) {
  const ua = request.headers.get("user-agent");
  if (isBot(ua)) return new Response(null, { status: 204 });
  let body: { path?: unknown; kind?: unknown; ref?: unknown; qs?: unknown; search?: unknown; results?: unknown; filter?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof body.path !== "string") return new Response(null, { status: 400 });
  const kind = body.kind as HitKind;
  if (!kinds.has(kind)) return new Response(null, { status: 400 });
  const cookie = request.headers.get("cookie");
  const existing = readSession(cookie);
  const session = existing ?? newSession();
  const firstHit = typeof body.ref === "string" || typeof body.qs === "string";
  const tech = clientTech(ua, request.headers.get("accept-language"));
  recordHit({
    session,
    path: body.path,
    kind,
    staff: isStaff(cookie),
    device: deviceOf(ua),
    browser: tech.browser,
    os: tech.os,
    lang: tech.lang,
    ip: clientIp(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip")),
    source: firstHit ? sourceOf(String(body.ref ?? ""), String(body.qs ?? ""), new URL(request.url).hostname, request.headers.get("host")) : null,
    search: kind === "search" && typeof body.search === "string" ? body.search : null,
    results: kind === "search" && typeof body.results === "number" ? body.results : null,
    filter: categoryFilter(body.path, body.filter),
  });
  const headers = new Headers();
  if (!existing) headers.set("Set-Cookie", sessionCookie(session));
  return new Response(null, { status: 204, headers });
}
