import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Boxes, Clock, Mail, MapPin, Phone, Store, Truck } from "lucide-react";
import { Newsletter } from "./Newsletter";
import { CookieSettingsLink } from "./CookieConsent";
import { BrandMark, type MarkName } from "./checkout/BrandMarks";

const columns: { title: string; links: [string, string][] }[] = [
  {
    title: "Strefa klienta",
    links: [
      ["Dostawa i płatności", "/dostawa-i-platnosci"], ["Czas realizacji", "/czas-realizacji"], ["Zwroty i reklamacje", "/zwroty-i-reklamacje"],
      ["Najczęstsze pytania (FAQ)", "/faq"], ["Regulamin sklepu", "/regulamin"], ["Polityka prywatności", "/polityka-prywatnosci"], ["Polityka cookies", "/polityka-cookies"],
    ],
  },
  {
    title: "Zakupy",
    links: [["Promocje", "/promocje"], ["Bestsellery", "/bestsellery"], ["Nowości", "/nowosci"], ["Marki", "/marki"], ["Blog i przewodniki", "/blog"], ["Ulubione", "/ulubione"]],
  },
  {
    title: "Sklep Sonax",
    links: [["O nas", "/o-nas"], ["Sklep stacjonarny", "/o-nas#sklep"], ["Dla firm (B2B)", "/b2b"], ["Moje konto", "/konto"], ["Kontakt", "/kontakt"]],
  },
];

const marks: MarkName[] = ["blik", "p24", "inpost-paczkomat", "inpost-kurier", "orlen"];

export function Footer({ productCount }: { productCount: number }) {
  const badges = [
    { icon: BadgeCheck, title: "Oryginalne produkty", text: "SONAX i sprawdzone marki" },
    { icon: Store, title: "Sklep w Białymstoku", text: "odbiór osobisty i doradztwo" },
    { icon: Boxes, title: `${productCount.toLocaleString("pl-PL")} produktów`, text: "do mycia, polerowania i ochrony" },
    { icon: Truck, title: "InPost i ORLEN Paczka", text: "zwykle w 1 dzień roboczy" },
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
      <div className="carbon text-brand-200">
        <div className="mx-auto grid max-w-shop gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Image src="/sonax/logo.png" alt="Sonax Polska" width={300} height={91} className="h-12 w-auto" />
            <p className="mt-3 text-sm leading-relaxed">Chemia samochodowa i kosmetyki detailingowe SONAX oraz sprawdzonych marek. Sklep stacjonarny w Białymstoku i wysyłka w całej Polsce.</p>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-lime" /> ul. Gen. Wł. Andersa 40, 15-113 Białystok</li>
              <li className="flex gap-2"><Clock className="h-4 w-4 shrink-0 text-lime" /> Pn–Pt 8:00–16:00</li>
              <li><a href="tel:+48500021705" className="flex gap-2 hover:text-white"><Phone className="h-4 w-4 text-lime" /> +48 500 021 705</a></li>
              <li><a href="mailto:aukcje@sonax.bialystok.pl" className="flex gap-2 hover:text-white"><Mail className="h-4 w-4 text-lime" /> aukcje@sonax.bialystok.pl</a></li>
            </ul>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <p className="font-display mb-4 text-lg font-extrabold tracking-wide text-white uppercase italic">{c.title}</p>
              <ul className="space-y-2 text-sm">
                {c.links.map(([l, href]) => <li key={href}><Link href={href} className="transition hover:text-white hover:underline">{l}</Link></li>)}
                {c.title === "Strefa klienta" && (
                  <>
                    <li><a href="mailto:aukcje@sonax.bialystok.pl?subject=Dane%20osobowe%20(RODO)" className="transition hover:text-white hover:underline">Kontakt w sprawach RODO</a></li>
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
            <span className="text-xs">© {new Date().getFullYear()} KENOCHEM Kuczyński Sp. J. – właściciel sklepu sonax.sklep.pl · NIP 5423224790</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
