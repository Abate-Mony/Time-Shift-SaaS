// @ts-nocheck--


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
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMediaQuery } from 'react-responsive'
import { useLoaderData, type LoaderFunctionArgs } from 'react-router'
import { Avatar, StatusBadge } from '../components/ui'
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
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

const jobColors: Record<string, string> = {
  'in-progress': 'bg-blue-500',
  'assigned': 'bg-[#1E3A5F]',
  'completed': 'bg-emerald-500',
  'pending': 'bg-amber-500',
  'draft': 'bg-slate-400',
}



const DisplayCalendar = ({
  selectedDay, selectedJobs, month
}: {
  // job: CreateJobForm,
  selectedDay: any,
  selectedJobs: CreateJobForm[],
  month: any

}) => {
console.log("selected jobs",selectedJobs.map(w=>w))

  return (
    <>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          {selectedDay ? `${selectedDay} ${MONTHS[month]}` : 'Select a day'}
        </h3>
        <p className="text-xs text-slate-400 mb-4">{selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} scheduled</p>

        {selectedJobs?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400">No jobs on this day</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {selectedJobs?.map((job) => {
              const assignedWorkers = job?.workers?.map(w => w)
              return (
                <div key={job._id} className="border border-[#E2E8F0] rounded-xl p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{job?.title}</p>
                    <StatusBadge status={job?.status || ""} />
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
                  {assignedWorkers?.length > 0 && (
                    <div className="flex items-center gap-1 mt-3">
                      {assignedWorkers.slice(0, 4).map((w, i) => (
                        <Avatar key={w.fullname} initials={w?.fullname?.[0]} size="sm" index={i} />
                      ))}
                      {assignedWorkers?.length > 4 && (
                        <span className="text-[10px] text-slate-400 ml-1">+{assignedWorkers.length - 4}</span>
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
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Legend</p>
        <div className="flex flex-col gap-2">
          {[
            { label: 'In Progress', color: 'bg-blue-500' },
            { label: 'Assigned', color: 'bg-[#1E3A5F]' },
            { label: 'Completed', color: 'bg-emerald-500' },
            { label: 'Pending', color: 'bg-amber-500' },
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
  const { searchValues } = useLoaderData() as any
  const { searchQuery, handleFiltersChange } = useFilter()

  const { data } = useQuery(calendarQuery(searchValues))
  const jobs = data?.jobs ?? []
  const isStartMonthFromQuery = searchQuery.get("start")
  const start_month = dayjs(isStartMonthFromQuery || new Date()).month()
  const [year, setYear] = useState(dayjs().year())
  const [month, setMonth] = useState(start_month)
  const start = dayjs().year(year).month(month).startOf('month').format('YYYY-MM-DD')
  const end = dayjs().year(year).month(month).endOf('month').format('YYYY-MM-DD')
  const [selectedDay, setSelectedDay] = useState<number | null>(dayjs().date())

  const getJobsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return jobs.filter((j: any) => dayjs(j.date).format('YYYY-MM-DD') === dateStr)
  }
  useEffect(() => {
    handleFiltersChange({ start, end })
  }, [year, month])

  const days = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  // const getJobsForDay = (day: number) => {
  //   const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  //   return jobs.filter(j => j.date === dateStr)
  // }

  const selectedDateStr = selectedDay
    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null
    console.log("slected job string : ",selectedDateStr,jobs.map(j=>j.date))
  const selectedJobs = selectedDateStr ? jobs.filter(j => dayjs(j.date).format("YYYY/MM/DD") === dayjs(selectedDateStr).format("YYYY/MM/DD")) : []
  const [open, setOpen] = useState(false)
  const isDesktop = useMediaQuery({ minWidth: 768 })

  return (
    <div className="px-2 sm:px-4 lg:p-6 animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Calendar</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visual overview of all scheduled jobs</p>
        </div>
        <div className="flex items-center gap-2 ">
          {['Month', 'Week', 'Day'].map(v => (
            <button key={v} className={`h-8 px-3.5 rounded-lg text-xs font-medium transition-colors ${v === 'Month' ? 'bg-[#1E3A5F] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{v}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-5">
        {/* Calendar grid */}
        <div className="flex-1 bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <button onClick={prev} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-sm font-semibold text-slate-900">{MONTHS[month]} {year}</h2>
            <button onClick={next} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-[#F1F5F9]">
            {DAYS.map(d => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">{d}</div>
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
              const isToday = day === 25 && month === 6 && year === 2025
              const isSelected = day === selectedDay
              return (
                <div
                  key={day}
                  onClick={() => {
                    setSelectedDay(day)
                    if (isDesktop) return
                    setOpen(true)

                  }}
                  className={`h-28 border-b border-r border-[#F8FAFC] p-2 cursor-pointer transition-colors hover:bg-slate-50/60 ${isSelected ? 'bg-blue-50/40' : ''}`}
                >
                  <div className="flex justify-end mb-1">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                      ${isToday ? 'bg-[#1E3A5F] text-white' : isSelected ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}>
                      {day}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayJobs.slice(0, 2).map(job => (
                      <div key={job._id} className={`${jobColors[job.status || "orange"] ?? 'bg-slate-400'} rounded px-1.5 py-0.5`}>
                        <p className="text-[10px] text-white font-medium truncate">{job.title.split('—')[0].trim()}</p>
                      </div>
                    ))}
                    {dayJobs.length > 2 && (
                      <p className="text-[10px] text-slate-400 font-medium px-1">+{dayJobs.length - 2} more</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="hidden lg:block w-72 shrink-0">
      //todo
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild className='hidden'>
              <Button variant="outline">Edit Profile</Button>
            </DrawerTrigger>
            <DrawerContent className=''>
              <DrawerHeader className="text-left">
                <DrawerTitle>Create Worker</DrawerTitle>
                <DrawerDescription>
                  {/* Make changes to your profile here. Click save when you're done. */}
                </DrawerDescription>
              </DrawerHeader>
              <DisplayCalendar
                // job={jobs}
                month={month}
                selectedDay={selectedDay}
                selectedJobs={selectedJobs}
              />
              <DrawerFooter className="pt-2">
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <DisplayCalendar
            // job={jobs}
            month={month}
            selectedDay={selectedDay}
            selectedJobs={selectedJobs}
          />
        </div>
      </div>
    </div>
  )
}
