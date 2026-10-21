"use client";

// Własne komórki list w panelu (produkty, zamówienia): miniatury, ceny, kolorowe statusy.
import Link from "next/link";
import { useEffect, useState } from "react";
import type { DefaultCellComponentProps } from "payload";
import type { IconName } from "@/lib/data";
import { CatIcon } from "@/components/CatIcon";

// Pierwsza kolumna listy jest linkiem do edycji – własne komórki muszą to obsłużyć same
function Cell({ props, children }: { props: DefaultCellComponentProps; children: React.ReactNode }) {
  if (!props.link) return <>{children}</>;
  const href = props.linkURL ?? `/admin/collections/${props.collectionSlug}/${props.rowData?.id}`;
  return <Link href={href} className="kc-cell-link">{children}</Link>;
}

const pln = (n: unknown) =>
  typeof n === "number" ? new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(n) : "—";

const Pill = ({ tone, children }: { tone: string; children: React.ReactNode }) => <span className={`kc-pill kc-pill--${tone}`}>{children}</span>;

export function PriceCell(props: DefaultCellComponentProps) {
  const { cellData } = props;
  return <Cell props={props}><span className="kc-strong" style={{ whiteSpace: "nowrap" }}>{pln(cellData)}</span></Cell>;
}

export function StockCell(props: DefaultCellComponentProps) {
  const { cellData } = props;
  const n = Number(cellData ?? 0);
  return <Cell props={props}><Pill tone={n <= 0 ? "gray" : n < 5 ? "amber" : "green"}>{n <= 0 ? "brak" : `${n} szt.`}</Pill></Cell>;
}

type Img = { url?: string | null; media?: { thumbnailURL?: string | null; url?: string | null } | number | null };

export function ThumbCell(props: DefaultCellComponentProps) {
  const { cellData } = props;
  const first = (cellData as Img[] | undefined)?.[0];
  const media = first && typeof first.media === "object" ? first.media : null;
  const src = media?.thumbnailURL || media?.url || first?.url;
  return (
    <Cell props={props}>
      <span className="kc-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src ? <img src={src} alt="" loading="lazy" /> : <span className="kc-thumb__empty">—</span>}
      </span>
    </Cell>
  );
}

const productStatus: Record<string, [string, string]> = { active: ["Widoczny", "green"], hidden: ["Ukryty", "amber"], archived: ["Wycofany", "gray"] };
export function ProductStatusCell(props: DefaultCellComponentProps) {
  const { cellData } = props;
  const [label, tone] = productStatus[String(cellData)] ?? ["—", "gray"];
  return <Cell props={props}><Pill tone={tone}>{label}</Pill></Cell>;
}

const orderStatus: Record<string, [string, string]> = {
  new: ["Nowe", "blue"], awaiting_payment: ["Czeka na płatność", "amber"], paid: ["Opłacone", "green"],
  processing: ["W realizacji", "violet"], shipped: ["Wysłane", "green"], cancelled: ["Anulowane", "gray"],
};
export function OrderStatusCell(props: DefaultCellComponentProps) {
  const { cellData } = props;
  const [label, tone] = orderStatus[String(cellData)] ?? ["—", "gray"];
  return <Cell props={props}><Pill tone={tone}>{label}</Pill></Cell>;
}

const syncStatus: Record<string, [string, string]> = { pending: ["Czeka", "gray"], sent: ["Wysłane", "green"], error: ["Błąd", "red"], skipped: ["Pominięte", "gray"] };
export function SyncStatusCell(props: DefaultCellComponentProps) {
  const { cellData } = props;
  const [label, tone] = syncStatus[String(cellData)] ?? ["—", "gray"];
  return <Cell props={props}><Pill tone={tone}>{label}</Pill></Cell>;
}

const submissionStatus: Record<string, [string, string]> = { new: ["Nowe", "amber"], in_progress: ["W trakcie", "blue"], done: ["Załatwione", "green"], spam: ["Spam", "gray"] };
export function SubmissionStatusCell(props: DefaultCellComponentProps) {
  const { cellData } = props;
  const [label, tone] = submissionStatus[String(cellData)] ?? ["—", "gray"];
  return <Cell props={props}><Pill tone={tone}>{label}</Pill></Cell>;
}

export function CodeCell(props: DefaultCellComponentProps) {
  return <Cell props={props}><span className="kc-code">{String(props.cellData ?? "")}</span></Cell>;
}

export function ActiveCell(props: DefaultCellComponentProps) {
  return <Cell props={props}><Pill tone={props.cellData ? "green" : "gray"}>{props.cellData ? "Aktywny" : "Wyłączony"}</Pill></Cell>;
}

export function RatingCell(props: DefaultCellComponentProps) {
  const n = Number(props.cellData ?? 0);
  return <Cell props={props}><span className="kc-stars" aria-label={`${n}/5`}>{"★".repeat(n)}<span>{"★".repeat(5 - n)}</span></span></Cell>;
}

const reviewStatus: Record<string, [string, string]> = { pending: ["Do moderacji", "amber"], approved: ["Opublikowana", "green"], rejected: ["Odrzucona", "gray"] };
export function ReviewStatusCell(props: DefaultCellComponentProps) {
  const [label, tone] = reviewStatus[String(props.cellData)] ?? ["—", "gray"];
  return <Cell props={props}><Pill tone={tone}>{label}</Pill></Cell>;
}

export function NewsletterStatusCell(props: DefaultCellComponentProps) {
  const on = props.cellData === "subscribed";
  return <Cell props={props}><Pill tone={on ? "green" : "gray"}>{on ? "Zapisany" : "Wypisany"}</Pill></Cell>;
}

const returnStatus: Record<string, [string, string]> = {
  new: ["Nowe", "amber"], accepted: ["Zaakceptowane", "blue"], received: ["Towar otrzymany", "violet"],
  refunded: ["Zwrócono pieniądze", "green"], rejected: ["Odrzucone", "red"], closed: ["Zamknięte", "gray"],
};
export function ReturnStatusCell(props: DefaultCellComponentProps) {
  const [label, tone] = returnStatus[String(props.cellData)] ?? ["—", "gray"];
  return <Cell props={props}><Pill tone={tone}>{label}</Pill></Cell>;
}

export function ReturnTypeCell(props: DefaultCellComponentProps) {
  const c = props.cellData === "complaint";
  return <Cell props={props}><Pill tone={c ? "red" : "blue"}>{c ? "Reklamacja" : "Zwrot"}</Pill></Cell>;
}

// Kategorie jako drzewo: ikona konturowa, wcięcie podkategorii, znaczek „główna”
export function CategoryNameCell(props: DefaultCellComponentProps) {
  const row = props.rowData as { parent?: unknown; lucide?: IconName | null; depth?: number | null };
  const isRoot = !row?.parent;
  return (
    <Cell props={props}>
      <span className={`kc-catname ${isRoot ? "kc-catname--root" : "kc-catname--child"}`}>
        {!isRoot && <span className="kc-catname__branch" aria-hidden>└</span>}
        <span className="kc-catname__icon">{row?.lucide ? <CatIcon name={row.lucide} className="h-4 w-4" /> : null}</span>
        <span className={isRoot ? "kc-strong" : ""}>{String(props.cellData ?? "")}</span>
        {isRoot && <span className="kc-pill kc-pill--green">główna</span>}
      </span>
    </Cell>
  );
}

export function CountCell(props: DefaultCellComponentProps) {
  const n = Array.isArray(props.cellData) ? props.cellData.length : 0;
  return <Cell props={props}>{n ? <Pill tone="blue">{n} powiązań</Pill> : <span className="kc-muted">—</span>}</Cell>;
}

const alertStatus: Record<string, [string, string]> = { waiting: ["Czeka", "gray"], ready: ["Do powiadomienia", "amber"], notified: ["Powiadomiono", "green"] };
export function AlertStatusCell(props: DefaultCellComponentProps) {
  const [label, tone] = alertStatus[String(props.cellData)] ?? ["—", "gray"];
  return <Cell props={props}><Pill tone={tone}>{label}</Pill></Cell>;
}

// ---------- Listy produktów i zamówień (bogatsze komórki) ----------

type ProductRow = { images?: Img[]; sku?: string | null; ean?: string | null; brand?: string | null; unitLabel?: string | null; sale?: { price?: number | null; from?: string | null; to?: string | null } | null };

const thumbOf = (images?: Img[]) => {
  const first = images?.[0];
  const media = first && typeof first.media === "object" ? first.media : null;
  return media?.thumbnailURL || media?.url || first?.url || "";
};

// Nazwa produktu: miniatura + nazwa + kody pod spodem (zamiast osobnych kolumn zdjęcia i SKU)
export function ProductCell(props: DefaultCellComponentProps) {
  const row = (props.rowData ?? {}) as ProductRow;
  const src = thumbOf(row.images);
  const meta = [row.brand, row.unitLabel, row.sku && `SKU ${row.sku}`, row.ean && `EAN ${row.ean}`].filter(Boolean).join(" · ");
  return (
    <Cell props={props}>
      <span className="kc-prod">
        <span className="kc-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src ? <img src={src} alt="" loading="lazy" /> : <span className="kc-thumb__empty">—</span>}
        </span>
        <span className="kc-prod__text">
          <span className="kc-prod__name">{String(props.cellData ?? "")}</span>
          {meta && <span className="kc-prod__meta">{meta}</span>}
        </span>
      </span>
    </Cell>
  );
}

const saleActive = (s: ProductRow["sale"]) => {
  if (!s?.price) return false;
  const now = Date.now();
  return (!s.from || Date.parse(s.from) <= now) && (!s.to || Date.parse(s.to) >= now);
};

// Cena: w trakcie promocji cena promocyjna + przekreślona regularna
export function ProductPriceCell(props: DefaultCellComponentProps) {
  const row = (props.rowData ?? {}) as ProductRow;
  const onSale = saleActive(row.sale);
  return (
    <Cell props={props}>
      <span className="kc-price">
        <span className={`kc-strong ${onSale ? "kc-price--sale" : ""}`}>{pln(onSale ? row.sale?.price : props.cellData)}</span>
        {onSale && <s>{pln(props.cellData)}</s>}
      </span>
    </Cell>
  );
}

// Nazwy kategorii pobierane raz na całą listę (lista podaje w komórce tylko ID)
let categoryNames: Promise<Map<number, string>> | null = null;
const loadCategoryNames = () =>
  (categoryNames ??= fetch("/api/categories?limit=1000&depth=0&select[name]=true", { credentials: "include" })
    .then((r) => r.json())
    .then((j: { docs?: { id: number; name: string }[] }) => new Map((j.docs ?? []).map((d) => [d.id, d.name])))
    .catch(() => new Map()));

export function CategoryCell(props: DefaultCellComponentProps) {
  const c = props.cellData as { id?: number; name?: string } | number | null | undefined;
  const id = c && typeof c === "object" ? c.id : c;
  const [name, setName] = useState(c && typeof c === "object" ? c.name ?? "" : "");
  useEffect(() => {
    if (name || !id) return;
    let alive = true;
    loadCategoryNames().then((m) => alive && setName(m.get(Number(id)) ?? `#${id}`));
    return () => { alive = false; };
  }, [id, name]);
  return <Cell props={props}>{id ? <span className="kc-tag">{name || "…"}</span> : <span className="kc-muted">—</span>}</Cell>;
}

type OrderRow = {
  orderNumber?: string;
  createdAt?: string;
  email?: string;
  total?: number;
  shipping?: { method?: string | null; fullName?: string | null; company?: string | null; city?: string | null; point?: { code?: string | null } | null } | null;
  invoice?: { wanted?: boolean | null; company?: string | null } | null;
  payment?: { method?: string | null; status?: string | null } | null;
  baselinker?: { syncStatus?: string | null; orderId?: number | null; lastError?: string | null } | null;
  items?: { quantity?: number | null }[] | null;
};
const when = (d?: string) => (d ? new Date(d).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

export function OrderNumberCell(props: DefaultCellComponentProps) {
  const row = (props.rowData ?? {}) as OrderRow;
  const qty = (row.items ?? []).reduce((s, i) => s + Number(i.quantity ?? 0), 0);
  return (
    <Cell props={props}>
      <span className="kc-stack">
        <span className="kc-strong">{String(props.cellData ?? "—")}</span>
        <small>{when(row.createdAt)}{qty ? ` · ${qty} szt.` : ""}</small>
      </span>
    </Cell>
  );
}

export function OrderCustomerCell(props: DefaultCellComponentProps) {
  const row = (props.rowData ?? {}) as OrderRow;
  const name = row.shipping?.fullName || row.shipping?.company || row.email || "—";
  const firm = row.invoice?.wanted && row.invoice.company && row.invoice.company !== name ? row.invoice.company : "";
  return (
    <Cell props={props}>
      <span className="kc-stack">
        <span className="kc-strong">{name}{firm ? <span className="kc-pill kc-pill--blue kc-pill--xs">faktura</span> : null}</span>
        <small>{[firm, row.email !== name ? row.email : "", row.shipping?.city].filter(Boolean).join(" · ")}</small>
      </span>
    </Cell>
  );
}

const payStatus: Record<string, [string, string]> = { pending: ["Czeka na płatność", "amber"], paid: ["Opłacone", "green"], failed: ["Płatność nieudana", "red"], refunded: ["Zwrócone", "gray"], deferred: ["Pobranie / przelew", "blue"] };
export function OrderTotalCell(props: DefaultCellComponentProps) {
  const row = (props.rowData ?? {}) as OrderRow;
  const [label, tone] = payStatus[String(row.payment?.status ?? "")] ?? ["—", "gray"];
  return (
    <Cell props={props}>
      <span className="kc-stack">
        <span className="kc-strong" style={{ whiteSpace: "nowrap" }}>{pln(props.cellData)}</span>
        <span className={`kc-paydot kc-paydot--${tone}`}>{label}</span>
      </span>
    </Cell>
  );
}

// Przewoźnik po kodzie metody dostawy (jak w koszyku): logo + nazwa + punkt odbioru
const carrier = (code: string): [string, string] | null => {
  if (code.startsWith("inpost-paczkomat") || code.includes("paczkomat")) return ["/marks/inpost-paczkomat.svg", "Paczkomat InPost"];
  if (code.startsWith("inpost")) return ["/marks/inpost-kurier.svg", "Kurier InPost"];
  if (code.startsWith("orlen")) return ["/marks/orlen-paczka.png", "ORLEN Paczka"];
  if (code.startsWith("gls")) return ["/marks/gls.svg", "Kurier GLS"];
  return null;
};
export function OrderDeliveryCell(props: DefaultCellComponentProps) {
  const row = (props.rowData ?? {}) as OrderRow;
  const code = row.shipping?.method ?? "";
  const c = carrier(code);
  const cod = code.endsWith("-cod");
  return (
    <Cell props={props}>
      <span className="kc-ship">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {c ? <img src={c[0]} alt="" /> : <span className="kc-ship__none" />}
        <span className="kc-stack">
          <span>{c ? c[1] : code === "pickup" ? "Odbiór osobisty" : code || "—"}</span>
          {(row.shipping?.point?.code || cod) && <small>{[row.shipping?.point?.code, cod && "za pobraniem"].filter(Boolean).join(" · ")}</small>}
        </span>
      </span>
    </Cell>
  );
}

export function OrderIntegrationCell(props: DefaultCellComponentProps) {
  const bl = ((props.rowData ?? {}) as OrderRow).baselinker;
  const [label, tone] = syncStatus[String(bl?.syncStatus ?? "pending")] ?? ["—", "gray"];
  return (
    <Cell props={props}>
      <span className="kc-stack" title={bl?.lastError ?? undefined}>
        <Pill tone={tone}>{label}</Pill>
        {bl?.orderId ? <small>#{bl.orderId}</small> : null}
      </span>
    </Cell>
  );
}
