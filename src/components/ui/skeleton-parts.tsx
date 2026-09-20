import { Card } from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'

// Small, composable pieces every page-loading skeleton in this app is
// built from — kept here so ~20 different pages don't each reinvent a
// "stat card" or "table row" shape slightly differently.

export function StatCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="w-9 h-9 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-16 mb-2" />
      <Skeleton className="h-3 w-28" />
    </Card>
  )
}

export function StatCardRowSkeleton({ count = 4, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

// A row of bars with varied, deterministic heights — reads as "a chart is
// coming" without pretending to preview real values.
export function BarsSkeleton({ count, className = '' }: { count: number; className?: string }) {
  const heights = Array.from({ length: count }, (_, i) => 35 + ((i * 37) % 60))
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      {heights.map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-t-md rounded-b-none" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

// Horizontal bars, one per "row" — e.g. hours-per-worker charts where each
// category gets its own labeled bar rather than sitting on a shared axis.
export function HorizontalBarsSkeleton({ rows = 5 }: { rows?: number }) {
  const widths = [85, 60, 72, 45, 90, 55, 68]
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3 w-14 shrink-0" />
          <Skeleton className="h-5 rounded-md" style={{ width: `${widths[i % widths.length]}%` }} />
        </div>
      ))}
    </div>
  )
}

// A round donut-ish silhouette for pie/donut charts — a ring rather than a
// filled circle so it doesn't read as a solid loading blob.
export function DonutSkeleton({ size = 160 }: { size?: number }) {
  return (
    <div
      className="rounded-full animate-pulse bg-transparent"
      style={{
        width: size,
        height: size,
        border: `${Math.round(size * 0.18)}px solid var(--muted)`,
      }}
    />
  )
}

export function ListRowSkeleton({ avatar = true }: { avatar?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      {avatar && <Skeleton className="w-8 h-8 rounded-full shrink-0" />}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 4, avatar = true, className = '' }: { rows?: number; avatar?: boolean; className?: string }) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <ListRowSkeleton key={i} avatar={avatar} />
      ))}
    </div>
  )
}

// Divided rows inside a Card — the "today's jobs" / "recent invoices"
// list-in-a-card shape used across several pages.
export function DividedRowsSkeleton({ rows = 4, trailing = true }: { rows?: number; trailing?: boolean }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          {trailing && <Skeleton className="h-5 w-16 rounded-full shrink-0" />}
        </div>
      ))}
    </div>
  )
}

// A generic data table: header row + N body rows of M columns, column
// widths staggered so it doesn't look like one repeated block.
export function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  const widths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-1/3', 'w-1/2', 'w-2/5']
  return (
    <div className="w-full">
      <div className="flex items-center gap-4 px-5 py-3 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className={`h-3 flex-1 ${i === 0 ? 'max-w-[40%]' : 'max-w-[20%]'}`} />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-5 py-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className={`h-3.5 flex-1 ${widths[(r + c) % widths.length]}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardHeaderSkeleton({ titleWidth = 'w-32', subWidth = 'w-44' }: { titleWidth?: string; subWidth?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className={`h-4 ${titleWidth}`} />
      <Skeleton className={`h-3 ${subWidth}`} />
    </div>
  )
}

// Full-bleed page-header skeleton (title + subtitle, optional right-side
// action) — the shape nearly every list/settings page starts with.
export function PageHeaderSkeleton({ withAction = false }: { withAction?: boolean }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-3">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {withAction && <Skeleton className="h-9 w-32 rounded-lg" />}
    </div>
  )
}

// A grid of small thumbnail-style cards — invoice templates, plan cards,
// document tiles.
export function ThumbnailGridSkeleton({ count = 6, aspect = 'aspect-[3/4]', columns = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' }: { count?: number; aspect?: string; columns?: string }) {
  return (
    <div className={`grid ${columns} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`w-full ${aspect} rounded-xl`} />
      ))}
    </div>
  )
}
