// Menu boczne panelu – własny układ działów zamiast domyślnego menu Payload.
// Moduły integracji są w zakładce Integracje → Moduły (nie w menu – menu zostaje krótkie).

import { NavHamburger, NavWrapper } from "@payloadcms/next/client";
import type { Payload, SanitizedPermissions, Where } from "payload";
import { isAdminUser } from "@/payload/access";
import { navSections, type NavItem } from "@/payload/nav";
import { NavBrand } from "./Branding";
import { NavLinks, type NavLinkData, type NavSectionData } from "./NavLinks";

type Props = { payload: Payload; permissions?: SanitizedPermissions; user?: { id?: number | string; roles?: string[] | null } | null };

const canSee = (item: NavItem, permissions: SanitizedPermissions | undefined, isAdmin: boolean) => {
  if (item.adminOnly && !isAdmin) return false;
  if (item.collection) return Boolean(permissions?.collections?.[item.collection]?.read);
  if (item.global) return Boolean(permissions?.globals?.[item.global]?.read);
  return true;
};

async function badge(payload: Payload, item: NavItem) {
  if (!item.badge) return undefined;
  try {
    const { totalDocs } = await payload.count({ collection: item.badge.collection as never, where: item.badge.where as Where, overrideAccess: true });
    return totalDocs ? { count: totalDocs, tone: item.badge.tone } : undefined;
  } catch {
    return undefined;
  }
}

export async function Nav({ payload, permissions, user }: Props) {
  const isAdmin = isAdminUser(user);

  const sections: NavSectionData[] = [];
  for (const section of navSections) {
    const items: NavLinkData[] = [];
    for (const item of section.items) {
      if (!canSee(item, permissions, isAdmin)) continue;
      items.push({ id: item.id, label: item.label, href: item.href, exact: item.exact, also: item.also, badge: await badge(payload, item) });
    }
    if (items.length) sections.push({ label: section.label, items });
  }

  return (
    <NavWrapper baseClass="nav">
      <nav className="nav__wrap kc-nav">
        <NavBrand />
        <NavLinks sections={sections} />
        <div className="nav__controls">
          <a className="nav__log-out kc-logout" href="/api/users/wyjscie" title="Wyloguj">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Wyloguj
          </a>
        </div>
      </nav>
      <div className="nav__header">
        <div className="nav__header-content">
          <NavHamburger baseClass="nav" />
        </div>
      </div>
    </NavWrapper>
  );
}
