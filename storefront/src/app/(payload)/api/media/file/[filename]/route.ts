import config from "@payload-config";
import { REST_GET } from "@payloadcms/next/routes";

// Payload obsługuje tylko GET. Automaty Google sprawdzają zdjęcie metodą HEAD i dostawały 404,
// choć ten sam adres otwiera się normalnie. Tu HEAD zwraca te same nagłówki, bez treści pliku.
const get = REST_GET(config);

type Args = { params: Promise<{ filename: string }> };

function asPayload(filename: string) {
  return { params: Promise.resolve({ slug: ["media", "file", filename] }) };
}

export async function GET(req: Request, { params }: Args) {
  const { filename } = await params;
  const res = await get(req, asPayload(filename));
  const headers = new Headers(res.headers);
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "public, max-age=604800");
  return new Response(res.body, { status: res.status, headers });
}

export async function HEAD(req: Request, args: Args) {
  const res = await GET(new Request(req.url, { method: "GET", headers: req.headers }), args);
  return new Response(null, { status: res.status, headers: res.headers });
}
