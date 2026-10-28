"use client";

// Podgląd zdjęć w edycji produktu: pasek miniaturek i miniatura przy każdym wierszu.

import { useFormFields, useRowLabel } from "@payloadcms/ui";
import { useEffect, useState } from "react";

type Media = { url?: string | null; thumbnailURL?: string | null };
const srcOf = (media: unknown, url?: string) => {
  if (url) return url;
  if (media && typeof media === "object") {
    const m = media as Media;
    return m.thumbnailURL || m.url || "";
  }
  return "";
};

function useMediaUrl(id: number | undefined, ready: string) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (ready || !id) return;
    let alive = true;
    fetch(`/api/media/${id}?depth=0`, { credentials: "include" })
      .then((r) => r.json())
      .then((m: Media) => { if (alive) setUrl(m.thumbnailURL || m.url || ""); })
      .catch(() => {});
    return () => { alive = false; };
  }, [id, ready]);
  return ready || url;
}

export function ImageStrip() {
  const slots = useFormFields(([fields]) => {
    const out: { key: string; url: string; media?: number }[] = [];
    let miss = 0;
    for (let i = 0; i < 24 && miss < 2; i++) {
      const urlField = fields[`images.${i}.url`];
      const mediaField = fields[`images.${i}.media`];
      if (!urlField && !mediaField) { miss++; continue; }
      miss = 0;
      const media = mediaField?.value;
      const fromFile = media && typeof media === "object" ? srcOf(media) : "";
      out.push({
        key: String(i),
        url: String(urlField?.value ?? "") || fromFile,
        media: typeof media === "number" ? media : undefined,
      });
    }
    return out;
  });
  if (!slots.length) return <p className="kc-imgs__empty">Brak zdjęć. Dodaj plik albo wklej adres – podgląd pojawi się tutaj.</p>;
  return (
    <div className="kc-imgs">
      {slots.map((slot, index) => <Thumb key={slot.key} url={slot.url} media={slot.media} label={index === 0 ? "Główne" : String(index + 1)} />)}
    </div>
  );
}

function Thumb({ url, media, label }: { url: string; media?: number; label: string }) {
  const src = useMediaUrl(media, srcOf(undefined, url));
  return (
    <span className="kc-imgs__item">
      <span className="kc-thumb kc-imgs__thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src ? <img src={src} alt="" /> : <span className="kc-thumb__empty">—</span>}
      </span>
      <span>{label}</span>
    </span>
  );
}

export function ImageRowLabel() {
  const { data, rowNumber } = useRowLabel<{ url?: string; media?: number | Media }>();
  const direct = srcOf(data?.media, data?.url);
  const src = useMediaUrl(typeof data?.media === "number" ? data.media : undefined, direct);
  const n = (rowNumber ?? 0) + 1;
  return (
    <span className="kc-rowlabel">
      <span className="kc-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src ? <img src={src} alt="" /> : <span className="kc-thumb__empty">—</span>}
      </span>
      <span className="kc-rowlabel__name">{n === 1 ? "Zdjęcie główne" : `Zdjęcie ${n}`}{data?.url ? "" : ""}</span>
    </span>
  );
}
