"use client";

// Prawy panel edycji: szybkie akcje zamówienia, produktu, klienta i zwrotu + eksport list (endpointy w src/integrations/adminTools.ts).

import Link from "next/link";
import { useDocumentInfo, useField, useForm } from "@payloadcms/ui";
import { useEffect, useState } from "react";
import { Archive, Ban, Banknote, BellRing, CheckCircle2, Download, ListOrdered, Mail, PackageCheck, Printer, Receipt, RefreshCw, TrendingUp, Truck } from "lucide-react";

type Res = { ok: boolean; message: string };
const pln = (n: number) => `${n.toFixed(2).replace(".", ",")} zł`;

function Msg({ res }: { res: Res | null }) {
  return res ? <p className={`kc-act__msg ${res.ok ? "is-ok" : "is-bad"}`}>{res.message}</p> : null;
}

// ---------- Zamówienie ----------

const NEXT: { to: string; label: string; icon: typeof Truck; from: string[] }[] = [
  { to: "paid", label: "Oznacz jako opłacone", icon: CheckCircle2, from: ["new", "awaiting_payment"] },
  { to: "shipped", label: "Oznacz jako wysłane", icon: Truck, from: ["new", "paid", "processing"] },
  { to: "cancelled", label: "Anuluj zamówienie", icon: Ban, from: ["new", "awaiting_payment", "paid", "processing"] },
];

export function OrderActions() {
  const { id } = useDocumentInfo();
  const { submit } = useForm();
  const status = useField<string>({ path: "status" });
  const email = useField<string>({ path: "email" });
  const [busy, setBusy] = useState("");
  const [res, setRes] = useState<Res | null>(null);
  if (!id) return null;

  const setStatus = (to: string, label: string) => {
    if (to === "cancelled" && !confirm("Anulować zamówienie? Stany produktów wrócą, a klient dostanie mail o anulowaniu.")) return;
    status.setValue(to);
    setRes({ ok: true, message: `${label} – zapisuję…` });
    // zapis po aktualizacji pola w formularzu
    setTimeout(() => void submit(), 50);
  };
  const resend = async () => {
    setBusy("resend");
    const r = await fetch(`/api/order-tools/${id}/resend`, { method: "POST", credentials: "include" }).then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    setRes(r);
    setBusy("");
  };

  return (
    <div className="kc-act">
      <h4>Szybkie akcje</h4>
      {NEXT.filter((n) => n.from.includes(status.value ?? "")).map(({ to, label, icon: Icon }) => (
        <button key={to} type="button" className={`kc-act__btn ${to === "cancelled" ? "is-danger" : ""}`} onClick={() => setStatus(to, label)}><Icon size={15} /> {label}</button>
      ))}
      <button type="button" className="kc-act__btn" disabled={busy === "resend"} onClick={resend}><Mail size={15} /> {busy === "resend" ? "Wysyłam…" : "Wyślij ponownie potwierdzenie"}</button>
      <a className="kc-act__btn" href={`/api/order-tools/${id}/print`} target="_blank" rel="noreferrer"><Printer size={15} /> Drukuj zamówienie</a>
      {email.value && (
        <Link className="kc-act__btn" href={`/admin/collections/orders?where[email][equals]=${encodeURIComponent(email.value)}`}><ListOrdered size={15} /> Inne zamówienia klienta</Link>
      )}
      <Msg res={res} />
    </div>
  );
}

// ---------- Produkt ----------

export function ProductActions() {
  const { id } = useDocumentInfo();
  const blId = useField<number>({ path: "baselinkerId" });
  const [stats, setStats] = useState<{ orders: number; qty: number; revenue: number; waiting: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Res | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetch(`/api/product-tools/${id}/stats`, { credentials: "include" }).then((r) => r.json()).then((j) => alive && j.ok && setStats(j)).catch(() => {});
    return () => { alive = false; };
  }, [id]);
  if (!id) return null;

  const refresh = async () => {
    setBusy(true);
    const r = await fetch(`/api/product-tools/${id}/refresh`, { method: "POST", credentials: "include" }).then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    setRes(r);
    setBusy(false);
    // odśwież formularz, żeby pokazać nowy stan i cenę
    if (r.ok) setTimeout(() => window.location.reload(), 900);
  };

  return (
    <div className="kc-act">
      <h4>Sprzedaż (30 dni)</h4>
      {stats ? (
        <>
          <div className="kc-act__stats">
            <span><TrendingUp size={15} /><b>{stats.qty} szt.</b><small>w {stats.orders} zam.</small></span>
            <span><b>{pln(stats.revenue)}</b><small>przychód</small></span>
          </div>
          {stats.waiting > 0 && <p className="kc-act__note"><BellRing size={14} /> {stats.waiting} {stats.waiting === 1 ? "osoba czeka" : "osób czeka"} na powiadomienie o dostępności</p>}
          {stats.orders > 0 && <Link className="kc-act__link" href={`/admin/collections/orders?where[items.product][equals]=${id}`}>Zamówienia z tym produktem →</Link>}
        </>
      ) : <p className="kc-act__note">Liczę…</p>}
      {blId.value ? (
        <button type="button" className="kc-act__btn" disabled={busy} onClick={refresh}><RefreshCw size={15} className={busy ? "kc-spin" : ""} /> {busy ? "Pobieram…" : "Pobierz stan i cenę z BaseLinkera"}</button>
      ) : null}
      <Msg res={res} />
    </div>
  );
}

// ---------- Klient ----------

export function CustomerActions() {
  const { id } = useDocumentInfo();
  const [stats, setStats] = useState<{ orders: number; spent: number; last: { id: number; number: string; at: string } | null; email: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetch(`/api/customer-tools/${id}/stats`, { credentials: "include" }).then((r) => r.json()).then((j) => alive && j.ok && setStats(j)).catch(() => {});
    return () => { alive = false; };
  }, [id]);
  if (!id) return null;

  return (
    <div className="kc-act">
      <h4>Klient</h4>
      {stats ? (
        <>
          <div className="kc-act__stats">
            <span><ListOrdered size={15} /><b>{stats.orders}</b><small>zamówień</small></span>
            <span><b>{pln(stats.spent)}</b><small>łącznie</small></span>
          </div>
          {stats.last && <p className="kc-act__note">Ostatnie: <Link className="kc-act__link" href={`/admin/collections/orders/${stats.last.id}`}>{stats.last.number}</Link> · {new Date(stats.last.at).toLocaleDateString("pl-PL")}</p>}
          {stats.orders > 0 && <Link className="kc-act__link" href={`/admin/collections/orders?where[email][equals]=${encodeURIComponent(stats.email)}`}>Wszystkie zamówienia klienta →</Link>}
          <a className="kc-act__btn" href={`mailto:${stats.email}`}><Mail size={15} /> Napisz do klienta</a>
        </>
      ) : <p className="kc-act__note">Liczę…</p>}
    </div>
  );
}

// ---------- Zwrot / reklamacja ----------

const RETURN_NEXT: { to: string; label: string; icon: typeof Truck; from: string[]; danger?: boolean }[] = [
  { to: "accepted", label: "Zaakceptuj – czekamy na paczkę", icon: CheckCircle2, from: ["new"] },
  { to: "received", label: "Towar otrzymany", icon: PackageCheck, from: ["new", "accepted"] },
  { to: "refunded", label: "Zwrot pieniędzy wykonany", icon: Banknote, from: ["received", "accepted"] },
  { to: "rejected", label: "Odrzuć zgłoszenie", icon: Ban, from: ["new", "accepted", "received"], danger: true },
  { to: "closed", label: "Zamknij zgłoszenie", icon: Archive, from: ["refunded", "rejected", "received"] },
];

export function ReturnActions() {
  const { id } = useDocumentInfo();
  const { submit } = useForm();
  const status = useField<string>({ path: "status" });
  const email = useField<string>({ path: "email" });
  const orderNo = useField<string>({ path: "orderNumber" });
  const [res, setRes] = useState<Res | null>(null);
  if (!id) return null;

  const setStatus = (to: string, label: string) => {
    if (to === "rejected" && !confirm("Odrzucić zgłoszenie? Klient dostanie maila.")) return;
    status.setValue(to);
    setRes({ ok: true, message: `${label} – zapisuję, klient dostanie maila…` });
    setTimeout(() => void submit(), 50);
  };

  return (
    <div className="kc-act">
      <h4>Szybkie akcje</h4>
      {RETURN_NEXT.filter((n) => n.from.includes(status.value ?? "new")).map(({ to, label, icon: Icon, danger }) => (
        <button key={to} type="button" className={`kc-act__btn ${danger ? "is-danger" : ""}`} onClick={() => setStatus(to, label)}><Icon size={15} /> {label}</button>
      ))}
      {orderNo.value && (
        <Link className="kc-act__btn" href={`/admin/collections/orders?where[orderNumber][equals]=${encodeURIComponent(orderNo.value)}`}><Receipt size={15} /> Pokaż zamówienie {orderNo.value}</Link>
      )}
      {email.value && <a className="kc-act__btn" href={`mailto:${email.value}`}><Mail size={15} /> Napisz do klienta</a>}
      <Msg res={res} />
    </div>
  );
}

// ---------- Eksport list do Excela (nad tabelą) ----------

function ExportBar({ kind, label }: { kind: "orders" | "products" | "customers"; label: string }) {
  const href = (days?: number) => `/api/export/${kind}${days ? `?days=${days}` : ""}`;
  return (
    <div className="kc-export">
      <Download size={14} /> <span>Eksport {label} do Excela:</span>
      {kind !== "products" && <a href={href(30)}>ostatnie 30 dni</a>}
      <a href={href()}>{kind === "products" ? "wszystkie produkty" : "wszystko"}</a>
    </div>
  );
}
export const ExportOrders = () => <ExportBar kind="orders" label="zamówień" />;
export const ExportProducts = () => <ExportBar kind="products" label="produktów" />;
export const ExportCustomers = () => <ExportBar kind="customers" label="klientów" />;
