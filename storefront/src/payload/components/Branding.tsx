import Image from "next/image";
import Link from "next/link";

// Logo Sonax w panelu: duże na ekranie logowania, ikona w nawigacji.
export function Logo() {
  return (
    <div style={{ textAlign: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sonax/logo.png" alt="Sonax" style={{ width: 240, height: "auto" }} />
      <div style={{ marginTop: 8, fontSize: 13, letterSpacing: "0.2em", color: "var(--theme-elevation-500)" }}>PANEL SKLEPU</div>
    </div>
  );
}

export function Icon() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/sonax/icon-512.png" alt="Sonax" style={{ height: 26, width: "auto" }} />;
}

export function NavBrand() {
  return (
    <Link href="/admin" className="kc-navbrand">
      <Image src="/sonax/logo.png" alt="Sonax" width={300} height={91} />
      <span>Panel sklepu</span>
    </Link>
  );
}
