import { redirect } from "next/navigation";
import { getCms } from "@/lib/cms";
import { currentCustomer } from "@/integrations/account";
import { cartRemindersOn, loadCart, removeCart, saveCart, validToken } from "@/integrations/carts";

export const dynamic = "force-dynamic";

// Koszyk zapisany za zgodą klienta (przypomnienie o porzuconym koszyku):
//   POST /api/cart { token, email, items, consent }   – zapis / usunięcie (consent: false albo pusty koszyk)
//   GET  /api/cart?token=…                            – pozycje do przywrócenia (link z maila → /koszyk?przywroc=…)
//   GET  /api/cart?token=…&wypisz=1                   – rezygnacja z przypomnień (link w mailu)

export async function POST(request: Request) {
  const b = ((await request.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  if (!validToken(b.token)) return Response.json({ ok: false }, { status: 400 });
  const payload = await getCms();
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 150);
  if (b.consent !== true || !cartRemindersOn()) {
    await removeCart(payload, b.token);
    return Response.json({ ok: true, saved: false });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ ok: false }, { status: 400 });
  const customer = await currentCustomer(payload, request.headers);
  await saveCart(payload, { token: b.token, email, items: b.items, customer: customer?.id });
  return Response.json({ ok: true, saved: true });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!validToken(token)) return Response.json({ ok: false }, { status: 400 });
  const payload = await getCms();
  if (url.searchParams.get("wypisz")) {
    await removeCart(payload, token);
    redirect("/koszyk?przypomnienia=wylaczone");
  }
  const items = await loadCart(payload, token);
  return Response.json(items ? { ok: true, items } : { ok: false });
}
