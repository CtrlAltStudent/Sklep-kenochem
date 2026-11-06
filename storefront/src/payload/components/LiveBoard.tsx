"use client";

import { Bot, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

type Person = {
  id: string;
  staff: boolean;
  bot: boolean;
  label: string;
  device: string;
  source: string;
  place: string;
  doing: string;
  path: string;
  steps: string[];
  hereFor: number;
  visitFor: number;
  visitNo: number;
};

type Live = { customers: number; staff: number; people: Person[]; bots?: Person[] };

type Detail = {
  id: string;
  staff: boolean;
  bot: boolean;
  label: string;
  doing: string;
  place: string;
  path: string;
  device: string;
  browser: string;
  os: string;
  language: string;
  ip: string;
  source: string;
  email: string;
  visitNo: number;
  visits: number;
  viewsNow: number;
  viewsAll: number;
  hereFor: number;
  visitFor: number;
  firstSeen: number;
  pages: { at: number; place: string; path: string }[];
};

const ago = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 20) return "przed chwilą";
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return m === 1 ? "1 min" : `${m} min`;
  const h = Math.floor(m / 60);
  return h === 1 ? "1 godz." : `${h} godz.`;
};

const strony = (n: number) => {
  if (n === 1) return "1 strona";
  const mod = n % 10;
  const mod100 = n % 100;
  if (mod >= 2 && mod <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} strony`;
  return `${n} stron`;
};
const clock = (ts: number) => new Date(ts).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
const when = (ts: number) => new Date(ts).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const razy = (n: number) => (n === 1 ? "pierwszy raz" : `${n}. raz`);

export function LiveBoard() {
  const [data, setData] = useState<Live | null>(null);
  const [down, setDown] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [where, setWhere] = useState<{ city: string; net: string } | null>(null);
  const [name, setName] = useState("");
  const [ours, setOurs] = useState(false);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    let stop = false;
    const load = () => {
      fetch("/api/live", { credentials: "include" })
        .then((r) => r.json())
        .then((j) => {
          if (stop) return;
          if (j?.ok) { setData(j); setDown(false); }
          else setDown(true);
        })
        .catch(() => { if (!stop) setDown(true); });
    };
    load();
    const timer = window.setInterval(load, 8000);
    return () => { stop = true; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!open) return;
    let stop = false;
    const load = () => {
      fetch(`/api/live?session=${encodeURIComponent(open)}`, { credentials: "include" })
        .then((r) => r.json())
        .then((j) => {
          if (stop || !j?.ok) return;
          setDetail(j.person);
          setWhere(j.where || { city: "", net: "" });
        })
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, 8000);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    return () => { stop = true; window.clearInterval(timer); window.removeEventListener("keydown", onKey); };
  }, [open]);

  useEffect(() => {
    if (!detail || detail.id !== open) return;
    setName(detail.bot ? "" : detail.label);
    setOurs(detail.staff);
    setSaved("");
  }, [detail?.id, open]);

  const customers = data?.people.filter((p) => !p.staff) ?? [];
  const office = data?.people.filter((p) => p.staff) ?? [];
  const bots = data?.bots ?? [];
  const title = data ? (data.customers === 1 ? "1 osoba w sklepie" : `${data.customers} osób w sklepie`) : "Sprawdzam…";

  const save = async () => {
    if (!open || detail?.bot) return;
    setSaved("");
    const res = await fetch("/api/live", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: open, label: name, ours }),
    }).then((r) => r.json()).catch(() => null);
    if (!res?.ok) { setSaved("Nie udało się zapisać."); return; }
    setSaved("Zapisane. Ta nazwa wróci, gdy ta przeglądarka znowu wejdzie do sklepu.");
    setData((prev) => prev && ({
      ...prev,
      people: prev.people.map((p) => p.id === open ? { ...p, label: name.trim(), staff: ours } : p),
    }));
    setDetail((prev) => prev && prev.id === open ? { ...prev, label: name.trim(), staff: ours } : prev);
  };

  return (
    <div className="kc-dash">
      <section className="kc-hero kc-hero--compact">
        <div>
          <p className="kc-hero__date">Na żywo</p>
          <h1 className="kc-hero__title">{title}</h1>
          <p className="kc-hero__text">Kliknij osobę i nadaj jej nazwę, na przykład „komputer z domu” albo „Kasia z biura”. Nazwa zostaje przy tej przeglądarce, więc przy kolejnej wizycie od razu wiadomo, kto to jest.</p>
        </div>
      </section>
      {down && <p className="kc-empty">Nie udało się odświeżyć podglądu.</p>}
      {data && customers.length === 0 && <p className="kc-empty">W tej chwili nie ma klientów. Zostaw ten ekran otwarty — ktoś, kto wejdzie, pojawi się tutaj w ciągu chwili.</p>}
      <div className="kc-live">
        {customers.map((p) => <Card key={p.id} person={p} onOpen={() => { setDetail(null); setWhere(null); setOpen(p.id); }} />)}
      </div>
      {office.length > 0 && (
        <section className="kc-card" style={{ marginTop: 16 }}>
          <h2>Od nas ({office.length})</h2>
          <p className="kc-muted">Przeglądarki z panelu i te, które oznaczyłeś jako nasze. Nie liczą się jako klienci.</p>
          <div className="kc-live" style={{ marginTop: 12 }}>
            {office.map((p) => <Card key={p.id} person={p} onOpen={() => { setDetail(null); setWhere(null); setOpen(p.id); }} />)}
          </div>
        </section>
      )}
      {bots.length > 0 && (
        <section className="kc-card" style={{ marginTop: 16 }}>
          <h2>Automaty ({bots.length})</h2>
          <p className="kc-muted">Programy, które same wchodzą na stronę (Google i podobne). To nie klienci i nie wchodzą do statystyk.</p>
          <div className="kc-live" style={{ marginTop: 12 }}>
            {bots.map((p) => <Card key={p.id} person={p} onOpen={() => { setDetail(null); setWhere(null); setOpen(p.id); }} />)}
          </div>
        </section>
      )}
      {open && (
        <>
          <button type="button" className="kc-live__shade" aria-label="Zamknij" onClick={() => setOpen(null)} />
          <aside className="kc-live__drawer">
            <button type="button" className="kc-live__close" onClick={() => setOpen(null)}>Zamknij</button>
            {!detail && <p className="kc-muted">Wczytuję szczegóły…</p>}
            {detail && (
              <>
                <div className="kc-live__who">
                  <Face bot={detail.bot} />
                  <div>
                    <h2>{detail.label || detail.doing}</h2>
                    <p className="kc-live__place">{detail.place}</p>
                  </div>
                </div>
                {!detail.bot && (
                  <form className="kc-live__name" onSubmit={(e) => { e.preventDefault(); void save(); }}>
                    <label>
                      Nasza nazwa
                      <input value={name} maxLength={40} placeholder="np. komputer z domu" onChange={(e) => setName(e.target.value)} />
                    </label>
                    <label className="kc-live__check">
                      <input type="checkbox" checked={ours} onChange={(e) => setOurs(e.target.checked)} />
                      To ktoś od nas — nie liczyć jako klienta
                    </label>
                    <button type="submit">Zapisz</button>
                    {saved && <p className="kc-muted">{saved}</p>}
                  </form>
                )}
                {detail.bot && <p className="kc-muted">To automat, nie osoba. Nie da się mu nadać imienia.</p>}
                <dl className="kc-live__facts">
                  {!detail.bot && (<><dt>Która wizyta</dt><dd>{detail.visitNo}. raz w sklepie</dd></>)}
                  <dt>Odsłony teraz</dt>
                  <dd>{strony(detail.viewsNow)} w tej wizycie</dd>
                  {!detail.bot && (<><dt>Odsłony łącznie</dt><dd>{detail.viewsAll}</dd></>)}
                  <dt>Na tej stronie</dt>
                  <dd>{ago(detail.hereFor)}</dd>
                  <dt>Ta wizyta trwa</dt>
                  <dd>{ago(detail.visitFor)}</dd>
                  <dt>Pierwszy raz</dt>
                  <dd>{when(detail.firstSeen)}</dd>
                  <dt>Skąd przyszedł</dt>
                  <dd>{detail.source}</dd>
                  <dt>Adres IP</dt>
                  <dd>{detail.ip || "Pojawi się przy następnym ruchu"}</dd>
                  <dt>Miejscowość</dt>
                  <dd>{where?.city || (detail.ip ? "Ustalam…" : "—")}</dd>
                  <dt>Łącze</dt>
                  <dd>{where?.net || "—"}</dd>
                  <dt>Urządzenie</dt>
                  <dd>{detail.device}</dd>
                  <dt>System</dt>
                  <dd>{detail.os}</dd>
                  <dt>Przeglądarka</dt>
                  <dd>{detail.browser}</dd>
                  <dt>Język</dt>
                  <dd>{detail.language}</dd>
                  {detail.email && (<><dt>E-mail</dt><dd>{detail.email}</dd></>)}
                </dl>
                <div>
                  <h3 className="kc-section-title">Ta wizyta</h3>
                  <ol className="kc-live__path">
                    {detail.pages.map((page, i) => (
                      <li key={`${page.at}-${i}`}>
                        <time>{clock(page.at)}</time>
                        <span>{page.place}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}
          </aside>
        </>
      )}
    </div>
  );
}

function Face({ bot }: { bot: boolean }) {
  return (
    <span className={`kc-live__face ${bot ? "is-bot" : ""}`} aria-hidden>
      {bot ? <Bot size={22} /> : <UserRound size={22} />}
      <span className="kc-live__pulse" />
    </span>
  );
}

function Card({ person, onOpen }: { person: Person; onOpen: () => void }) {
  return (
    <button type="button" className="kc-live__card" onClick={onOpen}>
      <Face bot={person.bot} />
      <span>
        <b>{person.label || person.doing}</b>
        {person.label && <span className="kc-live__doing">{person.doing}</span>}
        <span className="kc-live__place">{person.place}</span>
        <span className="kc-muted">
          {person.bot
            ? `automat · na stronie ${ago(person.hereFor)}`
            : `${person.device} · ${person.source} · ${razy(person.visitNo)} · na tej stronie ${ago(person.hereFor)} · w sklepie ${ago(person.visitFor)}`}
        </span>
        {person.steps.length > 1 && <span className="kc-live__steps">{person.steps.join(" → ")}</span>}
      </span>
    </button>
  );
}
