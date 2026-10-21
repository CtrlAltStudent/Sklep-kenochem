// Przelewy24 – rejestracja płatności i potwierdzenie (BLIK, przelew, karta).
// Klucze z panelu (Integracje → Połączenia, zaszyfrowany schowek) albo z .env (P24_MERCHANT_ID, P24_POS_ID, P24_CRC, P24_API_KEY).
// Tryb „mock” (P24_MOCK=1) – bez łączenia z P24, zamówienie od razu jako opłacone (do testów z BaseLinkerem).
// Tryb „sandbox” (P24_SANDBOX=1) – środowisko testowe Przelewy24 (https://sandbox.przelewy24.pl).

import { createHash } from "node:crypto";
import { getKey, getMode } from "../vault";

export type P24Mode = "mock" | "sandbox" | "live" | "unconfigured";

const cfg = () => ({
  merchantId: Number(getKey("p24.merchantId") || 0),
  posId: Number(getKey("p24.posId") || getKey("p24.merchantId") || 0),
  crc: getKey("p24.crc"),
  apiKey: getKey("p24.apiKey"),
});

export const p24Mode = (): P24Mode => {
  const mode = getMode("przelewy24");
  if (mode === "mock") return "mock";
  const { merchantId, crc, apiKey } = cfg();
  if (!merchantId || !crc || !apiKey) return "unconfigured";
  return mode === "sandbox" ? "sandbox" : "live";
};

const host = () => (p24Mode() === "live" ? "https://secure.przelewy24.pl" : "https://sandbox.przelewy24.pl");

const signRegister = (sessionId: string, amount: number, currency: string) => {
  const { merchantId, crc } = cfg();
  const payload = JSON.stringify({ sessionId, merchantId, amount, currency, crc });
  return createHash("sha384").update(payload).digest("hex");
};

// Podpis weryfikacji transakcji: kolejność pól jest częścią skrótu.
const signVerify = (sessionId: string, orderId: number, amount: number, currency: string) => {
  const { crc } = cfg();
  return createHash("sha384").update(JSON.stringify({ sessionId, orderId, amount, currency, crc })).digest("hex");
};

export type RegisterInput = {
  sessionId: string;
  amountGrosze: number;
  description: string;
  email: string;
  urlReturn: string;
  urlStatus: string;
  // BLIK z kodem na stronie sklepu (bez przekierowania):
  blik?: {
    ip: string; // dane płatnika wymagane przez chargeByCode (obiekt PSU)
    userAgent: string;
    urlNotify?: string; // dodatkowe powiadomienie BLIK (też o odrzuceniu w aplikacji banku)
  };
};

export async function registerP24(input: RegisterInput): Promise<{ token: string; redirectUrl: string }> {
  const mode = p24Mode();
  if (mode === "mock") {
    return { token: "mock", redirectUrl: `${input.urlReturn}?mock=1&sessionId=${encodeURIComponent(input.sessionId)}` };
  }
  if (mode === "unconfigured") {
    throw new Error("Brak danych Przelewy24 w .env (P24_MERCHANT_ID, P24_CRC, P24_API_KEY) albo ustaw P24_MOCK=1 do testów.");
  }

  const { merchantId, posId, apiKey } = cfg();
  const body = {
    merchantId,
    posId,
    sessionId: input.sessionId,
    amount: input.amountGrosze,
    currency: "PLN",
    description: input.description.slice(0, 1024),
    email: input.email,
    country: "PL",
    language: "pl",
    urlReturn: input.urlReturn,
    urlStatus: input.urlStatus,
    encoding: "UTF-8",
    sign: signRegister(input.sessionId, input.amountGrosze, "PLN"),
    ...(input.blik
      ? {
          // klient zaakceptował regulamin Przelewy24 w sklepie (pole przy BLIK) – nie widzi strony P24
          regulationAccept: true,
          ...(input.blik.urlNotify ? { urlCardPaymentNotification: input.blik.urlNotify } : {}),
          additional: { PSU: { IP: input.blik.ip, userAgent: input.blik.userAgent.slice(0, 255) } },
        }
      : {}),
  };

  const res = await fetch(`${host()}/api/v1/transaction/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${posId}:${apiKey}`).toString("base64")}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const json = (await res.json()) as { data?: { token?: string }; error?: string; code?: number };
  if (!res.ok || !json.data?.token) {
    throw new Error(json.error || `Przelewy24 odrzuciło rejestrację (HTTP ${res.status}).`);
  }
  return { token: json.data.token, redirectUrl: `${host()}/trnRequest/${json.data.token}` };
}

export type P24NotifyBody = {
  merchantId?: number;
  posId?: number;
  sessionId?: string;
  amount?: number;
  originAmount?: number;
  currency?: string;
  orderId?: number;
  methodId?: number;
  statement?: string;
  sign?: string;
};

// Powiadomienie urlStatus ma INNY podpis niż rejestracja i niż weryfikacja.
// Kolejność: merchantId, posId, sessionId, amount, originAmount, currency, orderId, methodId, statement, crc.
export function verifyP24Notify(body: P24NotifyBody) {
  if (p24Mode() === "mock") return true;
  if (!body.sessionId || body.orderId == null || body.amount == null || body.merchantId == null || body.posId == null || !body.sign) return false;
  const { crc } = cfg();
  const payload = JSON.stringify({
    merchantId: body.merchantId,
    posId: body.posId,
    sessionId: body.sessionId,
    amount: body.amount,
    originAmount: body.originAmount ?? body.amount,
    currency: body.currency || "PLN",
    orderId: body.orderId,
    methodId: body.methodId ?? 0,
    statement: body.statement ?? "",
    crc,
  });
  return createHash("sha384").update(payload).digest("hex") === body.sign;
}

// Dopiero to wywołanie księguje wpłatę. Bez orderId i podpisu weryfikacji P24 zostawia status „zaliczka”.
export async function verifyP24Transaction(sessionId: string, amountGrosze: number, orderId: number) {
  if (p24Mode() === "mock") return true;
  const { merchantId, posId, apiKey } = cfg();
  const res = await fetch(`${host()}/api/v1/transaction/verify`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${posId}:${apiKey}`).toString("base64")}`,
    },
    body: JSON.stringify({
      merchantId,
      posId,
      sessionId,
      amount: amountGrosze,
      currency: "PLN",
      orderId,
      sign: signVerify(sessionId, orderId, amountGrosze, "PLN"),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as { data?: { status?: string }; error?: string };
  if (json.data?.status === "success") return true;
  // Ponowienie powiadomienia po udanej weryfikacji nie może znowu odrzucać zamówienia.
  return /already|już|verified/i.test(json.error || "");
}

// Test kluczy (przycisk „Sprawdź połączenie” w panelu): /api/v1/testAccess – nic nie obciąża
export async function testP24Access(): Promise<{ ok: boolean; message: string }> {
  const mode = p24Mode();
  if (mode === "mock") return { ok: true, message: "Tryb bez płatności – nic nie sprawdzam. Zamówienia są od razu opłacone." };
  if (mode === "unconfigured") return { ok: false, message: "Brakuje ID sprzedawcy, klucza CRC albo klucza API." };
  const { posId, apiKey } = cfg();
  try {
    const res = await fetch(`${host()}/api/v1/testAccess`, {
      headers: { Authorization: `Basic ${Buffer.from(`${posId}:${apiKey}`).toString("base64")}` },
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await res.json().catch(() => ({}))) as { data?: boolean; error?: string };
    if (res.ok && json.data === true) return { ok: true, message: `Klucze działają (${mode === "sandbox" ? "sandbox" : "na żywo"}).` };
    if (res.status === 401) return { ok: false, message: `Przelewy24 odrzuciło ID punktu lub klucz API${mode === "sandbox" ? " (sandbox ma osobne klucze)" : ""}.` };
    return { ok: false, message: json.error || `Przelewy24 odpowiedziało błędem (HTTP ${res.status}).` };
  } catch (e) {
    return { ok: false, message: `Brak połączenia z Przelewy24: ${(e as Error).message}` };
  }
}

const auth = () => {
  const { posId, apiKey } = cfg();
  return `Basic ${Buffer.from(`${posId}:${apiKey}`).toString("base64")}`;
};

// BLIK poziom 0: obciążenie 6-cyfrowym kodem z aplikacji banku (po transaction/register).
// Sukces = kod przyjęty; klient jeszcze potwierdza płatność w aplikacji, potem przychodzi zwykłe powiadomienie.
// Tryb „mock”: kody 777xxx przechodzą (jak w sandboxie P24), inne – odrzucone.
export async function chargeBlikByCode(token: string, blikCode: string): Promise<{ ok: boolean; message: string }> {
  if (p24Mode() === "mock") {
    return blikCode.startsWith("777") ? { ok: true, message: "Kod przyjęty (tryb testowy)." } : { ok: false, message: "Kod BLIK odrzucony (tryb testowy – użyj 777xxx)." };
  }
  try {
    const res = await fetch(`${host()}/api/v1/paymentMethod/blik/chargeByCode`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth() },
      body: JSON.stringify({ token, blikCode }),
      signal: AbortSignal.timeout(20_000),
    });
    const json = (await res.json().catch(() => ({}))) as { data?: { orderId?: number; message?: string }; error?: string };
    if (res.ok && json.data) return { ok: true, message: json.data.message || "Kod przyjęty" };
    return { ok: false, message: json.error ? `Kod BLIK odrzucony: ${json.error}` : `Kod BLIK odrzucony (HTTP ${res.status}).` };
  } catch (e) {
    return { ok: false, message: `Brak połączenia z Przelewy24: ${(e as Error).message}` };
  }
}

// Stan transakcji po sessionId: 0 – brak wpłaty, 1 – zaliczka, 2 – opłacona, 3 – zwrócona
export async function getP24Transaction(sessionId: string): Promise<{ status: number; orderId?: number } | null> {
  if (p24Mode() === "mock" || p24Mode() === "unconfigured") return null;
  try {
    const res = await fetch(`${host()}/api/v1/transaction/by/sessionId/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: auth() },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { status?: number; orderId?: number } };
    return json.data ? { status: Number(json.data.status ?? 0), orderId: json.data.orderId } : null;
  } catch {
    return null;
  }
}

// Dodatkowe powiadomienie BLIK (urlCardPaymentNotification): podpis SHA-384 z {orderId, sessionId, method, result, crc}
export type BlikNotify = { orderId?: number; sessionId?: string; method?: number; result?: { error?: string; message?: string; status?: string; trxRef?: string }; sign?: string };
export function verifyBlikNotify(b: BlikNotify) {
  if (p24Mode() === "mock") return true;
  if (!b.sessionId || b.orderId == null || !b.sign) return false;
  const { crc } = cfg();
  const json = JSON.stringify({ orderId: b.orderId, sessionId: b.sessionId, method: b.method, result: b.result, crc });
  return createHash("sha384").update(json).digest("hex") === b.sign;
}
