import Image from "next/image";

// Zdjęcie produktu (optymalizowane przez next/image) albo zastępczy znak marki.
export function ProductImage({
  src,
  alt,
  className = "",
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority,
}: {
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain p-[6%] transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-brand-50">
          <Image src="/sonax/icon-512.png" alt="" width={42} height={42} className="opacity-25" />
        </div>
      )}
    </div>
  );
}
