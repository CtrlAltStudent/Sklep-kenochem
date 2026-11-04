import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";
import { NextResponse, type NextRequest } from "next/server";
import { getSite } from "@/integrations/vault";
import { SHOP_PHONE, shopTel } from "@/lib/data";
import { isBot, isStaff, noteRedirect, readSession, recordHit } from "@/lib/stats";

// Przerwa techniczna (panel: Ustawienia → Widoczność i technika → „Przerwa techniczna”).
// Klienci dostają stronę z komunikatem (kod 503 – Google wie, że to chwilowe), pracownik zalogowany do panelu widzi sklep normalnie.
// Panel, API (płatności, BaseLinker, zdrowie sklepu) i pliki statyczne działają zawsze.

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const probe = /^\/(?:wp-admin|wp-login\.php|wp-content|wp-includes|xmlrpc\.php|phpmyadmin)(?:\/|$)|^\/\.(?:env|git)/i;

type Hop = { to: string; permanent: boolean };

// Idzie po łańcuchu, aż adres nigdzie dalej nie prowadzi. Pętlę zostawia w spokoju.
function chain(start: string, map: Map<string, Hop>): Hop | null {
  let cur = start;
  let permanent = true;
  let hops = 0;
  const seen = new Set<string>();
  while (hops < 6) {
    if (seen.has(cur)) return null;
    seen.add(cur);
    const hit = map.get(cur);
    if (!hit || hit.to === cur) return hops ? { to: cur, permanent } : null;
    hops += 1;
    permanent = permanent && hit.permanent;
    if (!hit.to.startsWith("/")) return { to: hit.to, permanent };
    cur = hit.to.split("?")[0].replace(/\/+$/, "") || "/";
  }
  return null;
}

// Dokładny adres, a gdy go nie ma – stara lista z numerem strony (/page/2) idzie tam, gdzie idzie sama lista.
function jumpFor(path: string, map: Map<string, Hop>): Hop | null {
  const direct = chain(path, map);
  if (direct) return direct;
  const page = path.match(/^(.*)\/page\/\d+$/);
  if (!page) return null;
  const base = page[1] || "/";
  const via = chain(base, map);
  if (via) return via;
  if (base === "/sklep") return { to: "/", permanent: true };
  if (base === "/blog") return { to: "/blog", permanent: true };
  if (base.startsWith("/kategoria-produktu/")) return { to: base, permanent: true };
  return null;
}

function rememberMissing(req: NextRequest, path: string) {
  if (isBot(req.headers.get("user-agent"))) return;
  const cookie = req.headers.get("cookie");
  recordHit({ session: readSession(cookie) || "gosc", path, kind: "notfound", staff: isStaff(cookie) });
}

// Przekierowania starych adresów zanim strona zdąży odpowiedzieć „nie ma”.
// Lista odświeża się co minutę, więc nowy wpis z panelu działa bez wgrywania sklepu.
type PathCache = { at: number; redirects: Map<string, { to: string; permanent: boolean }>; products: Set<string>; categories: Set<string> };
let pathCache: PathCache | null = null;
const pools = globalThis as typeof globalThis & { __sonaxProxyPg?: Pool };

function remember(redirects: Map<string, { to: string; permanent: boolean }>, products: Set<string>, categories: Set<string>, rows: { f: string; t: string; p: boolean | number }[], productRows: { slug: string }[], categoryRows: { slug: string }[]) {
  for (const r of rows) if (r.f && r.t) redirects.set(r.f, { to: r.t, permanent: r.p !== 0 && r.p !== false });
  for (const r of productRows) if (r.slug) products.add(r.slug);
  for (const r of categoryRows) if (r.slug) categories.add(r.slug);
}

async function shopPaths(): Promise<PathCache> {
  const now = Date.now();
  if (pathCache && now - pathCache.at < 60_000) return pathCache;
  const redirects = new Map<string, { to: string; permanent: boolean }>();
  const products = new Set<string>();
  const categories = new Set<string>();
  const url = process.env.DATABASE_URL ?? "";
  try {
    if (url.startsWith("postgres")) {
      pools.__sonaxProxyPg ??= new Pool({ connectionString: url, max: 2 });
      const db = pools.__sonaxProxyPg;
      const rows = (await db.query('SELECT "from" AS f, "to" AS t, permanent AS p FROM redirects WHERE active = true')).rows as { f: string; t: string; p: boolean }[];
      const productRows = (await db.query("SELECT slug FROM products WHERE status = 'active' AND slug IS NOT NULL")).rows as { slug: string }[];
      let categoryRows: { slug: string }[] = [];
      try {
        categoryRows = (await db.query("SELECT slug FROM categories WHERE slug IS NOT NULL")).rows as { slug: string }[];
      } catch { /* kategorie zostają bez twardego 404 */ }
      remember(redirects, products, categories, rows, productRows, categoryRows);
    } else {
      const file = url.replace(/^file:/, "");
      if (file) {
        const db = new DatabaseSync(file);
        const rows = db.prepare('SELECT "from" AS f, "to" AS t, permanent AS p FROM redirects WHERE active = 1').all() as { f: string; t: string; p: number }[];
        const productRows = db.prepare("SELECT slug FROM products WHERE status = 'active' AND slug IS NOT NULL").all() as { slug: string }[];
        let categoryRows: { slug: string }[] = [];
        try {
          categoryRows = db.prepare("SELECT slug FROM categories WHERE slug IS NOT NULL").all() as { slug: string }[];
        } catch { /* kategorie zostają bez twardego 404 */ }
        remember(redirects, products, categories, rows, productRows, categoryRows);
      }
    }
  } catch { /* baza jeszcze niegotowa – nie chowamy wtedy całego sklepu */ }
  pathCache = { at: now, redirects, products, categories };
  return pathCache;
}

const missingHtml = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Nie znaleziono strony – Sklep Sonax</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f7f2;color:#172015;font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px}
main{max-width:520px;text-align:center}h1{font-size:28px;margin:12px 0}p{color:#4b554c;line-height:1.5}a{color:#2b6e1a;font-weight:700}</style></head>
<body><main><p style="font-size:64px;font-weight:800;color:#c5ddb8;margin:0">404</p><h1>Nie znaleźliśmy tej strony</h1>
<p>Adres mógł się zmienić albo produkt został wycofany.</p><p><a href="/">Wróć do sklepu</a> · <a href="/szukaj">Szukaj</a></p></main></body></html>`;

export async function proxy(req: NextRequest) {
  // Stare adresy WordPressa i typowe próby włamania nie dostają strony sklepu ani panelu.
  if (probe.test(req.nextUrl.pathname)) {
    return new NextResponse("Nie znaleziono.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "no-store" },
    });
  }
  const path = req.nextUrl.pathname.replace(/\/+$/, "") || "/";
  const known = await shopPaths();
  const jump = jumpFor(path, known.redirects);
  if (jump && jump.to !== path) {
    noteRedirect(path);
    return NextResponse.redirect(new URL(jump.to, req.url), jump.permanent ? 308 : 307);
  }
  const product = path.match(/^\/produkt\/([^/]+)$/);
  const category = path.match(/^\/kategoria\/([^/]+)$/);
  const slug = product?.[1] ?? category?.[1];
  const exists = product ? known.products : category ? known.categories : null;
  if (slug && exists && exists.size > 0 && !exists.has(decodeURIComponent(slug))) {
    rememberMissing(req, path);
    return new NextResponse(missingHtml, { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } });
  }

  const site = getSite();
  if (!site.maintenance || req.cookies.has("payload-token")) return NextResponse.next();
  const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Przerwa techniczna – Sklep SONAX</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#15191e;color:#fff;font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px}
main{max-width:520px;text-align:center}img{background:#fff;border-radius:12px;padding:8px 14px;width:150px}h1{font-size:28px;margin:28px 0 10px}p{color:#c9ced4;line-height:1.6}
a{color:#fff;font-weight:700}</style></head>
<body><main><img src="/sonax/logo.png" alt="SONAX"><h1>Przerwa techniczna</h1><p>${esc(site.maintenanceText)}</p>
<p><a href="${shopTel(SHOP_PHONE)}">${SHOP_PHONE}</a> · <a href="mailto:aukcje@sonax.bialystok.pl">aukcje@sonax.bialystok.pl</a></p></main></body></html>`;
  return new NextResponse(html, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "1800", "Cache-Control": "no-store" } });
}

export const config = {
  // wszystko poza panelem, API, plikami Next i statycznymi (logo, zdjęcia, ikony)
  matcher: ["/((?!admin|api|_next|sonax/|marks/|stock/|brand/|ghs/|favicon|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|webp|svg|ico|css|js|txt|xml)$).*)"],
};
