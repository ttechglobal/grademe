import { cn } from '@/lib/utils'

export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-border rounded-xl',
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3 shadow-card">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center justify-between mt-2">
        <Skeleton className="h-2 flex-1 mr-4" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-none">
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Hero */}
      <Skeleton className="h-40 w-full rounded-3xl" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Assessment cards */}
      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>

      {/* Table */}
      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    </div>
  )
}