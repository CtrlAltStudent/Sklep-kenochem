"use client";

// Przycisk na formularzu strony głównej. Szkic trzeba najpierw zapisać. Publikacja zostaje osobno.
export function HomePreviewLink() {
  return (
    <div className="kc-card" style={{ marginBottom: 12 }}>
      <b>Pełny podgląd</b>
      <p className="kc-muted" style={{ margin: "4px 0 10px" }}>Zapisz szkic. Podgląd otwiera całą stronę główną tak, jak ją zobaczy klient, ale sklep się od tego nie zmienia. Na sklep wchodzi dopiero „Publikuj”.</p>
      <a className="kc-act__btn" href="/podglad?wersja=szkic" target="_blank" rel="noreferrer" style={{ width: "auto" }}>Otwórz pełny podgląd szkicu</a>
    </div>
  );
}
