import { notFound, permanentRedirect, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { extractHeadings, findRedirect, getPage } from "@/lib/cms";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LegalToc } from "@/components/LegalToc";
import { RichContent } from "@/components/RichContent";

// Wszystkie adresy, które nie pasują do innych stron sklepu:
//  1) strona z panelu (Treści → Strony) – np. /regulamin
//  2) przekierowanie z panelu (Ustawienia → Przekierowania) – np. stare adresy WooCommerce
//  3) w przeciwnym razie 404
const pageSlug = (path: string[]) => (path.length === 1 ? decodeURIComponent(path[0]) : null);

export async function generateMetadata(props: PageProps<"/[...path]">): Promise<Metadata> {
  const slug = pageSlug((await props.params).path);
  const page = slug ? await getPage(slug) : undefined;
  if (!page) return {};
  return {
    title: page.seo?.title?.replace(/ \| (Kenochem|Sklep Sonax)$/, "") || page.title,
    description: page.seo?.description ?? page.intro ?? undefined,
    robots: page.seo?.noindex ? { index: false } : undefined,
  };
}

export default async function CmsPage(props: PageProps<"/[...path]">) {
  const { path } = await props.params;
  const slug = pageSlug(path);
  const page = slug ? await getPage(slug) : undefined;
  if (!page || page._status !== "published") {
    const r = await findRedirect(`/${path.map(decodeURIComponent).join("/")}`);
    if (r) (r.permanent ? permanentRedirect : redirect)(r.to);
    notFound();
  }

  const legal = page.template === "legal";
  const headings = legal ? extractHeadings(page) : [];
  const updated = new Date(page.updatedAt).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: page.title }]} />

      <header className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 px-6 py-10 text-white sm:px-10 sm:py-14">
        <svg className="absolute -top-16 -right-10 h-72 w-72 text-white/5" viewBox="0 0 100 100" aria-hidden>
          <path d="M50 5 C80 20 95 50 50 95 C5 50 20 20 50 5Z" fill="currentColor" />
        </svg>
        <div className="relative max-w-3xl">
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{page.title}</h1>
          {page.intro && <p className="mt-4 text-lg text-brand-100">{page.intro}</p>}
          {legal && (
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm ring-1 ring-white/20">
              <CalendarDays className="h-4 w-4 text-lime" /> Ostatnia aktualizacja: {updated}
            </p>
          )}
        </div>
      </header>

      <div className={`mt-10 grid gap-10 ${legal && headings.length ? "lg:grid-cols-[300px_1fr]" : ""}`}>
        {legal && headings.length > 0 && (
          <aside className="print:hidden lg:sticky lg:top-40 lg:self-start">
            <LegalToc headings={headings} />
          </aside>
        )}
        <article className="min-w-0 rounded-3xl bg-white p-6 ring-1 ring-brand-100 sm:p-10 print:p-0 print:ring-0">
          {(page.layout ?? []).map((block, i) =>
            block.blockType === "richText" ? <RichContent key={block.id ?? i} data={block.content} className={legal ? "prose-p:text-[15px] prose-li:text-[15px]" : ""} /> : null,
          )}
        </article>
      </div>
    </div>
  );
}
