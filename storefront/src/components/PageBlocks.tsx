// Bloki stron z panelu (Treści → Strony → „Zawartość strony”): baner, tekst, obraz + tekst, siatka produktów, FAQ.
// Kolejne bloki tekstowe łączymy w jedną białą kartę, reszta zajmuje pełną szerokość.

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { mediaPath, toCard } from "@/lib/data";
import { getProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/home/HomeBits";
import { RichContent } from "@/components/RichContent";
import type { Media, Page } from "@/payload-types";

type Block = NonNullable<Page["layout"]>[number];
const img = (m: unknown, size: "banner" | "card" = "banner") => {
  const media = typeof m === "object" && m ? (m as Media) : null;
  return mediaPath(media?.sizes?.[size]?.url ?? media?.url);
};
const idOf = (v: unknown) => String(typeof v === "object" && v ? (v as { id: unknown }).id : v ?? "");

function Hero({ b }: { b: Extract<Block, { blockType: "hero" }> }) {
  const src = img(b.image);
  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-navy text-white">
      {src && <Image src={src} alt="" fill sizes="(min-width: 1280px) 1200px, 100vw" className="-z-10 object-cover" />}
      {(b.title || b.text) && <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/70 to-transparent" />}
      <div className={`max-w-xl px-6 sm:px-10 ${b.title || b.text ? "py-12 sm:py-16" : "py-24 sm:py-32"}`}>
        {b.title && <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{b.title}</h2>}
        {b.text && <p className="mt-3 text-white/80 sm:text-lg">{b.text}</p>}
        {b.ctaLabel && b.ctaLink && (
          <Link href={b.ctaLink} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white hover:bg-accent-dark">
            {b.ctaLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  );
}

function ImageText({ b }: { b: Extract<Block, { blockType: "imageText" }> }) {
  const src = img(b.image, "card");
  return (
    <section className="grid overflow-hidden rounded-3xl bg-white ring-1 ring-brand-100 lg:grid-cols-2">
      <div className={`relative min-h-[240px] bg-brand-50 ${b.imageRight ? "lg:order-2" : ""}`}>
        {src && <Image src={src} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />}
      </div>
      <div className="p-6 sm:p-10"><RichContent data={b.content} /></div>
    </section>
  );
}

async function Products({ b }: { b: Extract<Block, { blockType: "products" }> }) {
  const all = await getProducts();
  const picked = (b.products ?? []).map(idOf);
  const cat = typeof b.category === "object" && b.category ? b.category.slug : "";
  const list = picked.length
    ? picked.map((id) => all.find((p) => p.id === id)).filter((p) => p != null)
    : cat
      ? all.filter((p) => [p.category, p.subcategory, p.type].includes(cat)).sort((a, z) => Number(z.stock > 0) - Number(a.stock > 0))
      : [];
  if (!list.length) return null;
  return (
    <section>
      {b.title && <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{b.title}</h2>}
      <ProductGrid products={list.slice(0, b.limit || 8).map(toCard)} />
    </section>
  );
}

function Faq({ b }: { b: Extract<Block, { blockType: "faq" }> }) {
  return (
    <section className="divide-y divide-brand-100 rounded-3xl bg-white px-6 ring-1 ring-brand-100 sm:px-10">
      {(b.items ?? []).map((q) => (
        <details key={q.id ?? q.q} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-navy">
            {q.q} <ChevronDown className="h-5 w-5 shrink-0 text-accent transition group-open:rotate-180" />
          </summary>
          <p className="mt-3 leading-relaxed whitespace-pre-line text-slate-600">{q.a}</p>
        </details>
      ))}
    </section>
  );
}

export function PageBlocks({ blocks }: { blocks: Page["layout"] }) {
  // grupy: kolejne bloki „Tekst” w jednej karcie
  const groups: (Block | Block[])[] = [];
  for (const b of blocks ?? []) {
    const last = groups[groups.length - 1];
    if (b.blockType === "richText" && Array.isArray(last)) last.push(b);
    else groups.push(b.blockType === "richText" ? [b] : b);
  }
  return (
    <div className="space-y-10">
      {groups.map((g, i) => {
        if (Array.isArray(g))
          return (
            <article key={i} className="rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:p-10">
              {g.map((b, n) => b.blockType === "richText" && <RichContent key={b.id ?? n} data={b.content} />)}
            </article>
          );
        switch (g.blockType) {
          case "hero": return <Hero key={i} b={g} />;
          case "imageText": return <ImageText key={i} b={g} />;
          case "products": return <Products key={i} b={g} />;
          case "faq": return <Faq key={i} b={g} />;
          default: return null;
        }
      })}
    </div>
  );
}
