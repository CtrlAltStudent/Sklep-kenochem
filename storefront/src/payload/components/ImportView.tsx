import type { AdminViewServerProps } from "payload";
import { AdminPage } from "./AdminPage";
import { ImportStudio } from "./ImportStudio";

// Katalog → Import / eksport
export function ImportView(props: AdminViewServerProps) {
  return (
    <AdminPage {...props}>
      <div className="kc-dash">
        <section className="kc-hero kc-hero--compact">
          <div>
            <p className="kc-hero__date">Katalog</p>
            <h1 className="kc-hero__title">Import / eksport</h1>
            <p className="kc-hero__text">Zaciągnij do sklepu wybrane produkty z BaseLinkera albo pobierz listę tego, co już jest w sklepie.</p>
          </div>
        </section>
        <ImportStudio />
      </div>
    </AdminPage>
  );
}
