import { useState } from 'react'
import {
    ChevronLeft, Mail, Phone, MapPin, Calendar, Star, Clock,
    Briefcase, TrendingUp, CheckCircle2, AlertCircle,
    Edit, UserMinus, MessageSquare, Plus, Download, MoreHorizontal
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid
} from 'recharts'
import { Avatar, StatusBadge, PriorityBadge, Badge, Card } from '../components/ui'
import { workers, jobs } from '../data/mockData'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router'

// ── Extended mock data per worker ────────────────────────────────────────────
const weeklyTrend = [
    { week: 'W1', hours: 36 },
    { week: 'W2', hours: 40 },
    { week: 'W3', hours: 44 },
    { week: 'W4', hours: 38 },
    { week: 'W5', hours: 40 },
    { week: 'W6', hours: 42 },
    { week: 'W7', hours: 38 },
]

const activityLog = [
    { type: 'completed', text: 'Completed Excel Centre — Event Staffing', time: '24 Jul, 20:05', hours: 12 },
    { type: 'started', text: 'Started Canary Wharf Security — Night Shift', time: '25 Jul, 22:03', hours: null },
    { type: 'accepted', text: 'Accepted Westfield Stratford — Weekend Cover', time: '25 Jul, 18:30', hours: null },
    { type: 'completed', text: 'Completed Canary Wharf — Day Patrol', time: '23 Jul, 14:10', hours: 8 },
    { type: 'completed', text: 'Completed Heathrow Terminal 5 — Cleaning', time: '22 Jul, 12:05', hours: 8 },
]

const dotColor: Record<string, string> = {
    completed: 'bg-emerald-500',
    started: 'bg-blue-500',
    accepted: 'bg-violet-500',
    rejected: 'bg-red-400',
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 shadow-lg">
            <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
            <p className="text-sm font-bold text-slate-900">{payload[0].value}</p>
        </div>
    )
}
    
export function WorkerProfile() {
    const navigate = useNavigate()
    const onNavigate = (path: string) => navigate(path)
    const worker = workers[0]
    const workerIndex = 0
    const workerJobs = jobs.filter(j => j.workers.includes(worker.id))
    const [activeJobTab, setActiveJobTab] = useState<'all' | 'active' | 'completed'>('all')

    const filteredJobs = workerJobs.filter(j => {
        if (activeJobTab === 'active') return j.status === 'in-progress' || j.status === 'assigned'
        if (activeJobTab === 'completed') return j.status === 'completed'
        return true
    })

    const completionRate = Math.round((workerJobs.filter(j => j.status === 'completed').length / Math.max(workerJobs.length, 1)) * 100)
    const avgHoursPerJob = Math.round(workerJobs.reduce((s, j) => s + j.hours, 0) / Math.max(workerJobs.length, 1))
    const totalHoursAssigned = workerJobs.reduce((s, j) => s + j.hours, 0)

    return (
        <div className="p-6 animate-fade-in">

            {/* Breadcrumb */}
            <button
                onClick={() => onNavigate('workers')}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-5 group"
            >
                <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to Workers
            </button>

            {/* ── Hero banner ──────────────────────────────────────────────────── */}
            <div className=" rounded-2xl border border-[#E2E8F0] overflow-hidden  !bg-white shadow-sm mb-5">

                {/* Cover */}
                <div className="h-32 bg-gradient-to-br from-[#1E3A5F] via-[#2D5A8E] to-[#1a4b7a] relative overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-[0.07]"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)', backgroundSize: '22px 22px' }}
                    />
                    {/* Decorative rings */}
                    <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-white/10" />
                    <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full border border-white/10" />
                </div>

                {/* Profile row */}
                <div className="px-6 pb-6 relative z-10">
                    <div className="flex items-end justify-between -mt-7 mb-5">
                        <div className="ring-4 ring-white rounded-full shadow-lg">
                            <Avatar initials={worker.avatar} size="xl" index={workerIndex} />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <Button variant="outline" size="sm">
                                <MessageSquare size={13} /> Message
                            </Button>
                            <Button variant="outline" size="sm">
                                <Edit size={13} /> Edit
                            </Button>
                            <Button size="sm" onClick={() => onNavigate('create-job')}>
                                <Plus size={13} /> Assign Job
                            </Button>
                            <button className="w-9 h-9 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
                                <MoreHorizontal size={15} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-start gap-8">
                        {/* Identity */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-1">
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{worker.name}</h1>
                                <StatusBadge status={worker.status} />
                            </div>
                            <p className="text-sm text-slate-500 mb-3">{worker.role}</p>
                            <div className="flex flex-wrap gap-4">
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Mail size={12} className="text-slate-400" />{worker.email}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Phone size={12} className="text-slate-400" />{worker.phone}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <MapPin size={12} className="text-slate-400" />{worker.location}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Calendar size={12} className="text-slate-400" />Joined {new Date(worker.joined).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>

                        {/* Rating */}
                        <div className="shrink-0 text-center">
                            <div className="flex items-center gap-1 justify-center mb-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star
                                        key={s}
                                        size={16}
                                        className={s <= Math.floor(worker.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
                                    />
                                ))}
                            </div>
                            <p className="text-2xl font-bold text-amber-500">{worker.rating}</p>
                            <p className="text-xs text-slate-400">rating</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Top stats ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                {[
                    {
                        label: 'Hours This Week',
                        value: `${worker.hoursThisWeek}h`,
                        sub: 'of 40h target',
                        icon: Clock,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50',
                        progress: (worker.hoursThisWeek / 40) * 100,
                        progressColor: 'bg-blue-500',
                    },
                    {
                        label: 'Hours This Month',
                        value: `${worker.hoursThisMonth}h`,
                        sub: `${totalHoursAssigned}h assigned total`,
                        icon: TrendingUp,
                        color: 'text-violet-600',
                        bg: 'bg-violet-50',
                        progress: null,
                        progressColor: '',
                    },
                    {
                        label: 'Jobs Completed',
                        value: worker.jobsCompleted,
                        sub: `${completionRate}% completion rate`,
                        icon: CheckCircle2,
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50',
                        progress: completionRate,
                        progressColor: 'bg-emerald-500',
                    },
                    {
                        label: 'Avg Hours / Job',
                        value: `${avgHoursPerJob}h`,
                        sub: `across ${workerJobs.length} jobs`,
                        icon: Briefcase,
                        color: 'text-amber-600',
                        bg: 'bg-amber-50',
                        progress: null,
                        progressColor: '',
                    },
                ].map(s => (
                    <Card key={s.label} className="p-5">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs font-semibold text-slate-500">{s.label}</p>
                            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                                <s.icon size={14} className={s.color} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 tracking-tight mb-1">{s.value}</p>
                        <p className="text-xs text-slate-400">{s.sub}</p>
                        {s.progress !== null && (
                            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${s.progressColor} rounded-full transition-all`}
                                    style={{ width: `${Math.min(s.progress, 100)}%` }}
                                />
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* ── Main content grid ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left — 2 cols */}
                <div className="lg:col-span-2 flex flex-col gap-5">

                    {/* Hours trend chart */}
                    <Card className="p-5">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Hours Trend</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Last 7 weeks</p>
                            </div>
                            <Badge variant="info">{worker.hoursThisWeek}h this week</Badge>
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={weeklyTrend} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                                <defs>
                                    <linearGradient id={`grad-${worker.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.12} />
                                        <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={30} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="hours"
                                    stroke="#1E3A5F"
                                    strokeWidth={2}
                                    fill={`url(#grad-${worker.id})`}
                                    dot={{ fill: '#1E3A5F', r: 3.5, strokeWidth: 0 }}
                                    activeDot={{ r: 5, fill: '#1E3A5F' }}
                                />
                                {/* Target line at 40 */}
                                <CartesianGrid
                                    strokeDasharray="6 3"
                                    stroke="#E2E8F0"
                                    vertical={false}
                                    horizontalPoints={[]}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#F8FAFC] text-xs text-slate-400">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-[#1E3A5F] inline-block" />Actual hours</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-slate-200 inline-block border-t border-dashed border-slate-300" />40h target</span>
                        </div>
                    </Card>

                    {/* Job history table */}
                    <Card>
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E2E8F0]">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Job History</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{workerJobs.length} total assignments</p>
                            </div>
                            {/* Mini tab */}
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                {(['all', 'active', 'completed'] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setActiveJobTab(t)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${activeJobTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredJobs.length === 0 ? (
                            <div className="py-10 text-center">
                                <p className="text-sm text-slate-400">No jobs in this category</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#F8FAFC]">
                                {filteredJobs.map(job => (
                                    <div
                                        key={job.id}
                                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer group"
                                        onClick={() => onNavigate('job-detail')}
                                    >
                                        {/* Status indicator */}
                                        <div className={`w-1.5 h-8 rounded-full shrink-0 ${job.status === 'completed' ? 'bg-emerald-400' :
                                            job.status === 'in-progress' ? 'bg-blue-500' :
                                                job.status === 'assigned' ? 'bg-violet-400' : 'bg-slate-200'
                                            }`} />

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-700 transition-colors">{job.name}</p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <Calendar size={10} />{new Date(job.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <Clock size={10} />{job.startTime}–{job.endTime}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <MapPin size={10} />{job.location.split(',')[0]}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs font-semibold text-slate-500 mono">{job.hours}h</span>
                                            <StatusBadge status={job.status} />
                                            <PriorityBadge priority={job.priority} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right — 1 col */}
                <div className="flex flex-col gap-5">

                    {/* Performance metrics */}
                    <Card className="p-5">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Performance</h3>
                        <div className="flex flex-col gap-4">
                            {[
                                { label: 'Completion Rate', value: completionRate, suffix: '%', color: 'bg-emerald-500', good: completionRate >= 80 },
                                { label: 'On-Time Arrival', value: 94, suffix: '%', color: 'bg-blue-500', good: true },
                                { label: 'Hours Utilisation', value: Math.round((worker.hoursThisWeek / 40) * 100), suffix: '%', color: 'bg-violet-500', good: true },
                                { label: 'Acceptance Rate', value: 88, suffix: '%', color: 'bg-amber-500', good: true },
                            ].map(m => (
                                <div key={m.label}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-xs font-medium text-slate-600">{m.label}</p>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-slate-900">{m.value}{m.suffix}</span>
                                            {m.good
                                                ? <CheckCircle2 size={12} className="text-emerald-500" />
                                                : <AlertCircle size={12} className="text-amber-500" />
                                            }
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${m.color} rounded-full transition-all`} style={{ width: `${m.value}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Activity feed */}
                    <Card className="p-5">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h3>
                        <div className="flex flex-col gap-0">
                            {activityLog.map((a, i) => (
                                <div key={i} className="flex items-start gap-3 pb-4 relative">
                                    {/* Line connector */}
                                    {i < activityLog.length - 1 && (
                                        <div className="absolute left-[7px] top-5 bottom-0 w-px bg-slate-100" />
                                    )}
                                    <span className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 border-2 border-white ring-1 ring-slate-200 ${dotColor[a.type] ?? 'bg-slate-400'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-700 leading-relaxed">{a.text}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] text-slate-400">{a.time}</p>
                                            {a.hours && (
                                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">{a.hours}h</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Actions */}
                    <Card className="p-5">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
                        <div className="flex flex-col gap-2">
                            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 border border-[#E2E8F0] transition-colors text-sm font-medium text-slate-700">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <MessageSquare size={13} className="text-blue-600" />
                                </div>
                                Send Message
                            </button>
                            <button
                                onClick={() => onNavigate('create-job')}
                                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 border border-[#E2E8F0] transition-colors text-sm font-medium text-slate-700"
                            >
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <Briefcase size={13} className="text-emerald-600" />
                                </div>
                                Assign to Job
                            </button>
                            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 border border-[#E2E8F0] transition-colors text-sm font-medium text-slate-700">
                                <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                                    <Download size={13} className="text-violet-600" />
                                </div>
                                Download Timesheet
                            </button>
                            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-red-50 border border-red-100 transition-colors text-sm font-medium text-red-500 mt-1">
                                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                                    <UserMinus size={13} className="text-red-500" />
                                </div>
                                Suspend Worker
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
