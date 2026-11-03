import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Stałe podstrony z sonax.sklep.pl (WordPress) → nowe adresy, żeby nie tracić pozycji w Google.
  // Kategorie, zdublowane produkty i wpisy bloga są w panelu: Ustawienia → Przekierowania.
  async redirects() {
    return [
      { source: "/dostawy-i-platnosci", destination: "/dostawa-i-platnosci", permanent: true },
      { source: "/odstapienie-od-umowy", destination: "/zwroty-i-reklamacje", permanent: true },
      { source: "/my-account/:path*", destination: "/konto", permanent: true },
      { source: "/moje-konto/:path*", destination: "/konto", permanent: true },
      { source: "/finalizacja-zamowienia/:path*", destination: "/zamowienie", permanent: true },
      { source: "/contact-us", destination: "/kontakt", permanent: true },
      { source: "/strona-glowna", destination: "/", permanent: true },
      { source: "/sklep", destination: "/szukaj", permanent: true },
      { source: "/producenci", destination: "/marki", permanent: true },
      { source: "/dla-myjni", destination: "/kategoria/chemia-do-myjni", permanent: true },
      { source: "/przewodniki-zakupowe", destination: "/blog", permanent: true },
      { source: "/wishlist", destination: "/ulubione", permanent: true },
      // Stare adresy marek i produktów z poradników. Lista jest też w src/lib/legacyLinks.ts (linki w blogu).
      { source: "/producenci/:slug", destination: "/marki/:slug", permanent: true },
      { source: "/produkt/auto-smola-zywica-200-ml", destination: "/produkt/sonax-preparat-do-usuwania-smoly", permanent: true },
      { source: "/produkt/sonax-ceramic-spray-coating-750ml-257-400", destination: "/produkt/sonax-ceramic-spray-coating-750ml", permanent: true },
      { source: "/produkt/sonax-ceramic-ultra-slick-detailer-750ml-268-400", destination: "/produkt/sonax-xtreme-ceramic-ultra-slick-detailer", permanent: true },
      { source: "/produkt/sonax-regeneracji-lakieru-250-ml-302-100", destination: "/produkt/sonax-preparat-do-regeneracji-lakieru", permanent: true },
      { source: "/produkt/sonax-szampon-woskiem-koncentrat-500-ml-313-200", destination: "/produkt/sonax-szampon-samochodowy-z-woskiem", permanent: true },
      { source: "/produkt/sonax-wosk-lakierow-metalizowanych-250-ml-317-100", destination: "/produkt/sonax-wosk-lakierow-metalizowanych-250", permanent: true },
      { source: "/produkt/sonax-zel-mycia-felg-429-200", destination: "/produkt/sonax-zel-do-mycia-felg", permanent: true },
    ];
  },
  images: {
    // Zdjęcia produktów: obecny sklep sonax.sklep.pl i eksport BaseLinkera
    remotePatterns: [
      { protocol: "https", hostname: "upload.cdn.baselinker.com" },
      { protocol: "https", hostname: "www.sonax.sklep.pl" },
      { protocol: "https", hostname: "sonax.sklep.pl" },
      { protocol: "https", hostname: "kenochem.com" },
      { protocol: "https", hostname: "www.kenochem.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
    // Pliki wgrane w panelu
    localPatterns: [{ pathname: "/api/media/file/**" }, { pathname: "/brand/**" }, { pathname: "/sonax/**" }, { pathname: "/stock/**" }, { pathname: "/marks/**" }, { pathname: "/ghs/**" }],
  },
  turbopack: {
    root: dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
