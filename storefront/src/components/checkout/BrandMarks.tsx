// Plakietki przewoźników i płatności – jednakowy rozmiar, kolory marek.
// To uproszczone znaki zastępcze. Po otrzymaniu oficjalnych plików z pakietów dla sklepów
// (GLS, ORLEN Paczka, InPost, BLIK/Przelewy24) podmieniamy tu odpowiedni case na <img>.
import { Building2, Landmark, Truck, Wallet } from "lucide-react";

const box = "grid h-10 w-[68px] shrink-0 place-items-center overflow-hidden rounded-lg ring-1 ring-black/5";

export type MarkName = "orlen" | "inpost" | "gls" | "pickup" | "courier" | "blik" | "p24" | "transfer" | "deferred" | "cod";

// Przewoźnik / metoda z kodu ustawionego w panelu (Ustawienia sklepu → Dostawa)
export const carrierFromCode = (code: string): MarkName =>
  code.startsWith("orlen") ? "orlen" : code.startsWith("inpost") ? "inpost" : code.startsWith("gls") ? "gls" : code.startsWith("pickup") || code.startsWith("odbior") ? "pickup" : "courier";

export function BrandMark({ name }: { name: MarkName }) {
  switch (name) {
    case "orlen":
      return (
        <span className={`${box} bg-[#e30613]`} title="ORLEN Paczka">
          <span className="text-center text-[9px] leading-[1.05] font-black tracking-tight text-white uppercase">Orlen<br />Paczka</span>
        </span>
      );
    case "inpost":
      return (
        <span className={`${box} bg-[#ffcd00]`} title="InPost">
          <span className="text-[13px] font-black tracking-tight text-[#1d1d1b]">InPost</span>
        </span>
      );
    case "gls":
      return (
        <span className={`${box} bg-[#061ab1]`} title="GLS">
          <span className="text-[17px] font-black tracking-tight text-[#ffd100]">GLS</span>
        </span>
      );
    case "blik":
      return (
        <span className={`${box} bg-black`} title="BLIK">
          <span className="flex items-center gap-[3px] text-[16px] font-black tracking-tight text-white lowercase">
            blik<span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-[#ff0058] to-[#ff9100]" />
          </span>
        </span>
      );
    case "p24":
      return (
        <span className={`${box} bg-white`} title="Przelewy24">
          <span className="text-[11px] font-black tracking-tight text-[#2b2b2b]">Przelewy<span className="text-[#d13239]">24</span></span>
        </span>
      );
    case "pickup":
      return <span className={`${box} bg-brand-50 text-brand-700`}><Building2 className="h-5 w-5" /></span>;
    case "transfer":
      return <span className={`${box} bg-slate-100 text-slate-700`}><Landmark className="h-5 w-5" /></span>;
    case "deferred":
      return <span className={`${box} bg-brand-50 text-brand-700`}><Wallet className="h-5 w-5" /></span>;
    case "cod":
      return <span className={`${box} bg-amber-50 text-amber-700`}><Wallet className="h-5 w-5" /></span>;
    default:
      return <span className={`${box} bg-slate-100 text-slate-700`}><Truck className="h-5 w-5" /></span>;
  }
}
