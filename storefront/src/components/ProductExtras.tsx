"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Check, Clock, History, MessageCircleQuestion, Share2, Truck } from "lucide-react";
import type { ProductCardData } from "@/lib/data";
import { actions, useStore } from "@/lib/store";
import { ProductRail } from "./home/HomeBits";

function parseCutoff(value?: string | null) {
  const m = (value ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute, label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

// Czas w Polsce niezależnie od strefy przeglądarki
function warsawNow() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Warsaw", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return new Date(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
}
const isWorkday = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6;
function addWorkdays(d: Date, n: number) {
  const r = new Date(d);
  while (n > 0) { r.setDate(r.getDate() + 1); if (isWorkday(r)) n--; }
  return r;
}
const fmt = (d: Date) => d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" });
const month = (d: Date) => d.toLocaleDateString("pl-PL", { month: "short" });
// Krótki zakres dat: „20–21 paź” albo „31 paź – 3 lis”
const range = (a: Date, b: Date) => (a.getMonth() === b.getMonth() ? `${a.getDate()}–${b.getDate()} ${month(b)}` : `${a.getDate()} ${month(a)} – ${b.getDate()} ${month(b)}`);

// „Zamów w ciągu 2 h 15 min – wyślemy dziś” + przewidywana data dostawy
export function DispatchInfo({ inStock, cutoff, enabled = true }: { inStock: boolean; cutoff?: string | null; enabled?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(warsawNow());
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);
  const limit = parseCutoff(cutoff);
  if (!now || !inStock || !enabled || !limit) return null;

  const deadline = new Date(now); deadline.setHours(limit.hour, limit.minute, 0, 0);
  const today = isWorkday(now) && now < deadline;
  const ship = today ? now : addWorkdays(now, 1);
  const from = addWorkdays(ship, 1);
  const to = addWorkdays(ship, 2);
  const left = Math.max(0, deadline.getTime() - now.getTime());
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);

  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg text-sm ring-1 ring-brand-100" title={`Zamówienia złożone do ${limit.label} w dni robocze wysyłamy tego samego dnia`}>
      <div className="bg-slate-50 px-3.5 py-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase"><Clock className="h-3.5 w-3.5 text-accent" /> Wysyłka</p>
        <p className="mt-0.5 font-bold whitespace-nowrap text-navy">{today ? "dziś" : fmt(ship)}</p>
        <p className="text-[11px] leading-snug text-slate-500">{today ? `zamów do ${limit.label}${left > 0 ? ` · zostało ${h > 0 ? `${h} h ` : ""}${m} min` : ""}` : isWorkday(now) ? `po ${limit.label} — kolejny dzień roboczy` : "weekend — najbliższy dzień roboczy"}</p>
      </div>
      <div className="border-l border-brand-100 bg-white px-3.5 py-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase"><Truck className="h-3.5 w-3.5 text-accent" /> Dostawa</p>
        <p className="mt-0.5 font-bold whitespace-nowrap text-brand-900">{range(from, to)}</p>
      </div>
    </div>
  );
}

// Zapytaj o produkt / Udostępnij
export function ProductActions({ name, slug }: { name: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}/produkt/${slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: name, url }); return; } catch { /* anulowane */ }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      <Link href={`/kontakt?produkt=${encodeURIComponent(name)}&slug=${encodeURIComponent(slug)}`}
        className="flex h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold whitespace-nowrap text-slate-600 ring-1 ring-brand-100 transition hover:bg-slate-50 hover:text-navy">
        <MessageCircleQuestion className="h-4 w-4 shrink-0" /> Zapytaj o produkt
      </Link>
      <button onClick={share} className="flex h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-[13px] font-semibold whitespace-nowrap text-slate-600 ring-1 ring-brand-100 transition hover:bg-leaf-50 hover:text-brand-800">
        {copied ? <><Check className="h-4 w-4 shrink-0 text-green-600" /> Skopiowano</> : <><Share2 className="h-4 w-4 shrink-0" /> Udostępnij</>}
      </button>
    </div>
  );
}

// Zapamiętuje wizytę i pokazuje wcześniej oglądane produkty
export function RecentlyViewed({ current }: { current?: ProductCardData }) {
  const { recent } = useStore();
  useEffect(() => { if (current) actions.viewed(current); }, [current]);
  const items = recent.filter((p) => p.slug !== current?.slug).slice(0, 8);
  if (!items.length) return null;
  return (
    <section className="mt-14">
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-navy"><History className="h-6 w-6 text-accent" /> Ostatnio oglądane</h2>
      <ProductRail products={items} itemClass="w-56 sm:w-64" />
    </section>
  );
}

// „Powiadom mnie, gdy będzie dostępny” – dla produktów bez stanu
export function StockAlertForm({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("sending");
    const res = await fetch("/api/forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "stock-alert", product: slug, email: fd.get("email"), website: fd.get("website") }) })
      .then((r) => r.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    if (res.ok) return setState("done");
    setMsg(res.errors?.email ?? res.message ?? "Nie udało się zapisać");
    setState("error");
  };
  if (state === "done") return <p className="flex items-center gap-2 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-800 ring-1 ring-green-200"><Check className="h-4 w-4" /> Gotowe – napiszemy, gdy produkt wróci na magazyn.</p>;
  return (
    <form onSubmit={submit} className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
      <p className="flex items-center gap-2 text-sm font-bold text-amber-900"><Bell className="h-4 w-4" /> Powiadom mnie o dostępności</p>
      <div className="mt-2 flex gap-2">
        <input type="email" name="email" required placeholder="Twój e-mail" aria-label="E-mail" className="min-w-0 flex-1 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent" />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <button disabled={state === "sending"} className="rounded-xl bg-brand-700 px-4 text-sm font-bold text-white hover:bg-accent disabled:opacity-60">Powiadom</button>
      </div>
      {state === "error" && <p className="mt-1.5 text-xs font-medium text-red-600">{msg}</p>}
    </form>
  );
}
