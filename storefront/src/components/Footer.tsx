import Image from "next/image";
import Link from "next/link";
import { CreditCard, Mail, MapPin, Phone, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { categories } from "@/lib/data";
import { Newsletter } from "./Newsletter";
import { CookieSettingsLink } from "./CookieConsent";

const perks = [
  { icon: Truck, title: "Darmowa dostawa", text: "dla zamówień od 399 zł" },
  { icon: RotateCcw, title: "14 dni na zwrot", text: "bez podawania przyczyny" },
  { icon: CreditCard, title: "Płatności online", text: "BLIK, karta, przelew" },
  { icon: ShieldCheck, title: "Faktura VAT", text: "przelew 14 dni dla instytucji" },
];

const accountLinks = [["Logowanie i rejestracja", "/konto"], ["Ulubione", "/ulubione"], ["Koszyk", "/koszyk"], ["Strefa B2B", "/b2b"]] as const;
const infoLinks = [
  ["O nas", "/informacje-o-sklepie"], ["Dostawa i płatności", "/dostawa-i-platnosci"], ["Regulamin", "/regulamin"],
  ["Zwroty i reklamacje", "/zwroty-i-reklamacje"], ["Polityka prywatności", "/polityka-prywatnosci"], ["Blog", "/blog"], ["Kontakt", "/kontakt"],
] as const;

export function Footer() {
  return (
    <footer className="mt-20">
      <div className="border-y border-brand-100 bg-white">
        <div className="mx-auto grid max-w-shop grid-cols-2 gap-6 px-4 py-8 lg:grid-cols-4">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-accent-dark"><Icon className="h-6 w-6" /></span>
              <div><p className="font-semibold">{title}</p><p className="text-sm text-slate-500">{text}</p></div>
            </div>
          ))}
        </div>
      </div>

      <Newsletter />

      <div className="bg-brand-900 text-brand-100">
        <div className="mx-auto grid max-w-shop gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="inline-block rounded-xl bg-white px-4 py-2"><Image src="/brand/logo-e1772107192548.webp" alt="Kenochem" width={420} height={139} className="h-10 w-auto" /></span>
            <p className="mt-3 text-sm leading-relaxed">Profesjonalna chemia samochodowa, myjniowa i obiektowa. Hurt i detal.</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-lime" /> ul. Gen. Wł. Andersa 40, Boks 16, 15-113 Białystok</li>
              <li><a href="tel:+48500021705" className="flex gap-2 hover:text-white"><Phone className="h-4 w-4 text-lime" /> +48 500 021 705</a></li>
              <li><a href="mailto:sklep@kenochem.com" className="flex gap-2 hover:text-white"><Mail className="h-4 w-4 text-lime" /> sklep@kenochem.com</a></li>
            </ul>
          </div>
          <div>
            <p className="mb-4 font-semibold text-white">Kategorie</p>
            <ul className="space-y-2 text-sm">
              {categories.map((c) => <li key={c.slug}><Link href={`/kategoria/${c.slug}`} className="hover:text-white">{c.name}</Link></li>)}
            </ul>
          </div>
          <div>
            <p className="mb-4 font-semibold text-white">Twoje konto</p>
            <ul className="space-y-2 text-sm">
              {accountLinks.map(([l, href]) => <li key={l}><Link href={href} className="hover:text-white">{l}</Link></li>)}
            </ul>
          </div>
          <div>
            <p className="mb-4 font-semibold text-white">Informacje</p>
            <ul className="space-y-2 text-sm">
              {infoLinks.map(([l, href]) => <li key={l}><Link href={href} className="hover:text-white">{l}</Link></li>)}
              <li><CookieSettingsLink /></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-shop flex-col items-center justify-between gap-3 px-4 py-5 text-xs sm:flex-row">
            <span>© 2026 KENOCHEM Kuczyński Sp. J. · NIP 5423224790 · Wszystkie prawa zastrzeżone.</span>
            <div className="flex gap-2">
              {["BLIK", "VISA", "Mastercard", "Przelewy24", "InPost"].map((p) => (
                <span key={p} className="rounded-md bg-white/10 px-2 py-1 font-semibold text-white">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
