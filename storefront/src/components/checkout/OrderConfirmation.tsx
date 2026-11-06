import Link from "next/link";
import { CheckCircle2, Clock, Landmark, Phone } from "lucide-react";
import { CopyButton } from "@/components/ClientBits";
import { ProductImage } from "@/components/ProductImage";
import { ClearCart } from "@/components/checkout/ClearCart";
import { PurchaseTrack } from "@/components/checkout/PurchaseTrack";
import { formatPrice, shopTel } from "@/lib/data";
import type { ConfirmOrder } from "@/integrations/checkout/confirmation";

const stepText = {
  paid: ["Zamówienie jest zapisane.", "Płatność przyjęta. Nie trzeba płacić drugi raz.", "Pakujemy paczkę. Gdy wyjdzie, przyjdzie mail z numerem przesyłki."],
  transfer: ["Zamówienie jest zapisane. Nie trzeba wypełniać formularza drugi raz.", "Zrób przelew na konto poniżej. W tytule wpisz numer zamówienia.", "Paczkę wyślemy, gdy pieniądze pojawią się na koncie. Potem przyjdzie mail z numerem przesyłki."],
  cod: ["Zamówienie jest zapisane.", "Zapłacisz przy odbiorze paczki. Nie rób przelewu.", "Gdy paczka wyjdzie, przyjdzie mail z numerem przesyłki."],
  online: ["Zamówienie jest zapisane.", "Płatność online jeszcze nie doszła. Jeśli bank nie pobrał pieniędzy, zadzwoń — dokończymy bez ponownego wypełniania.", "Po wpłacie pakujemy paczkę i wysyłamy numer przesyłki mailem."],
} as const;

export function OrderConfirmation({ order }: { order: ConfirmOrder }) {
  const steps = stepText[order.kind];
  const waiting = order.kind === "transfer" || order.kind === "online";
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <ClearCart />
      {order.kind === "paid" && (
        <PurchaseTrack
          email={order.email}
          data={{
            transaction_id: order.number,
            value: order.total,
            shipping: order.shipPrice,
            items: order.items.map((item) => ({ item_id: item.sku, item_name: item.name, item_variant: item.label || undefined, price: item.price, quantity: item.qty })),
          }}
        />
      )}
      <div className="rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:p-10">
        {waiting ? <Clock className="h-16 w-16 text-amber-500" /> : <CheckCircle2 className="h-16 w-16 text-leaf" />}
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Potwierdzenie zamówienia</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-navy sm:text-4xl">{waiting ? "Zamówienie przyjęte" : "Dziękujemy za zamówienie"}</h1>
        <p className="mt-3 text-lg text-slate-600">Numer zamówienia</p>
        <p className="font-mono text-4xl font-black tracking-wide text-brand-800 sm:text-5xl">{order.number}</p>
        <p className="mt-2 text-sm text-slate-500">{order.created} · potwierdzenie wysłaliśmy na {order.email}</p>

        <ol className="mt-8 grid gap-3 sm:grid-cols-3">
          {steps.map((text, i) => (
            <li key={text} className="rounded-2xl bg-brand-50 p-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-sm font-black text-white">{i + 1}</span>
              <p className="mt-3 text-sm leading-relaxed text-brand-900">{text}</p>
            </li>
          ))}
        </ol>

        {order.kind === "transfer" && (
          <section className="mt-8 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-amber-950"><Landmark className="h-6 w-6" /> Dane do przelewu</h2>
            <p className="mt-1 text-sm text-amber-900">W tytule przelewu wpisz sam numer zamówienia. Inaczej trudno połączyć wpłatę z tym zamówieniem.</p>
            <dl className="mt-4 space-y-3 text-base">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-amber-800">Odbiorca</dt>
                <dd className="font-semibold">{order.bank.recipient}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-amber-800">Bank</dt>
                <dd>{order.bank.bank} · SWIFT {order.bank.swift}</dd>
              </div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-amber-800">Numer konta</dt>
                  <dd className="font-mono text-xl font-black tracking-wide sm:text-2xl">{order.bank.account}</dd>
                </div>
                <CopyButton value={order.bank.accountCopy} label="Kopiuj numer konta" />
              </div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-amber-800">Kwota</dt>
                  <dd className="text-2xl font-black">{formatPrice(order.total)}</dd>
                </div>
                <CopyButton value={order.total.toFixed(2)} label="Kopiuj kwotę" />
              </div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-amber-800">Tytuł przelewu</dt>
                  <dd className="font-mono text-2xl font-black">{order.number}</dd>
                </div>
                <CopyButton value={order.number} label="Kopiuj tytuł" />
              </div>
            </dl>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-navy">Co zamówiono</h2>
          <ul className="mt-3 divide-y divide-brand-100">
            {order.items.map((item) => (
              <li key={`${item.name}-${item.label ?? ""}`} className="flex items-center gap-3 py-3">
                {item.image ? (
                  <ProductImage src={item.image} alt="" sizes="64px" className="h-16 w-16 rounded-xl bg-white object-contain ring-1 ring-brand-100" />
                ) : <span className="h-16 w-16 rounded-xl bg-brand-50 ring-1 ring-brand-100" />}
                <span className="min-w-0 flex-1">
                  <b className="block text-sm">{item.name}</b>
                  {item.label && <span className="text-xs text-slate-500">{item.label}</span>}
                  <span className="block text-xs text-slate-500">{item.qty} szt.</span>
                </span>
                <span className="font-bold whitespace-nowrap">{formatPrice(item.line)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-brand-100 pt-3 text-sm text-slate-600">
            <span>Dostawa · {order.shipLabel}</span>
            <span>{order.shipPrice > 0 ? formatPrice(order.shipPrice) : "gratis"}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-lg font-black">
            <span>Razem</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          <p className="mt-3 text-sm text-slate-600"><b className="text-navy">Dostawa:</b> {order.where}</p>
          <p className="mt-1 text-sm text-slate-600"><b className="text-navy">Płatność:</b> {order.payLabel}</p>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-50 p-4">
          <p className="flex items-center gap-2 text-sm text-brand-900"><Phone className="h-5 w-5 shrink-0" /> Pytanie o to zamówienie? Zadzwoń, podaj numer <b>{order.number}</b>.</p>
          <a href={shopTel(order.phone)} className="btn-kc rounded-xl px-5 py-3 font-semibold text-white">{order.phone}</a>
        </div>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-accent-dark hover:underline">Wróć do sklepu</Link>
      </div>
    </div>
  );
}
