import { EmptyState } from "@/components/empty-state"
import JobCard from "@/components/JobCard"
import { Avatar } from "@/components/ui"
import { Button } from "@/components/ui/button"
import customFetch from "@/utils/customFetch"
import type { CreateJobForm, User } from "@/utils/types"
import type { WorkerDashboardStats } from "@/utils/types/workerType"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { ArrowUpRight, Bell, Briefcase, Calendar, ChevronRight, Clock, MapPin, Timer, Zap } from "lucide-react"
import { Link, useNavigate, useOutletContext } from "react-router"
import { activeWorkerJob } from "./ClockScreenPage"
import { workerDashboardstats } from "./WorkerProfilepage"

dayjs.extend(utc)

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const WEEKLY_TARGET_HOURS = 40
const UPCOMING_SHIFTS_LIMIT = 5

// job.date comes back as a full ISO datetime string, not YYYY-MM-DD —
// dayjs.utc(...) reads the date component as the backend actually meant it
// (job.date is always normalised to UTC midnight). Same fix applied to
// ScheduleScreen.tsx and the mobile app's equivalent screens.
function toDateKey(rawDate: string) {
  return dayjs.utc(rawDate).format('YYYY-MM-DD')
}

function shiftHours(job: CreateJobForm) {
  if (job.minutes) return job.minutes / 60
  const diff = dayjs(`2000-01-01T${job.endTime}`).diff(dayjs(`2000-01-01T${job.startTime}`), 'minute')
  return Math.max(0, diff) / 60
}

function startOfIsoWeek(d: dayjs.Dayjs) {
  const day = d.day()
  const diffToMonday = day === 0 ? -6 : 1 - day
  return d.add(diffToMonday, 'day').startOf('day')
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const activeJob = useQuery(activeWorkerJob()).data?.job
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const user = useOutletContext<{ user: User }>()?.user

  const { jobStats, monthly } = useQuery(workerDashboardstats()).data as WorkerDashboardStats

  const weekStart = startOfIsoWeek(dayjs())
  const weekEnd = weekStart.add(6, 'day')

  // Scoped to this calendar week (Mon–Sun), not an unbounded fetch — a
  // worker with a long history could otherwise never see this week's
  // shifts if they had 100+ older assignments ahead of it in an
  // unbounded, oldest-first query.
  const { data: weekData } = useQuery({
    queryKey: ['worker-dashboard-week', weekStart.format('YYYY-MM-DD')],
    queryFn: async () => {
      const { data } = await customFetch.get<{ jobs: CreateJobForm[] }>('/workers', {
        params: {
          start: weekStart.format('YYYY-MM-DD'),
          end: weekEnd.format('YYYY-MM-DD'),
          status: 'all',
          limit: 100,
        },
      })
      return data
    },
  })

  const { data: upcomingData } = useQuery({
    queryKey: ['worker-dashboard-upcoming'],
    queryFn: async () => {
      const { data } = await customFetch.get<{ jobs: CreateJobForm[] }>('/workers', {
        params: { start: dayjs().format('YYYY-MM-DD'), status: 'all', limit: UPCOMING_SHIFTS_LIMIT * 3 },
      })
      return data
    },
  })

  const weekJobs = (weekData?.jobs ?? []).map(j => ({ ...j, date: toDateKey(j.date) }))
  const todayStr = dayjs().format('YYYY-MM-DD')

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = weekStart.add(i, 'day')
    const dateStr = date.format('YYYY-MM-DD')
    const dayJobs = weekJobs.filter(j => j.date === dateStr)
    return {
      day: DAY_LABELS[i],
      date,
      dateStr,
      isToday: dateStr === todayStr,
      hasShift: dayJobs.length > 0,
      hours: dayJobs.reduce((sum, j) => sum + shiftHours(j), 0),
    }
  })
  const hoursThisWeek = weekDays.reduce((sum, d) => sum + d.hours, 0)

  const upcomingShifts = (upcomingData?.jobs ?? [])
    .map(j => ({ ...j, date: toDateKey(j.date) }))
    .filter(j => !['completed', 'cancelled', 'declined'].includes(j.status ?? ''))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .slice(0, UPCOMING_SHIFTS_LIMIT)

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Header */}
      <div className="bg-primary rounded-3xl p-5 text-primary-foreground relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Avatar initials={user?.fullname?.slice(0, 2)} size="md" index={0} src={user?.profilePhoto?.url} />
              <div>
                <p className="text-xs text-white/50 font-medium">{greeting}</p>
                <p className="text-base font-bold text-white leading-tight">{user?.fullname.split(' ')[0]}</p>
              </div>
            </div>
            <Link to="/worker/profile/notifications">
              <button className="relative w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Bell size={16} className="text-white" />
              </button>
            </Link>
          </div>

          {/* Earnings card */}
          <div className="bg-primary rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-white/50 font-semibold uppercase tracking-wide">Earnings This Month</p>
                  <p className="text-3xl font-bold text-white mt-1">£{monthly.earnings}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Zap size={18} className="text-blue-300" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Hours', value: `${monthly.hoursWorked?.toFixed(1)}h` },
                  { label: 'Jobs', value: monthly.completedJobs },
                  { label: '£/hr avg', value: monthly.averagePayRate || 0 },
                ].map(s => (
                  <div key={s.label} className="bg-white/10 rounded-xl p-2.5 text-center">
                    <p className="text-base font-bold text-white">{s.value}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active job banner */}
      {activeJob && (
        <div
          onClick={() => navigate('/worker/clock')}
          className="bg-blue-600 rounded-2xl p-4 text-white cursor-pointer hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Timer size={18} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full pulse-dot" />
                  <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">You're on the clock</p>
                </div>
                <p className="text-sm font-bold text-white leading-tight truncate max-w-[180px]">{activeJob.title.split('—')[0].trim()}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/60 shrink-0" />
          </div>
        </div>
      )}

      {/* Today's shift */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Today's Shift</h2>
          <Link to={"/worker/jobs"}>
            <Button variant={"link"} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-800 transition-colors">
              View all <ArrowUpRight size={12} />
            </Button>
          </Link>
        </div>

        {activeJob ? (
          <JobCard job={activeJob} />
        ) : (
          <EmptyState
            icon={<Briefcase size={20} />}
            title="No Shifts Today"
            description="Check the Jobs tab for upcoming assignments"
          />
        )}
      </div>

      {/* This week */}
      <div>
        <h2 className="text-sm font-bold text-foreground mb-3">This Week</h2>
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm dark:shadow-none">
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground">{d.day}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative
                  ${d.isToday ? 'bg-primary text-primary-foreground' : d.hasShift ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' : 'text-muted-foreground'}`}>
                  {d.date.date()}
                  {d.hasShift && !d.isToday && (
                    <span className="absolute -bottom-0.5 w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground font-medium">{d.hasShift ? `${d.hours.toFixed(d.hours % 1 ? 1 : 0)}h` : '—'}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total this week</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{hoursThisWeek.toFixed(hoursThisWeek % 1 ? 1 : 0)}h <span className="text-sm font-normal text-muted-foreground">/ {WEEKLY_TARGET_HOURS}h target</span></p>
            </div>
            <div className="flex-1 max-w-[120px] ml-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, (hoursThisWeek / WEEKLY_TARGET_HOURS) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-right">{Math.round((hoursThisWeek / WEEKLY_TARGET_HOURS) * 100)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming shifts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Upcoming Shifts</h2>
          <Link to={"/worker/jobs"}>
            <Button variant={"link"} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-800 transition-colors">
              View all <ArrowUpRight size={12} />
            </Button>
          </Link>
        </div>
        {upcomingShifts.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-6 text-center shadow-sm dark:shadow-none">
            <p className="text-sm text-muted-foreground">No upcoming shifts scheduled</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingShifts.map(job => (
              <button
                key={job._id}
                type="button"
                onClick={() => navigate(`/worker/jobs/${job._id}`)}
                className="w-full flex flex-col gap-2 bg-card rounded-2xl border border-border p-3.5 text-left hover:border-slate-300 hover:shadow-sm transition-all shadow-sm dark:shadow-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground truncate">{job.title}</p>
                  <ChevronRight size={15} className="text-muted-foreground shrink-0" />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar size={12} /> {dayjs(job.date).format('D MMM')}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} /> {job.startTime}
                  </span>
                  {job.location && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                      <MapPin size={12} /> {job.location}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
