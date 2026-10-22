// Obudowa własnych ekranów panelu (Raporty, Integracje): szablon Payload z menu bocznym i nagłówkiem.
// Bez niej widok custom wyświetla się „goły” – bez menu.

import { DefaultTemplate } from "@payloadcms/next/templates";
import type { AdminViewServerProps } from "payload";
import type { ReactNode } from "react";

export function AdminPage({ initPageResult, params, searchParams, children }: AdminViewServerProps & { children: ReactNode }) {
  const { req, permissions, visibleEntities, locale } = initPageResult;
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
      // pasek akcji w nagłówku (wyszukiwarka, „Dodaj”, motyw, sklep) – jak na pozostałych ekranach panelu
      viewActions={req.payload.config.admin?.components?.actions ?? []}
      viewType="custom"
    >
      {children}
    </DefaultTemplate>
  );
}
