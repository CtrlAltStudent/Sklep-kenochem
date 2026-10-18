// Generuje ikony menu panelu (CSS mask) z ikon Lucide – te same co w sklepie.
// Użycie: node scripts/gen-admin-nav-icons.mjs   → src/app/(payload)/nav-icons.scss
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const iconsDir = path.join(path.dirname(require.resolve("lucide-react/package.json")), "dist", "esm", "icons");

// id elementu menu (Payload: nav-<kolekcja> / nav-global-<global>) → ikona Lucide
const map = {
  "nav-orders": "receipt",
  "nav-returns": "undo-2",
  "nav-form-submissions": "inbox",
  "nav-customers": "users",
  "nav-products": "package",
  "nav-categories": "folder-tree",
  "nav-coupons": "ticket-percent",
  "nav-reviews": "star",
  "nav-newsletter": "mail",
  "nav-pages": "file-text",
  "nav-posts": "newspaper",
  "nav-media": "image",
  "nav-integration-logs": "scroll-text",
  "nav-users": "user-cog",
  "nav-redirects": "route",
  "nav-global-homepage": "layout-template",
  "nav-global-navigation": "panel-top",
  "nav-global-store-settings": "settings",
  "nav-global-baselinker-settings": "plug-zap",
  "nav-reports": "chart-column",
  "nav-stock-alerts": "bell-ring",
};

const toSvg = (node) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">` +
  node.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== "key").map(([k, v]) => `${k}="${v}"`).join(" ")}/>`).join("") +
  `</svg>`;

let css = "// WYGENEROWANE przez scripts/gen-admin-nav-icons.mjs – nie edytuj ręcznie\n";
for (const [id, icon] of Object.entries(map)) {
  const file = path.join(iconsDir, `${icon}.mjs`);
  if (!fs.existsSync(file)) throw new Error(`Brak ikony ${icon}`);
  const { __iconData } = await import(`file://${file.replace(/\\/g, "/")}`);
  const uri = `data:image/svg+xml,${encodeURIComponent(toSvg(__iconData.node))}`;
  css += `#${id}::before { -webkit-mask-image: url("${uri}"); mask-image: url("${uri}"); }\n`;
}
const out = path.join(import.meta.dirname, "..", "src", "app", "(payload)", "nav-icons.scss");
fs.writeFileSync(out, css);
console.log(`Zapisano ${Object.keys(map).length} ikon → ${out}`);
