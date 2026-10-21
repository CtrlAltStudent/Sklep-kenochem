// Maile wysyłane przez sam Payload (np. reset hasła klienta i pracownika) idą tą samą drogą co maile sklepu:
// moduł Integracje → Poczta (SMTP). Bez skonfigurowanej poczty zapisujemy tylko błąd w dzienniku.

import type { EmailAdapter } from "payload";
import { sendMail } from "./send";

type To = string | { address: string; name?: string };
const addr = (t: unknown): string[] =>
  (Array.isArray(t) ? t : [t]).filter(Boolean).map((x) => (typeof x === "string" ? x : (x as Exclude<To, string>).address));

export const shopEmailAdapter: EmailAdapter = ({ payload }) => ({
  name: "sonax-smtp",
  defaultFromAddress: "aukcje@sonax.bialystok.pl",
  defaultFromName: "Sklep SONAX",
  sendEmail: async (m) => {
    const html = typeof m.html === "string" ? m.html : "";
    const text = typeof m.text === "string" ? m.text : html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return sendMail(payload, { to: addr(m.to), subject: String(m.subject ?? ""), html, text });
  },
});
