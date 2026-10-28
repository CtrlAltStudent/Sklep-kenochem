import Link from "next/link";
import type { AdminViewServerProps } from "payload";
import { BookOpen, Lightbulb } from "lucide-react";
import { AdminPage } from "./AdminPage";
import { HELP } from "../help";
import { PrintButton } from "./AdminClient";

// Widok /admin/pomoc – instrukcja panelu (treść w src/payload/help.ts). Do wydruku: przycisk „Drukuj / PDF”.

// „[tekst](/admin/...)” → link w panelu
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        return m ? <Link key={i} href={m[2]} className="kc-help__link">{m[1]}</Link> : <span key={i}>{p}</span>;
      })}
    </>
  );
}

export function HelpView(props: AdminViewServerProps) {
  return (
    <AdminPage {...props}>
      <div className="kc-dash kc-help">
        <section className="kc-hero kc-hero--compact">
          <div>
            <p className="kc-hero__date">Pomoc</p>
            <h1 className="kc-hero__title">Instrukcja panelu sklepu</h1>
            <p className="kc-hero__text">Jak obsługiwać zamówienia, produkty, treści, Google i ustawienia. Kliknij rozdział albo wydrukuj całość.</p>
          </div>
          <div className="kc-hero__actions"><PrintButton /></div>
        </section>

        <nav className="kc-card kc-help__toc" aria-label="Spis treści">
          <b><BookOpen size={16} /> Spis treści</b>
          <ol>{HELP.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}</ol>
        </nav>

        {HELP.map((s, n) => (
          <section key={s.id} id={s.id} className="kc-card kc-help__sec">
            <h2><span>{n + 1}</span> {s.title}</h2>
            {s.intro && <p className="kc-help__intro"><Rich text={s.intro} /></p>}
            <ol className="kc-help__steps">{s.steps.map((t, i) => <li key={i}><Rich text={t} /></li>)}</ol>
            {s.tips?.map((t, i) => <p key={i} className="kc-help__tip"><Lightbulb size={15} /> <Rich text={t} /></p>)}
          </section>
        ))}
      </div>
    </AdminPage>
  );
}
