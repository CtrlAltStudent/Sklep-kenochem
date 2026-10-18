"use client";

import { useEffect, useRef, useState } from "react";
import { useField, useFormFields, useRowLabel } from "@payloadcms/ui";
import {
  BadgePercent, CalendarClock, CircleCheck, CreditCard, FileText, Image as ImageIcon, Info, Link2, Loader2, MapPin, MessageSquareText,
  Package, Receipt, Search, Settings2, ShieldCheck, ShoppingCart, Sparkles, Star, Tag, Truck, User, Wand2,
} from "lucide-react";

// Ikony sekcji formularzy – nazwy przekazywane z konfiguracji kolekcji (clientProps)
const icons = {
  info: Info, user: User, truck: Truck, pin: MapPin, invoice: Receipt, card: CreditCard, cart: ShoppingCart, package: Package,
  percent: BadgePercent, calendar: CalendarClock, tag: Tag, seo: Search, image: ImageIcon, text: FileText, link: Link2,
  settings: Settings2, shield: ShieldCheck, star: Star, message: MessageSquareText, sparkles: Sparkles, check: CircleCheck,
};
export type SectionIcon = keyof typeof icons;

// Nagłówek sekcji formularza: ikona + tytuł + krótka podpowiedź „co tu wpisać”
export function SectionLabel({ title, hint, icon = "info" }: { title: string; hint?: string; icon?: SectionIcon }) {
  const Icon = icons[icon] ?? Info;
  return (
    <span className="kc-section">
      <span className="kc-section__icon"><Icon size={18} /></span>
      <span className="kc-section__text">
        <span className="kc-section__title">{title}</span>
        {hint && <span className="kc-section__hint">{hint}</span>}
      </span>
    </span>
  );
}

const pln = (n?: number) => (typeof n === "number" ? `${n.toFixed(2).replace(".", ",")} zł` : "");

// Etykieta wiersza pozycji zamówienia: „2 × Nazwa produktu · 509,98 zł”
export function OrderItemLabel() {
  const { data, rowNumber } = useRowLabel<{ name?: string; quantity?: number; priceGross?: number }>();
  const qty = data?.quantity ?? 1;
  return (
    <span className="kc-rowlabel">
      <span className="kc-rowlabel__no">{String((rowNumber ?? 0) + 1).padStart(2, "0")}</span>
      <span className="kc-rowlabel__name">{data?.name ? `${qty} × ${data.name}` : "Nowa pozycja – wybierz produkt"}</span>
      {data?.priceGross ? <span className="kc-rowlabel__price">{pln(qty * data.priceGross)}</span> : null}
    </span>
  );
}

export function AddressLabel() {
  const { data, rowNumber } = useRowLabel<{ label?: string; street?: string; city?: string }>();
  const text = data?.label || [data?.street, data?.city].filter(Boolean).join(", ");
  return (
    <span className="kc-rowlabel">
      <span className="kc-rowlabel__no">{String((rowNumber ?? 0) + 1).padStart(2, "0")}</span>
      <span className="kc-rowlabel__name">{text || "Nowy adres"}</span>
    </span>
  );
}

// Po wybraniu produktu w pozycji zamówienia uzupełnia nazwę, SKU, EAN, cenę i VAT
export function ProductAutofill({ path }: { path: string }) {
  const row = path.split(".").slice(0, -1).join(".");
  const productId = useFormFields(([fields]) => fields[`${row}.product`]?.value as string | number | undefined);
  const name = useField<string>({ path: `${row}.name` });
  const sku = useField<string>({ path: `${row}.sku` });
  const ean = useField<string>({ path: `${row}.ean` });
  const price = useField<number>({ path: `${row}.priceGross` });
  const vat = useField<number>({ path: `${row}.vatRate` });
  const variant = useField<string>({ path: `${row}.variantLabel` });
  const last = useRef(productId);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    if (!productId || productId === last.current) return;
    last.current = productId;
    setState("loading");
    fetch(`/api/products/${productId}?depth=0`, { credentials: "include" })
      .then((r) => r.json())
      .then((p) => {
        name.setValue(p.name ?? "");
        sku.setValue(p.sku ?? "");
        ean.setValue(p.ean ?? "");
        price.setValue(p.sale?.price && (!p.sale.to || new Date(p.sale.to) > new Date()) ? p.sale.price : p.price);
        vat.setValue(p.vatRate ?? 23);
        if (p.unitLabel) variant.setValue(p.unitLabel);
        setState("done");
      })
      .catch(() => setState("idle"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return (
    <p className={`kc-autofill kc-autofill--${state}`}>
      {state === "loading" ? <Loader2 size={14} className="kc-spin" /> : <Wand2 size={14} />}
      {state === "loading" ? "Pobieram dane produktu…" : state === "done" ? "Uzupełniono nazwę, kody i cenę z karty produktu – możesz je zmienić." : "Wybierz produkt, a nazwa, SKU, EAN i cena uzupełnią się same."}
    </p>
  );
}

// Podsumowanie zamówienia liczone na żywo (przed zapisem) – produkty, dostawa, razem
export function OrderSummary() {
  const { items, count, shipping } = useFormFields(([f]) => {
    const rows = new Map<string, { q: number; p: number }>();
    for (const [k, v] of Object.entries(f)) {
      const m = k.match(/^items\.(\d+)\.(quantity|priceGross)$/);
      if (!m) continue;
      const r = rows.get(m[1]) ?? { q: 0, p: 0 };
      if (m[2] === "quantity") r.q = Number(v?.value ?? 0); else r.p = Number(v?.value ?? 0);
      rows.set(m[1], r);
    }
    return { items: [...rows.values()].reduce((s, r) => s + r.q * r.p, 0), count: rows.size, shipping: Number(f["shipping.price"]?.value ?? 0) };
  });
  return (
    <div className="kc-summary">
      <div><span>Produkty ({count} poz.)</span><b>{pln(items)}</b></div>
      <div><span>Dostawa</span><b>{pln(shipping)}</b></div>
      <div className="kc-summary__total"><span>Razem do zapłaty</span><b>{pln(items + shipping)}</b></div>
    </div>
  );
}
