import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, MessageCircleQuestion, Phone } from "lucide-react";
import { formatPrice, freeShippingFrom } from "@/lib/data";
import { getStoreSettings } from "@/lib/cms";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Najczęstsze pytania (FAQ)",
  description: "Odpowiedzi na najczęstsze pytania: dostawa InPost i ORLEN Paczka, płatności, zwroty, faktury VAT i karty charakterystyki w sklepie Sonax.",
};

export default async function FaqPage() {
  const s = await getStoreSettings();
  const free = formatPrice(freeShippingFrom(s));
  const hours = s.hours ?? "Pn–Pt 8:00–16:00";

  const groups: { title: string; items: [string, React.ReactNode, string][] }[] = [
    {
      title: "Dostawa",
      items: [
        ["Kiedy wyślecie moje zamówienie?", <>Większość dostępnych produktów przekazujemy do wysyłki w ciągu 1 dnia roboczego od zaksięgowania płatności. Szczegóły: <Link href="/czas-realizacji" className="font-semibold text-accent-dark underline">czas realizacji</Link>.</>, "Większość dostępnych produktów wysyłamy w ciągu 1 dnia roboczego od zaksięgowania płatności."],
        ["Jakie są formy i koszty dostawy?", <>Paczkomat InPost, ORLEN Paczka, kurier InPost (także za pobraniem) oraz odbiór osobisty w Białymstoku. Aktualne ceny znajdziesz na stronie <Link href="/dostawa-i-platnosci" className="font-semibold text-accent-dark underline">Dostawa i płatności</Link>. Nie wysyłamy za granicę.</>, "Paczkomat InPost, ORLEN Paczka, kurier InPost (także za pobraniem) oraz odbiór osobisty w Białymstoku. Nie wysyłamy za granicę."],
        ["Od jakiej kwoty dostawa jest darmowa?", <>Od {free} brutto dla Paczkomatu InPost, ORLEN Paczki i kuriera InPost (z wyłączeniem przesyłek za pobraniem).</>, `Od ${free} brutto, z wyłączeniem przesyłek za pobraniem.`],
        ["Czy wysyłacie za granicę?", <>Nie. Zamówienia wysyłamy tylko na terenie Polski.</>, "Nie, tylko na terenie Polski."],
      ],
    },
    {
      title: "Płatności i faktury",
      items: [
        ["Jak mogę zapłacić?", <>BLIK, szybki przelew i karta przez Przelewy24, przelew tradycyjny albo za pobraniem przy odbiorze kurierem.</>, "BLIK, szybki przelew i karta przez Przelewy24, przelew tradycyjny lub za pobraniem."],
        ["Czy wystawiacie faktury VAT?", <>Tak. Zaznacz „Chcę fakturę na firmę” w koszyku i podaj NIP – faktura przyjdzie e-mailem.</>, "Tak, po zaznaczeniu opcji faktury w koszyku i podaniu NIP."],
      ],
    },
    {
      title: "Zwroty i reklamacje",
      items: [
        ["Ile mam czasu na zwrot?", <>14 dni od otrzymania przesyłki, bez podawania przyczyny. Ze względów bezpieczeństwa zwrotowi podlegają produkty nieotwarte. Zgłoszenie złożysz przez <Link href="/zwroty-i-reklamacje" className="font-semibold text-accent-dark underline">formularz zwrotu</Link>.</>, "14 dni od otrzymania przesyłki; zwrotowi podlegają produkty nieotwarte."],
        ["Jak złożyć reklamację?", <>Wypełnij <Link href="/zwroty-i-reklamacje" className="font-semibold text-accent-dark underline">formularz reklamacji</Link> – odpowiemy w ciągu 1 dnia roboczego, a reklamację rozpatrzymy w ciągu 14 dni.</>, "Przez formularz reklamacji; odpowiedź w 1 dzień roboczy, rozpatrzenie w 14 dni."],
      ],
    },
    {
      title: "Dobór produktów",
      items: [
        ["Nie wiem, od czego zacząć – co kupić?", <>Zajrzyj do <Link href="/blog" className="font-semibold text-accent-dark underline">przewodników zakupowych</Link>: pierwszy zestaw detailingowy, mycie auta, felgi i wnętrze.</>, "Przewodniki zakupowe na blogu: pierwszy zestaw, mycie, felgi i wnętrze."],
        ["Czy doradzicie dobór chemii?", <>Tak. Zadzwoń: +48 500 021 705 ({hours}) albo napisz na <a href="mailto:aukcje@sonax.bialystok.pl" className="font-semibold text-accent-dark underline">aukcje@sonax.bialystok.pl</a>.</>, "Tak, doradzimy telefonicznie lub e-mailem."],
      ],
    },
    {
      title: "Bezpieczeństwo produktów",
      items: [
        ["Gdzie znajdę kartę charakterystyki?", <>W karcie produktu, w zakładce „Pliki i bezpieczeństwo”. Jeśli karty nie ma do pobrania, kliknij „Poproś o kartę” – wyślemy ją e-mailem.</>, "W karcie produktu w zakładce Pliki i bezpieczeństwo lub na prośbę e-mailem."],
        ["Czy mogę kupić produkty w sklepie stacjonarnym?", <>Tak, zapraszamy do Białegostoku, ul. Gen. Wł. Andersa 40 ({hours}). <Link href="/o-nas#sklep" className="font-semibold text-accent-dark underline">Mapa dojazdu</Link>.</>, "Tak, w Białymstoku przy ul. Gen. Wł. Andersa 40."],
      ],
    },
  ];

  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) => g.items.map(([q, , a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }))),
  };

  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ label: "FAQ" }]} />
      <header className="bg-kc-gradient-deep mt-4 rounded-3xl px-6 py-10 text-white sm:px-10">
        <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Najczęstsze pytania</h1>
        <p className="mt-2 max-w-2xl text-brand-100">Dostawa, płatności, zwroty i dobór chemii – w jednym miejscu.</p>
      </header>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.title}>
              <h2 className="mb-3 text-xl font-black text-navy">{g.title}</h2>
              <div className="divide-y divide-brand-100 overflow-hidden rounded-2xl bg-white ring-1 ring-brand-100">
                {g.items.map(([q, a]) => (
                  <details key={q} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink hover:bg-leaf-50/50">
                      {q} <ChevronDown className="h-5 w-5 shrink-0 text-leaf transition group-open:rotate-180" />
                    </summary>
                    <div className="px-5 pb-5 text-[15px] leading-relaxed text-slate-600">{a}</div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
        <aside className="rounded-3xl bg-white p-6 ring-1 ring-brand-100 lg:sticky lg:top-40">
          <MessageCircleQuestion className="h-8 w-8 text-leaf" />
          <h2 className="mt-3 text-lg font-black text-navy">Nie znalazłeś odpowiedzi?</h2>
          <p className="mt-1 text-sm text-slate-600">Napisz albo zadzwoń – odpowiadamy w dni robocze, {hours}.</p>
          <a href="tel:+48500021705" className="btn-kc mt-4 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white"><Phone className="h-4 w-4" /> +48 500 021 705</a>
          <Link href="/kontakt" className="mt-2 block rounded-xl py-3 text-center text-sm font-bold text-brand-800 ring-1 ring-brand-200 hover:bg-leaf-50">Formularz kontaktowy</Link>
        </aside>
      </div>
    </div>
  );
}
