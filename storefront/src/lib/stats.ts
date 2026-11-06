// Własne statystyki sklepu (osobny plik obok bazy, bez zmian w schemacie Payload).
// Zapisujemy wejścia, brakujące strony i zakupy. Adres e-mail dopisujemy dopiero przy zamówieniu.

import { randomBytes } from "node:crypto";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { dataDir } from "./dataDir";

const COOKIE = "sx_ses";
const STAFF_COOKIE = "sx_nas";
const YEAR = 180 * 24 * 60 * 60;

export type HitKind = "view" | "here" | "notfound" | "buy" | "order" | "search";

type Hit = {
  session: string;
  path: string;
  kind: HitKind;
  product?: string | null;
  email?: string | null;
  orderNo?: string | null;
  qty?: number;
  staff?: boolean;
  source?: string | null; // skąd ktoś przyszedł (tylko grupa albo nazwa strony, bez pełnego adresu)
  device?: string | null;
  search?: string | null;
  results?: number | null;
  filter?: string | null;
  ip?: string | null;
  browser?: string | null;
  os?: string | null;
  lang?: string | null;
};

export type Audience = "bez" | "razem" | "my";

let db: DatabaseSync | null = null;

function file() {
  return path.join(dataDir(), "stats.db");
}

function database() {
  if (db) return db;
  db = new DatabaseSync(file());
  db.exec(`
    CREATE TABLE IF NOT EXISTS hits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      session TEXT NOT NULL,
      path TEXT NOT NULL,
      kind TEXT NOT NULL,
      product TEXT,
      email TEXT,
      order_no TEXT,
      qty INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS hits_ts ON hits(ts);
    CREATE INDEX IF NOT EXISTS hits_session ON hits(session);
    CREATE TABLE IF NOT EXISTS redirect_uses (
      path TEXT PRIMARY KEY,
      n INTEGER NOT NULL,
      last INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS missing_hidden (
      path TEXT PRIMARY KEY,
      at INTEGER NOT NULL
    );
  `);
  const cols = db.prepare("PRAGMA table_info(hits)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "staff")) db.exec("ALTER TABLE hits ADD COLUMN staff INTEGER NOT NULL DEFAULT 0");
  for (const [name, type] of [["source", "TEXT"], ["device", "TEXT"], ["search", "TEXT"], ["results", "INTEGER"], ["ip", "TEXT"], ["browser", "TEXT"], ["os", "TEXT"], ["lang", "TEXT"], ["filter", "TEXT"]]) {
    if (!cols.some((c) => c.name === name)) db.exec(`ALTER TABLE hits ADD COLUMN ${name} ${type}`);
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS faces (
      session TEXT PRIMARY KEY,
      label TEXT NOT NULL DEFAULT '',
      ours INTEGER NOT NULL DEFAULT 0,
      at INTEGER NOT NULL
    );
  `);
  return db;
}

export function clientIp(forwarded: string | null, real: string | null) {
  const parts = `${forwarded ?? ""},${real ?? ""}`.split(",").map((part) => part.trim().replace(/^::ffff:/, "")).filter(Boolean);
  const pub = parts.find((ip) => !privateIp(ip));
  return (pub || parts[0] || "").slice(0, 64) || null;
}

function privateIp(ip: string) {
  return ip === "::1" || ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip) || ip.startsWith("fc") || ip.startsWith("fd");
}

export function clientTech(ua: string | null, lang: string | null) {
  const u = ua || "";
  const browser = /edg\//i.test(u) ? "Edge"
    : /opr\/|opera/i.test(u) ? "Opera"
    : /chrome|crios/i.test(u) ? "Chrome"
    : /firefox|fxios/i.test(u) ? "Firefox"
    : /safari/i.test(u) ? "Safari"
    : "Nieznana przeglądarka";
  const os = /windows/i.test(u) ? "Windows"
    : /android/i.test(u) ? "Android"
    : /iphone|ipad/i.test(u) ? "iPhone / iPad"
    : /mac os/i.test(u) ? "macOS"
    : /linux/i.test(u) ? "Linux"
    : "Nieznany system";
  return { browser, os, lang: (lang || "").split(",")[0].trim().slice(0, 16) || null };
}

export function deviceOf(ua: string | null) {
  if (!ua) return null;
  if (/ipad|tablet/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "Tablet";
  if (/mobi|iphone|android/i.test(ua)) return "Telefon";
  return "Komputer";
}

// Skąd przyszedł klient: oznaczenia z linku reklamy, a jeśli ich nie ma, poprzednia strona. Pełnego adresu nie zapisujemy.
export function sourceOf(referrer: string, query: string, ...ownHosts: (string | null)[]) {
  const q = new URLSearchParams(query.slice(0, 600));
  const utmSource = (q.get("utm_source") ?? "").trim().toLowerCase().slice(0, 40);
  const utmMedium = (q.get("utm_medium") ?? "").trim().toLowerCase();
  if (q.has("gclid") || q.has("gbraid") || q.has("wbraid")) return "Reklama Google";
  if (/^(cpc|ppc|paid|paidsearch|paid_social|paidsocial|ads?)$/.test(utmMedium)) return utmSource ? `Reklama: ${utmSource}` : "Reklama";
  if (utmMedium === "email" || utmMedium === "mail" || utmMedium === "newsletter" || utmSource === "newsletter") return "Mail od sklepu";
  if (q.has("fbclid")) return "Facebook i Instagram";
  if (utmSource) return utmSource.slice(0, 40);
  if (!referrer) return "Wejście bezpośrednie";
  let host = "";
  try { host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, ""); } catch { return "Wejście bezpośrednie"; }
  const own = ownHosts.map((h) => (h ?? "").split(":")[0].toLowerCase().replace(/^www\./, ""));
  if (own.includes(host) || /(^|\.)przelewy24\.pl$/.test(host)) return null; // przejście w sklepie albo powrót z płatności
  if (/^mail\.|poczta/.test(host)) return "Poczta";
  if (/(^|\.)google\.[a-z.]+$/.test(host)) return "Google";
  if (/(^|\.)(bing\.com|duckduckgo\.com|yahoo\.com|onet\.pl|wp\.pl|interia\.pl)$/.test(host)) return "Inne wyszukiwarki i portale";
  if (/(^|\.)(facebook\.com|fb\.com|instagram\.com)$/.test(host)) return "Facebook i Instagram";
  return host.slice(0, 40);
}

const bot = /bot|crawler|spider|slurp|preview|facebookexternalhit|whatsapp|telegram/i;

export function isBot(ua: string | null) {
  return Boolean(ua && bot.test(ua));
}

export function botLabel(ua: string | null) {
  const u = ua || "";
  if (/googlebot/i.test(u)) return "Google";
  if (/bingbot/i.test(u)) return "Bing";
  if (/duckduckbot/i.test(u)) return "DuckDuckGo";
  if (/facebookexternalhit|facebot/i.test(u)) return "Facebook";
  if (/ahrefs/i.test(u)) return "Ahrefs";
  if (/semrush/i.test(u)) return "Semrush";
  if (/petalbot/i.test(u)) return "Petal";
  if (/yandex/i.test(u)) return "Yandex";
  if (/baiduspider/i.test(u)) return "Baidu";
  if (/twitterbot|telegrambot|whatsapp|slackbot|discordbot/i.test(u)) return "Podgląd linku";
  return "Robot";
}

type SeenBot = { id: string; name: string; path: string; filter: string; ip: string; at: number };
const seenBots = new Map<string, SeenBot>();

// Roboty nie uruchamiają strony jak człowiek, więc nie zapisujemy ich w statystykach. Trzymamy tylko, kto był tu przed chwilą.
export function noteBot(ua: string | null, path: string, ip: string | null, filter = "") {
  const name = botLabel(ua);
  const id = `bot:${name}:${ip || "x"}`.slice(0, 80);
  seenBots.set(id, { id, name, path: path.slice(0, 180), filter: filter.slice(0, 120), ip: ip || "", at: Date.now() });
  const now = Date.now();
  if (seenBots.size > 80) {
    for (const [key, row] of seenBots) if (now - row.at > 3 * 60_000) seenBots.delete(key);
  }
}

export function liveBots() {
  const now = Date.now();
  return [...seenBots.values()].filter((row) => now - row.at < 3 * 60_000);
}

export function readSession(header: string | null) {
  const m = header?.match(new RegExp(`(?:^|; )${COOKIE}=([a-f0-9]{16,64})`));
  return m?.[1] ?? null;
}

export function newSession() {
  return randomBytes(16).toString("hex");
}

export function sessionCookie(id: string) {
  const secure = (process.env.NEXT_PUBLIC_SERVER_URL ?? "").startsWith("https") ? "; Secure" : "";
  return `${COOKIE}=${id}; Path=/; Max-Age=${YEAR}; HttpOnly; SameSite=Lax${secure}`;
}

export function isStaff(header: string | null) {
  return new RegExp(`(?:^|; )${STAFF_COOKIE}=1(?:;|$)`).test(header ?? "");
}

export function staffCookie() {
  const secure = (process.env.NEXT_PUBLIC_SERVER_URL ?? "").startsWith("https") ? "; Secure" : "";
  return `${STAFF_COOKIE}=1; Path=/; Max-Age=${YEAR}; HttpOnly; SameSite=Lax${secure}`;
}

// Wejścia z przeglądarki, w której otwarto panel, oznaczamy jako nasze.
export function markStaff(session: string) {
  try {
    const result = database().prepare("UPDATE hits SET staff = 1 WHERE session = ? AND staff = 0").run(session.slice(0, 64)) as { changes?: number };
    return Number(result?.changes ?? 0);
  } catch (e) {
    console.error("stats", e);
    return 0;
  }
}

const sessionOk = (session: string) => /^[a-f0-9]{16,64}$/.test(session);

function faceOf(session: string) {
  try {
    return database().prepare("SELECT label, ours FROM faces WHERE session = ?").get(session) as { label: string; ours: number } | undefined;
  } catch {
    return undefined;
  }
}

// Nasza nazwa przeglądarki („komputer z domu”) i znacznik, że to ktoś od nas, więc nie liczy się jako klient.
export function saveFace(session: string, patch: { label?: string; ours?: boolean }) {
  if (!sessionOk(session)) return false;
  try {
    const base = database();
    const row = faceOf(session);
    const label = (patch.label !== undefined ? patch.label : row?.label ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
    const ours = patch.ours !== undefined ? (patch.ours ? 1 : 0) : (row?.ours ?? 0);
    if (!label && !ours) base.prepare("DELETE FROM faces WHERE session = ?").run(session);
    else base.prepare(
      "INSERT INTO faces (session, label, ours, at) VALUES (?, ?, ?, ?) ON CONFLICT(session) DO UPDATE SET label = excluded.label, ours = excluded.ours, at = excluded.at",
    ).run(session, label, ours, Date.now());
    if (patch.ours !== undefined) base.prepare("UPDATE hits SET staff = ? WHERE session = ?").run(ours, session);
    return true;
  } catch (e) {
    console.error("stats", e);
    return false;
  }
}

const cleanPath = (raw: string) => {
  const pathOnly = raw.split("?")[0]?.split("#")[0] ?? "";
  if (!pathOnly.startsWith("/") || pathOnly.startsWith("//") || pathOnly.length > 180) return null;
  if (pathOnly.startsWith("/admin") || pathOnly.startsWith("/api") || pathOnly.startsWith("/_next")) return null;
  return pathOnly.length > 1 ? pathOnly.replace(/\/+$/, "") : pathOnly;
};

const productOf = (p: string) => p.match(/^\/produkt\/([^/]+)$/)?.[1] ?? null;
const probePath = /^\/(?:wp-admin|wp-login\.php|wp-content|wp-includes|xmlrpc\.php|phpmyadmin)(?:\/|$)|^\/\.(?:env|git)/i;

export type PathCount = { path: string; n: number; last: number };

// Adresy, na które ktoś wszedł, a sklep odpowiedział „nie znaleziono”. Bez wejść z panelu.
// Adres schowany w panelu wraca na listę dopiero wtedy, gdy ktoś znowu na niego trafi.
export function missingPages(limit = 200): PathCount[] {
  try {
    return database().prepare(`
      SELECT h.path AS path, COUNT(*) AS n, MAX(h.ts) AS last
      FROM hits h
      LEFT JOIN missing_hidden m ON m.path = h.path
      WHERE h.kind = 'notfound' AND h.staff = 0 AND (m.at IS NULL OR h.ts > m.at)
      GROUP BY h.path ORDER BY n DESC, last DESC LIMIT ?
    `).all(Math.min(500, Math.max(1, limit))) as PathCount[];
  } catch (e) {
    console.error("stats", e);
    return [];
  }
}

export function hideMissing(path: string) {
  try {
    database().prepare("INSERT INTO missing_hidden (path, at) VALUES (?, ?) ON CONFLICT(path) DO UPDATE SET at = excluded.at").run(path.slice(0, 180), Date.now());
    return true;
  } catch (e) {
    console.error("stats", e);
    return false;
  }
}

export function noteRedirect(path: string) {
  try {
    database().prepare(
      "INSERT INTO redirect_uses (path, n, last) VALUES (?, 1, ?) ON CONFLICT(path) DO UPDATE SET n = n + 1, last = excluded.last",
    ).run(path.slice(0, 180), Date.now());
  } catch (e) {
    console.error("stats", e);
  }
}

export function redirectUses(limit = 100): PathCount[] {
  try {
    return database().prepare("SELECT path, n, last FROM redirect_uses ORDER BY n DESC, last DESC LIMIT ?").all(Math.min(300, Math.max(1, limit))) as PathCount[];
  } catch (e) {
    console.error("stats", e);
    return [];
  }
}

const PLACE: Record<string, string> = {
  "/": "Strona główna",
  "/koszyk": "Koszyk",
  "/zamowienie": "Zamówienie",
  "/szukaj": "Szukaj",
  "/kontakt": "Kontakt",
  "/konto": "Konto",
  "/promocje": "Promocje",
  "/nowosci": "Nowości",
  "/bestsellery": "Bestsellery",
  "/marki": "Marki",
  "/o-nas": "O nas",
  "/faq": "Pytania",
  "/blog": "Blog",
  "/ulubione": "Ulubione",
};

export type PlaceBook = {
  product?: Record<string, string>;
  brand?: Record<string, string>;
  category?: (slug: string, filter: string | null) => string;
};

export function placeName(path: string, book: PlaceBook = {}, filter?: string | null) {
  if (PLACE[path]) return PLACE[path];
  const product = path.match(/^\/produkt\/([^/]+)$/)?.[1];
  if (product) return book.product?.[product] || "Karta produktu";
  const category = path.match(/^\/kategoria\/([^/]+)$/)?.[1];
  if (category) return book.category?.(category, filter ?? null) || "Kategoria";
  const brand = path.match(/^\/marki\/([^/]+)$/)?.[1];
  if (brand) return book.brand?.[brand] || "Marka";
  const post = path.match(/^\/blog\/([^/]+)$/)?.[1];
  if (post) return "Wpis na blogu";
  return "Strona sklepu";
}

export type LivePerson = {
  id: string;
  staff: boolean;
  bot: boolean;
  label: string;
  device: string;
  source: string;
  place: string;
  doing: string;
  path: string;
  steps: string[];
  hereFor: number;
  visitFor: number;
  visitNo: number;
};

export type LivePage = { at: number; place: string; path: string };

export type LiveDetail = {
  id: string;
  staff: boolean;
  bot: boolean;
  label: string;
  doing: string;
  place: string;
  path: string;
  device: string;
  browser: string;
  os: string;
  language: string;
  ip: string;
  source: string;
  email: string;
  visitNo: number;
  visits: number;
  viewsNow: number;
  viewsAll: number;
  hereFor: number;
  visitFor: number;
  firstSeen: number;
  pages: LivePage[];
};

const VISIT_GAP = 30 * 60 * 1000;

type LiveRow = {
  ts: number; session: string; path: string; kind: string; device: string | null; source: string | null;
  search: string | null; filter?: string | null; staff: number; ip?: string | null; browser?: string | null; os?: string | null; lang?: string | null; email?: string | null;
};

function doingOf(row: { path: string; kind: string; search: string | null }) {
  if (row.kind === "notfound") return "Trafił na stronę, której nie ma";
  if (row.path === "/koszyk") return "Jest w koszyku";
  if (row.path === "/zamowienie") return "Wypełnia zamówienie";
  if (row.path === "/szukaj") return row.search ? `Szuka: „${row.search}”` : "Szuka produktu";
  if (row.path.startsWith("/produkt/")) return "Ogląda produkt";
  if (row.path.startsWith("/kategoria/")) return "Przegląda kategorię";
  if (row.path.startsWith("/marki/")) return "Ogląda markę";
  return "Przegląda sklep";
}

function pageView(kind: string) {
  return kind === "view" || kind === "notfound" || kind === "search";
}

function visitsOf(rows: { ts: number }[]) {
  const groups: number[][] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (!last || row.ts - last[last.length - 1] > VISIT_GAP) groups.push([row.ts]);
    else last.push(row.ts);
  }
  return groups;
}

// Kto jest w sklepie teraz: ostatnie wejście młodsze niż minuta. „here” to tylko sygnał „nadal tu jestem”, nie liczy się jako nowe wejście.
function visitNumbers(ids: string[]) {
  const map = new Map<string, number>();
  if (!ids.length) return map;
  const rows = database().prepare(
    `SELECT session, ts FROM hits WHERE kind != 'here' AND session IN (${ids.map(() => "?").join(",")}) ORDER BY session, ts`,
  ).all(...ids) as { session: string; ts: number }[];
  let cur = "";
  let bucket: { ts: number }[] = [];
  const flush = () => { if (cur) map.set(cur, visitsOf(bucket).length); };
  for (const row of rows) {
    if (row.session !== cur) { flush(); cur = row.session; bucket = []; }
    bucket.push(row);
  }
  flush();
  return map;
}

function facesFor(ids: string[]) {
  const map = new Map<string, { label: string; ours: number }>();
  if (!ids.length) return map;
  const rows = database().prepare(
    `SELECT session, label, ours FROM faces WHERE session IN (${ids.map(() => "?").join(",")})`,
  ).all(...ids) as { session: string; label: string; ours: number }[];
  for (const row of rows) map.set(row.session, row);
  return map;
}

export function liveNow(book: PlaceBook = {}): { customers: number; staff: number; people: LivePerson[] } {
  const empty = { customers: 0, staff: 0, people: [] as LivePerson[] };
  const now = Date.now();
  try {
    const rows = database().prepare(
      "SELECT ts, session, path, kind, device, source, search, filter, staff FROM hits WHERE ts >= ? ORDER BY ts",
    ).all(now - 30 * 60 * 1000) as LiveRow[];
    const by = new Map<string, typeof rows>();
    for (const row of rows) {
      const list = by.get(row.session) ?? [];
      list.push(row);
      by.set(row.session, list);
    }
    const present: { list: LiveRow[]; last: LiveRow }[] = [];
    for (const list of by.values()) {
      const last = list[list.length - 1];
      if (now - last.ts > 50_000) continue;
      present.push({ list, last });
    }
    const ids = present.map((p) => p.last.session);
    const visits = visitNumbers(ids);
    const faces = facesFor(ids);
    const people: LivePerson[] = [];
    for (const { list, last } of present) {
      const face = faces.get(last.session);
      const steps: string[] = [];
      for (const row of list) {
        if (row.kind === "here") continue;
        const name = placeName(row.path, book, row.filter);
        if (steps[steps.length - 1] !== name) steps.push(name);
      }
      let since = last.ts;
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].path !== last.path || (list[i].filter || "") !== (last.filter || "")) break;
        since = list[i].ts;
      }
      const place = placeName(last.path, book, last.filter);
      people.push({
        id: last.session,
        staff: list.some((r) => r.staff) || Boolean(face?.ours),
        bot: false,
        label: face?.label || "",
        device: last.device || "Nieznane urządzenie",
        source: list.find((r) => r.source)?.source || "Wejście bezpośrednie",
        place,
        doing: doingOf(last),
        path: last.path,
        steps: steps.slice(-6),
        hereFor: now - since,
        visitFor: now - list[0].ts,
        visitNo: visits.get(last.session) || 1,
      });
    }
    people.sort((a, b) => a.staff === b.staff ? b.hereFor - a.hereFor : a.staff ? 1 : -1);
    return { customers: people.filter((p) => !p.staff).length, staff: people.filter((p) => p.staff).length, people };
  } catch (e) {
    console.error("stats", e);
    return empty;
  }
}

export function liveDetail(session: string, book: PlaceBook = {}): LiveDetail | null {
  if (!/^[a-f0-9]{16,64}$/.test(session)) return null;
  try {
    const rows = database().prepare(
      "SELECT ts, session, path, kind, device, source, search, filter, staff, ip, browser, os, lang, email FROM hits WHERE session = ? ORDER BY ts",
    ).all(session) as LiveRow[];
    if (!rows.length) return null;
    const now = Date.now();
    const groups = visitsOf(rows);
    const currentStart = groups[groups.length - 1][0];
    const current = rows.filter((row) => row.ts >= currentStart);
    const last = rows[rows.length - 1];
    let since = last.ts;
    for (let i = current.length - 1; i >= 0; i--) {
      if (current[i].path !== last.path) break;
      since = current[i].ts;
    }
    const pick = (key: "ip" | "browser" | "os" | "lang" | "device" | "email") => [...rows].reverse().find((row) => row[key])?.[key] || "";
    const face = faceOf(session);
    const pages = current.filter((row) => pageView(row.kind)).slice(-40).map((row) => ({
      at: row.ts, path: row.path, place: placeName(row.path, book, row.filter),
    }));
    return {
      id: session,
      staff: rows.some((row) => row.staff) || Boolean(face?.ours),
      bot: false,
      label: face?.label || "",
      doing: doingOf(last),
      place: placeName(last.path, book, last.filter),
      path: last.path,
      device: pick("device") || "Nieznane urządzenie",
      browser: pick("browser") || "Nieznana przeglądarka",
      os: pick("os") || "Nieznany system",
      language: pick("lang") || "—",
      ip: pick("ip") || "",
      source: rows.find((row) => row.source)?.source || "Wejście bezpośrednie",
      email: pick("email"),
      visitNo: groups.length,
      visits: groups.length,
      viewsNow: current.filter((row) => pageView(row.kind)).length,
      viewsAll: rows.filter((row) => pageView(row.kind)).length,
      hereFor: now - since,
      visitFor: now - currentStart,
      firstSeen: rows[0].ts,
      pages,
    };
  } catch (e) {
    console.error("stats", e);
    return null;
  }
}

export function recordHit(hit: Hit) {
  const p = cleanPath(hit.path);
  if (!p || probePath.test(p)) return;
  try {
    const base = database();
    const product = hit.product ?? productOf(p);
    const ours = faceOf(hit.session.slice(0, 64))?.ours ? 1 : 0;
    const filter = (hit.filter || "").slice(0, 120) || null;
    base.prepare(
      "INSERT INTO hits (ts, session, path, kind, product, email, order_no, qty, staff, source, device, search, results, ip, browser, os, lang, filter) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      Date.now(), hit.session.slice(0, 64), p, hit.kind, product, hit.email?.slice(0, 120) ?? null, hit.orderNo?.slice(0, 40) ?? null, Math.max(1, hit.qty ?? 1), hit.staff || ours ? 1 : 0,
      hit.source?.slice(0, 60) ?? null, hit.device ?? null, hit.search?.trim().toLowerCase().slice(0, 80) || null, hit.results == null ? null : Math.max(0, Math.min(100000, Math.round(hit.results))),
      hit.ip?.slice(0, 64) ?? null, hit.browser?.slice(0, 40) ?? null, hit.os?.slice(0, 40) ?? null, hit.lang?.slice(0, 16) ?? null, filter,
    );
    if (hit.email) base.prepare("UPDATE hits SET email = ? WHERE session = ? AND email IS NULL").run(hit.email.slice(0, 120), hit.session);
    if (Math.random() < 0.02) base.prepare("DELETE FROM hits WHERE ts < ?").run(Date.now() - 180 * 24 * 60 * 60 * 1000);
  } catch (e) {
    console.error("stats", e);
  }
}

export type Traffic = {
  views: number;
  people: number;
  missing: number;
  productPeople: number;
  carts: number;
  checkouts: number;
  boughtSessions: number;
  products: { slug: string; views: number }[];
  allProductViews: { slug: string; views: number }[];
  categoryViews: { slug: string; views: number }[];
  days: { day: string; views: number; people: number }[];
  sources: { label: string; n: number }[];
  devices: { label: string; n: number }[];
  searches: { term: string; n: number; results: number; last: number }[];
  searchCount: number;
  exits: { path: string; n: number }[];
  missingPages: { path: string; n: number; last: number }[];
  watchedNotBought: { slug: string; views: number }[];
  journeys: { session: string; email: string | null; steps: string[]; bought: boolean; at: number }[];
};

export function traffic(from: number, to: number, who: Audience = "bez"): Traffic {
  const empty: Traffic = { views: 0, people: 0, missing: 0, productPeople: 0, carts: 0, checkouts: 0, boughtSessions: 0, products: [], allProductViews: [], categoryViews: [], days: [], sources: [], devices: [], searches: [], searchCount: 0, exits: [], missingPages: [], watchedNotBought: [], journeys: [] };
  const staff = who === "bez" ? " AND staff = 0" : who === "my" ? " AND staff = 1" : "";
  try {
    const base = database();
    const one = (sql: string) => Number(base.prepare(sql).get(from, to)?.n ?? 0);
    const views = one(`SELECT COUNT(*) n FROM hits WHERE kind = 'view' AND ts >= ? AND ts < ?${staff}`);
    const people = one(`SELECT COUNT(DISTINCT session) n FROM hits WHERE kind = 'view' AND ts >= ? AND ts < ?${staff}`);
    const missing = one(`SELECT COUNT(*) n FROM hits WHERE kind = 'notfound' AND ts >= ? AND ts < ?${staff}`);
    const carts = one(`SELECT COUNT(DISTINCT session) n FROM hits WHERE kind = 'view' AND path = '/koszyk' AND ts >= ? AND ts < ?${staff}`);
    const checkouts = one(`SELECT COUNT(DISTINCT session) n FROM hits WHERE kind = 'view' AND path = '/zamowienie' AND ts >= ? AND ts < ?${staff}`);
    const boughtSessions = one(`SELECT COUNT(DISTINCT session) n FROM hits WHERE kind = 'order' AND ts >= ? AND ts < ?${staff}`);
    const productPeople = one(`SELECT COUNT(DISTINCT session) n FROM hits WHERE kind = 'view' AND product IS NOT NULL AND ts >= ? AND ts < ?${staff}`);
    const allProductViews = base.prepare(
      `SELECT product slug, COUNT(*) views FROM hits WHERE kind = 'view' AND product IS NOT NULL AND ts >= ? AND ts < ?${staff} GROUP BY product ORDER BY views DESC`,
    ).all(from, to) as { slug: string; views: number }[];
    const products = allProductViews.slice(0, 20);
    const categoryViews = (base.prepare(
      `SELECT path, COUNT(*) views FROM hits WHERE kind = 'view' AND path LIKE '/kategoria/%' AND ts >= ? AND ts < ?${staff} GROUP BY path`,
    ).all(from, to) as { path: string; views: number }[]).map((r) => ({ slug: r.path.slice("/kategoria/".length), views: r.views }));
    // Dzień według czasu serwera: wejścia i różne osoby danego dnia.
    const dayRows = base.prepare(
      `SELECT date(ts / 1000, 'unixepoch', 'localtime') day, session, COUNT(*) n FROM hits WHERE kind = 'view' AND ts >= ? AND ts < ?${staff} GROUP BY day, session`,
    ).all(from, to) as { day: string; session: string; n: number }[];
    const dayMap = new Map<string, { views: number; people: number }>();
    for (const row of dayRows) {
      const d = dayMap.get(row.day) ?? { views: 0, people: 0 };
      d.views += row.n; d.people += 1;
      dayMap.set(row.day, d);
    }
    const days = [...dayMap.entries()].map(([day, d]) => ({ day, ...d })).sort((a, b) => a.day.localeCompare(b.day));
    // Źródło osoby = pierwsze znane źródło w tym okresie
    const sources = base.prepare(`
      SELECT label, COUNT(*) n FROM (
        SELECT session, source label, MIN(ts) FROM hits WHERE source IS NOT NULL AND ts >= ? AND ts < ?${staff} GROUP BY session
      ) GROUP BY label ORDER BY n DESC LIMIT 12
    `).all(from, to) as { label: string; n: number }[];
    const devices = base.prepare(`
      SELECT label, COUNT(*) n FROM (
        SELECT session, device label, MIN(ts) FROM hits WHERE device IS NOT NULL AND ts >= ? AND ts < ?${staff} GROUP BY session
      ) GROUP BY label ORDER BY n DESC
    `).all(from, to) as { label: string; n: number }[];
    const searchCount = one(`SELECT COUNT(*) n FROM hits WHERE kind = 'search' AND search IS NOT NULL AND ts >= ? AND ts < ?${staff}`);
    // Wynik z ostatniego wyszukania tego hasła: oferta mogła się zmienić.
    const searches = base.prepare(`
      SELECT search term, COUNT(*) n, results, MAX(ts) last FROM hits
      WHERE kind = 'search' AND search IS NOT NULL AND ts >= ? AND ts < ?${staff}
      GROUP BY search ORDER BY n DESC, last DESC LIMIT 200
    `).all(from, to) as { term: string; n: number; results: number | null; last: number }[];
    const exits = base.prepare(`
      SELECT h.path path, COUNT(*) n
      FROM hits h
      JOIN (
        SELECT session, MAX(ts) ts FROM hits
        WHERE kind = 'view' AND ts >= ? AND ts < ?${staff}
        GROUP BY session
      ) last ON last.session = h.session AND last.ts = h.ts
      WHERE h.kind = 'view'
      GROUP BY h.path
      ORDER BY n DESC
      LIMIT 12
    `).all(from, to) as { path: string; n: number }[];
    const missingPages = base.prepare(
      `SELECT path, COUNT(*) n, MAX(ts) last FROM hits WHERE kind = 'notfound' AND ts >= ? AND ts < ?${staff} GROUP BY path ORDER BY n DESC LIMIT 25`,
    ).all(from, to) as { path: string; n: number; last: number }[];
    const bought = new Set((base.prepare(
      `SELECT DISTINCT product FROM hits WHERE kind = 'buy' AND product IS NOT NULL AND ts >= ? AND ts < ?${staff}`,
    ).all(from, to) as { product: string }[]).map((r) => r.product));
    const watchedNotBought = products.filter((p) => p.views >= 5 && !bought.has(p.slug)).slice(0, 10);
    const sessions = base.prepare(
      `SELECT session FROM hits WHERE ts >= ? AND ts < ?${staff} GROUP BY session ORDER BY MAX(ts) DESC LIMIT 30`,
    ).all(from, to) as { session: string }[];
    const ids = sessions.map((s) => s.session);
    const journeys: Traffic["journeys"] = [];
    if (ids.length) {
      const marks = ids.map(() => "?").join(",");
      const rows = base.prepare(
        `SELECT session, ts, path, kind, email FROM hits WHERE ts >= ? AND ts < ?${staff} AND session IN (${marks}) ORDER BY session, ts`,
      ).all(from, to, ...ids) as { session: string; ts: number; path: string; kind: string; email: string | null }[];
      const by = new Map<string, typeof rows>();
      for (const row of rows) {
        const list = by.get(row.session) ?? [];
        list.push(row);
        by.set(row.session, list);
      }
      for (const session of ids) {
        const list = by.get(session) ?? [];
        const steps = list.filter((r) => r.kind === "view" || r.kind === "notfound").map((r) => (r.kind === "notfound" ? `${r.path} (brak strony)` : r.path));
        const compact: string[] = [];
        for (const step of steps) if (compact[compact.length - 1] !== step) compact.push(step);
        journeys.push({
          session,
          email: list.find((r) => r.email)?.email ?? null,
          steps: compact.slice(-8),
          bought: list.some((r) => r.kind === "order"),
          at: list[list.length - 1]?.ts ?? from,
        });
      }
    }
    return {
      views, people, missing, productPeople, carts, checkouts, boughtSessions, products, allProductViews, categoryViews, days, sources, devices,
      searches: searches.map((s) => ({ ...s, results: s.results ?? 0 })), searchCount, exits, missingPages, watchedNotBought, journeys,
    };
  } catch (e) {
    console.error("stats", e);
    return empty;
  }
}
