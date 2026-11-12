import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { AlertTriangle, Check } from 'lucide-react'
import type { CreateJobForm } from '@/utils/types'
import {
  activeWorkers,
  jobSpan,
  layoutDay,
  STATUS_LABEL,
  type JobIssue,
} from './calendarUtils'

const HOUR_PX = 56
const DEFAULT_START = 7
const DEFAULT_END = 20

const blockClass: Record<string, string> = {
  published: 'bg-[var(--primary)]/10 text-foreground border border-[var(--primary)]/25',
  'in-progress': 'bg-blue-600 text-white border border-blue-700',
  completed: 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border border-emerald-600/30',
  cancelled: 'bg-muted text-muted-foreground border border-dashed border-muted-foreground/50',
  draft: 'bg-card text-foreground border border-dashed border-muted-foreground',
}
const FLAGGED = 'bg-[var(--warning-bg)] text-amber-950 dark:text-amber-100 border-2 border-amber-500'

const AVATAR_TINTS = [
  'bg-blue-100 text-blue-800',
  'bg-violet-100 text-violet-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-900',
  'bg-rose-100 text-rose-800',
  'bg-cyan-100 text-cyan-800',
]

/** "rose mary smith" → "RS" */
function initialsOf(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] ?? '')
  return (first + last).toUpperCase()
}

function MiniAvatar({ name, src, index }: { name?: string; src?: string | null; index: number }) {
  const cls = 'size-5 -ml-1 first:ml-0 rounded-full ring-2 ring-card shrink-0'
  if (src) return <img src={src} alt={name ?? ''} title={name} className={`${cls} object-cover`} />
  return (
    <span title={name} className={`${cls} ${AVATAR_TINTS[index % AVATAR_TINTS.length]} inline-flex items-center justify-center text-[8px] font-bold`}>
      {initialsOf(name)}
    </span>
  )
}

const fmtHour = (h: number) => `${String(h).padStart(2, '0')}:00`

interface Props {
  dates: Dayjs[]
  getJobsForDate: (dateStr: string) => CreateJobForm[]
  issues: Map<string, JobIssue[]>
  selectedDate: string | null
  selectedJobId?: string | null
  onSelectDay: (dateStr: string) => void
  /** Clicking a job selects its day and highlights the job in the side panel */
  onSelectJob: (dateStr: string, jobId: string) => void
  showCancelled: boolean
}

export function WeekTimeGrid({ dates, getJobsForDate, issues, selectedDate, selectedJobId, onSelectDay, onSelectJob, showCancelled }: Props) {
  const [now, setNow] = useState(() => dayjs())
  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 60_000)
    return () => clearInterval(id)
  }, [])

  const columns = useMemo(
    () =>
      dates.map(d => {
        const dateStr = d.format('YYYY-MM-DD')
        const jobs = getJobsForDate(dateStr).filter(j => showCancelled || j.status !== 'cancelled')
        return { d, dateStr, jobs, placed: layoutDay(jobs) }
      }),
    [dates, getJobsForDate, showCancelled],
  )

  // Widen the visible hours if any job falls outside 07:00–20:00
  const { startHour, endHour } = useMemo(() => {
    let s = DEFAULT_START, e = DEFAULT_END
    for (const c of columns) for (const p of c.placed) {
      s = Math.min(s, Math.floor(p.s))
      e = Math.max(e, Math.ceil(p.e))
    }
    return { startHour: s, endHour: e }
  }, [columns])

  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  const gridHeight = (endHour - startHour) * HOUR_PX
  const nowHours = now.hour() + now.minute() / 60
  const nowVisible = nowHours >= startHour && nowHours <= endHour

  // Start scrolled to the earliest job (or 07:00) rather than midnight
  // (keyed on primitives so ordinary re-renders don't yank the scroll position)
  const scrollRef = useRef<HTMLDivElement>(null)
  const firstJobHour = Math.min(...columns.flatMap(c => c.placed.map(p => p.s)), DEFAULT_START)
  const rangeKey = columns.map(c => c.dateStr).join(',')
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: Math.max(0, (firstJobHour - startHour) * HOUR_PX - 8) })
  }, [rangeKey, firstJobHour, startHour])

  const gridCols = { gridTemplateColumns: `56px repeat(${dates.length}, minmax(0, 1fr))` }

  return (
    <div className="overflow-x-auto">
      <div className={dates.length > 1 ? 'min-w-[820px]' : ''}>
        {/* Day headers */}
        <div className="grid border-b border-[var(--border)]" style={gridCols}>
          <div />
          {columns.map(({ d, dateStr, jobs }) => {
            const isToday = d.isSame(now, 'day')
            const isSelected = dates.length > 1 && dateStr === selectedDate
            const live = jobs.filter(j => j.status !== 'cancelled')
            const staffedHours = live.reduce((sum, j) => {
              const { s, e } = jobSpan(j)
              return sum + (e - s) * Math.max(activeWorkers(j).length, 1)
            }, 0)
            const hasIssue = jobs.some(j => j._id && issues.has(j._id))
            return (
              <button
                type="button"
                key={dateStr}
                onClick={() => onSelectDay(dateStr)}
                aria-pressed={isSelected}
                className={`text-left px-2.5 py-2 border-l border-[var(--border)] border-b-2 cursor-pointer transition-colors hover:bg-muted/60 ${isSelected ? 'bg-[var(--primary)]/10 border-b-[var(--primary)]' : `border-b-transparent ${isToday ? 'bg-[var(--primary)]/5' : ''}`}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-semibold uppercase tracking-wide ${isToday ? 'text-[var(--primary)]' : 'text-muted-foreground'}`}>
                    {d.format('ddd')}
                  </span>
                  <span className={`min-w-7 h-7 rounded-full inline-flex items-center justify-center text-sm font-bold ${isToday ? 'bg-[var(--primary)] text-white' : 'text-foreground'}`}>
                    {d.format('D')}
                  </span>
                  {hasIssue && (
                    <AlertTriangle size={14} className="ml-auto text-amber-600 shrink-0" aria-label="Needs attention" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {live.length === 0
                    ? 'No jobs'
                    : `${live.length} job${live.length === 1 ? '' : 's'} · ${Math.round(staffedHours * 10) / 10}h`}
                </p>
              </button>
            )
          })}
        </div>

        {/* Time grid */}
        <div ref={scrollRef} className="max-h-[calc(100svh-17rem)] min-h-80 overflow-y-auto scrollto">
          <div className="grid relative" style={{ ...gridCols, height: gridHeight }}>
            <div className="relative">
              {hours.map(h => (
                <span
                  key={h}
                  className="absolute right-2 text-[11px] text-muted-foreground tabular-nums"
                  style={{ top: (h - startHour) * HOUR_PX + (h === startHour ? 2 : -7) }}
                >
                  {fmtHour(h)}
                </span>
              ))}
            </div>

            {columns.map(({ d, dateStr, placed }) => {
              const isToday = d.isSame(now, 'day')
              const isSelected = dates.length > 1 && dateStr === selectedDate
              return (
                <div
                  key={dateStr}
                  onClick={() => onSelectDay(dateStr)}
                  className={`relative border-l border-[var(--border)] cursor-pointer hover:bg-muted/40 ${isSelected ? 'bg-[var(--primary)]/[0.06]' : isToday ? 'bg-[var(--primary)]/[0.03]' : ''}`}
                  style={{
                    backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0px, var(--border) 1px, transparent 1px, transparent ${HOUR_PX}px)`,
                  }}
                >
                  {placed.map(({ job, s, e, lane, lanes, span }) => {
                    const jobIssues = (job._id && issues.get(job._id)) || []
                    const flagged = jobIssues.length > 0
                    const workers = activeWorkers(job) as any[]
                    const status = job.status ?? 'published'
                    const height = Math.max((e - s) * HOUR_PX - 4, 24)
                    const compact = height < 44
                    const tall = height >= 88
                    const maxAvatars = span / lanes >= 0.5 ? 4 : 2
                    const isSelectedJob = job._id === selectedJobId
                    const label = `${job.title}, ${job.startTime} to ${job.endTime}, ${STATUS_LABEL[status] ?? status}${flagged ? `, ${jobIssues.map(i => i.message).join(', ')}` : ''}`
                    return (
                      <button
                        type="button"
                        key={job._id}
                        onClick={ev => {
                          ev.stopPropagation()
                          if (job._id) onSelectJob(dateStr, job._id)
                        }}
                        aria-label={label}
                        aria-pressed={isSelectedJob}
                        title={label}
                        className={`absolute text-left cursor-pointer rounded-lg px-2 py-1 overflow-hidden flex flex-col gap-0.5 hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${flagged ? FLAGGED : (blockClass[status] ?? blockClass.published)} ${isSelectedJob ? 'ring-2 ring-offset-1 ring-[var(--primary)] z-[5]' : ''}`}
                        style={{
                          top: (s - startHour) * HOUR_PX + 2,
                          height,
                          left: `calc(${(lane / lanes) * 100}% + 3px)`,
                          width: `calc(${(span / lanes) * 100}% - 6px)`,
                        }}
                      >
                        <span className={`flex gap-1 min-w-0 ${tall ? 'items-start' : 'items-center'}`}>
                          {flagged && <AlertTriangle size={12} className="shrink-0 text-amber-600 mt-0.5" aria-hidden />}
                          {!flagged && status === 'completed' && <Check size={12} strokeWidth={3} className="shrink-0 mt-0.5" aria-hidden />}
                          <span className={`text-xs font-semibold leading-4 min-w-0 ${tall ? 'line-clamp-2 break-words hyphens-auto' : 'truncate'} ${status === 'cancelled' ? 'line-through' : ''}`}>
                            {job.title?.split('—')[0].trim()}
                          </span>
                        </span>
                        {!compact && (
                          <span className="text-[11px] leading-4 opacity-90 tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
                            {job.startTime}–{job.endTime}
                          </span>
                        )}
                        {/* Staff get their own row so narrow (overlapping) blocks still show them */}
                        {!compact && status !== 'cancelled' && (
                          workers.length === 0 ? (
                            <span className="self-start text-[9px] font-bold uppercase bg-amber-200 text-amber-900 rounded px-1 leading-4">Unassigned</span>
                          ) : (
                            <span className="flex flex-wrap items-center gap-y-0.5 pl-1">
                              {workers.slice(0, maxAvatars).map((w, i) => (
                                <MiniAvatar key={w.worker ?? i} name={w.fullname} src={w.profilePhoto?.url} index={i} />
                              ))}
                              {workers.length > maxAvatars && (
                                <span className="ml-0.5 text-[10px] font-semibold opacity-80">+{workers.length - maxAvatars}</span>
                              )}
                            </span>
                          )
                        )}
                      </button>
                    )
                  })}

                  {isToday && nowVisible && (
                    <div aria-hidden className="absolute inset-x-0 h-0.5 bg-red-600 pointer-events-none z-10" style={{ top: (nowHours - startHour) * HOUR_PX }}>
                      <span className="absolute -left-1 -top-1 size-2.5 rounded-full bg-red-600" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
