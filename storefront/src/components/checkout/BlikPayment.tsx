"use client";

// BLIK bez przekierowania: pole na kod przy wyborze płatności + ekran „potwierdź w aplikacji banku”.
// Stan płatności sprawdzamy co 2 s (/api/payments/blik), po odrzuceniu można podać nowy kod.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Loader2, Smartphone, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/data";
import { CheckoutSteps } from "./CheckoutSteps";

export const cleanBlik = (v: string) => v.replace(/\D/g, "").slice(0, 6);

const digitBox =
  "h-12 w-10 rounded-xl border border-brand-100 bg-white text-center font-mono text-xl font-bold text-navy outline-none transition focus:border-leaf focus:ring-4 focus:ring-leaf/15 sm:h-14 sm:w-12 sm:text-2xl";

// Sześć osobnych kratek. Jedno pole z odstępem między cyframi stawiało kursor na środku.
function BlikDigits({ code, onCode }: { code: string; onCode: (v: string) => void }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const focusAt = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(5, i))];
    el?.focus();
    el?.select();
  };
  const write = (next: string, focus: number) => {
    onCode(cleanBlik(next));
    requestAnimationFrame(() => focusAt(focus));
  };

  return (
    <div className="flex gap-1.5 sm:gap-2" role="group" aria-label="Kod BLIK">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={code[i] ?? ""}
          required={code.length !== 6 && i === code.length}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Cyfra ${i + 1} kodu BLIK`}
          maxLength={1}
          className={digitBox}
          onMouseDown={(e) => {
            const target = Math.min(i, code.length === 6 ? 5 : code.length);
            if (target !== i) {
              e.preventDefault();
              refs.current[target]?.focus();
            }
          }}
          onFocus={() => {
            const target = Math.min(i, code.length === 6 ? 5 : code.length);
            if (target !== i) refs.current[target]?.focus();
            else refs.current[i]?.select();
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text").replace(/\D/g, "");
            if (!text) return;
            e.preventDefault();
            const next = cleanBlik(code.slice(0, i) + text);
            write(next, Math.min(next.length, 5));
          }}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            if (!raw) {
              write(code.slice(0, i) + code.slice(i + 1), Math.max(0, i - 1));
              return;
            }
            const next = cleanBlik(code.slice(0, i) + raw + code.slice(i + 1));
            write(next, Math.min(i + raw.length, 5));
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              if (code[i]) write(code.slice(0, i) + code.slice(i + 1), i);
              else if (i > 0) write(code.slice(0, i - 1) + code.slice(i), i - 1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              focusAt(i - 1);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              focusAt(i + 1);
            }
          }}
        />
      ))}
    </div>
  );
}

// Pole kodu + zgoda wymagana przez Przelewy24 (klient nie widzi ich strony)
export function BlikCodeField({ code, onCode, terms, onTerms }: { code: string; onCode: (v: string) => void; terms: boolean; onTerms: (v: boolean) => void }) {
  return (
    <div className="mt-3 flex animate-fade-in flex-col gap-3 rounded-2xl border border-leaf/40 bg-leaf-50/60 p-3.5 lg:flex-row lg:items-center">
      <div className="shrink-0">
        <span className="mb-1.5 block text-xs font-semibold text-slate-600">Kod BLIK z aplikacji banku</span>
        <BlikDigits code={code} onCode={onCode} />
      </div>
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
                <div className="flex justify-center"><BlikDigits code={code} onCode={setCode} /></div>
                <button type="button" onClick={retry} disabled={busy || code.length !== 6} className="btn-kc rounded-xl py-3.5 font-bold text-white disabled:opacity-60">
                  {busy ? "Wysyłam kod…" : `Zapłać BLIKIEM ${formatPrice(total)}`}
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm">Zadzwoń do nas: <a href="tel:+48664953377" className="font-semibold underline">664 953 377</a> – pomożemy dokończyć płatność.</p>
            )}
            <Link href="/" className="mt-4 inline-block text-sm font-semibold text-slate-500 hover:underline">Wróć do sklepu</Link>
          </>
        )}
      </div>
    </div>
  );
}
