"use client";

// Podstrony ze schematu: przycisk „Utwórz stronę” tworzy szkic z gotowymi blokami i otwiera go do edycji.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, FileText, Megaphone, Plus, Sparkles, Star } from "lucide-react";

export function PageTemplateButton({ template }: { template: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const create = async () => {
    const title = prompt("Tytuł nowej strony (np. „Wiosenna promocja”):");
    if (!title?.trim()) return;
    setBusy(true);
    setErr("");
    const r = await fetch("/api/content-tools/page-template", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template, title: title.trim() }),
    }).then((x) => x.json()).catch(() => ({ ok: false, message: "Brak połączenia" }));
    setBusy(false);
    if (r.ok) router.push(`/admin/collections/pages/${r.id}`);
    else setErr(r.message ?? "Nie udało się utworzyć strony");
  };
  return (
    <>
      <button type="button" className="kc-act__btn" disabled={busy} onClick={create}><Plus size={15} /> {busy ? "Tworzę…" : "Utwórz stronę"}</button>
      {err && <p className="kc-act__msg is-bad">{err}</p>}
    </>
  );
}

// Nad listą podstron: „Nowa podstrona z gotowego schematu” (zwijane)
const TEMPLATES = [
  { id: "promo", icon: Megaphone, name: "Strona promocji", text: "Baner, opis akcji, siatka produktów i pytania o warunki.", blocks: ["Baner", "Tekst", "Produkty", "FAQ"] },
  { id: "info", icon: FileText, name: "Strona informacyjna", text: "Np. dostawa, współpraca, o firmie – tekst, zdjęcie z opisem i FAQ.", blocks: ["Tekst", "Obraz + tekst", "FAQ"] },
  { id: "brand", icon: Star, name: "Strona marki / serii", text: "Baner, historia marki ze zdjęciem i produkty z kategorii.", blocks: ["Baner", "Obraz + tekst", "Produkty"] },
  { id: "guide", icon: BookOpen, name: "Poradnik krok po kroku", text: "Wstęp, kroki ze zdjęciami i polecane produkty do zadania.", blocks: ["Tekst", "Obraz + tekst", "Obraz + tekst", "Produkty"] },
];
const shapeClass = (b: string) => `is-${b === "Baner" ? "hero" : b === "Produkty" ? "grid" : b === "FAQ" ? "faq" : b === "Obraz + tekst" ? "split" : "text"}`;

export function PageTemplates() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(!open);
  return (
    <section className="kc-tplbar">
      <button type="button" className="kc-tplbar__head" onClick={toggle} aria-expanded={open}>
        <Sparkles size={16} /> <b>Nowa podstrona z gotowego schematu</b>
        <small>{open ? "zwiń" : "rozwiń"}</small>
      </button>
      {open && (
        <div className="kc-tpl">
          {TEMPLATES.map(({ id, icon: Icon, name, text, blocks }) => (
            <div key={id} className="kc-tpl__item">
              <div className="kc-tpl__shape">{blocks.map((b, i) => <span key={i} className={shapeClass(b)}>{b}</span>)}</div>
              <div className="kc-tpl__body">
                <b><Icon size={15} /> {name}</b>
                <p>{text}</p>
                <PageTemplateButton template={id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
