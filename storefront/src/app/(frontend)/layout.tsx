import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { getCatalog } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/cms";
import { freeShippingFrom } from "@/lib/data";
import { ShopConfigProvider } from "@/lib/shopConfig";
import { CookieConsent } from "@/components/CookieConsent";
import { JsonLd, organizationLd } from "@/components/JsonLd";
import { siteIndexable } from "@/lib/site";
import { marketingConfig, siteVerification } from "@/integrations/marketing";
import { tagsBootstrap } from "@/lib/tagsBootstrap";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
// Wąski, pochylony krój nagłówków – sportowy charakter jak w logo Sonax
const barlow = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"], style: ["normal", "italic"] });

export const generateMetadata = (): Metadata => ({
  title: { default: "Chemia samochodowa SONAX – kosmetyki do auta | Sklep Sonax Białystok", template: "%s | Sklep Sonax" },
  description: "Oficjalny sklep SONAX w Białymstoku: chemia samochodowa, kosmetyki detailingowe, środki do myjni i domu. Szybka wysyłka i fachowe doradztwo.",
  icons: { icon: "/sonax/icon-512.png", apple: "/sonax/icon-512.png" },
  // serwer testowy nie trafia do wyszukiwarek (src/lib/site.ts)
  robots: siteIndexable() ? undefined : { index: false, follow: false },
  // kody weryfikacji Search Console / Bing z modułu „Google i marketing”
  verification: siteVerification(),
});

export const revalidate = 60;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [{ counts, products }, store] = await Promise.all([getCatalog(), getStoreSettings()]);
  const tags = marketingConfig();
  return (
    <html lang="pl" className={`${inter.variable} ${barlow.variable} h-full antialiased`}>
      {/* Consent Mode v2 i narzędzia Google/Meta – przed resztą strony, żeby zgody „denied” obowiązywały od początku */}
      {tags && <head><script dangerouslySetInnerHTML={{ __html: tagsBootstrap(tags) }} /></head>}
      <body className="flex min-h-full flex-col font-sans">
        <ShopConfigProvider value={{ freeShipping: freeShippingFrom(store) }}>
        <Header counts={counts} />
        <main className="flex-1">{children}</main>
        <Footer productCount={products.length} />
        <CartDrawer />
        <CookieConsent />
        <JsonLd data={organizationLd} />
        </ShopConfigProvider>
      </body>
    </html>
  );
}
