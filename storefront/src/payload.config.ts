// Konfiguracja panelu sklepu (Payload CMS) – dostępny pod /admin
import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { pl } from "@payloadcms/translations/languages/pl";
import sharp from "sharp";

import { Users } from "./payload/collections/Users";
import { Media } from "./payload/collections/Media";
import { Products } from "./payload/collections/Products";
import { Categories } from "./payload/collections/Categories";
import { Orders } from "./payload/collections/Orders";
import { Customers } from "./payload/collections/Customers";
import { IntegrationLogs, Pages, Posts } from "./payload/collections/Content";
import { FormSubmissions } from "./payload/collections/FormSubmissions";
import { Coupons, Newsletter, Redirects, Returns, Reviews, StockAlerts } from "./payload/collections/Marketing";
import { BaseLinkerSettings, Homepage, Navigation, StoreSettings } from "./payload/globals";
import { baselinkerEndpoints } from "./integrations/baselinker/endpoints";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: " – Panel Kenochem", icons: [{ url: "/brand/favicon.png" }] },
    components: {
      graphics: { Logo: "@/payload/components/Branding#Logo", Icon: "@/payload/components/Branding#Icon" },
      views: {
        dashboard: { Component: "@/payload/components/Dashboard#Dashboard" },
        reports: { Component: "@/payload/components/Reports#Reports", path: "/raporty", meta: { title: "Raporty sprzedaży" } },
      },
      beforeNavLinks: ["@/payload/components/Branding#NavBrand"],
      afterNavLinks: ["@/payload/components/Reports#ReportsNavLink"],
      actions: ["@/payload/components/AdminClient#AdminActions"],
    },
    dateFormat: "dd.MM.yyyy HH:mm",
  },
  i18n: { supportedLanguages: { pl }, fallbackLanguage: "pl" },
  collections: [Orders, Returns, FormSubmissions, StockAlerts, Customers, Products, Categories, Coupons, Reviews, Newsletter, Pages, Posts, Media, IntegrationLogs, Users, Redirects],
  globals: [Homepage, Navigation, StoreSettings, BaseLinkerSettings],
  endpoints: baselinkerEndpoints,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  // DATABASE_URL=postgres://… → PostgreSQL (docker compose / serwer), file:./… → SQLite (lokalnie bez Dockera)
  db: (process.env.DATABASE_URL ?? "").startsWith("postgres")
    ? postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } })
    : sqliteAdapter({
        client: { url: process.env.DATABASE_URL || "file:./kenochem.db" },
        // Schemat aktualizuje serwer deweloperski; skrypty (seed, testy) ustawiają PAYLOAD_DB_PUSH=0,
        // żeby dwa procesy nie zmieniały bazy jednocześnie
        push: process.env.PAYLOAD_DB_PUSH !== "0",
      }),
  sharp,
});
