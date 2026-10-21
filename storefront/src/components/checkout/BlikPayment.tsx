"use client";

// BLIK bez przekierowania: pole na kod przy wyborze płatności + ekran „potwierdź w aplikacji banku”.
// Stan płatności sprawdzamy co 2 s (/api/payments/blik), po odrzuceniu można podać nowy kod.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Loader2, Smartphone, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/data";
import { CheckoutSteps } from "./CheckoutSteps";

const codeInput =
  "h-14 w-full rounded-xl border border-brand-100 bg-white text-center font-mono text-2xl font-bold tracking-[0.5em] outline-none transition placeholder:tracking-[0.3em] placeholder:text-slate-300 focus:border-leaf focus:ring-4 focus:ring-leaf/15";

export const cleanBlik = (v: string) => v.replace(/\D/g, "").slice(0, 6);

// Pole kodu + zgoda wymagana przez Przelewy24 (klient nie widzi ich strony)
export function BlikCodeField({ code, onCode, terms, onTerms }: { code: string; onCode: (v: string) => void; terms: boolean; onTerms: (v: boolean) => void }) {
  return (
    <div className="mt-3 grid animate-fade-in gap-3 rounded-2xl border border-leaf/40 bg-leaf-50/60 p-3.5 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-600">Kod BLIK z aplikacji banku</span>
        <input
          required
          value={code}
          onChange={(e) => onCode(cleanBlik(e.target.value))}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          title="6 cyfr"
          placeholder="••••••"
          aria-label="Kod BLIK"
          className={codeInput}
        />
      </label>
      <label className="flex cursor-pointer items-start gap-2 text-xs text-slate-600">
        <input type="checkbox" required checked={terms} onChange={(e) => onTerms(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#d32e2e]" />
        <span>
          Oświadczam, że zapoznałem się i akceptuję{" "}
          <a href="https://www.przelewy24.pl/regulamin" target="_blank" rel="noreferrer" className="underline">regulamin</a> oraz{" "}
          <a href="https://www.przelewy24.pl/obowiazek-informacyjny-rodo-platnicy" target="_blank" rel="noreferrer" className="underline">obowiązek informacyjny</a>{" "}
          serwisu Przelewy24. Po kliknięciu „Zamawiam” potwierdź płatność w aplikacji banku.
        </span>
      </label>
    </div>
  );
}

type Props = { sessionId?: string; orderNumber: string; total: number; startOk: boolean; startMessage: string; onPaid: () => void };

const TIMEOUT = 150_000; // kod BLIK jest ważny 2 minuty

export function BlikWaiting({ sessionId: firstSession, orderNumber, total, startOk, startMessage, onPaid }: Props) {
  const [sessionId, setSessionId] = useState(firstSession);
  const [state, setState] = useState<"pending" | "failed" | "timeout">(startOk ? "pending" : "failed");
  const [message, setMessage] = useState(startMessage);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(0);

  useEffect(() => {
    if (state !== "pending" || !sessionId) return;
    started.current = Date.now();
    let alive = true;
    const timer = setInterval(async () => {
      if (Date.now() - started.current > TIMEOUT) {
        clearInterval(timer);
        if (alive) setState("timeout");
        return;
      }
      const r = await fetch(`/api/payments/blik?sessionId=${encodeURIComponent(sessionId)}`, { cache: "no-store" }).then((x) => x.json()).catch(() => null);
      if (!alive || !r?.ok) return;
      if (r.state === "paid") { clearInterval(timer); onPaid(); }
      if (r.state === "failed") { clearInterval(timer); setState("failed"); setMessage("Płatność została odrzucona w aplikacji banku albo kod wygasł."); }
    }, 2000);
    return () => { alive = false; clearInterval(timer); };
  }, [state, sessionId, onPaid]);

  const retry = async () => {
    if (code.length !== 6 || !sessionId) return;
    setBusy(true);
    const r = await fetch("/api/payments/blik", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, code }) })
      .then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia – spróbuj ponownie." }));
    setBusy(false);
    setCode("");
    if (r.sessionId) setSessionId(r.sessionId);
    setMessage(r.message ?? "");
    setState(r.ok ? "pending" : "failed");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 text-center">
      <div className="flex justify-center"><CheckoutSteps current={2} /></div>
      <div className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:p-8">
        {state === "pending" ? (
          <>
            <span className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-leaf-50">
              <Smartphone className="h-9 w-9 text-leaf" />
              <Loader2 className="absolute -right-1 -bottom-1 h-7 w-7 animate-spin text-leaf" />
            </span>
            <h1 className="mt-5 text-2xl font-black">Potwierdź płatność w aplikacji banku</h1>
            <p className="mt-2 text-sm text-slate-600">Na telefonie pojawiło się powiadomienie BLIK na kwotę <b>{formatPrice(total)}</b>. Zatwierdź je – ta strona sama przejdzie dalej.</p>
            <p className="mt-4 text-xs text-slate-500">Zamówienie {orderNumber}</p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
            <h1 className="mt-4 text-2xl font-black">{state === "timeout" ? "Nie otrzymaliśmy potwierdzenia" : "Płatność nie przeszła"}</h1>
            <p className="mt-2 text-sm text-slate-600">{state === "timeout" ? "Kod BLIK mógł wygasnąć. Wygeneruj nowy kod w aplikacji banku i spróbuj ponownie." : message}</p>
            <p className="mt-1 text-xs text-slate-500">Zamówienie {orderNumber} czeka na płatność – nie musisz go składać od nowa.</p>
            {sessionId ? (
              <div className="mt-5 grid gap-2.5">
                <input value={code} onChange={(e) => setCode(cleanBlik(e.target.value))} inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" aria-label="Nowy kod BLIK" className={codeInput} />
                <button type="button" onClick={retry} disabled={busy || code.length !== 6} className="btn-kc rounded-xl py-3.5 font-bold text-white disabled:opacity-60">
                  {busy ? "Wysyłam kod…" : `Zapłać BLIKIEM ${formatPrice(total)}`}
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm">Zadzwoń do nas: <a href="tel:+48500021705" className="font-semibold underline">500 021 705</a> – pomożemy dokończyć płatność.</p>
            )}
            <Link href="/" className="mt-4 inline-block text-sm font-semibold text-slate-500 hover:underline">Wróć do sklepu</Link>
          </>
        )}
      </div>
    </div>
  );
}
