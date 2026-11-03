import { isStaff, markStaff, readSession, staffCookie } from "@/lib/stats";

// Panel oznacza tę przeglądarkę jako naszą, żeby statystyki dało się oglądać bez własnych wejść.
export async function POST(request: Request) {
  const cookie = request.headers.get("cookie");
  if (!cookie?.includes("payload-token=")) return Response.json({ ok: false }, { status: 401 });
  const session = readSession(cookie);
  const changedRows = session ? markStaff(session) : 0;
  const fresh = !isStaff(cookie);
  return Response.json(
    { ok: true, changed: fresh || changedRows > 0 },
    { status: 200, headers: { "Set-Cookie": staffCookie() } },
  );
}
