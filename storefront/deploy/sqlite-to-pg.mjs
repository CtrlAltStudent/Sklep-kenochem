// Jednorazowe przeniesienie bazy sklepu z pliku SQLite do PostgreSQL.
// Uruchamiane na serwerze, gdy schemat PostgreSQL już istnieje (osobny start z PAYLOAD_DB_PUSH=1).
// Najpierw podmienia stary numer telefonu w tekstach, potem kopiuje tabele o tych samych kolumnach.
// Nie wypisuje haseł ani treści.

import { DatabaseSync } from "node:sqlite";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const sqliteFile = process.argv[2];
const url = process.env.DATABASE_URL;
if (!sqliteFile || !url) {
  console.error("Użycie: DATABASE_URL=postgres://… node sqlite-to-pg.mjs /data/sonax.db");
  process.exit(1);
}

const OLD = [
  ["+48 500 021 705", "+48 664 953 377"],
  ["tel:+48500021705", "tel:+48664953377"],
  ["500 021 705", "664 953 377"],
];

function replacePhones(db) {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all();
  let cells = 0;
  for (const { name } of tables) {
    const cols = db.prepare(`PRAGMA table_info(${JSON.stringify(name)})`).all();
    for (const col of cols) {
      if (!/CHAR|TEXT|CLOB/i.test(col.type || "") && col.type) continue;
      const quotedTable = `"${name.replace(/"/g, '""')}"`;
      const quotedCol = `"${col.name.replace(/"/g, '""')}"`;
      for (const [from, to] of OLD) {
        try {
          const info = db.prepare(`UPDATE ${quotedTable} SET ${quotedCol} = replace(${quotedCol}, ?, ?) WHERE ${quotedCol} LIKE ?`).run(from, to, `%${from}%`);
          cells += info.changes;
        } catch { /* kolumna liczbowa */ }
      }
    }
  }
  console.log(`telefon: podmieniono ${cells} pól w SQLite`);
}

function replacePhoneFile(file) {
  try {
    const raw = readFileSync(file, "utf8");
    let next = raw;
    for (const [from, to] of OLD) next = next.split(from).join(to);
    if (next !== raw) writeFileSync(file, next);
    console.log(next === raw ? "telefon: plik integracji bez starego numeru" : "telefon: poprawiono plik integracji");
  } catch {
    console.log("telefon: brak pliku integracji");
  }
}

const ident = (name) => `"${String(name).replace(/"/g, '""')}"`;

const LEGACY = { draft: "hidden" };
const enums = new Map();

function coerce(value, dataType) {
  if (value == null) return null;
  const labels = enums.get(dataType);
  if (labels) {
    if (value === "") return null;
    const s = String(value);
    if (labels.has(s)) return s;
    const mapped = LEGACY[s];
    if (mapped && labels.has(mapped)) return mapped;
    throw new Error(`nieznana wartość „${s}” dla ${dataType}`);
  }
  if (dataType === "boolean") return value === true || value === 1 || value === "1" || value === "t";
  if (dataType === "json" || dataType === "jsonb") {
    if (typeof value === "object") return JSON.stringify(value);
    const s = String(value);
    return s.trim() ? s : null;
  }
  if (/timestamp|date|time/i.test(dataType) && value === "") return null;
  if (/int|numeric|double|real/i.test(dataType) && value === "") return null;
  return value;
}

const sqlite = new DatabaseSync(sqliteFile);
replacePhones(sqlite);
replacePhoneFile(path.join(path.dirname(sqliteFile), "integrations.json"));

const client = new pg.Client({ connectionString: url });
await client.connect();
const enumRows = await client.query("SELECT t.typname AS name, e.enumlabel AS label FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid");
for (const row of enumRows.rows) {
  if (!enums.has(row.name)) enums.set(row.name, new Set());
  enums.get(row.name).add(row.label);
}

const pgTables = await client.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
`);
const have = new Set(pgTables.rows.map((r) => r.table_name));
if (!have.has("products")) {
  console.error("W PostgreSQL nie ma jeszcze tabeli products. Najpierw uruchom sklep z PAYLOAD_DB_PUSH=1.");
  process.exit(1);
}

const sqliteTables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all().map((r) => r.name);
await client.query("SET session_replication_role = replica");
for (const table of [...have]) {
  await client.query(`TRUNCATE TABLE ${ident(table)} CASCADE`);
}

const important = ["products", "users", "orders", "categories", "media", "redirects", "pages"];
const summary = [];

for (const table of sqliteTables) {
  if (!have.has(table)) {
    summary.push(`${table}: pominięta (nie ma jej w PostgreSQL)`);
    continue;
  }
  const pgCols = await client.query(
    `SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  );
  const types = new Map(pgCols.rows.map((c) => [c.column_name, c.data_type === "USER-DEFINED" ? c.udt_name : c.data_type]));
  const liteCols = sqlite.prepare(`PRAGMA table_info(${JSON.stringify(table)})`).all().map((c) => c.name);
  const cols = liteCols.filter((c) => types.has(c));
  if (!cols.length) {
    summary.push(`${table}: brak wspólnych kolumn`);
    continue;
  }
  const rows = sqlite.prepare(`SELECT ${cols.map(ident).join(", ")} FROM ${ident(table)}`).all();
  const size = 100;
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size);
    const values = [];
    const holders = chunk.map((row, r) => {
      const one = cols.map((col, c) => {
        values.push(coerce(row[col], types.get(col)));
        return `$${r * cols.length + c + 1}`;
      });
      return `(${one.join(", ")})`;
    });
    await client.query(
      `INSERT INTO ${ident(table)} (${cols.map(ident).join(", ")}) VALUES ${holders.join(", ")}`,
      values,
    );
  }
  const got = Number((await client.query(`SELECT COUNT(*)::int AS n FROM ${ident(table)}`)).rows[0].n);
  summary.push(`${table}: ${rows.length} → ${got}`);
  if (got !== rows.length) {
    console.error(summary.join("\n"));
    console.error(`Liczba wierszy nie zgadza się w tabeli ${table}`);
    process.exit(1);
  }
}

const seqs = await client.query(`
  SELECT c.relname AS table, pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), 'id') AS seq
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
`);
for (const row of seqs.rows) {
  if (!row.seq) continue;
  try {
    await client.query(`SELECT setval($1, GREATEST((SELECT COALESCE(MAX(id), 1) FROM ${ident(row.table)}), 1), true)`, [row.seq]);
  } catch (e) {
    console.log(`licznik ${row.table}: ${e.message}`);
  }
}

await client.query("SET session_replication_role = DEFAULT");
await client.end();
sqlite.close();

console.log(summary.filter((line) => important.some((t) => line.startsWith(`${t}:`)) || line.includes("pominięta")).join("\n"));
console.log("kopiowanie skończone");
