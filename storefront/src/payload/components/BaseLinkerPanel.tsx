"use client";

import { useEffect, useState } from "react";
import { Button } from "@payloadcms/ui";

type Status = {
  mode: "mock" | "live" | "unconfigured";
  configured: Record<string, boolean>;
  autoSend: boolean;
  lastProductSyncAt?: string;
  lastStockSyncAt?: string;
};
type AnyRes = { ok: boolean; message: string; [k: string]: unknown };

const box: React.CSSProperties = { border: "1px solid var(--theme-elevation-150)", borderRadius: 8, padding: 16, marginBottom: 16, background: "var(--theme-elevation-0)" };
const pill = (bg: string): React.CSSProperties => ({ display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: bg, color: "#fff" });
const fmt = (d?: string) => (d ? new Date(d).toLocaleString("pl-PL") : "nigdy");

async function call(path: string, method = "POST", body?: unknown): Promise<AnyRes> {
  const res = await fetch(`/api/baselinker/${path}`, {
    method, credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function Table({ title, rows, cols }: { title: string; rows: Record<string, unknown>[]; cols: [string, string][] }) {
  if (!rows?.length) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <strong>{title}</strong>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6, fontSize: 13 }}>
        <thead><tr>{cols.map(([, h]) => <th key={h} style={{ textAlign: "left", borderBottom: "1px solid var(--theme-elevation-150)", padding: "4px 8px" }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i}>{cols.map(([k]) => <td key={k} style={{ padding: "4px 8px", borderBottom: "1px solid var(--theme-elevation-50)" }}>{String(r[k] ?? "")}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function BaseLinkerPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<AnyRes | null>(null);

  const refresh = () => fetch("/api/baselinker/status", { credentials: "include" }).then((r) => r.json()).then(setStatus).catch(() => {});
  useEffect(() => { refresh(); }, []);

  const run = async (key: string, path: string, body?: unknown) => {
    setBusy(key);
    setResult(null);
    try {
      setResult(await call(path, "POST", body));
    } catch (e) {
      setResult({ ok: false, message: (e as Error).message });
    } finally {
      setBusy(null);
      refresh();
    }
  };

  const mode = status?.mode;
  const warehouses = ((result?.warehouses as Record<string, unknown>[]) ?? []).map((w) => ({ ...w, key: `${w.warehouse_type}_${w.warehouse_id}` }));

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={box}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Połączenie z BaseLinkerem</h3>
          {mode === "live" && <span style={pill("#2b6e1a")}>Token ustawiony – tryb produkcyjny</span>}
          {mode === "mock" && <span style={pill("#b7791f")}>Tryb testowy (dane przykładowe)</span>}
          {mode === "unconfigured" && <span style={pill("#c53030")}>Brak tokena</span>}
        </div>
        <p style={{ margin: "8px 0", color: "var(--theme-elevation-600)", fontSize: 13 }}>
          Token API ustawia się w pliku <code>.env</code> (<code>BASELINKER_TOKEN=…</code>), nie w panelu – dzięki temu nie trafia do bazy danych ani kopii zapasowych.
          W BaseLinkerze: Moje konto → API → wygeneruj token.
        </p>
        {status && (
          <p style={{ margin: "8px 0", fontSize: 13 }}>
            Katalog {status.configured.inventory ? "✅" : "❌"} · Grupa cenowa {status.configured.priceGroup ? "✅" : "❌"} · Magazyn {status.configured.warehouse ? "✅" : "❌"} · Status zamówień {status.configured.orderStatus ? "✅" : "❌"} · Auto-wysyłka {status.autoSend ? "włączona" : "wyłączona"}
            <br />Ostatnia synchronizacja produktów: <b>{fmt(status.lastProductSyncAt)}</b> · stanów: <b>{fmt(status.lastStockSyncAt)}</b>
          </p>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button buttonStyle="primary" size="small" disabled={!!busy || mode === "unconfigured"} onClick={() => run("test", "test")}>
            {busy === "test" ? "Łączę…" : "1. Testuj połączenie i pobierz ID"}
          </Button>
          <Button buttonStyle="secondary" size="small" disabled={!!busy || mode === "unconfigured"} onClick={() => run("dry", "sync-products", { dryRun: true, limit: 50 })}>
            {busy === "dry" ? "Sprawdzam…" : "2. Podgląd synchronizacji (50 szt., bez zapisu)"}
          </Button>
          <Button buttonStyle="secondary" size="small" disabled={!!busy || mode === "unconfigured"} onClick={() => confirm("Zsynchronizować wszystkie produkty z BaseLinkera? Zmiany zostaną zapisane w sklepie.") && run("sync", "sync-products", {})}>
            {busy === "sync" ? "Synchronizuję…" : "3. Synchronizuj produkty"}
          </Button>
          <Button buttonStyle="secondary" size="small" disabled={!!busy || mode === "unconfigured"} onClick={() => run("stock", "sync-stock", {})}>
            {busy === "stock" ? "Aktualizuję…" : "Aktualizuj stany"}
          </Button>
        </div>
      </div>

      {result && (
        <div style={{ ...box, borderColor: result.ok ? "#2b6e1a" : "#c53030" }}>
          <strong style={{ color: result.ok ? "#2b6e1a" : "#c53030" }}>{result.ok ? "✔ " : "✖ "}{result.message}</strong>
          <Table title="Katalogi (wpisz ID w pole „ID katalogu”)" rows={result.inventories as Record<string, unknown>[]} cols={[["inventory_id", "ID"], ["name", "Nazwa"], ["default_price_group", "Domyślna grupa cen"], ["default_warehouse", "Domyślny magazyn"]]} />
          <Table title="Grupy cenowe" rows={result.priceGroups as Record<string, unknown>[]} cols={[["price_group_id", "ID"], ["name", "Nazwa"], ["currency", "Waluta"]]} />
          <Table title="Magazyny (do pola „Magazyn stanów” wpisz klucz)" rows={warehouses} cols={[["key", "Klucz"], ["name", "Nazwa"]]} />
          <Table title="Statusy zamówień" rows={result.statuses as Record<string, unknown>[]} cols={[["id", "ID"], ["name", "Nazwa"]]} />
          <Table title="Kategorie BaseLinkera (przypisz je w Sklep → Kategorie)" rows={result.categories as Record<string, unknown>[]} cols={[["category_id", "ID"], ["name", "Nazwa"], ["parent_id", "Nadrzędna"]]} />
          {Boolean(result.samples) && (
            <details style={{ marginTop: 12 }}>
              <summary>Przykładowe dane, które zostaną zapisane</summary>
              <pre style={{ fontSize: 12, maxHeight: 400, overflow: "auto" }}>{JSON.stringify(result.samples, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
