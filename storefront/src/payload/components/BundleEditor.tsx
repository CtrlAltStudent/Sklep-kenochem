"use client";

// Zakładka „Zestaw”: skład z produktów, które już są w sklepie. Kluczem jest unikalne SKU.
// Zapis idzie od razu, nie przez przycisk Zapisz na pasku edycji.

import Link from "next/link";
import { useDocumentInfo, useForm, useFormModified } from "@payloadcms/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Trash2 } from "lucide-react";

type Item = { productId: number; name: string; sku: string; quantity: number; slug: string; thumb: string };
type Hit = { id: number; name: string; sku: string; price: number; stock: number; thumb: string; bundle: boolean; status?: string };

const pln = (n: number) => `${Number(n).toFixed(2).replace(".", ",")} zł`;

export function BundleEditor() {
  const { id } = useDocumentInfo();
  const { dispatchFields, reset, setModified } = useForm();
  const modified = useFormModified();
  const dirty = useRef(false);
  dirty.current = modified;
  const [items, setItems] = useState<Item[] | null>(null);
  const [sku, setSku] = useState("");
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(() => {
    if (!id) return;
    fetch(`/api/product-tools/${id}/bundle`, { credentials: "include" })
      .then((r) => r.json())
      .then((j: { ok?: boolean; message?: string; sku?: string; items?: Item[] }) => {
        if (!j.ok) { setMsg(j.message || "Nie udało się wczytać zestawu."); return; }
        setSku(j.sku || "");
        setItems(j.items ?? []);
      })
      .catch(() => setMsg("Brak połączenia."));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!id || q.trim().length < 2) return;
    clearTimeout(t.current);
    t.current = setTimeout(() => {
      fetch(`/api/product-tools/${id}/bundle/search?q=${encodeURIComponent(q.trim())}`, { credentials: "include" })
        .then((r) => r.json())
        .then((j: { hits?: Hit[] }) => setHits(j.hits ?? []))
        .catch(() => setHits([]));
    }, 280);
    return () => clearTimeout(t.current);
  }, [id, q]);

  const pullProduct = async () => {
    if (!id) return;
    const doc = await fetch(`/api/products/${id}?depth=0`, { credentials: "include" }).then((r) => r.json()).catch(() => null);
    if (!doc?.id) return;
    if (!dirty.current) {
      try { await reset(doc); } catch { /* skład i tak jest w bazie */ }
      return;
    }
    for (const path of ["bundle", "bundleItems"] as const) {
      dispatchFields({ type: "UPDATE", path, value: doc[path] ?? null, initialValue: doc[path] ?? null });
    }
    setModified(true);
  };

  const save = async (next: Item[]) => {
    if (!id) return;
    setBusy(true);
    setMsg("");
    const r = await fetch(`/api/product-tools/${id}/bundle`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: next.map((item) => ({ productId: item.productId, quantity: item.quantity })) }),
    }).then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia." }));
    setBusy(false);
    setMsg(r.message || (r.ok ? "Zapisano." : "Nie udało się zapisać."));
    if (r.ok) { setQ(""); setHits(null); load(); await pullProduct(); }
  };

  if (!id) return <p className="kc-var__lead">Najpierw zapisz produkt przyciskiem Zapisz. Potem tutaj ułożysz z niego zestaw.</p>;
  if (!items) return <p className="kc-var__lead">{msg || "Wczytuję skład…"}</p>;

  const add = (hit: Hit) => {
    if (!hit.sku || hit.bundle || items.some((item) => item.productId === hit.id)) return;
    void save([...items, { productId: hit.id, name: hit.name, sku: hit.sku, quantity: 1, slug: "", thumb: hit.thumb }]);
  };

  return (
    <div className="kc-var">
      <p className="kc-var__lead">
        Zestaw składa się z produktów, które już są w sklepie. Każdy musi mieć swoje SKU i ten kod nie może się powtarzać.
        {sku ? <> SKU tego zestawu: <b>{sku}</b>.</> : <> Ten produkt nie ma jeszcze SKU – wpisz je w „Cenach i magazynie” i zapisz, zanim zapiszesz skład.</>}
      </p>
      {!!items.length && (
        <table className="kc-var__table">
          <thead>
            <tr><th>Produkt</th><th>SKU</th><th>Ilość</th><th /></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.productId}>
                <td>
                  <span className="kc-var__cell">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {item.thumb ? <img src={item.thumb} alt="" /> : <span className="kc-var__ph" />}
                    <span>
                      <b>{item.name}</b>
                      <small><Link href={`/admin/collections/products/${item.productId}`}>otwórz produkt</Link></small>
                    </span>
                  </span>
                </td>
                <td className="kc-var__mono">{item.sku || "—"}</td>
                <td>
                  <input
                    className="kc-var__label"
                    type="number"
                    min={1}
                    max={999}
                    defaultValue={item.quantity}
                    key={`${item.productId}:${item.quantity}`}
                    aria-label={`Ilość ${item.sku}`}
                    onBlur={(e) => {
                      const quantity = Math.round(Number(e.target.value));
                      if (quantity >= 1 && quantity !== item.quantity) void save(items.map((row) => row.productId === item.productId ? { ...row, quantity } : row));
                    }}
                  />
                </td>
                <td className="kc-var__ops">
                  <button type="button" title="Usuń ze zestawu" disabled={busy} onClick={() => void save(items.filter((row) => row.productId !== item.productId))}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!items.length && <p className="kc-var__lead">Na razie to zwykły produkt. Dodaj składniki poniżej, żeby stał się zestawem.</p>}
      <div className="kc-var__add">
        <label>
          <Search size={14} />
          <input value={q} onChange={(e) => { setQ(e.target.value); if (e.target.value.trim().length < 2) setHits(null); }} placeholder="Dodaj produkt – nazwa albo SKU" aria-label="Szukaj składnika zestawu" />
        </label>
        {q.trim().length >= 2 && hits && (
          <ul className="kc-var__hits">
            {hits.length === 0 && <li className="is-empty">Nic nie znaleziono.</li>}
            {hits.map((h) => {
              const taken = items.some((item) => item.productId === h.id);
              const blocked = !h.sku || h.bundle || taken;
              const why = !h.sku ? "brak SKU" : h.bundle ? "to zestaw" : taken ? "już w składzie" : "";
              return (
                <li key={h.id}>
                  <button type="button" disabled={busy || blocked} onClick={() => add(h)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {h.thumb ? <img src={h.thumb} alt="" /> : <span className="kc-var__ph" />}
                    <span>
                      <b>{h.name}</b>
                      <small>{h.sku ? `SKU ${h.sku}` : "bez SKU"} · {pln(h.price)}{why ? ` · ${why}` : ""}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {msg && <p className="kc-var__lead">{msg}</p>}
    </div>
  );
}
