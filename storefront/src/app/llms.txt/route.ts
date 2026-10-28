import { getSite } from "@/integrations/vault";
import { llmsShort } from "@/lib/llms";

// /llms.txt – opis sklepu i najważniejsze linki dla asystentów AI (odświeżany co godzinę)
export const revalidate = 3600;

export async function GET() {
  if (!getSite().llmsEnabled) return new Response("Not found", { status: 404 });
  return new Response(await llmsShort(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
