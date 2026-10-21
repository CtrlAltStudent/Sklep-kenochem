import { getCms } from "@/lib/cms";
import { verifyBlikNotify, type BlikNotify } from "@/integrations/przelewy24";
import { markBlikFailed } from "@/integrations/checkout/blik";

// Dodatkowe powiadomienie BLIK z Przelewy24 (urlCardPaymentNotification).
// Sukces obsługuje zwykłe powiadomienie /api/payments/p24/notify – tu tylko odrzucenie / wygaśnięcie kodu.
export async function POST(request: Request) {
  const raw = (await request.json().catch(() => null)) as { data?: BlikNotify } | BlikNotify | null;
  const b = (raw && "data" in raw && raw.data ? raw.data : raw) as BlikNotify | null;
  if (!b || !verifyBlikNotify(b)) return new Response("error", { status: 400 });
  if (b.result?.error && b.result.error !== "0" && b.sessionId) await markBlikFailed(await getCms(), b.sessionId);
  return new Response("OK");
}
