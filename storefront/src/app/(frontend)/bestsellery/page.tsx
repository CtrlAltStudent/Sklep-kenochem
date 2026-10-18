import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { getBestsellers, getCategoryCounts, getFeatured } from "@/lib/catalog";
import { CollectionPage } from "@/components/CollectionPage";

export const metadata: Metadata = { title: "Bestsellery", description: "Najchętniej kupowane produkty w sklepie Kenochem." };

// Produkty z etykietą „Bestseller” (Sklep → Produkty → Etykiety)
export default async function BestsellersPage() {
  const [items, counts, featured] = await Promise.all([getBestsellers(), getCategoryCounts(), getFeatured()]);
  return (
    <CollectionPage title="Bestsellery" lead="Produkty, które nasi klienci wybierają najczęściej – sprawdzone w myjniach, warsztatach i firmach sprzątających."
      icon={Trophy} products={items} counts={counts} fallback={featured}
      empty={{ title: "Zestawienie bestsellerów pojawi się wkrótce", text: "Na razie zobacz produkty, które polecamy." }} />
  );
}
