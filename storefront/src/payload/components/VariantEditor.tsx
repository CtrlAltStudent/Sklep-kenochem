"use client";

// Zakładka „Warianty”: łączenie SKU w jedną kartę. Wygląd wyboru (pojemność / zdjęcie / długość…)
// ustawiasz tutaj – zapis idzie od razu do bazy, nie przez „Zapisz”.

import Link from "next/link";
import { useDocumentInfo, useForm, useFormModified } from "@payloadcms/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Link2Off, Search, Store, Unlink } from "lucide-react";
import { VARIANT_DISPLAY, VARIANT_NAV, variantDisplayOf, variantNavOf, type VariantDisplay, type VariantNav } from "@/lib/data";

type Member = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  ean: string;
  unitLabel: string;
  price: number;
  stock: number;
  isMain: boolean;
  isThis: boolean;
  sort: number;
  status: string;
  thumb: string;
};
type Hit = { id: number; name: string; sku: string; unitLabel: string; price: number; stock: number; thumb: string; status?: string; alreadyInGroup?: boolean };
type Data = { ok: boolean; thisId: number; mainId: number; mainName: string; isChild: boolean; display?: VariantDisplay; nav?: VariantNav; members: Member[]; suggestions: Hit[]; message?: string };

const pln = (n: number) => `${n.toFixed(2).replace(".", ",")} zł`;

export function VariantEditor() {
  const { id } = useDocumentInfo();
  const { dispatchFields, reset, setModified } = useForm();
  const modified = useFormModified();
  const dirty = useRef(false);
  dirty.current = modified;
  const [data, setData] = useState<Data | null>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(() => {
    if (!id) return;
    fetch(`/api/product-tools/${id}/variants`, { credentials: "include" })
      .then((r) => r.json())
      .then((j: Data) => { if (j.ok) setData(j); else setMsg(j.message || "Nie udało się wczytać wariantów."); })
      .catch(() => setMsg("Brak połączenia."));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!id || q.trim().length < 2) return;
    clearTimeout(t.current);
    t.current = setTimeout(() => {
      fetch(`/api/product-tools/${id}/variants/search?q=${encodeURIComponent(q.trim())}`, { credentials: "include" })
        .then((r) => r.json())
        .then((j: { hits?: Hit[] }) => setHits(j.hits ?? []))
        .catch(() => setHits([]));
    }, 280);
    return () => clearTimeout(t.current);
  }, [id, q]);

  const act = async (body: Record<string, unknown>, key = "act") => {
    if (!id) return;
    setBusy(key);
    setMsg("");
    const r = await fetch(`/api/product-tools/${id}/variants`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }).then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia." }));
    setBusy("");
    setMsg(r.message || (r.ok ? "Zapisano." : "Nie udało się zapisać."));
    if (r.ok) {
      setQ("");
      setHits(null);
      load();
      await pullProduct();
    }
  };

  // Warianty zapisują się od razu (dotyczą też innych produktów). Potem wciągamy
  // świeże dane do formularza, żeby „Zapisz” nie nadpisał ich starą wersją.
  const pullProduct = async () => {
    if (!id) return;
    const doc = await fetch(`/api/products/${id}?depth=0`, { credentials: "include" }).then((r) => r.json()).catch(() => null);
    if (!doc?.id) return;
    if (!dirty.current) {
      try { await reset(doc); } catch { /* formularz zostanie przy starym podglądzie, warianty i tak są w bazie */ }
      return;
    }
    for (const path of ["unitLabel", "variantDisplay", "variantNav", "variantOf", "variantSort"] as const) {
      dispatchFields({ type: "UPDATE", path, value: doc[path] ?? null, initialValue: doc[path] ?? null });
    }
    setModified(true);
  };

  const sort = (from: number, dir: -1 | 1) => {
    if (!data) return;
    const order = data.members.map((m) => m.id);
    const to = from + dir;
    if (to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to], order[from]];
    void act({ action: "sort", order }, `sort-${order[to]}`);
  };

  if (!id) return <p className="kc-var__hint">Najpierw zapisz produkt – potem połączysz tu inne warianty.</p>;
  if (!data) return <p className="kc-muted">{msg || "Wczytuję warianty…"}</p>;

  const multi = data.members.length > 1;
  const look = variantDisplayOf(data.display);
  const nav = variantNavOf(data.nav);
  const photos = look.id === "zdjecie";
  const pages = nav.id === "link";

  return (
    <div className="kc-var">
      {data.isChild && (
        <div className="kc-var__banner">
          <p>Ten produkt jest wariantem karty <Link href={`/admin/collections/products/${data.mainId}`}>{data.mainName}</Link>. {pages ? "Ma też własną stronę w sklepie – klient przechodzi tu z wyboru wariantu." : "W sklepie nie ma osobnej strony – klient wybiera go na karcie głównej."}</p>
          <div className="kc-var__banner-act">
            <button type="button" disabled={!!busy} onClick={() => act({ action: "makeMain", productId: data.thisId }, "main")}>Zrób z tego kartę główną</button>
            <button type="button" className="is-quiet" disabled={!!busy} onClick={() => act({ action: "remove", productId: data.thisId }, "off")}>Odłącz – osobna karta</button>
          </div>
        </div>
      )}

      <div className="kc-var__mode">
        <span>W sklepie pokaż jako</span>
        {VARIANT_DISPLAY.map((d) => (
          <button key={d.id} type="button" className={look.id === d.id ? "is-on" : ""} disabled={!!busy}
            onClick={() => { if (d.id !== look.id) void act({ action: "display", display: d.id }, `disp-${d.id}`); }}>
            {d.label}
          </button>
        ))}
      </div>
      <div className="kc-var__mode">
        <span>Strony</span>
        {VARIANT_NAV.map((d) => (
          <button key={d.id} type="button" className={nav.id === d.id ? "is-on" : ""} disabled={!!busy}
            onClick={() => { if (d.id !== nav.id) void act({ action: "nav", nav: d.id }, `nav-${d.id}`); }}>
            {d.label}
          </button>
        ))}
      </div>
      <p className="kc-var__lead">{look.hint} {nav.hint} Zmiana wariantów zapisuje się od razu. Opis, cenę i zdjęcia zapisujesz przyciskiem <b>Zapisz</b> na pasku edycji.</p>

      <table className={`kc-var__table ${photos ? "is-photo" : ""}`}>
        <thead>
          <tr>
            <th>{look.label}</th>
            <th>SKU</th>
            <th>Cena</th>
            <th>Stan</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.members.map((m, i) => (
            <tr key={m.id} className={m.isThis ? "is-this" : ""}>
              <td>
                <span className="kc-var__cell">
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura z panelu */}
                  {m.thumb ? <img src={m.thumb} alt="" /> : <span className="kc-var__ph" />}
                  <span>
                    <input
                      className="kc-var__label"
                      key={`${m.id}:${m.unitLabel}`}
                      defaultValue={m.unitLabel}
                      aria-label={look.label}
                      placeholder={look.placeholder}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== m.unitLabel) void act({ action: "label", productId: m.id, unitLabel: v }, `lab-${m.id}`);
                      }}
                    />
                    <small>
                      {m.isThis ? "ten produkt" : m.name}
                      {m.isMain && <b> · karta główna</b>}
                      {m.status !== "active" && " · ukryty"}
                    </small>
                  </span>
                </span>
              </td>
              <td className="kc-var__mono">{m.sku || "—"}</td>
              <td>{pln(m.price)}</td>
              <td><span className={`kc-pill kc-pill--${m.stock <= 0 ? "gray" : m.stock < 5 ? "amber" : "green"}`}>{m.stock <= 0 ? "brak" : `${m.stock} szt.`}</span></td>
              <td className="kc-var__ops">
                {multi && (
                  <>
                    <button type="button" title="Wyżej" disabled={i === 0 || !!busy} onClick={() => sort(i, -1)}><ArrowUp size={14} /></button>
                    <button type="button" title="Niżej" disabled={i === data.members.length - 1 || !!busy} onClick={() => sort(i, 1)}><ArrowDown size={14} /></button>
                  </>
                )}
                {!m.isMain && (
                  <>
                    <button type="button" title="To jest karta główna" disabled={!!busy} onClick={() => act({ action: "makeMain", productId: m.id }, `main-${m.id}`)}><Store size={14} /></button>
                    <button type="button" title="Odłącz" disabled={!!busy} onClick={() => act({ action: "remove", productId: m.id }, `rm-${m.id}`)}><Unlink size={14} /></button>
                  </>
                )}
                {!m.isThis && <Link href={`/admin/collections/products/${m.id}`} title="Otwórz produkt">edycja</Link>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="kc-var__add">
        <label>
          <Search size={14} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Dodaj wariant – nazwa, SKU albo EAN" />
        </label>
        {q.trim().length >= 2 && hits && (
          <ul className="kc-var__hits">
            {hits.length === 0 && <li className="is-empty">Nic nie znaleziono.</li>}
            {hits.map((h) => (
              <li key={h.id}>
                <span className="kc-var__cell">
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura z panelu */}
                  {h.thumb ? <img src={h.thumb} alt="" /> : <span className="kc-var__ph" />}
                  <span>
                    <b>{h.name}</b>
                    <small>{[h.unitLabel, h.sku && `SKU ${h.sku}`, pln(h.price), h.alreadyInGroup && "już w innej karcie"].filter(Boolean).join(" · ")}</small>
                  </span>
                </span>
                <button type="button" disabled={!!busy} onClick={() => act({ action: "add", productId: h.id }, `add-${h.id}`)}>Połącz</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!!data.suggestions.length && q.trim().length < 2 && (
        <div className="kc-var__sug">
          <p>Podobna nazwa – to pewnie inne warianty tego towaru:</p>
          <ul>
            {data.suggestions.map((h) => (
              <li key={h.id}>
                <span>{h.unitLabel || h.name}{h.sku ? ` · ${h.sku}` : ""} · {pln(h.price)}</span>
                <button type="button" disabled={!!busy} onClick={() => act({ action: "add", productId: h.id }, `sug-${h.id}`)}>Połącz</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {msg && <p className={`kc-act__msg ${msg.startsWith("Nie") || msg.startsWith("Brak") ? "is-bad" : "is-ok"}`}>{busy ? "Zapisuję…" : msg}</p>}
      {multi && !data.isChild && (
        <p className="kc-var__hint"><Link2Off size={13} /> Odłączenie wariantu znowu da mu osobną kartę w sklepie. Kolejność = kolejność wyboru u klienta.</p>
      )}
    </div>
  );
}
