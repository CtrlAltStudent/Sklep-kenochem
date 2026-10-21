export default function Loading() {
  return (
    <div className="mx-auto max-w-shop animate-pulse px-4 pt-12">
      <div className="h-28 rounded-3xl bg-brand-100" />
      <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-white" />)}
      </div>
    </div>
  );
}
