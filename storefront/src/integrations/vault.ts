// Schowek na klucze integracji wpisywane w panelu (Integracje → Połączenia).
//
// - plik integrations.json obok bazy SQLite (na serwerze /data/integrations.json, wolumen Dockera),
//   można wskazać inny: INTEGRATIONS_FILE=…
// - hasła szyfrowane AES-256-GCM kluczem z PAYLOAD_SECRET – w pliku nie ma ich jawnym tekstem
// - nie w bazie: kopia bazy wysłana na serwer (deploy --with-data) nie nadpisze kluczy produkcyjnych
// - pusta wartość w panelu = zapasowo zmienna z .env (dotychczasowy sposób dalej działa)
// Tylko po stronie serwera.

import { defaultSite, type SiteSettings } from "./siteSettings";
import { cleanMailSettings, type MailSettings } from "./mail/catalog";
import { mergeLayout, type LayoutItem, type PageKind } from "@/lib/layoutSections";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { dataDir } from "@/lib/dataDir";
import { defaultAuto, providers, type AutoSettings, type JobId, type JobRun, type ModuleId, type ModuleState } from "./registry";

type VaultFile = {
  secrets: Record<string, string>; // zaszyfrowane
  values: Record<string, string>; // jawne: ID sprzedawcy, tryby
  auto: Partial<AutoSettings>;
  runs: Partial<Record<JobId | "pull", JobRun>>; // pull = BaseLinker pobiera zamówienia ze sklepu (Inny sklep)
  modules?: Partial<Record<ModuleId, Partial<ModuleState>>>;
  site?: Partial<SiteSettings>; // ustawienia techniczne sklepu (siteSettings.ts)
  layout?: Partial<Record<PageKind, LayoutItem[]>>; // układ sekcji stron (src/lib/layoutSections.ts)
  mail?: Partial<MailSettings>; // konfigurator maili (src/integrations/mail/catalog.ts)
  mailState?: MailState; // co już wysłały automaty (prośby o opinię)
  googleReviews?: GoogleReviewsFile; // wybrane opinie z wizytówki, pokazywane na stronie głównej
  updatedAt?: string;
  updatedBy?: string;
};

const empty = (): VaultFile => ({ secrets: {}, values: {}, auto: {}, runs: {} });

export function vaultPath() {
  if (process.env.INTEGRATIONS_FILE) return path.resolve(process.env.INTEGRATIONS_FILE);
  return path.join(dataDir(), "integrations.json");
}

const cryptoKey = () => {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error("Brak PAYLOAD_SECRET – nie można zaszyfrować kluczy.");
  return createHash("sha256").update(`sonax-integrations:${secret}`).digest();
};

function encrypt(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", cryptoKey(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1:${iv.toString("base64")}:${c.getAuthTag().toString("base64")}:${data.toString("base64")}`;
}

function decrypt(box: string): string | undefined {
  try {
    const [v, iv, tag, data] = box.split(":");
    if (v !== "v1") return undefined;
    const d = createDecipheriv("aes-256-gcm", cryptoKey(), Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8");
  } catch {
    // Inny PAYLOAD_SECRET niż przy zapisie – klucz trzeba wpisać ponownie
    return undefined;
  }
}

// Odczyt z pamięci, plik czytany ponownie tylko po zmianie (np. zapis z panelu)
let cache: { mtime: number; data: VaultFile } | null = null;

function load(): VaultFile {
  const file = vaultPath();
  try {
    const mtime = statSync(file).mtimeMs;
    if (cache && cache.mtime === mtime) return cache.data;
    const data = { ...empty(), ...(JSON.parse(readFileSync(file, "utf8")) as Partial<VaultFile>) };
    cache = { mtime, data };
    return data;
  } catch {
    return empty();
  }
}

function save(data: VaultFile) {
  const file = vaultPath();
  if (!existsSync(path.dirname(file))) mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  renameSync(tmp, file);
  cache = null;
}

const fieldByKey = (key: string) => providers.flatMap((p) => p.fields).find((f) => f.key === key);
const fromEnv = (names: string[]) => names.map((n) => process.env[n]?.trim()).find(Boolean) ?? "";

export type Source = "panel" | "env" | "none";

// Wartość klucza: najpierw panel, potem .env
export function getKey(key: string): string {
  return keyWithSource(key).value;
}

export function keyWithSource(key: string): { value: string; source: Source } {
  const f = fieldByKey(key);
  const v = load();
  const stored = f?.secret ? (v.secrets[key] ? decrypt(v.secrets[key]) : undefined) : v.values[key];
  if (stored) return { value: stored, source: "panel" };
  const env = f ? fromEnv(f.env) : "";
  return env ? { value: env, source: "env" } : { value: "", source: "none" };
}

// Tryb (np. baselinker.mode): panel → .env → domyślny
export function getMode(providerId: string): string {
  const p = providers.find((x) => x.id === providerId);
  if (!p?.mode) return "";
  return load().values[p.mode.key] || p.mode.env(process.env) || p.mode.fallback;
}

// Moduł: domyślnie dodany i włączony (sklep działał z nimi, zanim pojawiły się przełączniki)
export function getModule(id: ModuleId): ModuleState {
  const m = load().modules?.[id] ?? {};
  const installed = m.installed ?? true;
  return { installed, enabled: installed && (m.enabled ?? true) };
}
export const moduleEnabled = (id: ModuleId) => getModule(id).enabled;

export function setModule(id: ModuleId, patch: Partial<ModuleState>, by?: string) {
  const v = load();
  const cur = getModule(id);
  const next = { ...cur, ...patch };
  if (patch.installed === false) next.enabled = false;
  if (patch.installed === true && patch.enabled === undefined) next.enabled = true;
  save({ ...v, modules: { ...v.modules, [id]: next }, updatedAt: new Date().toISOString(), updatedBy: by });
}

export const getAuto = (): AutoSettings => ({ ...defaultAuto, ...load().auto });

// Ustawienia techniczne (indeksowanie, robots, llms.txt, plik Google, przerwa techniczna)
export const getSite = (): SiteSettings => ({ ...defaultSite, ...load().site });
export const getLayout = (kind: PageKind): LayoutItem[] => mergeLayout(kind, load().layout?.[kind]);
export function setLayout(patch: Partial<Record<PageKind, LayoutItem[]>>, by?: string) {
  const v = load();
  save({ ...v, layout: { ...v.layout, ...patch }, updatedAt: new Date().toISOString(), updatedBy: by });
}
export function setSite(patch: Partial<SiteSettings>, by?: string) {
  const v = load();
  save({ ...v, site: { ...v.site, ...patch }, updatedAt: new Date().toISOString(), updatedBy: by });
}
export const getRuns = () => load().runs;

// Konfigurator maili: wygląd, nadpisane treści, ustawienia automatów
export const getMailSettings = (): MailSettings => cleanMailSettings(load().mail);
export function setMailSettings(next: MailSettings, by?: string) {
  const v = load();
  save({ ...v, mail: cleanMailSettings(next), updatedAt: new Date().toISOString(), updatedBy: by });
}

// Prośby o opinię: id zamówienia → kiedy wysłano (wpisy starsze niż 120 dni są usuwane)
export type MailState = { reviews?: Record<string, string> };
export const getMailState = (): MailState => load().mailState ?? {};
export type GoogleReviewCard = { id: string; name: string; photo: string; text: string; rating: number; visible: boolean };
export type GoogleReviewsFile = { placeUrl: string; items: GoogleReviewCard[] };

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export function cleanGoogleReviews(raw: unknown): GoogleReviewsFile {
  const src = raw && typeof raw === "object" ? raw as { placeUrl?: unknown; items?: unknown } : {};
  const place = clip(src.placeUrl, 400);
  const placeUrl = /^https:\/\/(www\.)?google\.[a-z.]+\/(maps|search)/i.test(place) ? place : "";
  const items = (Array.isArray(src.items) ? src.items : []).slice(0, 24).flatMap((row) => {
    const r = row && typeof row === "object" ? row as Partial<GoogleReviewCard> : {};
    const name = clip(r.name, 80);
    const text = clip(r.text, 500);
    if (!name || !text) return [];
    const photo = clip(r.photo, 400);
    const rating = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
    return [{ id: clip(r.id, 40) || name.slice(0, 12), name, text, rating, visible: r.visible !== false, photo: photo.startsWith("/") || photo.startsWith("https://") ? photo : "" }];
  });
  return { placeUrl, items };
}

export const getGoogleReviews = (): GoogleReviewsFile => cleanGoogleReviews(load().googleReviews);

export function setGoogleReviews(next: unknown, by?: string) {
  const v = load();
  save({ ...v, googleReviews: cleanGoogleReviews(next), updatedAt: new Date().toISOString(), updatedBy: by });
}

export function markReviewSent(orderIds: (number | string)[]) {
  if (!orderIds.length) return;
  const v = load();
  const old = Date.now() - 120 * 86_400_000;
  const reviews = Object.fromEntries(Object.entries(v.mailState?.reviews ?? {}).filter(([, at]) => Date.parse(at) > old));
  for (const id of orderIds) reviews[String(id)] = new Date().toISOString();
  save({ ...v, mailState: { ...v.mailState, reviews } });
}

export function recordRun(job: JobId | "pull", run: JobRun) {
  const v = load();
  save({ ...v, runs: { ...v.runs, [job]: run } });
}

export type VaultPatch = {
  keys?: Record<string, string | null>; // null = usuń (wróć do .env)
  modes?: Record<string, string>;
  auto?: Partial<AutoSettings>;
};

export function updateVault(patch: VaultPatch, by?: string) {
  const v = load();
  const next: VaultFile = { ...v, secrets: { ...v.secrets }, values: { ...v.values }, auto: { ...v.auto, ...patch.auto } };
  for (const [key, val] of Object.entries(patch.keys ?? {})) {
    const f = fieldByKey(key);
    if (!f) continue;
    const bucket = f.secret ? next.secrets : next.values;
    const clean = val?.trim();
    if (!clean) delete bucket[key];
    else bucket[key] = f.secret ? encrypt(clean) : clean;
  }
  for (const [key, val] of Object.entries(patch.modes ?? {})) {
    const p = providers.find((x) => x.mode?.key === key);
    if (p?.mode?.options.some((o) => o.value === val)) next.values[key] = val;
  }
  next.updatedAt = new Date().toISOString();
  next.updatedBy = by;
  save(next);
}

// Końcówka hasła do pokazania w panelu: „••••a1b2”
const mask = (s: string) => (s.length <= 6 ? "••••" : `••••${s.slice(-4)}`);

// Stan dla panelu – bez pełnych haseł
export function describeVault() {
  const v = load();
  return {
    file: vaultPath(),
    updatedAt: v.updatedAt,
    updatedBy: v.updatedBy,
    providers: providers.map((p) => ({
      id: p.id,
      ...getModule(p.id),
      mode: getMode(p.id),
      modeFromPanel: Boolean(p.mode && v.values[p.mode.key]),
      fields: Object.fromEntries(
        p.fields.map((f) => {
          const { value, source } = keyWithSource(f.key);
          const unreadable = f.secret && Boolean(v.secrets[f.key]) && source !== "panel";
          return [f.key, { source, preview: !value ? "" : f.secret ? mask(value) : value, unreadable }];
        }),
      ),
    })),
    auto: getAuto(),
    runs: v.runs,
  };
}

export type VaultState = ReturnType<typeof describeVault>;
