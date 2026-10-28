// Dostęp sklepu do danych z panelu (Payload Local API – bez zapytań HTTP).
import "server-only";
import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Page } from "@/payload-types";

export const getCms = cache(() => getPayload({ config }));

export const getPage = cache(async (slug: string) => {
  const payload = await getCms();
  const { docs } = await payload.find({ collection: "pages", where: { slug: { equals: slug } }, limit: 1, depth: 1 });
  return docs[0] as Page | undefined;
});

export const getStoreSettings = cache(async () => (await getCms()).findGlobal({ slug: "store-settings" }));
export const getHomepage = cache(async () => (await getCms()).findGlobal({ slug: "homepage", depth: 1 }).catch(() => null));
export const getNavigation = cache(async () => (await getCms()).findGlobal({ slug: "navigation", depth: 0 }).catch(() => null));

export const getFooterPages = cache(async () => {
  const payload = await getCms();
  const { docs } = await payload.find({ collection: "pages", where: { showInFooter: { equals: true } }, limit: 20, depth: 0, select: { title: true, slug: true } });
  return docs;
});

// Nagłówki h2/h3 z treści edytora – do spisu treści dokumentów prawnych
type LexNode = { type?: string; tag?: string; text?: string; children?: LexNode[] };
export const nodeText = (n: LexNode): string => n.text ?? (n.children ?? []).map(nodeText).join("");
export const headingId = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export function headingsOf(content: unknown, levels: string[] = ["h2", "h3"]) {
  const out: { id: string; text: string; level: 2 | 3 }[] = [];
  const root = (content as { root?: LexNode } | null | undefined)?.root;
  for (const n of root?.children ?? []) {
    if (n.type === "heading" && n.tag && levels.includes(n.tag)) {
      const text = nodeText(n).trim();
      if (text) out.push({ id: headingId(text), text, level: n.tag === "h2" ? 2 : 3 });
    }
  }
  return out;
}

export function extractHeadings(page: Page) {
  return (page.layout ?? []).flatMap((block) => (block.blockType === "richText" ? headingsOf(block.content) : []));
}

export const postTagLabel: Record<string, string> = { poradnik: "Przewodnik zakupowy", detailing: "Detailing", myjnie: "Myjnie", dom: "Dom i ogród", biznes: "Biznes" };
export const postDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }) : "");

// Adresy produktów podlinkowanych w treści (/produkt/<slug>) – do sekcji „Produkty z artykułu”
export function linkedProductSlugs(content: unknown) {
  const out = new Set<string>();
  const walk = (n: { type?: string; fields?: { url?: string }; children?: unknown[] }) => {
    const m = n.type === "link" || n.type === "autolink" ? n.fields?.url?.match(/^\/produkt\/([^/?#]+)/) : null;
    if (m) out.add(decodeURIComponent(m[1]));
    (n.children as (typeof n)[] | undefined)?.forEach(walk);
  };
  walk((content as { root?: never } | null)?.root ?? {});
  return [...out];
}

// Blog: opublikowane wpisy, najnowsze najpierw
export const getPosts = cache(async () => {
  const payload = await getCms();
  const { docs } = await payload.find({
    collection: "posts", where: { _status: { equals: "published" } }, sort: "-publishedAt", limit: 100, depth: 1,
    select: { title: true, slug: true, excerpt: true, cover: true, tag: true, publishedAt: true, updatedAt: true },
  });
  return docs;
});

export const getPost = cache(async (slug: string) => {
  const payload = await getCms();
  const { docs } = await payload.find({ collection: "posts", where: { and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }] }, limit: 1, depth: 2 });
  return docs[0];
});

// Przekierowania 301/302 zdefiniowane w panelu (Ustawienia → Przekierowania)
export const findRedirect = cache(async (path: string) => {
  const payload = await getCms();
  const normalized = path.length > 1 ? path.replace(/\/+$/, "") : path;
  const { docs } = await payload.find({ collection: "redirects", where: { and: [{ from: { equals: normalized } }, { active: { equals: true } }] }, limit: 1, depth: 0 });
  return docs[0];
});

// Opublikowane opinie o produkcie (slug produktu wspólny dla katalogu i panelu)
export const getReviews = cache(async (productSlug: string) => {
  const payload = await getCms();
  const product = (await payload.find({ collection: "products", where: { slug: { equals: productSlug } }, limit: 1, depth: 0, select: { slug: true } })).docs[0];
  if (!product) return { reviews: [], average: 0, count: 0, histogram: [0, 0, 0, 0, 0] };
  const { docs } = await payload.find({
    collection: "reviews", where: { and: [{ product: { equals: product.id } }, { status: { equals: "approved" } }] },
    limit: 50, depth: 0, sort: "-createdAt", overrideAccess: false,
  });
  const histogram = [0, 0, 0, 0, 0];
  for (const r of docs) histogram[5 - r.rating]++;
  const average = docs.length ? docs.reduce((s, r) => s + r.rating, 0) / docs.length : 0;
  return { reviews: docs, average, count: docs.length, histogram };
});

// Najnowsze zatwierdzone opinie (4–5★) do sekcji „Opinie klientów” na stronie głównej + średnia ze wszystkich
export const getLatestReviews = cache(async () => {
  const payload = await getCms();
  const [{ docs }, all] = await Promise.all([
    payload.find({
      collection: "reviews", where: { and: [{ status: { equals: "approved" } }, { rating: { greater_than_equal: 4 } }] },
      limit: 6, depth: 1, sort: "-createdAt", overrideAccess: false,
    }),
    payload.find({ collection: "reviews", where: { status: { equals: "approved" } }, limit: 0, pagination: false, depth: 0, select: { rating: true }, overrideAccess: false }),
  ]);
  const count = all.docs.length;
  const average = count ? all.docs.reduce((s, r) => s + r.rating, 0) / count : 0;
  return {
    count, average,
    reviews: docs.map((r) => ({
      id: r.id, rating: r.rating, title: r.title, content: r.content, author: r.author, verified: Boolean(r.verified), createdAt: r.createdAt,
      product: typeof r.product === "object" && r.product ? { name: r.product.name, slug: r.product.slug ?? "" } : undefined,
    })),
  };
});
