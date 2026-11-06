// Konto do przelewu tradycyjnego. Ten sam numer jest na stronie Kontakt — klient ma go zobaczyć też po zamówieniu i w mailu.
export const BANK = {
  recipient: "KENOCHEM Kuczyński Sp. J.",
  bank: "mBank",
  account: "36 1140 2004 0000 3602 8638 0572",
  swift: "BREXPLPWMBK",
};

export function bankDetails(custom?: string | null) {
  const extra = custom?.trim() ?? "";
  const digits = extra.replace(/\D/g, "");
  const own = digits.length >= 20;
  return {
    recipient: BANK.recipient,
    bank: BANK.bank,
    account: own ? extra : BANK.account,
    accountCopy: own ? digits : BANK.account.replace(/\s/g, ""),
    swift: BANK.swift,
  };
}
