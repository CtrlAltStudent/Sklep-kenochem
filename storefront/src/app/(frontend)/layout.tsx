import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { getCatalog } from "@/lib/catalog";
import { getNavigation, getStoreSettings } from "@/lib/cms";
import { formatPrice, freeShippingFrom } from "@/lib/data";
import { ShopConfigProvider } from "@/lib/shopConfig";
import { CookieConsent } from "@/components/CookieConsent";
import { StatBeacon } from "@/components/StatBeacon";
import { JsonLd, organizationLd } from "@/components/JsonLd";
import { siteBase, siteIndexable } from "@/lib/site";
import { marketingConfig, siteVerification } from "@/integrations/marketing";
import { tagsBootstrap } from "@/lib/tagsBootstrap";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
// Wąski, pochylony krój nagłówków – sportowy charakter jak w logo Sonax
const barlow = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"], style: ["normal", "italic"] });

export const generateMetadata = (): Metadata => ({
  metadataBase: new URL(siteBase()),
  title: { default: "Chemia samochodowa SONAX – kosmetyki do auta | Sklep Sonax Białystok", template: "%s | Sklep Sonax" },
  description: "Oficjalny sklep SONAX w Białymstoku: chemia samochodowa, kosmetyki detailingowe, środki do myjni i domu. Szybka wysyłka i fachowe doradztwo.",
  icons: { icon: "/sonax/icon-512.png", apple: "/sonax/icon-512.png" },
  // serwer testowy nie trafia do wyszukiwarek (src/lib/site.ts)
  robots: siteIndexable() ? undefined : { index: false, follow: false },
  // kody weryfikacji Search Console / Bing z modułu „Google i marketing”
  verification: siteVerification(),
});

// Sklep czyta kategorie z bazy serwera przy każdym wejściu. Inaczej strona zbudowana na komputerze
// w biurze pokazywałaby stare działy jeszcze przez minutę po wdrożeniu.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [{ counts, total, tree }, store, nav] = await Promise.all([getCatalog(), getStoreSettings(), getNavigation()]);
  const customBar = nav?.announcement?.text?.trim();
  const bar = nav?.announcement?.enabled === false ? null : {
    text: customBar || `Darmowa dostawa od ${formatPrice(freeShippingFrom(store))} · wysyłka zwykle w 1 dzień roboczy`,
    href: customBar ? nav?.announcement?.link || undefined : undefined,
  };
  const tags = marketingConfig();
  return (
    <html lang="pl" className={`${inter.variable} ${barlow.variable} h-full antialiased`}>
      {/* Consent Mode v2 i narzędzia Google/Meta – przed resztą strony, żeby zgody „denied” obowiązywały od początku */}
      {tags && <head><script dangerouslySetInnerHTML={{ __html: tagsBootstrap(tags) }} /></head>}
      <body className="flex min-h-full flex-col font-sans">
        <ShopConfigProvider value={{ freeShipping: freeShippingFrom(store), categories: tree }}>
        <Header counts={counts} bar={bar} phone={store.phone || "+48 500 021 705"} hours={store.hours || "Pn–Pt 8:00–16:00"} />
        <main className="flex-1">{children}</main>
        <Footer productCount={total} />
        <CartDrawer />
        <CookieConsent />
        <StatBeacon />
        <JsonLd data={organizationLd} />
        </ShopConfigProvider>
      </body>
    </html>
  );
}
