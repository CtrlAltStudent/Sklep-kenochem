"use client";

import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";

export function Newsletter() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("sending");
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "newsletter", email: fd.get("email"), consent: fd.get("consent") === "on", website: fd.get("website") }),
      }).then((r) => r.json());
      if (res.ok) return setState("done");
      setMsg(res.errors?.email ?? res.errors?.consent ?? res.message ?? "Nie udało się zapisać");
      setState("error");
    } catch {
      setMsg("Brak połączenia – spróbuj ponownie");
      setState("error");
    }
  };

  return (
    <div className="bg-gradient-to-br from-brand-800 to-brand-950">
      <div className="mx-auto flex max-w-shop flex-col items-center gap-6 px-4 py-12 lg:flex-row lg:justify-between">
        <div className="text-center text-white lg:text-left">
          <h3 className="text-2xl font-bold">Zapisz się do newslettera</h3>
          <p className="mt-1 text-brand-200">Promocje, nowości i poradniki prosto na Twój e-mail.</p>
        </div>
        {state === "done" ? (
          <p className="flex items-center gap-2 rounded-xl bg-lime px-5 py-3.5 font-semibold text-brand-950"><Check className="h-5 w-5" /> Dziękujemy! Jesteś na liście.</p>
        ) : (
          <form onSubmit={submit} className="w-full max-w-md">
            <div className="flex gap-2 rounded-2xl bg-white/10 p-1.5 backdrop-blur">
              <input type="email" name="email" required placeholder="Twój adres e-mail" aria-label="Adres e-mail" className="min-w-0 flex-1 bg-transparent px-4 text-white placeholder:text-brand-200 outline-none" />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <button disabled={state === "sending"} className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-white transition hover:bg-accent-dark disabled:opacity-70">
                {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Zapisz
              </button>
            </div>
            <label className="mt-2 flex items-start gap-2 text-xs text-brand-200">
              <input type="checkbox" name="consent" required className="mt-0.5 accent-brand-700" />
              Wyrażam zgodę na otrzymywanie informacji handlowych drogą elektroniczną od KENOCHEM Kuczyński Sp. J. Zgodę mogę wycofać w każdej chwili.
            </label>
            {state === "error" && <p className="mt-2 text-sm font-semibold text-red-200">{msg}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
