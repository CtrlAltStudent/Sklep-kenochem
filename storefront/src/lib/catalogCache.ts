// Wersja katalogu – zwiększana po każdej zmianie produktu/kategorii w panelu.
// Trzymana w globalThis, żeby była wspólna dla wszystkich kopii modułu w procesie serwera.
const g = globalThis as typeof globalThis & { __kcCatalogVersion?: number; __kcShopRevalidateAt?: number };

export const invalidateCatalog = () => {
  g.__kcCatalogVersion = (g.__kcCatalogVersion ?? 0) + 1;
  const now = Date.now();
  if (now - (g.__kcShopRevalidateAt ?? 0) < 2000) return;
  g.__kcShopRevalidateAt = now;
  try {
    // Liczby produktów na stronie są w zapamiętanej stronie – odśwież ją od razu po zapisie.
    void import("next/cache").then(({ revalidatePath }) => revalidatePath("/", "layout")).catch(() => {});
  } catch { /* zapis poza Next */ }
};
export const catalogVersion = () => g.__kcCatalogVersion ?? 0;
