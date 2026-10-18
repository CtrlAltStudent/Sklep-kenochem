"use client";

import Link from "next/link";
import { useState } from "react";
import type { z } from "zod";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { fieldErrors } from "@/lib/forms";

const base =
  "peer w-full rounded-xl border-2 bg-white px-4 pt-5 pb-2 text-sm text-ink outline-none transition placeholder:text-transparent focus:border-accent focus:ring-4 focus:ring-accent/10";

// Pole z „pływającą” etykietą i komunikatem błędu
export function Field({
  name, label, error, type = "text", required, textarea, rows = 5, autoComplete, inputMode, hint, children,
}: {
  name: string; label: string; error?: string; type?: string; required?: boolean; textarea?: boolean; rows?: number;
  autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; hint?: string; children?: React.ReactNode;
}) {
  const cls = `${base} ${error ? "border-red-300 bg-red-50/40" : "border-brand-100 hover:border-brand-200"}`;
  const id = `f-${name}`;
  return (
    <div>
      <div className="relative">
        {children ?? (textarea ? (
          <textarea id={id} name={name} rows={rows} placeholder={label} required={required} className={`${cls} resize-y pt-6`} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} />
        ) : (
          <input id={id} name={name} type={type} placeholder={label} required={required} autoComplete={autoComplete} inputMode={inputMode} className={cls} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} />
        ))}
        <label htmlFor={id}
          className="pointer-events-none absolute top-1.5 left-4 text-[11px] font-semibold text-slate-500 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-accent-dark">
          {label}{required && <span className="text-red-500"> *</span>}
        </label>
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle className="h-3.5 w-3.5" /> {error}</p>
      ) : hint ? <p className="mt-1.5 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function Consent({ error }: { error?: string }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-slate-600">
        <input type="checkbox" name="consent" className="mt-0.5 h-4.5 w-4.5 shrink-0 rounded accent-brand-700" />
        <span>
          Wyrażam zgodę na przetwarzanie moich danych osobowych w celu obsługi zgłoszenia przez KENOCHEM Kuczyński Sp. J.
          Szczegóły w <Link href="/polityka-prywatnosci" className="font-semibold text-accent-dark underline">polityce prywatności</Link>. <span className="text-red-500">*</span>
        </span>
      </label>
      {error && <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600"><AlertCircle className="h-3.5 w-3.5" /> {error}</p>}
    </div>
  );
}

// Formularz: walidacja w przeglądarce (ten sam schemat co na serwerze) → POST /api/forms
export function SmartForm<S extends z.ZodType>({
  schema, type, submitLabel, success, children, className = "",
}: {
  schema: S; type: "contact" | "b2b" | "return" | "review"; submitLabel: string; success: React.ReactNode;
  children: (errors: Record<string, string>) => React.ReactNode; className?: string;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { ...Object.fromEntries(fd.entries()), type, consent: fd.get("consent") === "on" };
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error as z.ZodError));
      return;
    }
    setErrors({});
    setState("sending");
    try {
      const res = await fetch("/api/forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (json.ok) return setState("done");
      setErrors(json.errors ?? {});
      setMessage(json.message ?? "Nie udało się wysłać formularza.");
      setState("error");
    } catch {
      setMessage("Brak połączenia. Spróbuj ponownie.");
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-brand-50 p-10 text-center ring-1 ring-brand-100">
        <span className="grid h-16 w-16 animate-pop place-items-center rounded-full bg-accent text-white"><CheckCircle2 className="h-8 w-8" /></span>
        <div className="mt-5">{success}</div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={`space-y-4 ${className}`}>
      {children(errors)}
      {/* pułapka na boty */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state === "error" && message && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"><AlertCircle className="h-4 w-4" /> {message}</p>
      )}
      <button disabled={state === "sending"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-4 font-bold text-white shadow-lg shadow-brand-700/20 transition hover:bg-accent active:scale-[.99] disabled:opacity-70">
        {state === "sending" ? <><Loader2 className="h-5 w-5 animate-spin" /> Wysyłam…</> : <><Send className="h-5 w-5" /> {submitLabel}</>}
      </button>
    </form>
  );
}
