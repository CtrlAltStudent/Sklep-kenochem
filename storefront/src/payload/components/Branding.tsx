import Image from "next/image";
import Link from "next/link";

// Logo Kenochem w panelu: duże na ekranie logowania, ikona w nawigacji.
export function Logo() {
  return (
    <div style={{ textAlign: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-e1772107192548.webp" alt="Kenochem" style={{ width: 260, height: "auto" }} />
      <div style={{ marginTop: 8, fontSize: 13, letterSpacing: "0.2em", color: "var(--theme-elevation-500)" }}>PANEL SKLEPU</div>
    </div>
  );
}

export function Icon() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/favicon.png" alt="Kenochem" style={{ height: 26, width: "auto" }} />;
}

// Logo na górze menu bocznego
export function NavBrand() {
  return (
    <Link href="/admin" className="kc-navbrand">
      <Image src="/brand/logo-e1772107192548.webp" alt="Kenochem" width={420} height={139} />
      <span>Panel sklepu</span>
    </Link>
  );
}
