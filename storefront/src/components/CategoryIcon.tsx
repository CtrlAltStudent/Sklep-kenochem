import Image from "next/image";

// Ikona kategorii – z pola Lucide w drzewie (lib/data.ts).
export function CategoryIcon({ name, size = 28, className = "" }: { name: string; size?: number; className?: string }) {
  return <Image src={name} alt="" width={size} height={size} className={className} />;
}
