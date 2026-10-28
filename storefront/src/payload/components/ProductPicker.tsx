"use client";

// Lista produktów z miniaturą i wyszukiwarką – zamiast pola Payload, które przy setkach produktów się rozjeżdża.
// Zapisuje te same identyfikatory, co zwykła relacja (przycisk Zapisz).

import { useField } from "@payloadcms/ui";
import { ChevronDown, ChevronUp, Search, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Hit = { id: number; name: string; sku: string; brand: string; unit: string; price: number; stock: number; thumb: string; status?: string };

const pln = (n: number) => `${Number(n).toFixed(2).replace(".", ",")} zł`;

const idsOf = (value: unknown): number[] => {
  const list = Array.isArray(value) ? value : value == null ? [] : [value];
  return list.map((v) => Number(typeof v === "object" && v ? (v as { id?: number }).id : v)).filter((n) => n > 0);
};

export function ProductPicker(props: { path?: string; field?: { name?: string; label?: unknown; admin?: { description?: unknown } } }) {
  const path = props.path ?? props.field?.name ?? "";
  const label = typeof props.field?.label === "string" ? props.field.label : "";
  const description = typeof props.field?.admin?.description === "string" ? props.field.admin.description : "";
  const { value, setValue } = useField<unknown>({ path });
  const ids = idsOf(value);
  const [rows, setRows] = useState<Hit[]>([]);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const key = ids.join(",");

  useEffect(() => {
    if (!ids.length) { setRows([]); return; }
    fetch(`/api/product-picker?ids=${key}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j: { hits?: Hit[] }) => setRows(j.hits ?? []))
      .catch(() => setRows([]));
    // key trzyma aktualne id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (q.trim().length < 2) return;
    clearTimeout(t.current);
    t.current = setTimeout(() => {
      fetch(`/api/product-picker?q=${encodeURIComponent(q.trim())}`, { credentials: "include" })
        .then((r) => r.json())
        .then((j: { hits?: Hit[] }) => setHits(j.hits ?? []))
        .catch(() => setHits([]));
    }, 280);
    return () => clearTimeout(t.current);
  }, [q]);

  const write = (next: number[]) => setValue(next);

  const add = (hit: Hit) => {
    if (ids.includes(hit.id)) return;
    write([...ids, hit.id]);
    setQ("");
    setHits(null);
  };

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= ids.length) return;
    const next = [...ids];
    const [item] = next.splice(index, 1);
    next.splice(to, 0, item);
    write(next);
  };

  return (
    <div className="kc-pick">
      {(label || description) && (
        <div className="kc-pick__head">
          {label && <b>{label}</b>}
          {description && <small>{description}</small>}
        </div>
      )}
      {!!rows.length && (
        <ul className="kc-pick__list">
          {rows.map((row, index) => (
            <li key={row.id}>
              <span className="kc-prod">
                <span className="kc-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {row.thumb ? <img src={row.thumb} alt="" /> : <span className="kc-thumb__empty">—</span>}
                </span>
                <span className="kc-prod__text">
                  <span className="kc-prod__name">{row.name}</span>
                  <span className="kc-prod__meta">{[row.brand, row.unit, row.sku && `SKU ${row.sku}`, pln(row.price)].filter(Boolean).join(" · ")}</span>
                </span>
              </span>
              <span className="kc-pick__ops">
                <button type="button" aria-label="Wyżej" disabled={index === 0} onClick={() => move(index, -1)}><ChevronUp size={14} /></button>
                <button type="button" aria-label="Niżej" disabled={index === rows.length - 1} onClick={() => move(index, 1)}><ChevronDown size={14} /></button>
                <button type="button" aria-label="Usuń" onClick={() => write(ids.filter((id) => id !== row.id))}><Trash2 size={14} /></button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {!rows.length && <p className="kc-pick__empty">Jeszcze nic nie wybrano.</p>}
      <div className="kc-var__add">
        <label>
          <Search size={14} />
          <input value={q} onChange={(e) => { setQ(e.target.value); if (e.target.value.trim().length < 2) setHits(null); }} placeholder="Dodaj produkt – nazwa, SKU albo EAN" aria-label="Szukaj produktu" />
        </label>
        {q.trim().length >= 2 && hits && (
          <ul className="kc-var__hits">
            {hits.length === 0 && <li className="is-empty">Nic nie znaleziono.</li>}
            {hits.map((h) => {
              const taken = ids.includes(h.id);
              return (
                <li key={h.id}>
                  <button type="button" disabled={taken} onClick={() => add(h)}>
                    <span className="kc-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {h.thumb ? <img src={h.thumb} alt="" /> : <span className="kc-thumb__empty">—</span>}
                    </span>
                    <span>
                      <b>{h.name}</b>
                      <small>{[h.sku && `SKU ${h.sku}`, pln(h.price), h.stock > 0 ? `${h.stock} szt.` : "brak", taken ? "już na liście" : ""].filter(Boolean).join(" · ")}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
