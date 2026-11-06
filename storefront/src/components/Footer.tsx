import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Boxes, Clock, Mail, MapPin, Phone, Store, Truck } from "lucide-react";
import { Newsletter } from "./Newsletter";
import { CookieSettingsLink } from "./CookieConsent";
import { BrandMark, type MarkName } from "./checkout/BrandMarks";
import { SHOP_PHONE, shopTel } from "@/lib/data";

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

export type SocialLink = { href: string; label: string; name: "facebook" | "instagram" | "youtube" };

function SocialIcon({ name }: { name: SocialLink["name"] }) {
  if (name === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M14.5 8.5V6.8c0-.7.5-1.1 1.2-1.1h1.3V3h-2.2C12.2 3 11 4.4 11 6.6v1.9H9V11h2v9h3v-9h2.1l.4-2.5H14.5z" />
      </svg>
    );
  }
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current">
        <rect x="4" y="4" width="16" height="16" rx="5" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.6" strokeWidth="1.8" />
        <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M22 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C18.2 5.4 12 5.4 12 5.4s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 9 2 12.2 2 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6zM10.2 15.4V9l5.2 3.2-5.2 3.2z" />
    </svg>
  );
}

export function Footer({ productCount, phone = SHOP_PHONE, social = [] }: { productCount: number; phone?: string; social?: SocialLink[] }) {
  const badges = [
    { icon: BadgeCheck, title: "Oryginalne produkty", text: "SONAX i sprawdzone marki" },
    { icon: Store, title: "Sklep w Białymstoku", text: "odbiór osobisty i doradztwo" },
    { icon: Boxes, title: `${productCount.toLocaleString("pl-PL")} produktów`, text: "do mycia, polerowania i ochrony" },
    { icon: Truck, title: "InPost i ORLEN Paczka", text: "wysyłka 24h" },
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
              <li><a href={shopTel(phone)} className="flex gap-2 hover:text-white"><Phone className="h-4 w-4 text-lime" /> {phone}</a></li>
              <li><a href="mailto:aukcje@sonax.bialystok.pl" className="flex gap-2 hover:text-white"><Mail className="h-4 w-4 text-lime" /> aukcje@sonax.bialystok.pl</a></li>
            </ul>
            {social.length > 0 && (
              <ul className="mt-4 flex gap-2">
                {social.map((s) => (
                  <li key={s.name}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/80 transition hover:border-lime hover:text-lime">
                      <SocialIcon name={s.name} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
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
