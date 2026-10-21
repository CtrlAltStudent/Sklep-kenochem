"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useStore } from "@/lib/store";
import { ProductCard } from "@/components/ProductCard";

export default function WishlistPage() {
  const { wishlist } = useStore();
  return (
    <div className="mx-auto max-w-shop px-4 pt-8">
      <h1 className="mb-8 text-3xl font-black">Ulubione <span className="text-lg font-medium text-slate-400">({wishlist.length})</span></h1>
      {wishlist.length === 0 ? (
        <div className="rounded-3xl bg-white p-14 text-center ring-1 ring-brand-100">
          <Heart className="mx-auto h-12 w-12 text-brand-200" />
          <p className="mt-4 font-semibold">Nie masz jeszcze ulubionych produktów</p>
          <p className="text-sm text-slate-500">Kliknij serduszko na produkcie, aby go zapisać.</p>
          <Link href="/" className="mt-6 inline-block rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white">Przeglądaj sklep</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {wishlist.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      )}
    </div>
  );
}
