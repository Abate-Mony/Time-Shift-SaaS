import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger
} from "@/components/ui/drawer"
import FilterButton from '@/components/ui/FilterButton'
import { useFilter } from '@/hooks/CustomLinkFilterHook'
import { queryClient } from '@/lib/queryClient'
import customFetch from '@/utils/customFetch'
import type { CreateJobForm } from '@/utils/types'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import utc from 'dayjs/plugin/utc'
import { motion } from "framer-motion"
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Luggage, MapPin } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMediaQuery } from 'react-responsive'
import { Link, type LoaderFunctionArgs } from 'react-router'
import { backLinkState } from '@/hooks/useBackLink'
import { Avatar, EmptyState, StatusBadge } from '../components/ui'
import AnimatedHeadLessUi from '@/components/animated-headless-ui'
import { WeekTimeGrid } from '@/components/calendar/WeekTimeGrid'
import { findIssues, jobDateStr, jobSpan, type JobIssue } from '@/components/calendar/calendarUtils'
dayjs.extend(utc)
dayjs.extend(isoWeek)

type ViewMode = 'month' | 'week' | 'day'

const calendarQuery = (params: Record<string, string>) => {
  const start = params.start || dayjs().startOf('month').format('YYYY-MM-DD')
  const end = params.end || dayjs(start).endOf('month').format('YYYY-MM-DD')

  const queryParams = { ...params, start, end }

  return {
    queryKey: ['calendar', { start, end, status: params.status ?? 'all' }],
    queryFn: async () => {
      const { data } = await customFetch.get<{
        jobs: CreateJobForm[]
      }>('/calendar', { params: queryParams })
      return data
    },
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const params = Object.fromEntries([...new URL(request.url).searchParams.entries()])
  await queryClient.ensureQueryData(calendarQuery(params))
  return { searchValues: params }
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Chip styles for the month grid. Cancelled is deliberately the quietest —
// it needs no action, so it shouldn't be the loudest thing on the page.
const jobColors: Record<string, string> = {
  'in-progress': 'bg-blue-600 text-white',
  'published': 'bg-[var(--primary)] text-white',
  'completed': 'bg-emerald-700 text-white',
  'cancelled': 'bg-muted text-muted-foreground line-through',
  'draft': 'bg-card text-foreground border border-dashed border-muted-foreground',
}
const chipClass = (job: CreateJobForm, flagged: boolean) =>
  `${jobColors[job.status ?? ''] ?? jobColors.draft} ${flagged ? 'ring-2 ring-amber-500 ring-inset' : ''}`

const LEGEND = [
  { label: 'Published', swatch: 'bg-[var(--primary)]' },
  { label: 'In progress', swatch: 'bg-blue-600' },
  { label: 'Completed', swatch: 'bg-emerald-700' },
  { label: 'Cancelled', swatch: 'bg-muted border border-dashed border-muted-foreground' },
  { label: 'Draft', swatch: 'bg-card border border-dashed border-muted-foreground' },
  { label: 'Needs attention', swatch: 'bg-[var(--warning-bg)] border-2 border-amber-500' },
]

type IssueRow = { job: CreateJobForm; issues: JobIssue[] }

const NeedsAttention = ({ rows }: { rows: IssueRow[] }) => {
  if (rows.length === 0) return null
  return (
    <div className="bg-card rounded-xl border border-[var(--border)] p-4 mb-3 flex-none">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Needs attention</h3>
        <span className="text-xs font-bold text-amber-900 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-200 rounded-full px-2 py-0.5">
          {rows.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto scrollto">
        {rows.map(({ job, issues }) => (
          <Link
            key={job._id}
            to={`/jobs/${job._id}`}
            state={backLinkState('Calendar')}
            className="flex gap-2.5 items-start rounded-lg border border-[var(--border)] p-2.5 hover:border-amber-500 hover:bg-[var(--warning-bg)] transition-colors"
          >
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" aria-hidden />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-foreground">
                {issues.map(i => i.message).join(' · ')}
              </span>
              <span className="block text-[11px] text-muted-foreground truncate">
                {dayjs.utc(job.date).format('ddd D')} · {job.startTime} · {job.title}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

const DisplayCalendar = ({
  selectedDate,
  selectedJobs,
  issueRows,
  issues,
}: {
  selectedDate: string | null
  selectedJobs: CreateJobForm[]
  issueRows: IssueRow[]
  issues: Map<string, JobIssue[]>
}) => {
  return (
    <motion.div
      key={selectedDate}
      initial={{
        opacity: 0.1,
        y: 100

      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        opacity: {
          duration: 0.5
        },
        y: {
          duration: 0.3
        }
      }}
      className='flex flex-col max-h-[calc(100svh-10rem)]   scrollto!'>
      <NeedsAttention rows={issueRows} />
      <div className="bg-card rounded-xl border border-[var(--border)] p-5 flex-1 overflow-y-auto scrollto">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {selectedDate ? dayjs(selectedDate).format('D MMMM') : 'Select a day'}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} scheduled
        </p>

        {selectedJobs?.length === 0 ? (
          <EmptyState
            title='No jobs on this day'
            icon={<Luggage />}
            action={<Link to={`/create-job`}>
              <Button>
                Create job
              </Button>
            </Link>}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {selectedJobs?.map((job) => {
              const assignedWorkers = job?.workers ?? []
              return (
                <Link
                  state={backLinkState('Calendar')}
                  to={`/jobs/${job._id}`}
                  key={job._id}
                  className="border border-[var(--border)] rounded-xl p-3.5"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-foreground leading-snug">
                      {job?.title}
                    </p>
                    <StatusBadge status={job?.status || ''} />
                  </div>
                  {job._id && issues.get(job._id)?.map(i => (
                    <p key={i.kind} className="flex items-start gap-1.5 text-[11px] text-amber-900 dark:text-amber-200 bg-[var(--warning-bg)] rounded-md px-2 py-1 mb-2">
                      <AlertTriangle size={11} className="shrink-0 mt-0.5" aria-hidden />
                      {i.detail}
                    </p>
                  ))}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={11} className="shrink-0" />
                      {job.startTime} – {job.endTime}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin size={11} className="shrink-0" />
                      <span className="truncate">{job?.location?.split(',')[0]}</span>
                    </div>
                  </div>
                  {assignedWorkers.length > 0 && (
                    <div className="flex items-center gap-1 mt-3">
                      {assignedWorkers.slice(0, 4).map((w: any, i: number) => (
                        <Avatar
                          key={w._id ?? w.fullname ?? i}
                          initials={w?.fullname?.slice(0, 2) ?? '?'}
                          size="sm"
                          index={i}
                          src={w?.profilePhoto?.url}
                        />
                      ))}
                      {assignedWorkers.length > 4 && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          +{assignedWorkers.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-card rounded-xl border border-[var(--border)] p-4 mt-3 flex-none">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Legend
        </p>
        <div className="flex overflow-x-auto scrollto sm:flex-col gap-2">
          {LEGEND.map(l => (
            <div key={l.label} className="flex items-center   gap-2">
              <span className={`w-3 h-2.5 rounded-sm shrink-0 ${l.swatch}`} />
              <span className="text-xs text-muted-foreground flex truncate">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div >
  )
}

export function Calendar() {
  const { searchQuery, handleFiltersChange } = useFilter()

  // Initialise the displayed date / view from the URL, falling back to today
  const startParam = searchQuery.get('start')
  // remove: const [view, setView] = useState<ViewMode>(viewParam ?? 'month')
  const view = (searchQuery.get('view') as ViewMode) ?? 'month'
  const viewParam = searchQuery.get('view') as ViewMode | null
  // const [view, setView] = useState<ViewMode>(viewParam ?? 'month')
  const [currentDate, setCurrentDate] = useState(() => dayjs(startParam || undefined))

  const year = currentDate.year()
  const month = currentDate.month()

  // Query range depends on which view is active, so switching views (and
  // prev/next within a view) triggers a real refetch of the right window
  const rangeStart =
    view === 'month' ? currentDate.startOf('month')
      : view === 'week' ? currentDate.startOf('isoWeek')
        : currentDate.startOf('day')
  const rangeEnd =
    view === 'month' ? currentDate.endOf('month')
      : view === 'week' ? currentDate.endOf('isoWeek')
        : currentDate.endOf('day')
  const start = rangeStart.format('YYYY-MM-DD')
  const end = rangeEnd.format('YYYY-MM-DD')

  const { data, isLoading } = useQuery(calendarQuery({ start, end }))
  const jobs = useMemo(() => data?.jobs ?? [], [data])
  const [selectedDate, setSelectedDate] = useState<string | null>(() => dayjs().format('YYYY-MM-DD'))
  const [open, setOpen] = useState(false)
  // Must match the side detail panel's own breakpoint (`lg:block` below) —
  // otherwise there's a dead range where the drawer is suppressed here but
  // the panel isn't visible yet, and selecting a day shows nothing.
  const isDesktop = useMediaQuery({ minWidth: 1024 })

  useEffect(() => {
    handleFiltersChange({ start, end, view })
  }, [view, start, end])

  // In day view there's no grid to click, so the displayed day is always
  // whatever the user navigated prev/next to
  useEffect(() => {
    if (view === 'day') setSelectedDate(currentDate.format('YYYY-MM-DD'))
  }, [view, currentDate])

  // Compare in UTC — stored dates like 2026-08-09T23:00:00.000Z must land on the 9th,
  // not shift to the 10th via local-timezone conversion
  const getJobsForDate = useCallback(
    (dateStr: string) => jobs.filter(j => jobDateStr(j) === dateStr),
    [jobs],
  )
  const [showCancelled, setShowCancelled] = useState(true)

  // Unassigned / understaffed / double-booked jobs in the visible range
  const issues = useMemo(() => findIssues(jobs), [jobs])
  const issueRows = useMemo<IssueRow[]>(
    () =>
      jobs
        .filter(j => j._id && issues.has(j._id))
        .sort((a, b) => jobDateStr(a).localeCompare(jobDateStr(b)) || jobSpan(a).s - jobSpan(b).s)
        .map(job => ({ job, issues: issues.get(job._id!)! })),
    [jobs, issues],
  )

  const getJobsForDay = (day: number) => getJobsForDate(toDateStr(year, month, day))

  const selectedJobs = (selectedDate ? getJobsForDate(selectedDate) : [])
    .filter(j => showCancelled || j.status !== 'cancelled')
    .sort((a, b) => jobSpan(a).s - jobSpan(b).s)

  const days = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const weekStartKey = currentDate.startOf('isoWeek').format('YYYY-MM-DD')
  const weekDates = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => dayjs(weekStartKey).add(i, 'day')),
    [weekStartKey],
  )
  const dayKey = currentDate.format('YYYY-MM-DD')
  const dayDates = useMemo(() => [dayjs(dayKey)], [dayKey])

  const navUnit = view

  const prev = () => setCurrentDate(d => d.subtract(1, navUnit))
  const next = () => setCurrentDate(d => d.add(1, navUnit))
  const goToday = () => {
    setCurrentDate(dayjs())
    setSelectedDate(dayjs().format('YYYY-MM-DD'))
  }

  const selectDay = (dateStr: string) => {
    setSelectedDate(dateStr)
    if (isDesktop) return
    setOpen(true)
  }

  const today = dayjs()

  const headerTitle = (() => {
    if (view === 'month') return `${MONTHS[month]} ${year}`
    if (view === 'week') {
      const ws = currentDate.startOf('isoWeek')
      const we = currentDate.endOf('isoWeek')
      return ws.month() === we.month()
        ? `${ws.format('MMM D')} – ${we.format('D, YYYY')}`
        : `${ws.format('MMM D')} – ${we.format('MMM D, YYYY')}`
    }
    return currentDate.format('dddd, MMMM D, YYYY')
  })()
  const [hoverIndex, setHoverIndex] = useState<null | number>(null)

  return (
    <div className="px-2 sm:px-4 lg:p-6 animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visual overview of all scheduled jobs</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={showCancelled}
            onClick={() => setShowCancelled(v => !v)}
            className="h-8 px-3 rounded-lg border border-[var(--border)] text-xs font-medium text-muted-foreground hover:bg-muted flex items-center gap-2 mr-1"
          >
            <span className={`relative w-7 h-4 rounded-full transition-colors ${showCancelled ? 'bg-[var(--primary)]' : 'bg-muted-foreground/40'}`}>
              <span className={`absolute top-0.5 size-3 rounded-full bg-white transition-all ${showCancelled ? 'left-3.5' : 'left-0.5'}`} />
            </span>
            Show cancelled
          </button>
          {(['Month', 'Week', 'Day'] as const).map(v => {
            const key = v.toLowerCase() as ViewMode
            return (
              <FilterButton
                name='view'
                show
                layoutId='calendar-filter-button'
                animateClassName='size-full! inset-0! bg-[var(--primary)]'
                value={key}
                key={v}
                onClick={() => {
                  if (key !== 'month' && selectedDate) setCurrentDate(dayjs(selectedDate))
                }}
                className={`h-8  px-3.5 rounded-lg text-xs font-medium transition-colors ${key === view ? 'text-white' : 'text-muted-foreground hover:bg-muted'
                  }`}
              >
                {v}
              </FilterButton>
            )
          })}
        </div>
      </div>

      <div className="flex gap-5">
        {/* Calendar grid */}
        <motion.div
          initial={{
            opacity: 0.1,
            y: 100

          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            opacity: {
              duration: 0.5
            },
            y: {
              duration: 0.3
            }
          }}
          key={view} className="flex-1 bg-card rounded-xl border border-[var(--border)] overflow-hidden ">
          {/* Date nav */}
          <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToday}
              className="h-8 px-3 rounded-lg border border-[var(--border)] text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              aria-label={`Previous ${view}`}
              onClick={prev}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            </div>
            <h2 className="text-sm font-semibold text-foreground">
              {headerTitle}
              {isLoading && <span className="ml-2 text-xs text-muted-foreground font-normal">loading…</span>}
            </h2>
            <button
              type="button"
              aria-label={`Next ${view}`}
              onClick={next}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {view === 'month' && (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-[var(--border)]">
                {DAYS.map(d => (
                  <div
                    key={d}
                    className="py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-28 border-b border-r border-border" />
                ))}
                {Array.from({ length: days }).map((_, i) => {
                  const day = i + 1
                  const dateStr = toDateStr(year, month, day)
                  const dayJobs = getJobsForDay(day)
                    .filter(j => showCancelled || j.status !== 'cancelled')
                    .sort((a, b) => jobSpan(a).s - jobSpan(b).s)
                  const dayHasIssue = dayJobs.some(j => j._id && issues.has(j._id))
                  const isToday =
                    day === today.date() && month === today.month() && year === today.year()
                  const isSelected = dateStr === selectedDate

                  return (
                    <AnimatedHeadLessUi
                      key={day}
                      animatedClassName='bg-black top-auto bottom-0 h-[2px]!'
                      index={i}
                      hoverIndex={hoverIndex}
                      setHoverIndex={setHoverIndex}
                      layoutId='calendar-headless-ui'
                    >

                      <div
                        key={day}
                        onClick={() => selectDay(dateStr)}
                        className={`h-28 border-b border-r border-border p-2 cursor-pointer transition-colors hover:bg-muted/60 ${isSelected ? 'bg-[var(--primary)]/10' : ''
                          }`}
                      >
                        <div className="flex items-center justify-end gap-1 mb-1">
                          {dayHasIssue && <AlertTriangle size={12} className="text-amber-600 mr-auto" aria-label="Needs attention" />}

                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                            ${isToday
                                ? 'bg-[var(--primary)] text-white'
                                : isSelected
                                  ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                                  : 'text-muted-foreground'
                              }`}
                          >
                            {day}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {dayJobs.slice(0, 2).map(job => (
                            <div
                              key={job._id}
                              title={`${job.startTime}–${job.endTime} ${job.title}`}
                              className={`${chipClass(job, !!job._id && issues.has(job._id))} rounded px-1.5 py-0.5`}
                            >
                              <p className="text-[10px] font-medium truncate">
                                <span className="tabular-nums opacity-80 mr-1">{job.startTime}</span>
                                {job.title?.split('—')[0].trim()}
                              </p>
                            </div>
                          ))}
                          {dayJobs.length > 2 && (
                            <p className="text-[10px] text-muted-foreground font-medium px-1">
                              +{dayJobs.length - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    </AnimatedHeadLessUi>
                  )
                })}
              </div>
            </>
          )}

          {(view === 'week' || view === 'day') && (
            <WeekTimeGrid
              dates={view === 'week' ? weekDates : dayDates}
              getJobsForDate={getJobsForDate}
              issues={issues}
              selectedDate={selectedDate}
              onSelectDay={selectDay}
              showCancelled={showCancelled}
            />
          )}
        </motion.div>

        {/* Day detail panel */}
        <div className="hidden lg:block w-80 shrink-0">
          <DisplayCalendar
            selectedDate={selectedDate}
            selectedJobs={selectedJobs}
            issueRows={issueRows}
            issues={issues}
          />
        </div>
      </div>

      {/* Mobile drawer */}
      <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild className="hidden">
            <Button variant="outline">Open</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="text-left">

              <DrawerDescription />
            </DrawerHeader>
            <div className="px-4">
              <DisplayCalendar
                selectedDate={selectedDate}
                selectedJobs={selectedJobs}
                issueRows={issueRows}
                issues={issues}
              />
            </div>
            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
      </Drawer>
    </div>
  )
}