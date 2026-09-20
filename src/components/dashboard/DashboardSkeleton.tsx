import { Card } from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { BarsSkeleton, ListRowSkeleton, StatCardSkeleton } from '@/components/ui/skeleton-parts'

// Mirrors Dashboard.tsx's real grid 1:1 (same wrapper classes, same Card
// component, same column spans) so nothing shifts when the real data pops
// in — this replaces the render, it doesn't wrap it. Alert banners and the
// AI insights card are left out on purpose: they're conditional even once
// data has loaded, so skeleton-ing them would promise content that might
// not actually show up.

export function DashboardSkeleton() {
  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly hours chart */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <BarsSkeleton count={7} className="h-[180px]" />
          </Card>
        </div>

        {/* Working now */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ListRowSkeleton key={i} />
            ))}
          </div>
        </Card>

        {/* Today's jobs */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-14" />
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-2/5" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent activity */}
        <Card className="p-5">
          <Skeleton className="h-4 w-28 mb-4" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ListRowSkeleton key={i} avatar={false} />
            ))}
          </div>
        </Card>

        {/* Monthly overview */}
        <div className="lg:col-span-3">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-52" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
            <BarsSkeleton count={12} className="h-[140px]" />
          </Card>
        </div>
      </div>
    </div>
  )
}
