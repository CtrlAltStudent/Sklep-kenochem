import fs from "node:fs";
const { categories } = await import("../src/lib/data.ts");
const ok = new Set();
for (const c of categories) for (const s of c.children) { ok.add(`${c.slug}/${s.slug}`); for (const t of s.types) ok.add(`${c.slug}/${s.slug}/${t.slug}`); }
const p = JSON.parse(fs.readFileSync("src/data/products.json", "utf8"));
const bad = p.filter((x) => !ok.has(`${x.category}/${x.subcategory}`) || (x.type && !ok.has(`${x.category}/${x.subcategory}/${x.type}`)));
console.log("bledne sciezki:", bad.length, bad.slice(0, 10).map((x) => `${x.category}/${x.subcategory}/${x.type}`));
const g = {};
for (const x of p) { const k = `${x.subcategory} / ${x.type || "-"}`; (g[k] ??= []).push(`${x.name}  [${x.brand}]`); }
const watch = ["pre-wash-i-dekontaminacja / pre-wash-i-dekontaminacja-usuwanie-osadow-i-rdzy", "szyby-i-lusterka / szyby-i-lusterka-plyny-do-szyb", "powloki-i-quick-detailery", "plastiki-guma-i-detale / plastiki-guma-i-detale-reflektory-i-lampy", "mikrofibry", "pasty-polerskie", "podlogi"];
for (const k of Object.keys(g).sort()) if (watch.some((w) => k.includes(w))) console.log(`\n## ${k}\n` + g[k].join("\n"));
const brands = {}; for (const x of p) brands[x.brand] = (brands[x.brand] || 0) + 1;
console.log("\nMARKI:", JSON.stringify(brands));
