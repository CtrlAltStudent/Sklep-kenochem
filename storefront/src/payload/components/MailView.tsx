import type { AdminViewServerProps } from "payload";
import { AdminPage } from "./AdminPage";
import { MailStudio } from "./MailStudio";

// Widok /admin/maile – Marketing → Maile do klientów
export function MailView(props: AdminViewServerProps) {
  return (
    <AdminPage {...props}>
      <div className="kc-dash">
        <section className="kc-hero kc-hero--compact">
          <div>
            <p className="kc-hero__date">Marketing</p>
            <h1 className="kc-hero__title">Maile do klientów</h1>
            <p className="kc-hero__text">Wszystkie wiadomości, które wysyła sklep. Zmień tytuł, treść, kolory albo kod HTML – podgląd po prawej pokazuje mail na prawdziwym zamówieniu. Tu włączysz też prośbę o opinię i przypomnienie o porzuconym koszyku.</p>
          </div>
        </section>
        <MailStudio />
      </div>
    </AdminPage>
  );
}
