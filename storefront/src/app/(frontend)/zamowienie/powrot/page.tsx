import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { getCms } from "@/lib/cms";
import { getP24Transaction, p24Mode, verifyP24Transaction } from "@/integrations/przelewy24";
import { markOrderPaid } from "@/integrations/checkout/markPaid";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { PurchaseTrack } from "@/components/checkout/PurchaseTrack";

export const metadata: Metadata = { title: "Potwierdzenie zamówienia", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ReturnPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const sessionId = typeof q.sessionId === "string" ? q.sessionId : "";
  const mock = q.mock === "1" || p24Mode() === "mock";

  let orderNumber = "";
  let paid = false;
  let purchase: { transaction_id: string; value: number; shipping: number; items: { item_id: string; item_name: string; item_variant?: string; price: number; quantity: number }[] } | null = null;
  let buyer: { email?: string; phone?: string } = {};
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
      orderNumber = order.orderNumber ?? "";
      if (order.payment?.status === "paid") {
        paid = true;
      } else if (mock) {
        await markOrderPaid(payload, order.id);
        paid = true;
      } else if (order.payment?.sessionId) {
        const trx = await getP24Transaction(order.payment.sessionId);
        const amountGrosze = Math.round(Number(order.total) * 100);
        const confirmed = Boolean(
          trx?.orderId && (trx.status === 2 || (trx.status === 1 && (await verifyP24Transaction(order.payment.sessionId, amountGrosze, trx.orderId)))),
        );
        if (confirmed) {
          await markOrderPaid(payload, order.id, String(trx!.orderId));
          paid = true;
        }
      }
      if (paid) {
        buyer = { email: order.email ?? undefined, phone: order.phone ?? undefined };
        purchase = {
          transaction_id: orderNumber,
          value: Number(order.total),
          shipping: Number(order.shipping?.price ?? 0),
          items: (order.items ?? []).map((l) => ({
            item_id: l.sku || String(l.product ?? l.name),
            item_name: l.name,
            item_variant: l.variantLabel || undefined,
            price: Number(l.priceGross),
            quantity: l.quantity,
          })),
        };
      }
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {paid && purchase ? <PurchaseTrack data={purchase} email={buyer.email} phone={buyer.phone} /> : null}
      <div className="flex justify-center"><CheckoutSteps current={2} /></div>
      {paid ? (
        <>
          <CheckCircle2 className="mx-auto mt-10 h-20 w-20 text-leaf" />
          <h1 className="mt-6 text-3xl font-black">Dziękujemy za zamówienie!</h1>
          <p className="mt-2 text-slate-600">Numer zamówienia: <b>{orderNumber || "—"}</b>. Potwierdzenie wyślemy na podany e-mail.</p>
        </>
      ) : (
        <>
          <Clock className="mx-auto mt-10 h-20 w-20 text-amber-500" />
          <h1 className="mt-6 text-3xl font-black">Czekamy na potwierdzenie płatności</h1>
          <p className="mt-2 text-slate-600">
            {orderNumber ? <>Zamówienie <b>{orderNumber}</b> jest zapisane. </> : null}
            Jeśli zapłaciłeś, status zaktualizuje się za chwilę. W razie wątpliwości zadzwoń: 664 953 377.
          </p>
        </>
      )}
      <Link href="/" className="btn-kc mt-8 inline-block rounded-xl px-6 py-3.5 font-semibold text-white">Wróć do sklepu</Link>
    </div>
  );
}
