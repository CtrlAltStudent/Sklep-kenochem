"use client";

import { useField } from "@payloadcms/ui";
import { useEffect, useState } from "react";

// Lista marek z log wgranych na stronie głównej. Innej marki nie da się tu wpisać.
export function BrandSelect({ path }: { path: string }) {
  const { value, setValue } = useField<string>({ path });
  const [names, setNames] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/globals/homepage?depth=0", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const list = (d?.brandLogos ?? []) as { name?: string | null }[];
        setNames(list.map((b) => b.name?.trim()).filter((n): n is string => Boolean(n)));
      })
      .catch(() => {});
  }, []);
  const current = value || "";
  const known = names.some((n) => n.toLowerCase() === current.toLowerCase());
  return (
    <label className="kc-brand">
      <span>Marka</span>
      <select value={current} onChange={(e) => setValue(e.target.value)}>
        <option value="">— bez marki —</option>
        {names.map((n) => <option key={n} value={n}>{n}</option>)}
        {current && !known && <option value={current}>{current} (spoza listy, przy zapisie zniknie)</option>}
      </select>
    </label>
  );
}
