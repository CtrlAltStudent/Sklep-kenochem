"use client";

// Dział Integracje: przegląd modułów (dodaj / włącz / wyłącz) i strona modułu (klucze, synchronizacja, dziennik).
// Pełnych haseł nigdy nie pobieramy z serwera – widać tylko końcówkę („••••a1b2”).

import Link from "next/link";
import { ChartLine, Mail, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { moduleById, providers, upcoming, type AutoSettings, type JobId, type JobRun, type ModuleCategory, type Provider } from "@/integrations/registry";

type FieldState = { source: "panel" | "env" | "none"; preview: string; unreadable: boolean };
type State = {
  file: string;
  updatedAt?: string;
  updatedBy?: string;
  scheduler: boolean;
  providers: { id: string; installed: boolean; enabled: boolean; mode: string; modeFromPanel: boolean; fields: Record<string, FieldState> }[];
  auto: AutoSettings;
  runs: Partial<Record<JobId | "pull", JobRun>>;
};
type Res = { ok: boolean; message: string };

const fmt = (d?: string) => (d ? new Date(d).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" }) : "nigdy");

async function api<T = Res>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(`/api/integrations${path}`, {
    method: init?.json !== undefined ? "POST" : init?.method ?? "GET",
    credentials: "include",
    headers: init?.json !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.json !== undefined ? JSON.stringify(init.json) : undefined,
  });
  return res.json();
}

function Status({ provider, st }: { provider: Provider; st: State["providers"][number] }) {
  const fields = Object.values(st.fields);
  const required = provider.fields.filter((f) => f.key !== "p24.posId" && !f.optional);
  const missing = required.some((f) => !st.fields[f.key]?.preview);
  if (!st.installed) return <span className="kc-ih__pill is-off">Niedodany</span>;
  if (!st.enabled) return <span className="kc-ih__pill is-off">Wyłączony</span>;
  if (st.mode === "mock") return <span className="kc-ih__pill is-amber">Tryb testowy</span>;
  if (missing) return <span className="kc-ih__pill is-off">{fields.some((f) => f.preview) ? "Niekompletne" : "Nie podłączone"}</span>;
  if (st.mode === "sandbox") return <span className="kc-ih__pill is-amber">Sandbox</span>;
  if (!required.length && !fields.some((f) => f.preview)) return <span className="kc-ih__pill is-on">Gotowy</span>;
  return <span className="kc-ih__pill is-on">Klucze ustawione</span>;
}

function ProviderCard({ provider, st, onSaved }: { provider: Provider; st: State["providers"][number]; onSaved: (s: State) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [modeChoice, setMode] = useState<string | null>(null); // null = jak zapisano
  const mode = modeChoice ?? st.mode;
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [res, setRes] = useState<Res | null>(null);

  const dirty = Object.values(values).some((v) => v.trim()) || (provider.mode && mode !== st.mode);

  const save = async (extra?: Record<string, string | null>) => {
    setBusy("save");
    setRes(null);
    const keys = { ...Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim())), ...extra };
    const r = await api<Res & { state?: State }>("", { json: { keys, modes: provider.mode ? { [provider.mode.key]: mode } : undefined } }).catch((e) => ({ ok: false, message: String(e) }) as Res & { state?: State });
    if (r.ok && r.state) {
      onSaved(r.state);
      setValues({});
      setMode(null);
    }
    setRes(r);
    setBusy(null);
    return r.ok;
  };

  const test = async () => {
    if (dirty && !(await save())) return;
    setBusy("test");
    setRes(await api(`/test/${provider.id}`, { method: "POST" }).catch((e) => ({ ok: false, message: String(e) })));
    setBusy(null);
  };

  const clear = (key: string, label: string) => {
    if (confirm(`Usunąć „${label}” zapisany w panelu? Sklep wróci do wartości z pliku .env (jeśli jest).`)) void save({ [key]: null });
  };

  return (
    <article className="kc-ih__card">
      <header className="kc-ih__head">
        <div className="kc-ih__title">
          <h3>Klucze i tryb pracy</h3>
          <p>Hasła są szyfrowane – po zapisie widać tylko końcówkę.</p>
        </div>
      </header>

      <div className="kc-ih__body">
        {provider.mode && (
          <div className="kc-ih__modes" role="radiogroup" aria-label="Tryb pracy">
            {provider.mode.options.map((o) => (
              <label key={o.value} className={mode === o.value ? "is-active" : ""}>
                <input type="radio" name={`${provider.id}-mode`} value={o.value} checked={mode === o.value} onChange={() => setMode(o.value)} />
                {o.label}
              </label>
            ))}
          </div>
        )}

        {provider.fields.map((f) => {
          const cur = st.fields[f.key];
          return (
            <div key={f.key} className="kc-ih__field">
              <label htmlFor={f.key}>{f.label}</label>
              <div className="kc-ih__input">
                <input
                  id={f.key}
                  type={f.secret && !show[f.key] ? "password" : "text"}
                  autoComplete="off"
                  spellCheck={false}
                  value={values[f.key] ?? ""}
                  placeholder={cur?.preview ? `${cur.preview}  (wpisz nowy, aby zmienić)` : f.placeholder ?? "Wklej tutaj"}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
                {f.secret && (
                  <button type="button" className="kc-ih__ghost" onClick={() => setShow((s) => ({ ...s, [f.key]: !s[f.key] }))}>
                    {show[f.key] ? "Ukryj" : "Pokaż"}
                  </button>
                )}
              </div>
              <small>
                {cur?.unreadable ? (
                  <span className="is-bad">Zapisanego klucza nie da się odczytać (zmieniono PAYLOAD_SECRET) – wpisz go ponownie.</span>
                ) : cur?.source === "panel" ? (
                  <>Zapisany w panelu · <button type="button" className="kc-ih__link" onClick={() => clear(f.key, f.label)}>usuń</button></>
                ) : cur?.source === "env" ? (
                  "Pochodzi z pliku .env na serwerze. Wpisz tutaj, aby zastąpić."
                ) : (
                  f.hint ?? "Nie ustawiony."
                )}
              </small>
            </div>
          );
        })}

      </div>

      <footer className="kc-ih__foot">
        {res && <span className={`kc-ih__res ${res.ok ? "is-ok" : "is-bad"}`}>{res.ok ? "✔" : "✖"} {res.message}</span>}
        <div className="kc-ih__actions">
          {provider.testable && (
            <button type="button" className="kc-ih__btn" disabled={!!busy} onClick={test}>
              {busy === "test" ? "Sprawdzam…" : dirty ? "Zapisz i sprawdź" : "Sprawdź połączenie"}
            </button>
          )}
          <button type="button" className="kc-ih__btn is-primary" disabled={!!busy || !dirty} onClick={() => void save()}>
            {busy === "save" ? "Zapisuję…" : "Zapisz"}
          </button>
        </div>
      </footer>
    </article>
  );
}

const JOBS: { id: JobId; title: string; text: string; every?: keyof AutoSettings; hour?: boolean }[] = [
  { id: "stock", title: "Stany magazynowe i ceny", text: "Pobiera z BaseLinkera ilości i ceny wszystkich produktów.", every: "stockEveryMin" },
  { id: "statuses", title: "Statusy zamówień (wysłane / anulowane)", text: "Gdy w BaseLinkerze paczka zostanie nadana, zamówienie w sklepie zmienia się na „Wysłane”.", every: "statusesEveryMin" },
  { id: "orders", title: "Ponawianie wysyłki zamówień", text: "Zamówienia, które nie doszły do BaseLinkera (np. chwilowa awaria), są wysyłane ponownie co 10 minut – maks. 5 prób." },
  { id: "products", title: "Pełne dane produktów", text: "Nazwy, opisy, zdjęcia i kategorie – raz na dobę, o wybranej godzinie.", hour: true },
];

function AutoCard({ state, onSaved }: { state: State; onSaved: (s: State) => void }) {
  const [draft, setAuto] = useState<AutoSettings | null>(null); // null = jak zapisano
  const auto = draft ?? state.auto;
  const [statuses, setStatuses] = useState<{ id: number; name: string }[] | null>(null);
  const [statusErr, setStatusErr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [res, setRes] = useState<Res | null>(null);
  const blMode = state.providers.find((p) => p.id === "baselinker");
  const blReady = Boolean(blMode?.enabled) && (blMode?.mode === "mock" || Boolean(blMode?.fields["baselinker.token"]?.preview));

  const loadStatuses = useCallback(() => {
    api<{ ok: boolean; message?: string; statuses: { id: number; name: string }[] }>("/baselinker-statuses")
      .then((r) => {
        setStatuses(r.statuses);
        setStatusErr(r.ok ? "" : r.message ?? "");
      })
      .catch((e) => setStatusErr(String(e)));
  }, []);
  useEffect(() => {
    if (blReady) loadStatuses();
  }, [blReady, loadStatuses]);

  const dirty = JSON.stringify(auto) !== JSON.stringify(state.auto);
  const set = <K extends keyof AutoSettings>(k: K, v: AutoSettings[K]) => setAuto({ ...auto, [k]: v });
  const toggleId = (k: "shippedStatusIds" | "cancelledStatusIds", id: number) =>
    set(k, auto[k].includes(id) ? auto[k].filter((x) => x !== id) : [...auto[k], id]);

  const save = async () => {
    setBusy("save");
    const r = await api<Res & { state?: State }>("", { json: { auto } }).catch((e) => ({ ok: false, message: String(e) }) as Res & { state?: State });
    if (r.ok && r.state) {
      onSaved(r.state);
      setAuto(null);
    }
    setRes(r);
    setBusy(null);
  };
  const run = async (job: JobId) => {
    setBusy(job);
    setRes(null);
    const r = await api(`/run/${job}`, { method: "POST" }).catch((e) => ({ ok: false, message: String(e) }));
    setRes(r);
    setBusy(null);
    onSaved(await api<State>(""));
  };

  return (
    <article className="kc-ih__card kc-ih__card--wide">
      <header className="kc-ih__head">
        <div className="kc-ih__title">
          <h3>Stałe połączenie z BaseLinkerem</h3>
          <p>Sklep sam, w tle, pobiera stany i statusy zamówień – bez klikania. Zmiany widać w zakładce „Dziennik”.</p>
        </div>
        <span className={`kc-ih__pill ${state.scheduler ? "is-on" : "is-off"}`}>{state.scheduler ? "Harmonogram działa" : "Harmonogram wyłączony"}</span>
      </header>

      <div className="kc-ih__body">
        {!state.scheduler && (
          <p className="kc-ih__note">Na tym komputerze harmonogram nie działa (tryb programisty). Na serwerze uruchamia się sam. Przyciskiem „Uruchom teraz” można sprawdzić każde zadanie ręcznie.</p>
        )}
        {!blReady && <p className="kc-ih__note is-bad">Najpierw włącz moduł i wpisz token BaseLinkera (albo wybierz tryb testowy) w zakładce „Konfiguracja”.</p>}
        {/* Integracja „Inny sklep”: BaseLinker sam pobiera zamówienia – pokazujemy, kiedy ostatnio to zrobił */}
        <p className={`kc-ih__note ${state.runs.pull ? "" : "is-bad"}`}>
          <b>Pobieranie zamówień przez BaseLinkera (Inny sklep):</b>{" "}
          {state.runs.pull ? `ostatnio ${fmt(state.runs.pull.at)} – ${state.runs.pull.message}` : "BaseLinker jeszcze nie pobierał zamówień z tego sklepu. Sprawdź w BaseLinkerze: Integracje → Inny sklep → adres pliku i hasło komunikacji."}
        </p>

        <ul className="kc-ih__jobs">
          {JOBS.map((j) => {
            const last = state.runs[j.id];
            return (
              <li key={j.id}>
                <label className="kc-ih__switch">
                  <input type="checkbox" checked={Boolean(auto[j.id])} onChange={(e) => set(j.id, e.target.checked)} />
                  <span />
                </label>
                <div className="kc-ih__job">
                  <b>{j.title}</b>
                  <small>{j.text}</small>
                  <small className={last ? (last.ok ? "is-ok" : "is-bad") : ""}>
                    Ostatnio: {fmt(last?.at)}{last ? ` – ${last.message}` : ""}
                  </small>
                </div>
                <div className="kc-ih__jobset">
                  {j.every && (
                    <label>co <input type="number" min={5} max={1440} value={Number(auto[j.every])} onChange={(e) => set(j.every!, Number(e.target.value) as never)} /> min</label>
                  )}
                  {j.hour && (
                    <label>o godz. <input type="number" min={0} max={23} value={auto.productsHour} onChange={(e) => set("productsHour", Number(e.target.value))} />:00</label>
                  )}
                  <button type="button" className="kc-ih__ghost" disabled={!!busy || !blReady} onClick={() => run(j.id)}>{busy === j.id ? "Trwa…" : "Uruchom teraz"}</button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="kc-ih__map">
          <h4>Które statusy BaseLinkera oznaczają…</h4>
          {statusErr && <p className="kc-ih__note is-bad">Nie udało się pobrać statusów: {statusErr}</p>}
          {!statuses?.length ? (
            <p className="kc-ih__note">{blReady ? "Wczytuję statusy z BaseLinkera…" : "Statusy pojawią się po podłączeniu BaseLinkera."}</p>
          ) : (
            <div className="kc-ih__mapgrid">
              {(["shippedStatusIds", "cancelledStatusIds"] as const).map((k) => (
                <fieldset key={k}>
                  <legend>{k === "shippedStatusIds" ? "…„Wysłane do klienta”" : "…„Anulowane”"}</legend>
                  {statuses.map((s) => (
                    <label key={s.id}>
                      <input type="checkbox" checked={auto[k].includes(s.id)} onChange={() => toggleId(k, s.id)} /> {s.name} <small>#{s.id}</small>
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="kc-ih__foot">
        {res && <span className={`kc-ih__res ${res.ok ? "is-ok" : "is-bad"}`}>{res.ok ? "✔" : "✖"} {res.message}</span>}
        <div className="kc-ih__actions">
          <button type="button" className="kc-ih__btn is-primary" disabled={!!busy || !dirty} onClick={save}>{busy === "save" ? "Zapisuję…" : "Zapisz ustawienia"}</button>
        </div>
      </footer>
    </article>
  );
}

// ---------- Wspólne ----------

type ModuleRow = State["providers"][number];

function useIntegrations() {
  const router = useRouter();
  const [state, setRaw] = useState<State | null>(null);
  // Po zmianie odśwież też menu boczne (renderowane na serwerze – lista modułów, „wył.”)
  const setState = useCallback((s: State) => {
    setRaw(s);
    router.refresh();
  }, [router]);
  const [error, setError] = useState("");
  useEffect(() => {
    api<State & { ok?: boolean; message?: string }>("")
      .then((s) => (s.providers ? setRaw(s) : setError(s.message ?? "Brak dostępu")))
      .catch((e) => setError(String(e)));
  }, []);
  return { state, setState, error };
}

function ModuleLogo({ provider, size = "md" }: { provider: Provider; size?: "md" | "lg" }) {
  return (
    <div className={`kc-ih__logo kc-ih__logo--${size}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- małe logo z public/marks */}
      {provider.logo ? <img src={provider.logo} alt="" /> : provider.id === "poczta" ? <Mail size={size === "lg" ? 28 : 20} /> : provider.id === "google" ? <ChartLine size={size === "lg" ? 28 : 20} /> : <b>{(provider.name.match(/[A-Z]/g) ?? []).slice(0, 2).join("")}</b>}
    </div>
  );
}

// Przełącznik „włączony / wyłączony” z potwierdzeniem przy wyłączaniu
function ModuleSwitch({ provider, row, onSaved, onResult }: { provider: Provider; row: ModuleRow; onSaved: (s: State) => void; onResult?: (r: Res) => void }) {
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    const enabled = !row.enabled;
    if (!enabled && !confirm(`Wyłączyć moduł ${provider.name}?\n\n${provider.whenOff}`)) return;
    setBusy(true);
    const r = await api<Res & { state?: State }>(`/modules/${provider.id}`, { json: { enabled } }).catch((e) => ({ ok: false, message: String(e) }) as Res & { state?: State });
    if (r.ok && r.state) onSaved(r.state);
    onResult?.(r);
    setBusy(false);
  };
  return (
    <label className={`kc-ih__toggle ${row.enabled ? "is-on" : ""}`}>
      <span className="kc-ih__switch">
        <input type="checkbox" checked={row.enabled} disabled={busy} onChange={toggle} aria-label={`Moduł ${provider.name} włączony`} />
        <span />
      </span>
      {busy ? "Zapisuję…" : row.enabled ? "Włączony" : "Wyłączony"}
    </label>
  );
}

const CATEGORIES: ModuleCategory[] = ["Sprzedaż i magazyn", "Płatności", "Dostawa", "Komunikacja", "Marketing i analityka"];

// ---------- /admin/integracje – przegląd (wzór: BaseLinker → Integracje) ----------
// Dwie zakładki: „Moje integracje” (lista dodanych, stan, przełącznik, ustawienia) i „Dodaj integrację” (katalog).
// Po lewej kategorie z licznikami i wyszukiwarka – wspólne dla obu zakładek.

type View = "mine" | "add";

export function ModulesOverview() {
  const { state, setState, error } = useIntegrations();
  const [view, setView] = useState<View>("mine");
  const [cat, setCat] = useState<ModuleCategory | "all">("all");
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Res | null>(null);
  const [checks, setChecks] = useState<"running" | { name: string; ok: boolean; message: string }[] | null>(null);

  // Diagnostyka: stan sklepu (adres kontrolny) + test każdego włączonego modułu po kolei
  const checkAll = async () => {
    setChecks("running");
    const out: { name: string; ok: boolean; message: string }[] = [];
    const h = await fetch("/api/zdrowie", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    out.push({ name: "Sklep (baza, harmonogram, synchronizacja)", ok: h?.status === "ok", message: h ? (h.problems?.length ? h.problems.join("; ") : `Działa – odpowiedź w ${h.ms} ms`) : "Brak odpowiedzi" });
    for (const p of providers) {
      const row = state?.providers.find((r) => r.id === p.id);
      if (!row?.installed) continue;
      if (!row.enabled) { out.push({ name: p.name, ok: true, message: "Wyłączony – nie sprawdzam" }); continue; }
      if (!p.testable) { out.push({ name: p.name, ok: true, message: "Nie ma testu – działa bez połączenia" }); continue; }
      const r = await api(`/test/${p.id}`, { method: "POST" }).catch((e) => ({ ok: false, message: String(e) }));
      out.push({ name: p.name, ok: r.ok, message: r.message });
    }
    setChecks(out);
  };

  if (error) return <div className="kc-card"><p className="kc-ih__note is-bad">{error}</p></div>;
  if (!state) return <div className="kc-card"><p className="kc-ih__note">Wczytuję…</p></div>;

  const rows = state.providers;
  const isInstalled = (p: Provider) => Boolean(rows.find((r) => r.id === p.id)?.installed);
  const text = q.trim().toLowerCase();
  const match = (name: string, what: string, category: string) =>
    (cat === "all" || category === cat) && (!text || `${name} ${what} ${category}`.toLowerCase().includes(text));
  const mine = providers.filter(isInstalled);
  const shown = (view === "mine" ? mine : providers).filter((p) => match(p.name, p.what, p.category));
  const soon = view === "add" ? upcoming.filter((u) => match(u.name, u.what, u.category)) : [];
  const count = (c: ModuleCategory | "all") =>
    (view === "mine" ? mine : providers).filter((p) => c === "all" || p.category === c).length +
    (view === "add" ? upcoming.filter((u) => c === "all" || u.category === c).length : 0);

  const add = async (p: Provider) => {
    const r = await api<Res & { state?: State }>(`/modules/${p.id}`, { json: { installed: true } }).catch((e) => ({ ok: false, message: String(e) }) as Res & { state?: State });
    if (r.ok && r.state) setState(r.state);
    setRes(r);
  };

  return (
    <div className="kc-int">
      <div className="kc-int__top">
        <nav className="kc-int__views" aria-label="Integracje">
          <button type="button" className={view === "mine" ? "is-active" : ""} onClick={() => setView("mine")}>Moje integracje <span>{mine.length}</span></button>
          <button type="button" className={view === "add" ? "is-active" : ""} onClick={() => setView("add")}>+ Dodaj integrację</button>
        </nav>
        {res && <span className={`kc-ih__res ${res.ok ? "is-ok" : "is-bad"}`}>{res.ok ? "✔" : "✖"} {res.message}</span>}
        <button type="button" className="kc-ih__btn" onClick={checkAll} disabled={checks === "running"}>{checks === "running" ? "Sprawdzam…" : "Sprawdź połączenia"}</button>
      </div>

      {Array.isArray(checks) && (
        <section className="kc-ih__checks" aria-live="polite">
          <h3>Wynik sprawdzenia</h3>
          <ul>{checks.map((c) => <li key={c.name} className={c.ok ? "is-ok" : "is-bad"}><b>{c.ok ? "✔" : "✖"} {c.name}</b><span>{c.message}</span></li>)}</ul>
        </section>
      )}

      <div className="kc-int__layout">
        <aside className="kc-int__side">
          <input type="search" className="kc-int__search" placeholder="Szukaj integracji…" value={q} onChange={(e) => setQ(e.target.value)} />
          <ul>
            {(["all", ...CATEGORIES] as const).map((c) => (
              <li key={c}><button type="button" className={cat === c ? "is-active" : ""} onClick={() => setCat(c)}>{c === "all" ? "Wszystkie" : c}<span>{count(c)}</span></button></li>
            ))}
          </ul>
        </aside>

        <section className="kc-int__main">
          {view === "mine" ? (
            shown.length ? (
              <div className="kc-int__list">
                {shown.map((p) => {
                  const row = rows.find((r) => r.id === p.id)!;
                  return (
                    <article key={p.id} className={`kc-int__row ${row.enabled ? "" : "is-off"}`}>
                      <ModuleLogo provider={p} />
                      <Link href={`/admin/integracje/${p.id}`} className="kc-int__name"><b>{p.name}</b><small>{p.category} · {p.what}</small></Link>
                      <Status provider={p} st={row} />
                      <ModuleSwitch provider={p} row={row} onSaved={setState} onResult={setRes} />
                      <Link href={`/admin/integracje/${p.id}`} className="kc-int__gear" title="Ustawienia" aria-label={`Ustawienia: ${p.name}`}><Settings size={16} /></Link>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="kc-int__empty">
                <p>{mine.length ? "Nic nie pasuje do wyszukiwania." : "Nie dodano jeszcze żadnej integracji."}</p>
                <button type="button" className="kc-ih__btn is-primary" onClick={() => setView("add")}>+ Dodaj integrację</button>
              </div>
            )
          ) : (
            <div className="kc-int__grid">
              {shown.map((p) => (
                <article key={p.id} className="kc-int__tile">
                  <ModuleLogo provider={p} size="lg" />
                  <b>{p.name}</b>
                  <small>{p.category}</small>
                  <p>{p.what}</p>
                  {isInstalled(p)
                    ? <Link href={`/admin/integracje/${p.id}`} className="kc-ih__btn">✓ Dodana – ustawienia</Link>
                    : <button type="button" className="kc-ih__btn is-primary" onClick={() => add(p)}>Dodaj</button>}
                </article>
              ))}
              {soon.map((u) => (
                <article key={u.name} className="kc-int__tile is-soon">
                  <div className="kc-ih__logo kc-ih__logo--lg"><b>{u.name.slice(0, 2).toUpperCase()}</b></div>
                  <b>{u.name}</b>
                  <small>{u.category}</small>
                  <p>{u.what}</p>
                  <span className="kc-ih__pill is-off">Wkrótce</span>
                </article>
              ))}
              {!shown.length && !soon.length && <p className="kc-int__empty">Nic nie pasuje do wyszukiwania.</p>}
            </div>
          )}
        </section>
      </div>

      <p className="kc-ih__meta">
        Klucze są zaszyfrowane i zapisane w pliku <code>{state.file}</code> (poza bazą danych i poza gitem).
        {state.updatedAt ? ` Ostatnia zmiana: ${fmt(state.updatedAt)}${state.updatedBy ? `, ${state.updatedBy}` : ""}.` : ""}
      </p>
    </div>
  );
}

// ---------- /admin/integracje/<moduł> – strona modułu ----------

type Log = { id: number; createdAt: string; type?: string; status?: string; message?: string; mode?: string; durationMs?: number };
const LOG_TYPE: Record<string, string> = { test: "Test połączenia", products: "Produkty", stock: "Stany i ceny", order: "Zamówienie" };

function LogList() {
  const [logs, setLogs] = useState<Log[] | null>(null);
  useEffect(() => {
    fetch("/api/integration-logs?limit=25&sort=-createdAt&depth=0", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => setLogs(j.docs ?? []))
      .catch(() => setLogs([]));
  }, []);
  if (!logs) return <p className="kc-ih__note">Wczytuję…</p>;
  if (!logs.length) return <p className="kc-ih__note">Dziennik jest pusty.</p>;
  return (
    <div className="kc-ih__card">
      <table className="kc-ih__log">
        <thead><tr><th>Kiedy</th><th>Operacja</th><th>Wynik</th><th>Opis</th></tr></thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{fmt(l.createdAt)}</td>
              <td>{LOG_TYPE[l.type ?? ""] ?? l.type}{l.mode && l.mode !== "live" ? <small> · {l.mode === "mock" ? "test" : "podgląd"}</small> : null}</td>
              <td><span className={`kc-ih__pill ${l.status === "success" ? "is-on" : l.status === "warning" ? "is-amber" : "is-bad"}`}>{l.status === "success" ? "OK" : l.status === "warning" ? "Uwagi" : "Błąd"}</span></td>
              <td><Link href={`/admin/collections/integration-logs/${l.id}`}>{l.message}</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="kc-ih__foot"><Link href="/admin/collections/integration-logs" className="kc-ih__btn">Pełny dziennik →</Link></footer>
    </div>
  );
}

type Tab = "config" | "sync" | "log";

export function ModulePage({ id }: { id: string }) {
  const { state, setState, error } = useIntegrations();
  const [tab, setTab] = useState<Tab>("config");
  const [res, setRes] = useState<Res | null>(null);
  const provider = moduleById(id);

  if (!provider) return <div className="kc-card"><p className="kc-ih__note is-bad">Nie ma takiego modułu. <Link href="/admin/integracje">Wróć do listy modułów</Link></p></div>;
  if (error) return <div className="kc-card"><p className="kc-ih__note is-bad">{error}</p></div>;
  if (!state) return <div className="kc-card"><p className="kc-ih__note">Wczytuję…</p></div>;
  const row = state.providers.find((r) => r.id === provider.id)!;

  const setInstalled = async (installed: boolean) => {
    if (!installed && !confirm(`Usunąć moduł ${provider.name} ze sklepu?\n\n${provider.whenOff}\n\nZapisane klucze zostają – po ponownym dodaniu nie trzeba ich wpisywać.`)) return;
    const r = await api<Res & { state?: State }>(`/modules/${provider.id}`, { json: { installed } }).catch((e) => ({ ok: false, message: String(e) }) as Res & { state?: State });
    if (r.ok && r.state) setState(r.state);
    setRes(r);
  };

  const isBL = provider.id === "baselinker";
  const tabs: [Tab, string][] = isBL ? [["config", "Konfiguracja"], ["sync", "Synchronizacja"], ["log", "Dziennik"]] : [["config", "Konfiguracja"]];

  return (
    <div className="kc-ih">
      <Link href="/admin/integracje" className="kc-ih__back">← Moje integracje</Link>
      <header className="kc-ih__modhead">
        <ModuleLogo provider={provider} size="lg" />
        <div className="kc-ih__title">
          <small>{provider.category}</small>
          <h1>{provider.name}</h1>
          <p>{provider.what}</p>
        </div>
        <div className="kc-ih__modactions">
          <Status provider={provider} st={row} />
          {row.installed ? <ModuleSwitch provider={provider} row={row} onSaved={setState} onResult={setRes} /> : (
            <button type="button" className="kc-ih__btn is-primary" onClick={() => setInstalled(true)}>Dodaj do sklepu</button>
          )}
        </div>
      </header>
      {res && <p className={`kc-ih__res ${res.ok ? "is-ok" : "is-bad"}`}>{res.ok ? "✔" : "✖"} {res.message}</p>}
      {row.installed && !row.enabled && <p className="kc-ih__banner">Moduł jest wyłączony. {provider.whenOff}</p>}

      <nav className="kc-ih__tabs" aria-label="Sekcje modułu">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" className={tab === k ? "is-active" : ""} onClick={() => setTab(k)}>{label}</button>
        ))}
        {isBL && <Link href="/admin/globals/baselinker-settings">Katalog i zamówienia ↗</Link>}
      </nav>

      {tab === "config" && (
        <div className="kc-ih__split">
          <ProviderCard provider={provider} st={row} onSaved={setState} />
          <aside className="kc-ih__card kc-ih__guide">
            <header className="kc-ih__head"><div className="kc-ih__title"><h3>Jak podłączyć</h3><p>{provider.where}</p></div></header>
            <ol>{provider.guide.map((g) => <li key={g}>{g}</li>)}</ol>
            {row.installed && (
              <footer className="kc-ih__foot">
                <button type="button" className="kc-ih__link" onClick={() => setInstalled(false)}>Usuń moduł ze sklepu</button>
              </footer>
            )}
          </aside>
        </div>
      )}
      {tab === "sync" && isBL && <AutoCard state={state} onSaved={setState} />}
      {tab === "log" && isBL && <LogList />}
    </div>
  );
}
