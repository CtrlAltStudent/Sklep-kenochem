"use client";

// Ustawienia → przegląd: przycisk zapisujący nowe wersje regulaminu i polityki prywatności jako szkice do przeczytania
// (POST /api/content-tools/legal-drafts). Publikacja – w Podstronach, przyciskiem „Opublikuj zmiany”.

import Link from "next/link";
import { useState } from "react";
import { FileText, Scale } from "lucide-react";

export function LegalDrafts() {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; message: string; pages?: { slug: string; id: number }[] } | null>(null);
  const run = async () => {
    setBusy(true);
    setRes(await fetch("/api/content-tools/legal-drafts", { method: "POST", credentials: "include" }).then((r) => r.json()).catch(() => ({ ok: false, message: "Brak połączenia" })));
    setBusy(false);
  };
  return (
    <section className="kc-card kc-legal">
      <span className="kc-icon kc-icon--green"><Scale size={18} /></span>
      <div>
        <b>Regulamin i polityka prywatności – nowa wersja</b>
        <p className="kc-muted">Uwzględnia konto klienta (pobranie danych, usunięcie konta), przypomnienie o koszyku, prośbę o opinię, zasady opinii, BaseLinkera, Przelewy24, przewoźników i cookies. Zapisuje się jako <b>szkic</b> – sklep pokazuje starą wersję, dopóki jej nie opublikujesz.</p>
        <div className="kc-lay__menu-actions">
          <button type="button" className="kc-msg__send" disabled={busy} onClick={run}><FileText size={14} /> {busy ? "Zapisuję…" : "Zapisz jako szkice do przeczytania"}</button>
          {res?.pages?.map((p) => <Link key={p.slug} href={`/admin/collections/pages/${p.id}`} className="kc-act__btn">Otwórz: {p.slug === "regulamin" ? "Regulamin" : "Polityka prywatności"}</Link>)}
        </div>
        {res && <p className={`kc-act__msg ${res.ok ? "is-ok" : "is-bad"}`}>{res.message}</p>}
      </div>
    </section>
  );
}
