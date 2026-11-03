import { isBot, isStaff, newSession, readSession, recordHit, sessionCookie, type HitKind } from "@/lib/stats";

export const runtime = "nodejs";

const kinds = new Set<HitKind>(["view", "notfound"]);

export async function POST(request: Request) {
  if (isBot(request.headers.get("user-agent"))) return new Response(null, { status: 204 });
  let body: { path?: unknown; kind?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof body.path !== "string") return new Response(null, { status: 400 });
  const kind: HitKind = body.kind === "notfound" ? "notfound" : "view";
  if (!kinds.has(kind)) return new Response(null, { status: 400 });
  const cookie = request.headers.get("cookie");
  const existing = readSession(cookie);
  const session = existing ?? newSession();
  recordHit({ session, path: body.path, kind, staff: isStaff(cookie) });
  const headers = new Headers();
  if (!existing) headers.set("Set-Cookie", sessionCookie(session));
  return new Response(null, { status: 204, headers });
}
