// Podstrony informacyjne skopiowane z kenochem.com (regulamin, polityka prywatności, …)
// → kolekcja „Strony” w panelu, z treścią przekonwertowaną z HTML do edytora.
// Uruchomienie: npm run seed:pages   (istniejące strony nie są nadpisywane – chyba że FORCE=1)

import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import { getPayload } from "payload";
import config from "@payload-config";
import { convertHTMLToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";

const payload = await getPayload({ config });
const editorConfig = await editorConfigFactory.default({ config: payload.config });
const log = (m: string) => payload.logger.info(`[seed:pages] ${m}`);
const force = process.env.FORCE === "1";

type Imported = Record<string, { title: string; html: string }>;
const pages = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "data", "pages-import.json"), "utf8")) as Imported;

const meta: Record<string, { template: "legal" | "standard"; intro?: string; footer?: boolean; seo?: string }> = {
  regulamin: { template: "legal", footer: true, intro: "Zasady zawierania umów sprzedaży w sklepie internetowym Kenochem, realizacji zamówień, zwrotów i reklamacji.", seo: "Regulamin sklepu internetowego Kenochem – zasady zakupów, dostawy, zwrotów i reklamacji." },
  "polityka-prywatnosci": { template: "legal", footer: true, intro: "Jak przetwarzamy dane osobowe klientów i użytkowników sklepu oraz jak używamy plików cookies.", seo: "Polityka prywatności i plików cookies sklepu Kenochem." },
  "informacje-o-sklepie": { template: "standard", footer: true, intro: "Hurtownia profesjonalnych środków czystości i chemii do myjni samochodowych – sklep stacjonarny w Białymstoku i sprzedaż online w całej Polsce." },
};

for (const slug of ["regulamin", "polityka-prywatnosci", "informacje-o-sklepie"]) {
  const src = pages[slug];
  const existing = (await payload.find({ collection: "pages", where: { slug: { equals: slug } }, limit: 1, draft: true })).docs[0];
  if (existing && !force) {
    log(`pomijam „${src.title}” – już istnieje`);
    continue;
  }
  const m = meta[slug];
  // W dokumentach prawnych sekcje (§ 1, § 2…) były oznaczone jako h4 – to główne sekcje, więc h2
  const html = m.template === "legal" ? src.html.replace(/<(\/?)h4>/g, "<$1h2>") : src.html;
  const content = convertHTMLToLexical({ editorConfig, html, JSDOM });
  const data = {
    title: src.title,
    slug,
    intro: m.intro,
    template: m.template,
    showInFooter: m.footer,
    layout: [{ blockType: "richText" as const, content }],
    seo: { title: `${src.title} | Kenochem`, description: m.seo ?? m.intro },
    _status: "published" as const,
  };
  if (existing) await payload.update({ collection: "pages", id: existing.id, data });
  else await payload.create({ collection: "pages", data });
  log(`${existing ? "zaktualizowano" : "dodano"} „${src.title}”`);
}

// Metody dostawy i płatności jak w obecnym sklepie (tylko jeśli są jeszcze startowe z seed.ts)
const store = await payload.findGlobal({ slug: "store-settings" });
const codes = (store.shippingMethods ?? []).map((m) => m.code).join(",");
if (force || codes === "inpost,dpd,pickup" || !codes) {
  await payload.updateGlobal({
    slug: "store-settings",
    data: {
      email: store.email || "sklep@kenochem.com",
      gpsrResponsible: store.gpsrResponsible || "KENOCHEM Kuczyński Sp. J., Gen. Wł. Andersa 40, Boks 16, 15-113 Białystok, sklep@kenochem.com",
      shippingMethods: [
        { code: "inpost-paczkomat", label: "InPost Paczkomat 24/7", price: 14.99, baselinkerName: "InPost Paczkomat 24/7", requiresPoint: true, enabled: true, freeAboveThreshold: true },
        { code: "inpost-kurier", label: "InPost Kurier Standard", price: 17.99, baselinkerName: "InPost Kurier Standard", enabled: true, freeAboveThreshold: true },
        { code: "inpost-kurier-cod", label: "InPost Kurier Standard – pobranie", price: 22.99, baselinkerName: "InPost Kurier Pobranie", enabled: true, freeAboveThreshold: false },
        { code: "gls", label: "GLS Kurier", price: 17.99, baselinkerName: "GLS Kurier", enabled: true, freeAboveThreshold: true },
        { code: "gls-cod", label: "GLS Kurier – pobranie", price: 22.99, baselinkerName: "GLS Kurier Pobranie", enabled: true, freeAboveThreshold: false },
        { code: "polpaleta", label: "Kurier półpaleta (do 200 kg)", price: 0, baselinkerName: "Kurier półpaleta", enabled: true, freeAboveThreshold: false },
        { code: "paleta", label: "Kurier paleta (do 500 kg)", price: 0, baselinkerName: "Kurier paleta", enabled: true, freeAboveThreshold: false },
        { code: "pickup", label: "Odbiór osobisty – Białystok", price: 0, baselinkerName: "Odbiór osobisty", enabled: true, freeAboveThreshold: true },
      ],
      paymentMethods: [
        { code: "p24", label: "Przelewy24 – BLIK, karta, Google Pay, Apple Pay, szybki przelew", provider: "przelewy24", baselinkerName: "Przelewy24", enabled: true },
        { code: "transfer", label: "Przelew bankowy (tradycyjny)", provider: "transfer", baselinkerName: "Przelew bankowy", enabled: true },
        { code: "cod", label: "Płatność przy odbiorze (pobranie)", provider: "cod", baselinkerName: "Pobranie", enabled: true },
        { code: "deferred", label: "Przelew z terminem (B2B / instytucje)", provider: "deferred", baselinkerName: "Przelew odroczony", b2bOnly: true, enabled: true },
      ],
    },
  });
  log("metody dostawy i płatności jak w obecnym sklepie (ceny do weryfikacji!)");
}

log("gotowe ✔");
process.exit(0);
