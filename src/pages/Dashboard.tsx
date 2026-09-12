import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowRight, Briefcase, CheckCircle2, Clock, Flag, MapPin, Timer, Users } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router'
import { backLinkState } from '@/hooks/useBackLink'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Avatar, Badge, Card, StatCard, StatusBadge } from '../components/ui'
import { getAnalytics, getDashboardStats, type DashboardStatsActivity } from '@/utils/api-request-functions'
import { getInitials } from '@/utils/getInitials'
import { recordFormatUI } from './JobDetailPage'
import type { ActivityType } from '@/utils/types'

const dashboardStatsQuery = {
  queryKey: ['dashboard-stats'],
  queryFn: getDashboardStats,
}

// Same query key AnalyticsPage uses for 'year' — sharing the cache means
// visiting either page warms the other.
const monthlyOverviewQuery = {
  queryKey: ['analytics', 'year'],
  queryFn: () => getAnalytics('year'),
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.max(0, Math.round(diffMs / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

function ActivityDot({ type }: { type: string }) {
  const className = recordFormatUI[type as ActivityType]?.className ?? 'bg-slate-400'
  return <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${className}`} />
}

function ActivityRow({ entry }: { entry: DashboardStatsActivity }) {
  const ui = recordFormatUI[entry.type as ActivityType] ?? recordFormatUI.job_updated
  const subject = entry.actor?.fullname ?? 'System'
  return (
    <div className="flex items-start gap-2.5">
      <ActivityDot type={entry.type} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-700 leading-snug">
          <span className="font-semibold">{subject}</span>{' '}
          <span className="text-slate-500">{ui.label}</span>
          {entry.job && <span className="text-slate-500"> — {entry.job.title}</span>}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(entry.createdAt)}</p>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{payload[0].value} hrs</p>
    </div>
  )
}

function greeting(): string {
  const hour = dayjs().hour()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const navigate = useNavigate()
  const onNavigate = (path: string, state?: object) => navigate(path, { state: state ?? backLinkState('Dashboard') })
  const { user } = useOutletContext() as {
    user: any
  } || {}

  const { data: stats, isPending: statsPending } = useQuery(dashboardStatsQuery)
  const { data: monthly, isPending: monthlyPending } = useQuery(monthlyOverviewQuery)

  if (statsPending || !stats) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="h-40 flex items-center justify-center text-sm text-slate-400">Loading dashboard…</div>
      </div>
    )
  }

  const dailyTarget = stats.stats.hoursThisWeek.target > 0 ? Math.round(stats.stats.hoursThisWeek.target / 7) : 0
  const weeklyHours = stats.hoursByDay.map(d => ({ ...d, target: dailyTarget }))
  const utilisation = stats.stats.hoursThisWeek.target > 0
    ? Math.round((stats.stats.hoursThisWeek.total / stats.stats.hoursThisWeek.target) * 100)
    : null

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{dayjs().format('dddd, D MMMM YYYY')}</p>
          <h1 className="text-2xl font-medium text-slate-900 tracking-tight">{greeting()}, <span className='font-black uppercase'>{user?.fullname}</span></h1>
          <p className="text-slate-500 text-sm mt-0.5">Here's what's happening with your workforce today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate('reports')}>View Reports</Button>
        </div>
      </div>

      {/* Alert banner */}
      {stats.attentionNeeded && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            <span className="font-semibold">1 job needs attention</span> — {stats.attentionNeeded.title} has no workers assigned yet.
          </p>
          <button onClick={() => onNavigate(`/jobs/${stats.attentionNeeded!.jobId}`)} className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors shrink-0">View →</button>
        </div>
      )}

      {/* Overtime review banner — company-wide, independent of whether the
          jobs those shifts belong to have already auto-completed (see
          maybeCompleteJob: overtimeStatus never gates job.status). */}
      {stats.pendingOvertime.count > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-6">
          <div className="flex items-center gap-3">
            <Flag size={16} className="text-rose-600 shrink-0" />
            <p className="text-sm text-rose-800 flex-1">
              <span className="font-semibold">
                {stats.pendingOvertime.count} worker{stats.pendingOvertime.count > 1 ? 's' : ''} need overtime review
              </span> — clocked time ran past the scheduled shift and hasn't been approved, adjusted, or rejected yet.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-2.5 ml-7">
            {stats.pendingOvertime.items.map(item => (
              <button
                key={item.assignmentId}
                onClick={() => item.jobId && onNavigate(`/jobs/${item.jobId}`)}
                className="text-xs font-medium text-rose-700 bg-white border border-rose-200 rounded-full px-2.5 py-1 hover:bg-rose-100 transition-colors"
              >
                {item.workerName ?? 'Worker'} · {item.jobTitle ?? 'Job'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Today's Jobs"
          value={stats.stats.todaysJobs.count}
          sub={`${stats.stats.todaysJobs.inProgress} in progress`}
          icon={<Briefcase size={16} />}
          trend={stats.stats.todaysJobs.deltaFromYesterday !== 0 ? `${Math.abs(stats.stats.todaysJobs.deltaFromYesterday)} from yesterday` : undefined}
          trendUp={stats.stats.todaysJobs.deltaFromYesterday >= 0}
        />
        <StatCard
          label="Workers Active"
          value={stats.stats.workersActive.active}
          sub={`of ${stats.stats.workersActive.total} total`}
          icon={<Users size={16} />}
        />
        <StatCard
          label="Hours This Week"
          value={stats.stats.hoursThisWeek.total}
          sub={`of ${stats.stats.hoursThisWeek.target} target`}
          icon={<Clock size={16} />}
          trend={utilisation !== null ? `${utilisation}% utilisation` : undefined}
          trendUp={(utilisation ?? 0) >= 80}
        />
        <StatCard
          label="Jobs Completed"
          value={stats.stats.jobsCompleted.thisMonth}
          sub="this month"
          icon={<CheckCircle2 size={16} />}
          trend={stats.stats.jobsCompleted.deltaPercent !== null ? `${Math.abs(stats.stats.jobsCompleted.deltaPercent)}% vs last month` : undefined}
          trendUp={(stats.stats.jobsCompleted.deltaPercent ?? 0) >= 0}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly hours chart */}
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Hours This Week</h3>
                <p className="text-xs text-slate-400 mt-0.5">Team total billable hours per day</p>
              </div>
              <Badge variant="success">{stats.stats.hoursThisWeek.total} / {stats.stats.hoursThisWeek.target} hrs</Badge>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyHours} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="target" fill="#F1F5F9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hours" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Live workers */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Working Now</h3>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full pulse-dot" />
              Live
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {stats.workingNow.map((w, i) => (
              <div key={w.assignmentId} className="flex items-start gap-3">
                <Avatar initials={getInitials(w.worker?.fullname ?? '?')} size="sm" index={i} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{w.worker?.fullname ?? 'Unknown worker'}</p>
                  <p className="text-xs text-slate-400 truncate">{w.job?.title ?? 'On site'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Timer size={10} className="text-slate-400" />
                    <p className="text-[10px] text-slate-400">Since {dayjs(w.checkedInAt).format('HH:mm')}</p>
                  </div>
                </div>
                <StatusBadge status="working" />
              </div>
            ))}
            {stats.workingNow.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No workers active right now</p>}
          </div>
        </Card>

        {/* Today's jobs */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-semibold text-slate-900">Today's Jobs</h3>
              <button onClick={() => onNavigate('jobs')} className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-800 transition-colors">
                View all <ArrowRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {stats.todaysJobs.map(job => (
                <div key={job._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group cursor-pointer" onClick={() => onNavigate(`/jobs/${job._id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{job.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin size={10} />{job.location?.split(',')[0]}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={10} />{job.startTime} – {job.endTime}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              ))}
              {stats.todaysJobs.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">No jobs scheduled today</p>}
            </div>
          </Card>
        </div>

        {/* Activity feed */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="flex flex-col gap-3">
            {stats.recentActivity.map(a => <ActivityRow key={a._id} entry={a} />)}
            {stats.recentActivity.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No recent activity</p>}
          </div>
        </Card>

        {/* Monthly trend */}
        <div className="lg:col-span-3">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Monthly Overview</h3>
                <p className="text-xs text-slate-400 mt-0.5">Total hours worked across all jobs</p>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-[#1E3A5F] inline-block" />Hours</span>
              </div>
            </div>
            {monthlyPending || !monthly ? (
              <div className="h-[140px] flex items-center justify-center text-sm text-slate-400">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={monthly.hoursTrend}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="hours" stroke="#1E3A5F" strokeWidth={2} fill="url(#grad)" dot={{ fill: '#1E3A5F', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
