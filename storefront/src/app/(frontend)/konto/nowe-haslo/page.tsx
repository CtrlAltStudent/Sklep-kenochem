import type { Metadata } from "next";
import { ResetPassword } from "@/components/account/Account";

export const metadata: Metadata = { title: "Nowe hasło", robots: { index: false } };

// Link z maila „Ustaw nowe hasło” (token ważny godzinę)
export default async function NewPasswordPage({ searchParams }: PageProps<"/konto/nowe-haslo">) {
  const { token } = await searchParams;
  return <ResetPassword token={typeof token === "string" ? token : ""} />;
}
