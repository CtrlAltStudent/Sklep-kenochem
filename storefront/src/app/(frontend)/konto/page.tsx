import type { Metadata } from "next";
import { Suspense } from "react";
import { Account } from "@/components/account/Account";

export const metadata: Metadata = { title: "Moje konto", robots: { index: false } };

// Logowanie / rejestracja albo – po zalogowaniu – zamówienia, dane i adresy, hasło
export default function AccountPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-500">Wczytuję…</div>}>
      <Account />
    </Suspense>
  );
}
