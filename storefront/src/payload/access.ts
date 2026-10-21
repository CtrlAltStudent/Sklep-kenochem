import type { Access, FieldAccess, PayloadRequest } from "payload";

// Role pracowników w panelu:
//  admin     – wszystko, w tym ustawienia i integracje
//  editor    – treści, produkty, kategorie (bez zamówień i ustawień)
//  orders    – obsługa zamówień i klientów
export type Role = "admin" | "editor" | "orders";

type StaffUser = { collection?: string; roles?: Role[] | null };

const staff = (req: PayloadRequest) => (req.user?.collection === "users" ? (req.user as StaffUser) : null);
export const hasRole = (req: PayloadRequest, ...roles: Role[]) => {
  const u = staff(req);
  return Boolean(u && (u.roles?.includes("admin") || roles.some((r) => u.roles?.includes(r))));
};

export const isAdmin: Access = ({ req }) => hasRole(req, "admin");
export const isStaff: Access = ({ req }) => Boolean(staff(req));
export const isEditor: Access = ({ req }) => hasRole(req, "editor");
export const isOrdersTeam: Access = ({ req }) => hasRole(req, "orders");
export const anyone: Access = () => true;
export const adminField: FieldAccess = ({ req }) => hasRole(req, "admin");

// Opublikowane dla wszystkich, szkice tylko dla pracowników
export const publishedOrStaff: Access = ({ req }) => (staff(req) ? true : { _status: { equals: "published" } });

// Klient widzi tylko swoje dane, pracownik – wszystko
export const selfOrStaff: Access = ({ req }) => {
  if (staff(req)) return true;
  if (req.user?.collection === "customers") return { id: { equals: req.user.id } };
  return false;
};

// Zamówienia: klient widzi tylko zamówienia przypisane do swojego konta, pracownik – wszystkie
export const ownOrdersOrStaff: Access = ({ req }) => {
  if (staff(req)) return true;
  if (req.user?.collection === "customers") return { customer: { equals: req.user.id } };
  return false;
};

// Pole tylko dla obsługi zamówień – także przy tworzeniu (rejestracja nie może sama nadać B2B/rabatu)
export const ordersTeamField: FieldAccess = ({ req }) => hasRole(req, "orders");
