import type { MetadataRoute } from "next";
import { siteBase, siteIndexable } from "@/lib/site";
import { getSite } from "@/integrations/vault";
import { AI_BOTS } from "@/integrations/siteSettings";

// czytane przy każdym zapytaniu – zmiana w panelu działa od razu
export const dynamic = "force-dynamic";

const FILTERS = ["sort", "widok", "cena", "marka", "opak", "rodzaj", "dostepne", "promocje", "nowosci", "kat", "q"];

// Serwer testowy: zakaz indeksowania całości. Produkcja: wszystko poza panelem, koszykiem i kontem.
export default function robots(): MetadataRoute.Robots {
  const base = siteBase();
  if (!siteIndexable()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  const site = getSite();
  const extra = site.robotsExtra.split(/\r?\n/).filter(Boolean);
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // filtry list (marka, cena, sortowanie…) tworzą tysiące kopii tych samych stron – podkategorie (?sub=, &typ=) zostają dostępne
        disallow: ["/admin", "/api/", "/koszyk", "/zamowienie", "/konto", "/ulubione", "/szukaj", ...FILTERS.map((f) => `/*?*${f}=`), ...extra],
      },
      ...(site.aiBots ? [] : [{ userAgent: AI_BOTS, disallow: "/" }]),
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
