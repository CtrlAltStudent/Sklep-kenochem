import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPosts, postDate, postTagLabel as tagLabel } from "@/lib/cms";
import { mediaPath } from "@/lib/data";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { Media } from "@/payload-types";

export const metadata: Metadata = {
  title: "Blog i przewodniki detailingowe",
  description: "Poradniki mycia, polerowania i ochrony auta oraz przewodniki zakupowe – co kupić do detailingu i jak tego używać.",
};

export default async function BlogPage() {
  const posts = await getPosts();
  const guides = posts.filter((p) => p.tag === "poradnik");
  const articles = posts.filter((p) => p.tag !== "poradnik");

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: "Blog" }]} />
      <h1 className="mt-4 text-4xl font-black tracking-tight">Blog i przewodniki</h1>
      <p className="mt-2 max-w-2xl text-slate-500">Jak myć, polerować i chronić auto – oraz co kupić, żeby nie przepłacić.</p>

      {guides.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-extrabold">Przewodniki zakupowe</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {guides.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group flex flex-col rounded-2xl bg-navy p-5 text-white transition hover:-translate-y-0.5 hover:shadow-xl">
                <span className="text-[11px] font-bold tracking-wider text-accent uppercase">Przewodnik</span>
                <h3 className="mt-2 font-bold leading-snug">{p.title}</h3>
                <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-semibold text-white/80 group-hover:text-white">Czytaj <ArrowRight className="h-4 w-4" /></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-extrabold">Artykuły</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((p) => {
            const cover = typeof p.cover === "object" ? (p.cover as Media | null) : null;
            const src = mediaPath(cover?.sizes?.card?.url ?? cover?.url);
            return (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group overflow-hidden rounded-2xl bg-white ring-1 ring-brand-100 transition hover:shadow-lg">
                <div className="relative aspect-[16/9] bg-slate-100">
                  {src && <Image src={src} alt={cover?.alt ?? p.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-semibold text-accent-dark">{tagLabel[p.tag ?? ""] ?? "Blog"}</span>
                    <time className="text-slate-400">{postDate(p.publishedAt)}</time>
                  </div>
                  <h3 className="mt-2 text-lg font-bold leading-snug group-hover:text-brand-700">{p.title}</h3>
                  {p.excerpt && <p className="mt-1 line-clamp-3 text-sm text-slate-500">{p.excerpt}</p>}
                </div>
              </Link>
            );
          })}
        </div>
        {!posts.length && <p className="text-slate-500">Wkrótce pierwsze artykuły.</p>}
      </section>
    </div>
  );
}
