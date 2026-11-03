"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDocumentInfo, useField } from "@payloadcms/ui";
import { ArrowDown, ArrowUp, FolderTree, Loader2 } from "lucide-react";
import { CatIcon } from "@/components/CatIcon";
import type { IconName } from "@/lib/data";

type Cat = { id: number; name: string; parent?: number | { id: number } | null; order?: number | null; lucide?: string | null; depth?: number | null };

const pid = (c: Cat) => (c.parent == null ? null : typeof c.parent === "object" ? c.parent.id : c.parent);

function kidsOf(rows: Cat[], parent: number | null) {
  return rows
    .filter((c) => pid(c) === parent)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name, "pl"));
}

function flat(rows: Cat[], parent: number | null, depth: number): { cat: Cat; depth: number }[] {
  const out: { cat: Cat; depth: number }[] = [];
  for (const cat of kidsOf(rows, parent)) {
    out.push({ cat, depth });
    out.push(...flat(rows, cat.id, depth + 1));
  }
  return out;
}

function trail(rows: Cat[], cat: Cat) {
  const names = [cat.name];
  let cur = cat;
  for (let i = 0; i < 6 && pid(cur); i++) {
    const parent = rows.find((r) => r.id === pid(cur));
    if (!parent) break;
    names.unshift(parent.name);
    cur = parent;
  }
  return names.join(" › ");
}

function descendants(rows: Cat[], id: number) {
  const banned = new Set<number>([id]);
  const walk = (parent: number) => {
    for (const c of rows) if (pid(c) === parent && !banned.has(c.id)) { banned.add(c.id); walk(c.id); }
  };
  walk(id);
  return banned;
}

export function CategoryTree() {
  const [rows, setRows] = useState<Cat[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [pick, setPick] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    const pull = async () => {
      const all: Cat[] = [];
      for (let page = 1; page <= 20; page++) {
        const j = await fetch(`/api/categories?limit=100&page=${page}&depth=0&sort=name`, { credentials: "include" }).then((r) => r.json());
        all.push(...(j.docs ?? []));
        if (!j.hasNextPage || !j.docs?.length) break;
      }
      return all;
    };
    pull().then(setRows).catch(() => setMsg("Nie udało się wczytać drzewa."));
  }, []);
  useEffect(() => { load(); }, [load]);

  const tree = useMemo(() => (rows ? flat(rows, null, 0) : []), [rows]);

  const save = async (id: number, data: { parent?: number | null; order?: number }, note: string) => {
    setBusy(true);
    setMsg("");
    const r = await fetch(`/api/categories/${id}`, {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    }).then((x) => x.json()).catch(() => null);
    setBusy(false);
    if (!r || r.errors) setMsg(r?.errors?.[0]?.message || "Nie udało się zapisać.");
    else { setMsg(note); load(); }
  };

  const move = (cat: Cat, dir: -1 | 1) => {
    if (!rows) return;
    const sibs = kidsOf(rows, pid(cat));
    const i = sibs.findIndex((s) => s.id === cat.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sibs.length) return;
    const next = [...sibs];
    [next[i], next[j]] = [next[j], next[i]];
    setBusy(true);
    Promise.all(next.map((s, n) => fetch(`/api/categories/${s.id}`, {
      method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: (n + 1) * 10 }),
    }))).then(() => { setMsg("Kolejność zapisana. Na sklepie widać ją po chwili."); load(); }).finally(() => setBusy(false));
  };

  const nest = (cat: Cat) => {
    const raw = pick[cat.id] ?? "";
    const parent = raw ? Number(raw) : null;
    if (parent === pid(cat)) return;
    const under = parent ? rows?.find((c) => c.id === parent)?.name : "działy główne";
    if (!confirm(`Przenieść „${cat.name}” pod: ${under}? Razem z tym, co jest w środku.`)) return;
    const sibs = kidsOf(rows ?? [], parent).filter((s) => s.id !== cat.id);
    void save(cat.id, { parent, order: (sibs.length + 1) * 10 }, `Przeniesiono „${cat.name}”.`);
  };

  if (!rows) return <p className="kc-muted">Wczytuję drzewo kategorii…</p>;

  return (
    <section className="kc-card kc-tree">
      <header className="kc-card__head">
        <h2><FolderTree size={16} /> Ułóż kategorie</h2>
        <span className="kc-muted">{busy ? <Loader2 size={14} className="kc-spin" /> : "strzałki zmieniają kolejność, lista wkłada pod inny dział"}</span>
      </header>
      <p className="kc-tree__lead">Na liście „Przenieś” najpierw są działy, także Dom i ogród. Dopiero niżej są podkategorie samochodowe. Włożony pod inny dział Neutralizatory znikają z kafelków i wchodzą do menu tego działu.</p>
      <ul className="kc-tree__list">
        {tree.map(({ cat, depth }) => {
          const sibs = kidsOf(rows, pid(cat));
          const at = sibs.findIndex((s) => s.id === cat.id);
          const banned = descendants(rows, cat.id);
          return (
            <li key={cat.id} className="kc-tree__row" style={{ paddingLeft: 12 + depth * 22 }}>
              <span className="kc-tree__icon">{cat.lucide ? <CatIcon name={cat.lucide as IconName} className="h-4 w-4" /> : <CatIcon name="Shapes" className="h-4 w-4" />}</span>
              <span className="kc-tree__name">
                <Link href={`/admin/collections/categories/${cat.id}`}>{cat.name}</Link>
                {depth === 0 && <em>dział</em>}
              </span>
              <span className="kc-tree__move">
                <button type="button" title="Wyżej" disabled={busy || at <= 0} onClick={() => move(cat, -1)}><ArrowUp size={14} /></button>
                <button type="button" title="Niżej" disabled={busy || at < 0 || at >= sibs.length - 1} onClick={() => move(cat, 1)}><ArrowDown size={14} /></button>
              </span>
              <select value={pick[cat.id] ?? String(pid(cat) ?? "")} onChange={(e) => setPick({ ...pick, [cat.id]: e.target.value })} disabled={busy} aria-label={`Gdzie włożyć ${cat.name}`}>
                <option value="">Osobny dział</option>
                <optgroup label="Działy">
                  {kidsOf(rows, null).filter((opt) => !banned.has(opt.id)).map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Podkategorie">
                  {tree.filter(({ cat: opt, depth }) => depth > 0 && !banned.has(opt.id)).map(({ cat: opt }) => (
                    <option key={opt.id} value={opt.id}>{trail(rows, opt)}</option>
                  ))}
                </optgroup>
              </select>
              <button type="button" className="kc-tree__go" disabled={busy || (pick[cat.id] ?? String(pid(cat) ?? "")) === String(pid(cat) ?? "")} onClick={() => nest(cat)}>Przenieś</button>
            </li>
          );
        })}
      </ul>
      {msg && <p className="kc-tree__msg">{msg}</p>}
    </section>
  );
}

// Pole „kategoria nadrzędna” w karcie kategorii. Zwykła lista Payload zaczyna się od podkategorii mycia,
// więc Dom i ogród jest niewidoczny, dopóki nie przewiniesz ponad stu pozycji.
export function CategoryParentField() {
  const { value, setValue } = useField<number | string | { id: number } | null>({ path: "parent" });
  const { id } = useDocumentInfo();
  const [rows, setRows] = useState<Cat[]>([]);
  useEffect(() => {
    let stop = false;
    (async () => {
      const all: Cat[] = [];
      for (let page = 1; page <= 20; page++) {
        const j = await fetch(`/api/categories?limit=100&page=${page}&depth=0&sort=name`, { credentials: "include" }).then((r) => r.json());
        all.push(...(j.docs ?? []));
        if (!j.hasNextPage || !j.docs?.length) break;
      }
      if (!stop) setRows(all);
    })().catch(() => {});
    return () => { stop = true; };
  }, []);
  const self = Number(id);
  const banned = Number.isFinite(self) && self > 0 ? descendants(rows, self) : new Set<number>();
  const current = value == null || value === "" ? "" : String(typeof value === "object" ? value.id : value);
  const roots = kidsOf(rows, null).filter((c) => !banned.has(c.id));
  const deeper = rows.filter((c) => pid(c) != null && !banned.has(c.id));
  return (
    <div className="field-type select kc-parent">
      <label className="field-label" htmlFor="kc-parent">Kategoria nadrzędna</label>
      <select id="kc-parent" value={current} onChange={(e) => setValue(e.target.value ? Number(e.target.value) : null)}>
        <option value="">Osobny dział — w menu i na kafelkach</option>
        <optgroup label="Działy">
          {roots.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </optgroup>
        <optgroup label="Podkategorie">
          {deeper.map((c) => <option key={c.id} value={c.id}>{trail(rows, c)}</option>)}
        </optgroup>
      </select>
      <p className="field-description">Najpierw działy, w tym Dom i ogród. Podkategorie samochodowe są w drugiej grupie.</p>
    </div>
  );
}
