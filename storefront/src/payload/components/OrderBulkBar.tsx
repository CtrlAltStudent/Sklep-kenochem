"use client";

// Lista zamówień: pasek akcji dla zaznaczonych (wzór: BaseLinker) – zmiana statusu, druk, eksport do Excela, mail do klientów.
// Pokazuje się, gdy zaznaczysz zamówienia kwadracikami w tabeli. Akcje: src/integrations/orderBulk.ts.

import { useSelection } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Mail, Printer, RefreshCw, X } from "lucide-react";

const STATUSES: [string, string][] = [
  ["new", "Nowe"], ["awaiting_payment", "Czeka na płatność"], ["paid", "Opłacone"], ["processing", "W realizacji"], ["shipped", "Wysłane"], ["cancelled", "Anulowane"],
];

type Res = { ok: boolean; message: string };

export function OrderBulkBar() {
  const { getSelectedIds, toggleAll } = useSelection();
  const router = useRouter();
  const ids = getSelectedIds();
  const [status, setStatus] = useState("processing");
  const [mail, setMail] = useState<"" | "resend" | "review" | "custom">("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [res, setRes] = useState<Res | null>(null);

  if (!ids.length) return res ? <p className={`kc-bulk__res ${res.ok ? "is-ok" : "is-bad"}`}>{res.message}</p> : null;
  const n = ids.length;
  const word = n === 1 ? "zamówienie" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "zamówienia" : "zamówień";

  const post = async (data: Record<string, unknown>, label: string) => {
    setBusy(label);
    const r: Res = await fetch("/api/order-bulk", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, ...data }) })
      .then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    setBusy("");
    setRes(r);
    return r;
  };
  const changeStatus = async () => {
    const label = STATUSES.find(([v]) => v === status)?.[1];
    if (!confirm(`Zmienić status ${n} ${word} na „${label}”?\n\nKlienci dostaną maile tak jak przy ręcznej zmianie (np. „Wysłane”, „Anulowane”).`)) return;
    const r = await post({ action: "status", status }, "status");
    if (r.ok) { toggleAll(false); router.refresh(); }
  };
  const sendMail = async () => {
    if (!mail) return;
    const what = mail === "resend" ? "potwierdzenie zamówienia" : mail === "review" ? "prośbę o opinię" : `wiadomość „${subject}”`;
    if (!confirm(`Wysłać ${what} do klientów z ${n} ${word}?`)) return;
    const r = await post({ action: "mail", mail, subject, message }, "mail");
    if (r.ok) { setMail(""); setSubject(""); setMessage(""); }
  };
  const open = (path: string) => window.open(`${path}${path.includes("?") ? "&" : "?"}ids=${ids.join(",")}`, "_blank", "noopener");

  return (
    <div className="kc-bulk" role="region" aria-label="Akcje na zaznaczonych zamówieniach">
      <div className="kc-bulk__row">
        <b>Zaznaczono: {n} {word}</b>
        <span className="kc-bulk__group">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Nowy status">
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button type="button" disabled={!!busy} onClick={changeStatus}><RefreshCw size={14} /> {busy === "status" ? "Zmieniam…" : "Zmień status"}</button>
        </span>
        <button type="button" onClick={() => open("/api/order-bulk/print")}><Printer size={14} /> Drukuj</button>
        <button type="button" onClick={() => open("/api/export/orders")}><Download size={14} /> Excel (CSV)</button>
        <span className="kc-bulk__group">
          <select value={mail} onChange={(e) => setMail(e.target.value as typeof mail)} aria-label="Rodzaj maila">
            <option value="">Wyślij mail…</option>
            <option value="resend">Potwierdzenie zamówienia (ponownie)</option>
            <option value="review">Prośba o opinię</option>
            <option value="custom">Własna wiadomość</option>
          </select>
          {mail && mail !== "custom" && <button type="button" disabled={!!busy} onClick={sendMail}><Mail size={14} /> {busy === "mail" ? "Wysyłam…" : "Wyślij"}</button>}
        </span>
        <button type="button" className="kc-bulk__clear" onClick={() => toggleAll(false)} title="Odznacz wszystko"><X size={14} /></button>
      </div>
      {mail === "custom" && (
        <div className="kc-bulk__msg">
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Temat, np. Opóźnienie wysyłki" maxLength={150} />
          <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Treść wiadomości – każdy klient dostanie ją z numerem swojego zamówienia. Odpowiedź wróci na skrzynkę sklepu." />
          <button type="button" className="kc-bulk__send" disabled={!!busy || !subject.trim() || !message.trim()} onClick={sendMail}><Mail size={14} /> {busy === "mail" ? "Wysyłam…" : `Wyślij do ${n} ${n === 1 ? "klienta" : "klientów"}`}</button>
        </div>
      )}
      {res && <p className={`kc-bulk__res ${res.ok ? "is-ok" : "is-bad"}`}>{res.message}</p>}
    </div>
  );
}
