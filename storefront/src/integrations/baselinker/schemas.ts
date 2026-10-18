// Walidacja danych wysyłanych do BaseLinkera (addOrder) – limity długości i typy
// przepisane z dokumentacji metody addOrder. Zamówienie, które nie przejdzie walidacji,
// nie zostanie wysłane, a błędy będą widoczne w panelu przy zamówieniu.

import { z } from "zod";

const str = (max: number) => z.string().max(max, `maks. ${max} znaków`);
const flag = z.enum(["0", "1"]);
const country = z.string().regex(/^[A-Z]{2}$/, "2-literowy kod kraju, np. PL");

export const addOrderProductSchema = z.object({
  storage: z.enum(["db", "shop", "warehouse"]),
  storage_id: z.number().int().min(0),
  product_id: z.string(),
  variant_id: z.number().int().min(0),
  name: z.string().min(1, "brak nazwy produktu"),
  sku: z.string(),
  ean: z.string(),
  location: z.string(),
  warehouse_id: z.number().int().positive().optional(),
  attributes: z.string(),
  price_brutto: z.number().nonnegative(),
  tax_rate: z.number().refine((v) => (v >= 0 && v <= 100) || [-1, -0.02, -0.03].includes(v), "stawka VAT 0–100 lub -1/-0.02/-0.03"),
  quantity: z.number().int().positive("ilość musi być > 0"),
  weight: z.number().nonnegative(),
});

export const addOrderSchema = z
  .object({
    order_status_id: z.number().int().positive("ustaw ID statusu zamówienia w ustawieniach BaseLinkera"),
    custom_source_id: z.number().int().positive().optional(),
    date_add: z.number().int().positive(),
    currency: z.string().regex(/^[A-Z]{3}$/),
    payment_method: str(30).min(1, "brak metody płatności"),
    payment_method_cod: flag,
    paid: flag,
    user_comments: str(510),
    admin_comments: str(200),
    email: str(150).email("nieprawidłowy e-mail"),
    phone: str(100),
    user_login: str(30),
    delivery_method: str(30).min(1, "brak metody dostawy"),
    delivery_price: z.number().nonnegative(),
    delivery_fullname: str(156),
    delivery_company: str(156),
    delivery_address: str(156),
    delivery_postcode: str(100),
    delivery_city: str(100),
    delivery_state: str(35),
    delivery_country_code: country,
    delivery_point_id: str(40),
    delivery_point_name: str(100),
    delivery_point_address: str(100),
    delivery_point_postcode: str(100),
    delivery_point_city: str(100),
    invoice_fullname: str(500),
    invoice_company: str(500),
    invoice_nip: str(100),
    invoice_address: str(500),
    invoice_postcode: str(20),
    invoice_city: str(100),
    invoice_state: str(35),
    invoice_country_code: z.union([country, z.literal("")]),
    want_invoice: flag,
    extra_field_1: str(50),
    extra_field_2: str(50),
    products: z.array(addOrderProductSchema).min(1, "zamówienie bez produktów"),
  })
  .superRefine((o, ctx) => {
    if (!o.delivery_point_id && (!o.delivery_fullname || !o.delivery_address || !o.delivery_postcode || !o.delivery_city))
      ctx.addIssue({ code: "custom", message: "brak pełnego adresu dostawy (lub punktu odbioru)", path: ["delivery_address"] });
    if (o.want_invoice === "1" && !o.invoice_nip && !o.invoice_fullname)
      ctx.addIssue({ code: "custom", message: "faktura: podaj NIP lub nazwę nabywcy", path: ["invoice_nip"] });
  });

export const formatIssues = (e: z.ZodError) => e.issues.map((i) => `${i.path.join(".") || "zamówienie"}: ${i.message}`);
