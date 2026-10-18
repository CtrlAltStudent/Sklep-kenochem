import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Boxes, Clock, Flag, Mail, MapPin, Phone, Truck } from "lucide-react";
import { Newsletter } from "./Newsletter";
import { CookieSettingsLink } from "./CookieConsent";
import { BrandMark, type MarkName } from "./checkout/BrandMarks";

const columns: { title: string; links: [string, string][] }[] = [
  {
    title: "Strefa klienta",
    links: [
      ["Dostawa i płatności", "/dostawa-i-platnosci"], ["Zwroty i reklamacje", "/zwroty-i-reklamacje"], ["Najczęstsze pytania (FAQ)", "/faq"],
      ["Regulamin sklepu", "/regulamin"], ["Polityka prywatności", "/polityka-prywatnosci"],
    ],
  },
  {
    title: "Zakupy",
    links: [["Promocje", "/promocje"], ["Bestsellery", "/bestsellery"], ["Nowości", "/nowosci"], ["Marki", "/marki"], ["Poradniki", "/blog"], ["Ulubione", "/ulubione"]],
  },
  {
    title: "Kenochem",
    links: [["O nas", "/o-nas"], ["Sklep stacjonarny", "/o-nas#sklep"], ["Współpraca B2B", "/b2b"], ["Moje konto", "/konto"], ["Kontakt", "/kontakt"]],
  },
];

const marks: MarkName[] = ["blik", "p24", "inpost-paczkomat", "inpost-kurier", "orlen", "gls"];

export function Footer({ productCount }: { productCount: number }) {
  const badges = [
    { icon: BadgeCheck, title: "100% oryginalne produkty", text: "bezpośrednio od producentów" },
    { icon: Flag, title: "Polska firma", text: "z Białegostoku, od ponad 25 lat" },
    { icon: Boxes, title: `${(Math.floor(productCount / 100) / 10).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} tys. produktów`, text: "chemia, sprzęt i akcesoria" },
    { icon: Truck, title: "Wysyłka w 24 h", text: "darmowa dostawa od 399 zł" },
  ];
  return (
    <footer className="mt-20">
      <div className="border-y border-brand-100 bg-white">
        <div className="mx-auto grid max-w-shop grid-cols-2 gap-6 px-4 py-8 lg:grid-cols-4">
          {badges.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="bg-kc-gradient grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-md shadow-leaf/20"><Icon className="h-6 w-6" /></span>
              <div><p className="font-bold leading-tight">{title}</p><p className="text-sm text-slate-500">{text}</p></div>
            </div>
          ))}
        </div>
      </div>

      <Newsletter />

      <div className="kc-stripe" />
      <div className="bg-kc-gradient-deep text-brand-100">
        <div className="mx-auto grid max-w-shop gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <span className="inline-block rounded-xl bg-white px-4 py-2"><Image src="/brand/logo-e1772107192548.webp" alt="Kenochem" width={420} height={139} className="h-10 w-auto" /></span>
            <p className="mt-3 text-sm leading-relaxed">Hurtownia profesjonalnej chemii samochodowej, myjniowej i obiektowej. Hurt i detal, sklep stacjonarny w Białymstoku.</p>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-leaf-300" /> ul. Gen. Wł. Andersa 40, Boks 16, 15-113 Białystok</li>
              <li className="flex gap-2"><Clock className="h-4 w-4 shrink-0 text-leaf-300" /> Pn–Pt 8:00–16:00</li>
              <li><a href="tel:+48500021705" className="flex gap-2 hover:text-white"><Phone className="h-4 w-4 text-leaf-300" /> +48 500 021 705</a></li>
              <li><a href="mailto:sklep@kenochem.com" className="flex gap-2 hover:text-white"><Mail className="h-4 w-4 text-leaf-300" /> sklep@kenochem.com</a></li>
            </ul>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <p className="mb-4 font-bold text-white">{c.title}</p>
              <ul className="space-y-2 text-sm">
                {c.links.map(([l, href]) => <li key={href}><Link href={href} className="transition hover:text-white hover:underline">{l}</Link></li>)}
                {c.title === "Strefa klienta" && (
                  <>
                    <li><a href="mailto:sklep@kenochem.com?subject=Dane%20osobowe%20(RODO)" className="transition hover:text-white hover:underline">Kontakt w sprawach RODO</a></li>
                    <li><CookieSettingsLink /></li>
                  </>
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-shop flex-col gap-4 px-4 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-semibold text-white/60">Płatności i dostawa:</span>
              {marks.map((m) => <BrandMark key={m} name={m} />)}
            </div>
            <span className="text-xs">© {new Date().getFullYear()} KENOCHEM Kuczyński Sp. J. · NIP 5423224790 · Wszystkie prawa zastrzeżone.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
