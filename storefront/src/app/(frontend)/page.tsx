import type { Metadata } from "next";
import { HomeScreen } from "@/components/home/HomeScreen";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return <HomeScreen />;
}
