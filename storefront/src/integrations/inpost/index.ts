// InPost: wyszukiwanie paczkomatu po kodzie (np. BIA01M) i token mapy (Geowidget).
// Token mapy: z panelu (Integracje → Połączenia) albo INPOST_GEOWIDGET_TOKEN w .env – tylko do widgetu.
// Szukanie punktu działa bez tokena (publiczne API InPost).

import type { PickupPoint } from "../pickup";
import { getKey } from "../vault";

const POINTS = "https://api-shipx-pl.easypack24.net/v1/points";

export const inpostWidgetToken = () => getKey("inpost.geowidgetToken");

export const inpostReady = () => Boolean(inpostWidgetToken());

export async function findInpostPoint(code: string): Promise<PickupPoint | null> {
  const name = code.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9]{3,10}$/.test(name)) return null;

  try {
    const res = await fetch(`${POINTS}/${encodeURIComponent(name)}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      name?: string;
      address?: { line1?: string; line2?: string; city?: string; post_code?: string };
      address_details?: { city?: string; post_code?: string; street?: string; building_number?: string };
    };
    if (!j.name) return null;
    const details = j.address_details;
    const street = details
      ? [details.street, details.building_number].filter(Boolean).join(" ")
      : [j.address?.line1, j.address?.line2].filter(Boolean).join(" ");
    return {
      carrier: "inpost",
      code: j.name,
      name: `Paczkomat ${j.name}`,
      address: street,
      postcode: details?.post_code ?? j.address?.post_code ?? "",
      city: details?.city ?? j.address?.city ?? "",
    };
  } catch {
    return null;
  }
}

// Test tokena Geowidget: to podpisany JWT – sprawdzamy, czy ma poprawny kształt i nie wygasł
export function testInpostToken(): { ok: boolean; message: string } {
  const token = inpostWidgetToken();
  if (!token) return { ok: false, message: "Brak tokena. Bez mapy klient wpisuje kod paczkomatu – to też działa." };
  try {
    const body = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")) as { exp?: number };
    if (body.exp && body.exp * 1000 < Date.now()) return { ok: false, message: `Token wygasł ${new Date(body.exp * 1000).toLocaleDateString("pl-PL")}. Wygeneruj nowy w manager.inpost.pl.` };
    return { ok: true, message: body.exp ? `Token poprawny, ważny do ${new Date(body.exp * 1000).toLocaleDateString("pl-PL")}.` : "Token poprawny." };
  } catch {
    return { ok: false, message: "To nie wygląda na token Geowidget (powinien mieć postać xxx.yyy.zzz)." };
  }
}
