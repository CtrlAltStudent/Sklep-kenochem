"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

type Slide = { image: string; href: string; kicker?: string; title?: string; text?: string; cta?: string };

// Banery pobrane z kenochem.com
const slides: Slide[] = [
  { image: "/brand/mYCIE-AUTA-1.jpg", href: "/kategoria/chemia-samochodowa?sub=mycie-samochodu", kicker: "Chemia samochodowa", title: "Profesjonalne mycie samochodu", text: "Aktywne piany, szampony i preparaty, których używają najlepsze myjnie w Polsce.", cta: "Zobacz produkty" },
  { image: "/brand/Nowy-Kenochem-banner-1920x625-5.jpg", href: "/kategoria/dom-i-ogrod?sub=czyszczenie-zewnetrzne", kicker: "Dom i ogród", title: "Mech nie ma szans", text: "Skuteczne preparaty do kostki, dachów i elewacji.", cta: "Sprawdź" },
  { image: "/brand/Nowy-Kenochem-banner-1920x625-1-1-1.jpg", href: "/kategoria/chemia-samochodowa?sub=pielegnacja-lakieru", kicker: "Pielęgnacja lakieru", title: "Czysty samochód bez wysiłku", text: "Woski, powłoki i quick detailery z efektem perlenia.", cta: "Kup teraz" },
  { image: "/brand/slider-k-2026.jpg", href: "/kategoria/chemia-samochodowa?sub=wnetrze-samochodu", kicker: "Wnętrze samochodu", title: "Detailing wnętrza", text: "Tapicerka, plastiki i skóra – wszystko w jednym miejscu.", cta: "Zobacz" },
  { image: "/brand/25-lat-1.jpg", href: "/b2b" },
];

export function HeroSlider() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useCallback((n: number) => setI((n + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => go(i + 1), 6000);
    return () => clearTimeout(t);
  }, [i, paused, go]);

  return (
    <section className="group relative overflow-hidden rounded-3xl bg-brand-950" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      aria-roledescription="karuzela" aria-label="Promocje">
      <div className="relative aspect-[16/9] sm:aspect-[1920/625]">
        {slides.map((s, n) => (
          <Link key={s.image} href={s.href} aria-hidden={n !== i} tabIndex={n === i ? 0 : -1}
            className={`absolute inset-0 transition-opacity duration-700 ${n === i ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <Image src={s.image} alt={s.title ?? "Kenochem – 25 lat z Wami"} fill priority={n === 0} sizes="(min-width: 1280px) 1248px, 100vw"
              className={`object-cover ${s.title ? "" : "object-center"} ${n === i ? "scale-100" : "scale-105"} transition-transform duration-[6000ms]`} />
            {s.title && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-950/85 via-brand-950/45 to-transparent" />
                <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center p-6 text-white sm:p-12">
                  <span className="w-fit rounded-full bg-lime/90 px-3 py-1 text-xs font-bold text-brand-950">{s.kicker}</span>
                  <h2 className="mt-3 text-2xl leading-tight font-black sm:text-5xl">{s.title}</h2>
                  <p className="mt-3 hidden text-white/85 sm:block">{s.text}</p>
                  <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-900 transition hover:bg-lime">
                    {s.cta} <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </>
            )}
          </Link>
        ))}
      </div>

      <button onClick={() => go(i - 1)} aria-label="Poprzedni baner"
        className="absolute top-1/2 left-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-brand-900 opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100 hover:bg-white">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={() => go(i + 1)} aria-label="Następny baner"
        className="absolute top-1/2 right-3 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-brand-900 opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100 hover:bg-white">
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {slides.map((s, n) => (
          <button key={s.image} onClick={() => go(n)} aria-label={`Baner ${n + 1}`}
            className={`h-2 rounded-full transition-all ${n === i ? "w-8 bg-lime" : "w-2 bg-white/60 hover:bg-white"}`} />
        ))}
      </div>
    </section>
  );
}
