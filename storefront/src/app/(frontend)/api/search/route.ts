import { searchProducts } from "@/lib/catalog";
import { toCard } from "@/lib/data";

// Podpowiedzi wyszukiwarki w nagłówku: GET /api/search?q=piana
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const all = await searchProducts(q);
  return Response.json({ total: all.length, items: all.slice(0, 6).map(toCard) });
}
