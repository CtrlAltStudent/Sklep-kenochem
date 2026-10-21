// Wysyłka maili przez skrzynkę sklepu (SMTP) – dane z panelu: Integracje → Poczta (SMTP).
// Każdy mail trafia do „Dziennika integracji” (typ E-mail). Błąd wysyłki nigdy nie przerywa zamówienia.
// Tylko po stronie serwera.

import nodemailer, { type Transporter } from "nodemailer";
import type { Payload } from "payload";
import { getKey, getMode, moduleEnabled } from "../vault";

export type MailConfig = { host: string; port: number; secure: boolean; user: string; pass: string; from: string; fromName: string; notify: string[]; bank: string };

export function mailConfig(): MailConfig | null {
  const host = getKey("mail.host");
  const user = getKey("mail.user");
  const pass = getKey("mail.password");
  if (!host || !user || !pass) return null;
  const secure = getMode("poczta") !== "starttls";
  const from = getKey("mail.from") || user;
  return {
    host,
    port: Number(getKey("mail.port")) || (secure ? 465 : 587),
    secure,
    user,
    pass,
    from,
    fromName: getKey("mail.fromName") || "Sklep SONAX",
    notify: (getKey("mail.notify") || from).split(/[,;\s]+/).filter(Boolean),
    bank: getKey("mail.bank"),
  };
}

export const mailReady = () => moduleEnabled("poczta") && Boolean(mailConfig());

// Połączenie SMTP odtwarzane tylko po zmianie danych w panelu
let cached: { key: string; t: Transporter } | null = null;
function transport(c: MailConfig) {
  const key = JSON.stringify([c.host, c.port, c.secure, c.user, c.pass]);
  if (cached?.key !== key) {
    cached = {
      key,
      t: nodemailer.createTransport({
        host: c.host, port: c.port, secure: c.secure, auth: { user: c.user, pass: c.pass },
        connectionTimeout: 15_000, greetingTimeout: 15_000, socketTimeout: 30_000,
      }),
    };
  }
  return cached.t;
}

export type Mail = { to: string | string[]; subject: string; html: string; text: string; replyTo?: string; order?: number | string };

async function log(payload: Payload, status: "success" | "error", message: string, startedAt: number, order?: number | string, details?: unknown) {
  try {
    await payload.create({
      collection: "integration-logs",
      overrideAccess: true,
      data: { type: "email", status, message: message.slice(0, 500), mode: "live", durationMs: Date.now() - startedAt, order: order as number | undefined, details: (details ?? null) as Record<string, unknown> | null },
    });
  } catch (e) {
    payload.logger.error({ err: e }, "Nie udało się zapisać dziennika e-mail");
  }
}

export async function sendMail(payload: Payload, m: Mail, opts: { force?: boolean } = {}): Promise<{ ok: boolean; message: string }> {
  if (!opts.force && !moduleEnabled("poczta")) return { ok: false, message: "Moduł Poczta jest wyłączony" };
  const c = mailConfig();
  if (!c) return { ok: false, message: "Poczta nie jest skonfigurowana (serwer, login, hasło)" };
  const startedAt = Date.now();
  const to = Array.isArray(m.to) ? m.to.join(", ") : m.to;
  try {
    await transport(c).sendMail({ from: { name: c.fromName, address: c.from }, to, replyTo: m.replyTo, subject: m.subject, html: m.html, text: m.text });
    await log(payload, "success", `${m.subject} → ${to}`, startedAt, m.order);
    return { ok: true, message: `Wysłano do ${to}` };
  } catch (e) {
    const message = (e as Error).message;
    await log(payload, "error", `${m.subject} → ${to}: ${message}`, startedAt, m.order);
    return { ok: false, message };
  }
}

// Wysyłka w tle – nie blokuje klienta ani zapisu w panelu
export function sendLater(payload: Payload, build: () => Promise<Mail | Mail[] | null>) {
  setTimeout(() => {
    build()
      .then(async (m) => {
        if (!m || !mailReady()) return;
        for (const one of Array.isArray(m) ? m : [m]) await sendMail(payload, one);
      })
      .catch((e) => payload.logger.error({ err: e }, "Wysyłka maila"));
  }, 0);
}
