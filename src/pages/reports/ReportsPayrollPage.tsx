import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { Card, Avatar } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeleton } from '@/components/ui/skeleton-parts'
import { useReportsContext } from '@/layouts/ReportLayout'
import { reportsPayrollQuery } from '@/utils/reports'

function ReportsPayrollSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-muted/60 border border-border rounded-xl px-4 py-3 flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-36 rounded-lg ml-auto" />
      </div>
      <Card>
        <TableSkeleton rows={6} columns={5} />
      </Card>
    </div>
  )
}

export function ReportsPayrollPage() {
  const { dateRange } = useReportsContext()
  const monthLabel = dayjs(dateRange.start).format('MMMM YYYY')
  const { data, isPending, isError } = useQuery(reportsPayrollQuery(dateRange))

  if (isPending) return <ReportsPayrollSkeleton />
  if (isError) return <p className="text-sm text-red-500">Failed to load the payroll report.</p>

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Download size={14} className="text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900">Payroll ready for {monthLabel}</p>
          <p className="text-xs text-blue-700">{data.workers.length} workers · Total payout: £{data.totalPayout.toLocaleString()}</p>
        </div>
        <Button size="sm" className="ml-auto">Download Payroll</Button>
      </div>

      <Card>
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-[var(--border)] bg-muted/60">
          {['Worker', 'Hours', 'Rate /hr', 'Overtime', 'Total Pay'].map((h, i) => (
            <p key={i} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
          ))}
        </div>
        {data.workers.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">No completed, paid shifts in {monthLabel}.</p>
        ) : (
          data.workers.map((w, i) => (
            <div key={w.workerId} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 border-b border-[var(--border)] items-center hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar initials={w.fullname.split(' ').map(n => n[0]).slice(0, 2).join('')} size="sm" index={i} src={w.profilePhoto?.url} />
                <div>
                  <p className="text-sm font-medium text-foreground">{w.fullname}</p>
                  <p className="text-xs text-muted-foreground">{w.email}</p>
                </div>
              </div>
              <p className="text-sm text-foreground font-mono">{w.hours}h</p>
              <p className="text-sm text-foreground font-mono">£{w.rate.toFixed(2)}/hr</p>
              <p className="text-sm text-foreground font-mono">{w.overtimeHours}h</p>
              <p className="text-sm font-semibold text-foreground">£{w.totalPay.toLocaleString()}</p>
            </div>
          ))
        )}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-4 bg-muted/60">
          <p className="text-sm font-semibold text-foreground col-span-4">Total Payroll</p>
          <p className="text-base font-bold text-foreground">£{data.totalPayout.toLocaleString()}</p>
        </div>
      </Card>
    </div>
  )
}
