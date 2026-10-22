// Menu boczne panelu – własny układ działów zamiast domyślnego menu Payload.
// Moduły integracji są w zakładce Integracje → Moduły (nie w menu – menu zostaje krótkie).

import { NavHamburger, NavWrapper } from "@payloadcms/next/client";
import { Logout } from "@payloadcms/ui";
import type { Payload, SanitizedPermissions, Where } from "payload";
import { navSections, type NavItem } from "@/payload/nav";
import { NavBrand } from "./Branding";
import { NavLinks, type NavLinkData, type NavSectionData } from "./NavLinks";

type Props = { payload: Payload; permissions?: SanitizedPermissions; user?: { roles?: string[] | null } | null };

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
  const isAdmin = Boolean(user?.roles?.includes("admin"));

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
          <Logout />
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
