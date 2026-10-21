"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { ProductImage } from "./ProductImage";

// Kwadratowe zdjęcie wypełnia kolumnę, miniatury pod spodem. Całość mieści się na ekranie.
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const go = useCallback((n: number) => setActive((n + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(active + 1);
      if (e.key === "ArrowLeft") go(active - 1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [lightbox, active, go]);

  const src = images[active];
  const many = images.length > 1;

  return (
    <div>
      <div
        className="group relative mx-auto aspect-square w-full max-w-[min(100%,calc(100dvh-12rem))] cursor-zoom-in overflow-hidden rounded-lg bg-[#f6f7f8] ring-1 ring-brand-100"
        onMouseMove={(e) => {
          if (!src) return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
        onClick={() => src && setLightbox(true)}
      >
        <div className="h-full w-full transition-transform duration-200 ease-out" style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}>
          <ProductImage src={src} alt={alt} priority className="h-full w-full !bg-transparent" sizes="(min-width: 1024px) 36vw, 90vw" />
        </div>
        {src && (
          <span className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100">
            <Expand className="h-3.5 w-3.5" /> Powiększ
          </span>
        )}
        {many && (
          <>
            <button type="button" onClick={(e) => { e.stopPropagation(); go(active - 1); }} aria-label="Poprzednie zdjęcie"
              className="absolute top-1/2 left-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy shadow hover:bg-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); go(active + 1); }} aria-label="Następne zdjęcie"
              className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy shadow hover:bg-white">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {many && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((s, i) => (
            <button key={s} type="button" onClick={() => setActive(i)} aria-label={`Zdjęcie ${i + 1}`}
              className={`w-16 shrink-0 overflow-hidden rounded-md bg-[#f6f7f8] ring-2 ${i === active ? "ring-accent" : "ring-transparent opacity-70 hover:opacity-100"}`}>
              <ProductImage src={s} alt="" sizes="64px" className="aspect-square !bg-transparent" />
            </button>
          ))}
        </div>
      )}

      {lightbox && src && (
        <div className="fixed inset-0 z-[60] flex animate-fade-in flex-col bg-brand-950/95" role="dialog" aria-label="Podgląd zdjęcia">
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm opacity-70">{active + 1} / {images.length}</span>
            <button type="button" onClick={() => setLightbox(false)} aria-label="Zamknij" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"><X className="h-5 w-5" /></button>
          </div>
          <div className="relative flex-1" onClick={() => setLightbox(false)}>
            <Image src={src} alt={alt} fill sizes="100vw" className="object-contain p-4" />
          </div>
          {many && (
            <div className="flex justify-center gap-3 p-4">
              <button type="button" onClick={() => go(active - 1)} aria-label="Poprzednie" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronLeft className="h-6 w-6" /></button>
              <button type="button" onClick={() => go(active + 1)} aria-label="Następne" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronRight className="h-6 w-6" /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
