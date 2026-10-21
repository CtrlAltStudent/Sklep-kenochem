import { findPickupPoint, type PickupCarrier } from "@/integrations/pickup";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const carrier = url.searchParams.get("carrier") as PickupCarrier | null;
  const code = url.searchParams.get("code") ?? "";
  if (carrier !== "inpost" && carrier !== "orlen") {
    return Response.json({ ok: false, message: "Nieznany przewoźnik" }, { status: 400 });
  }
  const point = await findPickupPoint(carrier, code);
  if (!point) return Response.json({ ok: false, message: "Nie znaleziono punktu o tym kodzie." }, { status: 404 });
  return Response.json({ ok: true, point });
}
