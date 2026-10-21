import { redirect } from "next/navigation";
import { getCms } from "@/lib/cms";
import { claimOrders, claimToken, currentCustomer, customerOrders } from "@/integrations/account";
import { sendMail } from "@/integrations/mail/send";
import { claimOrders as claimMail, siteUrl, type Shop } from "@/integrations/mail/templates";

export const dynamic = "force-dynamic";

// Wysyła na adres konta link, który dołącza zamówienia złożone wcześniej bez logowania
export async function POST(request: Request) {
  const payload = await getCms();
  const c = await currentCustomer(payload, request.headers);
  if (!c) return Response.json({ ok: false, message: "Zaloguj się" }, { status: 401 });
  const { guestCount } = await customerOrders(payload, c);
  if (!guestCount) return Response.json({ ok: false, message: "Nie ma zamówień do dodania." });
  const store = await payload.findGlobal({ slug: "store-settings", overrideAccess: true });
  const url = `${siteUrl()}/api/account/claim?t=${encodeURIComponent(claimToken(c))}`;
  const r = await sendMail(payload, { to: c.email, ...claimMail(store as Shop, url, guestCount) });
  return Response.json(r.ok ? { ok: true, message: `Wysłaliśmy link na ${c.email}. Kliknij go, aby dodać zamówienia.` } : { ok: false, message: "Nie udało się wysłać maila. Spróbuj później albo zadzwoń do nas." });
}

// Kliknięcie linku z maila
export async function GET(request: Request) {
  const t = new URL(request.url).searchParams.get("t") ?? "";
  const n = await claimOrders(await getCms(), t);
  redirect(n == null ? "/konto?polaczono=blad" : `/konto?polaczono=${n}`);
}
