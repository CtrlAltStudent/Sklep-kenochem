"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Pierwsze wejście po wczytaniu strony niesie informację, skąd ktoś przyszedł. Przy przejściach wewnątrz sklepu już jej nie wysyłamy.
let firstHit = true;

// Jedno wejście na adres. Brakująca strona (404) jest oznaczona w szablonie atrybutem data-sonax-404.
function categoryFilter(path: string, search: string) {
  if (!path.startsWith("/kategoria/")) return "";
  const query = new URLSearchParams(search);
  const kept = new URLSearchParams();
  const sub = query.get("sub") || "";
  const typ = query.get("typ") || "";
  if (sub) kept.set("sub", sub);
  if (typ) kept.set("typ", typ);
  return kept.toString();
}

export function StatBeacon() {
  const path = usePathname();
  const search = useSearchParams();
  const filter = categoryFilter(path || "", search.toString());
  useEffect(() => {
    if (!path) return;
    const kind = document.querySelector("[data-sonax-404]") ? "notfound" : "view";
    const origin = firstHit ? { ref: document.referrer, qs: window.location.search } : undefined;
    firstHit = false;
    const send = (beat: string, extra?: { ref: string; qs: string }) => {
      const body = JSON.stringify({ path, kind: beat, filter, ...extra });
      fetch("/api/stat", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    };
    send(kind, origin);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") send("here");
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [path, filter]);
  return null;
}

// Na stronie wyników: wpisane hasło i liczba znalezionych produktów.
export function SearchBeacon({ query, results }: { query: string; results: number }) {
  useEffect(() => {
    if (!query.trim()) return;
    const body = JSON.stringify({ path: "/szukaj", kind: "search", search: query, results });
    fetch("/api/stat", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  }, [query, results]);
  return null;
}
