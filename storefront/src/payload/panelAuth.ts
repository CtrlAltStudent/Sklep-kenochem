// Domyślne logowanie Payloadu przy zapisie w panelu zostawia puste konto,
// choć token jest ważny i w bazie jest rola administratora. Ten sposób czyta token sam
// i bierze konto prosto z bazy.

import { jwtVerify } from "jose";
import type { AuthStrategy } from "payload";

const tokenFrom = (headers: Request["headers"]) => {
  const header = headers.get("authorization") ?? "";
  if (header.startsWith("JWT ")) return header.slice(4).trim();
  const match = (headers.get("cookie") ?? "").match(/(?:^|;\s*)payload-token=([^;]+)/);
  if (!match?.[1]) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

export const panelAuth: AuthStrategy = {
  name: "panel-jwt",
  authenticate: async ({ headers, payload }) => {
    const token = tokenFrom(headers);
    if (!token) return { user: null };
    try {
      const envSecret = process.env.PAYLOAD_SECRET || "";
      if (payload.secret !== envSecret) {
        payload.logger.error({
          msg: "Sekret panelu różni się od zmiennej serwera",
          panel: payload.secret?.length ?? 0,
          env: envSecret.length,
        });
      }
      const { payload: claims, protectedHeader } = await jwtVerify(token, new TextEncoder().encode(payload.secret));
      if (protectedHeader.authVersion !== 1) return { user: null };
      const id = claims.id;
      if (claims.collection !== "users" || (typeof id !== "number" && typeof id !== "string")) return { user: null };
      const user = await payload.findByID({ collection: "users", id, depth: 0, overrideAccess: true });
      if (!user) return { user: null };
      return { user: { ...user, collection: "users", _strategy: "panel-jwt" } };
    } catch (error) {
      payload.logger.error({ msg: "Panel nie rozpoznał zalogowanego konta", err: error });
      return { user: null };
    }
  },
};
