import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useFilter } from '@/hooks/CustomLinkFilterHook'
import { queryClient } from '@/lib/queryClient'
import customFetch from '@/utils/customFetch'
import type { CreateJobForm } from '@/utils/types'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMediaQuery } from 'react-responsive'
import { useLoaderData, type LoaderFunctionArgs } from 'react-router'
import { Avatar, StatusBadge } from '../components/ui'

dayjs.extend(utc)

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

const jobColors: Record<string, string> = {
  'in-progress': 'bg-blue-500',
  'published': 'bg-[#1E3A5F]',
  'completed': 'bg-emerald-500',
  'cancelled': 'bg-red-500',
  'draft': 'bg-slate-400',
}

const DisplayCalendar = ({
  selectedDay,
  selectedJobs,
  month,
}: {
  selectedDay: number | null
  selectedJobs: CreateJobForm[]
  month: number
}) => {
  return (
    <>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          {selectedDay ? `${selectedDay} ${MONTHS[month]}` : 'Select a day'}
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} scheduled
        </p>

        {selectedJobs?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400">No jobs on this day</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {selectedJobs?.map((job) => {
              const assignedWorkers = job?.workers ?? []
              return (
                <div key={job._id} className="border border-[#E2E8F0] rounded-xl p-3.5">
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
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 mt-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Legend
        </p>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Published', color: 'bg-[#1E3A5F]' },
            { label: 'In Progress', color: 'bg-blue-500' },
            { label: 'Completed', color: 'bg-emerald-500' },
            { label: 'Cancelled', color: 'bg-red-500' },
            { label: 'Draft', color: 'bg-slate-400' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <span className={`w-3 h-2 rounded-sm ${l.color}`} />
              <span className="text-xs text-slate-600">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export function Calendar() {
  const { searchQuery, handleFiltersChange } = useFilter()

  // Initialise the displayed month from the URL, falling back to today
  const startParam = searchQuery.get('start')
  const [year, setYear] = useState(() => dayjs(startParam || undefined).year())
  const [month, setMonth] = useState(() => dayjs(startParam || undefined).month())

  const start = dayjs().year(year).month(month).startOf('month').format('YYYY-MM-DD')
  const end = dayjs().year(year).month(month).endOf('month').format('YYYY-MM-DD')

  // Query is driven by the current month, so prev/next trigger a real refetch
  const { data, isLoading } = useQuery(calendarQuery({ start, end }))
  const jobs = data?.jobs ?? []
console.log("this is job : ",jobs)
  const [selectedDay, setSelectedDay] = useState<number | null>(dayjs().date())
  const [open, setOpen] = useState(false)
  const isDesktop = useMediaQuery({ minWidth: 768 })

  useEffect(() => {
    handleFiltersChange({ start, end })
  }, [year, month])

  // Compare in UTC — stored dates like 2026-08-09T23:00:00.000Z must land on the 9th,
  // not shift to the 10th via local-timezone conversion
  const getJobsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return jobs.filter((j: any) => dayjs.utc(j.date).format('YYYY-MM-DD') === dateStr)
  }

  const selectedDateStr = selectedDay
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null

  const selectedJobs = selectedDateStr
    ? jobs.filter((j: any) => dayjs.utc(j.date).format('YYYY-MM-DD') === selectedDateStr)
    : []

  const days = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const prev = () => {
    if (month === 0) {
      setYear(y => y - 1)
      setMonth(11)
    } else {
      setMonth(m => m - 1)
    }
  }

  const next = () => {
    if (month === 11) {
      setYear(y => y + 1)
      setMonth(0)
    } else {
      setMonth(m => m + 1)
    }
  }

  const today = dayjs()

  return (
    <div className="px-2 sm:px-4 lg:p-6 animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Calendar</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visual overview of all scheduled jobs</p>
        </div>
        <div className="flex items-center gap-2">
          {['Month', 'Week', 'Day'].map(v => (
            <button
              key={v}
              className={`h-8 px-3.5 rounded-lg text-xs font-medium transition-colors ${
                v === 'Month' ? 'bg-[#1E3A5F] text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-5">
        {/* Calendar grid */}
        <div className="flex-1 bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <button
              onClick={prev}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-slate-900">
              {MONTHS[month]} {year}
              {isLoading && <span className="ml-2 text-xs text-slate-400 font-normal">loading…</span>}
            </h2>
            <button
              onClick={next}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

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
              const dayJobs = getJobsForDay(day)
              const isToday =
                day === today.date() && month === today.month() && year === today.year()
              const isSelected = day === selectedDay

              return (
                <div
                  key={day}
                  onClick={() => {
                    setSelectedDay(day)
                    if (isDesktop) return
                    setOpen(true)
                  }}
                  className={`h-28 border-b border-r border-[#F8FAFC] p-2 cursor-pointer transition-colors hover:bg-slate-50/60 ${
                    isSelected ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="flex justify-end mb-1">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                        ${
                          isToday
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
              )
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="hidden lg:block w-72 shrink-0">
          <DisplayCalendar
            month={month}
            selectedDay={selectedDay}
            selectedJobs={selectedJobs}
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
            <DrawerTitle>
              {selectedDay ? `${selectedDay} ${MONTHS[month]}` : 'Jobs'}
            </DrawerTitle>
            <DrawerDescription />
          </DrawerHeader>
          <div className="px-4">
            <DisplayCalendar
              month={month}
              selectedDay={selectedDay}
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
    </div>
  )
}