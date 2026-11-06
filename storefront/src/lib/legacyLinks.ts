// Stare adresy, które ktoś jeszcze otwiera (albo które zostały w poradnikach), i ich właściwe miejsce.

export const legacyRedirects: { source: string; destination: string; permanent: true }[] = [
  { source: "/producenci/:slug", destination: "/marki/:slug", permanent: true },
  { source: "/produkt/auto-smola-zywica-200-ml", destination: "/produkt/sonax-preparat-do-usuwania-smoly", permanent: true },
  { source: "/produkt/sonax-ceramic-spray-coating-750ml-257-400", destination: "/produkt/sonax-ceramic-spray-coating-750ml", permanent: true },
  { source: "/produkt/sonax-ceramic-ultra-slick-detailer-750ml-268-400", destination: "/produkt/sonax-xtreme-ceramic-ultra-slick-detailer", permanent: true },
  { source: "/produkt/sonax-regeneracji-lakieru-250-ml-302-100", destination: "/produkt/sonax-preparat-do-regeneracji-lakieru", permanent: true },
  { source: "/produkt/sonax-szampon-woskiem-koncentrat-500-ml-313-200", destination: "/produkt/sonax-szampon-samochodowy-z-woskiem", permanent: true },
  { source: "/produkt/sonax-wosk-lakierow-metalizowanych-250-ml-317-100", destination: "/produkt/sonax-wosk-lakierow-metalizowanych-250", permanent: true },
  { source: "/produkt/sonax-zel-mycia-felg-429-200", destination: "/produkt/sonax-zel-do-mycia-felg", permanent: true },
];

const exact = new Map(
  legacyRedirects
    .filter((r) => !r.source.includes(":"))
    .map((r) => [r.source, r.destination]),
);

// Wklejone do wpisów linki bywają zakodowane (%2Fprodukt…, %3Fs%3D…) – przeglądarka doklejała je wtedy do adresu wpisu i wychodziło 404.
// Stara wyszukiwarka WordPressa (?s=…) to dziś /szukaj?q=…, a znaczniki utm_* z linku nie są potrzebne.
function tidyHref(raw: string) {
  let url = raw;
  if (/^%(2F|3F)/i.test(url)) {
    try { url = decodeURIComponent(url); } catch { return raw; }
  }
  if (!url.startsWith("/") && !url.startsWith("?")) return url;
  const [path, query = ""] = url.split("?");
  const params = new URLSearchParams(query);
  const search = params.get("s");
  if (search && (!path || path === "/")) return `/szukaj?q=${encodeURIComponent(search)}`;
  for (const key of [...params.keys()]) if (key.startsWith("utm_")) params.delete(key);
  const rest = params.toString();
  return rest ? `${path}?${rest}` : path;
}

// Link w poradniku: stary adres produktu zamieniamy na aktualny, zanim klient w niego kliknie.
export function currentHref(raw: string) {
  const url = tidyHref(raw);
  const [path, query] = url.split("?");
  const next = exact.get(path) ?? (path.startsWith("/producenci/") ? `/marki/${path.slice("/producenci/".length)}` : null);
  if (!next) return url;
  return query ? `${next}?${query}` : next;
}
