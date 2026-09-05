import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { Card, Avatar } from '@/components/ui'
import { useReportsContext } from '@/layouts/ReportLayout'
import { reportsTimesheetsQuery } from '@/utils/reports'

export function ReportsTimesheetsPage() {
  const { dateRange } = useReportsContext()
  const { data, isPending, isError } = useQuery(reportsTimesheetsQuery(dateRange))

  if (isPending) return <p className="text-sm text-slate-400">Loading timesheets…</p>
  if (isError) return <p className="text-sm text-red-500">Failed to load the timesheets report.</p>

  return (
    <div>
      <Card>
        <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-[#E2E8F0] bg-slate-50/60">
          {['Worker', 'Job', 'Date', 'Start', 'Finish', 'Hours'].map((h, i) => (
            <p key={i} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</p>
          ))}
        </div>
        {data.rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-400 text-center">No completed shifts in this period.</p>
        ) : (
          data.rows.map((row, i) => (
            <div key={row.assignmentId} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 border-b border-[#F1F5F9] items-center hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <Avatar initials={row.worker.split(' ').map(n => n[0]).slice(0, 2).join('')} size="sm" index={i} />
                <p className="text-sm font-medium text-slate-800">{row.worker}</p>
              </div>
              <p className="text-xs text-slate-600 truncate">{row.job}</p>
              <p className="text-xs text-slate-600">{row.date ? dayjs(row.date).format('D MMM') : '—'}</p>
              <p className="text-xs text-slate-600 font-mono">{row.start}</p>
              <p className="text-xs text-slate-600 font-mono">{row.finish}</p>
              <p className="text-xs font-semibold text-slate-900 font-mono">{row.hours}h</p>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
