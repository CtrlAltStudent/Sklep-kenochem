// Walidacja formularzy – wspólna dla przeglądarki i serwera.
import { z } from "zod";

// NIP: 10 cyfr + suma kontrolna (wagi 6,5,7,2,3,4,5,6,7)
export function isValidNip(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 10) return false;
  const w = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = w.reduce((s, x, i) => s + x * Number(d[i]), 0);
  return sum % 11 === Number(d[9]);
}

const phone = z.string().trim().regex(/^[+\d][\d\s()-]{6,19}$/, "Podaj poprawny numer telefonu");
const consent = z.literal(true, { error: "Zgoda jest wymagana" });

export const contactSchema = z.object({
  type: z.literal("contact"),
  name: z.string().trim().min(2, "Podaj imię i nazwisko").max(120),
  email: z.string().trim().email("Podaj poprawny adres e-mail").max(150),
  phone: phone.optional().or(z.literal("")),
  subject: z.enum(["Zapytanie o produkt", "Zamówienie i dostawa", "Zwrot lub reklamacja", "Oferta hurtowa", "Inne"]),
  message: z.string().trim().min(10, "Wiadomość jest za krótka").max(4000),
  consent,
  website: z.string().optional(), // pułapka na boty – pole niewidoczne dla ludzi (sprawdzane w /api/forms)
  productSlug: z.string().max(200).optional(), // „Zapytaj o produkt” – którego produktu dotyczy pytanie
});

export const b2bSchema = z.object({
  type: z.literal("b2b"),
  name: z.string().trim().min(2, "Podaj imię i nazwisko").max(120),
  company: z.string().trim().min(2, "Podaj nazwę firmy").max(200),
  nip: z.string().trim().refine(isValidNip, "Nieprawidłowy NIP (sprawdź cyfry)"),
  email: z.string().trim().email("Podaj poprawny adres e-mail").max(150),
  phone,
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  consent,
  website: z.string().optional(),
});

export const newsletterSchema = z.object({
  type: z.literal("newsletter"),
  email: z.string().trim().email("Podaj poprawny adres e-mail").max(150),
  consent,
  website: z.string().optional(),
});

export const reviewSchema = z.object({
  type: z.literal("review"),
  product: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Wybierz ocenę").max(5),
  author: z.string().trim().min(2, "Podaj podpis (np. imię)").max(60),
  email: z.string().trim().email("Podaj poprawny adres e-mail").max(150),
  title: z.string().trim().min(3, "Dodaj krótki tytuł").max(120),
  content: z.string().trim().min(20, "Opinia powinna mieć min. 20 znaków").max(3000),
  consent,
  website: z.string().optional(),
});

export const returnSchema = z.object({
  type: z.literal("return"),
  kind: z.enum(["return", "complaint"]),
  orderNumber: z.string().trim().min(3, "Podaj numer zamówienia").max(40),
  name: z.string().trim().min(2, "Podaj imię i nazwisko").max(120),
  email: z.string().trim().email("Podaj poprawny adres e-mail").max(150),
  phone: phone.optional().or(z.literal("")),
  products: z.string().trim().min(3, "Wpisz produkty i ilości").max(2000),
  reason: z.string().trim().max(3000).optional().or(z.literal("")),
  resolution: z.enum(["refund", "exchange", "repair", "discount"]),
  bankAccount: z.string().trim().max(40).refine((v) => !v || v.replace(/\s/g, "").length >= 26, "Numer konta powinien mieć 26 cyfr").optional().or(z.literal("")),
  consent,
  website: z.string().optional(),
});

export const stockAlertSchema = z.object({
  type: z.literal("stock-alert"),
  product: z.string().min(1),
  email: z.string().trim().email("Podaj poprawny adres e-mail").max(150),
  website: z.string().optional(),
});

export const formSchema = z.discriminatedUnion("type", [contactSchema, b2bSchema, newsletterSchema, reviewSchema, returnSchema, stockAlertSchema]);
export type ContactInput = z.input<typeof contactSchema>;
export type B2BInput = z.input<typeof b2bSchema>;

export const fieldErrors = (e: z.ZodError) =>
  Object.fromEntries(e.issues.map((i) => [String(i.path[0] ?? "form"), i.message]));
