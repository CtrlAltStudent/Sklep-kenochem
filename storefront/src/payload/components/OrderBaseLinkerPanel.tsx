"use client";

import { useState } from "react";
import { Button, useDocumentInfo } from "@payloadcms/ui";

type Preview = { ok: boolean; mode?: string; alreadySentId?: number | null; message?: string; payload?: unknown; warnings?: string[]; errors?: string[]; baselinkerOrderId?: number };

const box: React.CSSProperties = { border: "1px solid var(--theme-elevation-150)", borderRadius: 8, padding: 16, marginBottom: 16 };

export function OrderBaseLinkerPanel() {
  const { id } = useDocumentInfo();
  const [busy, setBusy] = useState<"preview" | "send" | null>(null);
  const [res, setRes] = useState<Preview | null>(null);

  if (!id) return <p style={{ color: "var(--theme-elevation-600)" }}>Zapisz zamówienie, aby zobaczyć dane dla BaseLinkera.</p>;

  const preview = async () => {
    setBusy("preview");
    setRes(await fetch(`/api/baselinker/order-preview/${id}`, { credentials: "include" }).then((r) => r.json()).catch((e) => ({ ok: false, message: String(e) })));
    setBusy(null);
  };
  const send = async () => {
    if (!confirm("Wysłać to zamówienie do BaseLinkera?")) return;
    setBusy("send");
    setRes(await fetch(`/api/baselinker/send-order/${id}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then((r) => r.json()).catch((e) => ({ ok: false, message: String(e) })));
    setBusy(null);
  };

  return (
    <div style={box}>
      <h4 style={{ marginTop: 0 }}>Przekazanie do BaseLinkera</h4>
      <p style={{ fontSize: 13, color: "var(--theme-elevation-600)" }}>
        Podgląd pokazuje dokładnie te dane, które trafią do metody <code>addOrder</code>, wraz z wynikiem walidacji.
        Zamówienie z błędami nie zostanie wysłane.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <Button size="small" buttonStyle="secondary" disabled={!!busy} onClick={preview}>{busy === "preview" ? "Sprawdzam…" : "Podgląd i walidacja danych"}</Button>
        <Button size="small" buttonStyle="primary" disabled={!!busy} onClick={send}>{busy === "send" ? "Wysyłam…" : "Wyślij do BaseLinkera"}</Button>
      </div>
      {res && (
        <div style={{ marginTop: 12 }}>
          {res.message && <p style={{ fontWeight: 600, color: res.ok ? "#2b6e1a" : "#c53030" }}>{res.ok ? "✔ " : "✖ "}{res.message}</p>}
          {res.mode === "mock" && <p style={{ color: "#b7791f" }}>Tryb testowy – BaseLinker nie jest wywoływany naprawdę.</p>}
          {!!res.errors?.length && (
            <div style={{ color: "#c53030" }}><strong>Błędy (blokują wysyłkę):</strong><ul>{res.errors.map((e) => <li key={e}>{e}</li>)}</ul></div>
          )}
          {!!res.warnings?.length && (
            <div style={{ color: "#b7791f" }}><strong>Ostrzeżenia:</strong><ul>{res.warnings.map((e) => <li key={e}>{e}</li>)}</ul></div>
          )}
          {res.alreadySentId ? (
            <p style={{ color: "#2b6e1a" }}>✔ Zamówienie jest już w BaseLinkerze (ID {res.alreadySentId}) – ponowna wysyłka jest zablokowana.</p>
          ) : res.ok && !res.errors?.length && !res.baselinkerOrderId ? (
            <p style={{ color: "#2b6e1a" }}>✔ Dane poprawne – gotowe do wysłania.</p>
          ) : null}
          {res.payload !== undefined && (
            <details>
              <summary>Dane addOrder (JSON)</summary>
              <pre style={{ fontSize: 12, maxHeight: 420, overflow: "auto" }}>{JSON.stringify(res.payload, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
