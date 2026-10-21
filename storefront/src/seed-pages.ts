// Treści przeniesione z obecnego sklepu sonax.sklep.pl:
//  - regulamin, polityki, czas realizacji → kolekcja „Strony”
//  - wpisy bloga i przewodniki zakupowe → kolekcja „Blog” (ze zdjęciami) + przekierowania starych adresów
// Najpierw: node scripts/fetch-sonax-content.mjs
// Uruchomienie: npm run seed:pages   (istniejące treści nie są nadpisywane – chyba że FORCE=1)

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { JSDOM } from "jsdom";
import { getPayload } from "payload";
import config from "@payload-config";
import { convertHTMLToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";

const payload = await getPayload({ config });
const editorConfig = await editorConfigFactory.default({ config: payload.config });
const log = (m: string) => payload.logger.info(`[seed:pages] ${m}`);
const force = process.env.FORCE === "1";
const data = (f: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "data", f), "utf8"));

const pages = data("pages-import.json") as Record<string, { title: string; html: string }>;
const posts = data("posts-import.json") as {
  slug: string; title: string; excerpt: string; date: string; tag: "poradnik" | "detailing"; oldPath: string; cover: string | null; html: string;
}[];

// Zdjęcie z sonax.sklep.pl → Media (raz; kolejne uruchomienia używają istniejącego pliku)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sonax-media-"));
async function media(url: string, alt: string) {
  const original = url.replace(/-\d+x\d+(?=\.\w+$)/, "");
  const filename = decodeURIComponent(path.basename(new URL(original).pathname));
  const found = await payload.find({ collection: "media", where: { filename: { equals: filename } }, limit: 1, depth: 0 });
  if (found.docs[0]) return found.docs[0].id;
  for (const src of [original, url]) {
    const r = await fetch(src, { headers: { "User-Agent": "Mozilla/5.0 (SonaxImport)" }, signal: AbortSignal.timeout(60000) });
    if (!r.ok) continue;
    const file = path.join(tmp, filename);
    fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    const doc = await payload.create({ collection: "media", data: { alt }, filePath: file });
    await new Promise((res) => setTimeout(res, 500));
    return doc.id;
  }
  log(`nie udało się pobrać zdjęcia ${url}`);
  return null;
}

// HTML → treść edytora; obrazki z treści stają się plikami w Media
async function toLexical(html: string, alt: string) {
  const parts = html.split(/(<img\b[^>]*>)/);
  const children: unknown[] = [];
  for (const part of parts) {
    const img = part.match(/^<img\b[^>]*src="([^"]+)"[^>]*>$/);
    if (img) {
      const id = await media(img[1], part.match(/alt="([^"]*)"/)?.[1] || alt);
      if (id) children.push({ type: "upload", version: 3, format: "", id: crypto.randomUUID(), fields: null, relationTo: "media", value: id });
      continue;
    }
    if (!part.trim()) continue;
    children.push(...convertHTMLToLexical({ editorConfig, html: part, JSDOM }).root.children);
  }
  return { root: { type: "root", format: "", indent: 0, version: 1, direction: "ltr", children } } as never;
}

// 1) Strony informacyjne
const meta: Record<string, { template: "legal" | "standard"; intro: string }> = {
  regulamin: { template: "legal", intro: "Zasady zakupów w sklepie internetowym sonax.sklep.pl – zamówienia, płatności, dostawa, zwroty i reklamacje." },
  "polityka-prywatnosci": { template: "legal", intro: "Jakie dane przetwarzamy w sklepie sonax.sklep.pl, dlaczego to robimy i jakie prawa Ci przysługują." },
  "polityka-cookies": { template: "legal", intro: "Z jakich plików cookies korzysta sklep, do czego są potrzebne i jak zarządzać swoimi wyborami." },
  "czas-realizacji": { template: "standard", intro: "Większość dostępnych produktów wysyłamy w ciągu 1 dnia roboczego." },
};
for (const [slug, m] of Object.entries(meta)) {
  const src = pages[slug];
  if (!src) continue;
  const existing = (await payload.find({ collection: "pages", where: { slug: { equals: slug } }, limit: 1, draft: true })).docs[0];
  if (existing && !force) { log(`pomijam „${src.title}” – już istnieje`); continue; }
  // W dokumentach prawnych główne sekcje muszą być H2 – z nich budowany jest spis treści
  const html = m.template === "legal" ? src.html.replace(/<(\/?)h[34]>/g, "<$1h2>") : src.html;
  const doc = {
    title: src.title,
    slug,
    intro: m.intro,
    template: m.template,
    showInFooter: true,
    layout: [{ blockType: "richText" as const, content: await toLexical(html, src.title) }],
    seo: { title: src.title, description: m.intro },
    _status: "published" as const,
  };
  if (existing) await payload.update({ collection: "pages", id: existing.id, data: doc });
  else await payload.create({ collection: "pages", data: doc });
  log(`${existing ? "zaktualizowano" : "dodano"} stronę „${src.title}”`);
}

// 2) Blog i przewodniki
for (const p of posts) {
  const existing = (await payload.find({ collection: "posts", where: { slug: { equals: p.slug } }, limit: 1, draft: true })).docs[0];
  if (existing && !force) { log(`pomijam wpis „${p.title}” – już istnieje`); continue; }
  const doc = {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    cover: p.cover ? await media(p.cover, p.title) : null,
    content: await toLexical(p.html, p.title),
    tag: p.tag,
    publishedAt: p.date,
    seo: { title: p.title, description: p.excerpt.slice(0, 160) },
    _status: "published" as const,
  };
  if (existing) await payload.update({ collection: "posts", id: existing.id, data: doc as never });
  else await payload.create({ collection: "posts", data: doc as never });
  log(`${existing ? "zaktualizowano" : "dodano"} wpis „${p.title}”`);

  const from = p.oldPath;
  const to = `/blog/${p.slug}`;
  if (from !== to && !(await payload.find({ collection: "redirects", where: { from: { equals: from } }, limit: 1 })).docs[0]) {
    await payload.create({ collection: "redirects", data: { from, to, permanent: true, active: true } });
  }
}

fs.rmSync(tmp, { recursive: true, force: true });
log("gotowe ✔");
process.exit(0);
