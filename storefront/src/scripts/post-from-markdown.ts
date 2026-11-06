// Zamienia poradnik z pliku Markdown (docs/poradniki/*.md) na plik SQL, który dodaje opublikowany wpis na blogu
// w bazie PostgreSQL sklepu (tabela posts + wersja w _posts_v + polecane produkty). Sam niczego nie zapisuje w bazie.
// Uruchomienie (w storefront/):
//   WPIS="../docs/poradniki/plik.md" SQL="wpis.sql" OKLADKA=46 npx cross-env PAYLOAD_DB_PUSH=0 NODE_OPTIONS=--no-deprecation payload run src/scripts/post-from-markdown.ts
// Nagłówek pliku (między „---”): title, slug, excerpt, seo_title, seo_description, tag, products (ID po przecinku).
// Jeśli wpis o tym adresie już istnieje, SQL aktualizuje jego treść zamiast dodawać nowy.

import fs from "node:fs";
import path from "node:path";
import { getPayload } from "payload";
import config from "@payload-config";
import { convertMarkdownToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";

const src = path.resolve(process.env.WPIS ?? "");
const out = path.resolve(process.env.SQL ?? "wpis.sql");
const cover = Number(process.env.OKLADKA) || null;
const raw = fs.readFileSync(src, "utf8").replace(/\r\n/g, "\n");
const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!m) throw new Error("Brak nagłówka --- w pliku");
const meta = Object.fromEntries(m[1].split("\n").map((l) => l.match(/^(\w+):\s*(.*)$/)).filter(Boolean).map((x) => [x![1], x![2].trim()]));
const body = m[2].trim();

const payload = await getPayload({ config });
const editorConfig = await editorConfigFactory.default({ config: payload.config });
const content = JSON.stringify(convertMarkdownToLexical({ editorConfig, markdown: body }));

const q = (s: string | null | undefined) => (s == null ? "NULL" : `$q$${String(s).replace(/\$q\$/g, "")}$q$`);
const products = (meta.products ?? "").split(",").map((s: string) => Number(s.trim())).filter(Boolean);
const tag = q(meta.tag || "poradnik");
const sql = `BEGIN;
DO $do$
DECLARE pid integer; vid integer;
BEGIN
  SELECT id INTO pid FROM posts WHERE slug = ${q(meta.slug)};
  IF pid IS NULL THEN
    INSERT INTO posts (title, excerpt, cover_id, content, seo_title, seo_description, slug, tag, published_at, _status, updated_at, created_at)
    VALUES (${q(meta.title)}, ${q(meta.excerpt)}, ${cover ?? "NULL"}, ${q(content)}::jsonb, ${q(meta.seo_title)}, ${q(meta.seo_description)}, ${q(meta.slug)}, ${tag}::enum_posts_tag, now(), 'published', now(), now())
    RETURNING id INTO pid;
  ELSE
    UPDATE posts SET title = ${q(meta.title)}, excerpt = ${q(meta.excerpt)}, content = ${q(content)}::jsonb, seo_title = ${q(meta.seo_title)},
      seo_description = ${q(meta.seo_description)}, tag = ${tag}::enum_posts_tag, _status = 'published', updated_at = now() WHERE id = pid;
    DELETE FROM posts_rels WHERE parent_id = pid AND path = 'relatedProducts';
  END IF;
  UPDATE _posts_v SET latest = false WHERE parent_id = pid;
  INSERT INTO _posts_v (parent_id, version_title, version_excerpt, version_cover_id, version_content, version_seo_title, version_seo_description, version_slug, version_tag, version_published_at, version_updated_at, version_created_at, version__status, latest, created_at, updated_at)
  SELECT id, title, excerpt, cover_id, content, seo_title, seo_description, slug, tag::text::enum__posts_v_version_tag, published_at, updated_at, created_at, 'published', true, now(), now() FROM posts WHERE id = pid
  RETURNING id INTO vid;
${products.map((p, i) => `  INSERT INTO posts_rels ("order", parent_id, path, products_id) SELECT ${i + 1}, pid, 'relatedProducts', ${p} WHERE EXISTS (SELECT 1 FROM products WHERE id = ${p});
  INSERT INTO _posts_v_rels ("order", parent_id, path, products_id) SELECT ${i + 1}, vid, 'version.relatedProducts', ${p} WHERE EXISTS (SELECT 1 FROM products WHERE id = ${p});`).join("\n")}
  RAISE NOTICE 'Wpis % (wersja %)', pid, vid;
END
$do$;
SELECT id, slug, _status, published_at FROM posts WHERE slug = ${q(meta.slug)};
COMMIT;
`;
fs.writeFileSync(out, sql);
console.log(`Zapisano ${out}: „${meta.title}”, ${products.length} produktów, treść ${body.split(/\s+/).length} słów.`);
process.exit(0);
