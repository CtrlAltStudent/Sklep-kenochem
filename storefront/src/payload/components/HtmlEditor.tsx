"use client";

// Opis produktu jak w BaseLinkerze: edytor wizualny (pogrubienie, nagłówki, listy, linki, zdjęcia), kod HTML i podgląd.
// Zapisuje czysty HTML do pola (descriptionHtml) – ten sam, który pokazuje sklep i który przychodzi z BaseLinkera.

import { useField } from "@payloadcms/ui";
import { useEffect, useRef, useState } from "react";
import {
  Bold, Eraser, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Pilcrow, Redo2, Underline, Undo2,
} from "lucide-react";

type Mode = "visual" | "html" | "preview";

// Czyszczenie wklejanego HTML (z Worda, stron www): bez stylów, klas, skryptów i pustych spanów
function clean(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,meta,link,iframe,object,o\\:p").forEach((n) => n.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const a of [...el.attributes]) if (!["href", "src", "alt", "title", "target"].includes(a.name)) el.removeAttribute(a.name);
    if (["SPAN", "FONT"].includes(el.tagName)) el.replaceWith(...el.childNodes);
  });
  return doc.body.innerHTML.replace(/<p>\s*(<br>)?\s*<\/p>/g, "").trim();
}

const TOOLS: [string, typeof Bold, string, string?][] = [
  ["Akapit", Pilcrow, "formatBlock", "<p>"],
  ["Nagłówek", Heading2, "formatBlock", "<h2>"],
  ["Podnagłówek", Heading3, "formatBlock", "<h3>"],
  ["Pogrubienie (Ctrl+B)", Bold, "bold"],
  ["Kursywa (Ctrl+I)", Italic, "italic"],
  ["Podkreślenie (Ctrl+U)", Underline, "underline"],
  ["Lista punktowana", List, "insertUnorderedList"],
  ["Lista numerowana", ListOrdered, "insertOrderedList"],
  ["Link", Link2, "createLink"],
  ["Zdjęcie z adresu", ImagePlus, "insertImage"],
  ["Usuń formatowanie", Eraser, "removeFormat"],
  ["Cofnij (Ctrl+Z)", Undo2, "undo"],
  ["Ponów", Redo2, "redo"],
];

export function HtmlEditor(props: { path?: string; field?: { name?: string; label?: unknown; admin?: { description?: unknown } }; readOnly?: boolean }) {
  const path = props.path ?? props.field?.name ?? "descriptionHtml";
  const { value, setValue } = useField<string>({ path });
  const [mode, setMode] = useState<Mode>("visual");
  const box = useRef<HTMLDivElement>(null);
  const emitted = useRef<string | null>(null);
  const label = typeof props.field?.label === "string" ? props.field.label : "Opis produktu";
  const description = typeof props.field?.admin?.description === "string" ? props.field.admin.description : "";

  // Wartość z zewnątrz (wczytanie, zakładka HTML, synchronizacja) → do edytora; własne zmiany pomijamy, żeby nie skakał kursor
  useEffect(() => {
    if (mode !== "visual" || !box.current) return;
    if ((value ?? "") !== emitted.current) box.current.innerHTML = value ?? "";
  }, [value, mode]);

  const emit = () => {
    const html = box.current?.innerHTML ?? "";
    emitted.current = html;
    setValue(html === "<br>" ? "" : html);
  };
  const cmd = (name: string, arg?: string) => {
    box.current?.focus();
    document.execCommand(name, false, arg);
    emit();
  };
  // Przycisk paska → polecenie edytora (link i zdjęcie pytają o adres)
  const run = (command: string, arg?: string) => {
    if (command === "createLink" || command === "insertImage") {
      const url = prompt(command === "createLink" ? "Adres linku (np. https://… albo /kategoria/…):" : "Adres zdjęcia (https://…):");
      if (url) cmd(command, url);
      return;
    }
    cmd(command, arg);
  };

  return (
    <div className="field-type kc-html">
      <div className="kc-html__top">
        <span className="field-label">{label}</span>
        <div className="kc-html__modes" role="tablist" aria-label="Widok opisu">
          {([["visual", "Edytor wizualny"], ["html", "HTML"], ["preview", "Podgląd"]] as [Mode, string][]).map(([m, l]) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} className={mode === m ? "is-active" : ""} onClick={() => { if (mode === "visual") emit(); setMode(m); }}>{l}</button>
          ))}
        </div>
      </div>

      {mode === "visual" && (
        <div className="kc-html__frame">
          <div className="kc-html__bar" role="toolbar" aria-label="Formatowanie">
            {TOOLS.map(([title, Icon, command, arg]) => (
              <button key={title} type="button" title={title} aria-label={title} disabled={props.readOnly} onMouseDown={(e) => e.preventDefault()} onClick={() => run(command, arg)}><Icon size={16} /></button>
            ))}
          </div>
          <div
            ref={box}
            className="kc-html__area kc-desc"
            contentEditable={!props.readOnly}
            suppressContentEditableWarning
            onInput={emit}
            onBlur={emit}
            onPaste={(e) => {
              const html = e.clipboardData.getData("text/html");
              if (!html) return; // zwykły tekst – przeglądarka wklei sama
              e.preventDefault();
              document.execCommand("insertHTML", false, clean(html));
              emit();
            }}
          />
        </div>
      )}

      {mode === "html" && (
        <textarea className="kc-html__code" spellCheck={false} value={value ?? ""} readOnly={props.readOnly} onChange={(e) => setValue(e.target.value)} />
      )}

      {mode === "preview" && (
        <div className="kc-html__frame">
          {value ? <div className="kc-html__area kc-desc" dangerouslySetInnerHTML={{ __html: value }} /> : <p className="kc-html__empty">Opis jest pusty.</p>}
        </div>
      )}
      {description && <div className="field-description">{description}</div>}
    </div>
  );
}
