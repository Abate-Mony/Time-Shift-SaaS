import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Repeat2, ChevronRight, Plus, Search, Calendar, MapPin } from 'lucide-react'
import { describeRecurrence, fmtDate, fmtDateLong, type RecurringSchedule } from '@/utils/recurring'
import { useNavigate } from 'react-router'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import customFetch from '@/utils/customFetch'

// ─── Data ─────────────────────────────────────────────────────────────────────

const recurringJobsQuery = () => ({
  queryKey: ['recurring-jobs'],
  queryFn: async () => {
    // Recurring schedules are a small, manageable set per company (unlike
    // jobs or invitations) — fetch a generous page once and filter/search
    // client-side rather than round-tripping per tab switch or keystroke.
    const { data } = await customFetch.get<{ schedules: RecurringSchedule[]; total: number }>(
      '/recurring-jobs',
      { params: { limit: 100 } }
    )
    return data
  },
})

export const loader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData(recurringJobsQuery())
  return null
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function RecurringStatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
      active ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'
    }`}>
      {active ? 'Active' : 'Stopped'}
    </span>
  )
}

// ─── Recurrence summary ───────────────────────────────────────────────────────

function RecurrenceSummary({ schedule }: { schedule: RecurringSchedule }) {
  const rule = describeRecurrence(schedule)
  const time = `${schedule.templateJob.startTime}–${schedule.templateJob.endTime}`
  const end = schedule.endDate ? `until ${fmtDateLong(schedule.endDate)}` : 'no end date'
  return (
    <p className="text-sm text-muted-foreground min-w-0 truncate">
      {rule} · {time} · {end}
    </p>
  )
}

// ─── Schedule card ────────────────────────────────────────────────────────────

function RecurringScheduleCard({
  schedule,
  onClick,
}: {
  schedule: RecurringSchedule
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.12 }}
      className="w-full text-left bg-card border border-[var(--border)] rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Title + badge */}
          <div className="flex items-start gap-2.5 mb-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-foreground min-w-0 truncate flex-1">
              {schedule.templateJob.title}
            </h3>
            <RecurringStatusBadge active={schedule.active} />
          </div>

          {/* Recurrence rule */}
          <RecurrenceSummary schedule={schedule} />

          {/* Client / location */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground min-w-0">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">
              {schedule.templateJob.client ? `${schedule.templateJob.client} · ` : ''}
              {schedule.templateJob.location}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-5 mt-3.5 flex-wrap">
            {schedule.nextOccurrence && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar size={11} className="shrink-0 text-muted-foreground" />
                <span>Next: <span className="font-semibold text-foreground">{fmtDate(schedule.nextOccurrence)}</span></span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{schedule.upcomingCount}</span> upcoming
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{schedule.occurrenceCount}</span> generated
            </div>
          </div>
        </div>

        <ChevronRight size={16} className="text-slate-300 group-hover:text-muted-foreground transition-colors shrink-0 mt-1" />
      </div>
    </motion.button>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyRecurringState({
  filter,
  onCreateJob,
}: {
  filter: 'all' | 'active' | 'stopped'
  onCreateJob: () => void
}) {
  const messages = {
    all: { title: 'No recurring shifts yet', desc: 'Create one by enabling Recurring when you create a new job.' },
    active: { title: 'No active recurring shifts', desc: 'All schedules are currently stopped.' },
    stopped: { title: 'No stopped recurring shifts', desc: 'All your recurring schedules are active.' },
  }
  const { title, desc } = messages[filter]
  return (
    <div className="bg-card border border-[var(--border)] rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/8 flex items-center justify-center mb-4">
        <Repeat2 size={22} className="text-[var(--primary)]" />
      </div>
      <h3 className="text-sm font-bold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-5">{desc}</p>
      {filter === 'all' && (
        <button
          onClick={onCreateJob}
          className="h-9 px-5 bg-[var(--primary)] text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus size={13} /> Create Job
        </button>
      )}
    </div>
  )
}

// ─── Main list page ───────────────────────────────────────────────────────────

type FilterType = 'all' | 'active' | 'stopped'

export function RecurringJobs() {
  const navigate = useNavigate()
  const onNavigate = (path: string) => navigate(path)
  const { schedules } = useQuery(recurringJobsQuery()).data as { schedules: RecurringSchedule[]; total: number }

  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const filtered = schedules.filter(s => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && s.active) ||
      (filter === 'stopped' && !s.active)
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      s.templateJob.title.toLowerCase().includes(q) ||
      (s.templateJob.client ?? '').toLowerCase().includes(q) ||
      s.templateJob.location.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  return (
    <div className="p-6 max-w-7xl  mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Recurring Shifts</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage repeating schedules that automatically create individual shifts.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/create-job')}
          className="h-9 px-4 bg-[var(--primary)] text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus size={13} /> Create Job
        </button>
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          {(['all', 'active', 'stopped'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-8 px-4 rounded-lg text-sm font-semibold capitalize transition-all ${
                filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? `All (${schedules.length})` : f === 'active' ? `Active (${schedules.filter(s => s.active).length})` : `Stopped (${schedules.filter(s => !s.active).length})`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recurring shifts…"
            className="w-full h-9 pl-8 pr-3 border border-[var(--border)] rounded-xl text-sm text-foreground bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 focus:border-[var(--primary)]/40 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyRecurringState filter={filter} onCreateJob={() => onNavigate('/create-job')} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={filter + search}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-3"
          >
            {filtered.map(s => (
              <RecurringScheduleCard
                key={s._id}
                schedule={s}
                onClick={() => onNavigate(`/jobs/recurring/recurring-job-detail/${s._id}`)}
              />
            ))}

            <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
              <span>Showing 1–{filtered.length} of {filtered.length}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
