"use client";

// Konto klienta: logowanie, rejestracja, reset hasła, a po zalogowaniu – zamówienia, dane i adresy, hasło.
// Logowanie przez API sklepu (/api/account/...) – sesja w osobnym ciasteczku HttpOnly „sonax-klient”,
// więc zalogowanie się jako klient nie wylogowuje z panelu admina.

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Download, KeyRound, LogOut, MapPin, Package, Plus, ShieldCheck, Trash2, Truck, UserRound } from "lucide-react";
import { formatPrice } from "@/lib/data";

const input = "h-11 w-full rounded-xl border border-brand-100 bg-white px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-leaf focus:ring-4 focus:ring-leaf/15";
const btn = "btn-kc flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white transition active:scale-[.98] disabled:opacity-60";
const card = "rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:p-8";

type Address = { id?: string; label?: string; fullName?: string; company?: string; street?: string; postcode?: string; city?: string; country?: string };
export type Me = { id: number; email: string; firstName?: string; lastName?: string; phone?: string; addresses?: Address[] };

async function api<T = Record<string, unknown>>(path: string, method = "GET", body?: unknown): Promise<{ status: number; json: T }> {
  const res = await fetch(path, { method, credentials: "include", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  return { status: res.status, json: (await res.json().catch(() => ({}))) as T };
}

type Res = { ok?: boolean; message?: string };
const fail = (r: { status: number; json: Res }, fallback: string) => r.json.message || fallback;

export const useMe = () => {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const refresh = useCallback(async () => {
    const { json } = await api<{ user?: Me | null }>("/api/account/me");
    setMe(json.user ?? null);
  }, []);
  useEffect(() => {
    let alive = true;
    api<{ user?: Me | null }>("/api/account/me").then(({ json }) => alive && setMe(json.user ?? null));
    return () => { alive = false; };
  }, []);
  return { me, setMe, refresh };
};

// ---------- Niezalogowany ----------

function Guest({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim().toLowerCase();
    const password = String(f.get("password") ?? "");
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "forgot") {
        await api("/api/account/forgot", "POST", { email });
        setMsg({ ok: true, text: "Jeśli konto z tym adresem istnieje, wysłaliśmy link do ustawienia nowego hasła. Sprawdź skrzynkę (także SPAM)." });
        return;
      }
      if (mode === "register") {
        if (password.length < 8) return setMsg({ ok: false, text: "Hasło musi mieć co najmniej 8 znaków." });
        if (password !== f.get("password2")) return setMsg({ ok: false, text: "Hasła nie są takie same." });
        // rejestracja od razu loguje (serwer ustawia ciasteczko klienta)
        const r = await api<Res>("/api/account/register", "POST", {
          email, password, terms: true, newsletter: f.get("newsletter") === "on",
          firstName: String(f.get("firstName") ?? "").trim(), lastName: String(f.get("lastName") ?? "").trim(), phone: String(f.get("phone") ?? "").trim() || undefined,
        });
        if (r.status >= 400) return setMsg({ ok: false, text: fail(r, "Nie udało się założyć konta. Sprawdź dane.") });
      } else {
        const r = await api<Res>("/api/account/login", "POST", { email, password });
        if (r.status >= 400) return setMsg({ ok: false, text: fail(r, "Nie udało się zalogować.") });
      }
      onLogin();
    } catch {
      setMsg({ ok: false, text: "Brak połączenia – spróbuj ponownie." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl items-start gap-6 px-4 pt-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <form onSubmit={submit} className={card} key={mode}>
        {mode !== "forgot" && (
          <div className="mb-6 inline-flex rounded-xl bg-brand-50 p-1 text-sm font-semibold">
            {(["login", "register"] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setMsg(null); }} className={`rounded-lg px-4 py-2 transition ${mode === m ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-navy"}`}>
                {m === "login" ? "Logowanie" : "Załóż konto"}
              </button>
            ))}
          </div>
        )}
        <h1 className="text-2xl font-black">{mode === "login" ? "Zaloguj się" : mode === "register" ? "Załóż konto" : "Nie pamiętasz hasła?"}</h1>
        {mode === "forgot" && <p className="mt-1 text-sm text-slate-600">Podaj adres konta – wyślemy link do ustawienia nowego hasła.</p>}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {mode === "register" && (
            <>
              <input required name="firstName" placeholder="Imię" autoComplete="given-name" className={input} />
              <input required name="lastName" placeholder="Nazwisko" autoComplete="family-name" className={input} />
            </>
          )}
          <input required name="email" type="email" placeholder="E-mail" autoComplete="email" className={`${input} col-span-2`} />
          {mode === "register" && <input name="phone" type="tel" placeholder="Telefon (opcjonalnie)" autoComplete="tel" className={`${input} col-span-2`} />}
          {mode !== "forgot" && <input required name="password" type="password" placeholder="Hasło" minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} className={`${input} col-span-2`} />}
          {mode === "register" && <input required name="password2" type="password" placeholder="Powtórz hasło" autoComplete="new-password" className={`${input} col-span-2`} />}
        </div>
        {mode === "register" && (
          <div className="mt-3 space-y-2 text-xs text-slate-600">
            <label className="flex cursor-pointer items-start gap-2"><input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[#d32e2e]" /><span>Akceptuję <Link href="/regulamin" target="_blank" className="underline">regulamin</Link> i <Link href="/polityka-prywatnosci" target="_blank" className="underline">politykę prywatności</Link>.</span></label>
            <label className="flex cursor-pointer items-start gap-2"><input type="checkbox" name="newsletter" className="mt-0.5 h-4 w-4 accent-[#d32e2e]" /><span>Chcę dostawać informacje o promocjach i nowościach (newsletter).</span></label>
          </div>
        )}
        {msg && <p className={`mt-4 rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
        <button disabled={busy} className={`${btn} mt-5`}>
          {busy ? "Chwileczkę…" : mode === "login" ? "Zaloguj się" : mode === "register" ? "Załóż konto" : "Wyślij link"}
        </button>
        <div className="mt-4 text-center text-sm">
          {mode === "login" && <button type="button" onClick={() => { setMode("forgot"); setMsg(null); }} className="font-medium text-accent-dark hover:underline">Nie pamiętasz hasła?</button>}
          {mode === "forgot" && <button type="button" onClick={() => { setMode("login"); setMsg(null); }} className="font-medium text-accent-dark hover:underline">← Wróć do logowania</button>}
        </div>
      </form>
      <div className="rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 p-8 text-white">
        <h2 className="text-2xl font-black">Po co konto?</h2>
        <ul className="mt-5 space-y-3 text-sm text-brand-100">
          <li className="flex gap-3"><Package className="h-5 w-5 shrink-0 text-leaf-300" /> Historia zamówień i status przesyłek w jednym miejscu</li>
          <li className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-leaf-300" /> Zapisane adresy – zamówienie wypełnia się samo</li>
          <li className="flex gap-3"><Truck className="h-5 w-5 shrink-0 text-leaf-300" /> Numer paczki i link do śledzenia od razu po wysyłce</li>
        </ul>
        <p className="mt-6 text-xs text-brand-200">Zakupy bez konta też są możliwe – wystarczy e-mail przy zamówieniu.</p>
      </div>
    </div>
  );
}

// ---------- Zalogowany: zamówienia ----------

type OrderRow = {
  id: number; number: string; createdAt: string; status: string; total: number; shippingCost: number;
  items: { name: string; variant: string; qty: number; price: number }[];
  shipping: { method: string; point: string; address: string }; payment: { method: string; status: string }; hasParcels: boolean;
};
const STATUS: Record<string, [string, string]> = {
  new: ["Przyjęte", "bg-blue-50 text-blue-700"], awaiting_payment: ["Czeka na płatność", "bg-amber-50 text-amber-800"],
  paid: ["Opłacone – kompletujemy", "bg-green-50 text-green-700"], processing: ["W realizacji", "bg-violet-50 text-violet-700"],
  shipped: ["Wysłane", "bg-green-100 text-green-800"], cancelled: ["Anulowane", "bg-slate-100 text-slate-500"],
};
const shipName = (c: string) => (c.includes("paczkomat") ? "Paczkomat InPost" : c.startsWith("inpost") ? "Kurier InPost" : c.startsWith("orlen") ? "ORLEN Paczka" : c === "pickup" ? "Odbiór osobisty" : c);

function OrderCard({ o }: { o: OrderRow }) {
  const [open, setOpen] = useState(false);
  const [parcels, setParcels] = useState<{ number: string; courier: string; status: string; url: string }[] | null>(null);
  const [label, tone] = STATUS[o.status] ?? [o.status, "bg-slate-100 text-slate-600"];
  const toggle = async () => {
    setOpen(!open);
    if (!open && o.hasParcels && parcels == null) {
      const { json } = await api<{ parcels?: typeof parcels }>(`/api/account/orders/${o.id}/parcels`);
      setParcels(json.parcels ?? []);
    }
  };
  return (
    <li className="overflow-hidden rounded-2xl ring-1 ring-brand-100">
      <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 p-4 text-left transition hover:bg-brand-50/60">
        <span className="min-w-0 flex-1">
          <b className="block">{o.number}</b>
          <span className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })} · {o.items.reduce((s, i) => s + i.qty, 0)} szt.</span>
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>
        <b className="w-24 text-right">{formatPrice(o.total)}</b>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="animate-fade-in border-t border-brand-100 bg-brand-50/40 p-4 text-sm">
          <ul className="space-y-1.5">
            {o.items.map((i, k) => (
              <li key={k} className="flex justify-between gap-3"><span>{i.qty} × {i.name}{i.variant ? <span className="text-slate-500"> · {i.variant}</span> : null}</span><b className="whitespace-nowrap">{formatPrice(i.qty * i.price)}</b></li>
            ))}
            <li className="flex justify-between gap-3 text-slate-600"><span>Dostawa – {shipName(o.shipping.method)}</span><span>{o.shippingCost ? formatPrice(o.shippingCost) : "gratis"}</span></li>
          </ul>
          <p className="mt-3 text-xs text-slate-600">{o.shipping.point ? `Punkt odbioru: ${o.shipping.point}` : o.shipping.address}</p>
          {parcels && parcels.length > 0 && (
            <div className="mt-3 space-y-2">
              {parcels.map((p) => (
                <div key={p.number} className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-brand-100">
                  <Truck className="h-5 w-5 text-leaf" />
                  <span className="min-w-0 flex-1"><b>{p.courier}</b> · {p.number}<span className="block text-xs text-slate-500">{p.status}</span></span>
                  {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="rounded-lg bg-leaf px-3 py-1.5 text-xs font-bold text-white">Śledź paczkę</a>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function Orders() {
  const params = useSearchParams();
  const claimed = params.get("polaczono");
  const [data, setData] = useState<{ orders: OrderRow[]; guestCount: number } | null>(null);
  const [claimMsg, setClaimMsg] = useState<string | null>(claimed == null ? null : claimed === "blad" ? "Link wygasł albo jest nieprawidłowy. Wyślij nowy." : `Dodaliśmy ${claimed} ${claimed === "1" ? "zamówienie" : "zamówienia"} do Twojego konta.`);
  useEffect(() => { api<{ orders: OrderRow[]; guestCount: number }>("/api/account/orders").then(({ json }) => setData(json)); }, []);
  const claim = async () => setClaimMsg((await api<{ message: string }>("/api/account/claim", "POST")).json.message);

  if (!data) return <p className="text-sm text-slate-500">Wczytuję zamówienia…</p>;
  return (
    <div>
      {claimMsg && <p className="mb-4 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">{claimMsg}</p>}
      {data.guestCount > 0 && !claimMsg && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <span className="min-w-0 flex-1">Masz {data.guestCount} {data.guestCount === 1 ? "zamówienie złożone" : "zamówienia złożone"} bez logowania na ten adres e-mail.</span>
          <button type="button" onClick={claim} className="rounded-xl bg-white px-4 py-2 font-semibold ring-1 ring-amber-300 hover:bg-amber-100">Dodaj do konta</button>
        </div>
      )}
      {data.orders.length ? (
        <ul className="space-y-3">{data.orders.map((o) => <OrderCard key={o.id} o={o} />)}</ul>
      ) : (
        <div className="rounded-2xl bg-brand-50 p-8 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-semibold">Nie masz jeszcze zamówień na tym koncie</p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-accent-dark hover:underline">Przejdź do sklepu →</Link>
        </div>
      )}
    </div>
  );
}

// ---------- Zalogowany: dane, adresy, hasło ----------

function Profile({ me, onSaved }: { me: Me; onSaved: (m: Me) => void }) {
  const [addresses, setAddresses] = useState<Address[]>(me.addresses ?? []);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const setAddr = (i: number, k: keyof Address, v: string) => setAddresses((a) => a.map((x, n) => (n === i ? { ...x, [k]: v } : x)));

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const r = await api<{ user?: Me }>("/api/account/profile", "POST", {
      firstName: String(f.get("firstName") ?? "").trim(), lastName: String(f.get("lastName") ?? "").trim(), phone: String(f.get("phone") ?? "").trim(),
      addresses: addresses.filter((a) => a.street || a.city).map((a) => ({ ...a, country: a.country || "PL" })),
    });
    setBusy(false);
    if (r.status < 400 && r.json.user) { onSaved(r.json.user); setMsg({ ok: true, text: "Zapisano." }); } else setMsg({ ok: false, text: "Nie udało się zapisać. Sprawdź dane." });
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="grid grid-cols-2 gap-2.5">
        <input name="firstName" defaultValue={me.firstName ?? ""} placeholder="Imię" autoComplete="given-name" className={input} />
        <input name="lastName" defaultValue={me.lastName ?? ""} placeholder="Nazwisko" autoComplete="family-name" className={input} />
        <input value={me.email} disabled aria-label="E-mail" className={`${input} bg-brand-50 text-slate-500`} />
        <input name="phone" defaultValue={me.phone ?? ""} placeholder="Telefon" autoComplete="tel" className={input} />
      </div>
      <div>
        <h3 className="mb-2 font-bold">Adresy dostaw</h3>
        <div className="space-y-3">
          {addresses.map((a, i) => (
            <div key={a.id ?? i} className="grid grid-cols-6 gap-2 rounded-2xl p-3 ring-1 ring-brand-100">
              <input value={a.label ?? ""} onChange={(e) => setAddr(i, "label", e.target.value)} placeholder="Nazwa, np. Dom" className={`${input} col-span-5`} />
              <button type="button" onClick={() => setAddresses(addresses.filter((_, n) => n !== i))} aria-label="Usuń adres" className="grid place-items-center rounded-xl text-slate-400 ring-1 ring-brand-100 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              <input value={a.fullName ?? ""} onChange={(e) => setAddr(i, "fullName", e.target.value)} placeholder="Odbiorca" className={`${input} col-span-6 sm:col-span-3`} />
              <input value={a.street ?? ""} onChange={(e) => setAddr(i, "street", e.target.value)} placeholder="Ulica i numer" className={`${input} col-span-6 sm:col-span-3`} />
              <input value={a.postcode ?? ""} onChange={(e) => setAddr(i, "postcode", e.target.value)} placeholder="Kod pocztowy" className={`${input} col-span-2`} />
              <input value={a.city ?? ""} onChange={(e) => setAddr(i, "city", e.target.value)} placeholder="Miejscowość" className={`${input} col-span-4`} />
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setAddresses([...addresses, { fullName: [me.firstName, me.lastName].filter(Boolean).join(" ") }])} className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-accent-dark hover:underline"><Plus className="h-4 w-4" /> Dodaj adres</button>
      </div>
      {msg && <p className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
      <button disabled={busy} className={`${btn} sm:w-auto sm:px-8`}>{busy ? "Zapisuję…" : "Zapisz zmiany"}</button>
    </form>
  );
}

function Password() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const password = String(f.get("password") ?? "");
    if (password.length < 8) return setMsg({ ok: false, text: "Hasło musi mieć co najmniej 8 znaków." });
    if (password !== f.get("password2")) return setMsg({ ok: false, text: "Hasła nie są takie same." });
    const r = await api("/api/account/password", "POST", { password });
    if (r.status < 400) { form.reset(); setMsg({ ok: true, text: "Hasło zmienione." }); } else setMsg({ ok: false, text: "Nie udało się zmienić hasła." });
  };
  return (
    <form onSubmit={save} className="max-w-sm space-y-2.5">
      <input required name="password" type="password" minLength={8} placeholder="Nowe hasło (min. 8 znaków)" autoComplete="new-password" className={input} />
      <input required name="password2" type="password" placeholder="Powtórz nowe hasło" autoComplete="new-password" className={input} />
      {msg && <p className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
      <button className={btn}>Zmień hasło</button>
    </form>
  );
}

// RODO: pobranie wszystkich danych (JSON, zamówienia w CSV) i usunięcie konta (/api/account/export | delete)
function Privacy({ onDeleted }: { onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const remove = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const r = await api<Res>("/api/account/delete", "POST", { password: f.get("password"), confirm: f.get("confirm") === "on" });
    setBusy(false);
    if (r.json.ok) onDeleted(); else setMsg(fail(r, "Nie udało się usunąć konta."));
  };
  const link = "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 ring-brand-100 hover:bg-brand-50";
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-black">Pobierz moje dane</h2>
        <p className="mt-1 max-w-xl text-sm text-slate-500">Wszystko, co sklep o Tobie zapisał: dane konta, adresy, zgody, zamówienia, opinie, zgłoszenia i zapisy na powiadomienia.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- pobranie pliku z API, nie strona */}
          <a href="/api/account/export" className={link}><Download className="h-4 w-4" /> Wszystkie dane (JSON)</a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- pobranie pliku z API, nie strona */}
          <a href="/api/account/export?format=csv" className={link}><Download className="h-4 w-4" /> Zamówienia (Excel / CSV)</a>
        </div>
      </div>
      <div className="border-t border-brand-100 pt-6">
        <h2 className="text-lg font-black">Usuń konto</h2>
        <p className="mt-1 max-w-xl text-sm text-slate-500">Usuniemy konto, adresy, zapis do newslettera i powiadomień. W zamówieniach zostaną tylko produkty i kwoty – bez imienia, adresu, e-maila i telefonu. Faktury przechowujemy w systemie księgowym tak długo, jak wymagają przepisy. Tej operacji nie da się cofnąć.</p>
        {!open ? (
          <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Chcę usunąć konto</button>
        ) : (
          <form onSubmit={remove} className="mt-3 max-w-sm space-y-2.5 rounded-2xl bg-red-50/60 p-4 ring-1 ring-red-100">
            <input required name="password" type="password" placeholder="Twoje hasło" autoComplete="current-password" className={input} />
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input required type="checkbox" name="confirm" className="mt-0.5 h-4 w-4 accent-[#d32e2e]" />
              Rozumiem, że konto i historia zamówień w koncie znikną na stałe.
            </label>
            {msg && <p className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">{msg}</p>}
            <div className="flex gap-2">
              <button disabled={busy} className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">{busy ? "Usuwam…" : "Usuń konto na stałe"}</button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 text-sm font-semibold ring-1 ring-brand-100">Anuluj</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const TABS = [["orders", "Zamówienia", Package], ["profile", "Dane i adresy", UserRound], ["password", "Hasło", KeyRound], ["privacy", "Prywatność", ShieldCheck]] as const;

function Dashboard({ me, setMe }: { me: Me; setMe: (m: Me | null) => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("orders");
  const logout = async () => { await api("/api/account/logout", "POST"); setMe(null); };
  return (
    <div className="mx-auto max-w-5xl px-4 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Moje konto</p>
          <h1 className="text-3xl font-black">Cześć{me.firstName ? `, ${me.firstName}` : ""}!</h1>
          <p className="text-sm text-slate-500">{me.email}</p>
        </div>
        <button type="button" onClick={logout} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-brand-100 hover:text-navy"><LogOut className="h-4 w-4" /> Wyloguj</button>
      </div>
      <div className="mt-6 grid items-start gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 ring-1 ring-brand-100 md:flex-col" aria-label="Sekcje konta">
          {TABS.map(([k, label, Icon]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${tab === k ? "bg-leaf-50 text-accent-dark" : "text-slate-600 hover:bg-brand-50"}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </nav>
        <section className={card}>
          {tab === "orders" && <Orders />}
          {tab === "profile" && <Profile me={me} onSaved={setMe} />}
          {tab === "password" && <Password />}
          {tab === "privacy" && <Privacy onDeleted={() => window.location.reload()} />}
        </section>
      </div>
    </div>
  );
}

export function Account() {
  const { me, setMe, refresh } = useMe();
  if (me === undefined) return <div className="mx-auto max-w-5xl px-4 py-20 text-center text-sm text-slate-500">Wczytuję…</div>;
  return me ? <Dashboard me={me} setMe={setMe} /> : <Guest onLogin={refresh} />;
}

// /konto/nowe-haslo?token=… – link z maila
export function ResetPassword({ token }: { token: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password") ?? "");
    if (password.length < 8) return setMsg({ ok: false, text: "Hasło musi mieć co najmniej 8 znaków." });
    if (password !== f.get("password2")) return setMsg({ ok: false, text: "Hasła nie są takie same." });
    setBusy(true);
    const r = await api<Res>("/api/account/reset", "POST", { token, password });
    setBusy(false);
    if (r.status < 400) { router.replace("/konto"); return; }
    setMsg({ ok: false, text: fail(r, "Nie udało się ustawić hasła. Link mógł wygasnąć – poproś o nowy.") });
  };
  return (
    <div className="mx-auto max-w-md px-4 pt-12">
      <form onSubmit={submit} className={card}>
        <h1 className="text-2xl font-black">Ustaw nowe hasło</h1>
        <p className="mt-1 text-sm text-slate-600">Po zapisaniu od razu się zalogujesz.</p>
        <div className="mt-5 space-y-2.5">
          <input required name="password" type="password" minLength={8} placeholder="Nowe hasło (min. 8 znaków)" autoComplete="new-password" className={input} />
          <input required name="password2" type="password" placeholder="Powtórz hasło" autoComplete="new-password" className={input} />
        </div>
        {msg && <p className={`mt-4 rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}
        <button disabled={busy || !token} className={`${btn} mt-5`}>{busy ? "Zapisuję…" : "Zapisz hasło"}</button>
        {!token && <p className="mt-3 text-sm text-red-700">Brak kodu w linku. <Link href="/konto" className="underline">Poproś o nowy link</Link>.</p>}
      </form>
    </div>
  );
}
