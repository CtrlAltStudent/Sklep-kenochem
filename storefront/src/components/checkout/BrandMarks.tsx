// Logotypy przewoźników i płatności w jednakowych, białych plakietkach.
// Oryginalne pliki z oficjalnych stron „do pobrania”: GLS (gls-group.com/PL/pl/logo), InPost (inpost.pl/do-pobrania),
// ORLEN Paczka (orlenpaczka.pl/do-pobrania), Przelewy24 (przelewy24.pl/do-pobrania), BLIK (blik.com/dokumentacja).
// Logotypów nie modyfikujemy – tylko skalujemy w obrębie plakietki.
import Image from "next/image";
import { Building2, Landmark, Truck, Wallet } from "lucide-react";

export type MarkName = "orlen" | "inpost-paczkomat" | "inpost-kurier" | "gls" | "pickup" | "courier" | "blik" | "p24" | "transfer" | "deferred" | "cod";

const logos: Partial<Record<MarkName, { src: string; alt: string; pad: string }>> = {
  orlen: { src: "/marks/orlen-paczka.png", alt: "ORLEN Paczka", pad: "p-[3px]" },
  "inpost-paczkomat": { src: "/marks/inpost-paczkomat.svg", alt: "InPost Paczkomat 24/7", pad: "p-[3px]" },
  "inpost-kurier": { src: "/marks/inpost-kurier.svg", alt: "InPost Kurier", pad: "p-[3px]" },
  gls: { src: "/marks/gls.svg", alt: "GLS", pad: "px-3 py-3" },
  blik: { src: "/marks/blik.svg", alt: "BLIK", pad: "px-2 py-1.5" },
  p24: { src: "/marks/przelewy24.svg", alt: "Przelewy24", pad: "px-1.5 py-2" },
};

const box = "relative grid h-12 w-[84px] shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-black/[0.07]";

// Przewoźnik z kodu metody ustawionego w panelu (Ustawienia sklepu → Dostawa)
export const carrierFromCode = (code: string): MarkName =>
  code.startsWith("orlen") ? "orlen"
    : code.startsWith("inpost-paczkomat") ? "inpost-paczkomat"
    : code.startsWith("inpost") ? "inpost-kurier"
    : code.startsWith("gls") ? "gls"
    : code.startsWith("pickup") || code.startsWith("odbior") ? "pickup"
    : "courier";

export function BrandMark({ name }: { name: MarkName }) {
  const logo = logos[name];
  if (logo) {
    return (
      <span className={box} title={logo.alt}>
        <span className={`absolute inset-0 ${logo.pad}`}>
          <span className="relative block h-full w-full">
            <Image src={logo.src} alt={logo.alt} fill sizes="84px" unoptimized className="object-contain" />
          </span>
        </span>
      </span>
    );
  }
  const Icon = name === "pickup" ? Building2 : name === "transfer" ? Landmark : name === "deferred" || name === "cod" ? Wallet : Truck;
  const tone = name === "cod" ? "bg-amber-50 text-amber-700" : name === "pickup" || name === "deferred" ? "bg-leaf-50 text-brand-700" : "bg-slate-50 text-slate-600";
  return <span className={`${box} ${tone}`}><Icon className="h-5 w-5" /></span>;
}
