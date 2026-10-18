import type { Metadata } from "next";
import { blogPosts } from "@/lib/data";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-6">
      <Breadcrumbs items={[{ label: "Blog" }]} />
      <h1 className="mt-4 mb-8 text-4xl font-black">Blog i poradniki</h1>
      <div className="space-y-4">
        {blogPosts.map((b) => (
          <article key={b.slug} className="rounded-2xl bg-white p-6 ring-1 ring-brand-100 transition hover:shadow-lg">
            <div className="flex items-center gap-3 text-xs">
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-semibold text-accent-dark">{b.tag}</span>
              <time className="text-slate-400">{new Date(b.date).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}</time>
            </div>
            <h2 className="mt-2 text-xl font-bold">{b.title}</h2>
            <p className="mt-1 text-slate-500">{b.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
