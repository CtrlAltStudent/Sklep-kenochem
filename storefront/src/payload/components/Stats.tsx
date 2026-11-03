import Link from "next/link";
import { AlertTriangle, Eye, Footprints, MapPinOff, ShoppingBag, Users } from "lucide-react";
import type { AdminViewServerProps } from "payload";
import type { Order } from "@/payload-types";
import { AdminPage } from "./AdminPage";
import { getProducts } from "@/lib/catalog";
import { traffic, type Audience } from "@/lib/stats";
import { MarkOurBrowser } from "./MarkOurBrowser";

const DAY = 86_400_000;
const int = (n: number) => n.toLocaleString("pl-PL");
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const parseDay = (s: unknown) => (typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00`) : null);
const PRESETS: [string, string][] = [["dzis", "Dziś"], ["7", "7 dni"], ["30", "30 dni"], ["90", "90 dni"]];

const KNOWN: Record<string, string> = {
  "/": "Strona główna",
  "/koszyk": "Koszyk",
  "/zamowienie": "Zamówienie",
  "/szukaj": "Szukaj",
  "/kontakt": "Kontakt",
  "/konto": "Konto",
  "/promocje": "Promocje",
  "/nowosci": "Nowości",
  "/bestsellery": "Bestsellery",
  "/marki": "Marki",
};

const whoOf = (v: unknown): Audience => (v === "razem" || v === "my" ? v : "bez");
const VIEWS: [Audience, string][] = [["bez", "Bez nas"], ["razem", "Z nami"], ["my", "Tylko my"]];

function statsHref(okres: string, who: Audience, custom?: { od: string; do: string }) {
  const q = new URLSearchParams();
  if (custom) { q.set("od", custom.od); q.set("do", custom.do); }
  else q.set("okres", okres);
  if (who !== "bez") q.set("widok", who);
  return `/admin/statystyki?${q}`;
}

function range(sp: Record<string, unknown> | undefined) {
  const today = startOfDay(new Date());
  const od = parseDay(sp?.od), doo = parseDay(sp?.do);
  if (od && doo && od <= doo) return { from: od, to: new Date(doo.getTime() + DAY), key: "wlasny", label: `${od.toLocaleDateString("pl-PL")} – ${doo.toLocaleDateString("pl-PL")}` };
  const k = String(sp?.okres ?? "7");
  if (k === "dzis") return { from: today, to: new Date(today.getTime() + DAY), key: k, label: "Dziś" };
  const days = [7, 30, 90].includes(Number(k)) ? Number(k) : 7;
  return { from: new Date(today.getTime() - (days - 1) * DAY), to: new Date(today.getTime() + DAY), key: String(days), label: `Ostatnie ${days} dni` };
}

export async function Stats(props: AdminViewServerProps) {
  if (!props.initPageResult.req.user) {
    return (
      <AdminPage {...props}>
        <p className="kc-empty">Zaloguj się, aby zobaczyć statystyki sklepu.</p>
      </AdminPage>
    );
  }
  const sp = props.searchParams as Record<string, unknown> | undefined;
  const r = range(sp);
  const who = whoOf(sp?.widok);
  const { payload } = props.initPageResult.req;
  const [flow, products, orders] = await Promise.all([
    Promise.resolve(traffic(r.from.getTime(), r.to.getTime(), who)),
    getProducts(),
    payload.find({
      collection: "orders",
      depth: 0,
      limit: 0,
      pagination: false,
      overrideAccess: true,
      where: { and: [{ createdAt: { greater_than_equal: r.from.toISOString() } }, { createdAt: { less_than: r.to.toISOString() } }, { status: { not_equals: "cancelled" } }] },
    }),
  ]);

  const nameOf = new Map<string, string>();
  const slugBySku = new Map<string, string>();
  for (const p of products) {
    nameOf.set(p.slug, p.name);
    if (p.sku) slugBySku.set(p.sku, p.slug);
    for (const v of p.variants) {
      if (v.slug) nameOf.set(v.slug, p.name);
      if (v.sku) slugBySku.set(v.sku, v.slug || p.slug);
    }
  }
  const label = (path: string) => {
    const slug = path.match(/^\/produkt\/([^/]+)$/)?.[1];
    if (slug) return nameOf.get(decodeURIComponent(slug)) ?? path;
    return KNOWN[path] ?? path;
  };

  const sold = new Map<string, { name: string; qty: number; orders: number }>();
  for (const order of orders.docs as Order[]) {
    const seen = new Set<string>();
    for (const item of order.items ?? []) {
      const slug = (item.sku && slugBySku.get(item.sku)) || "";
      const key = slug || item.sku || item.name;
      const row = sold.get(key) ?? { name: (slug && nameOf.get(slug)) || item.name, qty: 0, orders: 0 };
      row.qty += Number(item.quantity ?? 0);
      if (!seen.has(key)) { row.orders += 1; seen.add(key); }
      sold.set(key, row);
    }
  }
  const views = new Map(flow.products.map((p) => [p.slug, p.views]));
  const rows = [...new Set([...views.keys(), ...sold.keys()])].map((key) => ({
    key,
    name: nameOf.get(key) || sold.get(key)?.name || key,
    views: views.get(key) ?? 0,
    qty: sold.get(key)?.qty ?? 0,
    orders: sold.get(key)?.orders ?? 0,
  })).sort((a, b) => (b.views + b.qty * 3) - (a.views + a.qty * 3)).slice(0, 20);

  const kpis = [
    { label: "Wejścia na strony", value: int(flow.views), icon: Eye, sub: "każde otwarcie strony" },
    { label: "Różne osoby", value: int(flow.people), icon: Users, sub: "osobne wizyty w przeglądarce" },
    { label: "Zamówienia", value: int(orders.docs.length), icon: ShoppingBag, sub: "złożone w tym okresie, bez anulowanych" },
    { label: "Brakujące strony", value: int(flow.missing), icon: MapPinOff, sub: "wejścia na adres, którego nie ma" },
  ];

  return (
    <AdminPage {...props}>
      <div className="kc-dash">
        <section className="kc-hero kc-hero--compact">
          <div>
            <p className="kc-hero__date">Statystyki sklepu</p>
            <h1 className="kc-hero__title">{r.label}</h1>
            <p className="kc-hero__text">Wejścia, ścieżki i brakujące strony liczymy od włączenia tego ekranu. Zakupy bierzemy z zamówień, także starszych. „Bez nas” pomija ten komputer, na którym otwarto panel.</p>
          </div>
        </section>
        <MarkOurBrowser />

        <section className="kc-card kc-period">
          <div className="kc-period__presets">
            {VIEWS.map(([k, l]) => <Link key={k} href={statsHref(r.key, k, r.key === "wlasny" ? { od: dayKey(r.from), do: dayKey(new Date(r.to.getTime() - DAY)) } : undefined)} className={`kc-chip ${who === k ? "is-active" : ""}`}>{l}</Link>)}
          </div>
        </section>

        <section className="kc-card kc-period">
          <div className="kc-period__presets">
            {PRESETS.map(([k, l]) => <Link key={k} href={statsHref(k, who)} className={`kc-chip ${r.key === k ? "is-active" : ""}`}>{l}</Link>)}
          </div>
          <form method="get" action="/admin/statystyki" className="kc-period__custom">
            {who !== "bez" && <input type="hidden" name="widok" value={who} />}
            <label>Od <input type="date" name="od" defaultValue={r.key === "wlasny" ? dayKey(r.from) : ""} required /></label>
            <label>do <input type="date" name="do" defaultValue={r.key === "wlasny" ? dayKey(new Date(r.to.getTime() - DAY)) : ""} required /></label>
            <button type="submit" className="kc-chip is-active">Pokaż</button>
          </form>
        </section>

        <section className="kc-kpis kc-kpis--4">
          {kpis.map(({ label: name, value, icon: Icon, sub }) => (
            <div key={name} className="kc-card kc-kpi">
              <span className="kc-icon kc-icon--green"><Icon size={20} /></span>
              <span className="kc-kpi__value">{value}</span>
              <span className="kc-kpi__label">{name}</span>
              <span className="kc-kpi__sub">{sub}</span>
            </div>
          ))}
        </section>

        <section className="kc-grid">
          <article className="kc-card">
            <header className="kc-card__head"><h2>Droga do zakupu</h2></header>
            <ul className="kc-hbars">
              {[
                ["Oglądał produkt", flow.products.reduce((s, p) => s + p.views, 0)],
                ["Wszedł do koszyka", flow.carts],
                ["Doszedł do zamówienia", flow.checkouts],
                ["Złożył zamówienie w tej wizycie", flow.boughtSessions],
              ].map(([name, n]) => (
                <li key={String(name)}>
                  <span className="kc-hbars__label">{name}</span>
                  <span className="kc-hbars__track"><span className="kc-hbars__fill" style={{ width: `${flow.views ? (Number(n) / Math.max(flow.views, 1)) * 100 : 0}%` }} /></span>
                  <span className="kc-hbars__value">{int(Number(n))}</span>
                </li>
              ))}
            </ul>
            {flow.checkouts > flow.boughtSessions && (
              <p className="kc-hero__text">{int(flow.checkouts - flow.boughtSessions)} wizyt doszło do zamówienia i nie skończyło się zakupem.</p>
            )}
          </article>

          <article className="kc-card">
            <header className="kc-card__head"><h2>Gdzie ludzie kończą</h2></header>
            {flow.exits.length === 0 ? <p className="kc-empty">Jeszcze nie ma wejść w tym okresie.</p> : (
              <ul className="kc-hbars">
                {flow.exits.map((e) => (
                  <li key={e.path}>
                    <span className="kc-hbars__label">{label(e.path)}</span>
                    <span className="kc-hbars__track"><span className="kc-hbars__fill" style={{ width: `${(e.n / flow.exits[0].n) * 100}%` }} /></span>
                    <span className="kc-hbars__value">{int(e.n)}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <article className="kc-card">
          <header className="kc-card__head"><h2>Produkty: obejrzane i kupione</h2></header>
          {rows.length === 0 ? <p className="kc-empty">W tym okresie nie było ani wejść na produkty, ani zamówień.</p> : (
            <table className="kc-table">
              <thead><tr><th>Produkt</th><th>Obejrzany</th><th>Kupiony (szt.)</th><th>W zamówieniach</th></tr></thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <td>{row.name}</td>
                    <td>{int(row.views)}</td>
                    <td>{int(row.qty)}</td>
                    <td>{int(row.orders)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <section className="kc-grid">
          <article className="kc-card">
            <header className="kc-card__head"><h2><AlertTriangle size={16} /> Możliwe problemy</h2></header>
            {flow.missingPages.length === 0 && flow.watchedNotBought.length === 0 ? (
              <p className="kc-empty">Na razie nic nie wymaga uwagi.</p>
            ) : (
              <ul className="kc-list">
                {flow.missingPages.slice(0, 8).map((m) => (
                  <li key={m.path}><b>{m.path}</b> — brak takiej strony, {int(m.n)} {m.n === 1 ? "wejście" : "wejść"}</li>
                ))}
                {flow.watchedNotBought.map((p) => (
                  <li key={p.slug}><b>{nameOf.get(p.slug) ?? p.slug}</b> — {int(p.views)} obejrzeń i zero zakupów w tych wizytach</li>
                ))}
              </ul>
            )}
          </article>
          <article className="kc-card">
            <header className="kc-card__head"><h2><MapPinOff size={16} /> Adresy, których nie ma</h2></header>
            {flow.missingPages.length === 0 ? <p className="kc-empty">Nikt nie trafił na nieistniejącą stronę.</p> : (
              <table className="kc-table">
                <thead><tr><th>Adres</th><th>Wejścia</th><th>Ostatnio</th></tr></thead>
                <tbody>
                  {flow.missingPages.map((m) => (
                    <tr key={m.path}><td>{m.path}</td><td>{int(m.n)}</td><td>{new Date(m.last).toLocaleString("pl-PL")}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </article>
        </section>

        <article className="kc-card">
          <header className="kc-card__head"><h2><Footprints size={16} /> Ostatnie ścieżki</h2></header>
          {flow.journeys.length === 0 ? <p className="kc-empty">Ścieżki pojawią się po pierwszych wejściach na sklep.</p> : (
            <ul className="kc-list">
              {flow.journeys.map((j) => (
                <li key={j.session}>
                  <b>{j.email ?? "Gość"}</b>
                  {j.bought ? " · kupił" : ""}
                  <small> · {new Date(j.at).toLocaleString("pl-PL")}</small>
                  <div>{j.steps.map(label).join(" → ") || "—"}</div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </AdminPage>
  );
}
