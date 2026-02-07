'use client'

/**
 * Animated skeleton loader in the industrial theme.
 */
export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-[var(--bg-raised)] via-[var(--border-dim)] to-[var(--bg-raised)] bg-[length:200%_100%] rounded-sm ${className}`}
      style={{ animationDuration: '1.5s' }}
      {...props}
    />
  )
}

/** Card-shaped skeleton for grid layouts */
export function SkeletonCard() {
  return (
    <div className="panel p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  )
}

/** Stats row skeleton */
export function SkeletonStats() {
  return (
    <div className="flex gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-1 panel p-3 space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

/** Single line skeleton */
export function SkeletonLine({ width = 'w-full' }: { width?: string }) {
  return <Skeleton className={`h-4 ${width}`} />
}
