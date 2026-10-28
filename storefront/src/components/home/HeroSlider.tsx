"use client";

// Karuzela banerów strony głównej (panel: Wygląd sklepu → Strona główna → Banery).
// Zmienia się co 7 s, zatrzymuje po najechaniu myszą; strzałki i kropki do ręcznej zmiany.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Slide = { image: string; kicker?: string; title?: string; text?: string; ctaLabel?: string; link: string };

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 7000);
    return () => clearInterval(t);
  }, [n, paused]);

  return (
    <section className="relative isolate overflow-hidden bg-navy text-white" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="karuzela">
      {slides.map((s, k) => {
        const text = Boolean(s.title || s.text);
        const body = (
          <>
            <Image src={s.image} alt={s.title ?? ""} fill priority={k === 0} sizes="100vw" className="-z-10 object-cover object-[70%_center]" />
            {text && <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy from-[15%] via-navy/75 to-navy/10" />}
            <div className="mx-auto flex min-h-[340px] max-w-shop flex-col justify-center px-4 py-16 sm:min-h-[460px] sm:py-24">
              {s.kicker && <p className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">{s.kicker}</p>}
              {s.title && <h2 className="mt-4 max-w-xl text-4xl font-extrabold tracking-tight sm:text-6xl">{s.title}</h2>}
              {s.text && <p className="mt-5 max-w-lg text-base text-white/80 sm:text-lg">{s.text}</p>}
              {s.ctaLabel && <span className="mt-8 w-fit rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white group-hover:bg-accent-dark">{s.ctaLabel}</span>}
            </div>
          </>
        );
        return (
          <Link key={k} href={s.link} aria-hidden={k !== i} tabIndex={k === i ? 0 : -1}
            className={`group relative isolate block transition-opacity duration-700 ${k === i ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"}`}>
            {body}
          </Link>
        );
      })}
      {n > 1 && (
        <>
          <button type="button" aria-label="Poprzedni baner" onClick={() => setI((i - 1 + n) % n)} className="absolute top-1/2 left-3 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-white/30 sm:grid"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" aria-label="Następny baner" onClick={() => setI((i + 1) % n)} className="absolute top-1/2 right-3 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-white/30 sm:grid"><ChevronRight className="h-5 w-5" /></button>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {slides.map((_, k) => (
              <button key={k} type="button" aria-label={`Baner ${k + 1}`} onClick={() => setI(k)} className={`h-2 rounded-full transition-all ${k === i ? "w-7 bg-white" : "w-2 bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
