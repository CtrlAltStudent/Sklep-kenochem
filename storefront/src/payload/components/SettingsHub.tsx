import Link from "next/link";
import type { AdminViewServerProps } from "payload";
import { Building2, Settings } from "lucide-react";
import { AdminPage } from "./AdminPage";
import { SiteSettingsPanel } from "./SiteSettingsPanel";
import { LegalDrafts } from "./LegalDrafts";

// Widok /admin/ustawienia – jedno miejsce na wszystkie ustawienia sklepu: dane firmy, sprzedaż, wygląd, integracje i technika.

// Tylko ustawienia sklepu – integracje, maile, pracownicy, przekierowania i wygląd mają własne miejsca w menu
const CARDS = [
  { icon: Building2, title: "Dane sklepu, dostawa i płatności", text: "Nazwa, kontakt, adres, godziny, GPSR · metody i ceny dostawy, darmowa dostawa · metody płatności.", href: "/admin/globals/store-settings" },
];

export function SettingsHub(props: AdminViewServerProps) {
  return (
    <AdminPage {...props}>
      <div className="kc-dash">
        <section className="kc-hero kc-hero--compact">
          <div>
            <p className="kc-hero__date">Ustawienia</p>
            <h1 className="kc-hero__title">Ustawienia sklepu</h1>
            <p className="kc-hero__text">Dane sklepu, dostawa i płatności, teksty prawne oraz widoczność w Google i AI, przerwa techniczna i narzędzia.</p>
          </div>
        </section>

        <section className="kc-setcards">
          {CARDS.map(({ icon: Icon, title, text, href }) => (
            <Link key={title} href={href} className="kc-card kc-setcard">
              <span className="kc-icon kc-icon--green"><Icon size={18} /></span>
              <b>{title}</b>
              <span>{text}</span>
            </Link>
          ))}
        </section>

        <LegalDrafts />

        <header className="kc-sethead"><Settings size={18} /> Widoczność i technika</header>
        <SiteSettingsPanel />
      </div>
    </AdminPage>
  );
}
