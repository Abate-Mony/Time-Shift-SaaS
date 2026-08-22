import { StatusBadge } from "@/components/ui"
import customFetch from "@/utils/customFetch"
import type { CreateJobForm } from "@/utils/types"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router"

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function startOfWeek(d: dayjs.Dayjs) {
  const day = d.day() // 0 (Sun) .. 6 (Sat)
  const diffToMonday = day === 0 ? -6 : 1 - day
  return d.add(diffToMonday, 'day').startOf('day')
}

function shiftHours(job: CreateJobForm) {
  if (job.minutes) return job.minutes / 60
  const diff = dayjs(`2000-01-01T${job.endTime}`).diff(dayjs(`2000-01-01T${job.startTime}`), 'minute')
  return Math.max(0, diff) / 60
}

function dayHeading(dateStr: string) {
  const d = dayjs(dateStr)
  const today = dayjs()
  if (d.isSame(today, 'day')) return 'Today'
  if (d.isSame(today.add(1, 'day'), 'day')) return 'Tomorrow'
  return d.format('dddd, D MMMM')
}

function ShiftRow({ job }: { job: CreateJobForm }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(`/worker/job/${job._id}`)}
      className="w-full flex items-center gap-3 bg-white rounded-xl border border-[#E2E8F0] p-3 text-left hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex flex-col items-center justify-center w-12 shrink-0">
        <span className="text-xs font-bold text-slate-700">{job.startTime}</span>
        <span className="text-[10px] text-slate-400">{job.endTime}</span>
      </div>
      <div className="w-px self-stretch bg-[#F1F5F9]" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{job.title}</p>
        <p className="text-xs text-slate-400 truncate">{job.location || job.client}</p>
      </div>
      <StatusBadge status={job.status!} />
    </button>
  )
}

export default function ScheduleScreen() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(dayjs()))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['worker-schedule'],
    queryFn: async () => {
      const { data } = await customFetch.get<{ jobs: CreateJobForm[] }>('/workers', {
        params: { limit: 200, sort: 'asc', status: 'all' },
      })
      return data
    },
  })

  const jobs = data?.jobs ?? []

  const weekDays = useMemo(() => (
    Array.from({ length: 7 }, (_, i) => {
      const date = weekStart.add(i, 'day')
      const dateStr = date.format('YYYY-MM-DD')
      const dayJobs = jobs.filter(j => j.date === dateStr)
      return {
        day: DAY_LABELS[i],
        date,
        dateStr,
        isToday: date.isSame(dayjs(), 'day'),
        jobs: dayJobs,
        hours: dayJobs.reduce((sum, j) => sum + shiftHours(j), 0),
      }
    })
  ), [weekStart, jobs])

  // Grouped agenda: upcoming, non-cancelled jobs bucketed by date, earliest first
  const groupedUpcoming = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD')
    const upcoming = jobs
      .filter(j => !['completed', 'cancelled', 'declined'].includes(j.status ?? '') && j.date >= today)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))

    const groups = new Map<string, CreateJobForm[]>()
    for (const job of upcoming) {
      if (!groups.has(job.date)) groups.set(job.date, [])
      groups.get(job.date)!.push(job)
    }
    return [...groups.entries()]
  }, [jobs])

  const visibleGroups = selectedDate
    ? groupedUpcoming.filter(([date]) => date === selectedDate)
    : groupedUpcoming

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Schedule</h2>
        <p className="text-xs text-slate-400 mt-0.5">Your upcoming assignments</p>
      </div>

      {/* Week strip */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-700">Week of {weekStart.format('D MMMM')}</p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setWeekStart(w => w.subtract(7, 'day'))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(w => w.add(7, 'day'))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d, i) => {
            const isSelected = d.dateStr === selectedDate
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedDate(sel => sel === d.dateStr ? null : d.dateStr)}
                className="flex flex-col items-center gap-1.5"
              >
                <span className="text-[10px] font-semibold text-slate-400">{d.day}</span>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold relative transition-colors
                  ${isSelected ? 'bg-[#1E3A5F] text-white shadow-sm' : d.isToday ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' : d.jobs.length ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-300 border border-slate-100'}`}>
                  {d.date.date()}
                </div>
                {d.jobs.length > 0 && (
                  <div className="flex flex-col gap-0.5 w-full">
                    {Array.from({ length: Math.max(1, Math.ceil(d.hours / 8)) }).map((_, j) => (
                      <div key={j} className={`h-1 rounded-full ${isSelected ? 'bg-[#1E3A5F]' : 'bg-blue-300'}`} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Agenda */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">
          {selectedDate ? dayHeading(selectedDate) : 'Upcoming Shifts'}
        </h3>
        {selectedDate && (
          <button
            type="button"
            onClick={() => setSelectedDate(null)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-sm">
            <p className="text-sm text-slate-400">Loading…</p>
          </div>
        ) : visibleGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-600">
              {selectedDate ? 'No shifts on this day' : 'No upcoming shifts scheduled'}
            </p>
          </div>
        ) : (
          visibleGroups.map(([date, dayJobs]) => (
            <div key={date} className="flex flex-col gap-2">
              {!selectedDate && (
                <p className="text-xs font-semibold text-slate-400">{dayHeading(date)}</p>
              )}
              <div className="flex flex-col gap-2">
                {dayJobs.map(job => <ShiftRow key={job._id} job={job} />)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
