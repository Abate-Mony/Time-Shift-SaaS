import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { Card, Avatar } from '@/components/ui'
import { useReportsContext } from '@/layouts/ReportLayout'
import { reportsTimesheetsQuery } from '@/utils/reports'

export function ReportsTimesheetsPage() {
  const { dateRange } = useReportsContext()
  const { data, isPending, isError } = useQuery(reportsTimesheetsQuery(dateRange))

  if (isPending) return <p className="text-sm text-muted-foreground">Loading timesheets…</p>
  if (isError) return <p className="text-sm text-red-500">Failed to load the timesheets report.</p>

  return (
    <div>
      <Card>
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-[var(--border)] bg-muted/60">
          {['Worker', 'Job', 'Date', 'Start', 'Finish', 'Hours'].map((h, i) => (
            <p key={i} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
          ))}
        </div>
        {data.rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">No completed shifts in this period.</p>
        ) : (
          data.rows.map((row, i) => (
            <div key={row.assignmentId} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 border-b border-[var(--border)] items-center hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <Avatar initials={row.worker.split(' ').map(n => n[0]).slice(0, 2).join('')} size="sm" index={i} src={row.profilePhoto?.url} />
                <p className="text-sm font-medium text-foreground">{row.worker}</p>
              </div>
              <p className="text-xs text-muted-foreground truncate">{row.job}</p>
              <p className="text-xs text-muted-foreground">{row.date ? dayjs(row.date).format('D MMM') : '—'}</p>
              <p className="text-xs text-muted-foreground font-mono">{row.start}</p>
              <p className="text-xs text-muted-foreground font-mono">{row.finish}</p>
              <p className="text-xs font-semibold text-foreground font-mono">{row.hours}h</p>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
