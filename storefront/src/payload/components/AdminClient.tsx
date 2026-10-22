"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFormFields, useTheme } from "@payloadcms/ui";
import { ExternalLink, FileText, Moon, Package, Plus, Receipt, Search, ShoppingBag, Store, Sun, Tag, User } from "lucide-react";

// ---------- Pasek akcji w nagłówku panelu (jak w Shoperze: szukaj + szybkie dodawanie + sklep) ----------

type Hit = { id: string | number; title: string; sub?: string };
type Group = { slug: string; label: string; icon: typeof Package; hits: Hit[] };

const sources: { slug: string; label: string; icon: typeof Package; fields: string[]; title: (d: Record<string, unknown>) => string; sub?: (d: Record<string, unknown>) => string }[] = [
  { slug: "orders", label: "Zamówienia", icon: Receipt, fields: ["orderNumber", "email", "shipping.fullName"], title: (d) => String(d.orderNumber ?? ""), sub: (d) => `${d.email ?? ""} · ${Number(d.total ?? 0).toFixed(2)} zł` },
  { slug: "products", label: "Produkty", icon: Package, fields: ["name", "sku", "ean"], title: (d) => String(d.name ?? ""), sub: (d) => [d.sku, d.price ? `${Number(d.price).toFixed(2)} zł` : ""].filter(Boolean).join(" · ") },
  { slug: "customers", label: "Klienci", icon: User, fields: ["email", "lastName", "b2b.company"], title: (d) => String(d.email ?? ""), sub: (d) => [d.firstName, d.lastName].filter(Boolean).join(" ") },
];

async function searchAll(q: string, signal: AbortSignal): Promise<Group[]> {
  return Promise.all(sources.map(async (s) => {
    const p = new URLSearchParams({ limit: "5", depth: "0" });
    s.fields.forEach((f, i) => p.set(`where[or][${i}][${f}][like]`, q));
    try {
      const res = await fetch(`/api/${s.slug}?${p}`, { credentials: "include", signal });
      const json = res.ok ? await res.json() : { docs: [] };
      return { slug: s.slug, label: s.label, icon: s.icon, hits: (json.docs ?? []).map((d: Record<string, unknown>) => ({ id: d.id as string, title: s.title(d), sub: s.sub?.(d) })) };
    } catch {
      return { slug: s.slug, label: s.label, icon: s.icon, hits: [] };
    }
  }));
}

const quickAdd = [
  { href: "/admin/collections/products/create", label: "Produkt", icon: Package },
  { href: "/admin/collections/orders/create", label: "Zamówienie ręczne", icon: Receipt },
  { href: "/admin/collections/coupons/create", label: "Kod rabatowy", icon: Tag },
  { href: "/admin/collections/customers/create", label: "Klient", icon: User },
  { href: "/admin/collections/pages/create", label: "Strona", icon: FileText },
];

export function AdminActions() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [active, setActive] = useState(0);

  // Ctrl+K / Cmd+K – fokus na wyszukiwarce
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); input.current?.focus(); setOpen(true); }
      if (e.key === "Escape") { setOpen(false); setAddOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => { searchAll(q.trim(), ctrl.signal).then((g) => { setGroups(g); setActive(0); }); }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  const shown = q.trim().length < 2 ? [] : groups;
  const flat = shown.flatMap((g) => g.hits.map((h) => ({ href: `/admin/collections/${g.slug}/${h.id}`, ...h })));
  const go = (href: string) => { setOpen(false); setQ(""); router.push(href); };

  return (
    <div className="kc-actions">
      <div className="kc-search" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
        <Search className="kc-search__icon" size={16} />
        <input ref={input} value={q} placeholder="Szukaj zamówień, produktów, klientów…" aria-label="Szukaj w panelu"
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === "Enter" && flat[active]) go(flat[active].href);
          }} />
        <kbd className="kc-search__kbd">Ctrl K</kbd>
        {open && q.trim().length >= 2 && (
          <div className="kc-search__panel" role="listbox">
            {flat.length === 0 && <p className="kc-search__empty">Brak wyników dla „{q}”</p>}
            {shown.filter((g) => g.hits.length).map((g) => {
              const Icon = g.icon;
              return (
                <div key={g.slug} className="kc-search__group">
                  <p className="kc-search__label">{g.label}</p>
                  {g.hits.map((h) => {
                    const href = `/admin/collections/${g.slug}/${h.id}`;
                    const i = flat.findIndex((f) => f.href === href);
                    return (
                      <button key={href} type="button" className={`kc-search__hit${i === active ? " is-active" : ""}`}
                        onMouseEnter={() => setActive(i)} onClick={() => go(href)}>
                        <Icon size={16} />
                        <span><b>{h.title}</b>{h.sub && <small>{h.sub}</small>}</span>
                      </button>
                    );
                  })}
                  <Link className="kc-search__all" href={`/admin/collections/${g.slug}?search=${encodeURIComponent(q.trim())}`} onClick={() => setOpen(false)}>
                    Wszystkie w „{g.label}” →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="kc-add" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setAddOpen(false); }}>
        <button type="button" className="kc-add__btn" onClick={() => setAddOpen((o) => !o)} aria-expanded={addOpen}>
          <Plus size={16} /> Dodaj
        </button>
        {addOpen && (
          <div className="kc-add__menu">
            {quickAdd.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setAddOpen(false)}><Icon size={16} /> {label}</Link>
            ))}
          </div>
        )}
      </div>

      <ThemeSwitch />

      <a href="/" target="_blank" rel="noreferrer" className="kc-store-link" title="Otwórz sklep w nowej karcie">
        <Store size={16} /> <span>Sklep</span> <ExternalLink size={12} />
      </a>
    </div>
  );
}

// Jasny / ciemny motyw panelu (zapamiętywany przez Payload dla tej przeglądarki)
function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button type="button" className="kc-theme" onClick={() => setTheme(dark ? "light" : "dark")} title={dark ? "Włącz jasny motyw" : "Włącz ciemny motyw"} aria-label={dark ? "Włącz jasny motyw" : "Włącz ciemny motyw"}>
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

// ---------- Zakładki statusów nad listą (Wszystkie / Nowe / Opłacone …) ----------

export type StatusTab = { label: string; where?: [field: string, op: string, value: string][]; count: number; tone?: "green" | "amber" | "red" | "navy" | "slate" };

const encodeWhere = (where?: StatusTab["where"]) => {
  if (!where) return "";
  const p = new URLSearchParams();
  where.forEach(([field, op, v], i) => p.set(`where[or][0][and][${i}][${field}][${op}]`, v));
  return p.toString();
};

export function TabsBar({ slug, tabs }: { slug: string; tabs: StatusTab[] }) {
  const sp = useSearchParams();
  const current = new URLSearchParams([...sp.entries()].filter(([k]) => k.startsWith("where["))).toString();
  return (
    <nav className="kc-tabs" aria-label="Filtruj według statusu">
      {tabs.map((t) => {
        const qs = encodeWhere(t.where);
        const isActive = decodeURIComponent(qs) === decodeURIComponent(current);
        return (
          <Link key={t.label} href={`/admin/collections/${slug}${qs ? `?${qs}` : ""}`} className={`kc-tabs__tab${isActive ? " is-active" : ""}`}>
            {t.tone && <span className={`kc-tabs__dot kc-tabs__dot--${t.tone}`} />}
            {t.label}
            <span className="kc-tabs__count">{t.count.toLocaleString("pl-PL")}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ---------- „Zobacz w sklepie” w widoku edycji produktu ----------

export function ViewProductInStore() {
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined);
  if (!slug) return null;
  return (
    <a href={`/produkt/${slug}`} target="_blank" rel="noreferrer" className="kc-view-store">
      <ShoppingBag size={15} /> Zobacz w sklepie
    </a>
  );
}

export function ViewPageInStore() {
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined);
  if (!slug) return null;
  return (
    <a href={`/${slug}`} target="_blank" rel="noreferrer" className="kc-view-store">
      <ShoppingBag size={15} /> Zobacz w sklepie
    </a>
  );
}
