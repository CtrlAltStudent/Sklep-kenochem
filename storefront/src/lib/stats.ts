// Własne statystyki sklepu (osobny plik obok bazy, bez zmian w schemacie Payload).
// Zapisujemy wejścia, brakujące strony i zakupy. Adres e-mail dopisujemy dopiero przy zamówieniu.

import { randomBytes } from "node:crypto";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { dataDir } from "./dataDir";

const COOKIE = "sx_ses";
const STAFF_COOKIE = "sx_nas";
const YEAR = 180 * 24 * 60 * 60;

export type HitKind = "view" | "notfound" | "buy" | "order";

type Hit = {
  session: string;
  path: string;
  kind: HitKind;
  product?: string | null;
  email?: string | null;
  orderNo?: string | null;
  qty?: number;
  staff?: boolean;
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
  `);
  const cols = db.prepare("PRAGMA table_info(hits)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "staff")) db.exec("ALTER TABLE hits ADD COLUMN staff INTEGER NOT NULL DEFAULT 0");
  return db;
}

const bot = /bot|crawler|spider|slurp|preview|facebookexternalhit|whatsapp|telegram/i;

export function isBot(ua: string | null) {
  return Boolean(ua && bot.test(ua));
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
export function missingPages(limit = 200): PathCount[] {
  try {
    return database().prepare(
      "SELECT path, COUNT(*) AS n, MAX(ts) AS last FROM hits WHERE kind = 'notfound' AND staff = 0 GROUP BY path ORDER BY n DESC, last DESC LIMIT ?",
    ).all(Math.min(500, Math.max(1, limit))) as PathCount[];
  } catch (e) {
    console.error("stats", e);
    return [];
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

export function recordHit(hit: Hit) {
  const p = cleanPath(hit.path);
  if (!p || probePath.test(p)) return;
  try {
    const base = database();
    const product = hit.product ?? productOf(p);
    base.prepare(
      "INSERT INTO hits (ts, session, path, kind, product, email, order_no, qty, staff) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(Date.now(), hit.session.slice(0, 64), p, hit.kind, product, hit.email?.slice(0, 120) ?? null, hit.orderNo?.slice(0, 40) ?? null, Math.max(1, hit.qty ?? 1), hit.staff ? 1 : 0);
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
  carts: number;
  checkouts: number;
  boughtSessions: number;
  products: { slug: string; views: number }[];
  exits: { path: string; n: number }[];
  missingPages: { path: string; n: number; last: number }[];
  watchedNotBought: { slug: string; views: number }[];
  journeys: { session: string; email: string | null; steps: string[]; bought: boolean; at: number }[];
};

export function traffic(from: number, to: number, who: Audience = "bez"): Traffic {
  const empty: Traffic = { views: 0, people: 0, missing: 0, carts: 0, checkouts: 0, boughtSessions: 0, products: [], exits: [], missingPages: [], watchedNotBought: [], journeys: [] };
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
    const products = base.prepare(
      `SELECT product slug, COUNT(*) views FROM hits WHERE kind = 'view' AND product IS NOT NULL AND ts >= ? AND ts < ?${staff} GROUP BY product ORDER BY views DESC LIMIT 20`,
    ).all(from, to) as { slug: string; views: number }[];
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
    return { views, people, missing, carts, checkouts, boughtSessions, products, exits, missingPages, watchedNotBought, journeys };
  } catch (e) {
    console.error("stats", e);
    return empty;
  }
}
