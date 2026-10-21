import Link from "next/link";
import type { AdminViewServerProps } from "payload";
import {
  AlertTriangle, ArrowUpRight, Boxes, Briefcase, FilePlus2, ImageIcon, Inbox, LayoutTemplate, Mail, Newspaper, PackageX,
  PlugZap, Receipt, Settings, ShoppingBag, Store, TrendingUp, Wallet,
} from "lucide-react";
import { integrationMode } from "@/integrations/baselinker/client";

const pln = (n: number) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(n);
const day = 24 * 60 * 60 * 1000;

const orderStatus: Record<string, [string, string]> = {
  new: ["Nowe", "blue"], awaiting_payment: ["Czeka na płatność", "amber"], paid: ["Opłacone", "green"],
  processing: ["W realizacji", "violet"], shipped: ["Wysłane", "green"], cancelled: ["Anulowane", "gray"],
};

// Początek okna statystyk: północ N-1 dni temu
function windowStart(days: number) {
  const d = new Date(Date.now() - (days - 1) * day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function greeting() {
  const h = Number(new Intl.DateTimeFormat("pl-PL", { hour: "numeric", hour12: false, timeZone: "Europe/Warsaw" }).format(new Date()));
  return h < 12 ? "Dzień dobry" : h < 18 ? "Miłego popołudnia" : "Dobry wieczór";
}

// Pulpit panelu – zastępuje domyślny widok Payload (admin.components.views.dashboard)
export async function Dashboard({ initPageResult }: AdminViewServerProps) {
  const { payload, user } = initPageResult.req;
  const count = (collection: "orders" | "products" | "customers" | "form-submissions" | "stock-alerts" | "reviews" | "returns", where?: Record<string, unknown>) =>
    payload.count({ collection, where: where as never, overrideAccess: true }).then((r) => r.totalDocs).catch(() => 0);

  const since = windowStart(14);

  const [toHandle, blErrors, b2bPending, products, outOfStock, newMessages, recentOrders, latest, messages, logs, store, alertsReady, reviewsPending, returnsNew] = await Promise.all([
    count("orders", { status: { in: ["new", "paid", "awaiting_payment"] } }),
    count("orders", { "baselinker.syncStatus": { equals: "error" } }),
    count("customers", { "b2b.status": { equals: "pending" } }),
    count("products", { status: { equals: "active" } }),
    count("products", { and: [{ status: { equals: "active" } }, { stock: { less_than_equal: 0 } }] }),
    count("form-submissions", { status: { equals: "new" } }),
    payload.find({ collection: "orders", where: { createdAt: { greater_than_equal: since.toISOString() } }, limit: 0, pagination: false, depth: 0, overrideAccess: true, select: { total: true, createdAt: true, status: true } }),
    payload.find({ collection: "orders", limit: 6, depth: 0, sort: "-createdAt", overrideAccess: true, select: { orderNumber: true, email: true, total: true, status: true, createdAt: true, shipping: true } }),
    payload.find({ collection: "form-submissions", limit: 5, depth: 0, sort: "-createdAt", overrideAccess: true, select: { title: true, type: true, email: true, status: true, createdAt: true } }),
    payload.find({ collection: "integration-logs", limit: 4, depth: 0, sort: "-createdAt", overrideAccess: true, select: { message: true, status: true, createdAt: true } }),
    payload.findGlobal({ slug: "store-settings", overrideAccess: true }),
    count("stock-alerts", { status: { equals: "ready" } }),
    count("reviews", { status: { equals: "pending" } }),
    count("returns", { status: { equals: "new" } }),
  ]);
  const shipLabel = (code?: string | null) => store.shippingMethods?.find((m) => m.code === code)?.label ?? code ?? "—";

  // Wykres: zamówienia i przychód z ostatnich 14 dni
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since.getTime() + i * day);
    return { key: d.toDateString(), label: d.toLocaleDateString("pl-PL", { day: "numeric", month: "numeric" }), orders: 0, revenue: 0 };
  });
  for (const o of recentOrders.docs) {
    if (o.status === "cancelled") continue;
    const d = days.find((x) => x.key === new Date(o.createdAt).toDateString());
    if (d) { d.orders++; d.revenue += Number(o.total ?? 0); }
  }
  const revenue14 = days.reduce((s, d) => s + d.revenue, 0);
  const orders14 = days.reduce((s, d) => s + d.orders, 0);
  const maxRev = Math.max(...days.map((d) => d.revenue), 1);
  const mode = integrationMode();
  const name = (user as { name?: string } | null)?.name?.split(" ")[0];

  const kpis = [
    { label: "Zamówienia do obsługi", value: toHandle, icon: ShoppingBag, tone: "green", href: "/admin/collections/orders?where[status][in]=new,paid,awaiting_payment" },
    { label: "Przychód (14 dni)", value: pln(revenue14), icon: Wallet, tone: "lime", sub: `${orders14} zamówień`, href: "/admin/collections/orders" },
    { label: "Nowe wiadomości", value: newMessages, icon: Inbox, tone: newMessages ? "amber" : "slate", href: "/admin/collections/form-submissions?where[status][equals]=new" },
    { label: "Aktywne produkty", value: products.toLocaleString("pl-PL"), icon: Boxes, tone: "navy", sub: `${outOfStock} bez stanu`, href: "/admin/collections/products" },
  ];

  const alerts = [
    blErrors > 0 && { text: `${blErrors} zamówień nie trafiło do BaseLinkera`, href: "/admin/collections/orders?where[baselinker.syncStatus][equals]=error", icon: PlugZap, tone: "red" },
    b2bPending > 0 && { text: `${b2bPending} kont B2B czeka na weryfikację`, href: "/admin/collections/customers?where[b2b.status][equals]=pending", icon: Briefcase, tone: "amber" },
    alertsReady > 0 && { text: `${alertsReady} klientów czeka na wiadomość – produkt wrócił na stan`, href: "/admin/collections/stock-alerts?where[status][equals]=ready", icon: PackageX, tone: "red" },
    returnsNew > 0 && { text: `${returnsNew} nowych zwrotów / reklamacji`, href: "/admin/collections/returns?where[status][equals]=new", icon: AlertTriangle, tone: "amber" },
    reviewsPending > 0 && { text: `${reviewsPending} opinii czeka na moderację`, href: "/admin/collections/reviews?where[status][equals]=pending", icon: Inbox, tone: "amber" },
    outOfStock > 0 && { text: `${outOfStock} aktywnych produktów bez stanu magazynowego`, href: "/admin/collections/products?where[stock][less_than_equal]=0", icon: PackageX, tone: "amber" },
  ].filter(Boolean) as { text: string; href: string; icon: typeof PlugZap; tone: string }[];

  const actions = [
    { label: "Dodaj produkt", href: "/admin/collections/products/create", icon: FilePlus2 },
    { label: "Banery strony głównej", href: "/admin/globals/homepage", icon: ImageIcon },
    { label: "Nowa strona", href: "/admin/collections/pages/create", icon: LayoutTemplate },
    { label: "Wpis na blogu", href: "/admin/collections/posts/create", icon: Newspaper },
    { label: "Integracje i moduły", href: "/admin/integracje", icon: PlugZap },
    { label: "Ustawienia sklepu", href: "/admin/globals/store-settings", icon: Settings },
  ];

  return (
    <div className="kc-dash">
      <section className="kc-hero">
        <div>
          <p className="kc-hero__date">{new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <h1 className="kc-hero__title">{greeting()}{name ? `, ${name}` : ""} 👋</h1>
          <p className="kc-hero__text">Oto, co dzieje się dziś w sklepie Sonax.</p>
        </div>
        <div className="kc-hero__actions">
          <Link href="/" target="_blank" className="kc-btn kc-btn--light"><Store size={16} /> Otwórz sklep <ArrowUpRight size={14} /></Link>
          <Link href="/admin/collections/orders" className="kc-btn kc-btn--lime"><Receipt size={16} /> Zamówienia</Link>
        </div>
      </section>

      <section className="kc-kpis">
        {kpis.map(({ label, value, icon: Icon, tone, sub, href }) => (
          <Link key={label} href={href} className="kc-card kc-kpi">
            <span className={`kc-icon kc-icon--${tone}`}><Icon size={20} /></span>
            <span className="kc-kpi__value">{value}</span>
            <span className="kc-kpi__label">{label}</span>
            {sub && <span className="kc-kpi__sub">{sub}</span>}
          </Link>
        ))}
      </section>

      {alerts.length > 0 && (
        <section className="kc-alerts">
          {alerts.map(({ text, href, icon: Icon, tone }) => (
            <Link key={text} href={href} className={`kc-alert kc-alert--${tone}`}><Icon size={16} /> {text} <ArrowUpRight size={14} className="kc-alert__arrow" /></Link>
          ))}
        </section>
      )}

      <section className="kc-grid">
        <div className="kc-card kc-chart">
          <header className="kc-card__head">
            <h2><TrendingUp size={18} /> Sprzedaż – ostatnie 14 dni</h2>
            <span className="kc-muted">{orders14} zamówień · {pln(revenue14)}</span>
          </header>
          <div className="kc-bars">
            {days.map((d) => (
              <div key={d.key} className="kc-bar" title={`${d.label}: ${d.orders} zam., ${pln(d.revenue)}`}>
                <span className="kc-bar__fill" style={{ height: `${Math.max(4, (d.revenue / maxRev) * 100)}%`, opacity: d.revenue ? 1 : 0.25 }} />
                <span className="kc-bar__label">{d.label}</span>
              </div>
            ))}
          </div>
          {orders14 === 0 && <p className="kc-empty">Brak zamówień w tym okresie – wykres wypełni się po uruchomieniu sklepu.</p>}
        </div>

        <div className="kc-card">
          <header className="kc-card__head"><h2><PlugZap size={18} /> Integracje</h2></header>
          <div className={`kc-status kc-status--${mode}`}>
            <span className="kc-status__dot" />
            <div>
              <b>BaseLinker</b>
              <p>{mode === "live" ? "Połączony – tryb produkcyjny" : mode === "mock" ? "Tryb testowy (dane przykładowe)" : mode === "disabled" ? "Moduł wyłączony" : "Brak tokena – niepodłączony"}</p>
            </div>
            <Link href="/admin/integracje/baselinker" className="kc-link">Ustawienia</Link>
          </div>
          <ul className="kc-list kc-list--compact">
            {logs.docs.map((l) => (
              <li key={l.id}>
                <span className={`kc-dot kc-dot--${l.status}`} />
                <span className="kc-list__main">{l.message}</span>
                <span className="kc-muted">{new Date(l.createdAt).toLocaleString("pl-PL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </li>
            ))}
            {!logs.docs.length && <li className="kc-muted">Brak operacji w dzienniku.</li>}
          </ul>
        </div>

        <div className="kc-card kc-span-2">
          <header className="kc-card__head">
            <h2><Receipt size={18} /> Ostatnie zamówienia</h2>
            <Link href="/admin/collections/orders" className="kc-link">Wszystkie →</Link>
          </header>
          {latest.docs.length ? (
            <table className="kc-table">
              <thead><tr><th>Numer</th><th>Klient</th><th>Dostawa</th><th>Kwota</th><th>Status</th><th>Data</th></tr></thead>
              <tbody>
                {latest.docs.map((o) => {
                  const [label, tone] = orderStatus[o.status ?? "new"] ?? ["—", "gray"];
                  return (
                    <tr key={o.id}>
                      <td><Link href={`/admin/collections/orders/${o.id}`} className="kc-strong">{o.orderNumber}</Link></td>
                      <td>{o.shipping?.fullName || o.email}</td>
                      <td className="kc-muted">{shipLabel(o.shipping?.method)}</td>
                      <td className="kc-strong">{pln(Number(o.total ?? 0))}</td>
                      <td><span className={`kc-pill kc-pill--${tone}`}>{label}</span></td>
                      <td className="kc-muted">{new Date(o.createdAt).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="kc-empty kc-empty--big"><ShoppingBag size={28} /><p>Jeszcze nie ma zamówień. Pojawią się tutaj, gdy klienci zaczną kupować.</p></div>
          )}
        </div>

        <div className="kc-card">
          <header className="kc-card__head">
            <h2><Mail size={18} /> Wiadomości i zgłoszenia</h2>
            <Link href="/admin/collections/form-submissions" className="kc-link">Wszystkie →</Link>
          </header>
          <ul className="kc-list">
            {messages.docs.map((m) => (
              <li key={m.id}>
                <span className={`kc-icon kc-icon--sm kc-icon--${m.type === "b2b" ? "lime" : "navy"}`}>{m.type === "b2b" ? <Briefcase size={14} /> : <Mail size={14} />}</span>
                <Link href={`/admin/collections/form-submissions/${m.id}`} className="kc-list__main">
                  <b>{m.title}</b>
                  <span className="kc-muted">{m.email}</span>
                </Link>
                {m.status === "new" && <span className="kc-pill kc-pill--amber">nowe</span>}
              </li>
            ))}
            {!messages.docs.length && <li className="kc-muted">Brak wiadomości.</li>}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="kc-section-title">Szybkie akcje</h2>
        <div className="kc-actions">
          {actions.map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href} className="kc-card kc-action"><span className="kc-icon kc-icon--green"><Icon size={18} /></span>{label}</Link>
          ))}
        </div>
      </section>

      {outOfStock > 0 && <p className="kc-footnote"><AlertTriangle size={14} /> Produkty bez stanu są nadal widoczne w sklepie jako „na zamówienie”.</p>}
    </div>
  );
}
