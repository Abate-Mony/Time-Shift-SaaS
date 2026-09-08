import { useState } from 'react'
import { Outlet, useOutletContext } from 'react-router'
import dayjs from 'dayjs'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CustomNavLink from '@/components/ui/link'

export interface DateRange {
  start: string
  end: string
}

// Placeholder until a real "reports summary" endpoint exists — shape is a
// guess at what several report pages might all want (e.g. total hours,
// jobs completed), not a contract anything currently relies on. Each report
// page already fetches its own real data from /reports/* individually
// (see utils/reports.ts); this would only matter if a shared summary ever
// got pulled up into this layout instead.
export interface ReportsSummary {
  totalHours?: number
  jobsCompleted?: number
  activeWorkers?: number
}

export interface ReportsOutletContext {
  dateRange: DateRange
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>
  // Intentionally always undefined/false for now — there's no shared
  // summary endpoint yet. Wiring one in later only means filling these in
  // here; child pages that already destructure them need no changes.
  sharedSummary?: ReportsSummary
  isSummaryLoading: boolean
}

// Last 6 months, current month first — was a hardcoded July/June/May 2025
// list left over from when this page read from mockData, so it silently
// pointed at an empty window (and every stat showed 0) the moment "now"
// moved past July 2025.
const MONTH_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const m = dayjs().subtract(i, 'month')
  return { label: m.format('MMMM YYYY'), month: m.format('YYYY-MM') }
})

const monthToRange = (month: string): DateRange => ({
  start: dayjs(month, 'YYYY-MM').startOf('month').format('YYYY-MM-DD'),
  end: dayjs(month, 'YYYY-MM').endOf('month').format('YYYY-MM-DD'),
})

const NAV_LINKS = [
  { to: '/reports', label: 'Overview', end: true },
  { to: '/reports/payroll', label: 'Payroll' },
  { to: '/reports/timesheets', label: 'Timesheets' },
  { to: '/reports/performance', label: 'Performance' },
  { to: '/reports/profitability', label: 'Profitability' },
]

export default function ReportLayout() {
  const [dateRange, setDateRange] = useState<DateRange>(() => monthToRange(MONTH_OPTIONS[0].month))

  const selectedMonth =
    MONTH_OPTIONS.find(m => monthToRange(m.month).start === dateRange.start)?.month
    ?? MONTH_OPTIONS[0].month

  const context: ReportsOutletContext = {
    dateRange,
    setDateRange,
    sharedSummary: undefined,
    isSummaryLoading: false,
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Workforce analytics and payroll data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download size={13} /> Export CSV
          </Button>
          <Button variant="outline" size="sm">
            <FileText size={13} /> Export PDF
          </Button>
          <select
            value={selectedMonth}
            onChange={e => setDateRange(monthToRange(e.target.value))}
            className="h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-600 bg-white focus:outline-none appearance-none cursor-pointer"
          >
            {MONTH_OPTIONS.map(m => (
              <option key={m.month} value={m.month}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-b border-[#E2E8F0]">
        {NAV_LINKS.map(link => (
          <CustomNavLink
            key={link.to}
            to={link.to}
            end={link.end}
            layoutId="report-layout-tabs"
            animateClassName="inset-x-0 bottom-0 h-0.5 bg-[#1E3A5F]"
            show
            className="w-fit! px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            selectedClassName="text-[#1E3A5F]! font-semibold"
          >
            {link.label}
          </CustomNavLink>
        ))}
      </div>

      <div className="mt-6">
        <Outlet context={context} />
      </div>
    </div>
  )
}

export function useReportsContext() {
  return useOutletContext<ReportsOutletContext>()
}
