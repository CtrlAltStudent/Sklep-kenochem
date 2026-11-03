"use client";

// Podgląd rekordu zamiast formularza (wiadomości, opinie, zwroty, klienci).
// Otwierając rekord widzisz czytelną kartę; pola formularza pojawiają się dopiero po „Edytuj” w rogu karty.
// Mechanizm jak w zamówieniach: html[data-kc-view="record"] + data-kc-edit, CSS w custom.scss (.kc-recview).

import { useDocumentInfo, useField, useForm, useFormFields } from "@payloadcms/ui";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Ban, CheckCircle2, ExternalLink, Mail, MapPin, Package, Phone, Receipt, Star, User } from "lucide-react";
import { SectionButtons, type SheetSection } from "@/payload/components/SectionSheet";

export function useRecordView() {
  const { id } = useDocumentInfo();
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.kcView = "record";
    if (!id) html.dataset.kcEdit = "1";
    else delete html.dataset.kcEdit;
    return () => { delete html.dataset.kcView; delete html.dataset.kcEdit; delete html.dataset.kcSheet; };
  }, [id]);
  return { id, editing: !id };
}

// Karta podglądu z przyciskiem „Edytuj” w rogu; w trybie edycji – pasek „Zakończ edycję”
export function RecordShell({ title, subtitle, badge, editing, sections, children }: {
  title: ReactNode; subtitle?: ReactNode; badge?: ReactNode; editing: boolean; sections?: SheetSection[]; children: ReactNode;
}) {
  return (
    <div className="kc-recview">
      <header className="kc-recview__head">
        <div>
          <h2>{title} {badge}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>
      {children}
      {!editing && sections && <SectionButtons items={sections} />}
    </div>
  );
}

export const Row = ({ k, children }: { k: string; children: ReactNode }) =>
  children ? <div className="kc-recview__row"><span>{k}</span><div>{children}</div></div> : null;

const when = (d?: unknown) => (d ? new Date(String(d)).toLocaleString("pl-PL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
const useV = () => {
  const f = useFormFields(([fields]) => fields);
  return (k: string) => f[k]?.value as unknown;
};
const s = (v: unknown) => (v == null ? "" : String(v));

// Wspólny blok kontaktu: imię, e-mail (mailto), telefon (tel)
function Contact({ name, email, phone }: { name?: string; email?: string; phone?: string }) {
  return (
    <p className="kc-recview__contact">
      {name && <b><User size={13} /> {name}</b>}
      {email && <a href={`mailto:${email}`}><Mail size={13} /> {email}</a>}
      {phone && <a href={`tel:${phone.replace(/\s/g, "")}`}><Phone size={13} /> {phone}</a>}
    </p>
  );
}

// ---------- Opinia ----------

const REVIEW_STATUS: Record<string, [string, string]> = { pending: ["Do moderacji", "amber"], approved: ["Opublikowana", "green"], rejected: ["Odrzucona", "gray"] };

export function ReviewView() {
  const { id, editing } = useRecordView();
  const v = useV();
  const reply = useField<string>({ path: "reply" });
  const status = useField<string>({ path: "status" });
  const { submit } = useForm();
  const [draft, setDraft] = useState<string | null>(null);
  const [product, setProduct] = useState<{ id: number; name: string; slug: string } | null>(null);
  const pid = (() => { const p = v("product"); return typeof p === "object" && p ? (p as { id: number }).id : (p as number | undefined); })();
  useEffect(() => {
    if (!pid) return;
    let alive = true;
    fetch(`/api/products/${pid}?depth=0&select[name]=true&select[slug]=true`, { credentials: "include" })
      .then((r) => r.json()).then((j) => alive && j?.name && setProduct({ id: pid, name: j.name, slug: j.slug })).catch(() => {});
    return () => { alive = false; };
  }, [pid]);
  if (!id) return null;
  const rating = Number(v("rating") ?? 0);
  const [label, tone] = REVIEW_STATUS[s(status.value)] ?? ["—", "gray"];
  const save = (patch: { status?: string; reply?: string }) => {
    if (patch.status) status.setValue(patch.status);
    if (patch.reply !== undefined) reply.setValue(patch.reply);
    setTimeout(() => void submit(), 50);
  };
  const text = draft ?? s(reply.value);

  return (
    <RecordShell editing={editing} sections={[{ id: "opinia", title: "Treść opinii" }, { id: "odpowiedz", title: "Odpowiedź sklepu" }]}
      title={<><span className="kc-recview__stars" aria-label={`${rating} na 5`}>{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={18} className={i <= rating ? "is-on" : ""} />)}</span> {s(v("title"))}</>}
      badge={<span className={`kc-pill kc-pill--${tone}`}>{label}</span>}
      subtitle={<>{s(v("author"))}{v("verified") ? " · potwierdzony zakup" : ""} · {when(v("createdAt"))}</>}>
      {product && (
        <div className="kc-msg__product">
          <Package size={18} />
          <span><small>Opinia o produkcie</small><b>{product.name}</b></span>
          <Link href={`/admin/collections/products/${product.id}`} className="kc-act__link">W panelu</Link>
          <a href={`/produkt/${product.slug}`} target="_blank" rel="noreferrer" className="kc-act__link">W sklepie <ExternalLink size={12} /></a>
        </div>
      )}
      <div className="kc-msg__bubble is-client"><small>{s(v("author"))}</small>{s(v("content"))}</div>
      <div className="kc-msg__reply">
        <label className="kc-recview__label">Odpowiedź sklepu (widoczna pod opinią)</label>
        <textarea rows={3} value={text} onChange={(e) => setDraft(e.target.value)} placeholder="Dziękujemy za opinię! …" />
        <div className="kc-msg__actions">
          {status.value !== "approved" && <button type="button" className="kc-msg__send" onClick={() => save({ status: "approved", reply: text })}><CheckCircle2 size={15} /> Opublikuj{text ? " z odpowiedzią" : ""}</button>}
          {status.value === "approved" && <button type="button" className="kc-msg__send" disabled={text === s(reply.value)} onClick={() => save({ reply: text })}><CheckCircle2 size={15} /> Zapisz odpowiedź</button>}
          {status.value !== "rejected" && <button type="button" className="kc-act__btn is-danger" onClick={() => save({ status: "rejected" })}><Ban size={15} /> Odrzuć</button>}
        </div>
      </div>
    </RecordShell>
  );
}

// ---------- Zwrot / reklamacja ----------

const RESOLUTION: Record<string, string> = { refund: "Zwrot pieniędzy", replace: "Wymiana na nowy", repair: "Naprawa", discount: "Obniżenie ceny" };
const RETURN_STATUS: Record<string, [string, string]> = {
  new: ["Nowe", "blue"], accepted: ["Czekamy na paczkę", "amber"], received: ["Towar otrzymany", "violet"], refunded: ["Zwrot wykonany", "green"], rejected: ["Odrzucone", "gray"], closed: ["Zamknięte", "gray"],
};

export function ReturnView() {
  const { id, editing } = useRecordView();
  const v = useV();
  if (!id) return null;
  const order = v("order");
  const orderId = typeof order === "object" && order ? (order as { id: number }).id : (order as number | undefined);
  const [label, tone] = RETURN_STATUS[s(v("status"))] ?? ["—", "gray"];
  return (
    <RecordShell editing={editing} sections={[{ id: "zgloszenie", title: "Zgłoszenie" }, { id: "klient-zwrotu", title: "Klient" }, { id: "powod", title: "Produkty i powód" }, { id: "notatka", title: "Notatka" }]}
      title={<>{v("type") === "complaint" ? "Reklamacja" : "Zwrot"} {s(v("number"))}</>}
      badge={<span className={`kc-pill kc-pill--${tone}`}>{label}</span>}
      subtitle={when(v("createdAt"))}>
      <Contact name={s(v("name"))} email={s(v("email"))} phone={s(v("phone"))} />
      <div className="kc-recview__grid">
        <Row k="Zamówienie">{v("orderNumber") ? (orderId ? <Link href={`/admin/collections/orders/${orderId}`} className="kc-act__link"><Receipt size={13} /> {s(v("orderNumber"))}</Link> : s(v("orderNumber"))) : null}</Row>
        <Row k="Oczekiwane rozwiązanie">{RESOLUTION[s(v("resolution"))] ?? s(v("resolution"))}</Row>
        <Row k="Konto do zwrotu">{s(v("bankAccount"))}</Row>
      </div>
      <Row k="Produkty i ilości"><p className="kc-recview__text">{s(v("products"))}</p></Row>
      <Row k={v("type") === "complaint" ? "Opis wady" : "Powód"}><p className="kc-recview__text">{s(v("reason"))}</p></Row>
      <Row k="Notatka wewnętrzna"><p className="kc-recview__text">{s(v("internalNote"))}</p></Row>
      <p className="kc-muted">Zmiana statusu – przyciski w prawym panelu (klient dostaje maila przy każdym kroku).</p>
    </RecordShell>
  );
}

// ---------- Klient ----------

type Address = { label?: string; fullName?: string; company?: string; street?: string; postcode?: string; city?: string };

export function CustomerView() {
  const { id, editing } = useRecordView();
  const v = useV();
  const f = useFormFields(([fields]) => fields);
  if (!id) return null;
  const name = [s(v("firstName")), s(v("lastName"))].filter(Boolean).join(" ");
  // tablica adresów: pola formularza addresses.0.street itd.
  const count = Number(v("addresses") ?? 0) || 0;
  const addresses: Address[] = Array.from({ length: count }, (_, i) => Object.fromEntries(
    ["label", "fullName", "company", "street", "postcode", "city"].map((k) => [k, s(f[`addresses.${i}.${k}`]?.value)]),
  ) as Address);
  return (
    <RecordShell editing={editing} sections={[{ id: "dane", title: "Dane osobowe" }, { id: "adresy", title: "Adresy" }, { id: "zgody", title: "Zgody" }, { id: "konto", title: "E-mail i hasło" }]} title={name || s(v("email"))} subtitle={`Konto od ${when(v("createdAt"))}`}>
      <Contact email={s(v("email"))} phone={s(v("phone"))} />
      <div className="kc-recview__grid">
        <Row k="Newsletter">{v("consents.newsletter") ? `tak (od ${when(v("consents.newsletterAt"))})` : "nie"}</Row>
        <Row k="Regulamin zaakceptowany">{when(v("consents.termsAcceptedAt"))}</Row>
      </div>
      {addresses.length > 0 && (
        <div className="kc-recview__addr">
          {addresses.map((a, i) => (
            <div key={i}><MapPin size={14} /><span><b>{a.label || `Adres ${i + 1}`}</b>{[a.fullName, a.company, a.street, [a.postcode, a.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</span></div>
          ))}
        </div>
      )}
      <p className="kc-muted">Zamówienia i suma zakupów – w prawym panelu.</p>
    </RecordShell>
  );
}
