"use client";

// Ustawienia techniczne: indeksowanie, roboty AI, robots.txt, llms.txt, plik Google, przerwa techniczna, odświeżenie sklepu.
// Endpointy: GET/POST /api/site-settings, POST /api/site-tools/refresh (src/integrations/adminTools.ts).

import { useEffect, useState } from "react";
import { Bot, Construction, ExternalLink, FileCode2, Globe, RefreshCw, Save, Search, Server, ShoppingBag } from "lucide-react";
import type { SiteSettings } from "@/integrations/siteSettings";

type State = {
  settings: SiteSettings; base: string; indexable: boolean;
  stats: { products: number; inStock: number; withImages: number };
  server: { node: string; vault: string; scheduler: boolean; startedAt: string };
};

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="kc-set__toggle">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span className="kc-set__switch" />
      <span><b>{label}</b>{hint && <small>{hint}</small>}</span>
    </label>
  );
}

export function SiteSettingsPanel() {
  const [st, setSt] = useState<State | null>(null);
  const [s, setS] = useState<SiteSettings | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/site-settings", { credentials: "include" }).then((r) => r.json()).then((j) => { if (j.ok) { setSt(j); setS(j.settings); } else setMsg({ ok: false, message: j.message ?? "Brak uprawnień – tylko administrator." }); }).catch(() => setMsg({ ok: false, message: "Brak połączenia" }));
  }, []);
  if (!s || !st) return msg ? <p className="kc-act__msg is-bad">{msg.message}</p> : <p className="kc-muted">Wczytuję…</p>;

  const up = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS({ ...s, [k]: v });
  const save = async () => {
    if (s.maintenance && !st.settings.maintenance && !confirm("Włączyć przerwę techniczną? Klienci zobaczą komunikat zamiast sklepu (Ty – zalogowany do panelu – nadal widzisz sklep).")) return;
    if (s.indexing === "off" && st.settings.indexing !== "off" && !confirm("Wyłączyć indeksowanie? Sklep zacznie znikać z wyników Google.")) return;
    setBusy("save");
    const r = await fetch("/api/site-settings", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) }).then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    setBusy("");
    setMsg(r);
    if (r.ok) { setSt({ ...st, settings: r.settings, indexable: r.indexable }); setS(r.settings); }
  };
  const refresh = async () => {
    setBusy("refresh");
    const r = await fetch("/api/site-tools/refresh", { method: "POST", credentials: "include" }).then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    setBusy("");
    setMsg(r);
  };
  const dirty = JSON.stringify(s) !== JSON.stringify(st.settings);
  const files = [
    ["Mapa strony", "/sitemap.xml", st.indexable ? "dla Google i Bing – wszystkie produkty, kategorie, strony" : "pusta – indeksowanie wyłączone"],
    ["robots.txt", "/robots.txt", st.indexable ? "co roboty mogą czytać" : "blokuje całą stronę"],
    ["llms.txt", "/llms.txt", s.llmsEnabled ? "opis sklepu dla ChatGPT, Claude, Perplexity" : "wyłączony"],
    ["llms-full.txt", "/llms-full.txt", s.llmsEnabled ? `cały katalog (${st.stats.products} produktów)` : "wyłączony"],
    ["Plik Google Merchant", "/feed/google.xml", s.feedEnabled ? `${s.feedOutOfStock ? st.stats.withImages : st.stats.inStock} produktów dla Zakupów Google` : "wyłączony"],
  ];

  return (
    <div className="kc-set">
      <div className="kc-set__grid">
        <section className="kc-card">
          <header className="kc-card__head"><h2><Search size={18} /> Wyszukiwarki (Google, Bing)</h2>
            <span className={`kc-pill ${st.indexable ? "kc-pill--green" : "kc-pill--amber"}`}>{st.indexable ? "sklep widoczny" : "sklep ukryty"}</span></header>
          <div className="kc-set__radios">
            {([["auto", "Automatycznie", "Domena docelowa – widoczny, serwer testowy – ukryty (zalecane)"], ["on", "Zawsze widoczny", "Wymusza indeksowanie także na tym adresie"], ["off", "Ukryty", "Wyszukiwarki nie pokazują sklepu (noindex, robots blokuje wszystko)"]] as const).map(([v, l, h]) => (
              <label key={v} className={s.indexing === v ? "is-on" : ""}>
                <input type="radio" name="indexing" checked={s.indexing === v} onChange={() => up("indexing", v)} />
                <span><b>{l}</b><small>{h}</small></span>
              </label>
            ))}
          </div>
          <p className="kc-muted">Adres sklepu: <b>{st.base}</b>. Kod weryfikacji Search Console wpiszesz w Integracje → Google i marketing.</p>
          <label className="kc-set__field">
            <span>Dodatkowo zablokuj ścieżki (robots.txt) – po jednej w linii, zaczynając od „/”</span>
            <textarea rows={3} value={s.robotsExtra} onChange={(e) => up("robotsExtra", e.target.value)} placeholder="/stara-promocja&#10;/test" />
          </label>
        </section>

        <section className="kc-card">
          <header className="kc-card__head"><h2><Bot size={18} /> Asystenci AI (ChatGPT, Claude, Perplexity, Gemini)</h2></header>
          <Toggle on={s.aiBots} onChange={(v) => up("aiBots", v)} label="Pozwól robotom AI czytać sklep" hint="Wyłączenie blokuje m.in. GPTBot, ClaudeBot, PerplexityBot, Google-Extended – sklep rzadziej pojawi się w odpowiedziach AI." />
          <Toggle on={s.llmsEnabled} onChange={(v) => up("llmsEnabled", v)} label="Pliki llms.txt i llms-full.txt" hint="Opis sklepu i katalog w formacie dla AI – generowane automatycznie co godzinę." />
          <label className="kc-set__field">
            <span>Dodatkowy opis sklepu w llms.txt (opcjonalnie)</span>
            <textarea rows={4} value={s.llmsIntro} onChange={(e) => up("llmsIntro", e.target.value)} placeholder="Np. Jesteśmy autoryzowanym dystrybutorem SONAX od 1998 r. Doradzamy przy wyborze chemii do myjni…" />
          </label>
        </section>

        <section className="kc-card">
          <header className="kc-card__head"><h2><ShoppingBag size={18} /> Zakupy Google (Merchant Center)</h2></header>
          <Toggle on={s.feedEnabled} onChange={(v) => up("feedEnabled", v)} label="Plik produktów /feed/google.xml" hint="W Merchant Center: Produkty → Źródła danych → Plik zaplanowany z tym adresem." />
          <Toggle on={s.feedOutOfStock} onChange={(v) => up("feedOutOfStock", v)} label="Pokazuj też produkty niedostępne" hint="Jako „brak w magazynie” – Google nie wyświetla ich w reklamach, ale zachowuje historię produktu." />
        </section>

        <section className={`kc-card ${s.maintenance ? "kc-set__danger" : ""}`}>
          <header className="kc-card__head"><h2><Construction size={18} /> Przerwa techniczna</h2>
            {st.settings.maintenance && <span className="kc-pill kc-pill--amber">włączona</span>}</header>
          <Toggle on={s.maintenance} onChange={(v) => up("maintenance", v)} label="Wyłącz sklep dla klientów" hint="Klienci widzą komunikat (kod 503 – Google wie, że to chwilowe). Ty, zalogowany do panelu, widzisz sklep normalnie. Płatności i BaseLinker działają dalej." />
          <label className="kc-set__field">
            <span>Komunikat dla klientów</span>
            <textarea rows={2} value={s.maintenanceText} onChange={(e) => up("maintenanceText", e.target.value)} />
          </label>
        </section>
      </div>

      <div className="kc-set__bar">
        <button type="button" className="kc-msg__send" disabled={!dirty || busy === "save"} onClick={save}><Save size={15} /> {busy === "save" ? "Zapisuję…" : "Zapisz ustawienia"}</button>
        <button type="button" className="kc-act__btn" disabled={busy === "refresh"} onClick={refresh}><RefreshCw size={15} className={busy === "refresh" ? "kc-spin" : ""} /> Odśwież sklep teraz</button>
        {msg && <span className={`kc-act__msg ${msg.ok ? "is-ok" : "is-bad"}`}>{msg.message}</span>}
      </div>

      <div className="kc-set__grid">
        <section className="kc-card">
          <header className="kc-card__head"><h2><FileCode2 size={18} /> Pliki dla wyszukiwarek i AI</h2><span className="kc-muted">tworzone automatycznie</span></header>
          <ul className="kc-set__files">
            {files.map(([name, path, note]) => (
              <li key={path}>
                <span><b>{name}</b><small>{note}</small></span>
                <code>{path}</code>
                <a href={path} target="_blank" rel="noreferrer" className="kc-act__link">Otwórz <ExternalLink size={12} /></a>
              </li>
            ))}
          </ul>
        </section>
        <section className="kc-card">
          <header className="kc-card__head"><h2><Server size={18} /> Serwer</h2></header>
          <ul className="kc-set__files">
            <li><span><b>Produkty w sklepie</b><small>{st.stats.inStock} dostępnych · {st.stats.withImages} ze zdjęciem</small></span><code>{st.stats.products}</code></li>
            <li><span><b>Automatyczna synchronizacja</b><small>BaseLinker – stany, statusy, zamówienia</small></span><code>{st.server.scheduler ? "włączona" : "wyłączona"}</code></li>
            <li><span><b>Działa od</b><small>ostatnie uruchomienie sklepu (wgranie nowej wersji)</small></span><code>{new Date(st.server.startedAt).toLocaleString("pl-PL")}</code></li>
            <li><span><b>Stan sklepu</b><small>baza, płatności, poczta – dla monitoringu (UptimeRobot)</small></span><a href="/api/zdrowie" target="_blank" rel="noreferrer" className="kc-act__link">/api/zdrowie <ExternalLink size={12} /></a></li>
            <li><span><b>Wersja Node.js</b><small>plik ustawień: {st.server.vault}</small></span><code>{st.server.node}</code></li>
          </ul>
          <p className="kc-muted"><Globe size={12} /> Kopie zapasowe bazy: codziennie 3:30 na serwerze + pobranie na komputer w biurze (opis w Instrukcji).</p>
        </section>
      </div>
    </div>
  );
}
