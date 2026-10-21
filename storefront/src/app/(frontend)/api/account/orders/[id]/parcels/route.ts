import { getCms } from "@/lib/cms";
import { currentCustomer } from "@/integrations/account";
import { blActive } from "@/integrations/baselinker/client";
import { orderPackages } from "@/integrations/baselinker/shipping";

export const dynamic = "force-dynamic";

// Przesyłki do zamówienia klienta (numery i linki do śledzenia z BaseLinkera)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getCms();
  const c = await currentCustomer(payload, request.headers);
  if (!c) return Response.json({ ok: false }, { status: 401 });
  const order = await payload.findByID({ collection: "orders", id, depth: 0, overrideAccess: true }).catch(() => null);
  const owner = order && (typeof order.customer === "object" ? order.customer?.id : order.customer);
  if (!order || owner !== c.id) return Response.json({ ok: false }, { status: 404 });
  if (!blActive() || !order.baselinker?.orderId) return Response.json({ ok: true, parcels: [] });
  try {
    const parcels = (await orderPackages(order.baselinker.orderId)).map((p) => ({ number: p.number, courier: p.courier, status: p.status, url: p.url }));
    return Response.json({ ok: true, parcels });
  } catch {
    return Response.json({ ok: true, parcels: [] });
  }
}
