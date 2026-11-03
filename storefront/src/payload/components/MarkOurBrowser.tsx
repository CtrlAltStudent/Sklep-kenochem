"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Jedno wejście na ekran statystyk oznacza tę przeglądarkę. Odświeżenie jest tylko wtedy, gdy coś się zmieniło.
export function MarkOurBrowser() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/nas", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { changed?: boolean } | null) => {
        if (data?.changed) router.refresh();
      })
      .catch(() => {});
  }, [router]);
  return null;
}
