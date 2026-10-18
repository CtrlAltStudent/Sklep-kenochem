"use client";

// Własne komórki list w panelu (produkty, zamówienia): miniatury, ceny, kolorowe statusy.
import Link from "next/link";
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
  processing: ["W realizacji", "violet"], cancelled: ["Anulowane", "gray"],
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
