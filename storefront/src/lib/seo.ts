// Teksty dla Google liczone z danych produktu, gdy w zakładce „SEO i Google” nic nie wpisano.
// Bezpieczne dla komponentów klienckich (bez dostępu do bazy).

import { plainText } from "@/lib/data";

// Skróty i marki, które zostają WIELKIMI literami przy porządkowaniu nazwy
const KEEP_UPPER = new Set([
  "SONAX", "ADBL", "K2", "SJD", "IPA", "APC", "PPF", "DPF", "LCD", "AIO", "HD", "DA", "QD", "UV", "XL", "XXL", "XP", "OS", "NP", "EX", "FS",
  "NPT", "AGD", "WC", "GT", "LKW", "RO", "DS", "DEG", "II", "III", "IV", "CL", "CM", "NF", "PRO", "R", "LED",
]);
const FIXED: Record<string, string> = { PH: "pH", ML: "ml", KG: "kg", L: "l", G: "g", SZT: "szt.", MM: "mm", CM: "cm" };
// Numery katalogowe w nazwach (SONAX 275300, 296 400, 247.300; Kwazar WTO.0332, WAT.0865) – zbędne w tytule wyniku
const CODE_RES = [
  /\s*[–-]?\s*\b\d{3}[ .]?\d{3}\b(?![,.]?\d|\s?(?:ml|l|g|kg|mm|cm|szt)\b)/gi,
  /\s*[–-]?\s*\b[A-Z]{3}\.\d{4}\b/g,
  /\s*\(\s*\)/g,
];

/** Numer katalogowy producenta z nazwy (MPN): SONAX – 6 cyfr, Kwazar – kod typu WTO.0332. Puste, gdy go nie ma. */
export function mpnOf(name: string, brand?: string): string {
  const b = (brand ?? "").toLowerCase();
  if (b === "sonax" || /^sonax\b/i.test(name)) {
    const m = name.match(/\b(\d{3})[ .]?(\d{3})\b(?![,.]?\d|\s?(?:ml|l|g|kg|mm|cm|szt)\b)/i);
    if (m) return `${m[1]}${m[2]}`;
  }
  if (b === "kwazar" || /kwazar/i.test(name)) {
    const m = name.match(/\b([A-Z]{3}\.\d{4})\b/);
    if (m) return m[1];
  }
  return "";
}

const SMALL = new Set(["i", "w", "z", "do", "na", "od", "po", "pod", "dla", "bez", "oraz", "lub", "ze", "we", "o"]);

// Słowa pisane WIELKIMI literami („TENZI TOP GLASS”) → „Tenzi Top Glass”. Skróty z listy zostają wielkie, spójniki małe.
function tameCaps(s: string) {
  let first = true;
  return s.replace(/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż0-9]+/g, (w) => {
    const isFirst = first;
    first = false;
    if (/\d/.test(w) || w !== w.toUpperCase() || w.length < 2 && w !== "L" && w !== "G") return w;
    if (FIXED[w]) return FIXED[w];
    if (KEEP_UPPER.has(w)) return w;
    const low = w.toLowerCase();
    if (!isFirst && SMALL.has(low)) return low;
    return low[0].toUpperCase() + low.slice(1);
  });
}

/** Tytuł wyniku w Google z nazwy produktu: bez numerów katalogowych, bez krzyczących wielkich liter, bez podwójnych spacji. */
export function cleanTitle(name: string, max = 60) {
  let t = name;
  for (const re of CODE_RES) t = t.replace(re, "");
  t = tameCaps(t)
    // „1L.”, „500ML” → „1 l”, „500 ml”
    .replace(/(\d)\s*(ml|l|kg|g)\.?(?=[\s,–|-]|$)/gi, (_m, d: string, u: string) => `${d} ${u.toLowerCase()}`)
    .replace(/\s*\|\s*/g, " – ")
    .replace(/\s+-\s+/g, " – ")
    .replace(/(\s*–\s*)+$/, "")
    .replace(/(\s*–\s*){2,}/g, " – ")
    .replace(/\s{2,}/g, " ")
    .replace(/[.\s]+$/, "")
    .trim();
  // Za długi tytuł: obcinamy końcowe dopiski po „–”, póki nie zmieści się w wyniku Google
  // (pojemność z obciętej części dopisujemy na końcu – klient jej szuka).
  const SIZE = /\b\d+(?:[,.]\d+)?\s?(?:ml|l|kg|g)\b/i;
  let size = "";
  while (t.length > max && t.includes(" – ")) {
    const cut = t.lastIndexOf(" – ");
    const shorter = t.slice(0, cut);
    if (shorter.length < 25) break;
    if (!size) size = t.slice(cut).match(SIZE)?.[0] ?? "";
    t = shorter;
  }
  if (size && !SIZE.test(t)) t = `${t} ${size}`;
  return t;
}

/** Tytuł z dopiskiem sklepu, jeśli się mieści (Google pokazuje ok. 60 znaków). */
export function titleWithShop(t: string) {
  return t.length <= 46 ? `${t} | Sklep Sonax` : t;
}

/** Skraca tekst do pełnego zdania (albo słowa) w limicie znaków. */
export function cutSentence(text: string, max = 158) {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const part = s.slice(0, max + 1);
  const dot = Math.max(part.lastIndexOf(". "), part.lastIndexOf("! "), part.lastIndexOf("? "));
  if (dot >= max * 0.55) return part.slice(0, dot + 1);
  const space = part.lastIndexOf(" ");
  return `${part.slice(0, space > 40 ? space : max).replace(/[,;:–-]+$/, "")}…`;
}

/** Pierwsze akapity opisu (bez nagłówków i list) jako zwykły tekst – do opisu wyniku w Google. */
export function leadFromHtml(html?: string | null) {
  const h = (html ?? "").replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const paras = [...h.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => plainText(m[1])).filter((p) => p.length > 30);
  const text = paras.length ? paras.join(" ") : plainText(h.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, " ").replace(/<li[^>]*>/gi, " "));
  return text.replace(/[●•✅✔]/g, "").replace(/\s+/g, " ").trim();
}

/** Opis wyniku w Google: z panelu, a jeśli pusty – z krótkiego opisu lub początku opisu, przycięty do pełnego zdania. */
export function metaDescription(p: { seo?: { description?: string }; short?: string; name: string; brand?: string }, html?: string | null) {
  if (p.seo?.description?.trim()) return cutSentence(plainText(p.seo.description), 160);
  const short = plainText(p.short).replace(/…$/, "");
  const lead = leadFromHtml(html);
  // Krótki opis ucięty przez stary sklep („…”) zastępujemy początkiem pełnego opisu
  const base = short && !/…$/.test(plainText(p.short)) && short.length >= 60 ? short : lead || short;
  if (base) return cutSentence(base);
  return `${cleanTitle(p.name)} – oryginalny produkt ${p.brand || "SONAX"}. Sklep w Białymstoku, wysyłka w całej Polsce.`;
}

// Pytania i odpowiedzi do danych FAQ dla Google i asystentów AI (schema.org FAQPage).
// Źródło: sekcja z nagłówkiem H2 „Najczęstsze pytania” (albo „Pytania i odpowiedzi”), w niej pytania jako H3 i odpowiedzi jako akapity.
export type Faq = { q: string; a: string };
const FAQ_HEAD = /najczęstsze pytania|pytania i odpowiedzi|faq/i;

/** FAQ z opisu produktu w HTML. */
export function faqFromHtml(html?: string | null): Faq[] {
  const h = html ?? "";
  const start = [...h.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].find((m) => FAQ_HEAD.test(plainText(m[1])));
  if (!start || start.index == null) return [];
  const rest = h.slice(start.index + start[0].length);
  const section = rest.split(/<h2[\s>]/i)[0];
  const out: Faq[] = [];
  const parts = section.split(/<h3[^>]*>/i).slice(1);
  for (const part of parts) {
    const [qRaw, aRaw = ""] = part.split(/<\/h3>/i);
    const q = plainText(qRaw);
    const a = plainText(aRaw.replace(/<\/(p|li)>/gi, " "));
    if (q && a) out.push({ q, a });
  }
  return out;
}

type Lex = { type?: string; tag?: string; text?: string; children?: Lex[] };
const lexText = (n: Lex): string => n.text ?? (n.children ?? []).map(lexText).join(n.type === "list" || n.type === "listitem" ? " " : "");

/** FAQ z treści wpisu (edytor Lexical). */
export function faqFromLexical(content: unknown): Faq[] {
  const nodes = ((content as { root?: Lex } | null)?.root?.children ?? []) as Lex[];
  const at = nodes.findIndex((n) => n.type === "heading" && n.tag === "h2" && FAQ_HEAD.test(lexText(n)));
  if (at < 0) return [];
  const out: Faq[] = [];
  let cur: Faq | null = null;
  for (const n of nodes.slice(at + 1)) {
    if (n.type === "heading" && n.tag === "h2") break;
    if (n.type === "heading" && n.tag === "h3") { if (cur?.a) out.push(cur); cur = { q: lexText(n).trim(), a: "" }; continue; }
    if (cur && (n.type === "paragraph" || n.type === "list")) cur.a = `${cur.a} ${lexText(n)}`.trim();
  }
  if (cur?.a) out.push(cur);
  return out;
}

/** Dane FAQPage dla schema.org (co najmniej 2 pytania, inaczej nic). */
export function faqLd(faq: Faq[]) {
  if (faq.length < 2) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
