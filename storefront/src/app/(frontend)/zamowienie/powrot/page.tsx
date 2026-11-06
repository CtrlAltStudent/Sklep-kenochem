import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { getCms } from "@/lib/cms";
import { getP24Transaction, p24Mode, verifyP24Transaction } from "@/integrations/przelewy24";
import { confirmKey } from "@/integrations/checkout/confirmKey";
import { markOrderPaid } from "@/integrations/checkout/markPaid";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";

export const metadata: Metadata = { title: "Potwierdzenie zamówienia", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ReturnPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const sessionId = typeof q.sessionId === "string" ? q.sessionId : "";
  const mock = q.mock === "1" || p24Mode() === "mock";

  if (sessionId) {
    const payload = await getCms();
    const found = await payload.find({
      collection: "orders",
      where: { "payment.sessionId": { equals: sessionId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const order = found.docs[0];
    if (order) {
      if (order.payment?.status !== "paid" && mock) {
        await markOrderPaid(payload, order.id);
      } else if (order.payment?.status !== "paid" && order.payment?.sessionId) {
        const trx = await getP24Transaction(order.payment.sessionId);
        const amountGrosze = Math.round(Number(order.total) * 100);
        const confirmed = Boolean(
          trx?.orderId && (trx.status === 2 || (trx.status === 1 && (await verifyP24Transaction(order.payment.sessionId, amountGrosze, trx.orderId)))),
        );
        if (confirmed) await markOrderPaid(payload, order.id, String(trx!.orderId));
      }
      if (order.orderNumber) redirect(`/zamowienie?nr=${encodeURIComponent(order.orderNumber)}&k=${confirmKey(order.orderNumber, order.id)}`);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="flex justify-center"><CheckoutSteps current={2} /></div>
      <Clock className="mx-auto mt-10 h-20 w-20 text-amber-500" />
      <h1 className="mt-6 text-3xl font-black">Czekamy na potwierdzenie płatności</h1>
      <p className="mt-2 text-slate-600">
        Jeśli zapłaciłeś, status zaktualizuje się za chwilę. W razie wątpliwości zadzwoń: 664 953 377.
      </p>
      <Link href="/" className="btn-kc mt-8 inline-block rounded-xl px-6 py-3.5 font-semibold text-white">Wróć do sklepu</Link>
    </div>
  );
}
