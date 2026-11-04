import { getPayload } from "payload";
import config from "../src/payload.config";

const scheme = (process.env.DATABASE_URL ?? "").split(":")[0] || "brak";
console.log("baza", scheme);

const payload = await getPayload({ config });
const users = await payload.count({ collection: "users", overrideAccess: true });
console.log("tabele gotowe, kont:", users.totalDocs);
await payload.destroy();
process.exit(0);
