import { getCms } from "@/lib/cms";
import { currentCustomer, customerCookie, publicCustomer } from "@/integrations/account";
import { deleteCustomer, exportCustomerData, ordersCsv } from "@/integrations/privacy";

export const dynamic = "force-dynamic";

// Konto klienta sklepu: /api/account/me | login | register | logout | profile | password | forgot | reset
// RODO: GET /api/account/export (JSON, ?format=csv – zamówienia), POST /api/account/delete { password }
// Sesja w ciasteczku „sonax-klient” – osobno od logowania do panelu admina.

type Body = Record<string, unknown>;
const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
const json = (data: unknown, status = 200, cookie?: string) =>
  Response.json(data, { status, headers: cookie ? { "Set-Cookie": cookie } : undefined });

// Błędy Payload (po polsku lub angielsku, zależnie od języka) → krótkie komunikaty dla klienta
function polish(e: unknown, fallback: string) {
  const m = (e as Error)?.message?.toLowerCase() ?? "";
  if (/locked|zablokow/.test(m)) return "Konto zablokowane na 10 minut po zbyt wielu próbach. Spróbuj później albo ustaw nowe hasło.";
  if (/token/.test(m)) return "Link wygasł albo był już użyty. Poproś o nowy.";
  if (/email or password|incorrect|hasło jest nieprawidłowe/.test(m)) return "Nieprawidłowy e-mail lub hasło.";
  if (/unique|unikal|already|zarejestrowany/.test(m)) return "Konto z tym adresem już istnieje – zaloguj się albo ustaw nowe hasło.";
  return fallback;
}

// Adresy z formularza – tylko znane pola
const addresses = (v: unknown) =>
  (Array.isArray(v) ? v : []).slice(0, 20).map((a: Body) => ({
    label: str(a.label, 60), fullName: str(a.fullName, 120), company: str(a.company, 120), street: str(a.street, 120),
    postcode: str(a.postcode, 12), city: str(a.city, 80), country: str(a.country, 2) || "PL",
  })).filter((a) => a.street || a.city);

async function login(email: string, password: string) {
  const payload = await getCms();
  const r = await payload.login({ collection: "customers", data: { email, password } });
  return json({ ok: true, user: publicCustomer(r.user as never) }, 200, customerCookie(r.token ?? null));
}

export async function GET(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const payload = await getCms();
  const c = await currentCustomer(payload, request.headers);
  if (action === "export") {
    if (!c) return json({ ok: false, message: "Zaloguj się ponownie." }, 401);
    const data = await exportCustomerData(payload, c);
    const day = new Date().toISOString().slice(0, 10);
    const csv = new URL(request.url).searchParams.get("format") === "csv";
    return new Response(csv ? ordersCsv(data) : JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": csv ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="sonax-${csv ? "zamowienia" : "moje-dane"}-${day}.${csv ? "csv" : "json"}"`,
        "Cache-Control": "no-store",
      },
    });
  }
  if (action !== "me") return json({ ok: false }, 404);
  return json({ ok: true, user: c ? publicCustomer(c) : null });
}

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const b = ((await request.json().catch(() => ({}))) ?? {}) as Body;
  const payload = await getCms();
  const email = str(b.email, 150).toLowerCase();
  const password = String(b.password ?? "");

  try {
    switch (action) {
      case "login":
        if (!email || !password) return json({ ok: false, message: "Podaj e-mail i hasło." }, 400);
        return await login(email, password);

      case "register": {
        if (!/^\S+@\S+\.\S+$/.test(email)) return json({ ok: false, message: "Podaj prawidłowy e-mail." }, 400);
        if (password.length < 8) return json({ ok: false, message: "Hasło musi mieć co najmniej 8 znaków." }, 400);
        if (b.terms !== true) return json({ ok: false, message: "Zaakceptuj regulamin." }, 400);
        const now = new Date().toISOString();
        const newsletter = b.newsletter === true;
        await payload.create({
          collection: "customers",
          // overrideAccess: false – działa ochrona pól (np. klient sam nie nada sobie B2B ani rabatu)
          overrideAccess: false,
          data: {
            email, password, firstName: str(b.firstName, 60), lastName: str(b.lastName, 80), phone: str(b.phone, 20) || undefined,
            consents: { termsAcceptedAt: now, newsletter, newsletterAt: newsletter ? now : undefined },
          } as never,
        });
        return await login(email, password);
      }

      case "logout":
        return json({ ok: true }, 200, customerCookie(null));

      case "forgot":
        if (email) await payload.forgotPassword({ collection: "customers", data: { email } }).catch(() => null);
        // Zawsze ta sama odpowiedź – nie zdradzamy, czy konto istnieje
        return json({ ok: true, message: "Jeśli konto z tym adresem istnieje, wysłaliśmy link do ustawienia nowego hasła. Sprawdź skrzynkę (także SPAM)." });

      case "reset": {
        if (password.length < 8) return json({ ok: false, message: "Hasło musi mieć co najmniej 8 znaków." }, 400);
        const r = await payload.resetPassword({ collection: "customers", data: { token: str(b.token, 200), password }, overrideAccess: true });
        return json({ ok: true }, 200, customerCookie(r.token ?? null));
      }

      case "profile":
      case "password": {
        const c = await currentCustomer(payload, request.headers);
        if (!c) return json({ ok: false, message: "Zaloguj się ponownie." }, 401);
        if (action === "password" && password.length < 8) return json({ ok: false, message: "Hasło musi mieć co najmniej 8 znaków." }, 400);
        const data = action === "password"
          ? { password }
          : { firstName: str(b.firstName, 60), lastName: str(b.lastName, 80), phone: str(b.phone, 20), addresses: addresses(b.addresses) };
        const doc = await payload.update({ collection: "customers", id: c.id, overrideAccess: true, data: data as never });
        return json({ ok: true, user: publicCustomer(doc) });
      }

      case "delete": {
        const c = await currentCustomer(payload, request.headers);
        if (!c) return json({ ok: false, message: "Zaloguj się ponownie." }, 401);
        if (b.confirm !== true) return json({ ok: false, message: "Zaznacz, że rozumiesz skutki usunięcia konta." }, 400);
        // Hasło jeszcze raz – nikt przy cudzym, otwartym komputerze nie usunie konta jednym kliknięciem
        try {
          await payload.login({ collection: "customers", data: { email: c.email, password } });
        } catch {
          return json({ ok: false, message: "Nieprawidłowe hasło." }, 400);
        }
        await deleteCustomer(payload, c);
        return json({ ok: true }, 200, customerCookie(null));
      }

      default:
        return json({ ok: false }, 404);
    }
  } catch (e) {
    const fallback = action === "register" ? "Nie udało się założyć konta. Sprawdź dane." : action === "reset" ? "Nie udało się ustawić hasła. Link mógł wygasnąć – poproś o nowy." : "Nie udało się. Spróbuj ponownie.";
    return json({ ok: false, message: polish(e, fallback) }, 400);
  }
}
