export function ProductCardSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="skeleton aspect-square w-full" />
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-4 w-3/5 rounded" />
        <div className="skeleton h-5 w-1/3 rounded mt-3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
