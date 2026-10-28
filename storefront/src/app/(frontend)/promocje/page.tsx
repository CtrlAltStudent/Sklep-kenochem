import type { Metadata } from "next";
import { BadgePercent } from "lucide-react";
import { getCategoryCounts, getDeals, getFeatured } from "@/lib/catalog";
import { CollectionPage } from "@/components/CollectionPage";

export const metadata: Metadata = { title: "Promocje", description: "Aktualne promocje w sklepie Sonax – chemia samochodowa i kosmetyki detailingowe w obniżonych cenach." };

// Produkty z ceną przekreśloną: promocja czasowa lub „cena przed obniżką” ustawione w panelu
export default async function PromotionsPage() {
  const [items, counts, featured] = await Promise.all([getDeals(), getCategoryCounts(), getFeatured()]);
  return (
    <CollectionPage title="Promocje" lead="Produkty w obniżonych cenach. Przy każdej promocji pokazujemy najniższą cenę z 30 dni przed obniżką."
      icon={BadgePercent} products={items} counts={counts} fallback={featured}
      empty={{ title: "Właśnie przygotowujemy nowe promocje", text: "Zajrzyj wkrótce albo zapisz się do newslettera – damy znać o obniżkach jako pierwszym." }} />
  );
}
