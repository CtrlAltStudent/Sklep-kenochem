import Image from "next/image";
import Link from "next/link";
import { CatIcon } from "@/components/CatIcon";
import type { Category } from "@/lib/data";
import { tileClasses, type TileStyle } from "@/lib/tileLayout";

export function CategoryTiles({ categories, counts, style, columns, showCount, showIcon }: {
  categories: Category[];
  counts: Record<string, number>;
  style: TileStyle;
  columns: 3 | 4;
  showCount: boolean;
  showIcon: boolean;
}) {
  const classes = tileClasses(categories.length, style, columns);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
      {categories.map((c, i) => (
        <Link key={c.slug} href={`/kategoria/${c.slug}`}
          className={`group relative isolate flex flex-col justify-end overflow-hidden rounded-2xl p-4 text-white sm:p-5 ${classes[i] ?? ""}`}>
          {c.image ? (
            <Image src={c.image} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="-z-10 object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <span className="absolute inset-0 -z-10" style={{ background: `linear-gradient(155deg, ${c.color} 0%, #142033 78%)` }} />
          )}
          <span className="absolute inset-0 -z-10 bg-gradient-to-t from-navy/90 via-navy/35 to-navy/10" />
          {showIcon && (
            <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur-sm lg:h-11 lg:w-11">
              <CatIcon name={c.lucide} className="h-5 w-5" />
            </span>
          )}
          <h3 className="text-base leading-tight font-extrabold sm:text-lg lg:text-xl">{c.name}</h3>
          {showCount && <p className="mt-1 text-xs text-white/75 sm:text-sm">{(counts[c.slug] ?? 0).toLocaleString("pl-PL")} produktów</p>}
        </Link>
      ))}
    </div>
  );
}
