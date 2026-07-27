import { Briefcase, Users, Clock, CheckCircle2, AlertCircle, ArrowRight, MapPin, Timer } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { StatCard, Card, Avatar, StatusBadge, Button, Badge } from '../components/ui'
import { jobs, workers, activities, weeklyHours, monthlyStats } from '../data/mockData'
import { useNavigate, useOutletContext } from 'react-router'

const todayJobs = jobs.filter(j => j.date === '2025-07-25')
const workingNow = workers.filter(w => w.status === 'working')

function ActivityDot({ type }: { type: string }) {
  const map: Record<string, string> = {
    started: 'bg-blue-500',
    completed: 'bg-emerald-500',
    accepted: 'bg-violet-500',
    rejected: 'bg-red-400',
  }
  return <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${map[type] ?? 'bg-slate-400'}`} />
}

function ActivityLabel({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string }> = {
    started: { label: 'started', color: 'text-blue-600' },
    completed: { label: 'completed', color: 'text-emerald-600' },
    accepted: { label: 'accepted', color: 'text-violet-600' },
    rejected: { label: 'rejected', color: 'text-red-500' },
  }
  const a = map[type] ?? { label: type, color: 'text-slate-500' }
  return <span className={`font-medium ${a.color}`}>{a.label}</span>
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

export function Dashboard() {
  const navigate = useNavigate()
  const onNavigate = (path: string) => navigate(path)
  const { user } = useOutletContext() as {
    user: any
  } || {}
  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Friday, 25 July 2025</p>
          <h1 className="text-2xl font-medium text-slate-900 tracking-tight">Good morning, <span className='font-black uppercase'>{user?.fullname}</span></h1>
          <p className="text-slate-500 text-sm mt-0.5">Here's what's happening with your workforce today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate('reports')}>View Reports</Button>
          {/* <Button size="sm" onClick={() => onNavigate('create-job')}>+ New Job</Button> */}
        </div>
      </div>

      {/* Alert banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
        <AlertCircle size={16} className="text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800 flex-1">
          <span className="font-semibold">1 job needs attention</span> — City of London Corporate Concierge has no workers assigned yet.
        </p>
        <button onClick={() => onNavigate('jobs')} className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors shrink-0">View →</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's Jobs" value={todayJobs.length} sub={`${todayJobs.filter(j => j.status === 'in-progress').length} in progress`} icon={<Briefcase size={16} />} trend="↑ 2 from yesterday" trendUp />
        <StatCard label="Workers Active" value={workingNow.length} sub="of 6 total" icon={<Users size={16} />} />
        <StatCard label="Hours This Week" value="440" sub="of 480 target" icon={<Clock size={16} />} trend="92% utilisation" trendUp />
        <StatCard label="Jobs Completed" value="156" sub="this month" icon={<CheckCircle2 size={16} />} trend="+12% vs last month" trendUp={true} />
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
              <Badge variant="success">440 / 480 hrs</Badge>
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
            {workingNow.map((w, i) => {
              const job = jobs.find(j => j.workers.includes(w.id) && j.status === 'in-progress')
              return (
                <div key={w.id} className="flex items-start gap-3">
                  <Avatar initials={w.avatar} size="sm" index={i} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{w.name}</p>
                    <p className="text-xs text-slate-400 truncate">{job?.name ?? 'On site'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Timer size={10} className="text-slate-400" />
                      <p className="text-[10px] text-slate-400">Since {job?.startTime ?? '—'}</p>
                    </div>
                  </div>
                  <StatusBadge status="working" />
                </div>
              )
            })}
            {workingNow.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No workers active right now</p>}
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
              {todayJobs.map(job => {
                const assignedWorkers = workers.filter(w => job.workers.includes(w.id))
                return (
                  <div key={job.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group cursor-pointer" onClick={() => onNavigate('jobs')}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{job.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin size={10} />{job.location.split(',')[0]}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={10} />{job.startTime} – {job.endTime}
                        </span>
                      </div>
                    </div>
                    <div className="flex -space-x-2">
                      {assignedWorkers.slice(0, 3).map((w, i) => (
                        <div key={w.id} className="ring-2 ring-white rounded-full">
                          <Avatar initials={w.avatar} size="sm" index={i} />
                        </div>
                      ))}
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Activity feed */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="flex flex-col gap-3">
            {activities.map(a => (
              <div key={a.id} className="flex items-start gap-2.5">
                <ActivityDot type={a.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 leading-snug">
                    <span className="font-semibold">{a.worker}</span> <ActivityLabel type={a.type} /> <span className="text-slate-500">{a.job}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.ago}</p>
                </div>
              </div>
            ))}
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
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={monthlyStats}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="hours" stroke="#1E3A5F" strokeWidth={2} fill="url(#grad)" dot={{ fill: '#1E3A5F', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  )
}
