import { getSite } from "@/integrations/vault";
import { llmsFull } from "@/lib/llms";

// /llms-full.txt – pełny katalog z cenami i dostępnością dla asystentów AI (odświeżany co godzinę)
export const revalidate = 3600;

export async function GET() {
  if (!getSite().llmsEnabled) return new Response("Not found", { status: 404 });
  return new Response(await llmsFull(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
