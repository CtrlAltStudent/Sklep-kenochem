"use client";

import { useEffect, useState } from "react";

// Przykładowe frazy, jakie klient może wpisać. Pojawiają się litera po literze, potem się kasują.
export const SEARCH_PHRASES = [
  "piana aktywna",
  "wosk do lakieru",
  "płyn do felg",
  "sonax",
  "mikrofibra",
  "odtłuszczacz",
  "zapach do auta",
  "szampon samochodowy",
  "dressing do opon",
  "quick detailer",
];

export function useTypedPlaceholder(active: boolean) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!active) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(SEARCH_PHRASES[0]);
      return;
    }
    let phrase = 0;
    let i = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const full = SEARCH_PHRASES[phrase];
      if (!deleting) {
        i += 1;
        setText(full.slice(0, i));
        if (i >= full.length) {
          deleting = true;
          timer = window.setTimeout(tick, 1500);
          return;
        }
        timer = window.setTimeout(tick, 55 + Math.round(Math.random() * 70));
      } else {
        i -= 1;
        setText(full.slice(0, Math.max(0, i)));
        if (i <= 0) {
          deleting = false;
          phrase = (phrase + 1) % SEARCH_PHRASES.length;
          timer = window.setTimeout(tick, 350);
          return;
        }
        timer = window.setTimeout(tick, 32);
      }
    };
    timer = window.setTimeout(tick, 500);
    return () => window.clearTimeout(timer);
  }, [active]);
  return text;
}
