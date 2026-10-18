import type { Metadata } from "next";
import Image from "next/image";
import { BadgePercent, ClipboardCheck, Clock3, FileText, Headset, LogIn, Rocket, ShieldCheck, Truck, UserPlus, Zap } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { B2BForm } from "@/components/forms/Forms";

export const metadata: Metadata = {
  title: "Współpraca B2B – ceny hurtowe",
  description: "Dołącz do grona partnerów Kenochem. Indywidualne rabaty, ceny hurtowe, zamówienia 24/7 i wysyłka w 24 h dla myjni, warsztatów i firm.",
};

// Treść z kenochem.com/b2b
const benefits = [
  { icon: BadgePercent, title: "Indywidualne warunki handlowe", text: "Po rejestracji i weryfikacji konta otrzymasz dostęp do swoich dedykowanych rabatów i cen hurtowych." },
  { icon: Clock3, title: "Dostępność 24/7", text: "Składaj zamówienia o dowolnej porze, sprawdzaj stany magazynowe w czasie rzeczywistym i planuj zatowarowanie bez czekania na kontakt z handlowcem." },
  { icon: Zap, title: "Błyskawiczna realizacja", text: "Zamówienia złożone przez panel B2B mają u nas priorytet. Większość wysyłek realizujemy w ciągu 24h." },
  { icon: FileText, title: "Pełna historia i dokumentacja", text: "Wszystkie zamówienia i informacje w jednym, bezpiecznym miejscu." },
  { icon: Headset, title: "Wsparcie merytoryczne", text: "Jako nasz partner otrzymujesz dostęp do kart charakterystyki, materiałów marketingowych oraz doradztwa technicznego naszych ekspertów." },
];

const steps = [
  { icon: UserPlus, title: "Rejestracja", text: "Wypełnij formularz danymi swojej firmy." },
  { icon: ClipboardCheck, title: "Weryfikacja", text: "Nasz zespół aktywuje Twoje konto hurtowe w ciągu maksymalnie jednego dnia roboczego." },
  { icon: LogIn, title: "Zakupy", text: "Logujesz się i od razu widzisz ceny po swoich rabatach." },
  { icon: Truck, title: "Logistyka", text: "Oferujemy darmową dostawę przy spełnieniu minimum logistycznego oraz dogodne formy płatności." },
];

const brands = ["Kenotek", "Orion", "Eco Shine", "Freshtek", "Tenzi", "Vikan", "Kwazar", "Sonax", "K2", "Draco"];

export default function B2BPage() {
  return (
    <div className="mx-auto max-w-shop px-4 pt-6">
      <Breadcrumbs items={[{ label: "Współpraca B2B" }]} />

      <header className="relative mt-4 overflow-hidden rounded-3xl bg-brand-950 text-white">
        <Image src="/brand/mYCIE-AUTA-1.jpg" alt="" fill priority sizes="100vw" className="object-cover object-right opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/85 to-brand-950/10" />
        <div className="relative max-w-2xl px-6 py-12 sm:px-12 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-lime px-3 py-1 text-xs font-bold text-brand-950"><Rocket className="h-3.5 w-3.5" /> Strefa partnerów</span>
          <h1 className="mt-4 text-4xl leading-[1.05] font-black tracking-tight sm:text-6xl">Dołącz do grona partnerów Kenochem</h1>
          <p className="mt-5 text-lg text-brand-100">Profesjonalny dystrybutor rozwiązań dla branży Automotive i przemysłu.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#formularz" className="rounded-xl bg-lime px-6 py-3.5 font-bold text-brand-950 transition hover:bg-white">Załóż konto hurtowe</a>
            <a href="tel:+48500021705" className="rounded-xl border border-white/30 px-6 py-3.5 font-semibold transition hover:bg-white/10">Zadzwoń: 500 021 705</a>
          </div>
        </div>
      </header>

      <div className="no-scrollbar -mx-4 mt-6 flex gap-3 overflow-x-auto px-4">
        {brands.map((b) => (
          <span key={b} className="shrink-0 rounded-full bg-white px-5 py-2 text-sm font-bold tracking-wide text-slate-500 uppercase ring-1 ring-brand-100">{b}</span>
        ))}
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_440px]">
        <div className="space-y-14">
          <section>
            <p className="text-xs font-bold tracking-widest text-accent uppercase">Kim jesteśmy?</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">Więcej niż dostawca chemii</h2>
            <div className="mt-5 space-y-4 text-[17px] leading-relaxed text-slate-600">
              <p><b className="text-ink">Kenochem</b> to wyspecjalizowany dystrybutor najwyższej jakości chemii samochodowej, akcesoriów detailingowych oraz profesjonalnych rozwiązań dla myjni i warsztatów. Od lat dostarczamy sprawdzone produkty od liderów rynku (<em>Kenotek, Orion, Eco Shine, Freshtek i wielu innych</em>) oraz doradzamy naszym klientom, jak optymalizować procesy czyszczenia i pielęgnacji pojazdów.</p>
              <p>Naszą misją jest dostarczanie nie tylko towaru, ale przede wszystkim przewagi technologicznej i handlowej naszym partnerom. Nasz panel to narzędzie stworzone, aby maksymalnie uprościć proces zakupowy i dać Ci realną przewagę rynkową.</p>
            </div>
          </section>

          <section>
            <p className="text-xs font-bold tracking-widest text-accent uppercase">Korzyści</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">Dlaczego warto z nami współpracować?</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {benefits.map(({ icon: Icon, title, text }, i) => (
                <div key={title} className={`group rounded-2xl bg-white p-6 ring-1 ring-brand-100 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/5 ${i === 0 ? "sm:col-span-2 sm:flex sm:items-center sm:gap-6" : ""}`}>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-accent group-hover:text-white"><Icon className="h-6 w-6" /></span>
                  <div className={i === 0 ? "mt-4 sm:mt-0" : "mt-4"}>
                    <h3 className="font-bold text-navy">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-xs font-bold tracking-widest text-accent uppercase">Jak to działa</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">Proste zasady współpracy</h2>
            <p className="mt-2 text-slate-600">Działamy w sposób przejrzysty, abyś mógł skupić się na sprzedaży, a nie na formalnościach.</p>
            <ol className="relative mt-8 grid gap-6 sm:grid-cols-4">
              <div className="absolute top-7 right-[12%] left-[12%] hidden h-0.5 bg-gradient-to-r from-brand-200 via-accent to-brand-200 sm:block" aria-hidden />
              {steps.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="relative text-center">
                  <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-700 text-white shadow-lg shadow-brand-700/30 ring-4 ring-white">
                    <Icon className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-lime text-xs font-black text-brand-950">{i + 1}</span>
                  </span>
                  <h3 className="mt-4 font-bold text-navy">{title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-8 text-white sm:p-10">
            <ShieldCheck className="absolute -right-6 -bottom-6 h-40 w-40 text-white/10" />
            <h2 className="text-2xl font-black">Twój sukces to nasz cel</h2>
            <p className="relative mt-3 max-w-2xl leading-relaxed text-brand-100">W Kenochem nie jesteś tylko kolejnym numerem w systemie – jesteś naszym Partnerem. Zapewniamy Ci stabilność dostaw, najlepsze ceny na rynku i wsparcie, na które zawsze możesz liczyć. Wypełnij formularz i przekonaj się, że profesjonalna chemia to dopiero początek naszej wspólnej drogi!</p>
          </section>
        </div>

        <aside id="formularz" className="scroll-mt-40 lg:sticky lg:top-40 lg:self-start">
          <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-brand-900/10 ring-1 ring-brand-100 sm:p-8">
            <h2 className="text-2xl font-extrabold text-navy">Wypełnij formularz</h2>
            <p className="mt-1 mb-6 text-sm text-slate-500">i dołącz do grona partnerów Kenochem. Weryfikacja do 1 dnia roboczego.</p>
            <B2BForm />
          </div>
        </aside>
      </div>
    </div>
  );
}
