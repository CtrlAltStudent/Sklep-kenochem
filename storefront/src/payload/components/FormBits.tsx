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

// Etykieta metody dostawy / płatności: logo + nazwa dla klienta + cena + „wyłączona”
const shipLogo = (code = "") =>
  code.includes("paczkomat") ? "/marks/inpost-paczkomat.svg" : code.startsWith("inpost") ? "/marks/inpost-kurier.svg"
    : code.startsWith("orlen") ? "/marks/orlen-paczka.png" : code.startsWith("gls") ? "/marks/gls.svg" : "";

function MethodRow({ logo, label, extra, enabled, rowNumber }: { logo: string; label?: string; extra?: string; enabled?: boolean; rowNumber?: number }) {
  return (
    <span className="kc-rowlabel">
      <span className="kc-rowlabel__no">{String((rowNumber ?? 0) + 1).padStart(2, "0")}</span>
      {/* eslint-disable-next-line @next/next/no-img-element -- logo z public/marks */}
      {logo ? <img className="kc-rowlabel__logo" src={logo} alt="" /> : null}
      <span className="kc-rowlabel__name">{label || "Nowa metoda"}</span>
      {extra ? <span className="kc-rowlabel__price">{extra}</span> : null}
      {enabled === false ? <span className="kc-pill kc-pill--gray">wyłączona</span> : null}
    </span>
  );
}

export function ShippingMethodLabel() {
  const { data, rowNumber } = useRowLabel<{ code?: string; label?: string; price?: number; enabled?: boolean }>();
  const extra = typeof data?.price === "number" ? (data.price ? pln(data.price) : "bezpłatnie") : "";
  return <MethodRow logo={shipLogo(data?.code)} label={data?.label} extra={extra} enabled={data?.enabled} rowNumber={rowNumber} />;
}

export function PaymentMethodLabel() {
  const { data, rowNumber } = useRowLabel<{ code?: string; label?: string; provider?: string; enabled?: boolean }>();
  const logo = data?.provider === "przelewy24" ? "/marks/przelewy24.svg" : data?.code?.includes("blik") ? "/marks/blik.svg" : "";
  return <MethodRow logo={logo} label={data?.label} enabled={data?.enabled} rowNumber={rowNumber} />;
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

const shipName = (code = "") =>
  code.includes("paczkomat") ? "Paczkomat InPost" : code.startsWith("inpost") ? "Kurier InPost" : code.startsWith("orlen") ? "ORLEN Paczka"
    : code.startsWith("gls") ? "Kurier GLS" : code === "pickup" ? "Odbiór osobisty" : code || "—";
const payName = (code = "") => ({ p24: "Przelewy24", transfer: "Przelew tradycyjny", cod: "Za pobraniem", "b2b-term": "Przelew z terminem" })[code] ?? code;

// Pasek boczny zamówienia: najważniejsze informacje w jednym miejscu (bez przełączania zakładek)
const PAY: Record<string, [string, string]> = { pending: ["Czeka na płatność", "amber"], paid: ["Opłacone", "green"], failed: ["Nieudana", "red"], refunded: ["Zwrócona", "gray"], deferred: ["Pobranie / przelew", "blue"] };
const BL: Record<string, [string, string]> = { pending: ["Czeka na wysłanie", "gray"], sent: ["Przekazane", "green"], error: ["Błąd", "red"], skipped: ["Pominięte", "gray"] };

export function OrderSidebar() {
  const v = useFormFields(([f]) => {
    const g = (k: string) => (f[k]?.value ?? "") as string;
    return {
      name: g("shipping.fullName") || g("shipping.company"), email: g("email"), phone: g("phone"),
      street: g("shipping.street"), city: [g("shipping.postcode"), g("shipping.city")].filter(Boolean).join(" "),
      ship: g("shipping.method"), point: g("shipping.point.code"), pointName: g("shipping.point.name"),
      payMethod: g("payment.method"), pay: g("payment.status"), bl: g("baselinker.syncStatus"), blId: f["baselinker.orderId"]?.value as number | undefined,
    };
  });
  const [payLabel, payTone] = PAY[v.pay] ?? ["—", "gray"];
  const [blLabel, blTone] = BL[v.bl || "pending"] ?? ["—", "gray"];
  const logo = shipLogo(v.ship);
  return (
    <div className="kc-ordside">
      <section>
        <h4><User size={15} /> Klient</h4>
        <b>{v.name || "—"}</b>
        {v.email && <a href={`mailto:${v.email}`}>{v.email}</a>}
        {v.phone && <a href={`tel:${v.phone.replace(/\s/g, "")}`}>{v.phone}</a>}
      </section>
      <section>
        <h4><Truck size={15} /> Dostawa</h4>
        <span className="kc-ordside__ship">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo z public/marks */}
          {logo ? <img src={logo} alt="" /> : null}
          <b>{shipName(v.ship)}</b>
        </span>
        {v.point ? <small>Punkt: {v.point}{v.pointName ? ` – ${v.pointName}` : ""}</small> : <small>{[v.street, v.city].filter(Boolean).join(", ")}</small>}
      </section>
      <section>
        <h4><CreditCard size={15} /> Płatność</h4>
        <span className={`kc-pill kc-pill--${payTone}`}>{payLabel}</span>
        <small>{payName(v.payMethod)}{v.ship.endsWith("-cod") ? " · za pobraniem" : ""}</small>
      </section>
      <section>
        <h4><Package size={15} /> BaseLinker</h4>
        <span className={`kc-pill kc-pill--${blTone}`}>{blLabel}</span>
        {v.blId ? <small>ID w BaseLinkerze: {v.blId}</small> : null}
      </section>
    </div>
  );
}

// Pasek boczny produktu: zdjęcie główne, cena (z promocją), stan magazynu
export function ProductSidebar() {
  const v = useFormFields(([f]) => ({
    url: (f["images.0.url"]?.value ?? "") as string,
    media: f["images.0.media"]?.value as number | { url?: string } | undefined,
    price: Number(f.price?.value ?? 0),
    sale: Number(f["sale.price"]?.value ?? 0),
    stock: Number(f.stock?.value ?? 0),
    sku: (f.sku?.value ?? "") as string,
  }));
  const mediaId = typeof v.media === "number" ? v.media : null;
  const [fetched, setFetched] = useState<{ id: number; src: string } | null>(null);
  useEffect(() => {
    if (!mediaId || fetched?.id === mediaId) return;
    fetch(`/api/media/${mediaId}?depth=0`, { credentials: "include" })
      .then((r) => r.json())
      .then((m) => setFetched({ id: mediaId, src: m.sizes?.thumbnail?.url || m.url || "" }))
      .catch(() => setFetched({ id: mediaId, src: "" }));
  }, [mediaId, fetched?.id]);
  const src = (typeof v.media === "object" && v.media?.url) || (mediaId && fetched?.id === mediaId ? fetched.src : "") || v.url;
  return (
    <div className="kc-ordside kc-prodside">
      <div className="kc-prodside__img">
        {/* eslint-disable-next-line @next/next/no-img-element -- podgląd zdjęcia produktu */}
        {src ? <img src={src} alt="" /> : <span>Brak zdjęcia</span>}
      </div>
      <section>
        <h4><Tag size={15} /> Cena</h4>
        {v.sale ? <b className="kc-prodside__sale">{pln(v.sale)} <s>{pln(v.price)}</s></b> : <b>{pln(v.price)}</b>}
      </section>
      <section>
        <h4><Package size={15} /> Magazyn</h4>
        <span className={`kc-pill kc-pill--${v.stock <= 0 ? "gray" : v.stock < 5 ? "amber" : "green"}`}>{v.stock <= 0 ? "brak" : `${v.stock} szt.`}</span>
        {v.sku ? <small>SKU {v.sku}</small> : null}
      </section>
    </div>
  );
}
