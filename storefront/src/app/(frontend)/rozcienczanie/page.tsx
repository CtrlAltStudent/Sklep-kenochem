import type { Metadata } from "next";
import { DilutionGuide, type DilutionExample } from "@/components/DilutionGuide";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getProduct } from "@/lib/catalog";
import { formatPrice, usableImages } from "@/lib/data";

export const metadata: Metadata = {
  title: "Rozcieńczanie chemii — kalkulator",
  description: "Jak czytać proporcję 1:10 i ile koncentratu wlać do wody. Kalkulator z przykładami produktów ze sklepu Sonax.",
};

const EXAMPLES: { slug: string; ratio: number; note: string }[] = [
  { slug: "sonax-piana-aktywna-actifoam-energy", ratio: 20, note: "W opisie: rozcieńczenie nawet 1:20." },
  { slug: "promocja-sonax-letni-plyn-do-spryskiwaczy-250ml-zawieszka-sonic-gratis", ratio: 100, note: "Na nazwie produktu: koncentrat 1:100." },
  { slug: "autobella-szampon-woskiem-1l", ratio: 200, note: "W opisie: rozcieńczyć wodą w stosunku 1:200." },
  { slug: "nerta-interior-cleaner-5-l-preparat-czyszczacy", ratio: 10, note: "W opisie: 1:10 albo 1:20, zależnie od brudu." },
  { slug: "adbl-apc-5l", ratio: 10, note: "W opisie: od 1:4 przy mocnym brudzie do 1:80 przy lekkim." },
  { slug: "shine-chemicals-snow-ultra-1l-piana-aktywna-koncentrat", ratio: 20, note: "W opisie: zraszanie około 1:20–1:30." },
];

export default async function DilutionPage() {
  const examples: DilutionExample[] = [];
  for (const ex of EXAMPLES) {
    const product = await getProduct(ex.slug);
    const price = product?.variants[0]?.price;
    if (!product || price == null) continue;
    examples.push({
      name: product.name,
      slug: product.slug,
      image: usableImages(product.images)[0],
      price: formatPrice(price),
      ratio: ex.ratio,
      note: ex.note,
    });
  }

  return (
    <div className="mx-auto max-w-shop px-4 py-8">
      <Breadcrumbs items={[{ label: "Rozcieńczanie" }]} />
      <p className="mt-6 text-xs font-bold tracking-widest text-accent uppercase">Poradnik</p>
      <h1 className="mt-2 max-w-3xl text-4xl font-black tracking-tight text-navy sm:text-5xl">Rozcieńczanie chemii</h1>
      <p className="mt-3 max-w-2xl text-lg text-slate-600">Jedna strona: co znaczy proporcja na etykiecie i ile preparatu odmierzyć. Przykłady to prawdziwe produkty z tego sklepu.</p>
      <DilutionGuide examples={examples} />
    </div>
  );
}
