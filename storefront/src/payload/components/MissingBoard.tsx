"use client";

import { useEffect, useState } from "react";
import { Download, MapPinOff } from "lucide-react";

type Row = { path: string; n: number; last: number; hint?: string | null };

const when = (ts: number) => new Date(ts).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const times = (n: number) => (n === 1 ? "1 wejście" : `${n} wejść`);

export function MissingBoard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [uses, setUses] = useState<Row[]>([]);
  const [to, setTo] = useState<Record<string, string>>({});
  const [file, setFile] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState("");

  const load = () => {
    fetch("/api/missing-pages", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) setMsg({ ok: false, message: j.message ?? "Brak uprawnień" });
        else { setRows(j.rows); setUses(j.uses); }
      })
      .catch(() => setMsg({ ok: false, message: "Brak połączenia" }));
  };
  useEffect(load, []);

  const add = async (from: string) => {
    const target = (to[from] || "").trim();
    if (!target) { setMsg({ ok: false, message: "Wpisz nowy adres, na przykład /kategoria/chemia-samochodowa" }); return; }
    setBusy(from);
    const r = await fetch("/api/redirect-tools", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from, to: target }) }).then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    setBusy("");
    setMsg(r.ok ? { ok: true, message: `Gotowe: ${from} prowadzi teraz do ${target}.` } : r);
    if (r.ok) load();
  };
  const hide = async (path: string) => {
    setBusy(path);
    const r = await fetch("/api/missing-pages/hide", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) }).then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    setBusy("");
    setMsg(r);
    if (r.ok) load();
  };
  const upload = async () => {
    setBusy("file");
    const r = await fetch("/api/redirect-tools/import", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: file }) }).then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    setBusy("");
    setMsg(r);
    if (r.ok) setFile("");
  };

  const hits = rows?.reduce((s, r) => s + r.n, 0) ?? 0;

  return (
    <div className="kc-dash kc-tool">
      <section className="kc-hero kc-hero--compact">
        <div>
          <p className="kc-hero__date">Google i klienci</p>
          <h1 className="kc-hero__title">Brakujące strony</h1>
          <p className="kc-hero__text">Adresy, które ktoś otworzył, a sklep odpowiedział „nie ma takiej strony”. Im wyżej, tym częściej ludzie tam trafiają.</p>
        </div>
        <div className="kc-hero__actions">
          {/* Pobranie pliku, nie przejście na inną stronę */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="kc-btn kc-btn--light" href="/api/redirect-tools/export"><Download size={14} /> Pobierz listę przekierowań</a>
        </div>
      </section>

      {msg && <p className={`kc-tool__banner ${msg.ok ? "is-ok" : "is-bad"}`}>{msg.message}</p>}

      <section className="kc-kpis">
        <article className="kc-card kc-kpi"><span className="kc-kpi__value">{rows ? rows.length.toLocaleString("pl-PL") : "…"}</span><span className="kc-kpi__label">Adresy bez strony</span></article>
        <article className="kc-card kc-kpi"><span className="kc-kpi__value">{rows ? hits.toLocaleString("pl-PL") : "…"}</span><span className="kc-kpi__label">Wejścia na nie</span></article>
        <article className="kc-card kc-kpi"><span className="kc-kpi__value">{uses.length.toLocaleString("pl-PL")}</span><span className="kc-kpi__label">Przekierowania, które zadziałały</span></article>
      </section>

      <section className="kc-card">
        <header className="kc-card__head"><h2><MapPinOff size={16} /> Odwiedzone adresy</h2></header>
        {rows == null ? <p className="kc-empty">Wczytuję…</p> : rows.length === 0 ? (
          <div className="kc-empty--big"><MapPinOff size={22} /><p>Jeszcze nikt nie trafił na brakującą stronę. Lista zapełni się sama.</p></div>
        ) : (
          <table className="kc-table">
            <thead><tr><th>Adres</th><th>Wejścia</th><th>Ostatnio</th><th>Dokąd przenieść</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.path}>
                  <td>{r.path}</td>
                  <td>{times(r.n)}</td>
                  <td>{when(r.last)}</td>
                  <td>
                    <div className="kc-tool__go">
                      <input value={to[r.path] ?? ""} placeholder="/kategoria/…" aria-label={`Nowy adres dla ${r.path}`} onChange={(e) => setTo({ ...to, [r.path]: e.target.value })} />
                      <button type="button" className="kc-btn kc-btn--lime" disabled={busy === r.path} onClick={() => add(r.path)}>{busy === r.path ? "Zapisuję…" : "Dodaj"}</button>
                      <button type="button" className="kc-btn kc-btn--light" disabled={busy === r.path} title="Schowaj, jeśli ten adres nie jest ważny" onClick={() => hide(r.path)}>Schowaj</button>
                    </div>
                    {r.hint && !to[r.path] && (
                      <button type="button" className="kc-tool__hint" onClick={() => setTo({ ...to, [r.path]: r.hint! })}>Podobny produkt: {r.hint}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="kc-card">
        <header className="kc-card__head"><h2>Wgraj listę z Excela</h2></header>
        <p className="kc-tool__note">Dwie kolumny oddzielone średnikiem: stary adres i nowy adres. Adres, który wraca do siebie, zostanie pominięty.</p>
        <label className="kc-set__field">
          <span>Wklej wiersze</span>
          <textarea rows={5} value={file} onChange={(e) => setFile(e.target.value)} placeholder={"/stary-adres;/kategoria/nowy"} />
        </label>
        <div className="kc-tool__actions">
          <button type="button" className="kc-btn kc-btn--lime" disabled={busy === "file" || !file.trim()} onClick={upload}>{busy === "file" ? "Wgrywam…" : "Wgraj listę"}</button>
        </div>
      </section>

      {uses.length > 0 && (
        <section className="kc-card">
          <header className="kc-card__head"><h2>Które przekierowania ktoś naprawdę otworzył</h2></header>
          <table className="kc-table">
            <thead><tr><th>Stary adres</th><th>Wejścia</th><th>Ostatnio</th></tr></thead>
            <tbody>
              {uses.map((r) => <tr key={r.path}><td>{r.path}</td><td>{times(r.n)}</td><td>{when(r.last)}</td></tr>)}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
