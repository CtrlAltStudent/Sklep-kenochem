"use client";

// Podgląd zamówienia i produktu w stylu BaseLinkera: dane ułożone w kartach, bez otwartych pól.
// Każda karta ma „Edytuj” – wtedy pokazujemy zwykły formularz Payload na właściwej zakładce.
// Tryb widoku ustawiamy atrybutami na <html> (data-kc-view / data-kc-edit) – CSS chowa formularz (custom.scss).

import { useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { useCallback, useEffect, useState } from "react";
import {
  Banknote, ExternalLink, FileText, ImageIcon, MapPin, MessageSquareText, Package, Pencil, Receipt, ShieldAlert, Store, Tag, Truck, User,
} from "lucide-react";

type Fields = Record<string, { value?: unknown } | undefined>;
const pln = (n: unknown) => `${Number(n ?? 0).toFixed(2).replace(".", ",")} zł`;
const when = (d: unknown) => (d ? new Date(String(d)).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
const str = (f: Fields, k: string) => (f[k]?.value == null ? "" : String(f[k]!.value));
const num = (f: Fields, k: string) => Number(f[k]?.value ?? 0);

// Wiersze tablicy (np. items.0.name, items.1.name…)
function rows(f: Fields, prefix: string, keys: string[]) {
  const out = new Map<number, Record<string, unknown>>();
  for (const [k, v] of Object.entries(f)) {
    const m = k.match(new RegExp(`^${prefix}\\.(\\d+)\\.(.+)$`));
    if (!m || !keys.includes(m[2])) continue;
    const r = out.get(Number(m[1])) ?? {};
    r[m[2]] = v?.value;
    out.set(Number(m[1]), r);
  }
  return [...out.entries()].sort(([a], [b]) => a - b).map(([, r]) => r);
}

// ---------- Tryb widoku / edycji ----------

function useViewMode(kind: "order" | "product", isNew: boolean) {
  const [editing, setEditing] = useState(isNew);
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.kcView = kind;
    return () => { delete html.dataset.kcView; delete html.dataset.kcEdit; };
  }, [kind]);
  useEffect(() => {
    const html = document.documentElement;
    if (editing) html.dataset.kcEdit = "1";
    else delete html.dataset.kcEdit;
  }, [editing]);

  const edit = useCallback((tab?: string) => {
    setEditing(true);
    // po pokazaniu formularza: przełącz na właściwą zakładkę i przewiń do niej
    setTimeout(() => {
      if (tab) [...document.querySelectorAll<HTMLButtonElement>(".tabs-field__tab-button")].find((b) => b.textContent?.trim() === tab)?.click();
      document.querySelector(".kc-ov__editbar")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  }, []);
  const done = useCallback(() => {
    setEditing(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  return { editing, edit, done };
}

function Card({ title, icon, onEdit, children, wide }: { title: string; icon: React.ReactNode; onEdit?: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <section className={`kc-ov__card ${wide ? "is-wide" : ""}`}>
      <header>
        <h3>{icon}{title}</h3>
        {onEdit && <button type="button" onClick={onEdit} className="kc-ov__edit"><Pencil size={13} /> Edytuj</button>}
      </header>
      <div className="kc-ov__body">{children}</div>
    </section>
  );
}

const Row = ({ k, children }: { k: string; children: React.ReactNode }) =>
  children === "" || children == null ? null : <div className="kc-ov__row"><span>{k}</span><b>{children}</b></div>;

function EditBar({ onDone, what }: { onDone: () => void; what: string }) {
  return (
    <div className="kc-ov__editbar">
      <span><Pencil size={15} /> Edytujesz {what}. Zmiany zapisz przyciskiem <b>Zapisz</b> u góry.</span>
      <button type="button" onClick={onDone}>Zakończ edycję</button>
    </div>
  );
}

// Nazwy metod dostawy i płatności z Ustawień sklepu (raz na sesję)
let storeLabels: Promise<{ ship: Record<string, string>; pay: Record<string, string> }> | null = null;
const loadLabels = () =>
  (storeLabels ??= fetch("/api/globals/store-settings?depth=0", { credentials: "include" })
    .then((r) => r.json())
    .then((s: { shippingMethods?: { code: string; label: string }[]; paymentMethods?: { code: string; label: string }[] }) => ({
      ship: Object.fromEntries((s.shippingMethods ?? []).map((m) => [m.code, m.label])),
      pay: Object.fromEntries((s.paymentMethods ?? []).map((m) => [m.code, m.label])),
    }))
    .catch(() => ({ ship: {}, pay: {} })));

function useLabels() {
  const [l, setL] = useState<{ ship: Record<string, string>; pay: Record<string, string> }>({ ship: {}, pay: {} });
  useEffect(() => { let alive = true; loadLabels().then((x) => alive && setL(x)); return () => { alive = false; }; }, []);
  return l;
}

const shipLogo = (code = "") =>
  code.includes("paczkomat") ? "/marks/inpost-paczkomat.svg" : code.startsWith("inpost") ? "/marks/inpost-kurier.svg"
    : code.startsWith("orlen") ? "/marks/orlen-paczka.png" : code.startsWith("gls") ? "/marks/gls.svg" : "";

const ORDER_STATUS: Record<string, [string, string]> = {
  new: ["Nowe", "blue"], awaiting_payment: ["Czeka na płatność", "amber"], paid: ["Opłacone", "green"],
  processing: ["W realizacji", "violet"], shipped: ["Wysłane", "green"], cancelled: ["Anulowane", "gray"],
};
const PAY_STATUS: Record<string, [string, string]> = {
  pending: ["Czeka na wpłatę", "amber"], paid: ["Opłacone", "green"], failed: ["Nieudana", "red"], refunded: ["Zwrócona", "gray"], deferred: ["Przy odbiorze / odroczona", "blue"],
};
const BL_STATUS: Record<string, [string, string]> = { pending: ["Czeka na wysłanie", "gray"], sent: ["Przekazane", "green"], error: ["Błąd", "red"], skipped: ["Pominięte", "gray"] };
const Pill = ({ m, v }: { m: Record<string, [string, string]>; v: string }) => {
  const [l, t] = m[v] ?? [v || "—", "gray"];
  return <span className={`kc-pill kc-pill--${t}`}>{l}</span>;
};

// ---------- Zamówienie ----------

type Parcel = { number: string; courier: string; status: string; url: string };

export function OrderOverview() {
  const { id } = useDocumentInfo();
  const { editing, edit, done } = useViewMode("order", !id);
  const f = useFormFields(([fields]) => fields) as Fields;
  const labels = useLabels();
  const [parcels, setParcels] = useState<Parcel[] | null>(null);
  const blId = num(f, "baselinker.orderId");

  useEffect(() => {
    if (!id || !blId) return;
    let alive = true;
    fetch(`/api/baselinker/order-packages/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => alive && setParcels(j.packages ?? []))
      .catch(() => alive && setParcels([]));
    return () => { alive = false; };
  }, [id, blId]);

  if (editing) return id ? <EditBar onDone={done} what="zamówienie" /> : null;

  const items = rows(f, "items", ["name", "sku", "ean", "quantity", "priceGross", "vatRate", "variantLabel"]);
  const subtotal = items.reduce((s, i) => s + Number(i.quantity ?? 0) * Number(i.priceGross ?? 0), 0);
  const shipPrice = num(f, "shipping.price");
  const ship = str(f, "shipping.method");
  const payMethod = str(f, "payment.method");
  const logo = shipLogo(ship);
  const point = str(f, "shipping.point.code");
  const invoice = Boolean(f["invoice.wanted"]?.value);

  return (
    <div className="kc-ov">
      <div className="kc-ov__head">
        <div>
          <div className="kc-ov__title"><Receipt size={20} /> {str(f, "orderNumber") || "Nowe zamówienie"} <Pill m={ORDER_STATUS} v={str(f, "status")} /></div>
          <p>{when(f.createdAt?.value)} · {items.reduce((s, i) => s + Number(i.quantity ?? 0), 0)} szt.</p>
        </div>
        <div className="kc-ov__total">
          <b>{pln(subtotal + shipPrice)}</b>
          <Pill m={PAY_STATUS} v={str(f, "payment.status")} />
        </div>
      </div>

      <div className="kc-ov__grid">
        <div className="kc-ov__col">
          <Card title="Produkty" icon={<Package size={16} />} onEdit={() => edit("Produkty")} wide>
            <table className="kc-ov__table">
              <thead><tr><th>Produkt</th><th>Ilość</th><th>Cena</th><th>VAT</th><th>Wartość</th></tr></thead>
              <tbody>
                {items.map((i, n) => (
                  <tr key={n}>
                    <td><b>{String(i.name ?? "")}</b><small>{[i.variantLabel, i.sku && `SKU ${i.sku}`, i.ean && `EAN ${i.ean}`].filter(Boolean).join(" · ")}</small></td>
                    <td>{Number(i.quantity ?? 0)} szt.</td>
                    <td>{pln(i.priceGross)}</td>
                    <td>{Number(i.vatRate ?? 23)}%</td>
                    <td><b>{pln(Number(i.quantity ?? 0) * Number(i.priceGross ?? 0))}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="kc-ov__sum">
              <Row k="Produkty">{pln(subtotal)}</Row>
              <Row k="Dostawa">{shipPrice ? pln(shipPrice) : "gratis"}</Row>
              <div className="kc-ov__row is-total"><span>Razem</span><b>{pln(subtotal + shipPrice)}</b></div>
            </div>
          </Card>
          <Card title="Uwagi" icon={<MessageSquareText size={16} />} onEdit={() => edit("Produkty")}>
            {str(f, "customerNote") || str(f, "adminNote") ? (
              <>
                {str(f, "customerNote") && <p className="kc-ov__note"><span>Od klienta</span>{str(f, "customerNote")}</p>}
                {str(f, "adminNote") && <p className="kc-ov__note"><span>Notatka wewnętrzna</span>{str(f, "adminNote")}</p>}
              </>
            ) : <p className="kc-ov__muted">Brak uwag.</p>}
          </Card>
        </div>

        <div className="kc-ov__col">
          <Card title="Klient" icon={<User size={16} />} onEdit={() => edit("Klient i dostawa")}>
            <p className="kc-ov__strong">{str(f, "shipping.fullName") || str(f, "shipping.company") || "—"}</p>
            {str(f, "email") && <a href={`mailto:${str(f, "email")}`}>{str(f, "email")}</a>}
            {str(f, "phone") && <a href={`tel:${str(f, "phone").replace(/\s/g, "")}`}>{str(f, "phone")}</a>}
            {f.customer?.value ? <p className="kc-ov__muted">Klient ma konto w sklepie</p> : <p className="kc-ov__muted">Zakup bez konta</p>}
          </Card>
          <Card title="Dostawa" icon={<Truck size={16} />} onEdit={() => edit("Klient i dostawa")}>
            <div className="kc-ov__ship">
              {/* eslint-disable-next-line @next/next/no-img-element -- logo przewoźnika z public/marks */}
              {logo ? <img src={logo} alt="" /> : <Store size={20} />}
              <span><b>{labels.ship[ship] ?? ship}</b><small>{shipPrice ? pln(shipPrice) : "gratis"}</small></span>
            </div>
            {point ? (
              <p className="kc-ov__addr"><MapPin size={14} /> Punkt <b>{point}</b>{str(f, "shipping.point.address") ? ` – ${str(f, "shipping.point.address")}, ${str(f, "shipping.point.postcode")} ${str(f, "shipping.point.city")}` : ""}</p>
            ) : (
              <p className="kc-ov__addr"><MapPin size={14} /> {[str(f, "shipping.street"), [str(f, "shipping.postcode"), str(f, "shipping.city")].filter(Boolean).join(" ")].filter(Boolean).join(", ") || "—"}</p>
            )}
          </Card>
          <Card title={invoice ? "Faktura" : "Dokument sprzedaży"} icon={<FileText size={16} />} onEdit={() => edit("Klient i dostawa")}>
            {invoice ? (
              <>
                <p className="kc-ov__strong">{str(f, "invoice.company")}</p>
                <Row k="NIP">{str(f, "invoice.nip")}</Row>
                <p className="kc-ov__muted">{[str(f, "invoice.street"), [str(f, "invoice.postcode"), str(f, "invoice.city")].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</p>
              </>
            ) : <p className="kc-ov__muted">Paragon – klient nie prosił o fakturę.</p>}
          </Card>
          <Card title="Płatność" icon={<Banknote size={16} />} onEdit={() => edit("Płatność")}>
            <Row k="Metoda">{labels.pay[payMethod] ?? payMethod}</Row>
            <Row k="Status"><Pill m={PAY_STATUS} v={str(f, "payment.status")} /></Row>
            <Row k="Opłacono">{when(f["payment.paidAt"]?.value)}</Row>
            <Row k="Transakcja P24">{str(f, "payment.transactionId")}</Row>
          </Card>
          <Card title="Przesyłki i BaseLinker" icon={<Package size={16} />} onEdit={id ? () => edit("BaseLinker") : undefined}>
            <Row k="BaseLinker"><Pill m={BL_STATUS} v={str(f, "baselinker.syncStatus") || "pending"} /></Row>
            <Row k="ID w BaseLinkerze">{blId ? String(blId) : ""}</Row>
            {str(f, "baselinker.lastError") && <p className="kc-ov__warn">{str(f, "baselinker.lastError")}</p>}
            {parcels?.map((p) => (
              <a key={p.number} href={p.url || undefined} target="_blank" rel="noreferrer" className="kc-ov__parcel">
                <Truck size={15} /> <span><b>{p.courier}</b> {p.number}<small>{p.status}</small></span>{p.url && <ExternalLink size={13} />}
              </a>
            ))}
            {blId > 0 && parcels && !parcels.length && <p className="kc-ov__muted">Paczka jeszcze nie nadana.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------- Produkt ----------

type Media = { id: number; url?: string; sizes?: { thumbnail?: { url?: string } } };

export function ProductOverview() {
  const { id } = useDocumentInfo();
  const { editing, edit, done } = useViewMode("product", !id);
  const f = useFormFields(([fields]) => fields) as Fields;
  const [media, setMedia] = useState<Record<number, string>>({});
  const [category, setCategory] = useState("");
  const [moreDesc, setMoreDesc] = useState(false);
  const [now] = useState(() => Date.now()); // „teraz” do sprawdzenia, czy promocja trwa

  const images = rows(f, "images", ["media", "url"]);
  const mediaIds = images.map((i) => (typeof i.media === "object" ? (i.media as Media | null)?.id : i.media)).filter((x): x is number => typeof x === "number");
  const mediaKey = mediaIds.join(",");
  const catId = f.category?.value as number | { id?: number; name?: string } | undefined;

  useEffect(() => {
    if (!mediaKey) return;
    let alive = true;
    fetch(`/api/media?limit=50&depth=0&where[id][in]=${mediaKey}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j: { docs?: Media[] }) => alive && setMedia(Object.fromEntries((j.docs ?? []).map((m) => [m.id, m.sizes?.thumbnail?.url || m.url || ""]))))
      .catch(() => {});
    return () => { alive = false; };
  }, [mediaKey]);
  useEffect(() => {
    const cid = typeof catId === "object" ? catId?.id : catId;
    if (!cid) return;
    let alive = true;
    fetch(`/api/categories/${cid}?depth=0`, { credentials: "include" }).then((r) => r.json()).then((c) => alive && setCategory(c.name ?? "")).catch(() => {});
    return () => { alive = false; };
  }, [catId]);

  if (editing) return id ? <EditBar onDone={done} what="produkt" /> : null;

  const srcs = images.map((i) => (typeof i.media === "number" ? media[i.media] : (i.media as Media | null)?.url) || String(i.url ?? "")).filter(Boolean);
  const price = num(f, "price");
  const salePrice = num(f, "sale.price");
  const saleFrom = f["sale.from"]?.value, saleTo = f["sale.to"]?.value;
  const onSale = salePrice > 0 && (!saleFrom || Date.parse(String(saleFrom)) <= now) && (!saleTo || Date.parse(String(saleTo)) >= now);
  const stock = num(f, "stock");
  const desc = str(f, "descriptionHtml");
  const picto = (f.hazardPictograms?.value as string[] | undefined) ?? [];
  const keep = ["name", "description", "images", "category", "price"].filter((k) => f[`keep.${k}`]?.value);
  const slug = str(f, "slug");

  return (
    <div className="kc-ov">
      <div className="kc-ov__head">
        <div>
          <div className="kc-ov__title"><Package size={20} /> {str(f, "name") || "Nowy produkt"}</div>
          <p>{[str(f, "brand"), category, str(f, "unitLabel")].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="kc-ov__actions">
          {slug && <a href={`/produkt/${slug}`} target="_blank" rel="noreferrer" className="kc-ov__btn"><ExternalLink size={14} /> Zobacz w sklepie</a>}
          <button type="button" className="kc-ov__btn is-primary" onClick={() => edit("Dane podstawowe")}><Pencil size={14} /> Edytuj nazwę i opis</button>
        </div>
      </div>

      <div className="kc-ov__grid">
        <div className="kc-ov__col">
          <Card title="Zdjęcia" icon={<ImageIcon size={16} />} onEdit={() => edit("Zdjęcia")} wide>
            {srcs.length ? (
              <div className="kc-ov__gallery">
                {/* eslint-disable-next-line @next/next/no-img-element -- miniatury zdjęć produktu */}
                {srcs.map((s, n) => <img key={n} src={s} alt="" className={n === 0 ? "is-main" : ""} />)}
              </div>
            ) : <p className="kc-ov__muted">Brak zdjęć.</p>}
          </Card>
          <Card title="Opis" icon={<FileText size={16} />} onEdit={() => edit("Dane podstawowe")} wide>
            {str(f, "shortDescription") && <p className="kc-ov__lead">{str(f, "shortDescription")}</p>}
            {desc ? (
              <>
                <div className={`kc-desc kc-ov__desc ${moreDesc ? "is-open" : ""}`} dangerouslySetInnerHTML={{ __html: desc }} />
                <button type="button" className="kc-ov__more" onClick={() => setMoreDesc(!moreDesc)}>{moreDesc ? "Zwiń opis" : "Pokaż cały opis"}</button>
              </>
            ) : <p className="kc-ov__muted">Brak opisu.</p>}
          </Card>
        </div>

        <div className="kc-ov__col">
          <Card title="Cena" icon={<Tag size={16} />} onEdit={() => edit("Ceny i magazyn")}>
            <div className="kc-ov__price">
              <b className={onSale ? "is-sale" : ""}>{pln(onSale ? salePrice : price)}</b>
              {onSale && <s>{pln(price)}</s>}
            </div>
            {salePrice > 0 && <Row k="Promocja">{`${pln(salePrice)}${saleFrom || saleTo ? ` (${saleFrom ? `od ${when(saleFrom).slice(0, 10)}` : ""}${saleTo ? ` do ${when(saleTo).slice(0, 10)}` : ""})` : ""}`}</Row>}
            <Row k="Cena B2B">{num(f, "priceB2B") ? pln(num(f, "priceB2B")) : ""}</Row>
            <Row k="Przekreślona">{num(f, "oldPrice") ? pln(num(f, "oldPrice")) : ""}</Row>
            <Row k="Najniższa z 30 dni">{num(f, "lowestPrice30d") ? pln(num(f, "lowestPrice30d")) : ""}</Row>
            <Row k="VAT">{`${num(f, "vatRate") || 23}%`}</Row>
          </Card>
          <Card title="Magazyn" icon={<Package size={16} />} onEdit={() => edit("Ceny i magazyn")}>
            <Row k="Stan"><span className={`kc-pill kc-pill--${stock <= 0 ? "gray" : stock < 5 ? "amber" : "green"}`}>{stock <= 0 ? "brak" : `${stock} szt.`}</span></Row>
            <Row k="SKU">{str(f, "sku")}</Row>
            <Row k="EAN">{str(f, "ean")}</Row>
            <Row k="Wariant">{str(f, "unitLabel")}</Row>
            <Row k="Waga">{num(f, "weight") ? `${num(f, "weight")} kg` : ""}</Row>
          </Card>
          <Card title="Bezpieczeństwo (CLP)" icon={<ShieldAlert size={16} />} onEdit={() => edit("Bezpieczeństwo (CLP/GPSR)")}>
            {picto.length ? (
              <div className="kc-ov__ghs">
                {/* eslint-disable-next-line @next/next/no-img-element -- piktogramy GHS z public/ghs */}
                {picto.map((p) => <img key={p} src={`/ghs/${p}.svg`} alt={p} title={p} />)}
              </div>
            ) : <p className="kc-ov__muted">Brak piktogramów.</p>}
            <Row k="Hasło">{({ warning: "Uwaga", danger: "Niebezpieczeństwo" } as Record<string, string>)[str(f, "signalWord")] ?? ""}</Row>
            <Row k="Karta charakterystyki">{f.sds?.value ? "dodana" : ""}</Row>
          </Card>
          <Card title="BaseLinker" icon={<Package size={16} />} onEdit={() => edit("BaseLinker")}>
            <Row k="ID w BaseLinkerze">{str(f, "baselinkerId")}</Row>
            <Row k="Ostatnia synchronizacja">{when(f.lastSyncedAt?.value)}</Row>
            <Row k="Nie nadpisuj">{keep.length ? keep.map((k) => ({ name: "nazwy", description: "opisu", images: "zdjęć", category: "kategorii", price: "ceny" } as Record<string, string>)[k]).join(", ") : ""}</Row>
          </Card>
          <Card title="SEO" icon={<FileText size={16} />} onEdit={() => edit("SEO")}>
            <p className="kc-ov__seo-title">{str(f, "seo.title") || str(f, "name")}</p>
            <p className="kc-ov__muted">{str(f, "seo.description") || str(f, "shortDescription") || "Brak opisu dla Google."}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
