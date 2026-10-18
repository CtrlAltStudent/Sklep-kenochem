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

export function extractHeadings(page: Page) {
  const out: { id: string; text: string; level: 2 | 3 }[] = [];
  for (const block of page.layout ?? []) {
    if (block.blockType !== "richText") continue;
    const root = (block.content as { root?: LexNode } | null | undefined)?.root;
    for (const n of root?.children ?? []) {
      if (n.type === "heading" && (n.tag === "h2" || n.tag === "h3")) {
        const text = nodeText(n).trim();
        if (text) out.push({ id: headingId(text), text, level: n.tag === "h2" ? 2 : 3 });
      }
    }
  }
  return out;
}

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
