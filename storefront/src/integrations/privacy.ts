// RODO w koncie klienta: „Pobierz moje dane” (art. 15 i 20) i „Usuń konto” (art. 17).
// Usunięcie konta: zamówienia i zgłoszenia zostają (kwoty, produkty – potrzebne do rozliczeń), ale bez danych osobowych;
// newsletter, powiadomienia o dostępności, wiadomości i zapisane koszyki są kasowane. Faktury są w WAPRO/BaseLinkerze.
// Tylko po stronie serwera.

import type { Payload, Where } from "payload";
import type { Customer } from "@/payload-types";
import { sendMail } from "./mail/send";
import * as T from "./mail/templates";

const ANON_EMAIL = "usuniete-konto@anonim.invalid";
const ANON_NAME = "Klient usunięty";
const mine = (c: Customer): Where => ({ or: [{ customer: { equals: c.id } }, { email: { equals: c.email } }] });
const byEmail = (c: Customer) => ({ email: { equals: c.email } });
const nameOf = (rel: unknown) => (rel && typeof rel === "object" ? (rel as { name?: string }).name ?? "" : "");

export async function exportCustomerData(payload: Payload, c: Customer) {
  const q = { depth: 1, limit: 1000, overrideAccess: true } as const;
  const [orders, reviews, newsletter, alerts, messages, returns, carts] = await Promise.all([
    payload.find({ collection: "orders", where: mine(c), sort: "-createdAt", ...q, depth: 0 }),
    payload.find({ collection: "reviews", where: byEmail(c), ...q }),
    payload.find({ collection: "newsletter", where: byEmail(c), ...q }),
    payload.find({ collection: "stock-alerts", where: byEmail(c), ...q }),
    payload.find({ collection: "form-submissions", where: byEmail(c), ...q, depth: 0 }),
    payload.find({ collection: "returns", where: byEmail(c), ...q, depth: 0 }),
    payload.find({ collection: "carts", where: byEmail(c), ...q, depth: 0 }),
  ]);
  return {
    opis: "Dane zapisane o Tobie w sklepie SONAX (KENOCHEM Kuczyński Sp. J.). Faktury przechowujemy w systemie księgowym.",
    wygenerowano: new Date().toISOString(),
    konto: {
      email: c.email, imie: c.firstName, nazwisko: c.lastName, telefon: c.phone, zalozone: c.createdAt,
      firma: c.b2b?.company ? { nazwa: c.b2b.company, nip: c.b2b.nip } : undefined,
      adresy: (c.addresses ?? []).map((a) => ({ nazwa: a.label, odbiorca: a.fullName, firma: a.company, ulica: a.street, kod: a.postcode, miasto: a.city, kraj: a.country })),
      zgody: c.consents,
    },
    zamowienia: orders.docs.map((o) => ({
      numer: o.orderNumber, data: o.createdAt, status: o.status, kwota: o.total, email: o.email, telefon: o.phone,
      produkty: (o.items ?? []).map((i) => ({ nazwa: i.name, wariant: i.variantLabel, ilosc: i.quantity, cena: i.priceGross })),
      dostawa: { metoda: o.shipping?.method, koszt: o.shipping?.price, odbiorca: o.shipping?.fullName, firma: o.shipping?.company, ulica: o.shipping?.street, kod: o.shipping?.postcode, miasto: o.shipping?.city, punkt: o.shipping?.point?.code },
      faktura: o.invoice?.wanted ? { firma: o.invoice.company, nip: o.invoice.nip, adres: [o.invoice.street, o.invoice.postcode, o.invoice.city].filter(Boolean).join(", ") } : undefined,
      platnosc: { metoda: o.payment?.method, status: o.payment?.status },
      uwagi: o.customerNote,
    })),
    opinie: reviews.docs.map((r) => ({ produkt: nameOf(r.product), ocena: r.rating, podpis: r.author, tytul: r.title, tresc: r.content, status: r.status, data: r.createdAt })),
    newsletter: newsletter.docs.map((n) => ({ status: n.status, zgoda: n.consentAt, zrodlo: n.source })),
    powiadomienia_o_dostepnosci: alerts.docs.map((a) => ({ produkt: nameOf(a.product), status: a.status, data: a.createdAt })),
    wiadomosci: messages.docs.map((m) => ({ rodzaj: m.type, temat: m.subject, tresc: m.message, imie: m.name, telefon: m.phone, data: m.createdAt })),
    zwroty_i_reklamacje: returns.docs.map((r) => ({ numer: r.number, rodzaj: r.type, zamowienie: r.orderNumber, produkty: r.products, powod: r.reason, status: r.status, data: r.createdAt })),
    zapisane_koszyki: carts.docs.map((k) => ({ produkty: k.summary, wartosc: k.total, status: k.status, zgoda: k.consentAt })),
  };
}

// CSV z zamówieniami (Excel: średnik, BOM)
export function ordersCsv(data: Awaited<ReturnType<typeof exportCustomerData>>) {
  const cell = (v: unknown) => {
    const t = v == null ? "" : String(v);
    return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const rows = [["Numer", "Data", "Status", "Kwota", "Produkty", "Dostawa", "Adres"]].concat(
    data.zamowienia.map((o) => [
      o.numer ?? "", new Date(o.data).toLocaleString("pl-PL"), o.status ?? "", String(o.kwota ?? "").replace(".", ","),
      o.produkty.map((p) => `${p.ilosc}× ${p.nazwa}`).join(", "), o.dostawa.metoda ?? "",
      o.dostawa.punkt || [o.dostawa.ulica, o.dostawa.kod, o.dostawa.miasto].filter(Boolean).join(", "),
    ]),
  );
  return "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
}

export async function deleteCustomer(payload: Payload, c: Customer) {
  const all = { limit: 1000, depth: 0, overrideAccess: true } as const;

  // Potwierdzenie na adres konta – zanim adres zniknie z bazy
  const store = await payload.findGlobal({ slug: "store-settings", overrideAccess: true });
  await sendMail(payload, { to: c.email, ...T.accountDeleted(store as T.Shop, c.firstName) }).catch(() => null);

  const orders = await payload.find({ collection: "orders", where: mine(c), ...all });
  for (const o of orders.docs) {
    await payload.update({
      collection: "orders", id: o.id, overrideAccess: true, context: { skipBaseLinker: true },
      data: {
        customer: null, email: ANON_EMAIL, phone: null, customerNote: null,
        shipping: { ...o.shipping, fullName: ANON_NAME, company: null, street: null, postcode: null },
        invoice: { ...o.invoice, company: null, nip: null, fullName: null, street: null, postcode: null },
      } as never,
    });
  }
  const returns = await payload.find({ collection: "returns", where: byEmail(c), ...all });
  for (const r of returns.docs) {
    await payload.update({ collection: "returns", id: r.id, overrideAccess: true, data: { name: ANON_NAME, email: ANON_EMAIL, phone: null, bankAccount: null } as never });
  }
  const reviews = await payload.find({ collection: "reviews", where: byEmail(c), ...all });
  for (const r of reviews.docs) await payload.update({ collection: "reviews", id: r.id, overrideAccess: true, data: { author: "Klient", email: null } as never });

  for (const collection of ["newsletter", "stock-alerts", "form-submissions", "carts"] as const) {
    await payload.delete({ collection, where: byEmail(c), overrideAccess: true });
  }
  // Dziennik maili („Zamówienie … → adres”) – adres zastępujemy
  const logs = await payload.find({ collection: "integration-logs", where: { message: { contains: c.email } }, ...all, select: { message: true } });
  for (const l of logs.docs) {
    await payload.update({ collection: "integration-logs", id: l.id, overrideAccess: true, data: { message: String(l.message ?? "").split(c.email).join("[usunięty adres]") } });
  }
  await payload.delete({ collection: "customers", id: c.id, overrideAccess: true });
  return { orders: orders.docs.length };
}
