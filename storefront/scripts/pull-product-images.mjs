// Ściąga zdjęcia produktów z obcych adresów na dysk sklepu i podpina je jako pliki.
// Uruchamiać w kontenerze sklepu (jest tam sharp i baza /data/sonax.db, pliki w /app/media).
// Wznawialne: pomija wiersze, które mają już plik.

import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import sharp from "sharp";
import { mkdirSync, statfsSync, writeFileSync } from "node:fs";
import path from "node:path";

const DB = process.env.SONAX_DB || "/data/sonax.db";
const DIR = process.env.SONAX_MEDIA || "/app/media";
const ALLOWED = new Set(["www.sonax.sklep.pl", "sonax.sklep.pl", "kenochem.com", "www.kenochem.com", "upload.cdn.baselinker.com", "autokosmetyk.com", "www.autokosmetyk.com"]);
const MAX_EDGE = 2000;
const PARALLEL = 3;

mkdirSync(DIR, { recursive: true });
const free = statfsSync(DIR);
const freeGb = (Number(free.bavail) * Number(free.bsize)) / 1024 ** 3;
if (freeGb < 2) {
  console.error(`Za mało miejsca na dysku (${freeGb.toFixed(1)} GB). Przerywam.`);
  process.exit(1);
}

const db = new DatabaseSync(DB);
db.exec("PRAGMA busy_timeout=20000");

const rows = db
  .prepare(
    `SELECT i.id, i.url, i._parent_id AS productId, p.name AS name
     FROM products_images i
     LEFT JOIN products p ON p.id = i._parent_id
     WHERE i.media_id IS NULL AND i.url LIKE 'http%'
     ORDER BY i._parent_id, i._order`,
  )
  .all();
const limit = Number(process.env.SONAX_LIMIT || 0);
if (limit > 0) rows.splice(limit);

console.log(`Do ściągnięcia: ${rows.length}. Wolne miejsce: ${freeGb.toFixed(1)} GB.`);

const insertMedia = db.prepare(
  `INSERT INTO media (
     alt, kind, updated_at, created_at, url, filename, mime_type, filesize, width, height, focal_x, focal_y,
     sizes_thumb_url, sizes_thumb_width, sizes_thumb_height, sizes_thumb_mime_type, sizes_thumb_filesize, sizes_thumb_filename,
     sizes_card_url, sizes_card_width, sizes_card_height, sizes_card_mime_type, sizes_card_filesize, sizes_card_filename
   ) VALUES (
     ?, 'image', ?, ?, ?, ?, ?, ?, ?, ?, 50, 50,
     ?, ?, ?, ?, ?, ?,
     ?, ?, ?, ?, ?, ?
   )`,
);
const link = db.prepare("UPDATE products_images SET media_id = ?, url = ? WHERE id = ?");

const extOf = { jpeg: "jpg", png: "png", webp: "webp", gif: "gif" };
const mimeOf = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

async function download(url) {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
    headers: { "User-Agent": "SonaxShop/1.0 (pobranie zdjec produktow)", Accept: "image/*,*/*" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = (res.headers.get("content-type") || "").split(";")[0].trim();
  if (type && !type.startsWith("image/") && type !== "application/octet-stream") throw new Error(`to nie obrazek (${type})`);
  const len = Number(res.headers.get("content-length") || 0);
  if (len > 20 * 1024 * 1024) throw new Error("plik większy niż 20 MB");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 32) throw new Error("pusty plik");
  if (buf.length > 20 * 1024 * 1024) throw new Error("plik większy niż 20 MB");
  return buf;
}

async function variant(buf, edge) {
  const out = await sharp(buf, { failOn: "none" }).resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true }).toBuffer({ resolveWithObject: true });
  return out;
}

async function saveOne(row) {
  const host = hostOf(row.url);
  if (!ALLOWED.has(host)) throw new Error(`obcy adres: ${host || row.url}`);
  let buf = await download(row.url);
  const meta = await sharp(buf, { failOn: "none" }).metadata();
  const format = extOf[meta.format] ? meta.format : "jpeg";
  const ext = extOf[format];
  const mime = mimeOf[format];
  let pipeline = sharp(buf, { failOn: "none" }).rotate();
  if ((meta.width || 0) > MAX_EDGE || (meta.height || 0) > MAX_EDGE) {
    pipeline = pipeline.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true });
  }
  if (format === "jpeg") pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
  else if (format === "png") pipeline = pipeline.png();
  else if (format === "webp") pipeline = pipeline.webp({ quality: 85 });
  else pipeline = pipeline.gif();
  const main = await pipeline.toBuffer({ resolveWithObject: true });
  buf = main.data;
  const width = main.info.width;
  const height = main.info.height;
  const base = `towar-${row.id}`;
  const filename = `${base}.${ext}`;
  writeFileSync(path.join(DIR, filename), buf);

  const sizes = {};
  for (const [name, edge] of [["thumb", 300], ["card", 600]]) {
    if (width <= edge && height <= edge) continue;
    const made = await variant(buf, edge);
    const sname = `${base}-${made.info.width}x${made.info.height}.${ext}`;
    writeFileSync(path.join(DIR, sname), made.data);
    sizes[name] = { url: `/api/media/file/${sname}`, w: made.info.width, h: made.info.height, mime, bytes: made.data.length, filename: sname };
  }

  const now = new Date().toISOString();
  const alt = String(row.name || "Zdjęcie produktu").slice(0, 180);
  const url = `/api/media/file/${filename}`;
  const t = sizes.thumb;
  const c = sizes.card;
  const info = insertMedia.run(
    alt, now, now, url, filename, mime, buf.length, width, height,
    t?.url ?? null, t?.w ?? null, t?.h ?? null, t?.mime ?? null, t?.bytes ?? null, t?.filename ?? null,
    c?.url ?? null, c?.w ?? null, c?.h ?? null, c?.mime ?? null, c?.bytes ?? null, c?.filename ?? null,
  );
  link.run(Number(info.lastInsertRowid), url, row.id);
  return url;
}

let done = 0;
let failed = 0;
const errors = [];

async function worker(queue) {
  for (;;) {
    const row = queue.pop();
    if (!row) return;
    try {
      await saveOne(row);
      done++;
    } catch (err) {
      failed++;
      errors.push(`${row.id} ${row.url} — ${err.message}`);
    }
    const total = done + failed;
    if (total % 25 === 0 || total === rows.length) console.log(`zapisane ${done}, błędy ${failed}, zostało ${rows.length - total}`);
  }
}

const queue = [...rows];
await Promise.all(Array.from({ length: PARALLEL }, () => worker(queue)));

console.log(`Koniec. Zapisane: ${done}. Błędy: ${failed}.`);
if (errors.length) {
  console.log("Nieudane:");
  for (const line of errors.slice(0, 40)) console.log(" - " + line);
  if (errors.length > 40) console.log(` … i jeszcze ${errors.length - 40}`);
}

const imgRe = /https?:\/\/[^"'\\\s>]+\.(?:jpg|jpeg|png|webp|gif)/gi;
const described = db.prepare("SELECT id, description_html AS html FROM products WHERE description_html LIKE '%http%'").all();
const urls = new Set();
for (const row of described) for (const m of String(row.html).match(imgRe) || []) urls.add(m);
console.log(`Obrazki w opisach: ${urls.size} adresów, ${described.length} produktów.`);
const localOf = new Map();
for (const url of urls) {
  try {
    const saved = await saveOne({ id: `opis-${createHash("sha1").update(url).digest("hex").slice(0, 16)}`, url, name: "Zdjęcie w opisie" });
    localOf.set(url, saved);
    console.log("opis OK", url);
  } catch (err) {
    console.log("opis błąd", url, "—", err.message);
  }
}
const updateHtml = db.prepare("UPDATE products SET description_html = ? WHERE id = ?");
let rewritten = 0;
for (const row of described) {
  let html = String(row.html);
  let changed = false;
  for (const [remote, local] of localOf) {
    if (html.includes(remote)) {
      html = html.split(remote).join(local);
      changed = true;
    }
  }
  if (changed) {
    updateHtml.run(html, row.id);
    rewritten++;
  }
}
console.log(`Opisy podmienione: ${rewritten}.`);
db.close();
