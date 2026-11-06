import { plainText, type Product } from "@/lib/data";
import { mpnOf } from "@/lib/seo";

const base = (process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000").replace(/\/$/, "");
const abs = (u: string) => (/^https?:\/\//.test(u) ? u : `${base}${u.startsWith("/") ? "" : "/"}${u}`);

// Dane strukturalne schema.org – Google pokazuje dzięki nim cenę, dostępność i gwiazdki w wynikach
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export type StoreProfile = { sameAs?: string[]; lat?: number; lng?: number; hasMap?: string };

export const organizationLd = (telephone = "+48 664 953 377", profile?: StoreProfile) => ({
  "@context": "https://schema.org",
  "@type": "Store",
  name: "Sklep Sonax Białystok",
  legalName: "KENOCHEM Kuczyński Sp. J.",
  url: base,
  logo: `${base}/sonax/logo.png`,
  image: `${base}/sonax/logo.png`,
  telephone,
  email: "aukcje@sonax.bialystok.pl",
  vatID: "PL5423224790",
  address: { "@type": "PostalAddress", streetAddress: "Gen. Wł. Andersa 40", postalCode: "15-113", addressLocality: "Białystok", addressCountry: "PL" },
  openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "16:00" }],
  areaServed: { "@type": "Country", name: "Polska" },
  sameAs: profile?.sameAs?.length ? profile.sameAs : undefined,
  hasMap: profile?.hasMap,
  geo: profile?.lat != null && profile?.lng != null ? { "@type": "GeoCoordinates", latitude: profile.lat, longitude: profile.lng } : undefined,
});

export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Sklep Sonax Białystok",
  url: base,
  potentialAction: { "@type": "SearchAction", target: `${base}/szukaj?q={search_term_string}`, "query-input": "required name=search_term_string" },
});

// Dostawa i zwroty w danych produktu – Google pokazuje je przy wyniku („Bezpłatna dostawa”, „Zwrot 14 dni”)
export type ShippingLd = { price: number; freeFrom: number };

function offerOf(p: Product, v: Product["variants"][number], ship?: ShippingLd, pageSlug?: string) {
  const slug = v.slug || pageSlug || p.slug;
  const stock = v.stock ?? p.stock;
  return {
    "@type": "Offer",
    url: `${base}/produkt/${slug}`,
    sku: v.sku || p.sku || undefined,
    priceCurrency: "PLN",
    price: v.price.toFixed(2),
    priceValidUntil: p.saleTo?.slice(0, 10),
    availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@type": "Organization", name: "Sklep Sonax Białystok" },
    shippingDetails: ship ? {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: (v.price >= ship.freeFrom ? 0 : ship.price).toFixed(2), currency: "PLN" },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "PL" },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
        transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
      },
    } : undefined,
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "PL",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 14,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    },
  };
}

export function productLd(p: Product, crumbs: { name: string; url: string }[], rating?: { average: number; count: number }, ship?: ShippingLd, pageSlug?: string, text?: string) {
  const shown = p.variants.find((v) => v.slug === pageSlug) ?? p.variants[0];
  const ean = shown.ean || p.ean;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.name,
      url: `${base}/produkt/${pageSlug || p.slug}`,
      sku: shown.sku || p.sku || undefined,
      // numer katalogowy producenta (np. SONAX 275300), nie nasz wewnętrzny SKU
      mpn: (p.variants.length === 1 && mpnOf(p.name, p.brand)) || undefined,
      gtin13: /^\d{13}$/.test(ean) ? ean : undefined,
      gtin8: /^\d{8}$/.test(ean) ? ean : undefined,
      brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
      image: p.images.slice(0, 5).map(abs),
      description: text || plainText(p.seo?.description || p.short) || `${p.brand ? `${p.brand} ` : ""}${p.name}. Sklep SONAX Białystok.`,
      category: crumbs.slice(1, -1).map((c) => c.name).join(" > ") || undefined,
      offers: p.variants.length > 1 ? p.variants.map((v) => offerOf(p, v, ship, pageSlug)) : offerOf(p, shown, ship, pageSlug),
      aggregateRating: rating && rating.count ? { "@type": "AggregateRating", ratingValue: rating.average.toFixed(1), reviewCount: rating.count } : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${base}${c.url}` })),
    },
  ];
}
