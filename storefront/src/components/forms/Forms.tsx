"use client";

import { useState } from "react";
import { b2bSchema, contactSchema, returnSchema, reviewSchema } from "@/lib/forms";
import { Consent, Field, SmartForm } from "./FormKit";

const subjects = ["Zapytanie o produkt", "Zamówienie i dostawa", "Zwrot lub reklamacja", "Oferta hurtowa", "Inne"] as const;

export function ContactForm({ product, productSlug }: { product?: string; productSlug?: string }) {
  return (
    <SmartForm
      schema={contactSchema}
      type="contact"
      submitLabel="Wyślij wiadomość"
      success={<><p className="text-xl font-bold text-navy">Dziękujemy za wiadomość!</p><p className="mt-1 text-slate-600">Odpowiemy w dni robocze, zwykle w ciągu kilku godzin.</p></>}
    >
      {(e) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="Imię i nazwisko" required autoComplete="name" error={e.name} />
            <Field name="email" label="E-mail" type="email" required autoComplete="email" error={e.email} />
          </div>
          {productSlug && <input type="hidden" name="productSlug" value={productSlug} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="phone" label="Telefon" type="tel" autoComplete="tel" inputMode="tel" error={e.phone} hint="Opcjonalnie – oddzwonimy" />
            <Field name="subject" label="Temat" required error={e.subject}>
              <select id="f-subject" name="subject" defaultValue={subjects[0]}
                className="peer w-full appearance-none rounded-xl border-2 border-brand-100 bg-white px-4 pt-5 pb-2 text-sm outline-none transition hover:border-brand-200 focus:border-accent focus:ring-4 focus:ring-accent/10">
                {subjects.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field name="message" label="Treść wiadomości" textarea required error={e.message}>
            <textarea id="f-message" name="message" rows={5} placeholder="Treść wiadomości" required
              defaultValue={product ? `Dzień dobry, mam pytanie o produkt: ${product}

` : undefined}
              className={`peer w-full resize-y rounded-xl border-2 bg-white px-4 pt-6 pb-2 text-sm text-ink outline-none transition placeholder:text-transparent focus:border-accent focus:ring-4 focus:ring-accent/10 ${e.message ? "border-red-300 bg-red-50/40" : "border-brand-100 hover:border-brand-200"}`} />
          </Field>
          <Consent error={e.consent} />
        </>
      )}
    </SmartForm>
  );
}

export function B2BForm() {
  return (
    <SmartForm
      schema={b2bSchema}
      type="b2b"
      submitLabel="Wyślij zgłoszenie"
      success={<><p className="text-xl font-bold text-navy">Zgłoszenie przyjęte!</p><p className="mt-1 text-slate-600">Aktywujemy Twoje konto hurtowe w ciągu maksymalnie jednego dnia roboczego. Potwierdzenie wyślemy e-mailem.</p></>}
    >
      {(e) => (
        <>
          <Field name="name" label="Imię i nazwisko" required autoComplete="name" error={e.name} />
          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <Field name="company" label="Nazwa firmy" required autoComplete="organization" error={e.company} />
            <Field name="nip" label="NIP" required inputMode="numeric" error={e.nip} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="email" label="E-mail" type="email" required autoComplete="email" error={e.email} />
            <Field name="phone" label="Telefon" type="tel" required autoComplete="tel" inputMode="tel" error={e.phone} />
          </div>
          <Field name="message" label="Dodatkowe informacje (branża, przewidywane zakupy…)" textarea rows={4} error={e.message} />
          <Consent error={e.consent} />
        </>
      )}
    </SmartForm>
  );
}

const selectCls = "peer w-full appearance-none rounded-xl border-2 border-brand-100 bg-white px-4 pt-5 pb-2 text-sm outline-none transition hover:border-brand-200 focus:border-accent focus:ring-4 focus:ring-accent/10";

export function ReturnForm() {
  const [kind, setKind] = useState<"return" | "complaint">("return");
  return (
    <SmartForm
      schema={returnSchema}
      type="return"
      submitLabel={kind === "return" ? "Zgłoś zwrot" : "Zgłoś reklamację"}
      success={<><p className="text-xl font-bold text-navy">Zgłoszenie przyjęte!</p><p className="mt-1 text-slate-600">Numer zgłoszenia i dalsze instrukcje wyślemy e-mailem w ciągu 1 dnia roboczego.</p></>}
    >
      {(e) => (
        <>
          <input type="hidden" name="kind" value={kind} />
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-brand-50 p-1.5">
            {([["return", "Zwrot (14 dni)"], ["complaint", "Reklamacja"]] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setKind(v)}
                className={`rounded-xl py-2.5 text-sm font-bold transition ${kind === v ? "bg-white text-brand-800 shadow-sm" : "text-slate-500 hover:text-brand-800"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="orderNumber" label="Numer zamówienia" required error={e.orderNumber} hint="np. SX00123 – znajdziesz go w e-mailu" />
            <Field name="name" label="Imię i nazwisko" required autoComplete="name" error={e.name} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="email" label="E-mail" type="email" required autoComplete="email" error={e.email} />
            <Field name="phone" label="Telefon" type="tel" autoComplete="tel" error={e.phone} />
          </div>
          <Field name="products" label="Produkty i ilości" textarea rows={3} required error={e.products} />
          <Field name="reason" label={kind === "return" ? "Powód zwrotu (opcjonalnie)" : "Opis wady / problemu"} textarea rows={4} error={e.reason} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="resolution" label="Oczekiwane rozwiązanie" required error={e.resolution}>
              <select id="f-resolution" name="resolution" defaultValue="refund" className={selectCls}>
                <option value="refund">Zwrot pieniędzy</option>
                <option value="exchange">Wymiana na nowy</option>
                {kind === "complaint" && <option value="repair">Naprawa</option>}
                {kind === "complaint" && <option value="discount">Obniżenie ceny</option>}
              </select>
            </Field>
            <Field name="bankAccount" label="Nr konta do zwrotu" inputMode="numeric" error={e.bankAccount} hint="26 cyfr – jeśli płatność była przelewem" />
          </div>
          <Consent error={e.consent} />
        </>
      )}
    </SmartForm>
  );
}

export function ReviewForm({ productSlug }: { productSlug: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  return (
    <SmartForm
      schema={reviewSchema}
      type="review"
      submitLabel="Dodaj opinię"
      success={<><p className="text-xl font-bold text-navy">Dziękujemy za opinię!</p><p className="mt-1 text-slate-600">Pojawi się na stronie po sprawdzeniu przez nasz zespół.</p></>}
    >
      {(e) => (
        <>
          <input type="hidden" name="product" value={productSlug} />
          <input type="hidden" name="rating" value={rating || ""} />
          <div>
            <p className="mb-1 text-sm font-semibold text-ink">Twoja ocena <span className="text-red-500">*</span></p>
            <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Ocena">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} aria-label={`${n} na 5`} role="radio" aria-checked={rating === n}
                  className={`text-3xl leading-none transition hover:scale-110 ${(hover || rating) >= n ? "text-amber-400" : "text-slate-200"}`}>★</button>
              ))}
            </div>
            {e.rating && <p className="mt-1 text-xs font-medium text-red-600">{e.rating}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="author" label="Podpis (np. imię)" required error={e.author} />
            <Field name="email" label="E-mail (niepubliczny)" type="email" required error={e.email} />
          </div>
          <Field name="title" label="Tytuł opinii" required error={e.title} />
          <Field name="content" label="Twoja opinia o produkcie" textarea rows={4} required error={e.content} />
          <Consent error={e.consent} />
        </>
      )}
    </SmartForm>
  );
}
