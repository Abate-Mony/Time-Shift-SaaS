import { StatusBadge } from "@/components/ui"
import customFetch from "@/utils/customFetch"
import type { CreateJobForm } from "@/utils/types"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Skeleton } from "@/components/ui/skeleton"

dayjs.extend(utc)

// job.date comes back from the API as a full ISO datetime string
// ("2026-08-30T00:00:00.000Z"), not a plain YYYY-MM-DD one — every date
// comparison in this screen (grid cells, selected-day filter, upcoming
// grouping) needs a clean string key, and parsing it as local time risks
// shifting the calendar day backward for a negative-UTC-offset browser.
// dayjs.utc(...) reads the date component as the backend actually meant it
// (job.date is always normalised to UTC midnight — see getMyJobs). Same
// fix Calendar.tsx already applies for the manager-side calendar.
function toDateKey(rawDate: string) {
  return dayjs.utc(rawDate).format('YYYY-MM-DD')
}

function normalizeJobDates(jobs: CreateJobForm[]): CreateJobForm[] {
  return jobs.map(j => ({ ...j, date: toDateKey(j.date) }))
}

function ShiftRowSkeleton() {
  return (
    <div className="w-full flex items-center gap-3 bg-card rounded-xl border border-[var(--border)] p-3">
      <div className="flex flex-col items-center justify-center w-12 shrink-0 gap-1">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-2.5 w-8" />
      </div>
      <div className="w-px self-stretch bg-[var(--border)]" />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full shrink-0" />
    </div>
  )
}

export const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Still used by DownloadTimesheet.tsx (biweekly period anchoring) and
// JobScreen.tsx (week-view nav) — this screen itself no longer needs a
// week-start helper now that the calendar is month-based, but those two
// still do.
export function startOfWeek(d: dayjs.Dayjs) {
  const day = d.day() // 0 (Sun) .. 6 (Sat)
  const diffToMonday = day === 0 ? -6 : 1 - day
  return d.add(diffToMonday, 'day').startOf('day')
}

// A day cell's status dots, capped at the 3 statuses this app actually has
// for a worker's own schedule — "confirmed" covers both accepted and
// in-progress (a worker doesn't need the distinction on the calendar face),
// "cancelled" covers both cancelled and declined.
const STATUS_DOT: Record<string, string> = {
  accepted: 'bg-blue-500',
  'in-progress': 'bg-blue-500',
  pending: 'bg-amber-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-rose-400',
  declined: 'bg-rose-400',
}

const DOT_LEGEND: { label: string; color: string }[] = [
  { label: 'Confirmed', color: 'bg-blue-500' },
  { label: 'Pending', color: 'bg-amber-500' },
  { label: 'Completed', color: 'bg-emerald-500' },
  { label: 'Cancelled', color: 'bg-rose-400' },
]

function shiftHours(job: CreateJobForm) {
  if (job.minutes) return job.minutes / 60
  const diff = dayjs(`2000-01-01T${job.endTime}`).diff(dayjs(`2000-01-01T${job.startTime}`), 'minute')
  return Math.max(0, diff) / 60
}

function estimatedPay(job: CreateJobForm): number | null {
  const rate = job.payRate ?? 0
  if (!rate) return null
  return rate * shiftHours(job)
}

function dayHeading(dateStr: string) {
  const d = dayjs(dateStr)
  const today = dayjs()
  if (d.isSame(today, 'day')) return 'Today'
  if (d.isSame(today.add(1, 'day'), 'day')) return 'Tomorrow'
  return d.format('dddd, D MMMM')
}

function dateBadgeLabel(dateStr: string) {
  const d = dayjs(dateStr)
  const today = dayjs()
  if (d.isSame(today, 'day')) return 'Today'
  if (d.isSame(today.add(1, 'day'), 'day')) return 'Tomorrow'
  return d.format('D MMM')
}

function ShiftRow({ job }: { job: CreateJobForm }) {
  const navigate = useNavigate()
  const pay = estimatedPay(job)
  return (
    <button
      type="button"
      onClick={() => navigate(`/worker/jobs/${job._id}`)}
      className="w-full flex items-center gap-3 bg-card rounded-xl border border-[var(--border)] p-3 text-left hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex flex-col items-center justify-center w-12 shrink-0">
        <span className="text-xs font-bold text-foreground">{job.startTime}</span>
        <span className="text-[10px] text-muted-foreground">{job.endTime}</span>
      </div>
      <div className="w-px self-stretch bg-[var(--border)]" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{job.title}</p>
        <p className="text-xs text-muted-foreground truncate">{job.location || job.client?.name}</p>
      </div>
      {pay != null && <span className="text-xs font-bold text-foreground shrink-0">£{pay.toFixed(0)}</span>}
      <StatusBadge status={job.status!} />
    </button>
  )
}

// Upcoming rows "jump to day" — select+scroll the calendar to that date
// instead of navigating straight to the job, so the calendar stays the one
// place a worker picks a day from (see dayPanel below for the actual
// navigate-to-job action, once they're looking at that day's shifts).
function UpcomingRow({ job, onJump }: { job: CreateJobForm; onJump: () => void }) {
  const pay = estimatedPay(job)
  return (
    <button
      type="button"
      onClick={onJump}
      className="w-full flex items-center gap-3 bg-card rounded-xl border border-[var(--border)] p-3 text-left hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="shrink-0 px-2 py-1.5 rounded-lg bg-muted text-center min-w-[56px]">
        <span className="text-[10px] font-bold text-foreground">{dateBadgeLabel(job.date)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{job.title}</p>
        <p className="text-xs text-muted-foreground truncate">{job.startTime}–{job.endTime}{job.location ? ` · ${job.location}` : ''}</p>
      </div>
      {pay != null && <span className="text-xs font-bold text-foreground shrink-0">£{pay.toFixed(0)}</span>}
      <StatusBadge status={job.status!} />
    </button>
  )
}

export default function ScheduleScreen() {
  const [viewedMonth, setViewedMonth] = useState(() => dayjs().startOf('month'))
  const [selectedDate, setSelectedDate] = useState(() => dayjs().format('YYYY-MM-DD'))

  const monthStart = viewedMonth
  const monthEnd = viewedMonth.endOf('month')

  // Scoped exactly to the viewed month — refetches on prev/next nav instead
  // of the old approach (fetch the oldest 200 assignments ever, ascending,
  // unbounded by date). A worker active long enough to have 200+ historical
  // assignments would never reach today's or future shifts that way; the
  // backend already supports start/end bounds (getMyJobs), this just uses them.
  const { data: monthData, isLoading: monthLoading } = useQuery({
    queryKey: ['worker-schedule-month', monthStart.format('YYYY-MM')],
    queryFn: async () => {
      const { data } = await customFetch.get<{ jobs: CreateJobForm[] }>('/workers', {
        params: {
          start: monthStart.format('YYYY-MM-DD'),
          end: monthEnd.format('YYYY-MM-DD'),
          status: 'all',
          limit: 200,
        },
      })
      return data
    },
    placeholderData: keepPreviousData,
  })

  // Anchored to today regardless of which month the calendar is showing —
  // a separate, independently-bounded query rather than widening the month
  // query, so browsing to a distant past/future month doesn't balloon it.
  const { data: upcomingData, isLoading: upcomingLoading } = useQuery({
    queryKey: ['worker-schedule-upcoming'],
    queryFn: async () => {
      const { data } = await customFetch.get<{ jobs: CreateJobForm[] }>('/workers', {
        params: {
          start: dayjs().format('YYYY-MM-DD'),
          status: 'all',
          limit: 50,
        },
      })
      return data
    },
  })

  const monthJobs = useMemo(() => normalizeJobDates(monthData?.jobs ?? []), [monthData])
  const upcomingJobs = useMemo(
    () => normalizeJobDates(upcomingData?.jobs ?? []).filter(j => !['completed', 'cancelled', 'declined'].includes(j.status ?? '')),
    [upcomingData]
  )

  const gridCells = useMemo(() => {
    const leading = (monthStart.day() + 6) % 7 // 0=Mon .. 6=Sun
    const daysInMonth = monthEnd.date()
    const cells: ({ date: dayjs.Dayjs; dateStr: string; jobs: CreateJobForm[] } | null)[] = []
    for (let i = 0; i < leading; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const date = monthStart.date(d)
      const dateStr = date.format('YYYY-MM-DD')
      cells.push({ date, dateStr, jobs: monthJobs.filter(j => j.date === dateStr) })
    }
    return cells
  }, [monthStart, monthEnd, monthJobs])

  const selectedDayJobs = useMemo(
    () => monthJobs.filter(j => j.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [monthJobs, selectedDate]
  )

  function jumpToDate(dateStr: string) {
    setSelectedDate(dateStr)
    setViewedMonth(dayjs(dateStr).startOf('month'))
  }

  const todayStr = dayjs().format('YYYY-MM-DD')

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Schedule</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Your upcoming assignments</p>
      </div>

      {/* Month calendar */}
      <div className="bg-card rounded-2xl border border-[var(--border)] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setViewedMonth(m => m.subtract(1, 'month'))}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <p className="text-sm font-bold text-foreground">{monthStart.format('MMMM YYYY')}</p>
          <button
            type="button"
            onClick={() => setViewedMonth(m => m.add(1, 'month'))}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {DAY_LABELS.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1.5">
          {gridCells.map((cell, i) => {
            if (!cell) return <div key={i} />
            const isToday = cell.dateStr === todayStr
            const isSelected = cell.dateStr === selectedDate
            const hasJobs = cell.jobs.length > 0
            const statuses = [...new Set(cell.jobs.map(j => j.status ?? ''))].slice(0, 3)
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedDate(cell.dateStr)}
                className="flex flex-col items-center gap-1 py-0.5"
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                  ${isToday ? 'bg-[var(--primary)] text-white' : isSelected ? 'bg-muted text-foreground' : hasJobs ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                  {cell.date.date()}
                </span>
                <div className="flex items-center gap-0.5 h-1.5">
                  {statuses.map(s => (
                    <span key={s} className={`w-1 h-1 rounded-full ${STATUS_DOT[s] ?? 'bg-slate-300'}`} />
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 mt-4 pt-3 border-t border-[var(--border)]">
          {DOT_LEGEND.map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${l.color}`} />
              <span className="text-[10px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected day panel */}
      <div className="bg-card rounded-2xl border border-[var(--border)] p-4 shadow-sm">
        <p className="text-sm font-bold text-foreground mb-3">{dayHeading(selectedDate)}</p>
        {monthLoading && !monthData ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }).map((_, i) => <ShiftRowSkeleton key={i} />)}
          </div>
        ) : selectedDayJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Calendar size={18} className="text-muted-foreground" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">No shifts on this day</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedDayJobs.map(job => <ShiftRow key={job._id} job={job} />)}
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-foreground">Upcoming</h3>
        {upcomingLoading ? (
          Array.from({ length: 3 }).map((_, i) => <ShiftRowSkeleton key={i} />)
        ) : upcomingJobs.length === 0 ? (
          <div className="bg-card rounded-2xl border border-[var(--border)] p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-muted-foreground">No upcoming shifts scheduled</p>
          </div>
        ) : (
          upcomingJobs.map(job => (
            <UpcomingRow key={job._id} job={job} onJump={() => jumpToDate(job.date)} />
          ))
        )}
      </div>
    </div>
  )
}
