import Link from "next/link";
import type { AdminViewServerProps } from "payload";
import { BarChart3, Boxes, CreditCard, Mail, Receipt, RotateCcw, Star, TrendingUp, Truck, Wallet } from "lucide-react";
import { categories } from "@/lib/data";

const pln = (n: number) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(n);
const periods = [7, 30, 90, 365];

function since(days: number) {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  d.setHours(0, 0, 0, 0);
  return d;
}

function Bars({ rows, money }: { rows: { label: string; value: number }[]; money?: boolean }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (!rows.length) return <p className="kc-empty">Brak danych w wybranym okresie.</p>;
  return (
    <ul className="kc-hbars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="kc-hbars__label" title={r.label}>{r.label}</span>
          <span className="kc-hbars__track"><span className="kc-hbars__fill" style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="kc-hbars__value">{money ? pln(r.value) : r.value.toLocaleString("pl-PL")}</span>
        </li>
      ))}
    </ul>
  );
}

// Widok /admin/raporty – podsumowanie sprzedaży (zamówienia ze sklepu)
export async function Reports({ initPageResult, searchParams }: AdminViewServerProps) {
  const { payload } = initPageResult.req;
  const days = periods.includes(Number(searchParams?.okres)) ? Number(searchParams?.okres) : 30;
  const from = since(days);

  const [orders, store, returns, pendingReviews, subscribers] = await Promise.all([
    payload.find({
      collection: "orders", depth: 1, limit: 0, pagination: false, overrideAccess: true,
      where: { and: [{ createdAt: { greater_than_equal: from.toISOString() } }, { status: { not_equals: "cancelled" } }] },
    }),
    payload.findGlobal({ slug: "store-settings", overrideAccess: true }),
    payload.count({ collection: "returns", overrideAccess: true, where: { createdAt: { greater_than_equal: from.toISOString() } } }),
    payload.count({ collection: "reviews", overrideAccess: true, where: { status: { equals: "pending" } } }),
    payload.count({ collection: "newsletter", overrideAccess: true, where: { status: { equals: "subscribed" } } }),
  ]);

  const docs = orders.docs;
  const revenue = docs.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const avg = docs.length ? revenue / docs.length : 0;

  const products = new Map<string, number>();
  const cats = new Map<string, number>();
  const ship = new Map<string, number>();
  const pay = new Map<string, number>();
  const catName = new Map(categories.flatMap((c) => [[c.slug, c.name] as const, ...c.children.map((s) => [s.slug, c.name] as const)]));

  for (const o of docs) {
    for (const it of o.items ?? []) {
      const value = Number(it.priceGross) * Number(it.quantity);
      products.set(it.name, (products.get(it.name) ?? 0) + Number(it.quantity));
      const prod = typeof it.product === "object" ? it.product : null;
      const cat = prod?.category && typeof prod.category === "object" ? prod.category : null;
      const key = cat ? catName.get(cat.slug ?? "") ?? cat.name : "Bez kategorii";
      cats.set(key, (cats.get(key) ?? 0) + value);
    }
    const s = store.shippingMethods?.find((m) => m.code === o.shipping?.method)?.label ?? o.shipping?.method ?? "—";
    ship.set(s, (ship.get(s) ?? 0) + 1);
    const p = store.paymentMethods?.find((m) => m.code === o.payment?.method)?.label ?? o.payment?.method ?? "—";
    pay.set(p, (pay.get(p) ?? 0) + 1);
  }
  const top = (m: Map<string, number>, n = 8) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }));

  const kpis = [
    { label: "Przychód", value: pln(revenue), icon: Wallet, tone: "lime" },
    { label: "Zamówienia", value: docs.length.toLocaleString("pl-PL"), icon: Receipt, tone: "green" },
    { label: "Średnia wartość zamówienia", value: pln(avg), icon: TrendingUp, tone: "navy" },
    { label: "Zwroty i reklamacje", value: returns.totalDocs, icon: RotateCcw, tone: returns.totalDocs ? "amber" : "slate" },
  ];

  return (
    <div className="kc-dash">
      <section className="kc-hero kc-hero--compact">
        <div>
          <p className="kc-hero__date">Raporty</p>
          <h1 className="kc-hero__title">Sprzedaż – ostatnie {days} dni</h1>
          <p className="kc-hero__text">Od {from.toLocaleDateString("pl-PL")} · bez zamówień anulowanych</p>
        </div>
        <div className="kc-hero__actions">
          {periods.map((p) => (
            <Link key={p} href={`/admin/raporty?okres=${p}`} className={`kc-btn ${p === days ? "kc-btn--lime" : "kc-btn--light"}`}>{p === 365 ? "Rok" : `${p} dni`}</Link>
          ))}
        </div>
      </section>

      <section className="kc-kpis">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="kc-card kc-kpi">
            <span className={`kc-icon kc-icon--${tone}`}><Icon size={20} /></span>
            <span className="kc-kpi__value">{value}</span>
            <span className="kc-kpi__label">{label}</span>
          </div>
        ))}
      </section>

      <section className="kc-grid kc-grid--2">
        <div className="kc-card">
          <header className="kc-card__head"><h2><Boxes size={18} /> Najlepiej sprzedające się produkty</h2><span className="kc-muted">sztuki</span></header>
          <Bars rows={top(products)} />
        </div>
        <div className="kc-card">
          <header className="kc-card__head"><h2><BarChart3 size={18} /> Sprzedaż według kategorii</h2><span className="kc-muted">wartość brutto</span></header>
          <Bars rows={top(cats)} money />
        </div>
        <div className="kc-card">
          <header className="kc-card__head"><h2><Truck size={18} /> Metody dostawy</h2><span className="kc-muted">zamówienia</span></header>
          <Bars rows={top(ship)} />
        </div>
        <div className="kc-card">
          <header className="kc-card__head"><h2><CreditCard size={18} /> Metody płatności</h2><span className="kc-muted">zamówienia</span></header>
          <Bars rows={top(pay)} />
        </div>
      </section>

      <section className="kc-actions">
        <Link href="/admin/collections/reviews?where[status][equals]=pending" className="kc-card kc-action"><span className="kc-icon kc-icon--amber"><Star size={18} /></span>{pendingReviews.totalDocs} opinii do moderacji</Link>
        <Link href="/admin/collections/newsletter" className="kc-card kc-action"><span className="kc-icon kc-icon--green"><Mail size={18} /></span>{subscribers.totalDocs} subskrybentów newslettera</Link>
        <Link href="/admin/collections/returns" className="kc-card kc-action"><span className="kc-icon kc-icon--navy"><RotateCcw size={18} /></span>Zwroty i reklamacje</Link>
      </section>
    </div>
  );
}

// Link w menu bocznym (id „nav-reports” daje ikonę z nav-icons.scss)
export function ReportsNavLink() {
  return (
    <div className="kc-navextra">
      <span className="kc-navextra__label">Analiza</span>
      <Link href="/admin/raporty" id="nav-reports" className="nav__link">
        <span className="nav__link-label">Raporty sprzedaży</span>
      </Link>
    </div>
  );
}
