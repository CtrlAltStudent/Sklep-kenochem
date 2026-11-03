import type { AdminViewServerProps } from "payload";
import { AdminPage } from "./AdminPage";
import { LayoutEditor } from "./LayoutEditor";

// Widok /admin/uklad – Treści i wygląd → Układ strony
export async function LayoutView(props: AdminViewServerProps) {
  const { payload } = props.initPageResult.req;
  // przykładowy produkt i kategoria do przycisku „Zobacz w sklepie”
  const [p, c] = await Promise.all([
    payload.find({ collection: "products", where: { and: [{ status: { equals: "active" } }, { stock: { greater_than: 0 } }] }, limit: 1, depth: 0, overrideAccess: true, select: { slug: true } }),
    payload.find({ collection: "categories", where: { parent: { exists: false } }, limit: 1, depth: 0, overrideAccess: true, select: { slug: true }, sort: "order" }),
  ]);
  return (
    <AdminPage {...props}>
      <div className="kc-dash">
        <section className="kc-hero kc-hero--compact">
          <div>
            <p className="kc-hero__date">Treści i wygląd</p>
            <h1 className="kc-hero__title">Układ strony</h1>
            <p className="kc-hero__text">Ustaw kolejność sekcji. Po prawej jest pełny podgląd strony głównej — zmienia się od razu i nie wchodzi na sklep, dopóki nie klikniesz „Zapisz układ”. Wygląd kafelków i skrótów jest w Stronie głównej.</p>
          </div>
        </section>
        <LayoutEditor sampleProduct={p.docs[0]?.slug ?? undefined} sampleCategory={c.docs[0]?.slug ?? undefined} />
      </div>
    </AdminPage>
  );
}
