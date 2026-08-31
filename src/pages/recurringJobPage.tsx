import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Repeat2, ChevronRight, Plus, Search, Calendar, MapPin, Clock, AlertCircle } from 'lucide-react'
import { SCHEDULES, describeRecurrence, fmtDate, fmtDateLong, type RecurringSchedule } from '../data/recurringMockData'
import { useNavigate } from 'react-router'

// ─── Status badge ──────────────────────────────────────────────────────────────

function RecurringStatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
      active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
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
    <p className="text-sm text-slate-600 min-w-0 truncate">
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
      className="w-full text-left bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Title + badge */}
          <div className="flex items-start gap-2.5 mb-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 min-w-0 truncate flex-1">
              {schedule.templateJob.title}
            </h3>
            <RecurringStatusBadge active={schedule.active} />
          </div>

          {/* Recurrence rule */}
          <RecurrenceSummary schedule={schedule} />

          {/* Client / location */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400 min-w-0">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{schedule.templateJob.client} · {schedule.templateJob.location}</span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-5 mt-3.5 flex-wrap">
            {schedule.nextOccurrence && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar size={11} className="shrink-0 text-slate-400" />
                <span>Next: <span className="font-semibold text-slate-700">{fmtDate(schedule.nextOccurrence)}</span></span>
              </div>
            )}
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{schedule.upcomingCount}</span> upcoming
            </div>
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{schedule.occurrenceCount}</span> generated
            </div>
          </div>
        </div>

        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 mt-1" />
      </div>
    </motion.button>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RecurringListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-5 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex gap-2 mb-2">
                <div className="h-4 bg-slate-200 rounded w-3/5" />
                <div className="h-5 bg-slate-100 rounded-full w-14" />
              </div>
              <div className="h-3.5 bg-slate-100 rounded w-4/5 mb-1.5" />
              <div className="h-3 bg-slate-100 rounded w-2/5 mb-3" />
              <div className="flex gap-4">
                <div className="h-3 bg-slate-100 rounded w-20" />
                <div className="h-3 bg-slate-100 rounded w-16" />
                <div className="h-3 bg-slate-100 rounded w-16" />
              </div>
            </div>
            <div className="w-4 h-4 bg-slate-100 rounded mt-1" />
          </div>
        </div>
      ))}
    </div>
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
    <div className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[#1E3A5F]/8 flex items-center justify-center mb-4">
        <Repeat2 size={22} className="text-[#1E3A5F]" />
      </div>
      <h3 className="text-sm font-bold text-slate-800 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-5">{desc}</p>
      {filter === 'all' && (
        <button
          onClick={onCreateJob}
          className="h-9 px-5 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center gap-2"
        >
          <Plus size={13} /> Create Job
        </button>
      )}
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center py-14 text-center px-8">
      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-3">
        <AlertCircle size={18} className="text-red-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700 mb-1">Could not load recurring shifts</p>
      <p className="text-xs text-slate-400 mb-4">Check your connection and try again.</p>
      <button onClick={onRetry} className="h-8 px-4 text-sm font-semibold text-[#1E3A5F] border border-[#1E3A5F]/20 rounded-lg hover:bg-[#1E3A5F]/5 transition-colors">
        Try again
      </button>
    </div>
  )
}

// ─── Main list page ───────────────────────────────────────────────────────────

type FilterType = 'all' | 'active' | 'stopped'

export function RecurringJobs({
}) {
    const navigate=useNavigate()
  const onNavigate=(path:string)=>navigate(path)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [loading] = useState(false)
  const [error] = useState(false)

  const filtered = SCHEDULES.filter(s => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && s.active) ||
      (filter === 'stopped' && !s.active)
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      s.templateJob.title.toLowerCase().includes(q) ||
      s.templateJob.client.toLowerCase().includes(q) ||
      s.templateJob.location.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  return (
    <div className="p-6 max-w-7xl  mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recurring Shifts</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage repeating schedules that automatically create individual shifts.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/create-job')}
          className="h-9 px-4 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center gap-2"
        >
          <Plus size={13} /> Create Job
        </button>
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {(['all', 'active', 'stopped'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-8 px-4 rounded-lg text-sm font-semibold capitalize transition-all ${
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f === 'all' ? `All (${SCHEDULES.length})` : f === 'active' ? `Active (${SCHEDULES.filter(s => s.active).length})` : `Stopped (${SCHEDULES.filter(s => !s.active).length})`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recurring shifts…"
            className="w-full h-9 pl-8 pr-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <RecurringListSkeleton />
      ) : error ? (
        <ErrorState onRetry={() => {}} />
      ) : filtered.length === 0 ? (
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
                onClick={() => onNavigate('/jobs/recurring/recurring-job-detail/8282873')}
              />
            ))}

            {/* Pagination hint */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between pt-4 text-xs text-slate-400">
                <span>Showing 1–{filtered.length} of {filtered.length}</span>
                <div className="flex items-center gap-1">
                  <button disabled className="h-7 px-3 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed">‹ Previous</button>
                  <button className="h-7 px-3 rounded-lg border border-[#1E3A5F]/20 text-[#1E3A5F] bg-[#1E3A5F]/5 font-semibold">1</button>
                  <button disabled className="h-7 px-3 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed">Next ›</button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
