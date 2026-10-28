"use client";

import { Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Hit = {
  id: number;
  inventoryId: number;
  inventoryName: string;
  name: string;
  sku: string;
  ean: string;
  price: number | null;
  stock: number | null;
  image: string;
  variant: boolean;
  inShop: boolean;
  bundle?: boolean;
  bundleMissing?: string[];
};

type Field = "all" | "name" | "sku" | "ean";
type Kind = "all" | "product" | "bundle";
type Catalog = { id: number; name: string };

const keyOf = (h: { inventoryId: number; id: number }) => `${h.inventoryId}:${h.id}`;
const pln = (n: number | null) => (n == null ? "—" : `${n.toFixed(2).replace(".", ",")} zł`);
const PLACEHOLDER: Record<Field, string> = {
  all: "Nazwa, kod SKU albo kilka kodów po przecinku — np. FRE000006",
  name: "Fragment nazwy produktu",
  sku: "Kod SKU albo kilka kodów po przecinku — np. FRE000006",
  ean: "Kod EAN albo kilka kodów po przecinku",
};

export function ImportStudio() {
  const [tab, setTab] = useState<"import" | "export">("import");
  const [query, setQuery] = useState("");
  const [field, setField] = useState<Field>("all");
  const [kind, setKind] = useState<Kind>("all");
  const [inventoryId, setInventoryId] = useState(0);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [note, setNote] = useState("");
  const [bad, setBad] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Hit[]>([]);
  const [pulling, setPulling] = useState(false);
  const [pullMsg, setPullMsg] = useState("");

  const searchBody = (q: string) => JSON.stringify({ q, field, kind, inventoryId: inventoryId || undefined });

  useEffect(() => {
    fetch("/api/baselinker/product-search", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: "" }),
    })
      .then((r) => r.json())
      .then((j: { catalogs?: Catalog[] }) => { if (j.catalogs?.length) setCatalogs(j.catalogs); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      setSearching(true);
      setBad(false);
      fetch("/api/baselinker/product-search", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: searchBody(q),
      })
        .then((r) => r.json())
        .then((j: { ok?: boolean; message?: string; products?: Hit[]; catalogs?: Catalog[] }) => {
          setHits(j.products ?? []);
          setNote(j.message || "");
          setBad(!j.ok);
          if (j.catalogs?.length) setCatalogs(j.catalogs);
        })
        .catch(() => { setHits([]); setNote("Brak połączenia."); setBad(true); })
        .finally(() => setSearching(false));
    }, 400);
    return () => clearTimeout(t);
  }, [query, field, kind, inventoryId]);

  const chosen = useMemo(() => new Set(selected.map(keyOf)), [selected]);
  const visibleOn = !!hits?.length && hits.every((h) => chosen.has(keyOf(h)));

  const toggle = (hit: Hit) => setSelected((cur) => (cur.some((p) => keyOf(p) === keyOf(hit)) ? cur.filter((p) => keyOf(p) !== keyOf(hit)) : [...cur, hit]));
  const toggleVisible = () => setSelected((cur) => {
    if (!hits?.length) return cur;
    const ids = new Set(hits.map(keyOf));
    return visibleOn ? cur.filter((p) => !ids.has(keyOf(p))) : [...cur.filter((p) => !ids.has(keyOf(p))), ...hits];
  });

  const pull = async () => {
    if (!selected.length) return;
    if (!confirm(`Zaciągnąć do sklepu ${selected.length} ${selected.length === 1 ? "produkt" : "produktów"}?`)) return;
    setPulling(true);
    setPullMsg("");
    try {
      const r = await fetch("/api/baselinker/sync-products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks: selected.map((p) => ({ id: p.id, inventoryId: p.inventoryId })) }),
      }).then((x) => x.json()) as { ok?: boolean; message?: string };
      setPullMsg(r.message || (r.ok ? "Gotowe." : "Nie udało się zaciągnąć."));
      setBad(!r.ok);
      if (r.ok) {
        setSelected([]);
        const again = await fetch("/api/baselinker/product-search", {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: searchBody(query.trim()),
        }).then((x) => x.json()) as { products?: Hit[] };
        if (again.products) setHits(again.products);
      }
    } catch {
      setPullMsg("Brak połączenia.");
      setBad(true);
    } finally {
      setPulling(false);
    }
  };

  return (
    <div className="kc-xfer">
      <div className="kc-xfer__tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "import"} className={tab === "import" ? "is-on" : ""} onClick={() => setTab("import")}>Import z BaseLinkera</button>
        <button type="button" role="tab" aria-selected={tab === "export"} className={tab === "export" ? "is-on" : ""} onClick={() => setTab("export")}>Eksport</button>
      </div>

      {tab === "export" ? (
        <section className="kc-card kc-xfer__export">
          <h2>Lista produktów ze sklepu</h2>
          <p>Plik Excela z tym, co jest już w sklepie: nazwa, kod, EAN, marka, kategoria, ceny, stan i czy produkt jest widoczny.</p>
          <a className="kc-xfer__go" href="/api/export/products"><Download size={16} /> Pobierz wszystkie produkty</a>
        </section>
      ) : (
        <section className="kc-card kc-xfer__import">
          <label className="kc-xfer__search">
            <Search size={18} />
            <textarea
              rows={2}
              value={query}
              placeholder={PLACEHOLDER[field]}
              aria-label="Szukaj w BaseLinkerze"
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim().length < 2) { setHits(null); setNote(""); setBad(false); }
              }}
            />
          </label>
          <div className="kc-xfer__filters">
            <label>
              Szukaj po
              <select value={field} onChange={(e) => setField(e.target.value as Field)} aria-label="Czego dotyczy wpis">
                <option value="all">Nazwie, SKU i EAN</option>
                <option value="name">Tylko nazwie</option>
                <option value="sku">Tylko SKU</option>
                <option value="ean">Tylko EAN</option>
              </select>
            </label>
            <label>
              Rodzaj
              <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} aria-label="Produkt albo zestaw">
                <option value="all">Produkty i zestawy</option>
                <option value="product">Tylko produkty</option>
                <option value="bundle">Tylko zestawy</option>
              </select>
            </label>
            <label>
              Katalog
              <select value={inventoryId} onChange={(e) => setInventoryId(Number(e.target.value))} aria-label="Katalog BaseLinkera">
                <option value={0}>Wszystkie katalogi</option>
                {catalogs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <div className="kc-xfer__bar">
            <span>{searching ? "Szukam…" : hits ? `Znaleziono ${hits.length}` : "Wpisz co najmniej 2 znaki."}</span>
            {!!hits?.length && (
              <button type="button" onClick={toggleVisible}>{visibleOn ? "Odznacz tę listę" : "Zaznacz tę listę"}</button>
            )}
            {!!selected.length && <button type="button" onClick={() => setSelected([])}>Wyczyść zaznaczenie ({selected.length})</button>}
          </div>
          {(note || pullMsg) && <p className={`kc-xfer__note ${bad ? "is-bad" : ""}`}>{pullMsg || note}</p>}

          {!!hits?.length && (
            <div className="kc-xfer__scroll">
              <table className="kc-xfer__table">
                <thead>
                  <tr>
                    <th />
                    <th>Produkt</th>
                    <th>SKU</th>
                    <th>EAN</th>
                    <th>Cena</th>
                    <th>Stan</th>
                    <th>Katalog</th>
                    <th>Sklep</th>
                  </tr>
                </thead>
                <tbody>
                  {hits.map((h) => (
                    <tr key={keyOf(h)} className={chosen.has(keyOf(h)) ? "is-on" : ""} onClick={() => toggle(h)}>
                      <td><input type="checkbox" checked={chosen.has(keyOf(h))} onChange={() => toggle(h)} onClick={(e) => e.stopPropagation()} aria-label={`Zaznacz ${h.name}`} /></td>
                      <td>
                        <span className="kc-xfer__name">
                          {h.image
                            // eslint-disable-next-line @next/next/no-img-element -- miniatura z BaseLinkera
                            ? <img src={h.image} alt="" />
                            : <i />}
                          <span>
                            <b>{h.name}</b>
                            {h.bundle && <small>zestaw</small>}
                            {h.variant && <small>wariant</small>}
                            {!!h.bundleMissing?.length && <small>brakuje: {h.bundleMissing.slice(0, 3).join(", ")}{h.bundleMissing.length > 3 ? "…" : ""}</small>}
                          </span>
                        </span>
                      </td>
                      <td className="kc-xfer__mono">{h.sku || "—"}</td>
                      <td className="kc-xfer__mono">{h.ean || "—"}</td>
                      <td>{pln(h.price)}</td>
                      <td>{h.stock == null ? "—" : `${h.stock} szt.`}</td>
                      <td>{h.inventoryName}</td>
                      <td>{h.inShop ? <em className="is-in">już jest</em> : <em>nowy</em>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className={`kc-xfer__dock ${selected.length ? "is-on" : ""}`}>
            <div>
              <b>{selected.length}</b> zaznaczonych
              {!!selected.length && <small>{selected.slice(0, 4).map((p) => p.sku || p.name).join(", ")}{selected.length > 4 ? ` +${selected.length - 4}` : ""}</small>}
            </div>
            <button type="button" className="kc-xfer__go" disabled={!selected.length || pulling} onClick={() => void pull()}>
              {pulling ? "Zaciągam…" : "Zaciągnij do sklepu"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
