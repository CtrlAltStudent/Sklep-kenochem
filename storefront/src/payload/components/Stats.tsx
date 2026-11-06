import Link from "next/link";
import { AlertTriangle, BarChart3, Compass, Eye, Footprints, Layers, MapPinOff, PackageX, Percent, Search, SearchX, ShoppingBag, Smartphone, Tag, Users } from "lucide-react";
import type { AdminViewServerProps } from "payload";
import type { Order } from "@/payload-types";
import { AdminPage } from "./AdminPage";
import { getProducts, getShopCategories } from "@/lib/catalog";
import type { Product } from "@/lib/data";
import { traffic, type Audience } from "@/lib/stats";
import { MarkOurBrowser } from "./MarkOurBrowser";
import { Bars, Delta } from "./Reports";

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

const pln = (n: number) => new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(n);
const percent = (part: number, all: number) => (all ? `${((part / all) * 100).toFixed(1).replace(".", ",")}%` : "—");

type GroupRow = { name: string; views: number; qty: number; value: number };
type Bucket = { label: string; short: string; views: number; people: number; orders: number; revenue: number };

// Ten sam wykres co w raportach sprzedaży (.kc-tl).
function Timeline({ buckets, value, detail, format, name }: { buckets: Bucket[]; value: (b: Bucket) => number; detail: (b: Bucket) => string; format: (n: number) => string; name: string }) {
  const max = Math.max(...buckets.map(value), 1);
  const every = Math.ceil(buckets.length / 8);
  return (
    <div className="kc-tl" role="img" aria-label={name}>
      <div className="kc-tl__plot">
        {[1, 0.5].map((f) => <span key={f} className="kc-tl__grid" style={{ bottom: `${f * 100}%` }}><em>{format(Math.round(max * f))}</em></span>)}
        {buckets.map((b, i) => (
          <div key={i} className="kc-tl__col" tabIndex={0}>
            <span className={`kc-tl__bar ${value(b) ? "" : "is-zero"}`} style={{ height: `${(value(b) / max) * 100}%` }} />
            <span className="kc-tl__tip"><b>{b.label}</b>{detail(b)}</span>
          </div>
        ))}
      </div>
      <div className="kc-tl__axis">{buckets.map((b, i) => <span key={i}>{i % every === 0 ? b.short : ""}</span>)}</div>
    </div>
  );
}

function SearchTable({ rows, empty }: { rows: { term: string; n: number; results: number }[]; empty: string }) {
  if (!rows.length) return <p className="kc-empty">{empty}</p>;
  return (
    <table className="kc-table">
      <thead><tr><th>Hasło</th><th className="is-num">Ile razy</th><th className="is-num">Znalezione</th></tr></thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.term}>
            <td><a href={`/szukaj?q=${encodeURIComponent(row.term)}`} target="_blank" rel="noreferrer">{row.term}</a></td>
            <td className="is-num">{int(row.n)}</td>
            <td className="is-num">{row.results ? int(row.results) : <span className="kc-pill kc-pill--amber">nic</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GroupTable({ rows, name }: { rows: GroupRow[]; name: string }) {
  if (!rows.length) return <p className="kc-empty">Brak danych w wybranym okresie.</p>;
  return (
    <table className="kc-table">
      <thead><tr><th>{name}</th><th className="is-num">Obejrzenia</th><th className="is-num">Sztuki</th><th className="is-num">Sprzedaż</th></tr></thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td>{row.name}</td>
            <td className="is-num">{int(row.views)}</td>
            <td className="is-num">{int(row.qty)}</td>
            <td className="is-num kc-strong">{pln(row.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
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
  const len = r.to.getTime() - r.from.getTime();
  const prevFrom = new Date(r.from.getTime() - len);
  const [flow, before, products, categories, orders, ordersBefore] = await Promise.all([
    Promise.resolve(traffic(r.from.getTime(), r.to.getTime(), who)),
    Promise.resolve(traffic(prevFrom.getTime(), r.from.getTime(), who)),
    getProducts(),
    getShopCategories(),
    payload.find({
      collection: "orders",
      depth: 0,
      limit: 0,
      pagination: false,
      overrideAccess: true,
      where: { and: [{ createdAt: { greater_than_equal: r.from.toISOString() } }, { createdAt: { less_than: r.to.toISOString() } }, { status: { not_equals: "cancelled" } }] },
    }),
    payload.count({
      collection: "orders",
      overrideAccess: true,
      where: { and: [{ createdAt: { greater_than_equal: prevFrom.toISOString() } }, { createdAt: { less_than: r.from.toISOString() } }, { status: { not_equals: "cancelled" } }] },
    }),
  ]);

  const nameOf = new Map<string, string>();
  const slugBySku = new Map<string, string>();
  const bySlug = new Map<string, { product: Product; stock: number }>();
  for (const p of products) {
    nameOf.set(p.slug, p.name);
    bySlug.set(p.slug, { product: p, stock: p.variants.find((v) => v.slug === p.slug)?.stock ?? p.stock });
    if (p.sku) slugBySku.set(p.sku, p.slug);
    for (const v of p.variants) {
      if (v.slug) {
        nameOf.set(v.slug, p.name);
        bySlug.set(v.slug, { product: p, stock: v.stock ?? p.stock });
      }
      if (v.sku) slugBySku.set(v.sku, v.slug || p.slug);
    }
  }
  const safeSlug = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };
  const label = (path: string) => {
    const slug = path.match(/^\/produkt\/([^/]+)$/)?.[1];
    if (slug) return nameOf.get(decodeURIComponent(slug)) ?? path;
    return KNOWN[path] ?? path;
  };

  // Kategorie i marki: obejrzenia produktów (kategoria także wejścia na jej stronę) oraz sprzedaż z zamówień.
  const topCategory = new Map<string, string>();
  for (const c of categories) {
    topCategory.set(c.slug, c.name);
    for (const s of c.children) topCategory.set(s.slug, c.name);
  }
  const catRows = new Map<string, GroupRow>();
  const brandRows = new Map<string, GroupRow>();
  const bump = (m: Map<string, GroupRow>, name: string | undefined, views: number, qty: number, value: number) => {
    if (!name) return;
    const row = m.get(name) ?? { name, views: 0, qty: 0, value: 0 };
    row.views += views; row.qty += qty; row.value += value;
    m.set(name, row);
  };
  const bumpProduct = (p: Product, views: number, qty: number, value: number) => {
    bump(catRows, topCategory.get(p.category), views, qty, value);
    bump(brandRows, p.brand?.trim() || undefined, views, qty, value);
  };
  for (const v of flow.allProductViews) {
    const hit = bySlug.get(safeSlug(v.slug));
    if (hit) bumpProduct(hit.product, v.views, 0, 0);
  }
  for (const v of flow.categoryViews) bump(catRows, topCategory.get(safeSlug(v.slug)), v.views, 0, 0);

  const sold = new Map<string, { name: string; qty: number; orders: number }>();
  for (const order of orders.docs as Order[]) {
    const seen = new Set<string>();
    for (const item of order.items ?? []) {
      const slug = (item.sku && slugBySku.get(item.sku)) || "";
      const key = slug || item.sku || item.name;
      const row = sold.get(key) ?? { name: (slug && nameOf.get(slug)) || item.name, qty: 0, orders: 0 };
      const qty = Number(item.quantity ?? 0);
      row.qty += qty;
      if (!seen.has(key)) { row.orders += 1; seen.add(key); }
      sold.set(key, row);
      const owner = slug ? bySlug.get(slug) : undefined;
      if (owner) bumpProduct(owner.product, 0, qty, Number(item.priceGross ?? 0) * qty);
    }
  }
  const bestGroups = (m: Map<string, GroupRow>) => [...m.values()].sort((a, b) => b.views - a.views || b.value - a.value).slice(0, 12);

  // Produkty, które ludzie oglądają, a których nie ma na stanie
  const noStock = flow.allProductViews
    .map((v) => ({ views: v.views, hit: bySlug.get(safeSlug(v.slug)) }))
    .filter((v): v is { views: number; hit: { product: Product; stock: number } } => Boolean(v.hit) && v.hit!.stock <= 0)
    .slice(0, 12);
  const noStockAll = flow.allProductViews.filter((v) => { const hit = bySlug.get(safeSlug(v.slug)); return hit && hit.stock <= 0; }).length;

  const searchFound = flow.searches.filter((s) => s.results > 0);
  const searchEmpty = flow.searches.filter((s) => s.results === 0);
  const buyRate = flow.people ? flow.boughtSessions / flow.people : 0;
  const buyRateBefore = before.people ? before.boughtSessions / before.people : 0;

  // Wykresy: dziennie, a przy dłuższym okresie tygodniowo (tak jak w raportach sprzedaży)
  const weekly = Math.round(len / DAY) > 45;
  const bucketOf = (d: Date) => dayKey(weekly ? new Date(startOfDay(d).getTime() - ((d.getDay() + 6) % 7) * DAY) : d);
  const buckets = new Map<string, Bucket>();
  for (let t = r.from.getTime(); t < r.to.getTime(); t += DAY) {
    const d = new Date(t);
    const key = bucketOf(d);
    if (buckets.has(key)) continue;
    buckets.set(key, {
      label: weekly ? `Tydzień od ${new Date(`${key}T12:00:00`).toLocaleDateString("pl-PL")}` : d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "long" }),
      short: new Date(`${key}T12:00:00`).toLocaleDateString("pl-PL", { day: "numeric", month: "numeric" }),
      views: 0, people: 0, orders: 0, revenue: 0,
    });
  }
  for (const d of flow.days) {
    const b = buckets.get(bucketOf(new Date(`${d.day}T12:00:00`)));
    if (b) { b.views += d.views; b.people += d.people; }
  }
  for (const o of orders.docs as Order[]) {
    const b = buckets.get(bucketOf(new Date(o.createdAt)));
    if (b) { b.orders += 1; b.revenue += Number(o.total ?? 0); }
  }
  const series = [...buckets.values()];
  const views = new Map(flow.products.map((p) => [p.slug, p.views]));
  const rows = [...new Set([...views.keys(), ...sold.keys()])].map((key) => ({
    key,
    name: nameOf.get(key) || sold.get(key)?.name || key,
    views: views.get(key) ?? 0,
    qty: sold.get(key)?.qty ?? 0,
    orders: sold.get(key)?.orders ?? 0,
  })).sort((a, b) => (b.views + b.qty * 3) - (a.views + a.qty * 3)).slice(0, 20);

  const kpis = [
    { label: "Wejścia na strony", value: int(flow.views), icon: Eye, tone: "green", delta: <Delta now={flow.views} before={before.views} />, sub: "każde otwarcie strony" },
    { label: "Różne osoby", value: int(flow.people), icon: Users, tone: "navy", delta: <Delta now={flow.people} before={before.people} />, sub: "różne przeglądarki" },
    { label: "Zamówienia", value: int(orders.docs.length), icon: ShoppingBag, tone: "lime", delta: <Delta now={orders.docs.length} before={ordersBefore.totalDocs} />, sub: "złożone w tym okresie, bez anulowanych" },
    { label: "Osoby, które kupiły", value: percent(flow.boughtSessions, flow.people), icon: Percent, tone: "green", delta: <Delta now={buyRate} before={buyRateBefore} />, sub: `${int(flow.boughtSessions)} z ${int(flow.people)} osób` },
    { label: "Wyszukiwania", value: int(flow.searchCount), icon: Search, tone: "navy", delta: null, sub: `różne hasła: ${int(flow.searches.length)}` },
    { label: "Hasła bez wyników", value: int(searchEmpty.length), icon: SearchX, tone: searchEmpty.length ? "amber" : "slate", delta: null, sub: "klient szukał i nic nie znalazł" },
    { label: "Oglądane, a bez stanu", value: int(noStockAll), icon: PackageX, tone: noStockAll ? "amber" : "slate", delta: null, sub: "produkty, których teraz brakuje" },
    { label: "Brakujące strony", value: int(flow.missing), icon: MapPinOff, tone: flow.missing ? "amber" : "slate", delta: <Delta now={flow.missing} before={before.missing} invert />, sub: "wejścia na adres, którego nie ma" },
  ];

  return (
    <AdminPage {...props}>
      <div className="kc-dash">
        <section className="kc-hero kc-hero--compact">
          <div>
            <p className="kc-hero__date">Statystyki sklepu</p>
            <h1 className="kc-hero__title">{r.label}</h1>
            <p className="kc-hero__text">Porównanie z okresem {prevFrom.toLocaleDateString("pl-PL")} – {new Date(r.from.getTime() - 1).toLocaleDateString("pl-PL")}. Wejścia, ścieżki i brakujące strony liczymy od włączenia tego ekranu, a zakupy bierzemy z zamówień, także starszych. Źródła wejść, urządzenia i hasła zbieramy od listopada 2026. „Bez nas” pomija ten komputer, na którym otwarto panel. <Link href="/admin/na-zywo">Zobacz, kto jest w sklepie teraz.</Link></p>
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
          {kpis.map(({ label: name, value, icon: Icon, tone, delta, sub }) => (
            <div key={name} className="kc-card kc-kpi">
              <span className={`kc-icon kc-icon--${tone}`}><Icon size={20} /></span>
              <span className="kc-kpi__value">{value}</span>
              <span className="kc-kpi__label">{name}</span>
              {delta}
              <span className="kc-kpi__sub">{sub}</span>
            </div>
          ))}
        </section>

        <section className="kc-grid kc-grid--2">
          <article className="kc-card">
            <header className="kc-card__head"><h2><BarChart3 size={18} /> Wejścia w czasie</h2><span className="kc-muted">{weekly ? "tygodniowo" : "dziennie"} · najedź na słupek</span></header>
            {flow.views ? <Timeline buckets={series} value={(b) => b.views} detail={(b) => `Wejścia: ${int(b.views)}${weekly ? "" : ` · osoby: ${int(b.people)}`}`} format={int} name="Wejścia w czasie" /> : <p className="kc-empty">Brak wejść w tym okresie.</p>}
          </article>
          <article className="kc-card">
            <header className="kc-card__head"><h2><ShoppingBag size={18} /> Zamówienia w czasie</h2><span className="kc-muted">{weekly ? "tygodniowo" : "dziennie"} · bez anulowanych</span></header>
            {orders.docs.length ? <Timeline buckets={series} value={(b) => b.orders} detail={(b) => `Zamówienia: ${int(b.orders)} · ${pln(b.revenue)}`} format={int} name="Zamówienia w czasie" /> : <p className="kc-empty">Brak zamówień w tym okresie.</p>}
          </article>
        </section>

        <section className="kc-grid kc-grid--2">
          <article className="kc-card">
            <header className="kc-card__head"><h2>Droga do zakupu</h2><span className="kc-muted">liczba osób · procent wszystkich</span></header>
            <Bars rows={flow.people ? [
              ["Weszło do sklepu", flow.people],
              ["Oglądało produkt", flow.productPeople],
              ["Weszło do koszyka", flow.carts],
              ["Doszło do zamówienia", flow.checkouts],
              ["Złożyło zamówienie", flow.boughtSessions],
            ].map(([name, n]) => ({ label: String(name), value: Number(n), extra: percent(Number(n), flow.people) })) : []} />
            {flow.checkouts > flow.boughtSessions && (
              <p className="kc-hero__text">Doszli do zamówienia, ale nie skończyli zakupu: {int(flow.checkouts - flow.boughtSessions)}.</p>
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

        <section className="kc-grid kc-grid--2">
          <article className="kc-card">
            <header className="kc-card__head"><h2><Compass size={18} /> Skąd przychodzą klienci</h2><span className="kc-muted">liczba osób</span></header>
            <Bars rows={flow.sources.map((s) => ({ label: s.label, value: s.n, extra: percent(s.n, flow.sources.reduce((sum, x) => sum + x.n, 0)) }))} />
          </article>
          <article className="kc-card">
            <header className="kc-card__head"><h2><Smartphone size={18} /> Telefon czy komputer</h2><span className="kc-muted">liczba osób</span></header>
            <Bars rows={flow.devices.map((s) => ({ label: s.label, value: s.n, extra: percent(s.n, flow.devices.reduce((sum, x) => sum + x.n, 0)) }))} />
          </article>
          <article className="kc-card">
            <header className="kc-card__head"><h2><Search size={18} /> Czego szukają klienci</h2><span className="kc-muted">hasła zatwierdzone w wyszukiwarce</span></header>
            <SearchTable rows={searchFound.slice(0, 12)} empty="Nikt jeszcze nie szukał w tym okresie." />
          </article>
          <article className="kc-card">
            <header className="kc-card__head"><h2><SearchX size={18} /> Szukali i nie znaleźli</h2><span className="kc-muted">dobre podpowiedzi do oferty i opisów</span></header>
            <SearchTable rows={searchEmpty.slice(0, 12)} empty="Na razie każde hasło coś znalazło." />
          </article>
          <article className="kc-card">
            <header className="kc-card__head"><h2><Layers size={18} /> Kategorie</h2><span className="kc-muted">obejrzenia i sprzedaż</span></header>
            <GroupTable rows={bestGroups(catRows)} name="Kategoria" />
          </article>
          <article className="kc-card">
            <header className="kc-card__head"><h2><Tag size={18} /> Marki</h2><span className="kc-muted">obejrzenia i sprzedaż</span></header>
            <GroupTable rows={bestGroups(brandRows)} name="Marka" />
          </article>
        </section>

        <article className="kc-card">
          <header className="kc-card__head"><h2><PackageX size={18} /> Oglądane, a bez stanu</h2><span className="kc-muted">stan z tej chwili, najczęściej oglądane w tym okresie</span></header>
          {noStock.length === 0 ? <p className="kc-empty">Żaden oglądany produkt nie jest teraz bez stanu.</p> : (
            <div className="kc-table-wrap">
              <table className="kc-table">
                <thead><tr><th>Produkt</th><th className="is-num">Obejrzany</th><th className="is-num">Stan</th></tr></thead>
                <tbody>
                  {noStock.map((row) => (
                    <tr key={row.hit.product.slug}>
                      <td><Link href={`/admin/collections/products/${row.hit.product.id}`}>{row.hit.product.name}</Link></td>
                      <td className="is-num">{int(row.views)}</td>
                      <td className="is-num"><span className="kc-pill kc-pill--amber">brak</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

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

        <section className="kc-grid kc-grid--2">
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
