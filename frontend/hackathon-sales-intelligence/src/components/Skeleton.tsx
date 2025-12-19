interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
    />
  );
}

export function DealCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function DealListSkeleton() {
  return (
    <div className="px-4 py-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <DealCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="px-4 py-4">
      {/* At Risk Section */}
      <div className="p-4 rounded-r-lg mb-6 border-l-4 bg-gray-100 border-gray-300">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>

      {/* Stats Grid */}
      <div className="mb-6">
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <Skeleton className="h-3 w-16 mb-2 mx-auto" />
            <Skeleton className="h-8 w-12 mx-auto" />
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <Skeleton className="h-3 w-16 mb-2 mx-auto" />
            <Skeleton className="h-8 w-20 mx-auto" />
          </div>
        </div>
      </div>

      {/* Another Stats Grid */}
      <div className="mb-6">
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <Skeleton className="h-3 w-16 mb-2 mx-auto" />
            <Skeleton className="h-8 w-12 mx-auto" />
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <Skeleton className="h-3 w-16 mb-2 mx-auto" />
            <Skeleton className="h-8 w-20 mx-auto" />
          </div>
        </div>
      </div>

      {/* Loss Reasons */}
      <div className="mb-6">
        <Skeleton className="h-5 w-28 mb-3" />
        <div className="bg-white p-4 rounded-lg shadow-sm">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="flex-1 h-6 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
