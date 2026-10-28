"use client";

// Wiadomość z formularza jak w skrzynce pocztowej: kto pisze, czego dotyczy (produkt), wątek odpowiedzi i pole „Odpowiedz”.
// Odpowiedź idzie mailem do klienta (endpoint /api/message-tools/:id/reply), a klient odpisuje na adres sklepu.

import Link from "next/link";
import { useField, useForm, useFormFields } from "@payloadcms/ui";
import { RecordShell, useRecordView } from "./RecordView";
import type { DefaultCellComponentProps } from "payload";
import { useState } from "react";
import { Ban, CheckCircle2, ExternalLink, ListOrdered, Mail, Package, Phone, Reply, Send } from "lucide-react";

type Meta = { product?: { id: number; slug: string; name: string; sku?: string }; replies?: { at: string; by: string; text: string }[]; referer?: string };
const when = (d?: unknown) => (d ? new Date(String(d)).toLocaleString("pl-PL", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "");

const QUICK = [
  ["Dostępność", "Dziękujemy za pytanie. Produkt jest dostępny – wysyłamy w 1 dzień roboczy od zaksięgowania płatności."],
  ["Brak na stanie", "Dziękujemy za pytanie. Produkt chwilowo jest niedostępny – spodziewamy się dostawy w ciągu ok. 7 dni. Na stronie produktu można zostawić e-mail, a powiadomimy automatycznie."],
  ["Zastosowanie", "Dziękujemy za pytanie. Produkt nadaje się do …\n\nSposób użycia: …"],
];

export function MessageView() {
  const { id, editing, edit, done } = useRecordView();
  const f = useFormFields(([fields]) => fields);
  const status = useField<string>({ path: "status" });
  const { submit } = useForm();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; message: string } | null>(null);
  if (!id) return null;

  const v = (k: string) => String(f[k]?.value ?? "");
  const meta = (f.meta?.value ?? {}) as Meta;
  const email = v("email");

  const send = async () => {
    setBusy(true);
    setRes(null);
    const r = await fetch(`/api/message-tools/${id}/reply`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }),
    }).then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    setBusy(false);
    setRes(r);
    if (r.ok) setTimeout(() => window.location.reload(), 900);
  };
  const setStatus = (s: string) => { status.setValue(s); setTimeout(() => void submit(), 50); };

  return (
    <RecordShell editing={editing} onEdit={edit} onDone={done} editLabel="Edytuj dane"
      title={v("subject") || (v("type") === "b2b" ? "Wniosek B2B" : "Wiadomość")}
      subtitle={<span className="kc-msg__from">
        <b>{v("name")}</b> · <a href={`mailto:${email}`}><Mail size={13} /> {email}</a>
        {v("phone") && <> · <a href={`tel:${v("phone").replace(/\s/g, "")}`}><Phone size={13} /> {v("phone")}</a></>}
        {v("company") && <> · {v("company")}</>} · {when(f.createdAt?.value)}
      </span>}>

      {meta.product && (
        <div className="kc-msg__product">
          <Package size={18} />
          <span><small>Pytanie dotyczy produktu</small><b>{meta.product.name}</b>{meta.product.sku && <small>SKU {meta.product.sku}</small>}</span>
          <Link href={`/admin/collections/products/${meta.product.id}`} className="kc-act__link">W panelu</Link>
          <a href={`/produkt/${meta.product.slug}`} target="_blank" rel="noreferrer" className="kc-act__link">W sklepie <ExternalLink size={12} /></a>
        </div>
      )}

      <div className="kc-msg__thread">
        <div className="kc-msg__bubble is-client"><small>{v("name")} · {when(f.createdAt?.value)}</small>{v("message") || "—"}</div>
        {(meta.replies ?? []).map((r, i) => (
          <div key={i} className="kc-msg__bubble is-shop"><small><Reply size={12} /> {r.by} · {when(r.at)}</small>{r.text}</div>
        ))}
      </div>

      <div className="kc-msg__reply">
        <div className="kc-msg__quick">
          <span>Szybkie odpowiedzi:</span>
          {QUICK.map(([label, t]) => <button key={label} type="button" onClick={() => setText(t)}>{label}</button>)}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder={`Odpowiedź do ${v("name") || "klienta"} – pójdzie mailem na ${email}`} />
        <div className="kc-msg__actions">
          <button type="button" className="kc-msg__send" disabled={busy || text.trim().length < 2} onClick={send}><Send size={15} /> {busy ? "Wysyłam…" : "Wyślij odpowiedź"}</button>
          {status.value !== "done" && <button type="button" className="kc-act__btn" onClick={() => setStatus("done")}><CheckCircle2 size={15} /> Załatwione bez odpowiedzi</button>}
          {status.value !== "spam" && <button type="button" className="kc-act__btn is-danger" onClick={() => setStatus("spam")}><Ban size={15} /> Spam</button>}
          <Link className="kc-act__btn" href={`/admin/collections/orders?where[email][equals]=${encodeURIComponent(email)}`}><ListOrdered size={15} /> Zamówienia klienta</Link>
        </div>
        {res && <p className={`kc-act__msg ${res.ok ? "is-ok" : "is-bad"}`}>{res.message}</p>}
      </div>
    </RecordShell>
  );
}

// Kolumna „Produkt” na liście wiadomości
export function ProductCell({ rowData }: DefaultCellComponentProps) {
  const p = (rowData?.meta as Meta | undefined)?.product;
  return p ? <span className="kc-cell-product" title={p.name}><Package size={13} /> {p.name.length > 40 ? `${p.name.slice(0, 40)}…` : p.name}</span> : <span className="kc-muted">—</span>;
}
