import type { Access, FieldAccess, PayloadRequest } from "payload";

// Role pracowników w panelu (administrator zawsze przechodzi):
//  admin      – wszystko, w tym ustawienia i integracje
//  editor     – produkty, kategorie, strony, blog
//  orders     – zamówienia, klienci, zwroty, wiadomości
//  marketing  – kody rabatowe, opinie, newsletter
//  warehouse  – produkty (stany, ceny, opisy) i powiadomienia o dostępności
export type Role = "admin" | "editor" | "orders" | "marketing" | "warehouse";

type StaffUser = { id?: number | string; collection?: string; roles?: Role[] | null };

const ALL: Role[] = ["admin", "editor", "orders", "marketing", "warehouse"];
// Rola bywa pusta na zalogowanym użytkowniku (token), choć w karcie konta jest „Administrator”.
// Trzymamy role odczytane z bazy i używamy ich, gdy na żądaniu listy nie ma.
const roleCache = new Map<string, Role[]>();

export const roleList = (roles: unknown): Role[] => {
  const raw = Array.isArray(roles) ? roles : roles ? [roles] : [];
  return raw
    .map((r) => (typeof r === "string" ? r : r && typeof r === "object" && "value" in r ? String((r as { value: unknown }).value) : ""))
    .filter((r): r is Role => ALL.includes(r as Role));
};

export const rememberRoles = (id: unknown, roles: unknown) => {
  const list = roleList(roles);
  if (id != null && list.length) roleCache.set(String(id), list);
};

const staff = (req: PayloadRequest) => (req.user?.collection === "users" ? (req.user as StaffUser) : null);

export const hasRole = (req: PayloadRequest, ...roles: Role[]) => {
  const u = staff(req);
  if (!u) return false;
  const live = roleList(u.roles);
  const known = u.id != null ? roleCache.get(String(u.id)) : undefined;
  const list = live.length ? live : known ?? [];
  if (!live.length && known?.length) u.roles = known;
  return list.includes("admin") || roles.some((r) => list.includes(r));
};

export const isAdminUser = (user?: { id?: unknown; roles?: unknown } | null) => {
  const live = roleList(user?.roles);
  if (live.includes("admin")) return true;
  return user?.id != null && roleCache.get(String(user.id))?.includes("admin") === true;
};

export const isAdmin: Access = ({ req }) => hasRole(req, "admin");
export const isStaff: Access = ({ req }) => Boolean(staff(req));
export const isEditor: Access = ({ req }) => hasRole(req, "editor");
export const isCatalog: Access = ({ req }) => hasRole(req, "editor", "warehouse");
export const isOrdersTeam: Access = ({ req }) => hasRole(req, "orders");
export const isPromo: Access = ({ req }) => hasRole(req, "editor", "marketing");
export const canReadCoupons: Access = ({ req }) => hasRole(req, "editor", "marketing", "orders");
export const isStockTeam: Access = ({ req }) => hasRole(req, "orders", "warehouse");
export const anyone: Access = () => true;
export const adminField: FieldAccess = ({ req }) => hasRole(req, "admin");

// Opublikowane dla wszystkich, szkice tylko dla pracowników
export const publishedOrStaff: Access = ({ req }) => (staff(req) ? true : { _status: { equals: "published" } });

// Klient widzi tylko swoje konto. W panelu klientów widzi obsługa zamówień.
export const selfOrStaff: Access = ({ req }) => {
  if (hasRole(req, "orders")) return true;
  if (req.user?.collection === "customers") return { id: { equals: req.user.id } };
  return false;
};

// Zamówienia: klient widzi tylko swoje, obsługa zamówień – wszystkie
export const ownOrdersOrStaff: Access = ({ req }) => {
  if (hasRole(req, "orders")) return true;
  if (req.user?.collection === "customers") return { customer: { equals: req.user.id } };
  return false;
};

// Pole tylko dla obsługi zamówień – także przy tworzeniu (rejestracja nie może sama nadać B2B/rabatu)
export const ordersTeamField: FieldAccess = ({ req }) => hasRole(req, "orders");
