// Wersja katalogu – zwiększana po każdej zmianie produktu/kategorii w panelu.
// Trzymana w globalThis, żeby była wspólna dla wszystkich kopii modułu w procesie serwera.
const g = globalThis as typeof globalThis & { __kcCatalogVersion?: number };

export const invalidateCatalog = () => {
  g.__kcCatalogVersion = (g.__kcCatalogVersion ?? 0) + 1;
};
export const catalogVersion = () => g.__kcCatalogVersion ?? 0;
