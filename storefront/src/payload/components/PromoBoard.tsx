"use client";

import { useEffect, useState } from "react";
import { BadgePercent } from "lucide-react";

type Sale = { price?: number | null; from?: string | null; to?: string | null };
type OnSale = { name: string; sku?: string | null; price?: number | null; sale?: Sale | null; slug: string };
type Cat = { slug: string; name: string };

const pl = (n: number) => n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " zł";
const day = (v?: string | null) => (v ? new Date(v).toLocaleDateString("pl-PL") : "od razu");

export function PromoBoard() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [onSale, setOnSale] = useState<OnSale[] | null>(null);
  const [percent, setPercent] = useState("10");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [category, setCategory] = useState("");
  const [lines, setLines] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);

  const load = () => {
    fetch("/api/promo-campaign", { credentials: "include" }).then((r) => r.json()).then((j) => {
      if (!j.ok) setMsg({ ok: false, message: j.message ?? "Brak uprawnień" });
      else { setCats(j.categories); setOnSale(j.onSale); }
    }).catch(() => setMsg({ ok: false, message: "Brak połączenia" }));
  };
  useEffect(load, []);

  const run = async (clear: boolean) => {
    if (!clear && !confirm(`Obniżyć cenę o ${percent}% na wybranych produktach? Cena regularna zostaje, przekreślona.`)) return;
    if (clear && !confirm("Zdjąć promocję z wybranych produktów? Wróci cena regularna.")) return;
    setBusy(clear ? "clear" : "go");
    const r = await fetch("/api/promo-campaign", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ percent: Number(percent), from, to, category, lines, clear }),
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
              <option value="">Wybrane kody</option>
              {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <label className="kc-set__field"><span>Kody albo pełne nazwy, po jednym w linii</span>
          <textarea rows={5} value={lines} onChange={(e) => setLines(e.target.value)} placeholder={"SON000123\nSONAX Auto Politura 250 ml"} />
        </label>
        <p className="kc-tool__note">
          {percent.trim() ? `Obniżka ${percent}%.` : "Podaj procent."}
          {from ? ` Start ${day(from)}.` : " Start od razu."}
          {to ? ` Koniec ${day(to)}.` : " Bez daty końca."}
          {catName ? ` Cała kategoria: ${catName}.` : ""}
        </p>
        <div className="kc-tool__actions">
          <button type="button" className="kc-btn kc-btn--lime" disabled={busy !== ""} onClick={() => run(false)}>{busy === "go" ? "Zapisuję…" : "Włącz promocję"}</button>
          <button type="button" className="kc-btn kc-btn--light" disabled={busy !== ""} onClick={() => run(true)}>{busy === "clear" ? "Zdejmuję…" : "Zdejmij z tej listy"}</button>
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
