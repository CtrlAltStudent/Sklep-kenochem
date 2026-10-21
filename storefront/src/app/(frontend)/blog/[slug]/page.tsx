import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { getPost, getPosts, headingsOf, linkedProductSlugs, postDate, postTagLabel } from "@/lib/cms";
import { getProduct } from "@/lib/catalog";
import { mediaPath, toCard } from "@/lib/data";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LegalToc } from "@/components/LegalToc";
import { ProductCard } from "@/components/ProductCard";
import { RichContent } from "@/components/RichContent";
import type { Media, Product } from "@/payload-types";

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getPost(decodeURIComponent((await props.params).slug));
  if (!post) return {};
  const cover = typeof post.cover === "object" ? (post.cover as Media | null) : null;
  return {
    title: post.seo?.title || post.title,
    description: post.seo?.description ?? post.excerpt ?? undefined,
    robots: post.seo?.noindex ? { index: false } : undefined,
    openGraph: { type: "article", publishedTime: post.publishedAt ?? undefined, images: cover?.url ? [cover.url] : undefined },
  };
}

export default async function PostPage(props: PageProps<"/blog/[slug]">) {
  const post = await getPost(decodeURIComponent((await props.params).slug));
  if (!post) notFound();

  const cover = typeof post.cover === "object" ? (post.cover as Media | null) : null;
  // Wpisy mają sekcje jako H2 albo – przeniesione z WordPressa – jako H3
  let headings = headingsOf(post.content, ["h2"]);
  if (headings.length < 2) headings = headingsOf(post.content, ["h3"]).map((h) => ({ ...h, level: 2 as const }));

  const chosen = (post.relatedProducts ?? []).map((p) => (typeof p === "object" ? (p as Product).slug : null));
  const slugs = [...new Set([...chosen, ...linkedProductSlugs(post.content)].filter(Boolean) as string[])];
  const products = (await Promise.all(slugs.map(getProduct))).filter((p) => p !== undefined).slice(0, 8);
  const more = (await getPosts()).filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />

      <header className="mt-4 grid items-center gap-8 overflow-hidden rounded-3xl bg-navy text-white lg:grid-cols-2">
        <div className="p-6 sm:p-10">
          <p className="flex items-center gap-3 text-xs">
            <span className="rounded-full bg-accent px-2.5 py-0.5 font-bold tracking-wide uppercase">{postTagLabel[post.tag ?? ""] ?? "Blog"}</span>
            <span className="flex items-center gap-1 text-white/70"><CalendarDays className="h-3.5 w-3.5" /> {postDate(post.publishedAt)}</span>
          </p>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-white/75">{post.excerpt}</p>}
        </div>
        {cover?.url && (
          <div className="relative aspect-[16/10] h-full w-full lg:aspect-auto lg:min-h-80">
            <Image src={mediaPath(cover.url)!} alt={cover.alt ?? post.title} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        )}
      </header>

      <div className={`mt-10 grid gap-10 ${headings.length > 1 ? "lg:grid-cols-[280px_1fr]" : ""}`}>
        {headings.length > 1 && (
          <aside className="hidden lg:sticky lg:top-40 lg:block lg:self-start">
            <LegalToc headings={headings} print={false} />
          </aside>
        )}
        <article className="min-w-0 rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:p-10">
          <RichContent data={post.content} className="prose-img:rounded-2xl" />
        </article>
      </div>

      {products.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-2xl font-extrabold">Produkty z artykułu</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.slug} product={toCard(p)} />)}
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold">Czytaj dalej</h2>
            <Link href="/blog" className="flex items-center gap-1 text-sm font-semibold text-accent-dark hover:underline"><ArrowLeft className="h-4 w-4" /> Wszystkie wpisy</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {more.map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="rounded-2xl bg-white p-5 ring-1 ring-brand-100 transition hover:shadow-lg">
                <p className="text-xs text-slate-400">{postDate(p.publishedAt)}</p>
                <h3 className="mt-1 font-bold leading-snug">{p.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
