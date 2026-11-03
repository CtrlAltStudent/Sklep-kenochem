// Pewne wyjście z panelu. Zwykłe wylogowanie Payloadu pada z „No User”,
// gdy sesja w ciasteczku nie zgadza się z bazą — ciasteczko zostaje i nie da się wejść ponownie.

import { jwtVerify } from "jose";
import type { Endpoint, PayloadRequest } from "payload";

const cookieName = (req: PayloadRequest) => `${req.payload.config.cookiePrefix || "payload"}-token`;

async function staffId(req: PayloadRequest): Promise<number | string | null> {
  const raw = req.headers.get("cookie") ?? "";
  const match = raw.match(new RegExp(`(?:^|;\\s*)${cookieName(req)}=([^;]+)`));
  if (!match?.[1]) return null;
  let token = match[1];
  try {
    token = decodeURIComponent(token);
  } catch {
    // wartość jest już odkodowana
  }
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(req.payload.secret), {
      clockTolerance: 60 * 60 * 24 * 400,
    });
    const claims = payload as { collection?: string; id?: number | string };
    if (claims.collection !== "users") return null;
    const id = claims.id;
    return typeof id === "number" || typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

function expiredCookies(req: PayloadRequest): string[] {
  const name = cookieName(req);
  const exp = new Date(Date.now() - 1000).toUTCString();
  const flags = `Expires=${exp}; Path=/; HttpOnly=true; SameSite=Lax`;
  const cookies = [`${name}=; ${flags}`, `${name}=; ${flags}; Secure`];
  const host = (req.headers.get("host") ?? "").split(":")[0];
  if (host === "sonax.sklep.pl" || host === "www.sonax.sklep.pl") {
    cookies.push(`${name}=; ${flags}; Domain=.sonax.sklep.pl`);
    cookies.push(`${name}=; ${flags}; Domain=.sonax.sklep.pl; Secure`);
  }
  return cookies;
}

export const panelLogoutEndpoint: Endpoint = {
  path: "/wyjscie",
  method: "get",
  handler: async (req) => {
    const id = await staffId(req);
    if (id != null) {
      try {
        await req.payload.update({
          collection: "users",
          id,
          overrideAccess: true,
          data: { loginAttempts: 0, lockUntil: null },
        });
      } catch {
        // Ciasteczko kasujemy nawet wtedy, gdy konta nie da się już odczytać.
      }
    }
    const headers = new Headers();
    for (const cookie of expiredCookies(req)) headers.append("Set-Cookie", cookie);
    headers.set("Location", "/admin/login");
    headers.set("Cache-Control", "no-store");
    return new Response(null, { status: 302, headers });
  },
};
