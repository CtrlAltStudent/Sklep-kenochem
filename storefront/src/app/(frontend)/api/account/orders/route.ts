import { getCms } from "@/lib/cms";
import { currentCustomer, customerOrders } from "@/integrations/account";

export const dynamic = "force-dynamic";

// Historia zamówień zalogowanego klienta
export async function GET(request: Request) {
  const payload = await getCms();
  const c = await currentCustomer(payload, request.headers);
  if (!c) return Response.json({ ok: false, message: "Zaloguj się" }, { status: 401 });
  return Response.json({ ok: true, ...(await customerOrders(payload, c)) });
}
