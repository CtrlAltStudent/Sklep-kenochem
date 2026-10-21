// ORLEN Paczka: wyszukiwanie punktu odbioru po kodzie.
// Mapa (gdy będzie klucz): z panelu (Integracje → Połączenia) albo ORLEN_MAP_KEY w .env.
// Publiczne API punktów bywa niestabilne – jak nie znajdziemy punktu, i tak zapisujemy kod
// (BaseLinker potrzebuje delivery_point_id = kod punktu).

import type { PickupPoint } from "../pickup";
import { getKey } from "../vault";

export const orlenMapKey = () => getKey("orlen.mapKey");

export const orlenReady = () => Boolean(orlenMapKey());

const KNOWN: Record<string, PickupPoint> = {
  BIALYSTOK01: {
    carrier: "orlen",
    code: "BIALYSTOK01",
    name: "ORLEN Paczka – Białystok (punkt testowy)",
    address: "ul. Gen. Andersa 40",
    postcode: "15-113",
    city: "Białystok",
  },
};

export async function findOrlenPoint(code: string): Promise<PickupPoint | null> {
  const id = code.trim().toUpperCase().replace(/\s+/g, "");
  if (id.length < 3 || id.length > 20) return null;
  if (KNOWN[id]) return KNOWN[id];

  try {
    const res = await fetch(`https://mapa.orlenpaczka.pl/api/points/${encodeURIComponent(id)}`, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { carrier: "orlen", code: id, name: `ORLEN Paczka ${id}`, address: "", postcode: "", city: "" };
    const j = (await res.json()) as { id?: string; name?: string; street?: string; city?: string; postCode?: string; zip?: string };
    const codeOut = String(j.id ?? id);
    return {
      carrier: "orlen",
      code: codeOut,
      name: j.name ? String(j.name) : `ORLEN Paczka ${codeOut}`,
      address: String(j.street ?? ""),
      postcode: String(j.postCode ?? j.zip ?? ""),
      city: String(j.city ?? ""),
    };
  } catch {
    return { carrier: "orlen", code: id, name: `ORLEN Paczka ${id}`, address: "", postcode: "", city: "" };
  }
}
