// Klient API BaseLinkera.
// - token tylko z zmiennej środowiskowej BASELINKER_TOKEN (nigdy w bazie ani w kodzie)
// - limit API: 100 zapytań / minutę → pilnujemy go lokalnie z zapasem
// - BASELINKER_MOCK=1 → odpowiedzi testowe bez łączenia się z BaseLinkerem (patrz mock.ts)

import { mockCall } from "./mock";

const ENDPOINT = "https://api.baselinker.com/connector.php";
const MAX_PER_MINUTE = 90;

export class BaseLinkerError extends Error {
  constructor(public code: string, message: string, public method: string) {
    super(`[${method}] ${code}: ${message}`);
  }
}

export const isMock = () => process.env.BASELINKER_MOCK === "1";
export const hasToken = () => Boolean(process.env.BASELINKER_TOKEN?.trim());
export const integrationMode = (): "mock" | "live" | "unconfigured" => (isMock() ? "mock" : hasToken() ? "live" : "unconfigured");

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
  if (isMock()) {
    const r = mockCall(method, parameters);
    if (r.status !== "SUCCESS") throw new BaseLinkerError(String(r.error_code), String(r.error_message), method);
    return r as T;
  }

  const token = process.env.BASELINKER_TOKEN?.trim();
  if (!token) throw new BaseLinkerError("NO_TOKEN", "Brak BASELINKER_TOKEN w pliku .env", method);

  await throttle();
  const body = new URLSearchParams({ method, parameters: JSON.stringify(parameters) });

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "X-BLToken": token, "Content-Type": "application/x-www-form-urlencoded" },
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
