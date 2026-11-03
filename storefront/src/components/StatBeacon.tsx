"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Jedno wejście na adres. Brakująca strona (404) jest oznaczona w szablonie atrybutem data-sonax-404.
export function StatBeacon() {
  const path = usePathname();
  useEffect(() => {
    if (!path) return;
    const kind = document.querySelector("[data-sonax-404]") ? "notfound" : "view";
    const body = JSON.stringify({ path, kind });
    fetch("/api/stat", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  }, [path]);
  return null;
}
