"use client";

// Edycja sekcji w miejscu karty (jak w BaseLinkerze), bez osobnego okna na środku ekranu.
// Pola formularza Payload wjeżdżają do kontenera, który właśnie edytujesz.

import { createPortal } from "react-dom";
import { useDocumentInfo, useForm, useFormProcessing, RenderFields } from "@payloadcms/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import type { ClientField, SanitizedFieldPermissions } from "payload";

export type SheetSection = { id: string; title: string; hint?: string; tab?: string };

export function openSheet(id: string, tab?: string, title?: string) {
  const html = document.documentElement;
  html.dataset.kcSheet = id;
  html.dataset.kcSheetTitle = title || "tę sekcję";
  if (tab) [...document.querySelectorAll<HTMLButtonElement>(".tabs-field__tab-button")].find((b) => b.textContent?.trim() === tab)?.click();
  window.dispatchEvent(new Event("kc-sheet"));
}

export function closeSheet() {
  delete document.documentElement.dataset.kcSheet;
  delete document.documentElement.dataset.kcSheetTitle;
  window.dispatchEvent(new Event("kc-sheet"));
}

const slotNodes = new Map<string, HTMLElement>();
const slotListeners = new Set<() => void>();

export function EditSlot({ id }: { id: string }) {
  const remember = useCallback((el: HTMLDivElement | null) => {
    if (el) slotNodes.set(id, el);
    else slotNodes.delete(id);
    slotListeners.forEach((fn) => fn());
  }, [id]);
  return <div className="kc-slot" data-kc-slot={id} ref={remember} />;
}

export function useSheet() {
  const [id, setId] = useState("");
  useEffect(() => {
    const sync = () => setId(document.documentElement.dataset.kcSheet || "");
    sync();
    window.addEventListener("kc-sheet", sync);
    return () => window.removeEventListener("kc-sheet", sync);
  }, []);
  return id;
}

function InlineBar({ onClose }: { onClose: () => void }) {
  const { getData, reset, submit } = useForm();
  const processing = useFormProcessing();
  const snap = useRef<Record<string, unknown> | null>(null);
  if (!snap.current) {
    try { snap.current = JSON.parse(JSON.stringify(getData())) as Record<string, unknown>; } catch { snap.current = null; }
  }
  const cancel = async () => {
    const data = snap.current;
    onClose();
    if (data) await reset(data);
  };
  const save = async () => {
    const result = await submit();
    if (result?.res && result.res.ok) onClose();
  };
  return (
    <div className="kc-inline__bar">
      <button type="button" onClick={() => void cancel()} disabled={processing}>Anuluj</button>
      <button type="button" className="is-save" onClick={() => void save()} disabled={processing}>{processing ? "Zapisuję…" : "Zapisz"}</button>
    </div>
  );
}

type InlineProps = {
  sectionId?: string;
  field?: { fields?: ClientField[]; admin?: { className?: string } };
  indexPath?: string;
  parentPath?: string;
  parentSchemaPath?: string;
  permissions?: { [key: string]: SanitizedFieldPermissions } | SanitizedFieldPermissions;
  readOnly?: boolean;
};

const idOf = (props: InlineProps) =>
  props.sectionId || props.field?.admin?.className?.match(/kc-sec--([\w-]+)/)?.[1] || "";

// Zastępuje zwijaną sekcję Payload. W podglądzie kart pola są w karcie; w nowym rekordzie zostają w formularzu.
export function InlineSection(props: InlineProps) {
  const id = idOf(props);
  const [mode, setMode] = useState({ cards: false, open: false, focus: false });
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let tries = 0;
    let timer = 0;
    const sync = () => {
      const html = document.documentElement;
      const focus = html.dataset.kcFocus === "1";
      const cards = Boolean(html.dataset.kcView) && !html.dataset.kcEdit;
      const open = (cards || focus) && html.dataset.kcSheet === id;
      setMode({ cards, open, focus });
      setSlot(open ? slotNodes.get(id) ?? null : null);
      if (open && !slotNodes.get(id) && tries < 20) {
        tries += 1;
        timer = window.setTimeout(sync, 40);
      }
    };
    sync();
    slotListeners.add(sync);
    window.addEventListener("kc-sheet", sync);
    return () => { slotListeners.delete(sync); window.removeEventListener("kc-sheet", sync); window.clearTimeout(timer); };
  }, [id]);

  const fields = props.field?.fields;
  if (!fields?.length) return null;
  const body = (
    <div className="kc-inline">
      <RenderFields
        fields={fields}
        forceRender
        margins="small"
        parentIndexPath={props.indexPath || ""}
        parentPath={props.parentPath || ""}
        parentSchemaPath={props.parentSchemaPath || ""}
        permissions={props.permissions ?? true}
        readOnly={props.readOnly}
      />
      {mode.cards && <InlineBar onClose={closeSheet} />}
    </div>
  );
  if (mode.focus && mode.open) return <div className="kc-sec-live">{body}</div>;
  if (!mode.cards) return body;
  if (!mode.open) return null;
  if (!slot) return null;
  return createPortal(body, slot);
}

export function SectionButtons({ items }: { items: SheetSection[] }) {
  const open = useSheet();
  useEffect(() => {
    if (open !== "konto") return;
    const slot = document.querySelector<HTMLElement>('[data-kc-slot="konto"]');
    const box = document.querySelector<HTMLElement>(".auth-fields");
    if (!slot || !box) return;
    const parent = box.parentElement;
    const next = box.nextSibling;
    slot.appendChild(box);
    return () => { if (parent) parent.insertBefore(box, next); };
  }, [open]);
  return (
    <div className="kc-secbtns">
      {items.map((s) => (
        <div key={s.id} className={`kc-secbtns__item ${open === s.id ? "is-editing" : ""}`}>
          {open !== s.id && (
            <button type="button" onClick={() => openSheet(s.id, s.tab, s.title)}><Pencil size={13} /> {s.title}</button>
          )}
          <EditSlot id={s.id} />
        </div>
      ))}
    </div>
  );
}

export function SectionBoard({ sections, always = false }: { sections: SheetSection[]; always?: boolean }) {
  const { id } = useDocumentInfo();
  const open = useSheet();
  const [focus, setFocus] = useState("");
  const show = always || Boolean(id);
  useEffect(() => {
    if (!show) return;
    const html = document.documentElement;
    const only = new URLSearchParams(window.location.search).get("sekcja") || "";
    html.dataset.kcView = "sections";
    if (only) html.dataset.kcFocus = "1";
    setFocus(only);
    window.dispatchEvent(new Event("kc-sheet"));
    if (only) {
      openSheet(only);
      const again = window.setTimeout(() => openSheet(only), 250);
      return () => { window.clearTimeout(again); delete html.dataset.kcView; delete html.dataset.kcFocus; delete html.dataset.kcSheet; delete html.dataset.kcSheetTitle; window.dispatchEvent(new Event("kc-sheet")); };
    }
    return () => {
      delete html.dataset.kcView;
      delete html.dataset.kcSheet;
      delete html.dataset.kcSheetTitle;
      window.dispatchEvent(new Event("kc-sheet"));
    };
  }, [show]);
  if (!show) return null;
  const shown = focus ? sections.filter((s) => s.id === focus) : sections;
  return (
    <div className="kc-board">
      {!focus && <p>Wybierz element. Pola otworzą się w tym kafelku, reszta zostaje na miejscu.</p>}
      <div className="kc-board__grid">
        {shown.map((s) => {
          const editing = open === s.id;
          return (
            <div key={s.id} className={`kc-board__card ${editing ? "is-editing" : ""}`}>
              <header>
                <b>{s.title}</b>
                {!editing && (
                  <button type="button" onClick={() => openSheet(s.id, s.tab, s.title)}><Pencil size={13} /> Edytuj</button>
                )}
              </header>
              {!editing && s.hint && <span>{s.hint}</span>}
              <EditSlot id={s.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
