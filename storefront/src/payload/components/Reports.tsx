import Link from "next/link";
import { AdminPage } from "./AdminPage";
import type { AdminViewServerProps } from "payload";
import {
  ArrowDownRight, ArrowUpRight, BarChart3, Ban, Boxes, CalendarDays, Clock, CreditCard, Download, MapPin, Package, Receipt, RotateCcw, ShoppingBag,
  TrendingUp, Truck, UserPlus, Users, Wallet,
} from "lucide-react";
import { categories } from "@/lib/data";
import type { Order } from "@/payload-types";

// Widok /admin/raporty – sprzedaż w wybranym okresie z porównaniem do poprzedniego okresu tej samej długości.
// Okres: ?okres=dzis|7|30|90|365|miesiac|poprzedni albo własny zakres ?od=RRRR-MM-DD&do=RRRR-MM-DD.

const DAY = 86_400_000;
const pln = (n: number, digits = 0) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
const int = (n: number) => n.toLocaleString("pl-PL");
const pct = (part: number, all: number) => (all ? `${((part / all) * 100).toFixed(1).replace(".", ",")}%` : "—");
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
// ile dni wstecz sięga okres (eksport „ostatnie N dni”)
const daysSince = (d: Date) => Math.max(1, Math.ceil((Date.now() - d.getTime()) / DAY));
const parseDay = (s: unknown) => (typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00`) : null);

const PRESETS: [string, string][] = [["dzis", "Dziś"], ["7", "7 dni"], ["30", "30 dni"], ["90", "90 dni"], ["miesiac", "Ten miesiąc"], ["poprzedni", "Poprzedni miesiąc"], ["365", "Rok"]];
const ORDER_ST: Record<string, string> = { new: "Nowe", awaiting_payment: "Czeka na płatność", paid: "Opłacone", processing: "W realizacji", shipped: "Wysłane", cancelled: "Anulowane" };
const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

function range(sp: Record<string, unknown> | undefined) {
  const today = startOfDay(new Date());
  const od = parseDay(sp?.od), doo = parseDay(sp?.do);
  if (od && doo && od <= doo) return { from: od, to: new Date(doo.getTime() + DAY), key: "wlasny", label: `${od.toLocaleDateString("pl-PL")} – ${doo.toLocaleDateString("pl-PL")}` };
  const k = String(sp?.okres ?? "30");
  if (k === "dzis") return { from: today, to: new Date(today.getTime() + DAY), key: k, label: "Dziś" };
  if (k === "miesiac") return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: new Date(today.getTime() + DAY), key: k, label: today.toLocaleDateString("pl-PL", { month: "long", year: "numeric" }) };
  if (k === "poprzedni") {
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return { from, to: new Date(today.getFullYear(), today.getMonth(), 1), key: k, label: from.toLocaleDateString("pl-PL", { month: "long", year: "numeric" }) };
  }
  const days = [7, 30, 90, 365].includes(Number(k)) ? Number(k) : 30;
  return { from: new Date(today.getTime() - (days - 1) * DAY), to: new Date(today.getTime() + DAY), key: String(days), label: `Ostatnie ${days} dni` };
}

// Liczby z listy zamówień (bez anulowanych)
function summarize(orders: Order[]) {
  const valid = orders.filter((o) => o.status !== "cancelled");
  const revenue = valid.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const shipping = valid.reduce((s, o) => s + Number(o.shipping?.price ?? 0), 0);
  const net = valid.reduce((s, o) => s + (o.items ?? []).reduce((n, i) => n + (Number(i.priceGross) * Number(i.quantity)) / (1 + Number(i.vatRate ?? 23) / 100), 0) + Number(o.shipping?.price ?? 0) / 1.23, 0);
  const units = valid.reduce((s, o) => s + (o.items ?? []).reduce((n, i) => n + Number(i.quantity ?? 0), 0), 0);
  const paid = valid.filter((o) => o.payment?.status === "paid").reduce((s, o) => s + Number(o.total ?? 0), 0);
  const cancelled = orders.filter((o) => o.status === "cancelled");
  return {
    valid, revenue, shipping, net, units, paid, unpaid: revenue - paid, count: valid.length, avg: valid.length ? revenue / valid.length : 0,
    cancelledCount: cancelled.length, cancelledValue: cancelled.reduce((s, o) => s + Number(o.total ?? 0), 0),
  };
}

function Delta({ now, before, invert }: { now: number; before: number; invert?: boolean }) {
  if (!before && !now) return <span className="kc-delta">bez zmian</span>;
  if (!before) return <span className="kc-delta is-up">nowe</span>;
  const d = ((now - before) / before) * 100;
  const good = invert ? d <= 0 : d >= 0;
  const Icon = d >= 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={`kc-delta ${good ? "is-up" : "is-down"}`}><Icon size={13} /> {Math.abs(d).toFixed(0)}% <small>vs poprzedni okres</small></span>;
}

function Bars({ rows, money, sub }: { rows: { label: string; value: number; extra?: string }[]; money?: boolean; sub?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (!rows.length) return <p className="kc-empty">Brak danych w wybranym okresie.</p>;
  return (
    <ul className="kc-hbars">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${money ? pln(r.value, 2) : int(r.value)}${r.extra ? ` · ${r.extra}` : ""}`}>
          <span className="kc-hbars__label">{r.label}</span>
          <span className="kc-hbars__track"><span className="kc-hbars__fill" style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="kc-hbars__value">{money ? pln(r.value) : int(r.value)}{r.extra && <small> {r.extra}</small>}{sub && <small> {sub}</small>}</span>
        </li>
      ))}
    </ul>
  );
}

// Słupki przychodu w czasie: dzień / tydzień / miesiąc zależnie od długości okresu. Najechanie = szczegóły.
function Timeline({ buckets }: { buckets: { label: string; short: string; revenue: number; orders: number }[] }) {
  const max = Math.max(...buckets.map((b) => b.revenue), 1);
  const every = Math.ceil(buckets.length / 12);
  return (
    <div className="kc-tl" role="img" aria-label="Przychód w czasie">
      <div className="kc-tl__plot">
        {[1, 0.5].map((f) => <span key={f} className="kc-tl__grid" style={{ bottom: `${f * 100}%` }}><em>{pln(max * f)}</em></span>)}
        {buckets.map((b, i) => (
          <div key={i} className="kc-tl__col" tabIndex={0}>
            <span className={`kc-tl__bar ${b.revenue ? "" : "is-zero"}`} style={{ height: `${(b.revenue / max) * 100}%` }} />
            <span className="kc-tl__tip"><b>{b.label}</b>{pln(b.revenue, 2)}<br />{b.orders} {b.orders === 1 ? "zamówienie" : "zamówień"}</span>
          </div>
        ))}
      </div>
      <div className="kc-tl__axis">{buckets.map((b, i) => <span key={i}>{i % every === 0 ? b.short : ""}</span>)}</div>
    </div>
  );
}

export async function Reports(props: AdminViewServerProps) {
  const { initPageResult, searchParams } = props;
  const { payload } = initPageResult.req;
  const sp = searchParams as Record<string, unknown> | undefined;
  const r = range(sp);
  const len = r.to.getTime() - r.from.getTime();
  const prevFrom = new Date(r.from.getTime() - len);
  const inRange = (a: Date, b: Date) => ({ and: [{ createdAt: { greater_than_equal: a.toISOString() } }, { createdAt: { less_than: b.toISOString() } }] });

  const [cur, prev, earlier, store, returns, newCustomers, prevCustomers] = await Promise.all([
    payload.find({ collection: "orders", depth: 1, limit: 0, pagination: false, overrideAccess: true, where: inRange(r.from, r.to) }),
    payload.find({ collection: "orders", depth: 0, limit: 0, pagination: false, overrideAccess: true, where: inRange(prevFrom, r.from) }),
    payload.find({ collection: "orders", depth: 0, limit: 0, pagination: false, overrideAccess: true, where: { createdAt: { less_than: r.from.toISOString() } }, select: { email: true } }),
    payload.findGlobal({ slug: "store-settings", overrideAccess: true }),
    payload.count({ collection: "returns", overrideAccess: true, where: inRange(r.from, r.to) }),
    payload.count({ collection: "customers", overrideAccess: true, where: inRange(r.from, r.to) }),
    payload.count({ collection: "customers", overrideAccess: true, where: inRange(prevFrom, r.from) }),
  ]);

  const now = summarize(cur.docs);
  const before = summarize(prev.docs);
  const known = new Set(earlier.docs.map((o) => o.email?.toLowerCase()));

  // --- rozbicia
  const products = new Map<string, { name: string; id?: number; qty: number; value: number; stock?: number | null }>();
  const cats = new Map<string, number>();
  const ship = new Map<string, { n: number; v: number }>();
  const pay = new Map<string, { n: number; v: number }>();
  const cities = new Map<string, number>();
  const clients = new Map<string, { name: string; n: number; v: number }>();
  const weekday = Array(7).fill(0) as number[];
  const hours = Array(24).fill(0) as number[];
  const statuses = new Map<string, number>();
  let returning = 0, fresh = 0;
  const catName = new Map(categories.flatMap((c) => [[c.slug, c.name] as const, ...c.children.map((s) => [s.slug, c.name] as const)]));

  for (const o of cur.docs) statuses.set(ORDER_ST[o.status ?? ""] ?? o.status ?? "—", (statuses.get(ORDER_ST[o.status ?? ""] ?? o.status ?? "—") ?? 0) + 1);
  for (const o of now.valid) {
    const total = Number(o.total ?? 0);
    for (const it of o.items ?? []) {
      const value = Number(it.priceGross) * Number(it.quantity);
      const prod = typeof it.product === "object" && it.product ? it.product : null;
      const key = prod ? `p${prod.id}` : it.name;
      const row = products.get(key) ?? { name: it.name, id: prod?.id, qty: 0, value: 0, stock: prod?.stock };
      row.qty += Number(it.quantity); row.value += value;
      products.set(key, row);
      const cat = prod?.category && typeof prod.category === "object" ? prod.category : null;
      const ck = cat ? catName.get(cat.slug ?? "") ?? cat.name : "Bez kategorii";
      cats.set(ck, (cats.get(ck) ?? 0) + value);
    }
    const s = store.shippingMethods?.find((m) => m.code === o.shipping?.method)?.label ?? o.shipping?.method ?? "—";
    ship.set(s, { n: (ship.get(s)?.n ?? 0) + 1, v: (ship.get(s)?.v ?? 0) + total });
    const p = store.paymentMethods?.find((m) => m.code === o.payment?.method)?.label ?? o.payment?.method ?? "—";
    pay.set(p, { n: (pay.get(p)?.n ?? 0) + 1, v: (pay.get(p)?.v ?? 0) + total });
    const city = (o.shipping?.point?.city || o.shipping?.city || "").trim();
    if (city) { const c = city[0].toUpperCase() + city.slice(1).toLowerCase(); cities.set(c, (cities.get(c) ?? 0) + 1); }
    const email = (o.email ?? "").toLowerCase();
    const cl = clients.get(email) ?? { name: o.shipping?.fullName || email, n: 0, v: 0 };
    cl.n++; cl.v += total; clients.set(email, cl);
    const d = new Date(o.createdAt);
    weekday[(d.getDay() + 6) % 7]++;
    hours[d.getHours()]++;
  }
  for (const [email] of clients) if (known.has(email)) returning++; else fresh++;

  // --- oś czasu
  const days = Math.round(len / DAY);
  const unit: "day" | "week" | "month" = days <= 45 ? "day" : days <= 180 ? "week" : "month";
  const bucketOf = (d: Date) => {
    if (unit === "day") return dayKey(d);
    if (unit === "month") return `${d.getFullYear()}-${d.getMonth()}`;
    return dayKey(new Date(startOfDay(d).getTime() - ((d.getDay() + 6) % 7) * DAY));
  };
  const buckets = new Map<string, { label: string; short: string; revenue: number; orders: number }>();
  for (let t = r.from.getTime(); t < r.to.getTime(); t += DAY) {
    const d = new Date(t);
    const k = bucketOf(d);
    if (buckets.has(k)) continue;
    const label = unit === "day" ? d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "long" })
      : unit === "week" ? `Tydzień od ${new Date(startOfDay(d).getTime() - ((d.getDay() + 6) % 7) * DAY).toLocaleDateString("pl-PL")}`
      : d.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
    const short = unit === "month" ? d.toLocaleDateString("pl-PL", { month: "short" }) : d.toLocaleDateString("pl-PL", { day: "numeric", month: "numeric" });
    buckets.set(k, { label, short, revenue: 0, orders: 0 });
  }
  for (const o of now.valid) {
    const b = buckets.get(bucketOf(new Date(o.createdAt)));
    if (b) { b.revenue += Number(o.total ?? 0); b.orders++; }
  }

  const sortBy = <T,>(m: Map<string, T>, f: (v: T) => number, n = 8) => [...m.entries()].sort((a, b) => f(b[1]) - f(a[1])).slice(0, n);
  const topProducts = [...products.values()].sort((a, b) => b.value - a.value).slice(0, 15);
  const topClients = sortBy(clients, (c) => c.v, 10);
  const exportHref = `/api/export/orders?days=${daysSince(r.from)}`;

  const kpis = [
    { label: "Przychód brutto", value: pln(now.revenue), icon: Wallet, tone: "lime", delta: <Delta now={now.revenue} before={before.revenue} />, sub: `netto ${pln(now.net)} · w tym dostawa ${pln(now.shipping)}` },
    { label: "Zamówienia", value: int(now.count), icon: Receipt, tone: "green", delta: <Delta now={now.count} before={before.count} />, sub: `${int(now.units)} sprzedanych sztuk` },
    { label: "Średnia wartość koszyka", value: pln(now.avg, 2), icon: TrendingUp, tone: "navy", delta: <Delta now={now.avg} before={before.avg} />, sub: now.count ? `${(now.units / now.count).toFixed(1).replace(".", ",")} szt. na zamówienie` : "" },
    { label: "Opłacone / do zapłaty", value: pln(now.paid), icon: CreditCard, tone: "green", delta: null, sub: now.unpaid ? `czeka na wpłatę lub pobranie: ${pln(now.unpaid)}` : "wszystko opłacone" },
    { label: "Klienci kupujący", value: int(clients.size), icon: Users, tone: "navy", delta: null, sub: `${fresh} nowych · ${returning} powracających` },
    { label: "Nowe konta klientów", value: int(newCustomers.totalDocs), icon: UserPlus, tone: "green", delta: <Delta now={newCustomers.totalDocs} before={prevCustomers.totalDocs} />, sub: "" },
    { label: "Anulowane", value: int(now.cancelledCount), icon: Ban, tone: now.cancelledCount ? "amber" : "slate", delta: <Delta now={now.cancelledCount} before={before.cancelledCount} invert />, sub: now.cancelledValue ? `na kwotę ${pln(now.cancelledValue)}` : "" },
    { label: "Zwroty i reklamacje", value: int(returns.totalDocs), icon: RotateCcw, tone: returns.totalDocs ? "amber" : "slate", delta: null, sub: "" },
  ];

  return (
    <AdminPage {...props}>
    <div className="kc-dash">
      <section className="kc-hero kc-hero--compact">
        <div>
          <p className="kc-hero__date">Raporty sprzedaży</p>
          <h1 className="kc-hero__title">{r.label}</h1>
          <p className="kc-hero__text">{r.from.toLocaleDateString("pl-PL")} – {new Date(r.to.getTime() - 1).toLocaleDateString("pl-PL")} · porównanie z okresem {prevFrom.toLocaleDateString("pl-PL")} – {new Date(r.from.getTime() - 1).toLocaleDateString("pl-PL")} · bez anulowanych</p>
        </div>
        <a href={exportHref} className="kc-btn kc-btn--light"><Download size={15} /> Zamówienia do Excela</a>
      </section>

      <section className="kc-card kc-period">
        <div className="kc-period__presets">
          {PRESETS.map(([k, l]) => <Link key={k} href={`/admin/raporty?okres=${k}`} className={`kc-chip ${r.key === k ? "is-active" : ""}`}>{l}</Link>)}
        </div>
        <form method="get" action="/admin/raporty" className="kc-period__custom">
          <CalendarDays size={16} />
          <label>Od <input type="date" name="od" defaultValue={r.key === "wlasny" ? dayKey(r.from) : ""} required /></label>
          <label>do <input type="date" name="do" defaultValue={r.key === "wlasny" ? dayKey(new Date(r.to.getTime() - DAY)) : ""} required /></label>
          <button type="submit" className="kc-chip is-active">Pokaż</button>
        </form>
      </section>

      <section className="kc-kpis kc-kpis--4">
        {kpis.map(({ label, value, icon: Icon, tone, delta, sub }) => (
          <div key={label} className="kc-card kc-kpi">
            <span className={`kc-icon kc-icon--${tone}`}><Icon size={20} /></span>
            <span className="kc-kpi__value">{value}</span>
            <span className="kc-kpi__label">{label}</span>
            {delta}
            {sub && <span className="kc-kpi__sub">{sub}</span>}
          </div>
        ))}
      </section>

      <section className="kc-card">
        <header className="kc-card__head"><h2><BarChart3 size={18} /> Przychód w czasie</h2><span className="kc-muted">brutto, {unit === "day" ? "dziennie" : unit === "week" ? "tygodniowo" : "miesięcznie"} · najedź na słupek</span></header>
        {now.count ? <Timeline buckets={[...buckets.values()]} /> : <p className="kc-empty">Brak zamówień w wybranym okresie.</p>}
      </section>

      <section className="kc-card">
        <header className="kc-card__head"><h2><Boxes size={18} /> Produkty – sprzedaż</h2><span className="kc-muted">15 najlepszych wg wartości</span></header>
        {topProducts.length ? (
          <div className="kc-table-wrap">
            <table className="kc-table">
              <thead><tr><th>Produkt</th><th className="is-num">Sztuki</th><th className="is-num">Wartość brutto</th><th className="is-num">Udział</th><th className="is-num">Stan teraz</th></tr></thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.name + p.id}>
                    <td>{p.id ? <Link href={`/admin/collections/products/${p.id}`}>{p.name}</Link> : p.name}</td>
                    <td className="is-num">{int(p.qty)}</td>
                    <td className="is-num kc-strong">{pln(p.value, 2)}</td>
                    <td className="is-num">{pct(p.value, now.revenue - now.shipping)}</td>
                    <td className="is-num">{p.stock == null ? "—" : p.stock <= 0 ? <span className="kc-pill kc-pill--amber">brak</span> : p.stock <= 5 ? <span className="kc-pill kc-pill--amber">{p.stock} szt.</span> : `${p.stock} szt.`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="kc-empty">Brak danych w wybranym okresie.</p>}
      </section>

      <section className="kc-grid kc-grid--2">
        <div className="kc-card">
          <header className="kc-card__head"><h2><Package size={18} /> Sprzedaż według kategorii</h2><span className="kc-muted">wartość brutto</span></header>
          <Bars rows={sortBy(cats, (v) => v).map(([label, value]) => ({ label, value }))} money />
        </div>
        <div className="kc-card">
          <header className="kc-card__head"><h2><Users size={18} /> Najlepsi klienci</h2><span className="kc-muted">w wybranym okresie</span></header>
          {topClients.length ? (
            <table className="kc-table">
              <thead><tr><th>Klient</th><th className="is-num">Zam.</th><th className="is-num">Wartość</th></tr></thead>
              <tbody>
                {topClients.map(([email, c]) => (
                  <tr key={email}>
                    <td><Link href={`/admin/collections/orders?where[email][equals]=${encodeURIComponent(email)}`}>{c.name}</Link>{known.has(email) ? <span className="kc-pill kc-pill--green" style={{ marginLeft: 6 }}>powraca</span> : null}</td>
                    <td className="is-num">{c.n}</td>
                    <td className="is-num kc-strong">{pln(c.v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="kc-empty">Brak danych w wybranym okresie.</p>}
        </div>
        <div className="kc-card">
          <header className="kc-card__head"><h2><Truck size={18} /> Metody dostawy</h2><span className="kc-muted">zamówienia · udział</span></header>
          <Bars rows={sortBy(ship, (v) => v.n).map(([label, v]) => ({ label, value: v.n, extra: pct(v.n, now.count) }))} />
        </div>
        <div className="kc-card">
          <header className="kc-card__head"><h2><CreditCard size={18} /> Metody płatności</h2><span className="kc-muted">wartość brutto</span></header>
          <Bars rows={sortBy(pay, (v) => v.v).map(([label, v]) => ({ label, value: v.v, extra: `(${v.n} zam.)` }))} money />
        </div>
        <div className="kc-card">
          <header className="kc-card__head"><h2><CalendarDays size={18} /> Dni tygodnia</h2><span className="kc-muted">liczba zamówień</span></header>
          <Bars rows={WEEKDAYS.map((label, i) => ({ label, value: weekday[i] })).filter(() => now.count > 0)} />
        </div>
        <div className="kc-card">
          <header className="kc-card__head"><h2><Clock size={18} /> Pory dnia</h2><span className="kc-muted">liczba zamówień</span></header>
          <Bars rows={[[0, 6, "Noc (0–6)"], [6, 10, "Rano (6–10)"], [10, 14, "Przedpołudnie (10–14)"], [14, 18, "Popołudnie (14–18)"], [18, 22, "Wieczór (18–22)"], [22, 24, "Późny wieczór (22–24)"]]
            .map(([a, b, label]) => ({ label: String(label), value: hours.slice(Number(a), Number(b)).reduce((s, x) => s + x, 0) })).filter(() => now.count > 0)} />
        </div>
        <div className="kc-card">
          <header className="kc-card__head"><h2><MapPin size={18} /> Miasta</h2><span className="kc-muted">zamówienia</span></header>
          <Bars rows={sortBy(cities, (v) => v).map(([label, value]) => ({ label, value }))} />
        </div>
        <div className="kc-card">
          <header className="kc-card__head"><h2><ShoppingBag size={18} /> Statusy zamówień z okresu</h2><span className="kc-muted">łącznie z anulowanymi</span></header>
          <Bars rows={sortBy(statuses, (v) => v).map(([label, value]) => ({ label, value }))} />
        </div>
      </section>
    </div>
    </AdminPage>
  );
}
