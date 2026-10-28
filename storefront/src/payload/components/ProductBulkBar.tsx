"use client";

// Lista produktów: pasek akcji dla zaznaczonych (wzór: WooCommerce) – kategoria, widoczność, marka, etykiety, cena.
// Akcje: src/integrations/productBulk.ts

import { useSelection } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

type Res = { ok: boolean; message: string };
type Cat = { id: number; name: string; depth?: number | null; path?: string | null };

const ile = (n: number) => (n === 1 ? "produkt" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "produkty" : "produktów");

export function ProductBulkBar() {
  const { getSelectedIds, toggleAll } = useSelection();
  const router = useRouter();
  const ids = getSelectedIds();
  const [cats, setCats] = useState<Cat[]>([]);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("active");
  const [brand, setBrand] = useState("");
  const [badgeMode, setBadgeMode] = useState<"add" | "remove">("add");
  const [badge, setBadge] = useState("nowosc");
  const [priceMode, setPriceMode] = useState("up-percent");
  const [priceValue, setPriceValue] = useState("");
  const [busy, setBusy] = useState("");
  const [res, setRes] = useState<Res | null>(null);

  useEffect(() => {
    if (!ids.length || cats.length) return;
    fetch("/api/categories?limit=1000&depth=0&sort=path", { credentials: "include" })
      .then((r) => r.json())
      .then((j: { docs?: Cat[] }) => setCats(j.docs ?? []))
      .catch(() => {});
  }, [ids.length, cats.length]);

  if (!ids.length) return res ? <p className={`kc-bulk__res ${res.ok ? "is-ok" : "is-bad"}`}>{res.message}</p> : null;
  const n = ids.length;
  const word = ile(n);

  const post = async (data: Record<string, unknown>, label: string) => {
    setBusy(label);
    const r: Res = await fetch("/api/product-bulk", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, ...data }),
    }).then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    setBusy("");
    setRes(r);
    if (r.ok) { toggleAll(false); router.refresh(); }
    return r;
  };

  const applyCategory = () => {
    if (!category) return;
    const name = category === "none" ? "bez kategorii" : cats.find((c) => String(c.id) === category)?.name ?? "wybraną kategorię";
    if (!confirm(`Ustawić ${n} ${word} w kategorii „${name}”?\n\nSynchronizacja z BaseLinkera tej zmiany nie cofnie.`)) return;
    void post({ action: "category", category }, "category");
  };
  const applyStatus = () => {
    const label = status === "active" ? "widoczne w sklepie" : status === "hidden" ? "ukryte" : "wycofane";
    if (!confirm(`Oznaczyć ${n} ${word} jako ${label}?`)) return;
    void post({ action: "status", status }, "status");
  };
  const applyBrand = () => {
    const what = brand.trim() ? `markę „${brand.trim()}”` : "pustą markę (wyczyści)";
    if (!confirm(`Ustawić ${n} ${word} na ${what}?`)) return;
    void post({ action: "brand", brand }, "brand");
  };
  const applyBadge = () => {
    const name = badge === "nowosc" ? "Nowość" : badge === "promocja" ? "Promocja" : "Bestseller";
    if (!confirm(`${badgeMode === "add" ? "Dodać" : "Zdjąć"} etykietę „${name}” na ${n} ${word}?`)) return;
    void post({ action: "badge", mode: badgeMode, badge }, "badge");
  };
  const applyPrice = () => {
    const value = Number(priceValue.replace(",", "."));
    if (!Number.isFinite(value) || value < 0) { setRes({ ok: false, message: "Wpisz kwotę albo procent." }); return; }
    const how = priceMode === "set" ? `cenę ${value.toFixed(2)} zł` : priceMode === "up-percent" ? `cenę wyższą o ${value}%` : priceMode === "down-percent" ? `cenę niższą o ${value}%` : priceMode === "up-amount" ? `cenę wyższą o ${value.toFixed(2)} zł` : `cenę niższą o ${value.toFixed(2)} zł`;
    if (!confirm(`Ustawić ${n} ${word} na ${how}?\n\nSynchronizacja z BaseLinkera tej ceny nie cofnie.`)) return;
    void post({ action: "price", mode: priceMode, value }, "price");
  };

  return (
    <div className="kc-bulk" role="region" aria-label="Akcje na zaznaczonych produktach">
      <div className="kc-bulk__row">
        <b>Zaznaczono: {n} {word}</b>
        <span className="kc-bulk__group">
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Kategoria">
            <option value="">Kategoria…</option>
            <option value="none">Bez kategorii</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{"· ".repeat(Math.min(c.depth ?? 0, 3))}{c.name}</option>)}
          </select>
          <button type="button" disabled={!!busy || !category} onClick={applyCategory}><RefreshCw size={14} /> {busy === "category" ? "Zmieniam…" : "Zmień kategorię"}</button>
        </span>
        <span className="kc-bulk__group">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Widoczność">
            <option value="active">Widoczny w sklepie</option>
            <option value="hidden">Ukryty</option>
            <option value="archived">Wycofany</option>
          </select>
          <button type="button" disabled={!!busy} onClick={applyStatus}>{busy === "status" ? "Zmieniam…" : "Zmień widoczność"}</button>
        </span>
        <button type="button" className="kc-bulk__clear" onClick={() => toggleAll(false)} title="Odznacz wszystko"><X size={14} /></button>
      </div>
      <div className="kc-bulk__row">
        <span className="kc-bulk__group">
          <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Marka (puste = wyczyść)" aria-label="Marka" maxLength={80} />
          <button type="button" disabled={!!busy} onClick={applyBrand}>{busy === "brand" ? "Zmieniam…" : "Ustaw markę"}</button>
        </span>
        <span className="kc-bulk__group">
          <select value={badgeMode} onChange={(e) => setBadgeMode(e.target.value as "add" | "remove")} aria-label="Dodać czy zdjąć etykietę">
            <option value="add">Dodaj etykietę</option>
            <option value="remove">Zdejmij etykietę</option>
          </select>
          <select value={badge} onChange={(e) => setBadge(e.target.value)} aria-label="Etykieta">
            <option value="nowosc">Nowość</option>
            <option value="promocja">Promocja</option>
            <option value="bestseller">Bestseller</option>
          </select>
          <button type="button" disabled={!!busy} onClick={applyBadge}>{busy === "badge" ? "Zmieniam…" : "Zastosuj"}</button>
        </span>
        <span className="kc-bulk__group">
          <select value={priceMode} onChange={(e) => setPriceMode(e.target.value)} aria-label="Jak zmienić cenę">
            <option value="set">Ustaw cenę (zł)</option>
            <option value="up-percent">Podnieś o %</option>
            <option value="down-percent">Obniż o %</option>
            <option value="up-amount">Dodaj zł</option>
            <option value="down-amount">Odejmij zł</option>
          </select>
          <input type="text" inputMode="decimal" value={priceValue} onChange={(e) => setPriceValue(e.target.value)} placeholder="0" aria-label="Wartość zmiany ceny" />
          <button type="button" disabled={!!busy || !priceValue.trim()} onClick={applyPrice}>{busy === "price" ? "Zmieniam…" : "Zmień cenę"}</button>
        </span>
      </div>
      {res && <p className={`kc-bulk__res ${res.ok ? "is-ok" : "is-bad"}`}>{res.message}</p>}
    </div>
  );
}
