export default function Loading() {
  return (
    <div className="mx-auto grid max-w-shop animate-pulse gap-8 px-4 pt-12 lg:grid-cols-2 lg:gap-12">
      <div className="aspect-square rounded-3xl bg-white" />
      <div className="space-y-4">
        <div className="h-4 w-24 rounded bg-brand-100" />
        <div className="h-10 w-3/4 rounded bg-brand-100" />
        <div className="h-20 rounded bg-brand-100" />
        <div className="h-48 rounded-2xl bg-white" />
      </div>
    </div>
  );
}
