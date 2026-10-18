import { Suspense } from "react";
import type { Metadata } from "next";
import { toCard } from "@/lib/data";
import { searchProducts } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Listing } from "@/components/Listing";

export const metadata: Metadata = { title: "Wyniki wyszukiwania" };

async function Results({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const { q } = params;
  const query = typeof q === "string" ? q : "";
  const results = (await searchProducts(query)).map(toCard);
  return (
    <>
      <h1 className="mt-4 mb-8 text-3xl font-black">
        Wyniki dla „{query}” <span className="text-lg font-medium text-slate-400">({results.length})</span>
      </h1>
      {results.length === 0 ? (
        <p className="rounded-2xl bg-white p-10 text-center text-slate-500 ring-1 ring-brand-100">Nic nie znaleźliśmy. Spróbuj innej frazy, np. „piana”, „felgi” lub „Tenzi”.</p>
      ) : (
        <Listing key={query} products={results} params={params} />
      )}
    </>
  );
}

export default function SearchPage(props: PageProps<"/szukaj">) {
  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: "Wyszukiwanie" }]} />
      <Suspense fallback={<div className="mt-4 h-96 animate-pulse rounded-2xl bg-white" />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
