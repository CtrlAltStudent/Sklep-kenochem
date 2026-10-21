import Link from "next/link";
import type { AdminViewServerProps } from "payload";
import { AdminPage } from "./AdminPage";
import { ModulePage, ModulesOverview } from "./IntegrationsHub";

const couriers = [
  { logo: "/marks/inpost-paczkomat.svg", name: "InPost Paczkomat i Kurier" },
  { logo: "/marks/gls.svg", name: "GLS" },
  { logo: "/marks/orlen-paczka.png", name: "ORLEN Paczka" },
];

// /admin/integracje – moduły sklepu (dodaj, włącz / wyłącz, konfiguruj)
export function IntegrationsView(props: AdminViewServerProps) {
  return (
    <AdminPage {...props}>
    <div className="kc-dash">
      <section className="kc-hero kc-hero--compact">
        <div>
          <p className="kc-hero__date">Integracje</p>
          <h1 className="kc-hero__title">Moduły i połączenia</h1>
          <p className="kc-hero__text">Dodaj moduł, wpisz klucze i włącz go jednym przełącznikiem. Wyłączony moduł znika ze sklepu, ale jego klucze zostają.</p>
        </div>
        <div className="kc-hero__actions">
          <Link href="/admin/collections/integration-logs" className="kc-btn kc-btn--light">Dziennik integracji</Link>
        </div>
      </section>

      <ModulesOverview />

      <section className="kc-card">
        <div className="kc-card__head"><h2>Kurierzy – jak to działa</h2></div>
        <div className="kc-ih__couriers">
          {couriers.map((c) => (
            // eslint-disable-next-line @next/next/no-img-element -- małe logo z public/marks
            <span key={c.name}><img src={c.logo} alt="" />{c.name}</span>
          ))}
        </div>
        <ol className="kc-steps">
          <li>Konta kurierskie (umowy InPost, GLS, ORLEN Paczka) podłącza się <b>w BaseLinkerze</b>: Integracje → Dodaj integrację → Kurierzy. Tam powstają etykiety i numery przesyłek.</li>
          <li>Sklep przekazuje do BaseLinkera wybraną metodę dostawy i kod punktu (paczkomat / ORLEN). Nazwy metod ustawiasz w <Link href="/admin/globals/store-settings">Ustawieniach sklepu → Dostawa</Link> – muszą być takie same jak w regułach kurierskich BaseLinkera.</li>
          <li>Po nadaniu paczki numer przesyłki widać w zamówieniu (zakładka BaseLinker → Przesyłki), a status zmienia się na „Wysłane” – jeśli włączysz to w module BaseLinker → Synchronizacja.</li>
        </ol>
      </section>
    </div>
    </AdminPage>
  );
}

// /admin/integracje/<moduł>
export function ModuleView(props: AdminViewServerProps) {
  const segments = (props.params as { segments?: string[] } | undefined)?.segments ?? [];
  return (
    <AdminPage {...props}>
      <div className="kc-dash">
        <ModulePage id={segments[1] ?? ""} />
      </div>
    </AdminPage>
  );
}
