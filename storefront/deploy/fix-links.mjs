// Turbopack zapisuje w .next/node_modules dowiązania z bezwzględną ścieżką komputera,
// na którym budowano. Na serwerze kierujemy je do /app/node_modules/<pakiet>.
import fs from "node:fs";
import path from "node:path";

const root = "/app/.next/node_modules";
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) {
      const target = fs.readlinkSync(p).split("\\").join("/");
      const i = target.lastIndexOf("/node_modules/");
      if (i < 0) continue;
      const fixed = path.join("/app/node_modules", target.slice(i + "/node_modules/".length));
      fs.unlinkSync(p);
      fs.symlinkSync(fixed, p);
      if (!fs.existsSync(fixed)) console.warn("brak pakietu:", fixed);
    } else if (e.isDirectory()) walk(p);
  }
};
walk(root);
console.log("dowiązania .next/node_modules poprawione");
