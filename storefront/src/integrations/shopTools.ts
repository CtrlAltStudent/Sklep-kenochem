// Dziennik brakujących stron, plik przekierowań i kampania promocyjna.
// Nie dodaje kolumn w bazie: licznik użyć jest w stats.db, promocja zapisuje istniejące pola ceny.

import type { Endpoint, PayloadRequest } from "payload";
import { hasRole } from "@/payload/access";
import { invalidateCatalog } from "@/lib/catalogCache";
import { hideMissing, liveBots, liveDetail, liveNow, missingPages, placeName, redirectUses, saveFace, type LiveDetail, type PlaceBook } from "@/lib/stats";
import { getCatalog } from "@/lib/catalog";
import { brandSlug } from "@/lib/data";
import { getGoogleReviews, setGoogleReviews } from "./vault";

const deny = () => Response.json({ ok: false, message: "Brak uprawnień" }, { status: 403 });
const round2 = (n: number) => Math.round(n * 100) / 100;

const places = new Map<string, { at: number; city: string; net: string }>();

async function locate(ip: string) {
  if (!ip) return { city: "", net: "" };
  if (ip === "::1" || ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) {
    return { city: "Sieć lokalna", net: "" };
  }
  const known = places.get(ip);
  if (known && Date.now() - known.at < 24 * 60 * 60 * 1000) return known;
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(2500) });
    const data = await res.json() as { success?: boolean; city?: string; region?: string; country?: string; connection?: { isp?: string; org?: string } };
    const city = data.success === false ? "" : [data.city, data.region, data.country].filter(Boolean).join(", ");
    const found = { at: Date.now(), city, net: data.connection?.isp || data.connection?.org || "" };
    if (city) places.set(ip, found);
    return found;
  } catch {
    return { city: "", net: "" };
  }
}

const staff = (req: PayloadRequest) => hasRole(req, "editor", "marketing");

export function normPath(raw: string) {
  let from = raw.trim().replace(/^https?:\/\/[^/]+/i, "");
  if (!from.startsWith("/")) from = `/${from}`;
  from = from.split("?")[0].split("#")[0];
  return from.length > 1 ? from.replace(/\/+$/, "") : from;
}

export async function redirectLoop(req: PayloadRequest, fromRaw: string, toRaw: string, selfId?: unknown) {
  const from = normPath(fromRaw);
  const to = toRaw.trim();
  if (!from.startsWith("/") || from.length > 180) return "Stary adres jest nieprawidłowy.";
  if (from === to || from === normPath(to)) return "Stary i nowy adres są takie same.";
  if (!to.startsWith("/") && !/^https:\/\//i.test(to)) return "Nowy adres musi zaczynać się od / albo https://";
  let cur = to.startsWith("/") ? normPath(to) : to;
  const seen = new Set([from]);
  for (let i = 0; i < 8; i++) {
    if (!cur.startsWith("/")) return null;
    if (seen.has(cur)) return "To przekierowanie utworzy pętlę.";
    seen.add(cur);
    const next = await req.payload.find({
      collection: "redirects",
      where: { and: [{ from: { equals: cur } }, { active: { equals: true } }] },
      limit: 1, depth: 0, overrideAccess: true,
    });
    const hop = next.docs[0];
    if (!hop || String(hop.id) === String(selfId ?? "")) return null;
    cur = String(hop.to ?? "");
    if (cur.startsWith("/")) cur = normPath(cur);
  }
  return "Łańcuch przekierowań jest za długi.";
}

const csvCell = (v: unknown) => {
  const t = v == null ? "" : String(v);
  return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

function parseTable(text: string) {
  const rows: { from: string; to: string }[] = [];
  for (const line of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || /^stary\b/i.test(trimmed) || /^from\b/i.test(trimmed)) continue;
    const parts = trimmed.split(/[;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2 || !parts[0] || !parts[1]) continue;
    rows.push({ from: parts[0], to: parts[1] });
    if (rows.length >= 500) break;
  }
  return rows;
}

async function saveRedirect(req: PayloadRequest, fromRaw: string, toRaw: string) {
  const from = normPath(fromRaw);
  const to = toRaw.trim();
  const problem = await redirectLoop(req, from, to);
  if (problem) return { ok: false as const, message: problem };
  const existing = await req.payload.find({ collection: "redirects", where: { from: { equals: from } }, limit: 1, depth: 0, overrideAccess: true });
  const data = { from, to, permanent: true, active: true };
  if (existing.docs[0]) await req.payload.update({ collection: "redirects", id: existing.docs[0].id, data, overrideAccess: true, req });
  else await req.payload.create({ collection: "redirects", data, overrideAccess: true, req });
  return { ok: true as const };
}

// Podpowiedź do brakującego produktu: istniejący adres o prawie tych samych słowach i liczbach. Decyduje człowiek.
function hintFor(path: string, slugs: string[]) {
  const slug = path.match(/^\/produkt\/([^/]+)$/)?.[1];
  if (!slug) return null;
  const words = (s: string) => new Set(s.split("-").filter(Boolean));
  const numbers = (s: Set<string>) => [...s].filter((w) => /\d/.test(w)).sort().join();
  const mine = words(slug);
  let best: string | null = null;
  let score = 0.7; // niżej dopasowania są zbyt niepewne
  for (const other of slugs) {
    const theirs = words(other);
    if (numbers(mine) !== numbers(theirs)) continue; // inna pojemność albo kod to inny produkt
    const common = [...mine].filter((w) => theirs.has(w)).length;
    const similar = common / new Set([...mine, ...theirs]).size;
    if (similar > score) { score = similar; best = other; }
  }
  return best ? `/produkt/${best}` : null;
}

const day = (v: unknown) => {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

function categoryTrail(tree: { slug: string; name: string; children: { slug: string; name: string; types: { slug: string; name: string }[] }[] }[], slug: string, filter: string | null) {
  const found = tree.find((item) => item.slug === slug);
  if (!found) return "Kategoria";
  const query = new URLSearchParams(filter || "");
  const sub = found.children.find((item) => item.slug === query.get("sub"));
  const type = sub?.types.find((item) => item.slug === query.get("typ"));
  return [found.name, sub?.name, type?.name].filter(Boolean).join(" › ");
}

async function placeBook(): Promise<PlaceBook> {
  const catalog = await getCatalog().catch(() => null);
  const product: Record<string, string> = {};
  const brand: Record<string, string> = {};
  for (const item of catalog?.products ?? []) {
    product[item.slug] = item.name;
    if (item.brand) brand[brandSlug(item.brand)] = item.brand;
  }
  return { product, brand, category: (slug, filter) => categoryTrail(catalog?.tree ?? [], slug, filter) };
}

function botDetail(id: string, book: PlaceBook): LiveDetail | null {
  const seen = liveBots().find((row) => row.id === id);
  if (!seen) return null;
  const place = placeName(seen.path, book, seen.filter);
  return {
    id: seen.id, staff: false, bot: true, label: seen.name, doing: "Automat przegląda sklep", place, path: seen.path,
    device: "Robot", browser: seen.name, os: "—", language: "—", ip: seen.ip, source: "Automat", email: "",
    visitNo: 1, visits: 1, viewsNow: 1, viewsAll: 1, hereFor: Date.now() - seen.at, visitFor: Date.now() - seen.at,
    firstSeen: seen.at, pages: [{ at: seen.at, path: seen.path, place }],
  };
}

export const shopToolEndpoints: Endpoint[] = [
  {
    path: "/live",
    method: "get",
    handler: async (req) => {
      if (!(await hasRole(req, "orders", "marketing"))) return deny();
      const book = await placeBook();
      const session = new URL(req.url || "", "http://panel").searchParams.get("session") || "";
      if (session.startsWith("bot:")) {
        const person = botDetail(session, book);
        if (!person) return Response.json({ ok: false, message: "Tego automatu już nie widać" }, { status: 404 });
        const where = await locate(person.ip);
        return Response.json({ ok: true, person, where });
      }
      if (session) {
        const person = liveDetail(session, book);
        if (!person) return Response.json({ ok: false, message: "Tej osoby już nie widać" }, { status: 404 });
        const where = await locate(person.ip);
        return Response.json({ ok: true, person, where });
      }
      const now = liveNow(book);
      const bots = liveBots().map((row) => ({
        id: row.id, staff: false, bot: true, label: row.name, device: "Robot", source: "Automat",
        place: placeName(row.path, book, row.filter), doing: "Automat przegląda sklep", path: row.path,
        steps: [], hereFor: Date.now() - row.at, visitFor: Date.now() - row.at, visitNo: 1,
      }));
      return Response.json({ ok: true, at: Date.now(), ...now, bots });
    },
  },
  {
    path: "/live",
    method: "post",
    handler: async (req) => {
      if (!(await hasRole(req, "orders", "marketing"))) return deny();
      const body = await req.json?.().catch(() => null) as { session?: unknown; label?: unknown; ours?: unknown } | null;
      const session = typeof body?.session === "string" ? body.session : "";
      const patch: { label?: string; ours?: boolean } = {};
      if (typeof body?.label === "string") patch.label = body.label;
      if (typeof body?.ours === "boolean") patch.ours = body.ours;
      if (!saveFace(session, patch)) return Response.json({ ok: false, message: "Nie udało się zapisać nazwy" }, { status: 400 });
      return Response.json({ ok: true });
    },
  },
  {
    path: "/google-reviews",
    method: "get",
    handler: async (req) => {
      if (!(await staff(req))) return deny();
      return Response.json({ ok: true, reviews: getGoogleReviews() });
    },
  },
  {
    path: "/google-reviews",
    method: "post",
    handler: async (req) => {
      if (!(await staff(req))) return deny();
      const body = await req.json?.().catch(() => null);
      setGoogleReviews(body, (req.user as { email?: string } | null)?.email);
      return Response.json({ ok: true, message: "Zapisane. Wybrane opinie są na stronie głównej.", reviews: getGoogleReviews() });
    },
  },
  {
    path: "/missing-pages",
    method: "get",
    handler: async (req) => {
      if (!(await staff(req))) return deny();
      const [redirects, products] = await Promise.all([
        req.payload.find({ collection: "redirects", where: { active: { equals: true } }, limit: 0, pagination: false, depth: 0, overrideAccess: true, select: { from: true } }),
        req.payload.find({ collection: "products", where: { status: { equals: "active" } }, limit: 0, pagination: false, depth: 0, overrideAccess: true, select: { slug: true } }),
      ]);
      const done = new Set(redirects.docs.map((r) => r.from));
      const slugs = products.docs.map((p) => p.slug).filter((s): s is string => Boolean(s));
      const rows = missingPages(200).filter((r) => !done.has(r.path)).map((r) => ({ ...r, hint: hintFor(r.path, slugs) }));
      return Response.json({ ok: true, rows, uses: redirectUses(80) });
    },
  },
  {
    path: "/missing-pages/hide",
    method: "post",
    handler: async (req) => {
      if (!(await staff(req))) return deny();
      const body = await req.json?.().catch(() => null) as { path?: unknown } | null;
      if (typeof body?.path !== "string") return Response.json({ ok: false, message: "Brak adresu" }, { status: 400 });
      const ok = hideMissing(body.path);
      return Response.json({ ok, message: ok ? "Schowane. Adres wróci na listę, jeśli ktoś znowu na niego trafi." : "Nie udało się schować adresu." });
    },
  },
  {
    path: "/redirect-tools",
    method: "post",
    handler: async (req) => {
      if (!(await staff(req))) return deny();
      const body = ((await req.json?.().catch(() => ({}))) ?? {}) as { from?: string; to?: string };
      if (!body.from || !body.to) return Response.json({ ok: false, message: "Podaj stary i nowy adres." }, { status: 400 });
      const saved = await saveRedirect(req, body.from, body.to);
      if (!saved.ok) return Response.json(saved, { status: 400 });
      return Response.json({ ok: true, message: "Przekierowanie zapisane. Zadziała w ciągu minuty." });
    },
  },
  {
    path: "/redirect-tools/import",
    method: "post",
    handler: async (req) => {
      if (!(await staff(req))) return deny();
      const body = ((await req.json?.().catch(() => ({}))) ?? {}) as { text?: string };
      const rows = parseTable(String(body.text ?? ""));
      if (!rows.length) return Response.json({ ok: false, message: "W pliku nie ma wierszy. Kolumny: stary adres i nowy adres, oddzielone średnikiem." }, { status: 400 });
      let saved = 0;
      const problems: string[] = [];
      for (const row of rows) {
        const result = await saveRedirect(req, row.from, row.to);
        if (result.ok) saved += 1;
        else problems.push(`${normPath(row.from)}: ${result.message}`);
      }
      return Response.json({ ok: true, message: `Zapisano ${saved} z ${rows.length}.${problems.length ? ` Pominięte: ${problems.slice(0, 5).join(" · ")}` : ""}` });
    },
  },
  {
    path: "/redirect-tools/export",
    method: "get",
    handler: async (req) => {
      if (!(await staff(req))) return deny();
      const all = await req.payload.find({ collection: "redirects", limit: 2000, pagination: false, depth: 0, overrideAccess: true, sort: "from" });
      const uses = new Map(redirectUses(2000).map((r) => [r.path, r.n]));
      const lines = [["stary adres", "nowy adres", "użycia"], ...all.docs.map((d) => [d.from, d.to, uses.get(String(d.from)) ?? 0])];
      const body = `\uFEFF${lines.map((r) => r.map(csvCell).join(";")).join("\r\n")}`;
      return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=przekierowania.csv" } });
    },
  },
  {
    path: "/promo-campaign",
    method: "get",
    handler: async (req) => {
      if (!(await staff(req))) return deny();
      const [products, categories] = await Promise.all([
        req.payload.find({ collection: "products", where: { "sale.price": { greater_than: 0 } }, limit: 200, depth: 0, overrideAccess: true, sort: "name", select: { name: true, sku: true, price: true, sale: true, slug: true } }),
        req.payload.find({ collection: "categories", limit: 200, depth: 0, overrideAccess: true, sort: "name", select: { name: true, slug: true, parent: true } }),
      ]);
      return Response.json({
        ok: true,
        categories: categories.docs.filter((c) => !c.parent).map((c) => ({ slug: c.slug, name: c.name })),
        onSale: products.docs.map((p) => ({ name: p.name, sku: p.sku, price: p.price, sale: p.sale, slug: p.slug })),
      });
    },
  },
  {
    path: "/promo-campaign",
    method: "post",
    handler: async (req) => {
      if (!(await staff(req))) return deny();
      const body = ((await req.json?.().catch(() => ({}))) ?? {}) as { percent?: number; from?: string; to?: string; category?: string; productIds?: unknown; clear?: boolean };
      const clear = Boolean(body.clear);
      const percent = Number(body.percent);
      if (!clear && !(percent >= 1 && percent <= 89)) return Response.json({ ok: false, message: "Obniżka od 1 do 89 procent." }, { status: 400 });
      const from = day(body.from);
      const to = day(body.to);
      if (!clear && body.to && !to) return Response.json({ ok: false, message: "Data końca jest nieprawidłowa." }, { status: 400 });
      if (!clear && from && to && from > to) return Response.json({ ok: false, message: "Data końca jest wcześniejsza niż początek." }, { status: 400 });
      const ids = (Array.isArray(body.productIds) ? body.productIds : []).map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 400);
      const category = typeof body.category === "string" ? body.category.trim() : "";
      if (!ids.length && !category) return Response.json({ ok: false, message: "Wybierz kategorię albo produkty z wyszukiwarki." }, { status: 400 });

      const all = category
        ? await req.payload.find({
          collection: "products", limit: 1000, pagination: false, depth: 0, overrideAccess: true,
          select: { name: true, sku: true, price: true, category: true },
        })
        : { docs: [] as { id: number; name: string; sku?: string | null; price?: number | null; category?: unknown }[] };
      const chosen = new Map<string | number, (typeof all.docs)[number]>();
      const notes: string[] = [];
      if (category) {
        const cats = await req.payload.find({ collection: "categories", limit: 300, pagination: false, depth: 0, overrideAccess: true, select: { slug: true, parent: true } });
        const root = cats.docs.find((c) => c.slug === category);
        if (!root) notes.push("Nie ma takiej kategorii.");
        else {
          const catIds = new Set([String(root.id)]);
          let grew = true;
          while (grew) {
            grew = false;
            for (const c of cats.docs) {
              const parent = c.parent == null ? "" : String(typeof c.parent === "object" ? (c.parent as { id: unknown }).id : c.parent);
              if (catIds.has(parent) && !catIds.has(String(c.id))) { catIds.add(String(c.id)); grew = true; }
            }
          }
          const inCat = all.docs.filter((p) => catIds.has(String(p.category ?? "")));
          for (const p of inCat) chosen.set(p.id, p);
          if (!inCat.length) notes.push("W tej kategorii nie ma produktów.");
        }
      }
      if (ids.length) {
        const picked = await req.payload.find({
          collection: "products", where: { id: { in: ids } }, limit: ids.length, pagination: false, depth: 0, overrideAccess: true,
          select: { name: true, sku: true, price: true, category: true },
        });
        for (const p of picked.docs) chosen.set(p.id, p);
        if (picked.docs.length < ids.length) notes.push("Część wybranych produktów już nie istnieje.");
      }
      let changed = 0;
      for (const p of chosen.values()) {
        const price = Number(p.price);
        if (!clear && !(price > 0)) { notes.push(`${p.name}: brak ceny regularnej`); continue; }
        const salePrice = clear ? null : round2(price * (1 - percent / 100));
        if (!clear && (salePrice == null || salePrice <= 0 || salePrice >= price)) { notes.push(`${p.name}: obniżka nic nie zmienia`); continue; }
        await req.payload.update({
          collection: "products", id: p.id, overrideAccess: true, req,
          data: { sale: { price: salePrice, from: clear ? null : from, to: clear ? null : to } },
        });
        changed += 1;
      }
      if (changed) invalidateCatalog();
      const message = changed
        ? (clear ? `Zdjęto promocję z ${changed} produktów.` : `Promocja −${percent}% na ${changed} produktów.`)
        : "Żaden produkt nie został zmieniony.";
      return Response.json({ ok: changed > 0, message: notes.length ? `${message} ${notes.slice(0, 6).join(" · ")}` : message });
    },
  },
];
