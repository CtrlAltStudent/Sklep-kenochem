import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Ścieżka" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
      <Link href="/" className="hover:text-brand-900"><Home className="h-4 w-4" /></Link>
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          {it.href ? <Link href={it.href} className="hover:text-brand-900">{it.label}</Link> : <span className="text-ink">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}
