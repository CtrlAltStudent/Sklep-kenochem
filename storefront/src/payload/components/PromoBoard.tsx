"use client";

import { useEffect, useRef, useState } from "react";
import { BadgePercent, Search, Trash2 } from "lucide-react";

type Sale = { price?: number | null; from?: string | null; to?: string | null };
type OnSale = { name: string; sku?: string | null; price?: number | null; sale?: Sale | null; slug: string };
type Cat = { slug: string; name: string };

const pl = (n: number) => n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
const day = (v?: string | null) => (v ? new Date(v).toLocaleDateString("pl-PL") : "od razu");
type Hit = { id: number; name: string; sku: string; brand: string; price: number; thumb: string };

export function PromoBoard() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [onSale, setOnSale] = useState<OnSale[] | null>(null);
  const [percent, setPercent] = useState("10");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("");
  const [picked, setPicked] = useState<Hit[]>([]);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState("");
  const wait = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);

  const load = () => {
    fetch("/api/promo-campaign", { credentials: "include" }).then((r) => r.json()).then((j) => {
      if (!j.ok) setMsg({ ok: false, message: j.message ?? "Brak uprawnień" });
      else { setCats(j.categories); setOnSale(j.onSale); }
    }).catch(() => setMsg({ ok: false, message: "Brak połączenia" }));
  };
  useEffect(load, []);

  useEffect(() => {
    if (q.trim().length < 2) return;
    clearTimeout(wait.current);
    wait.current = setTimeout(() => {
      fetch(`/api/product-picker?q=${encodeURIComponent(q.trim())}`, { credentials: "include" })
        .then((r) => r.json())
        .then((j: { hits?: Hit[] }) => setHits(j.hits ?? []))
        .catch(() => setHits([]));
    }, 280);
    return () => clearTimeout(wait.current);
  }, [q]);

  const add = (hit: Hit) => {
    setPicked((cur) => (cur.some((p) => p.id === hit.id) ? cur : [...cur, hit]));
    setQ("");
    setHits(null);
  };

  const run = async (clear: boolean) => {
    if (!clear && !confirm(`Obniżyć cenę o ${percent}% na wybranych produktach? Cena regularna zostaje, przekreślona.`)) return;
    if (clear && !confirm("Zdjąć promocję z wybranych produktów? Wróci cena regularna.")) return;
    setBusy(clear ? "clear" : "go");
    const r = await fetch("/api/promo-campaign", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percent: Number(percent), from, to, category, productIds: picked.map((p) => p.id), clear }),
    }).then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    setBusy("");
    setMsg(r);
    if (r.ok) load();
  };

  const catName = cats.find((c) => c.slug === category)?.name;

  return (
    <div className="kc-dash kc-tool">
      <section className="kc-hero kc-hero--compact">
        <div>
          <p className="kc-hero__date">Marketing</p>
          <h1 className="kc-hero__title">Kampania promocyjna</h1>
          <p className="kc-hero__text">Obniża cenę wielu produktów naraz. Cena sprzed obniżki zostaje przekreślona. Po dacie końca sklep sam wraca do ceny zwykłej.</p>
        </div>
      </section>

      {msg && <p className={`kc-tool__banner ${msg.ok ? "is-ok" : "is-bad"}`}>{msg.message}</p>}

      <section className="kc-card">
        <header className="kc-card__head"><h2><BadgePercent size={16} /> Nowa obniżka</h2></header>
        <div className="kc-tool__fields">
          <label className="kc-set__field"><span>Obniżka</span>
            <input value={percent} onChange={(e) => setPercent(e.target.value)} inputMode="numeric" aria-label="Procent obniżki" />
          </label>
          <label className="kc-set__field"><span>Od</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="kc-set__field"><span>Do</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label className="kc-set__field"><span>Kategoria</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Wybrane produkty</option>
              {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <div className="kc-pick">
          {!!picked.length && (
            <ul className="kc-pick__list">
              {picked.map((row) => (
                <li key={row.id}>
                  <span className="kc-prod">
                    <span className="kc-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {row.thumb ? <img src={row.thumb} alt="" /> : <span className="kc-thumb__empty">—</span>}
                    </span>
                    <span className="kc-prod__text">
                      <span className="kc-prod__name">{row.name}</span>
                      <span className="kc-prod__meta">{[row.brand, row.sku && `SKU ${row.sku}`, pl(row.price)].filter(Boolean).join(" · ")}</span>
                    </span>
                  </span>
                  <span className="kc-pick__ops">
                    <button type="button" aria-label="Usuń z listy" onClick={() => setPicked(picked.filter((p) => p.id !== row.id))}><Trash2 size={14} /></button>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!picked.length && <p className="kc-pick__empty">Jeszcze nic nie wybrano. Możesz też wybrać całą kategorię.</p>}
          <div className="kc-var__add">
            <label>
              <Search size={14} />
              <input value={q} onChange={(e) => { setQ(e.target.value); if (e.target.value.trim().length < 2) setHits(null); }} placeholder="Szukaj produktu – nazwa, SKU albo EAN" aria-label="Szukaj produktu" />
            </label>
            {q.trim().length >= 2 && hits && (
              <ul className="kc-var__hits">
                {hits.length === 0 && <li className="is-empty">Nic nie znaleziono.</li>}
                {hits.map((h) => {
                  const taken = picked.some((p) => p.id === h.id);
                  return (
                    <li key={h.id}>
                      <button type="button" disabled={taken} onClick={() => add(h)}>
                        <span className="kc-thumb">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {h.thumb ? <img src={h.thumb} alt="" /> : <span className="kc-thumb__empty">—</span>}
                        </span>
                        <span>
                          <b>{h.name}</b>
                          <small>{[h.sku && `SKU ${h.sku}`, pl(h.price), taken ? "już na liście" : ""].filter(Boolean).join(" · ")}</small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        <p className="kc-tool__note">
          {percent.trim() ? `Obniżka ${percent}%.` : "Podaj procent."}
          {from ? ` Start ${day(from)}.` : " Start od razu."}
          {to ? ` Koniec ${day(to)}.` : " Bez daty końca."}
          {catName ? ` Cała kategoria: ${catName}.` : ""}
          {picked.length ? ` Wybrane produkty: ${picked.length}.` : ""}
        </p>
        <div className="kc-tool__actions">
          <button type="button" className="kc-btn kc-btn--lime" disabled={busy !== "" || (!category && !picked.length)} onClick={() => run(false)}>{busy === "go" ? "Zapisuję…" : "Włącz promocję"}</button>
          <button type="button" className="kc-btn kc-btn--light" disabled={busy !== "" || (!category && !picked.length)} onClick={() => run(true)}>{busy === "clear" ? "Zdejmuję…" : "Zdejmij z tej listy"}</button>
        </div>
      </section>

      <section className="kc-card">
        <header className="kc-card__head">
          <h2>Teraz w promocji</h2>
          {onSale && <span className="kc-muted">{onSale.length}</span>}
        </header>
        {onSale == null ? <p className="kc-empty">Wczytuję…</p> : onSale.length === 0 ? (
          <div className="kc-empty--big"><BadgePercent size={22} /><p>Żaden produkt nie ma obniżonej ceny.</p></div>
        ) : (
          <table className="kc-table">
            <thead><tr><th>Produkt</th><th>Było</th><th>Jest</th><th>Kiedy</th></tr></thead>
            <tbody>
              {onSale.map((p) => (
                <tr key={p.slug}>
                  <td>{p.name}{p.sku ? <span className="kc-sku">{p.sku}</span> : null}</td>
                  <td className="is-old">{p.price != null ? pl(p.price) : "—"}</td>
                  <td className="is-now">{p.sale?.price != null ? pl(p.sale.price) : "—"}</td>
                  <td>{day(p.sale?.from)} – {p.sale?.to ? day(p.sale.to) : "bez końca"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
