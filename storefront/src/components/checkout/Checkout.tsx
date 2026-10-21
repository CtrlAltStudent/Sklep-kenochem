"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Lock, MapPin, MessageSquareText, Pencil, ShoppingBag, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/data";
import { resolveCart } from "@/lib/cart";
import { actions, useStore } from "@/lib/store";
import { ProductImage } from "@/components/ProductImage";
import { BrandMark, carrierFromCode, type MarkName } from "./BrandMarks";
import { CheckoutSteps } from "./CheckoutSteps";
import { BlikCodeField, BlikWaiting } from "./BlikPayment";
import { InpostMap, type InpostPoint } from "./InpostMap";
import { useMe, type Me } from "@/components/account/Account";

export type ShipMethod = { code: string; label: string; price: number; requiresPoint: boolean; freeAboveThreshold: boolean };
export type PayMethod = { code: string; label: string; provider: string };

const isCod = (code: string) => code.endsWith("-cod");
const eta = (code: string) => (code.startsWith("pickup") ? "od ręki · Pn–Pt 8–16" : code.includes("paczkomat") || code.startsWith("orlen") ? "1–2 dni robocze · punkt odbioru" : "1–2 dni robocze · pod drzwi");
const payMark = (p: PayMethod): MarkName => (p.code === "blik" ? "blik" : p.provider === "przelewy24" ? "p24" : p.provider === "transfer" ? "transfer" : "deferred");
const payHint = (p: PayMethod) => (p.code === "blik" ? "Kod z aplikacji banku" : p.provider === "przelewy24" ? "Szybki przelew, karta, Google/Apple Pay" : p.provider === "transfer" ? "Wysyłka po zaksięgowaniu wpłaty" : "Dla zatwierdzonych firm");

const input = "h-11 w-full rounded-xl border border-brand-100 bg-white px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-leaf focus:ring-4 focus:ring-leaf/15";
const card = "min-w-0 rounded-3xl bg-white p-4 ring-1 ring-brand-100 sm:p-5";
const radio = (on: boolean) => `grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${on ? "border-leaf" : "border-brand-200"}`;

function Title({ n, children, aside }: { n: number; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <h2 className="flex items-center gap-2.5 text-base font-extrabold text-navy">
        <span className="bg-kc-gradient grid h-6 w-6 place-items-center rounded-full text-xs font-black text-white">{n}</span>{children}
      </h2>
      {aside}
    </div>
  );
}

// Krok 2 – wszystko na jednym ekranie: dane, dostawa, płatność, uwagi i podsumowanie
export function Checkout({ shipping, payments, freeThreshold, inpostToken = "" }: { shipping: ShipMethod[]; payments: PayMethod[]; freeThreshold: number; inpostToken?: string }) {
  const { cart } = useStore();
  const { lines, subtotal } = resolveCart(cart);
  const [cod, setCod] = useState(false);
  const visibleShip = shipping.filter((s) => isCod(s.code) === cod);
  const [ship, setShip] = useState(() => shipping.find((s) => !isCod(s.code))?.code ?? "");
  const [pay, setPay] = useState(() => payments[0]?.code ?? "");
  const [invoice, setInvoice] = useState(false);
  const [ordered, setOrdered] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number; freeShipping: boolean; message: string } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pointInfo, setPointInfo] = useState<string | null>(null);
  // Punkt odbioru: kod wpisany ręcznie albo wybrany z mapy InPost
  const [pointCode, setPointCode] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [manualPoint, setManualPoint] = useState(false);
  const pickPoint = useCallback((p: InpostPoint) => {
    setPointCode(p.code);
    setPointInfo(p.label);
    setMapOpen(false);
  }, []);
  const closeMap = useCallback(() => setMapOpen(false), []);
  // BLIK z kodem na stronie (metoda „blik”) – bez przekierowania do Przelewy24
  const [blikCode, setBlikCode] = useState("");
  const [p24Terms, setP24Terms] = useState(false);
  const [blik, setBlik] = useState<{ sessionId?: string; orderNumber: string; total: number; ok: boolean; message: string } | null>(null);
  const onBlikPaid = useCallback(() => {
    setOrdered(blik?.orderNumber ?? "");
    setBlik(null);
  }, [blik?.orderNumber]);
  const isBlik = !cod && pay === "blik";

  // Zalogowany klient: dane i adres z konta wpisują się same (pola formularza są niekontrolowane)
  const { me } = useMe();
  const formRef = useRef<HTMLFormElement>(null);
  const fillFrom = useCallback((u: Me, addrIndex: number) => {
    const f = formRef.current;
    if (!f) return;
    const a = u.addresses?.[addrIndex];
    const values: Record<string, string | undefined> = {
      name: a?.fullName || [u.firstName, u.lastName].filter(Boolean).join(" "), email: u.email, phone: u.phone,
      street: a?.street, postcode: a?.postcode, city: a?.city,
    };
    for (const [k, v] of Object.entries(values)) {
      const el = f.elements.namedItem(k) as HTMLInputElement | null;
      if (el && v && (!el.value || addrIndex >= 0)) el.value = v;
    }
  }, []);
  useEffect(() => { if (me) fillFrom(me, 0); }, [me, fillFrom]);

  const method = shipping.find((s) => s.code === ship);
  const free = (s: ShipMethod) => s.price === 0 || coupon?.freeShipping || (s.freeAboveThreshold && subtotal >= freeThreshold);
  const shipCost = method && !free(method) ? method.price : 0;
  const discount = Math.min(coupon?.discount ?? 0, subtotal);
  const total = Math.max(0, subtotal - discount) + shipCost;

  const toggleCod = (on: boolean) => {
    setCod(on);
    setShip(shipping.find((s) => isCod(s.code) === on)?.code ?? "");
  };

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setChecking(true);
    try {
      const res = await fetch("/api/coupon", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal, items: lines.map((l) => ({ slug: l.slug, total: l.total })) }),
      }).then((r) => r.json());
      if (res.ok) { setCoupon(res); setCouponMsg(null); } else { setCoupon(null); setCouponMsg(res.message); }
    } catch {
      setCouponMsg("Brak połączenia – spróbuj ponownie");
    } finally {
      setChecking(false);
    }
  };

  if (ordered) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="flex justify-center"><CheckoutSteps current={2} /></div>
        <CheckCircle2 className="mx-auto mt-10 h-20 w-20 text-leaf" />
        <h1 className="mt-6 text-3xl font-black">Dziękujemy za zamówienie!</h1>
        <p className="mt-2 text-slate-600">Numer zamówienia: <b>{ordered}</b>. Potwierdzenie wyślemy na podany e-mail.</p>
        <Link href="/" className="btn-kc mt-8 inline-block rounded-xl px-6 py-3.5 font-semibold text-white">Wróć do sklepu</Link>
      </div>
    );
  }

  if (blik) {
    return <BlikWaiting sessionId={blik.sessionId} orderNumber={blik.orderNumber} total={blik.total} startOk={blik.ok} startMessage={blik.message} onPaid={onBlikPaid} />;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-white ring-1 ring-brand-100"><ShoppingBag className="h-10 w-10 text-brand-700" /></span>
        <h1 className="mt-6 text-2xl font-black">Twój koszyk jest pusty</h1>
        <Link href="/" className="btn-kc mt-6 inline-block rounded-xl px-6 py-3.5 font-semibold text-white">Zacznij zakupy</Link>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={async (e) => {
        e.preventDefault();
        if (submitting) return;
        const fd = new FormData(e.currentTarget);
        setFormError(null);
        if (method?.requiresPoint && !pointCode.trim()) {
          setFormError(method.code.startsWith("orlen") ? "Wpisz kod punktu ORLEN Paczka." : "Wybierz paczkomat na mapie albo wpisz jego kod.");
          return;
        }
        setSubmitting(true);
        try {
          const res = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: fd.get("name"), email: fd.get("email"), phone: fd.get("phone"),
              street: fd.get("street"), postcode: fd.get("postcode"), city: fd.get("city"),
              invoice, nip: fd.get("nip") || undefined, company: fd.get("company") || undefined,
              ship, pay: cod ? "cod" : pay, point: fd.get("point") || undefined,
              note: fd.get("note") || undefined, coupon: coupon?.code,
              ...(isBlik ? { blikCode, p24Terms } : {}),
              items: lines.map((l) => ({ slug: l.slug, qty: l.qty })),
            }),
          }).then((r) => r.json());
          if (!res.ok) { setFormError(res.message ?? "Nie udało się złożyć zamówienia."); return; }
          if (res.redirectUrl) { window.location.href = res.redirectUrl; return; }
          if (res.blik) {
            // zamówienie już zapisane – koszyk czyścimy, dalej tylko płatność BLIK
            actions.clear();
            setBlik({ sessionId: res.blik.sessionId, orderNumber: res.orderNumber, total: res.total, ok: res.blik.ok, message: res.blik.message });
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
          }
          actions.clear();
          setOrdered(res.orderNumber);
        } catch {
          setFormError("Brak połączenia – spróbuj ponownie.");
        } finally {
          setSubmitting(false);
        }
      }}
      className="mx-auto max-w-shop px-4 pt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Dostawa i płatność</h1>
        <CheckoutSteps current={1} />
      </div>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          {/* 1. DANE */}
          <section className={card}>
            <Title n={1} aside={me ? (
              me.addresses && me.addresses.length > 1 ? (
                <select aria-label="Adres z konta" onChange={(e) => fillFrom(me, Number(e.target.value))} className="h-8 rounded-lg border border-brand-100 bg-white px-2 text-xs font-semibold">
                  {me.addresses.map((a, i) => <option key={a.id ?? i} value={i}>{a.label || [a.street, a.city].filter(Boolean).join(", ") || `Adres ${i + 1}`}</option>)}
                </select>
              ) : <span className="text-xs text-slate-500">Zalogowano: {me.email}</span>
            ) : me === null ? (
              <Link href="/konto" className="text-xs font-semibold text-accent-dark hover:underline">Masz konto? Zaloguj się</Link>
            ) : undefined}>Twoje dane</Title>
            <div className="grid grid-cols-2 gap-2.5">
              <input required name="name" placeholder="Imię i nazwisko" autoComplete="name" className={`${input} col-span-2`} />
              <input required name="email" type="email" placeholder="E-mail" autoComplete="email" className={input} />
              <input required name="phone" type="tel" placeholder="Telefon" autoComplete="tel" className={input} />
              <input required name="street" placeholder="Ulica i numer" autoComplete="street-address" className={`${input} col-span-2`} />
              <input required name="postcode" placeholder="Kod pocztowy" autoComplete="postal-code" pattern="\d{2}-?\d{3}" title="Format: 00-000" className={input} />
              <input required name="city" placeholder="Miejscowość" autoComplete="address-level2" className={input} />
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm font-medium">
              <input type="checkbox" checked={invoice} onChange={(e) => setInvoice(e.target.checked)} className="h-4 w-4 accent-[#d32e2e]" />
              Chcę fakturę na firmę
            </label>
            {invoice && (
              <div className="mt-2.5 grid animate-fade-in grid-cols-2 gap-2.5">
                <input required name="nip" placeholder="NIP" inputMode="numeric" className={input} />
                <input required name="company" placeholder="Nazwa firmy" className={input} />
              </div>
            )}
          </section>

          {/* 2. DOSTAWA */}
          <section className={card}>
            <Title n={2} aside={
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600">
                <span>Płacę przy odbiorze</span>
                <button type="button" role="switch" aria-checked={cod} onClick={() => toggleCod(!cod)}
                  className={`relative h-6 w-11 rounded-full transition ${cod ? "bg-leaf" : "bg-slate-200"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${cod ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </label>
            }>Dostawa</Title>
            <div className="space-y-2">
              {visibleShip.map((s) => {
                const on = ship === s.code;
                return (
                  <button key={s.code} type="button" onClick={() => { if (s.code !== ship) { setPointCode(""); setPointInfo(null); } setShip(s.code); }}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 pr-4 text-left transition ${on ? "border-leaf bg-leaf-50 ring-2 ring-leaf/20" : "border-brand-100 hover:border-leaf-300"}`}>
                    <span className={radio(on)}>{on && <span className="h-2.5 w-2.5 rounded-full bg-leaf" />}</span>
                    <BrandMark name={carrierFromCode(s.code)} />
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-sm">{s.label}</b>
                      <span className="text-xs text-slate-500">{eta(s.code)}</span>
                    </span>
                    <b className={`text-sm whitespace-nowrap ${free(s) ? "text-green-700" : ""}`}>{free(s) ? "Gratis" : formatPrice(s.price)}</b>
                  </button>
                );
              })}
            </div>
            {method?.requiresPoint && (() => {
              const isInpost = !method.code.startsWith("orlen");
              const withMap = isInpost && Boolean(inpostToken) && !manualPoint;
              const lookup = async (code: string) => {
                if (code.length < 3) { setPointInfo(null); return; }
                const r = await fetch(`/api/checkout/point?carrier=${isInpost ? "inpost" : "orlen"}&code=${encodeURIComponent(code)}`).then((x) => x.json()).catch(() => null);
                setPointInfo(r?.ok ? `${r.point.address ?? ""}${r.point.city ? `, ${r.point.postcode ?? ""} ${r.point.city}` : ""}`.replace(/^, /, "") || r.point.name : "Nie znaleziono punktu – sprawdź kod.");
              };
              return (
                <div className="mt-2.5 animate-fade-in">
                  {/* kod punktu idzie z formularzem tak samo przy mapie i przy wpisaniu ręcznym */}
                  <input type="hidden" name="point" value={pointCode} />
                  {withMap ? (
                    pointCode ? (
                      <div className="flex items-center gap-3 rounded-2xl border border-leaf bg-leaf-50 p-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white ring-1 ring-leaf/30"><MapPin className="h-5 w-5 text-leaf" /></span>
                        <span className="min-w-0 flex-1">
                          <b className="block text-sm">Paczkomat {pointCode}</b>
                          {pointInfo && <span className="block truncate text-xs text-slate-600">{pointInfo}</span>}
                        </span>
                        <button type="button" onClick={() => setMapOpen(true)} className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-accent-dark ring-1 ring-brand-100 transition hover:bg-white">Zmień</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setMapOpen(true)}
                        className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-leaf/50 p-3 text-left transition hover:border-leaf hover:bg-leaf-50">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-leaf text-white"><MapPin className="h-5 w-5" /></span>
                        <span className="min-w-0 flex-1">
                          <b className="block text-sm">Wybierz paczkomat na mapie</b>
                          <span className="block text-xs text-slate-500">Znajdź najbliższy punkt po mieście lub ulicy</span>
                        </span>
                      </button>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-leaf" />
                      <input required value={pointCode} onChange={(e) => setPointCode(e.target.value.toUpperCase())} onBlur={(e) => lookup(e.target.value.trim())}
                        placeholder={isInpost ? "Kod paczkomatu, np. BIA01M" : "Kod punktu ORLEN Paczka"} aria-label="Kod punktu odbioru" className={input} />
                    </div>
                  )}
                  {!withMap && pointInfo && <p className="mt-1.5 pl-6 text-xs text-slate-600">{pointInfo}</p>}
                  {isInpost && inpostToken && (
                    <button type="button" onClick={() => { setManualPoint(!manualPoint); setPointInfo(null); setPointCode(""); }} className="mt-1.5 text-xs font-medium text-slate-500 underline-offset-2 hover:underline">
                      {manualPoint ? "Wybierz na mapie" : "Znam kod paczkomatu – wpiszę ręcznie"}
                    </button>
                  )}
                  {mapOpen && <InpostMap token={inpostToken} cod={cod} onSelect={pickPoint} onClose={closeMap} />}
                </div>
              );
            })()}
            {cod && <p className="mt-2.5 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800"><Wallet className="h-4 w-4 shrink-0" /> Zapłacisz kurierowi gotówką lub kartą przy odbiorze paczki.</p>}
          </section>

          {/* 3. PŁATNOŚĆ */}
          <section className={`${card} xl:col-span-2`}>
            <Title n={3}>Płatność</Title>
            {cod ? (
              <div className="flex items-center gap-3 rounded-2xl border border-leaf bg-leaf-50 p-3">
                <BrandMark name="cod" />
                <span className="text-sm"><b className="block">Płatność przy odbiorze</b><span className="text-xs text-slate-500">Wyłącz przełącznik w sekcji Dostawa, aby zapłacić online.</span></span>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                {payments.map((p) => {
                  const on = pay === p.code;
                  return (
                    <button key={p.code} type="button" onClick={() => setPay(p.code)}
                      className={`flex items-center gap-3 rounded-2xl border p-2.5 text-left transition ${on ? "border-leaf bg-leaf-50 ring-2 ring-leaf/20" : "border-brand-100 hover:border-leaf-300"}`}>
                      <span className={radio(on)}>{on && <span className="h-2.5 w-2.5 rounded-full bg-leaf" />}</span>
                      <BrandMark name={payMark(p)} />
                      <span className="min-w-0"><b className="block text-sm leading-tight">{p.label}</b><span className="text-[11px] leading-tight text-slate-500">{payHint(p)}</span></span>
                    </button>
                  );
                })}
              </div>
            )}
            {isBlik && <BlikCodeField code={blikCode} onCode={setBlikCode} terms={p24Terms} onTerms={setP24Terms} />}
            <details className="group mt-3">
              <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-accent-dark">
                <MessageSquareText className="h-4 w-4" /> Dodaj uwagi do zamówienia <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
              </summary>
              <textarea name="note" maxLength={500} rows={2} placeholder="np. proszę o telefon przed dostawą, godziny pracy firmy, numer budynku…"
                className="mt-2 w-full rounded-xl border border-brand-100 px-3.5 py-2.5 text-sm outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/15" />
            </details>
          </section>
        </div>

        {/* PODSUMOWANIE */}
        <aside className="lg:sticky lg:top-40">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-brand-100">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-navy">Twoje zamówienie</h2>
              <Link href="/koszyk" className="flex items-center gap-1 text-xs font-semibold text-accent-dark hover:underline"><Pencil className="h-3.5 w-3.5" /> Edytuj</Link>
            </div>
            <ul className="no-scrollbar max-h-44 space-y-2.5 overflow-y-auto">
              {lines.map((l) => (
                <li key={l.slug + l.variantId} className="flex items-center gap-3">
                  <span className="relative">
                    <ProductImage src={l.image} alt="" sizes="48px" className="h-12 w-12 rounded-lg ring-1 ring-brand-100" />
                    <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-navy px-1 text-[10px] font-bold text-white">{l.qty}</span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">{l.name}</span>
                  <span className="text-xs font-bold whitespace-nowrap">{formatPrice(l.total)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-brand-100 pt-4">
              {coupon ? (
                <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2 text-xs ring-1 ring-green-200">
                  <span><b className="font-mono tracking-wider text-green-800">{coupon.code}</b> <span className="text-green-700">· {coupon.message}</span></span>
                  <button type="button" onClick={() => { setCoupon(null); setCode(""); }} className="font-semibold text-slate-500 hover:text-red-600">Usuń</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                      placeholder="Kod rabatowy" className={`${input} h-10 font-mono tracking-wider`} />
                    <button type="button" onClick={applyCoupon} disabled={checking} className="rounded-xl bg-leaf-50 px-4 text-sm font-semibold text-brand-800 ring-1 ring-leaf-100 hover:bg-leaf-100 disabled:opacity-60">{checking ? "…" : "Użyj"}</button>
                  </div>
                  {couponMsg && <p className="mt-1.5 text-xs font-medium text-red-600">{couponMsg}</p>}
                </>
              )}
            </div>

            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Produkty</span><span>{formatPrice(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between font-semibold text-green-700"><span>Rabat</span><span>−{formatPrice(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-slate-600">Dostawa{method ? ` · ${method.label}` : ""}</span><span className="whitespace-nowrap">{shipCost === 0 ? <span className="text-green-700">Gratis</span> : formatPrice(shipCost)}</span></div>
            </div>
            <div className="mt-3 flex items-end justify-between border-t border-brand-100 pt-3">
              <span className="font-semibold">Do zapłaty</span>
              <span className="text-3xl font-black">{formatPrice(total)}</span>
            </div>
            <p className="text-right text-[11px] text-slate-500">w tym VAT {formatPrice(total - total / 1.23)}</p>

            <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-slate-600">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-[#d32e2e]" />
              <span>Akceptuję <Link href="/regulamin" target="_blank" className="underline">regulamin</Link> i <Link href="/polityka-prywatnosci" target="_blank" className="underline">politykę prywatności</Link>.</span>
            </label>
            {formError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{formError}</p>}
            <button disabled={submitting} className="btn-kc mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-white active:scale-[.98] disabled:opacity-60">
              <Lock className="h-4.5 w-4.5" /> {submitting ? "Składam zamówienie…" : cod ? "Zamawiam z obowiązkiem zapłaty" : isBlik ? `Zamawiam i płacę BLIKIEM ${formatPrice(total)}` : `Zamawiam i płacę ${formatPrice(total)}`}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500"><Lock className="h-3 w-3" /> Bezpieczna płatność – Przelewy24</p>
          </div>
        </aside>
      </div>
    </form>
  );
}
