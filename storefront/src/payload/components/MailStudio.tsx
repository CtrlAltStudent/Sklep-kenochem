"use client";

// Konfigurator maili (Marketing → Maile do klientów): po lewej lista maili, w środku treść albo kod HTML,
// po prawej podgląd na żywo na prawdziwym zamówieniu (komputer / telefon / wersja tekstowa) i wysyłka testowa.
// Domyślne treści: src/integrations/mail/catalog.ts, zapis i podgląd: src/integrations/mail/studio.ts.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Code2, Monitor, Palette, RotateCcw, Save, Send, Smartphone, Type, FileText, Clock } from "lucide-react";
import { DEFAULT_FRAME, FRAME_VARS, MAILS, mailDef, mailEnabled, type MailDef, type MailId, type MailOverride, type MailSettings } from "@/integrations/mail/catalog";

type OrderRow = { id: number; number: string; status: string; total: number };
type Preview = { subject: string; html: string; text: string };
type Sel = MailId | "_brand";
type Field = "subject" | "title" | "lead" | "button" | "body" | "frame" | "footer";

const GROUPS = ["Zamówienia", "Przypomnienia", "Konto klienta", "Obsługa klienta", "Do sklepu"] as const;
const api = (path: string, body?: unknown) =>
  fetch(`/api/mail-studio${path}`, { method: body ? "POST" : "GET", credentials: "include", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined })
    .then((r) => r.json())
    .catch(() => ({ ok: false, message: "Brak połączenia" }));

function Toggle({ on, onChange, label, hint, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  return (
    <label className="kc-set__toggle" style={disabled ? { opacity: 0.6, cursor: "default" } : undefined}>
      <input type="checkbox" checked={on} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="kc-set__switch" />
      <span><b>{label}</b>{hint && <small>{hint}</small>}</span>
    </label>
  );
}

// Pole edycji z miejscem na kursor – zmienne wstawiamy tam, gdzie ostatnio pisał właściciel
function Input({ field, value, placeholder, onChange, onFocus, rows, code }: {
  field: Field; value: string; placeholder: string; onChange: (v: string) => void; onFocus: (f: Field, el: HTMLInputElement | HTMLTextAreaElement) => void; rows?: number; code?: boolean;
}) {
  const common = {
    value, placeholder, spellCheck: !code,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onFocus(field, e.target),
  };
  if (!rows) return <input type="text" className="kc-mail__input" {...common} />;
  return (
    <textarea
      className={`kc-mail__input ${code ? "is-code" : ""}`} rows={rows} {...common}
      onKeyDown={code ? (e) => {
        if (e.key !== "Tab") return;
        e.preventDefault();
        const t = e.currentTarget;
        const { selectionStart: a, selectionEnd: b } = t;
        onChange(`${t.value.slice(0, a)}  ${t.value.slice(b)}`);
        requestAnimationFrame(() => t.setSelectionRange(a + 2, a + 2));
      } : undefined}
    />
  );
}

function Vars({ vars, onInsert }: { vars: [string, string][]; onInsert: (name: string) => void }) {
  return (
    <div className="kc-mail__vars">
      <span>Zmienne – kliknij, aby wstawić w miejscu kursora:</span>
      <div>{vars.map(([k, d]) => <button type="button" key={k} title={d} onClick={() => onInsert(k)}>{`{{${k}}}`}<small>{d}</small></button>)}</div>
    </div>
  );
}

export function MailStudio() {
  const [settings, setSettings] = useState<MailSettings | null>(null);
  const [saved, setSaved] = useState("");
  const [sel, setSel] = useState<Sel>("order-placed");
  const [tab, setTab] = useState<"content" | "code">("content");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderId, setOrderId] = useState<number | "">("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewErr, setPreviewErr] = useState("");
  const [device, setDevice] = useState<"desktop" | "mobile" | "text">("desktop");
  const [testTo, setTestTo] = useState("");
  const [ready, setReady] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const focus = useRef<{ field: Field; el: HTMLInputElement | HTMLTextAreaElement } | null>(null);

  useEffect(() => {
    api("").then((j) => {
      if (!j.ok) return setMsg({ ok: false, message: j.message ?? "Brak uprawnień" });
      setSettings(j.settings);
      setSaved(JSON.stringify(j.settings));
      setOrders(j.orders ?? []);
      setTestTo(j.testTo ?? "");
      setReady(Boolean(j.ready));
    });
  }, []);

  const dirty = useMemo(() => settings != null && JSON.stringify(settings) !== saved, [settings, saved]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Podgląd na żywo: chwilę po ostatniej zmianie
  const previewId: MailId = sel === "_brand" ? "order-placed" : sel;
  useEffect(() => {
    if (!settings) return;
    const t = setTimeout(() => {
      api("/preview", { id: previewId, settings, orderId: orderId || undefined }).then((j) => {
        if (j.ok) { setPreview({ subject: j.subject, html: j.html, text: j.text }); setPreviewErr(""); } else setPreviewErr(j.message ?? "Błąd podglądu");
      });
    }, 350);
    return () => clearTimeout(t);
  }, [settings, previewId, orderId]);

  const def = sel === "_brand" ? null : mailDef(sel)!;
  const over: MailOverride = (def && settings?.templates[def.id]) || {};
  const setOver = useCallback((id: MailId, patch: Partial<MailOverride>) => {
    setSettings((s) => s && { ...s, templates: { ...s.templates, [id]: { ...s.templates[id], ...patch } } });
    setMsg(null);
  }, []);
  const setBrand = (patch: Partial<MailSettings["brand"]>) => { setSettings((s) => s && { ...s, brand: { ...s.brand, ...patch } }); setMsg(null); };

  if (!settings) return msg ? <p className="kc-act__msg is-bad">{msg.message}</p> : <p className="kc-muted">Wczytuję maile…</p>;

  // Wartość pola: zapisana zmiana albo treść domyślna (pokazujemy ją od razu – łatwiej poprawić niż pisać od zera)
  const val = (d: MailDef, f: "subject" | "title" | "lead" | "button" | "body") => over[f] ?? d[f] ?? "";
  const change = (f: Field, v: string) => {
    if (f === "frame" || f === "footer") return setBrand({ [f]: v });
    if (def) setOver(def.id, { [f]: v });
  };
  const insert = (name: string) => {
    const cur = focus.current;
    const token = `{{${name}}}`;
    if (!cur || !document.body.contains(cur.el)) {
      setMsg({ ok: false, message: "Najpierw kliknij w pole, do którego chcesz wstawić zmienną" });
      return;
    }
    const { el, field } = cur;
    const a = el.selectionStart ?? el.value.length;
    const b = el.selectionEnd ?? a;
    change(field, `${el.value.slice(0, a)}${token}${el.value.slice(b)}`);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + token.length, a + token.length); });
  };
  const onFocus = (field: Field, el: HTMLInputElement | HTMLTextAreaElement) => { focus.current = { field, el }; };

  const save = async () => {
    setBusy("save");
    const r = await api("", { settings });
    setBusy("");
    setMsg(r);
    if (r.ok) { setSettings(r.settings); setSaved(JSON.stringify(r.settings)); }
  };
  const test = async () => {
    setBusy("test");
    setMsg(await api("/test", { id: previewId, settings, orderId: orderId || undefined, to: testTo }));
    setBusy("");
  };
  const resetMail = () => {
    if (sel === "_brand") {
      if (confirm("Przywrócić domyślny wygląd i kod ramki wszystkich maili?")) setSettings({ ...settings, brand: { accent: "#d32e2e", header: "#15191e", background: "#eef0f2", logo: "", footer: "", perks: true, frame: "" } });
    } else if (def && confirm(`Przywrócić domyślną treść maila „${def.label}”?`)) {
      const rest = { ...settings.templates };
      const enabled = rest[def.id]?.enabled;
      delete rest[def.id];
      if (enabled !== undefined) rest[def.id] = { enabled };
      setSettings({ ...settings, templates: rest });
    }
  };
  const changed = (d: MailDef) => {
    const o = settings.templates[d.id];
    return Boolean(o && (["subject", "title", "lead", "button", "body"] as const).some((k) => o[k] != null && o[k] !== d[k]));
  };

  return (
    <div className="kc-mail">
      {!ready && <p className="kc-mail__warn">Poczta jest wyłączona albo nieskonfigurowana – maile nie wychodzą. Ustawisz ją w <Link href="/admin/integracje/poczta">Integracje → Poczta</Link>. Podgląd działa normalnie.</p>}
      <div className="kc-mail__grid">
        {/* Lista maili */}
        <nav className="kc-card kc-mail__list">
          <button type="button" className={`kc-mail__item is-brand ${sel === "_brand" ? "is-active" : ""}`} onClick={() => setSel("_brand")}>
            <Palette size={16} /><span><b>Wygląd wszystkich maili</b><small>Kolory, logo, stopka, kod ramki</small></span>
          </button>
          {GROUPS.map((g) => (
            <div key={g} className="kc-mail__group">
              <h4>{g}</h4>
              {MAILS.filter((m) => m.group === g && !m.hidden).map((m) => {
                const on = mailEnabled(settings, m.id);
                return (
                  <button type="button" key={m.id} className={`kc-mail__item ${sel === m.id ? "is-active" : ""} ${on ? "" : "is-off"}`} onClick={() => setSel(m.id)}>
                    <i className={`kc-mail__dot ${on ? "is-on" : ""}`} title={on ? "Wysyłany" : "Wyłączony"} />
                    <span><b>{m.label}</b>{changed(m) && <em>zmieniony</em>}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Edycja */}
        <section className="kc-card kc-mail__edit">
          {def ? (
            <>
              <header className="kc-mail__head">
                <div><h2>{def.label}</h2><p className="kc-muted">{def.when}</p></div>
                <Toggle on={mailEnabled(settings, def.id)} disabled={def.locked} onChange={(v) => setOver(def.id, { enabled: v })}
                  label={mailEnabled(settings, def.id) ? "Wysyłany" : "Wyłączony"} hint={def.locked ? "Ten mail jest potrzebny do działania sklepu" : undefined} />
              </header>
              {def.id === "review-request" && (
                <label className="kc-mail__auto"><Clock size={15} /> Wyślij
                  <input type="number" min={1} max={60} value={settings.review.days} onChange={(e) => setSettings({ ...settings, review: { days: Number(e.target.value) } })} />
                  dni po zmianie statusu na „Wysłane”.</label>
              )}
              {def.id === "cart-reminder" && (
                <label className="kc-mail__auto"><Clock size={15} /> Przypomnij
                  <input type="number" min={1} max={72} value={settings.cart.hours} onChange={(e) => setSettings({ ...settings, cart: { hours: Number(e.target.value) } })} />
                  godz. po ostatniej zmianie koszyka. Lista koszyków: <Link href="/admin/collections/carts">Sprzedaż → Porzucone koszyki</Link>.</label>
              )}
              <nav className="kc-lay__tabs-nav kc-mail__tabs">
                <button type="button" className={tab === "content" ? "is-active" : ""} onClick={() => setTab("content")}><Type size={15} /> Treść</button>
                <button type="button" className={tab === "code" ? "is-active" : ""} onClick={() => setTab("code")}><Code2 size={15} /> Kod HTML</button>
              </nav>
              {tab === "content" ? (
                <div className="kc-mail__fields">
                  <label><span>Temat maila</span><Input field="subject" value={val(def, "subject")} placeholder={def.subject} onChange={(v) => change("subject", v)} onFocus={onFocus} /></label>
                  <label><span>Nagłówek w treści</span><Input field="title" value={val(def, "title")} placeholder={def.title} onChange={(v) => change("title", v)} onFocus={onFocus} /></label>
                  <label><span>Tekst wstępu {"{{wstep}}"}</span><Input field="lead" rows={5} value={val(def, "lead")} placeholder={def.lead || "(bez wstępu)"} onChange={(v) => change("lead", v)} onFocus={onFocus} /></label>
                  {def.button != null && <label><span>Napis na przycisku</span><Input field="button" value={val(def, "button")} placeholder={def.button} onChange={(v) => change("button", v)} onFocus={onFocus} /></label>}
                  <p className="kc-muted kc-mail__hint">Fragment w <code>{"{{#nazwa}}…{{/nazwa}}"}</code> pokaże się tylko wtedy, gdy warunek jest spełniony, a w <code>{"{{^nazwa}}…{{/nazwa}}"}</code> – gdy nie jest. Puste pole = tekst domyślny.</p>
                </div>
              ) : (
                <div className="kc-mail__fields">
                  <label><span>Kod HTML treści maila (wewnątrz ramki z logo i stopką)</span>
                    <Input field="body" code rows={18} value={val(def, "body")} placeholder={def.body} onChange={(v) => change("body", v)} onFocus={onFocus} /></label>
                  <p className="kc-muted kc-mail__hint">Maile czyta Gmail, Outlook i telefon – używaj tabel i stylów w atrybucie <code>style</code> (bez osobnych arkuszy CSS i skryptów). Bloki takie jak <code>{"{{produkty}}"}</code> sklep wstawi sam.</p>
                </div>
              )}
              <Vars vars={def.vars} onInsert={insert} />
            </>
          ) : (
            <>
              <header className="kc-mail__head"><div><h2>Wygląd wszystkich maili</h2><p className="kc-muted">Wspólna ramka: pasek z logo, kolory, atuty sklepu i stopka z danymi firmy (z Ustawień sklepu).</p></div></header>
              <div className="kc-mail__colors">
                {([["accent", "Kolor główny (przyciski, akcenty)"], ["header", "Pasek z logo"], ["background", "Tło wokół maila"]] as const).map(([k, l]) => (
                  <label key={k}><input type="color" value={settings.brand[k]} onChange={(e) => setBrand({ [k]: e.target.value })} /><span>{l}<small>{settings.brand[k]}</small></span></label>
                ))}
              </div>
              <div className="kc-mail__fields">
                <label><span>Adres logo (puste = logo sklepu SONAX). Wgraj obraz w Media i wklej jego adres.</span>
                  <input type="text" className="kc-mail__input" value={settings.brand.logo} placeholder="https://…/logo.png" onChange={(e) => setBrand({ logo: e.target.value })} /></label>
                <label><span>Dodatkowy tekst w stopce (np. NIP, numer BDO)</span>
                  <Input field="footer" value={settings.brand.footer} placeholder="np. NIP 5423224790" onChange={(v) => change("footer", v)} onFocus={onFocus} /></label>
                <Toggle on={settings.brand.perks} onChange={(v) => setBrand({ perks: v })} label="Pasek atutów sklepu" hint="Wysyłka w 24 h · 14 dni na zwrot · Oryginalne produkty SONAX" />
                <details className="kc-mail__frame" open={Boolean(settings.brand.frame)}>
                  <summary><Code2 size={15} /> Kod HTML ramki (dla zaawansowanych)</summary>
                  <Input field="frame" code rows={18} value={settings.brand.frame || DEFAULT_FRAME} placeholder="" onChange={(v) => change("frame", v === DEFAULT_FRAME ? "" : v)} onFocus={onFocus} />
                  <Vars vars={FRAME_VARS} onInsert={insert} />
                </details>
              </div>
            </>
          )}
        </section>

        {/* Podgląd */}
        <section className="kc-card kc-mail__preview">
          <div className="kc-mail__ptools">
            <div className="kc-mail__seg">
              <button type="button" className={device === "desktop" ? "is-active" : ""} onClick={() => setDevice("desktop")} title="Komputer"><Monitor size={15} /></button>
              <button type="button" className={device === "mobile" ? "is-active" : ""} onClick={() => setDevice("mobile")} title="Telefon"><Smartphone size={15} /></button>
              <button type="button" className={device === "text" ? "is-active" : ""} onClick={() => setDevice("text")} title="Wersja tekstowa"><FileText size={15} /></button>
            </div>
            <select value={orderId} onChange={(e) => setOrderId(e.target.value ? Number(e.target.value) : "")} title="Zamówienie użyte w podglądzie">
              <option value="">Ostatnie zamówienie</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.number} – {Number(o.total).toFixed(2).replace(".", ",")} zł</option>)}
            </select>
          </div>
          <div className="kc-mail__inbox">
            <b>{preview?.subject ?? "…"}</b>
            {sel === "_brand" && <small>Podgląd na przykładzie maila „Zamówienie przyjęte”</small>}
          </div>
          {previewErr && <p className="kc-act__msg is-bad">{previewErr}</p>}
          {device === "text"
            ? <pre className="kc-mail__text">{preview?.text}</pre>
            : <div className={`kc-mail__screen is-${device}`}><iframe title="Podgląd maila" sandbox="allow-same-origin" srcDoc={preview?.html ?? ""} /></div>}
          <div className="kc-mail__test">
            <input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="adres do testu" />
            <button type="button" className="kc-act__btn" disabled={busy === "test"} onClick={test}><Send size={14} /> {busy === "test" ? "Wysyłam…" : "Wyślij test"}</button>
          </div>
        </section>
      </div>

      <div className="kc-set__bar">
        <button type="button" className="kc-msg__send" disabled={!dirty || busy === "save"} onClick={save}><Save size={15} /> {busy === "save" ? "Zapisuję…" : dirty ? "Zapisz maile" : "Zapisano"}</button>
        <button type="button" className="kc-act__btn" onClick={resetMail}><RotateCcw size={15} /> {sel === "_brand" ? "Przywróć domyślny wygląd" : "Przywróć domyślną treść"}</button>
        {dirty && <span className="kc-muted">Masz niezapisane zmiany (podgląd już je pokazuje)</span>}
        {msg && <span className={`kc-act__msg ${msg.ok ? "is-ok" : "is-bad"}`}>{msg.message}</span>}
      </div>
    </div>
  );
}
