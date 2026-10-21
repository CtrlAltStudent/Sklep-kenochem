import Link from "next/link";
import { Check } from "lucide-react";

const steps = [
  { label: "Koszyk", href: "/koszyk" },
  { label: "Dostawa i płatność", href: "/zamowienie" },
  { label: "Potwierdzenie" },
];

// Pasek kroków zamówienia: 1 Koszyk → 2 Dostawa i płatność → 3 Potwierdzenie
export function CheckoutSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="flex items-center gap-2 text-sm font-semibold sm:gap-3" aria-label="Kroki zamówienia">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const dot = (
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${done ? "bg-leaf text-white" : active ? "bg-kc-gradient text-white shadow-md shadow-leaf/30" : "bg-white text-slate-400 ring-1 ring-brand-100"}`}>
            {done ? <Check className="h-4 w-4" /> : i + 1}
          </span>
        );
        return (
          <li key={s.label} className="flex items-center gap-2 sm:gap-3">
            {done && s.href ? (
              <Link href={s.href} className="flex items-center gap-2 text-brand-800 hover:underline">{dot}<span className="hidden sm:inline">{s.label}</span></Link>
            ) : (
              <span className={`flex items-center gap-2 ${active ? "text-ink" : "text-slate-400"}`}>{dot}<span className={active ? "" : "hidden sm:inline"}>{s.label}</span></span>
            )}
            {i < steps.length - 1 && <span className={`h-0.5 w-6 rounded-full sm:w-12 ${done ? "bg-leaf" : "bg-brand-100"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
