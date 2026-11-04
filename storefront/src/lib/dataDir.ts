// Katalog danych obok bazy: statystyki, klucze integracji.
// Przy SQLite jest to folder pliku bazy. Przy PostgreSQL – DATA_DIR (na serwerze /data).
import path from "node:path";

export function dataDir() {
  if (process.env.DATA_DIR) return path.resolve(process.env.DATA_DIR);
  const raw = process.env.DATABASE_URL || "file:./sonax.db";
  if (raw.startsWith("file:")) return path.dirname(path.resolve(raw.slice(5)));
  return path.resolve("data");
}
