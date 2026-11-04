import type { CollectionAfterChangeHook } from "payload";

// Zmiana adresu (slug) zostawia przekierowanie ze starego. Inaczej link z Google prowadzi w pustkę.
export function rememberOldAddress(prefix: string): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, req, operation }) => {
    if (operation !== "update") return doc;
    const oldSlug = typeof previousDoc?.slug === "string" ? previousDoc.slug : "";
    const slug = typeof doc?.slug === "string" ? doc.slug : "";
    if (!oldSlug || !slug || oldSlug === slug) return doc;
    const from = `${prefix}${oldSlug}`.replace(/\/+$/, "") || "/";
    const to = `${prefix}${slug}`.replace(/\/+$/, "") || "/";
    if (from === to) return doc;
    const existing = await req.payload.find({ collection: "redirects", where: { from: { equals: from } }, limit: 1, depth: 0, overrideAccess: true });
    const data = { from, to, permanent: true, active: true };
    if (existing.docs[0]) await req.payload.update({ collection: "redirects", id: existing.docs[0].id, data, overrideAccess: true, req });
    else await req.payload.create({ collection: "redirects", data, overrideAccess: true, req });
    return doc;
  };
}
