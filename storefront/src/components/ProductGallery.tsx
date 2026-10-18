"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { ProductImage } from "./ProductImage";

// Galeria: powiększenie pod kursorem, miniatury, podgląd pełnoekranowy (strzałki, Esc)
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

  return (
    <div className="space-y-3">
      <div
        className="group relative cursor-zoom-in overflow-hidden rounded-3xl bg-[#f3f5f1] ring-1 ring-brand-100"
        onMouseMove={(e) => {
          if (!src) return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
        onClick={() => src && setLightbox(true)}
      >
        <div className="transition-transform duration-200 ease-out" style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}>
          <ProductImage src={src} alt={alt} priority className="aspect-square !bg-transparent" sizes="(min-width: 1280px) 38vw, (min-width: 1024px) 48vw, 100vw" />
        </div>
        {src && (
          <span className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100">
            <Expand className="h-3.5 w-3.5" /> Kliknij, aby powiększyć
          </span>
        )}
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); go(active - 1); }} aria-label="Poprzednie zdjęcie"
              className="absolute top-1/2 left-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-900 opacity-0 shadow transition group-hover:opacity-100 hover:bg-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); go(active + 1); }} aria-label="Następne zdjęcie"
              className="absolute top-1/2 right-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-900 opacity-0 shadow transition group-hover:opacity-100 hover:bg-white">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto">
          {images.map((s, i) => (
            <button key={s} onClick={() => setActive(i)} aria-label={`Zdjęcie ${i + 1}`}
              className={`w-20 shrink-0 overflow-hidden rounded-xl bg-[#f3f5f1] ring-2 transition ${i === active ? "ring-accent" : "ring-transparent opacity-70 hover:opacity-100"}`}>
              <ProductImage src={s} alt="" sizes="80px" className="aspect-square !bg-transparent" />
            </button>
          ))}
        </div>
      )}

      {lightbox && src && (
        <div className="fixed inset-0 z-[60] flex animate-fade-in flex-col bg-brand-950/95 backdrop-blur" role="dialog" aria-label="Podgląd zdjęcia">
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm opacity-70">{active + 1} / {images.length}</span>
            <button onClick={() => setLightbox(false)} aria-label="Zamknij" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/20"><X className="h-5 w-5" /></button>
          </div>
          <div className="relative flex-1" onClick={() => setLightbox(false)}>
            <Image src={src} alt={alt} fill sizes="100vw" className="object-contain p-4" />
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-3 p-4">
              <button onClick={() => go(active - 1)} aria-label="Poprzednie" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronLeft className="h-6 w-6" /></button>
              <button onClick={() => go(active + 1)} aria-label="Następne" className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><ChevronRight className="h-6 w-6" /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
