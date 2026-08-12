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
import { ChevronLeft, ChevronRight, Clock, Luggage, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMediaQuery } from 'react-responsive'
import { Link, type LoaderFunctionArgs } from 'react-router'
import { Avatar, EmptyState, StatusBadge } from '../components/ui'
import AnimatedHeadLessUi from '@/components/animated-headless-ui'
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

const jobColors: Record<string, string> = {
  'in-progress': 'bg-blue-500',
  'published': 'bg-[#1E3A5F]',
  'completed': 'bg-emerald-500',
  'cancelled': 'bg-red-500',
  'draft': 'bg-slate-400',
}

const DisplayCalendar = ({
  selectedDate,
  selectedJobs,
}: {
  selectedDate: string | null
  selectedJobs: CreateJobForm[]
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
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex-1 overflow-y-auto scrollto">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          {selectedDate ? dayjs(selectedDate).format('D MMMM') : 'Select a day'}
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} scheduled
        </p>

        {selectedJobs?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400">No jobs on this day

              <EmptyState
                title='Create New Job With this Date'
                icon={<Luggage />}
                action={<Link to={`/create-job`}>
                  <Button>
                    create Job
                  </Button>
                </Link>}
              >

              </EmptyState>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {selectedJobs?.map((job) => {
              const assignedWorkers = job?.workers ?? []
              return (
                <Link to={`/jobs/${job._id}`} key={job._id} className="border border-[#E2E8F0] rounded-xl p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      {job?.title}
                    </p>
                    <StatusBadge status={job?.status || ''} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={11} className="shrink-0" />
                      {job.startTime} – {job.endTime}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
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
                        />
                      ))}
                      {assignedWorkers.length > 4 && (
                        <span className="text-[10px] text-slate-400 ml-1">
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
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mt-3 flex-none">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Legend
        </p>
        <div className="flex overflow-x-auto scrollto sm:flex-col gap-2">
          {[
            { label: 'Published', color: 'bg-[#1E3A5F]' },
            { label: 'In Progress', color: 'bg-blue-500' },
            { label: 'Completed', color: 'bg-emerald-500' },
            { label: 'Cancelled', color: 'bg-red-500' },
            { label: 'Draft', color: 'bg-slate-400' },
          ].map(l => (
            <div key={l.label} className="flex items-center   gap-2">
              <span className={`w-3 h-2 rounded-sm ${l.color}`} />
              <span className="text-xs text-slate-600 flex truncate">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
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
  const jobs = data?.jobs ?? []
  const [selectedDate, setSelectedDate] = useState<string | null>(() => dayjs().format('YYYY-MM-DD'))
  const [open, setOpen] = useState(false)
  const isDesktop = useMediaQuery({ minWidth: 768 })

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
  const getJobsForDate = (dateStr: string) => {
    return jobs.filter((j: any) => dayjs.utc(j.date).format('YYYY-MM-DD') === dateStr)
  }

  const getJobsForDay = (day: number) => getJobsForDate(toDateStr(year, month, day))

  const selectedJobs = selectedDate ? getJobsForDate(selectedDate) : []

  const days = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const weekDates = Array.from({ length: 7 }).map((_, i) => currentDate.startOf('isoWeek').add(i, 'day'))

  const navUnit = view

  const prev = () => setCurrentDate(d => d.subtract(1, navUnit))
  const next = () => setCurrentDate(d => d.add(1, navUnit))

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
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Calendar</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visual overview of all scheduled jobs</p>
        </div>
        <div className="flex items-center gap-2">
          {(['Month', 'Week', 'Day'] as const).map(v => {
            const key = v.toLowerCase() as ViewMode
            return (
              <FilterButton
                name='view'
                show
                layoutId='calendar-filter-button'
                animateClassName='size-full! inset-0! bg-[#1E3A56]  group-hover:text-black!'
                value={key}
                key={v}
                onClick={() => {
                  if (key !== 'month' && selectedDate) setCurrentDate(dayjs(selectedDate))
                }}
                className={`h-8  px-3.5 rounded-lg text-xs font-medium transition-colors ${key === view ? 'bg-[#21262c]- text-white' : 'text-slate-500 hover:bg-slate-100'
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
          key={view} className="flex-1 bg-white rounded-xl border border-[#E2E8F0] overflow-hidden ">
          {/* Date nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <button
              onClick={prev}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-slate-900">
              {headerTitle}
              {isLoading && <span className="ml-2 text-xs text-slate-400 font-normal">loading…</span>}
            </h2>
            <button
              onClick={next}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {view === 'month' && (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-[#F1F5F9]">
                {DAYS.map(d => (
                  <div
                    key={d}
                    className="py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-28 border-b border-r border-[#F8FAFC]" />
                ))}
                {Array.from({ length: days }).map((_, i) => {
                  const day = i + 1
                  const dateStr = toDateStr(year, month, day)
                  const dayJobs = getJobsForDay(day)
                  const isToday =
                    day === today.date() && month === today.month() && year === today.year()
                  const isSelected = dateStr === selectedDate

                  return (
                    <AnimatedHeadLessUi
                    animatedClassName='bg-black top-auto bottom-0 h-[2px]!'
                      index={i}
                      hoverIndex={hoverIndex}
                      setHoverIndex={setHoverIndex}
                      layoutId='calendar-headless-ui'
                    >

                      <div
                        key={day}
                        onClick={() => selectDay(dateStr)}
                        className={`h-28 border-b border-r border-[#F8FAFC] p-2 cursor-pointer transition-colors hover:bg-slate-50/60 ${isSelected ? 'bg-blue-50/40' : ''
                          }`}
                      >
                        <div className="flex justify-end mb-1">

                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                            ${isToday
                                ? 'bg-[#1E3A5F] text-white'
                                : isSelected
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'text-slate-600'
                              }`}
                          >
                            {day}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {dayJobs.slice(0, 2).map((job: any) => (
                            <div
                              key={job._id}
                              className={`${jobColors[job.status] ?? 'bg-slate-400'} rounded px-1.5 py-0.5`}
                            >
                              <p className="text-[10px] text-white font-medium truncate">
                                {job.title?.split('—')[0].trim()}
                              </p>
                            </div>
                          ))}
                          {dayJobs.length > 2 && (
                            <p className="text-[10px] text-slate-400 font-medium px-1">
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

          {view === 'week' && (
            <>
              {/* Day headers with dates */}
              <div className="grid grid-cols-7 border-b border-[#F1F5F9]">
                {weekDates.map(d => {
                  const isToday = d.isSame(today, 'day')
                  return (
                    <div
                      key={d.format('YYYY-MM-DD')}
                      className="py-2.5 text-center border-r border-[#F1F5F9] last:border-r-0"
                    >
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{d.format('ddd')}</p>
                      <p className={`text-sm font-semibold mt-0.5 ${isToday ? 'text-[#1E3A5F]' : 'text-slate-700'}`}>
                        {d.format('D')}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Day columns */}
              <div className="grid grid-cols-7">
                {weekDates.map(d => {
                  const dateStr = d.format('YYYY-MM-DD')
                  const dayJobs = getJobsForDate(dateStr)
                  const isSelected = dateStr === selectedDate

                  return (
                    <div
                      key={dateStr}
                      onClick={() => selectDay(dateStr)}
                      className={`h-72 border-b border-r border-[#F8FAFC] last:border-r-0 p-2 cursor-pointer transition-colors hover:bg-slate-50/60 ${isSelected ? 'bg-blue-50/40' : ''
                        }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        {dayJobs.slice(0, 6).map((job: any) => (
                          <div
                            key={job._id}
                            className={`${jobColors[job.status] ?? 'bg-slate-400'} rounded px-1.5 py-0.5`}
                          >
                            <p className="text-[10px] text-white font-medium truncate">
                              {job.title?.split('—')[0].trim()}
                            </p>
                          </div>
                        ))}
                        {dayJobs.length > 6 && (
                          <p className="text-[10px] text-slate-400 font-medium px-1">
                            +{dayJobs.length - 6} more
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {view === 'day' && (
            <div className="p-5">
              <p className="text-xs text-slate-400 mb-4">
                {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} scheduled
              </p>
              {selectedJobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs text-slate-400">No jobs on this day</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedJobs.map((job: any) => {
                    const assignedWorkers = job?.workers ?? []
                    return (
                      <Link to={`/jobs/${job._id}`} key={job._id} className="border border-[#E2E8F0] rounded-xl p-3.5 block">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-xs font-semibold text-slate-800 leading-snug">
                            {job?.title}
                          </p>
                          <StatusBadge status={job?.status || ''} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock size={11} className="shrink-0" />
                            {job.startTime} – {job.endTime}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
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
                              />
                            ))}
                            {assignedWorkers.length > 4 && (
                              <span className="text-[10px] text-slate-400 ml-1">
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
          )}
        </motion.div>

        {/* Day detail panel */}
        {view !== 'day' && (
          <div className="hidden lg:block w-72 shrink-0">
            <DisplayCalendar
              selectedDate={selectedDate}
              selectedJobs={selectedJobs}
            />
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {view !== 'day' && (
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
              />
            </div>
            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}