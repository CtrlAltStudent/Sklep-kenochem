import { NextResponse, type NextRequest } from "next/server";
import { getSite } from "@/integrations/vault";

// Przerwa techniczna (panel: Ustawienia → Widoczność i technika → „Przerwa techniczna”).
// Klienci dostają stronę z komunikatem (kod 503 – Google wie, że to chwilowe), pracownik zalogowany do panelu widzi sklep normalnie.
// Panel, API (płatności, BaseLinker, zdrowie sklepu) i pliki statyczne działają zawsze.

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function proxy(req: NextRequest) {
  const site = getSite();
  if (!site.maintenance || req.cookies.has("payload-token")) return NextResponse.next();
  const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Przerwa techniczna – Sklep SONAX</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#15191e;color:#fff;font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px}
main{max-width:520px;text-align:center}img{background:#fff;border-radius:12px;padding:8px 14px;width:150px}h1{font-size:28px;margin:28px 0 10px}p{color:#c9ced4;line-height:1.6}
a{color:#fff;font-weight:700}</style></head>
<body><main><img src="/sonax/logo.png" alt="SONAX"><h1>Przerwa techniczna</h1><p>${esc(site.maintenanceText)}</p>
<p><a href="tel:+48500021705">+48 500 021 705</a> · <a href="mailto:aukcje@sonax.bialystok.pl">aukcje@sonax.bialystok.pl</a></p></main></body></html>`;
  return new NextResponse(html, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "1800", "Cache-Control": "no-store" } });
}

export const config = {
  // wszystko poza panelem, API, plikami Next i statycznymi (logo, zdjęcia, ikony)
  matcher: ["/((?!admin|api|_next|sonax/|marks/|stock/|brand/|ghs/|favicon|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|webp|svg|ico|css|js|txt|xml)$).*)"],
};
