"use client";

import { useEffect, useRef, useState } from "react";
import { useField } from "@payloadcms/ui";
import { Trash2 } from "lucide-react";

type Spot = { x: number; y: number; productIds: number[] };
type Hit = { id: number; name: string; sku: string; price: number; thumb: string };

const FRAME = "1600 × 640";

const spotsOf = (value: unknown): Spot[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const x = Number((item as Spot).x);
    const y = Number((item as Spot).y);
    const productIds = Array.isArray((item as Spot).productIds) ? (item as Spot).productIds.map(Number).filter((n) => n > 0) : [];
    if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
    return [{ x, y, productIds }];
  });
};

export function SceneEditor() {
  const image = useField<number | { id?: number; url?: string } | null>({ path: "sceneImage" });
  const spotsField = useField<unknown>({ path: "sceneSpots" });
  const spots = spotsOf(spotsField.value);
  const spotsRef = useRef(spots);
  spotsRef.current = spots;
  const [src, setSrc] = useState("/sonax/warsztat-venus.jpg");
  const [active, setActive] = useState(0);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [known, setKnown] = useState<Record<number, Hit>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const write = (next: Spot[]) => spotsField.setValue(next);

  useEffect(() => {
    const value = image.value;
    if (value && typeof value === "object" && value.url) {
      setSrc(value.url);
      return;
    }
    const id = typeof value === "number" ? value : value && typeof value === "object" ? value.id : null;
    if (!id) {
      setSrc("/sonax/warsztat-venus.jpg");
      return;
    }
    let stop = false;
    fetch(`/api/media/${id}?depth=0`, { credentials: "include" })
      .then((r) => r.json())
      .then((doc) => { if (!stop && doc?.url) setSrc(doc.url); })
      .catch(() => {});
    return () => { stop = true; };
  }, [image.value]);

  const ids = spots.flatMap((s) => s.productIds).join(",");
  useEffect(() => {
    if (!ids) return;
    fetch(`/api/product-picker?ids=${ids}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j: { hits?: Hit[] }) => {
        const map: Record<number, Hit> = {};
        for (const hit of j.hits ?? []) map[hit.id] = hit;
        setKnown(map);
      })
      .catch(() => {});
  }, [ids]);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const t = setTimeout(() => {
      fetch(`/api/product-picker?q=${encodeURIComponent(q.trim())}`, { credentials: "include" })
        .then((r) => r.json())
        .then((j: { hits?: Hit[] }) => setHits(j.hits ?? []))
        .catch(() => setHits([]));
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  const place = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-dot]")) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = Math.round(Math.min(98, Math.max(2, ((event.clientX - box.left) / box.width) * 100)) * 10) / 10;
    const y = Math.round(Math.min(98, Math.max(2, ((event.clientY - box.top) / box.height) * 100)) * 10) / 10;
    const next = [...spots, { x, y, productIds: [] }];
    write(next);
    setActive(next.length - 1);
    setQ("");
    setHits(null);
  };

  const drag = (index: number, event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setActive(index);
    const frame = (event.currentTarget as HTMLElement).closest("[data-frame]") as HTMLElement | null;
    if (!frame) return;
    const move = (e: PointerEvent) => {
      const box = frame.getBoundingClientRect();
      const x = Math.round(Math.min(98, Math.max(2, ((e.clientX - box.left) / box.width) * 100)) * 10) / 10;
      const y = Math.round(Math.min(98, Math.max(2, ((e.clientY - box.top) / box.height) * 100)) * 10) / 10;
      const next = spotsRef.current.map((s, i) => (i === index ? { ...s, x, y } : s));
      spotsRef.current = next;
      write(next);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const upload = async (file: File) => {
    setNote("");
    const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const pic = new Image();
      pic.onload = () => resolve({ w: pic.naturalWidth, h: pic.naturalHeight });
      pic.onerror = () => reject(new Error("nie"));
      pic.src = URL.createObjectURL(file);
    }).catch(() => null);
    if (!dims || dims.w < 1200 || dims.h < 400 || dims.w <= dims.h) {
      setNote(`To zdjęcie się nie nadaje. Wgraj szeroką grafikę ${FRAME} px.`);
      return;
    }
    if (dims.w !== 1600 || dims.h !== 640) setNote(`Wgrane ${dims.w} × ${dims.h} px. Na stronie kadruje się do ${FRAME} px, więc najlepiej przyciąć je wcześniej.`);
    setBusy(true);
    const body = new FormData();
    body.append("file", file);
    body.append("_payload", JSON.stringify({ alt: file.name.replace(/\.[^.]+$/, ""), kind: "image" }));
    const res = await fetch("/api/media", { method: "POST", credentials: "include", body }).then((r) => r.json()).catch(() => null);
    setBusy(false);
    const doc = res?.doc ?? res;
    if (!doc?.id) {
      setNote("Nie udało się wgrać zdjęcia.");
      return;
    }
    image.setValue(doc.id);
    if (doc.url) setSrc(doc.url);
  };

  const spot = spots[active];
  const addProduct = (hit: Hit) => {
    if (!spot || spot.productIds.includes(hit.id)) return;
    setKnown({ ...known, [hit.id]: hit });
    write(spots.map((s, i) => (i === active ? { ...s, productIds: [...s.productIds, hit.id] } : s)));
    setQ("");
    setHits(null);
  };

  return (
    <div className="kc-scene">
      <div className="kc-scene__bar">
        <label className="kc-scene__file">
          {busy ? "Wgrywam…" : "Zmień grafikę"}
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void upload(file); }} />
        </label>
        <p>Grafika ma mieć <b>{FRAME} px</b>, poziomo. Inny szeroki plik też wejdzie, ale strona przytnie go do tego kadru. Kropki ustawiasz na tym, co będzie widać.</p>
      </div>
      {note && <p className="kc-scene__note">{note}</p>}
      <div className="kc-scene__frame" data-frame onPointerDown={place}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" />
        {spots.map((item, i) => (
          <button key={`${item.x}-${item.y}-${i}`} type="button" data-dot className={i === active ? "is-on" : ""} style={{ left: `${item.x}%`, top: `${item.y}%` }} onPointerDown={(e) => drag(i, e)} aria-label={`Kropka ${i + 1}`}>
            <span />
          </button>
        ))}
      </div>
      <p className="kc-scene__help">Kliknij zdjęcie, żeby dodać kropkę. Przeciągnij ją, żeby przesunąć.</p>
      {spot ? (
        <div className="kc-scene__box">
          <div className="kc-scene__box-head">
            <b>Kropka {active + 1}</b>
            <button type="button" onClick={() => { write(spots.filter((_, i) => i !== active)); setActive(0); }}><Trash2 size={14} /> Usuń kropkę</button>
          </div>
          <ul>
            {spot.productIds.map((id) => (
              <li key={id}>
                <span>{known[id]?.name || `Produkt ${id}`}</span>
                <button type="button" onClick={() => write(spots.map((s, i) => i === active ? { ...s, productIds: s.productIds.filter((n) => n !== id) } : s))}>Zdejmij</button>
              </li>
            ))}
          </ul>
          {!spot.productIds.length && <p>Ta kropka nie ma produktu, więc na stronie jej nie będzie.</p>}
          <input value={q} onChange={(e) => { setQ(e.target.value); if (e.target.value.trim().length < 2) setHits(null); }} placeholder="Szukaj produktu: nazwa albo kod" />
          {hits && (
            <ul className="kc-scene__hits">
              {hits.map((hit) => (
                <li key={hit.id}><button type="button" onClick={() => addProduct(hit)}>{hit.name}</button></li>
              ))}
              {!hits.length && <li>Nie ma takiego produktu.</li>}
            </ul>
          )}
        </div>
      ) : <p className="kc-scene__help">Nie ma jeszcze żadnej kropki.</p>}
    </div>
  );
}
