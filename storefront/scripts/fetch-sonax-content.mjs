// Pobiera treści z obecnego sklepu sonax.sklep.pl (WordPress REST API):
//  - dokumenty i strony informacyjne → src/data/pages-import.json   (npm run seed:pages)
//  - wpisy bloga i przewodniki zakupowe → src/data/posts-import.json (npm run seed:pages)
// Czyści HTML z ozdobników motywu (spisy treści, kafelki, przyciski) i przepina linki na nowe adresy.
// Użycie: node scripts/fetch-sonax-content.mjs

import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const API = "https://www.sonax.sklep.pl/wp-json/wp/v2";
const PAGES = ["regulamin", "polityka-prywatnosci", "polityka-cookies", "czas-realizacji"];
const GUIDE = /^przewodnik-/;
const UA = { "User-Agent": "Mozilla/5.0 (SonaxImport)" };
const pause = () => new Promise((r) => setTimeout(r, 800));
const get = async (url) => {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};
const text = (html) => new JSDOM(`<body>${html}`).window.document.body.textContent.replace(/\s+/g, " ").replace(/\s*\[…\]|\s*\[&hellip;\]/g, "…").trim();

const dir = path.join(import.meta.dirname, "..", "src", "data");
const redirects = new Map(JSON.parse(fs.readFileSync(path.join(dir, "redirects.json"), "utf8")).map((r) => [r.from.replace(/\/+$/, ""), r.to]));

// Stare adresy WordPressa → nowe adresy sklepu
function relink(href) {
  let h = href.replace(/^https?:\/\/(www\.)?sonax\.sklep\.pl/i, "");
  if (!h.startsWith("/")) return href;
  h = h.replace(/\/+(?=[?#]|$)/, "") || "/";
  if (redirects.has(h)) return redirects.get(h);
  const map = [
    [/^\/sklep$/, "/szukaj"],
    [/^\/kategoria-produktu\/.*$/, "/szukaj"],
    [/^\/dostawy-i-platnosci/, "/dostawa-i-platnosci"],
    [/^\/(my-account|moje-konto)(\/.*)?$/, "/konto"],
    [/^\/(contact-us|kontakt)$/, "/kontakt"],
    [/^\/odstapienie-od-umowy$/, "/zwroty-i-reklamacje"],
    [/^\/(koszyk|cart)$/, "/koszyk"],
    [/^\/\d{4}\/\d{2}\/\d{2}\/([^/?#]+)$/, "/blog/$1"],
    [/^\/(przewodnik-[^/?#]+)$/, "/blog/$1"],
    [/^\/przewodniki-zakupowe$/, "/blog"],
  ];
  for (const [re, to] of map) if (re.test(h)) return h.replace(re, to);
  return h;
}

const KEEP = new Set(["P", "H2", "H3", "H4", "UL", "OL", "TABLE", "BLOCKQUOTE"]);
const DROP = "script,style,nav,form,button,svg,iframe,noscript,input,select,textarea,.ez-toc-container,[class*='toc']";
const INLINE = new Set(["#text", "STRONG", "B", "EM", "I", "A", "SMALL", "BR", "SPAN", "CODE", "SUP", "SUB", "MARK"]);

function clean(html, title) {
  const { document } = new JSDOM(`<body>${html}`).window;
  const body = document.body;
  body.querySelectorAll(DROP).forEach((n) => n.remove());
  // FAQ w <details> → śródtytuł + odpowiedź
  body.querySelectorAll("details").forEach((d) => {
    const q = d.querySelector("summary");
    const h = document.createElement("h3");
    h.textContent = q?.textContent.trim() ?? "";
    q?.remove();
    d.replaceWith(h, ...d.childNodes);
  });

  const out = [];
  let run = [];
  const flush = () => {
    const p = document.createElement("p");
    run.forEach((n) => p.appendChild(n.cloneNode(true)));
    run = [];
    const t = p.textContent.replace(/\s+/g, " ").trim();
    if (t.length >= 4 && /\p{L}{3}/u.test(t) && !/^(Treść strony|Toggle)$/i.test(t)) out.push(p);
  };
  const walk = (el) => {
    for (const n of [...el.childNodes]) {
      if (INLINE.has(n.nodeName)) { run.push(n); continue; }
      flush();
      if (n.nodeName === "H1") { const h = document.createElement("h2"); h.innerHTML = n.innerHTML; out.push(h); }
      else if (n.nodeName === "IMG") out.push(n);
      else if (KEEP.has(n.nodeName)) out.push(n);
      else if (n.nodeType === 1) walk(n);
    }
    flush();
  };
  walk(body);

  const wrap = document.createElement("div");
  for (const el of out) {
    if (el.nodeName === "P" && !el.textContent.trim() && !el.querySelector("img")) continue;
    wrap.appendChild(el);
  }
  // Nadtytuł motywu („Twoje dane. Jasne zasady.”) przed treścią
  const lead = wrap.firstElementChild;
  if (lead?.nodeName === "P" && lead.textContent.trim().length < 45 && !lead.querySelector("a,strong")) lead.remove();
  // Pierwszy nagłówek powtarzający tytuł strony – tytuł i tak jest na górze
  const first = wrap.querySelector("h2");
  if (first && first.textContent.trim().toLowerCase() === title.toLowerCase()) first.remove();
  // Ręczne spisy treści – sklep buduje własny
  for (const h of [...wrap.querySelectorAll("h2,h3")]) {
    if (!/^spis treści$/i.test(h.textContent.trim())) continue;
    const list = h.nextElementSibling;
    if (list && /^(UL|OL)$/.test(list.nodeName) && [...list.querySelectorAll("a")].every((a) => a.getAttribute("href")?.startsWith("#"))) list.remove();
    h.remove();
  }
  // Kafelki z samych pogrubień („Wysyłka InPost / Paczkomaty i kurier / …”)
  for (const p of [...wrap.querySelectorAll("p")]) {
    const strongs = p.querySelectorAll(":scope > strong");
    const loose = [...p.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (strongs.length >= 2 && !loose && !p.querySelector("a")) p.remove();
  }

  wrap.querySelectorAll("span").forEach((s) => s.replaceWith(...s.childNodes));
  wrap.normalize();
  for (const el of [...wrap.querySelectorAll("*")]) {
    for (const a of [...el.attributes]) if (!["href", "src", "alt", "colspan", "rowspan"].includes(a.name)) el.removeAttribute(a.name);
    if (el.nodeName === "A") {
      const href = el.getAttribute("href") ?? "";
      if (!href || href.startsWith("#")) { el.replaceWith(...el.childNodes); continue; }
      el.setAttribute("href", relink(href));
    }
    // „<strong>Kurier InPost</strong>zwykle 1 dzień” → „Kurier InPost: zwykle 1 dzień”
    const next = el.nextSibling;
    if (el.nodeName === "STRONG" && el.parentElement?.nodeName === "P" && ((next?.nodeType === 3 && /^\p{L}/u.test(next.textContent)) || next?.nodeName === "A")) {
      el.after(document.createTextNode(": "));
    }
  }
  return wrap.innerHTML.replace(/\n{2,}/g, "\n").replace(/(<br>\s*)+(<\/p>)/g, "$2").trim();
}

const pages = {};
for (const slug of PAGES) {
  const [p] = await get(`${API}/pages?slug=${slug}&_fields=title,content`);
  await pause();
  if (!p) { console.log(`brak strony: ${slug}`); continue; }
  const title = text(p.title.rendered);
  pages[slug] = { title, html: clean(p.content.rendered, title) };
  console.log(`strona ${slug}: ${pages[slug].html.length} znaków`);
}

const posts = [];
const raw = [
  ...(await get(`${API}/posts?per_page=100&_embed=wp:featuredmedia`)).map((p) => ({ p, guide: false })),
  ...(await get(`${API}/pages?per_page=100&_embed=wp:featuredmedia`)).filter((p) => GUIDE.test(p.slug)).map((p) => ({ p, guide: true })),
];
for (const { p, guide } of raw) {
  const title = text(p.title.rendered);
  const html = clean(p.content.rendered, title);
  posts.push({
    slug: p.slug,
    title,
    excerpt: text(p.excerpt?.rendered ?? "").slice(0, 300),
    date: p.date,
    tag: guide ? "poradnik" : "detailing",
    oldPath: new URL(p.link).pathname.replace(/\/+$/, ""),
    cover: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null,
    html,
  });
  console.log(`${guide ? "przewodnik" : "wpis"} ${p.slug}: ${html.length} znaków`);
}

fs.writeFileSync(path.join(dir, "pages-import.json"), JSON.stringify(pages, null, 1));
fs.writeFileSync(path.join(dir, "posts-import.json"), JSON.stringify(posts, null, 1));
console.log(`gotowe: ${Object.keys(pages).length} stron, ${posts.length} wpisów`);
