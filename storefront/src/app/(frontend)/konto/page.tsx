import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Moje konto" };

const input = "w-full rounded-xl border-2 border-brand-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent";

export default function AccountPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 px-4 pt-10 md:grid-cols-2">
      <form className="space-y-3 rounded-3xl bg-white p-8 ring-1 ring-brand-100">
        <h1 className="text-2xl font-black">Zaloguj się</h1>
        <input type="email" placeholder="E-mail" className={input} autoComplete="email" />
        <input type="password" placeholder="Hasło" className={input} autoComplete="current-password" />
        <button type="button" className="w-full rounded-xl bg-brand-900 py-3.5 font-bold text-white hover:bg-accent">Zaloguj</button>
        <a className="block cursor-pointer text-center text-sm text-accent-dark hover:underline">Nie pamiętasz hasła?</a>
      </form>
      <div className="flex flex-col justify-center rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 p-8 text-white">
        <h2 className="text-2xl font-black">Nie masz konta?</h2>
        <ul className="mt-4 space-y-2 text-sm text-brand-100">
          <li>✓ Historia zamówień i faktury w jednym miejscu</li>
          <li>✓ Szybsze zakupy z zapisanymi adresami</li>
          <li>✓ Ulubione na każdym urządzeniu</li>
        </ul>
        <div className="mt-6 flex gap-3">
          <button className="rounded-xl bg-white px-5 py-3 font-semibold text-brand-900">Zarejestruj się</button>
          <Link href="/b2b" className="rounded-xl border border-white/30 px-5 py-3 font-semibold">Konto B2B</Link>
        </div>
      </div>
      <p className="text-center text-xs text-slate-400 md:col-span-2">Logowanie zostanie podłączone razem z backendem sklepu.</p>
    </div>
  );
}
