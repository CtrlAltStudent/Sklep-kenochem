"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type Item = { name: string; href: string; src?: string };

// Pasek marek sam jedzie. Myszka (przeciąganie i kółko) oraz palec przesuwają go w obie strony.
// Druga kopia jest taka sama i też prowadzi do strony marki.
export function BrandStrip({ items }: { items: Item[] }) {
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const x = useRef(0);
  const pause = useRef(false);
  const drag = useRef({ on: false, x: 0, y: 0, ox: 0, oy: 0, moved: false });

  const apply = () => {
    const el = track.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (half <= 0) return;
    x.current = ((x.current % half) + half) % half;
    el.style.transform = `translate3d(${-x.current}px,0,0)`;
  };

  useEffect(() => {
    const el = view.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const tick = () => {
      if (!pause.current && !reduce) { x.current += 0.55; apply(); }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const wheel = (e: WheelEvent) => {
      pause.current = true;
      x.current += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      apply();
      window.setTimeout(() => { pause.current = false; }, 700);
      e.preventDefault();
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => { cancelAnimationFrame(frame); el.removeEventListener("wheel", wheel); };
  }, []);

  return (
    <div
      ref={view}
      className="brand-viewport cursor-grab overflow-hidden active:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        drag.current = { on: true, x: e.clientX, y: e.clientY, ox: e.clientX, oy: e.clientY, moved: false };
        pause.current = true;
      }}
      onPointerMove={(e) => {
        if (!drag.current.on) return;
        const dx = e.clientX - drag.current.x;
        const adx = Math.abs(e.clientX - drag.current.ox);
        const ady = Math.abs(e.clientY - drag.current.oy);
        if (!drag.current.moved && ady > adx && ady > 8) {
          drag.current.on = false;
          pause.current = false;
          return;
        }
        if (adx > 8) drag.current.moved = true;
        if (!drag.current.moved) return;
        x.current -= dx;
        apply();
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;
        const el = view.current;
        if (el && !el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId);
      }}
      onPointerUp={() => { drag.current.on = false; pause.current = false; }}
      onPointerCancel={() => { drag.current.on = false; pause.current = false; }}
      onClickCapture={(e) => {
        if (!drag.current.moved) return;
        e.preventDefault();
        e.stopPropagation();
        drag.current.moved = false;
      }}
    >
      <div ref={track} className="flex w-max items-center">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-3 px-1.5" aria-hidden={copy === 1 || undefined}>
            {items.map((b) => (
              <Link key={`${copy}-${b.href}-${b.name}`} href={b.href} draggable={false} className="grid h-16 w-36 shrink-0 place-items-center rounded-xl bg-white px-3 ring-1 ring-brand-100 hover:ring-accent" title={b.name}>
                {b.src
                  ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.src} alt={copy === 0 ? b.name : ""} draggable={false} className="pointer-events-none max-h-10 max-w-full object-contain" />
                  )
                  : <span className="text-sm font-bold text-slate-600">{b.name}</span>}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
