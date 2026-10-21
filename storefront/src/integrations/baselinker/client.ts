// Klient API BaseLinkera.
// - token z panelu (Integracje → Połączenia, zaszyfrowany schowek) albo z .env (BASELINKER_TOKEN)
// - limit API: 100 zapytań / minutę → pilnujemy go lokalnie z zapasem
// - tryb testowy (panel albo BASELINKER_MOCK=1) → odpowiedzi testowe bez łączenia się z BaseLinkerem (patrz mock.ts)

import { getKey, getMode, moduleEnabled } from "../vault";
import { mockCall } from "./mock";

const ENDPOINT = "https://api.baselinker.com/connector.php";
const MAX_PER_MINUTE = 90;

export class BaseLinkerError extends Error {
  constructor(public code: string, message: string, public method: string) {
    super(`[${method}] ${code}: ${message}`);
  }
}

const token = () => getKey("baselinker.token");
export const isMock = () => getMode("baselinker") === "mock";
export const hasToken = () => Boolean(token());
// "disabled" = moduł wyłączony w Integracje → Moduły (nic nie idzie do BaseLinkera)
export type BLMode = "mock" | "live" | "unconfigured" | "disabled";
export const integrationMode = (): BLMode => (!moduleEnabled("baselinker") ? "disabled" : isMock() ? "mock" : hasToken() ? "live" : "unconfigured");
export const blActive = () => ["mock", "live"].includes(integrationMode());

// Przesuwne okno ostatnich zapytań (w obrębie jednego procesu serwera).
const calls: number[] = [];
async function throttle() {
  for (;;) {
    const now = Date.now();
    while (calls.length && now - calls[0] > 60_000) calls.shift();
    if (calls.length < MAX_PER_MINUTE) break;
    await new Promise((r) => setTimeout(r, 60_000 - (now - calls[0]) + 50));
  }
  calls.push(Date.now());
}

export async function blCall<T = Record<string, unknown>>(method: string, parameters: Record<string, unknown> = {}): Promise<T> {
  if (!moduleEnabled("baselinker")) throw new BaseLinkerError("DISABLED", "Moduł BaseLinker jest wyłączony (Integracje → Moduły)", method);
  if (isMock()) {
    const r = mockCall(method, parameters);
    if (r.status !== "SUCCESS") throw new BaseLinkerError(String(r.error_code), String(r.error_message), method);
    return r as T;
  }

  const blToken = token();
  if (!blToken) throw new BaseLinkerError("NO_TOKEN", "Brak tokena API – wpisz go w panelu: Integracje → Połączenia", method);

  await throttle();
  const body = new URLSearchParams({ method, parameters: JSON.stringify(parameters) });

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "X-BLToken": blToken, "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new BaseLinkerError(`HTTP_${res.status}`, res.statusText, method);
      const json = (await res.json()) as { status: string; error_code?: string; error_message?: string } & T;
      if (json.status !== "SUCCESS") {
        throw new BaseLinkerError(json.error_code ?? "UNKNOWN", json.error_message ?? "Nieznany błąd", method);
      }
      return json;
    } catch (e) {
      lastError = e;
      // Błędy merytoryczne z API (złe parametry) nie mają sensu ponawiać
      if (e instanceof BaseLinkerError && !e.code.startsWith("HTTP_5")) throw e;
      await new Promise((r) => setTimeout(r, attempt * 1500));
    }
  }
  throw lastError;
}
