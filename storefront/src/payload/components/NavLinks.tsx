"use client";

// Linki menu bocznego: działy zwijane kliknięciem (zapamiętane w przeglądarce), podświetlenie bieżącej strony.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type NavLinkData = {
  id: string;
  label: string;
  href: string;
  exact?: boolean;
  also?: string[];
  logo?: string;
  off?: boolean; // moduł wyłączony
  badge?: { count: number; tone: "red" | "amber" };
};
export type NavSectionData = { label: string; items: NavLinkData[] };

const KEY = "kc-nav-closed";
const matches = (path: string, href: string, exact?: boolean) => (exact ? path === href : path === href || path.startsWith(`${href}/`));

export function NavLinks({ sections }: { sections: NavSectionData[] }) {
  const path = usePathname() ?? "";
  const [closed, setClosed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- odczyt z localStorage dopiero po stronie przeglądarki
      if (Array.isArray(saved)) setClosed(saved);
    } catch {
      /* brak dostępu do localStorage – wszystkie działy otwarte */
    }
  }, []);

  const toggle = (label: string) => {
    const next = closed.includes(label) ? closed.filter((l) => l !== label) : [...closed, label];
    setClosed(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* bez zapamiętania */
    }
  };

  return (
    <div className="kc-nav__sections">
      {sections.map((s) => {
        const active = s.items.some((i) => matches(path, i.href, i.exact) || i.also?.some((a) => matches(path, a)));
        const isClosed = closed.includes(s.label) && !active;
        return (
          <div key={s.label} className={`kc-nav__section ${isClosed ? "is-closed" : ""}`}>
            <button type="button" className="kc-nav__toggle" aria-expanded={!isClosed} onClick={() => toggle(s.label)}>
              {s.label}
              <span aria-hidden>▾</span>
            </button>
            {!isClosed && (
              <div className="kc-nav__items">
                {s.items.map((i) => {
                  const on = matches(path, i.href, i.exact) || Boolean(i.also?.some((a) => matches(path, a)));
                  return (
                    <Link
                      key={i.id}
                      id={i.id}
                      href={i.href}
                      prefetch={false}
                      aria-current={on ? "page" : undefined}
                      className={`nav__link ${i.logo ? "kc-nav__mod" : ""} ${i.off ? "is-off" : ""} ${on ? "is-active" : ""}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- małe logo modułu */}
                      {i.logo && <img src={i.logo} alt="" />}
                      {!i.logo && i.id.startsWith("nav-mod-") && <b className="kc-nav__modmark">{i.label.slice(0, 2).toUpperCase()}</b>}
                      <span className="nav__link-label">{i.label}</span>
                      {i.off && <small className="kc-nav__state">wył.</small>}
                      {i.badge && <span className={`kc-nav__badge is-${i.badge.tone}`}>{i.badge.count > 99 ? "99+" : i.badge.count}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
