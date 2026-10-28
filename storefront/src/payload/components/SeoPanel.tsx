"use client";

// Zakładka SEO: podgląd wyniku w Google, ocena i konkretne podpowiedzi (w stylu Rank Math).
// kind=product na produkcie, page na podstronie, post na wpisie bloga.

import { useField, useFormFields } from "@payloadcms/ui";
import { CheckCircle2, CircleAlert, CircleX, Wand2 } from "lucide-react";

type Kind = "product" | "page" | "post";
type Mark = boolean | "warn";
type Check = { ok: Mark; text: string; hint?: string };

const strip = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");
const has = (hay: string, needle: string) => Boolean(needle) && norm(hay).includes(norm(needle));
const SITE = "sonax.sklep.pl";

function times(hay: string, needle: string) {
  const h = norm(hay);
  const n = norm(needle);
  if (!n) return 0;
  let count = 0;
  let i = 0;
  while ((i = h.indexOf(n, i)) !== -1) { count++; i += n.length; }
  return count;
}

function Counter({ n, min, max }: { n: number; min: number; max: number }) {
  const tone = n === 0 ? "is-bad" : n < min || n > max ? "is-warn" : "is-ok";
  return <span className={`kc-seo__count ${tone}`}>{n} / {max}</span>;
}

export function SeoPanel({ kind = "product" }: { kind?: Kind }) {
  const f = useFormFields(([fields]) => fields);
  const title = useField<string>({ path: "seo.title" });
  const desc = useField<string>({ path: "seo.description" });
  const v = (k: string) => String(f[k]?.value ?? "");

  const name = v(kind === "product" ? "name" : "title");
  const slug = v("slug");
  const keyword = (v("seo.focusKeyword") || v("seoExtra.focusKeyword")).trim();
  const bodyRaw = kind === "product" ? v("descriptionHtml") : kind === "post" ? v("excerpt") : v("intro");
  const body = strip(bodyRaw);
  const short = kind === "product" ? v("shortDescription") : body;
  const words = body ? body.split(/\s+/).filter(Boolean) : [];
  const shownTitle = `${title.value || name}${kind === "product" ? " | Sklep Sonax" : ""}`;
  const autoDesc = (short || body).slice(0, 158);
  const shownDesc = desc.value || autoDesc;
  const path = kind === "product" ? "produkt" : kind === "post" ? "blog" : "strona";
  const firstBits = words.slice(0, 100).join(" ");
  const hits = keyword ? times(body, keyword) : 0;
  const density = words.length ? (hits * keyword.split(/\s+/).length / words.length) * 100 : 0;
  let imageCount = f.cover?.value ? 1 : 0;
  if (kind === "product") {
    imageCount = 0;
    for (let i = 0; i < 24; i++) if (f[`images.${i}.url`] || f[`images.${i}.media`]) imageCount++;
  }
  const images = imageCount;
  const links = (bodyRaw.match(/href\s*=\s*["'][^"']+["']/gi) ?? []).length;

  const phrase: Check[] = keyword
    ? [
        { ok: has(shownTitle, keyword), text: `Fraza „${keyword}” jest w tytule w Google.`, hint: `Zacznij tytuł od frazy, np. „${keyword} – ${name.slice(0, 40)}”.` },
        { ok: has(shownDesc, keyword), text: `Fraza „${keyword}” jest w opisie w Google.`, hint: `Dopisz zdanie: „${keyword} – wysyłka w 24 h ze sklepu Sonax w Białymstoku.”` },
        { ok: has(slug.replace(/-/g, " "), keyword) ? true : "warn", text: "Fraza jest w adresie strony.", hint: "Adres z frazą pomaga, ale zmiana obecnego adresu wymaga przekierowania ze starego." },
        { ok: has(firstBits, keyword), text: "Fraza jest w pierwszych zdaniach tekstu.", hint: "Wstaw frazę w pierwszym akapicie, naturalnie, nie jako lista słów." },
        { ok: hits === 0 ? false : density > 3 ? "warn" : true, text: hits === 0 ? "Fraza nie pojawia się w tekście." : `Fraza w tekście ${hits} ${hits === 1 ? "raz" : "razy"} (ok. ${density.toFixed(1)}%).`, hint: hits === 0 ? "Użyj frazy 2–4 razy: na początku, przy zastosowaniu i przy pojemności." : "Fraza powtarza się za często. Zostaw 2–4 naturalne użycia." },
      ]
    : [{ ok: "warn", text: "Brak frazy kluczowej.", hint: "Wpisz jedną frazę, tak jak wpisałby ją klient, np. „wosk twardy do auta”." }];

  const google: Check[] = [
    { ok: shownTitle.length >= 30 && shownTitle.length <= 65 ? true : "warn", text: `Tytuł w Google ma ${shownTitle.length} znaków (najlepiej 30–65).`, hint: shownTitle.length > 65 ? `Skróć do około 60 znaków. Teraz Google utnie go po: „${shownTitle.slice(0, 60)}”.` : "Dopisz do tytułu pojemność albo zastosowanie, żeby miał około 50 znaków." },
    { ok: desc.value ? (desc.value.length >= 110 && desc.value.length <= 160 ? true : "warn") : "warn", text: desc.value ? `Opis w Google ma ${desc.value.length} znaków (najlepiej 110–160).` : "Brak własnego opisu w Google.", hint: desc.value ? (desc.value.length > 160 ? "Skróć opis, ostatnie słowa i tak znikną." : "Dopisz korzyść i wezwanie, np. wysyłka albo zastosowanie.") : "Napisz 1–2 zdania: co to jest, do czego służy i dlaczego warto kupić tutaj." },
    { ok: !f["seo.noindex"]?.value, text: f["seo.noindex"]?.value ? "Strona jest ukryta przed wyszukiwarkami." : "Widoczna dla wyszukiwarek.", hint: "Odznacz „Ukryj przed wyszukiwarkami”, jeśli ta strona ma się pojawiać w Google." },
  ];

  const content: Check[] = kind === "product"
    ? [
        { ok: words.length >= 150 ? true : words.length >= 60 ? "warn" : false, text: `Opis produktu: ${words.length} słów (najlepiej od 150).`, hint: "Dopisz zastosowanie, sposób użycia, pojemność i na jakich powierzchniach działa." },
        { ok: links > 0 ? true : "warn", text: links ? `Linki w opisie: ${links}.` : "W opisie nie ma linku do innej strony sklepu.", hint: "Dodaj link do kategorii albo do produktu, który kupuje się razem z tym." },
        { ok: /<h2[\s>]/i.test(bodyRaw) || words.length < 80 ? true : "warn", text: "Śródtytuły w opisie.", hint: "Podziel dłuższy opis śródtytułami: Zastosowanie, Sposób użycia, Skład." },
        { ok: Boolean(short) ? true : "warn", text: short ? "Krótki opis pod nazwą jest." : "Brak krótkiego opisu pod nazwą.", hint: "Jedno zdanie pod tytułem: co klient dostaje i do czego tego użyje." },
      ]
    : [
        { ok: words.length >= (kind === "post" ? 40 : 40) ? true : words.length >= 15 ? "warn" : false, text: `${kind === "post" ? "Zajawka" : "Wstęp"}: ${words.length} słów.`, hint: "Napisz 2–3 zdania, które same zachęcają do czytania i zawierają frazę." },
      ];

  const facts: Check[] = kind === "product"
    ? [
        { ok: images >= 3 ? true : images >= 1 ? "warn" : false, text: `Zdjęcia: ${images} (najlepiej min. 3).`, hint: "Dodaj zdjęcie opakowania, zdjęcie w użyciu i zdjęcie efektu." },
        { ok: Boolean(v("ean")), text: v("ean") ? "EAN jest podany." : "Brak EAN.", hint: "Bez EAN Zakupy Google mogą rzadziej pokazywać produkt." },
        { ok: Boolean(v("brand")), text: v("brand") ? `Marka: ${v("brand")}.` : "Brak marki.", hint: "Uzupełnij markę – Google i filtry w sklepie jej potrzebują." },
        { ok: Boolean(v("category")), text: v("category") ? "Kategoria jest przypisana." : "Brak kategorii.", hint: "Przypisz kategorię. Bez niej produkt słabiej trafia w działy sklepu i w Google." },
        { ok: !f["merchant.exclude"]?.value ? true : "warn", text: f["merchant.exclude"]?.value ? "Wyłączony z Zakupów Google." : "Trafia do Zakupów Google.", hint: "Odznacz wykluczenie, jeśli produkt ma być w reklamach produktowych." },
      ]
    : kind === "post"
      ? [{ ok: Boolean(f.cover?.value) ? true : "warn", text: f.cover?.value ? "Wpis ma zdjęcie główne." : "Brak zdjęcia głównego.", hint: "Dodaj poziome zdjęcie, min. 1600 × 900 px. Google chętniej pokazuje artykuły ze zdjęciem." }]
      : [];

  const groups = [
    { title: "Fraza kluczowa", items: phrase },
    { title: "Wynik w Google", items: google },
    { title: "Treść", items: content },
    ...(facts.length ? [{ title: kind === "product" ? "Zdjęcia i dane produktu" : "Zdjęcie", items: facts }] : []),
  ];
  const all = groups.flatMap((g) => g.items);
  const score = Math.round((all.reduce((s, c) => s + (c.ok === true ? 1 : c.ok === "warn" ? 0.5 : 0), 0) / all.length) * 100);
  const tone = score >= 80 ? "is-ok" : score >= 50 ? "is-warn" : "is-bad";

  return (
    <div className="kc-seo">
      <div className="kc-seo__preview">
        <small>Podgląd w Google</small>
        <div className="kc-seo__serp">
          <span className="kc-seo__url">{SITE} › {path} › {slug || "…"}</span>
          <span className="kc-seo__title">{shownTitle.length > 65 ? `${shownTitle.slice(0, 62)}…` : shownTitle}</span>
          <span className="kc-seo__desc">{shownDesc ? (shownDesc.length > 160 ? `${shownDesc.slice(0, 157)}…` : shownDesc) : "Brak opisu – Google weźmie dowolny fragment strony."}</span>
        </div>
        <div className="kc-seo__counts">
          <span>Tytuł <Counter n={(title.value || name).length} min={20} max={kind === "product" ? 52 : 60} /></span>
          <span>Opis <Counter n={(desc.value ?? "").length} min={110} max={160} /></span>
          {(!title.value || !desc.value) && (
            <button type="button" onClick={() => { if (!title.value) title.setValue(name.slice(0, 60)); if (!desc.value && autoDesc) desc.setValue(autoDesc); }}>
              <Wand2 size={13} /> Uzupełnij z nazwy
            </button>
          )}
        </div>
      </div>
      <div className="kc-seo__checks">
        <div className="kc-seo__score"><b className={tone}>{score}</b><span>na 100 · ocena widoczności</span></div>
        {groups.map((g) => (
          <div key={g.title} className="kc-seo__group">
            <p>{g.title}</p>
            <ul>
              {g.items.map((c, i) => (
                <li key={i} className={c.ok === true ? "is-ok" : c.ok === "warn" ? "is-warn" : "is-bad"}>
                  {c.ok === true ? <CheckCircle2 size={15} /> : c.ok === "warn" ? <CircleAlert size={15} /> : <CircleX size={15} />}
                  <span>
                    {c.text}
                    {c.ok !== true && c.hint ? <small>{c.hint}</small> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
