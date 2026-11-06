// Wgrywa opisy kategorii i ich tytuły/opisy dla Google z pliku docs/opisy-kategorii.md.
// Domyślnie tylko pokazuje, co by zmienił. Zapis: dopisz --zapisz. Nadpisanie opisów wpisanych już w panelu: --nadpisz.
// Uruchomienie (w storefront/):
//   npx cross-env PAYLOAD_DB_PUSH=0 NODE_OPTIONS=--no-deprecation payload run src/scripts/import-category-descriptions.ts
//   … import-category-descriptions.ts --zapisz
//
// Format pliku: blok zaczyna się od „## slug | Nazwa”, potem linie „- Źródło:”, „- Tytuł w Google:”, „- Opis w Google:”,
// a dalej treść w Markdown (akapity, listy, **pogrubienia**, [linki](/adres)). Linie z „>” (pytania) są pomijane.
// Blok z „POMIŃ” w linii źródła nie jest wgrywany.

import fs from "node:fs";
import path from "node:path";
import { getPayload } from "payload";
import config from "@payload-config";
import { convertMarkdownToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";

// „payload run” nie zawsze przekazuje argumenty – można też użyć zmiennej KATEGORIE="--zapisz" albo KATEGORIE="--sql plik.sql"
const args = [...process.argv.slice(2), ...(process.env.KATEGORIE ?? "").split(/\s+/).filter(Boolean)];
const save = args.includes("--zapisz");
const overwrite = args.includes("--nadpisz");
const file = path.resolve(process.cwd(), "..", "docs", "opisy-kategorii.md");

type Block = { slug: string; name: string; source: string; title: string; description: string; body: string };

function parse(md: string): Block[] {
  const blocks: Block[] = [];
  let cur: Block | null = null;
  const lines: string[] = [];
  const flush = () => {
    if (cur) blocks.push({ ...cur, body: lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() });
    lines.length = 0;
  };
  for (const raw of md.split(/\r?\n/)) {
    const head = raw.match(/^##\s+([a-z0-9-]+)\s*\|\s*(.+)$/);
    if (head) {
      flush();
      cur = { slug: head[1], name: head[2].trim(), source: "", title: "", description: "", body: "" };
      continue;
    }
    if (!cur) continue;
    if (/^#\s/.test(raw) || /^---\s*$/.test(raw)) { flush(); cur = null; continue; }
    const meta = raw.match(/^-\s+(Źródło|Tytuł w Google|Opis w Google):\s*(.*)$/);
    if (meta && !lines.some((l) => l.trim())) {
      const v = meta[2].trim();
      if (meta[1] === "Źródło") cur.source = v;
      else if (meta[1] === "Tytuł w Google") cur.title = v;
      else cur.description = v;
      continue;
    }
    if (/^>/.test(raw)) continue;
    lines.push(raw);
  }
  flush();
  return blocks;
}

const hasText = (d: unknown) => /"text":"[^"]*\S/.test(JSON.stringify(d ?? null));

const payload = await getPayload({ config });
const editorConfig = await editorConfigFactory.default({ config: payload.config });
const blocks = parse(fs.readFileSync(file, "utf8"));

// --sql <plik>: zamiast zapisu przez Payload tworzy plik SQL dla bazy PostgreSQL na serwerze (psql w kontenerze).
// Warunki w SQL pilnują, żeby nie nadpisać tekstów wpisanych już w panelu (chyba że --nadpisz).
const sqlAt = args.indexOf("--sql");
if (sqlAt >= 0) {
  const out = path.resolve(args[sqlAt + 1] || "opisy-kategorii.sql");
  const q = (s: string) => `$q$${s.replace(/\$q\$/g, "")}$q$`;
  const empty = (col: string) => (overwrite ? "true" : `coalesce(btrim(${col}), '') = ''`);
  const lines = ["BEGIN;"];
  let n = 0;
  for (const b of blocks) {
    if (/POMIŃ/i.test(b.source)) continue;
    n++;
    if (b.body) {
      const json = JSON.stringify(convertMarkdownToLexical({ editorConfig, markdown: b.body }));
      const cond = overwrite ? "true" : `(description is null or description::text !~ '"text": ?"[^"]*[^"[:space:]]')`;
      lines.push(`UPDATE categories SET description = ${q(json)}::jsonb, updated_at = now() WHERE slug = ${q(b.slug)} AND ${cond};`);
    }
    if (b.title) lines.push(`UPDATE categories SET seo_title = ${q(b.title)} WHERE slug = ${q(b.slug)} AND ${empty("seo_title")};`);
    if (b.description) lines.push(`UPDATE categories SET seo_description = ${q(b.description)} WHERE slug = ${q(b.slug)} AND ${empty("seo_description")};`);
  }
  lines.push(`SELECT count(*) FILTER (WHERE description IS NOT NULL) AS z_opisem, count(*) FILTER (WHERE seo_title <> '') AS z_tytulem, count(*) AS wszystkie FROM categories;`, "COMMIT;");
  fs.writeFileSync(out, lines.join("\n") + "\n");
  console.log(`Zapisano ${out}: ${n} kategorii.`);
  process.exit(0);
}
console.log(`${file}: ${blocks.length} kategorii w pliku. Tryb: ${save ? "ZAPIS" : "podgląd (bez zmian)"}${overwrite ? ", nadpisywanie" : ""}.`);

let changed = 0;
for (const b of blocks) {
  if (/POMIŃ/i.test(b.source)) { console.log(`- ${b.slug}: pominięta (POMIŃ)`); continue; }
  const doc = (await payload.find({ collection: "categories", where: { slug: { equals: b.slug } }, limit: 1, depth: 0 })).docs[0];
  if (!doc) { console.log(`! ${b.slug}: nie ma takiej kategorii w sklepie`); continue; }
  const data: Record<string, unknown> = {};
  const notes: string[] = [];
  if (b.body && (overwrite || !hasText(doc.description))) { data.description = convertMarkdownToLexical({ editorConfig, markdown: b.body }); notes.push(`opis ${b.body.split(/\s+/).length} słów`); }
  else if (b.body) notes.push("opis już jest – zostawiam");
  const seo = { ...(doc.seo ?? {}) };
  if (b.title && (overwrite || !seo.title?.trim())) { seo.title = b.title; notes.push(`tytuł ${b.title.length} zn.`); }
  if (b.description && (overwrite || !seo.description?.trim())) { seo.description = b.description; notes.push(`opis Google ${b.description.length} zn.`); }
  if (seo.title !== doc.seo?.title || seo.description !== doc.seo?.description) data.seo = seo;
  if (!Object.keys(data).length) { console.log(`= ${b.slug}: bez zmian (${notes.join(", ")})`); continue; }
  changed++;
  console.log(`${save ? "✓" : "~"} ${b.slug} (${doc.name}): ${notes.join(", ")}`);
  if (save) await payload.update({ collection: "categories", id: doc.id, data });
}
console.log(save ? `Zapisano ${changed} kategorii.` : `Do zmiany: ${changed} kategorii. Uruchom z --zapisz, żeby zapisać.`);
process.exit(0);
