import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { HomeScreen } from "@/components/home/HomeScreen";
import { getCms } from "@/lib/cms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Podgląd strony głównej", robots: { index: false, follow: false } };

// Pełna strona ze szkicu. Nie jest w menu. Kto nie jest zalogowany w panelu, jej nie zobaczy.
export default async function PreviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const payload = await getCms();
  const { user } = await payload.auth({ headers: await headers() });
  if (!user || user.collection !== "users") notFound();
  const sp = await searchParams;
  const draft = sp.wersja === "szkic";
  const raw = typeof sp.sekcje === "string" ? sp.sekcje : "";
  const sectionIds = raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : null;
  return (
    <>
      <div className="bg-amber-100 px-4 py-2 text-center text-sm font-bold text-amber-950">
        Podgląd. Klienci tego nie widzą. {draft ? "Treść ze szkicu strony głównej." : "Treść opublikowana."}
        {sectionIds ? " Układ sekcji jest z edytora i może być jeszcze niezapisany." : ""}
      </div>
      <HomeScreen draft={draft} sectionIds={sectionIds} />
    </>
  );
}
