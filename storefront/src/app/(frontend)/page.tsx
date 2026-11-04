import type { Metadata } from "next";
import { HomeScreen } from "@/components/home/HomeScreen";
import { JsonLd, websiteLd } from "@/components/JsonLd";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <JsonLd data={websiteLd()} />
      <HomeScreen />
    </>
  );
}
