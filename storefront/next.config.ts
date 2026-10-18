import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Stare adresy z kenochem.com (WooCommerce) → nowe, żeby nie tracić pozycji w Google
  async redirects() {
    return [
      { source: "/wysylka", destination: "/dostawa-i-platnosci", permanent: true },
      { source: "/platnosci", destination: "/dostawa-i-platnosci", permanent: true },
      { source: "/moje-konto", destination: "/konto", permanent: true },
      { source: "/wishlist", destination: "/ulubione", permanent: true },
      { source: "/promocje", destination: "/nowosci", permanent: true },
    ];
  },
  images: {
    // Zdjęcia produktów z eksportu BaseLinkera
    remotePatterns: [
      { protocol: "https", hostname: "kenochem.com" },
      { protocol: "https", hostname: "upload.cdn.baselinker.com" },
      { protocol: "https", hostname: "www.sonax.sklep.pl" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
    // Pliki wgrane w panelu
    localPatterns: [{ pathname: "/api/media/file/**" }, { pathname: "/brand/**" }, { pathname: "/stock/**" }],
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
