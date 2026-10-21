import { getCms } from "@/lib/cms";
import { checkoutInput, placeOrder } from "@/integrations/checkout/placeOrder";
import { currentCustomer } from "@/integrations/account";

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 8;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ ok: false, message: "Zbyt wiele prób. Spróbuj ponownie za kilka minut." }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Nieprawidłowe dane" }, { status: 400 });
  }

  const parsed = checkoutInput.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json({ ok: false, message: first?.message === "Required" ? "Uzupełnij wszystkie wymagane pola." : first?.message ?? "Popraw dane w formularzu." }, { status: 422 });
  }

  try {
    const payload = await getCms();
    const customer = await currentCustomer(payload, request.headers);
    const result = await placeOrder(payload, parsed.data, { ip, userAgent: request.headers.get("user-agent") ?? "" }, customer?.id);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (e) {
    console.error("checkout", e);
    return Response.json({ ok: false, message: "Nie udało się złożyć zamówienia. Spróbuj ponownie albo zadzwoń: 500 021 705." }, { status: 500 });
  }
}
