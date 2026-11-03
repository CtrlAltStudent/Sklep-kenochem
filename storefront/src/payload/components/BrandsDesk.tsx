"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Brand = { name: string; slug: string; count: number; image?: string };
type Loose = { id: number; name: string; brand: string };

export function BrandsDesk({ brands, loose }: { brands: Brand[]; loose: Loose[] }) {
  const [rows, setRows] = useState(loose);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? rows.filter((r) => r.name.toLowerCase().includes(n) || r.brand.toLowerCase().includes(n)) : rows;
  }, [rows, q]);

  const assign = async (id: number, brand: string) => {
    setMsg("");
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand }),
    });
    if (!res.ok) { setMsg("Nie udało się zapisać."); return; }
    setRows((list) => list.map((r) => (r.id === id ? { ...r, brand } : r)));
  };

  return (
    <div className="kc-brands">
      <div className="kc-brands__grid">
        {brands.map((b) => (
          <a key={b.slug} className="kc-brands__tile" href={`/marki/${b.slug}`} target="_blank" rel="noreferrer">
            {b.image ? <img src={b.image} alt="" /> : <span>{b.name}</span>}
            <b>{b.name}</b>
            <small>{b.count} prod.</small>
          </a>
        ))}
      </div>
      <p className="kc-brands__note">
        Loga i kolejność zmienisz w <Link href="/admin/globals/homepage?sekcja=loga">układzie strony → Loga marek</Link>.
        Nazwa przy logo jest nazwą marki przy produkcie. Marka spoza tej listy znika ze sklepu.
      </p>
      <section className="kc-card">
        <header className="kc-card__head">
          <h2>Produkty bez marki z listy</h2>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj produktu" />
        </header>
        {msg && <p className="kc-act__msg is-bad">{msg}</p>}
        <ul className="kc-brands__list">
          {shown.map((r) => (
            <li key={r.id}>
              <span>{r.name}</span>
              <select value={brands.some((b) => b.name === r.brand) ? r.brand : ""} onChange={(e) => void assign(r.id, e.target.value)}>
                <option value="">— bez marki —</option>
                {brands.map((b) => <option key={b.slug} value={b.name}>{b.name}</option>)}
              </select>
            </li>
          ))}
          {!shown.length && <li className="is-empty">Wszystkie produkty mają markę z listy albo nie pasują do szukanej nazwy.</li>}
        </ul>
      </section>
    </div>
  );
}
