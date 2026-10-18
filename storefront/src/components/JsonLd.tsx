import type { Product } from "@/lib/data";

const base = (process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000").replace(/\/$/, "");

// Dane strukturalne schema.org – Google pokazuje dzięki nim cenę, dostępność i gwiazdki w wynikach
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "Kenochem",
  legalName: "KENOCHEM Kuczyński Sp. J.",
  url: base,
  logo: `${base}/brand/logo-e1772107192548.webp`,
  telephone: "+48 500 021 705",
  email: "sklep@kenochem.com",
  vatID: "PL5423224790",
  address: { "@type": "PostalAddress", streetAddress: "Gen. Wł. Andersa 40, Boks 16", postalCode: "15-113", addressLocality: "Białystok", addressCountry: "PL" },
  openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "16:00" }],
};

export function productLd(p: Product, crumbs: { name: string; url: string }[], rating?: { average: number; count: number }) {
  const v = p.variants[0];
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      sku: p.sku || undefined,
      gtin13: /^\d{13}$/.test(p.ean) ? p.ean : undefined,
      brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
      image: p.images.slice(0, 5),
      description: p.short || undefined,
      offers: {
        "@type": "Offer",
        url: `${base}/produkt/${p.slug}`,
        priceCurrency: "PLN",
        price: v.price.toFixed(2),
        priceValidUntil: p.saleTo?.slice(0, 10),
        availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/BackOrder",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: "Kenochem" },
      },
      aggregateRating: rating && rating.count ? { "@type": "AggregateRating", ratingValue: rating.average.toFixed(1), reviewCount: rating.count } : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${base}${c.url}` })),
    },
  ];
}
