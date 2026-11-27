import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Repeat2, ChevronRight, Plus, Search, Calendar, MapPin, AlertTriangle } from 'lucide-react'
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

const AVATAR_COLOURS = ['#0EA5E9', '#8B5CF6', '#F43F5E', '#10B981', '#F59E0B', '#6366F1', '#14B8A6', '#EC4899']
const CLIENT_TINTS = [
  ['#E0E7FF', '#3730A3'], ['#DCFCE7', '#166534'], ['#FCE7F3', '#9D174D'],
  ['#FEF3C7', '#92400E'], ['#E0F2FE', '#075985'], ['#EDE9FE', '#5B21B6'],
]
const hash = (key: string) => [...key].reduce((n, c) => n + c.charCodeAt(0), 0)
const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?'

function SideLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-1.5">{children}</p>
}

/** Client + site, and the schedule's regular (default) workers. */
function ScheduleSidePanel({ schedule, onOpenClient }: { schedule: RecurringSchedule; onOpenClient: (id: string) => void }) {
  const client = schedule.clientInfo
  const site = schedule.siteInfo
  const workers = schedule.workers ?? []
  const shown = workers.slice(0, 3)
  const [bg, fg] = CLIENT_TINTS[hash(client?._id ?? client?.name ?? '') % CLIENT_TINTS.length]
  const names = workers.length <= 2
    ? workers.map(w => w.fullname).join(', ')
    : `${workers.slice(0, 2).map(w => w.fullname).join(', ')} +${workers.length - 2}`

  return (
    <div className="flex flex-col gap-3.5 md:w-[300px] lg:w-[330px] shrink-0 pt-3.5 mt-3.5 border-t md:pt-0 md:mt-0 md:border-t-0 md:border-l border-[var(--border)]/70 md:pl-6">
      <div>
        <SideLabel>Client</SideLabel>
        {client ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0" style={{ background: bg, color: fg }}>
              {initials(client.name)}
            </span>
            <div className="min-w-0">
              <span
                role="link"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); onOpenClient(client._id) }}
                onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onOpenClient(client._id) } }}
                className="block text-sm font-bold text-[var(--primary)] hover:underline truncate"
              >
                {client.name}
              </span>
              {site?.name && <p className="text-xs text-muted-foreground truncate">{site.name}</p>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No client</p>
        )}
      </div>

      <div>
        <SideLabel>Usually done by</SideLabel>
        {!workers.length && !schedule.active ? (
          <p className="text-sm text-muted-foreground">None</p>
        ) : workers.length ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex shrink-0">
              {shown.map((w, i) => (
                <span
                  key={w._id}
                  title={w.fullname}
                  className={`w-[30px] h-[30px] rounded-full border-2 border-card text-white text-[10.5px] font-bold flex items-center justify-center ${i ? '-ml-1.5' : ''}`}
                  style={{ background: AVATAR_COLOURS[hash(w._id) % AVATAR_COLOURS.length] }}
                >
                  {initials(w.fullname)}
                </span>
              ))}
              {workers.length > shown.length && (
                <span className="-ml-1.5 w-[30px] h-[30px] rounded-full border-2 border-card bg-muted text-[10.5px] font-bold text-muted-foreground flex items-center justify-center">
                  +{workers.length - shown.length}
                </span>
              )}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-[13px] text-foreground truncate">{names}</p>
              <p className="text-xs text-muted-foreground">{workers.length} worker{workers.length === 1 ? '' : 's'}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-800">
            <AlertTriangle size={13} className="shrink-0 mt-px" />
            <span>No regular workers — each job is created unstaffed</span>
          </div>
        )}
      </div>
    </div>
  )
}

function RecurringScheduleCard({
  schedule,
  onClick,
  onOpenClient,
}: {
  schedule: RecurringSchedule
  onClick: () => void
  onOpenClient: (id: string) => void
}) {
  const site = schedule.siteInfo
  // Site name first, then the address line already on the job.
  const place = [site?.name, schedule.templateJob.location].filter(Boolean).join(' · ')

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.12 }}
      className="w-full text-left bg-card border border-[var(--border)] rounded-2xl p-5 md:px-6 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center md:gap-6">
          <div className="flex-1 min-w-0">
            {/* Title + badge */}
            <div className="flex items-center gap-2.5 mb-1.5 min-w-0">
              <h3 className="text-base font-bold text-foreground min-w-0 truncate">{schedule.templateJob.title}</h3>
              <RecurringStatusBadge active={schedule.active} />
            </div>

            {/* Recurrence rule */}
            <RecurrenceSummary schedule={schedule} />

            {/* Site / location */}
            {place && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground min-w-0">
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">{place}</span>
              </div>
            )}

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

          <ScheduleSidePanel schedule={schedule} onOpenClient={onOpenClient} />
        </div>

        <ChevronRight size={16} className="text-slate-300 group-hover:text-muted-foreground transition-colors shrink-0 hidden sm:block" />
      </div>
    </motion.div>
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
          <Plus size={13} /> New recurring schedule
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
      (s.clientInfo?.name ?? '').toLowerCase().includes(q) ||
      (s.siteInfo?.name ?? '').toLowerCase().includes(q) ||
      (s.templateJob.location ?? '').toLowerCase().includes(q) ||
      (s.workers ?? []).some(w => w.fullname.toLowerCase().includes(q))
    return matchFilter && matchSearch
  })

  return (
    <div className="p-6 max-w-7xl  mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Recurring Jobs</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage repeating schedules that automatically create individual shifts.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/create-job?recurring=true')}
          className="h-9 px-4 bg-[var(--primary)] cursor-pointer text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus size={13} /> New recurring schedule
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
            placeholder="Search job, client, site, worker…"
            className="w-full h-9 pl-8 pr-3 border border-[var(--border)] rounded-xl text-sm text-foreground bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 focus:border-[var(--primary)]/40 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyRecurringState filter={filter} onCreateJob={() => onNavigate('/create-job?recurring=true')} />
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
                onOpenClient={id => onNavigate(`/clients/${id}`)}
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
