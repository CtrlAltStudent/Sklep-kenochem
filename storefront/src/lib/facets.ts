// Cechy produktów do filtrów (wyliczane z nazwy i pojemności – dane z BaseLinkera nie mają atrybutów)

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

// Rodzaj produktu – kolejność ma znaczenie (pierwsze dopasowanie wygrywa)
const forms: [string, RegExp][] = [
  ["Spray / aerozol", /spray|aerozol|atomizer|rozpylacz/],
  ["Piana aktywna", /piana|foam/],
  ["Wosk / powłoka", /wosk|wax|powlok|ceramic|sealant/],
  ["Żel", /\bzel\b|\bgel\b|zelowy/],
  ["Pasta / krem", /pasta|krem\b/],
  ["Proszek / granulat", /proszek|granul|tabletk/],
  ["Olejek zapachowy", /olejek/],
  ["Koncentrat", /koncentrat/],
  ["Płyn / preparat", /plyn|szampon|preparat|srodek|odtluszcz|zmywacz|mydlo|dressing|cleaner|remover|niwelator|neutraliz/],
];

export function productForm(name: string, label: string): string {
  const n = norm(name);
  for (const [f, re] of forms) if (re.test(n)) return f;
  return /szt/.test(label) ? "Akcesoria i sprzęt" : "Inne";
}

// Wielkość opakowania – przedziały zamiast dziesiątek pojedynczych pojemności
export const sizeBuckets = ["do 1 l / kg", "1–5 l / kg", "5–10 l / kg", "10–25 l / kg", "powyżej 25 l / kg", "Na sztuki"] as const;

export function sizeBucket(label: string): (typeof sizeBuckets)[number] {
  const m = label.match(/([\d.,]+)\s*(ml|l|kg|g)\b/i);
  if (!m) return "Na sztuki";
  const n = parseFloat(m[1].replace(",", "."));
  const u = m[2].toLowerCase();
  const v = u === "ml" || u === "g" ? n / 1000 : n;
  if (v <= 1) return "do 1 l / kg";
  if (v <= 5) return "1–5 l / kg";
  if (v <= 10) return "5–10 l / kg";
  if (v <= 25) return "10–25 l / kg";
  return "powyżej 25 l / kg";
}
