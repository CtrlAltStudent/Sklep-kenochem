import { createElement } from "react";
import Image from "next/image";
import { RichText, type JSXConvertersFunction } from "@payloadcms/richtext-lexical/react";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { headingId, nodeText } from "@/lib/cms";
import { mediaPath } from "@/lib/data";
import type { Media } from "@/payload-types";

// Treść z edytora panelu. Nagłówki dostają kotwice (#id) dla spisu treści.
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  heading: ({ node, nodesToJSX }) =>
    createElement(
      node.tag,
      { id: headingId(nodeText(node as never)), className: "scroll-mt-40" },
      nodesToJSX({ nodes: node.children }),
    ),
  upload: ({ node }) => {
    const m = node.value as Media | number;
    if (typeof m !== "object" || !m?.url || !m.mimeType?.startsWith("image/")) return null;
    return (
      <Image
        src={mediaPath(m.url)!}
        alt={m.alt ?? ""}
        width={m.width ?? 1200}
        height={m.height ?? 675}
        sizes="(min-width: 1024px) 800px, 100vw"
        className="h-auto w-full rounded-2xl"
      />
    );
  },
});

export function RichContent({ data, className = "" }: { data: unknown; className?: string }) {
  if (!data) return null;
  return (
    <RichText
      data={data as SerializedEditorState}
      converters={converters}
      className={`prose prose-slate max-w-none prose-headings:font-extrabold prose-headings:text-navy prose-h2:mt-12 prose-h2:border-b prose-h2:border-brand-100 prose-h2:pb-3 prose-h2:text-2xl prose-h3:text-lg prose-a:font-semibold prose-a:text-accent-dark prose-strong:text-ink prose-li:my-1 prose-li:marker:text-accent ${className}`}
    />
  );
}
