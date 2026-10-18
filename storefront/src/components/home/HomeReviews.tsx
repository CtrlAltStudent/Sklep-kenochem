import Link from "next/link";
import { BadgeCheck, MessageSquareHeart, Quote, Star } from "lucide-react";
import type { getLatestReviews } from "@/lib/cms";

// Profil firmy w Google (wizytówka) – tu klienci zostawiają opinie o sklepie
const GOOGLE_REVIEWS = "https://www.google.com/maps/search/?api=1&query=Kenochem%20Bia%C5%82ystok%20Andersa%2040";

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="flex" aria-label={`${value.toFixed(1)} na 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`${size} ${value >= n - 0.25 ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />)}
    </span>
  );
}

// Sekcja „Poznaj opinie naszych klientów” – tylko prawdziwe, zatwierdzone opinie z panelu (Marketing → Opinie o produktach)
export function HomeReviews({ data }: { data: Awaited<ReturnType<typeof getLatestReviews>> }) {
  const { reviews, count, average } = data;
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-accent uppercase">Opinie</p>
          <h2 className="text-2xl font-black tracking-tight text-navy sm:text-4xl">Poznaj opinie naszych klientów</h2>
          {count > 0 && (
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Stars value={average} /> <b className="text-ink">{average.toFixed(1)}</b> / 5 · {count} {count === 1 ? "opinia" : "opinii"} o produktach</p>
          )}
        </div>
        <a href={GOOGLE_REVIEWS} target="_blank" rel="noreferrer" className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-brand-800 ring-1 ring-brand-200 transition hover:bg-leaf-50 hover:ring-leaf">
          Opinie w Google ↗
        </a>
      </div>

      {reviews.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <article key={r.id} className="relative flex flex-col rounded-3xl bg-white p-6 ring-1 ring-brand-100">
              <Quote className="absolute top-5 right-5 h-8 w-8 text-leaf-100" />
              <Stars value={r.rating} />
              <h3 className="mt-3 font-black text-navy">{r.title}</h3>
              <p className="mt-1 line-clamp-4 text-sm leading-relaxed text-slate-600">{r.content}</p>
              <div className="mt-auto pt-4 text-xs text-slate-500">
                <p className="font-semibold text-ink">{r.author}{r.verified && <span className="ml-2 inline-flex items-center gap-1 text-green-700"><BadgeCheck className="h-3.5 w-3.5" /> potwierdzony zakup</span>}</p>
                {r.product && <Link href={`/produkt/${r.product.slug}`} className="mt-1 line-clamp-1 text-accent-dark hover:underline">{r.product.name}</Link>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-kc-gradient-deep flex flex-col items-start gap-6 overflow-hidden rounded-3xl p-8 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="bg-kc-gradient grid h-14 w-14 shrink-0 place-items-center rounded-2xl"><MessageSquareHeart className="h-7 w-7" /></span>
            <div>
              <h3 className="text-xl font-black">Kupiłeś u nas? Podziel się opinią</h3>
              <p className="mt-1 max-w-xl text-sm text-brand-100">Twoja opinia pomaga innym klientom wybrać właściwą chemię. Oceń kupiony produkt na jego stronie albo wystaw opinię naszej firmie w Google.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={GOOGLE_REVIEWS} target="_blank" rel="noreferrer" className="btn-kc rounded-xl px-5 py-3 text-sm font-bold">Oceń nas w Google</a>
            <Link href="/bestsellery" className="rounded-xl bg-white/10 px-5 py-3 text-sm font-bold ring-1 ring-white/25 hover:bg-white/20">Oceń produkt</Link>
          </div>
        </div>
      )}
    </section>
  );
}
