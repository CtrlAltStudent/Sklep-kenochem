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
import { integrationEndpoints } from "./integrations/endpoints";
import { shopEmailAdapter } from "./integrations/mail/payloadAdapter";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: " – Panel Sonax", icons: [{ url: "/sonax/icon-512.png" }] },
    components: {
      graphics: { Logo: "@/payload/components/Branding#Logo", Icon: "@/payload/components/Branding#Icon" },
      views: {
        dashboard: { Component: "@/payload/components/Dashboard#Dashboard" },
        reports: { Component: "@/payload/components/Reports#Reports", path: "/raporty", meta: { title: "Raporty sprzedaży" } },
        integrations: { Component: "@/payload/components/IntegrationsPanel#IntegrationsView", path: "/integracje", exact: true, meta: { title: "Integracje" } },
        integrationModule: { Component: "@/payload/components/IntegrationsPanel#ModuleView", path: "/integracje/:module", exact: true, meta: { title: "Moduł integracji" } },
      },
      Nav: "@/payload/components/Nav#Nav",
      actions: ["@/payload/components/AdminClient#AdminActions"],
    },
    dateFormat: "dd.MM.yyyy HH:mm",
  },
  i18n: { supportedLanguages: { pl }, fallbackLanguage: "pl" },
  collections: [Orders, Returns, FormSubmissions, StockAlerts, Customers, Products, Categories, Coupons, Reviews, Newsletter, Pages, Posts, Media, IntegrationLogs, Users, Redirects],
  globals: [Homepage, Navigation, StoreSettings, BaseLinkerSettings],
  endpoints: [...baselinkerEndpoints, ...integrationEndpoints],
  editor: lexicalEditor(),
  email: shopEmailAdapter,
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  // DATABASE_URL=postgres://… → PostgreSQL (docker compose / serwer), file:./… → SQLite (lokalnie bez Dockera)
  db: (process.env.DATABASE_URL ?? "").startsWith("postgres")
    ? postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL } })
    : sqliteAdapter({
        client: { url: process.env.DATABASE_URL || "file:./sonax.db" },
        // Push wyłączony na stałe: przy każdym żądaniu Next próbował dodać indeks, który już jest
        // (CREATE INDEX na _homepage_v), strona wieszała się na minuty. Nowe pola: PAYLOAD_DB_PUSH=1 npm run dev.
        push: process.env.PAYLOAD_DB_PUSH === "1",
      }),
  sharp,
});
