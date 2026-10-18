import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { getCategoryCounts, getProducts } from "@/lib/catalog";
import { CookieConsent } from "@/components/CookieConsent";
import { JsonLd, organizationLd } from "@/components/JsonLd";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: { default: "Kenochem – profesjonalna chemia samochodowa i obiektowa", template: "%s | Kenochem" },
  description: "Chemia samochodowa, do myjni, profesjonalna i specjalistyczna. Hurt i detal, darmowa dostawa od 399 zł.",
};

export const revalidate = 60;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [counts, products] = await Promise.all([getCategoryCounts(), getProducts()]);
  return (
    <html lang="pl" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header counts={counts} />
        <main className="flex-1">{children}</main>
        <Footer productCount={products.length} />
        <CartDrawer />
        <CookieConsent />
        <JsonLd data={organizationLd} />
      </body>
    </html>
  );
}
