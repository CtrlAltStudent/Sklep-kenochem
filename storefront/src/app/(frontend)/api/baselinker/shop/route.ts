import { getCms } from "@/lib/cms";
import { handleShopRequest } from "@/integrations/baselinker/shopProtocol";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleShopRequest(await getCms(), request);
}

export async function POST(request: Request) {
  return handleShopRequest(await getCms(), request);
}
