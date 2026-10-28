// llms.txt – „mapa strony” dla asystentów AI (ChatGPT, Claude, Perplexity, Gemini).
// Krótka wersja: kim jesteśmy, zasady zakupów i najważniejsze linki. Pełna (llms-full.txt): cały katalog z cenami i dostępnością.
// Format: https://llmstxt.org – zwykły Markdown, bezwzględne adresy.

import { categories, formatPrice, freeShippingFrom } from "@/lib/data";
import { getBrands, getCategoryCounts, getProducts } from "@/lib/catalog";
import { getCms, getPosts, getStoreSettings } from "@/lib/cms";
import { paymentAvailable, shippingAvailable } from "@/integrations/availability";
import { absUrl } from "@/lib/site";
import { getSite } from "@/integrations/vault";

const oneLine = (s?: string | null) => (s ?? "").replace(/\s+/g, " ").trim();

async function header() {
  const store = await getStoreSettings();
  const ship = (store.shippingMethods ?? []).filter(shippingAvailable);
  const pay = (store.paymentMethods ?? []).filter(paymentAvailable);
  const free = freeShippingFrom(store);
  return [
    "# Sklep SONAX – Białystok (sonax.sklep.pl)",
    "",
    "> Oficjalny sklep internetowy z chemią i kosmetykami samochodowymi SONAX oraz środkami do myjni, domu i ogrodu. Prowadzi go KENOCHEM Kuczyński Sp. J., ul. Gen. Andersa 40, 15-113 Białystok (NIP 5423224790). Sprzedaż w Polsce, ceny brutto w PLN.",
    "",
    ...(getSite().llmsIntro ? [getSite().llmsIntro.trim(), ""] : []),
    "## Zakupy w skrócie",
    "",
    `- Dostawa: ${ship.map((m) => `${m.label} (${m.price ? formatPrice(m.price) : "gratis"})`).join(", ")}.`,
    `- Darmowa dostawa od ${formatPrice(free)} (dla metod objętych promocją).`,
    `- Płatności: ${pay.map((m) => m.label).join(", ")}.`,
    "- Wysyłka zwykle w 1 dzień roboczy. Zwrot do 14 dni od otrzymania paczki.",
    `- Kontakt: tel. ${store.phone || "+48 500 021 705"}, e-mail ${store.email || "aukcje@sonax.bialystok.pl"}${store.hours ? `, ${oneLine(store.hours)}` : ""}.`,
    "",
  ];
}

export async function llmsShort() {
  const [head, counts, brands, posts] = await Promise.all([header(), getCategoryCounts(), getBrands(), getPosts()]);
  const lines = [...head, "## Informacje dla klienta", ""];
  for (const [path, title, desc] of [
    ["/dostawa-i-platnosci", "Dostawa i płatności", "metody i koszty dostawy, płatności"],
    ["/zwroty-i-reklamacje", "Zwroty i reklamacje", "jak zwrócić towar lub złożyć reklamację"],
    ["/regulamin", "Regulamin sklepu", "zasady sprzedaży"],
    ["/polityka-prywatnosci", "Polityka prywatności", "dane osobowe i cookies"],
    ["/kontakt", "Kontakt", "telefon, e-mail, adres sklepu stacjonarnego"],
    ["/faq", "Najczęstsze pytania", ""],
    ["/o-nas", "O nas", "historia firmy"],
  ]) lines.push(`- [${title}](${absUrl(path)})${desc ? `: ${desc}` : ""}`);

  lines.push("", "## Kategorie produktów", "");
  for (const c of categories) {
    if (!counts[c.slug]) continue;
    const subs = c.children.filter((s) => counts[`${c.slug}/${s.slug}`]);
    lines.push(`- [${c.name}](${absUrl(`/kategoria/${c.slug}`)}): ${counts[c.slug]} produktów`);
    for (const s of subs) lines.push(`  - [${s.name}](${absUrl(`/kategoria/${c.slug}?sub=${s.slug}`)})`);
  }
  lines.push("", "## Wybrane strony", "");
  lines.push(`- [Promocje](${absUrl("/promocje")}): produkty w obniżonych cenach`);
  lines.push(`- [Nowości](${absUrl("/nowosci")})`);
  lines.push(`- [Marki](${absUrl("/marki")}): ${brands.slice(0, 12).map((b) => b.name).join(", ")}`);
  if (posts.length) {
    lines.push("", "## Poradniki", "");
    for (const p of posts.slice(0, 20)) lines.push(`- [${p.title}](${absUrl(`/blog/${p.slug}`)})${p.excerpt ? `: ${oneLine(p.excerpt).slice(0, 160)}` : ""}`);
  }
  lines.push("", "## Optional", "", `- [Pełny katalog produktów z cenami i dostępnością](${absUrl("/llms-full.txt")})`, "");
  return lines.join("\n");
}

export async function llmsFull() {
  const [head, products, pages] = await Promise.all([
    header(),
    getProducts(),
    getCms().then((p) => p.find({ collection: "pages", where: { _status: { equals: "published" } }, limit: 50, depth: 0, select: { title: true, slug: true, intro: true } })),
  ]);
  const lines = [...head, "## Strony informacyjne", ""];
  for (const d of pages.docs) if (d.slug) lines.push(`- [${d.title}](${absUrl(`/${d.slug}`)})${d.intro ? `: ${oneLine(d.intro)}` : ""}`);
  lines.push("", `## Katalog produktów (${products.length})`, "", "Ceny brutto, stan z chwili wygenerowania pliku (odświeżany co godzinę).", "");
  for (const c of categories) {
    const list = products.filter((p) => p.category === c.slug);
    if (!list.length) continue;
    lines.push(`### ${c.name}`, "");
    for (const p of list.sort((a, b) => a.name.localeCompare(b.name, "pl"))) {
      const v = p.variants[0];
      const price = v.oldPrice ? `${formatPrice(v.price)} (promocja, wcześniej ${formatPrice(v.oldPrice)})` : formatPrice(v.price);
      const sizes = p.variants.length > 1 ? p.variants.map((x) => x.label).join(" / ") : (v.label && v.label !== "1 szt." ? v.label : "");
      const facts = [price, p.stock > 0 ? "dostępny" : "chwilowo niedostępny", p.brand && `marka ${p.brand}`, sizes, p.ean && `EAN ${p.ean}`].filter(Boolean).join(" · ");
      lines.push(`- [${p.name}](${absUrl(`/produkt/${p.slug}`)}): ${facts}${p.short ? ` – ${oneLine(p.short).slice(0, 200)}` : ""}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
