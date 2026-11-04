// Szukanie po nazwie, marce, SKU i EAN.
// Składa polskie końcówki (politury → politura) i wybacza literówkę w dłuższym słowie.

const SUFFIXES = ["iami", "owie", "ami", "ach", "owi", "emu", "ego", "ych", "imi", "ie", "ia", "om", "em", "ow", "ka", "ki", "ke", "ek", "y", "i", "a", "e", "u", "o"];

export function fold(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/ł/g, "l");
}

export function tokens(s: string) {
  return fold(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 2);
}

function stem(word: string) {
  if (word.length < 5) return word;
  for (const suf of SUFFIXES) {
    if (word.endsWith(suf) && word.length - suf.length >= 4) return word.slice(0, -suf.length);
  }
  return word;
}

function edits(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, (prev2[j - 2] ?? 9) + 1);
      cur[j] = v;
      if (v < best) best = v;
    }
    if (best > 2) return 3;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}

// 0 = nie pasuje. Wyżej = lepiej (dokładne słowo, fragment, odmiana, literówka).
export function wordScore(word: string, token: string) {
  if (!word || !token) return 0;
  const digits = (word.match(/\d/g) ?? []).length >= 4;
  if (token === word) return 5;
  if (token.includes(word) || (word.includes(token) && token.length >= 4)) return 4;
  if (digits) return 0;
  const sw = stem(word);
  const st = stem(token);
  if (sw.length >= 4 && st.length >= 4 && (sw === st || sw.startsWith(st) || st.startsWith(sw))) return 3;
  if (word.length >= 5 && token.length >= 5 && Math.abs(word.length - token.length) <= 2) {
    const max = word.length >= 8 ? 2 : 1;
    const d = edits(word, token);
    if (d > 0 && d <= max) return d === 1 ? 2 : 1;
  }
  return 0;
}

export type SearchDoc = { tokens: string[]; name: string; codes: string };

// 0 = produkt odpada. Wszystkie słowa zapytania muszą się do czegoś odnieść.
export function scoreQuery(query: string, doc: SearchDoc) {
  const words = tokens(query);
  if (!words.length) return 0;
  const compact = fold(query).replace(/[^a-z0-9]/g, "");
  let score = 0;
  if (compact.length >= 3 && doc.codes.includes(compact)) score += 80;
  for (const w of words) {
    let best = 0;
    for (const t of doc.tokens) {
      const s = wordScore(w, t);
      if (s > best) best = s;
      if (best === 5) break;
    }
    if (!best) return 0;
    score += best;
    if (doc.name.includes(w)) score += 3;
  }
  return score;
}
