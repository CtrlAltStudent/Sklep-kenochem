import type { Metadata } from "next";
import { toCard } from "@/lib/data";
import { getCategoryCounts, getNewest } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Listing } from "@/components/Listing";

export const metadata: Metadata = { title: "Nowości" };

export default async function NewPage() {
  const [newest, counts] = await Promise.all([getNewest(), getCategoryCounts()]);
  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: "Nowości" }]} />
      <div className="mt-4 mb-8 rounded-3xl bg-gradient-to-r from-brand-700 to-accent p-8 text-white">
        <h1 className="text-3xl font-black sm:text-4xl">Nowości w ofercie</h1>
        <p className="mt-1 text-white/90">Najnowsze produkty dodane do sklepu.</p>
      </div>
      <Listing products={newest.map(toCard)} counts={counts} />
    </div>
  );
}
