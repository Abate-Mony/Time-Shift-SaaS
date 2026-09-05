import { useState } from 'react'
import {
    ChevronLeft, Mail, Phone, Calendar, Clock,
    Briefcase, TrendingUp, CheckCircle2, AlertCircle,
    Edit, UserMinus, ShieldCheck, MessageSquare, Plus, Download, MoreHorizontal
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid
} from 'recharts'
import { Avatar, StatusBadge, PriorityBadge, Badge, Card } from '../components/ui'
import { Button } from '@/components/ui/button'
import { useNavigate, useParams, type LoaderFunctionArgs } from 'react-router'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import customFetch from '@/utils/customFetch'
import { RestrictUserDialog } from '@/components/restriction/RestrictUserDialog'
import {
    createRestriction,
    downloadWorkerTimesheet,
    getActiveRestrictions,
    getWorkerTimesheet,
    liftRestriction,
    type CreateRestrictionPayload,
    type TimesheetPeriodType,
} from '@/utils/api-request-functions'
import dayjs from 'dayjs'

// ─── API shape ──────────────────────────────────────────────────────────────

interface WorkerStatsResponse {
    worker: {
        _id: string
        fullname: string
        email: string
        phone: string | null
        role: string
        isActive: boolean
        createdAt: string
    }
    stats: {
        hoursThisWeek: number
        hoursThisMonth: number
        totalHours: number
        jobsCompleted: number
        totalAssignments: number
        avgHoursPerJob: number
        completionRate: number | null
        acceptanceRate: number | null
        onTimeArrivalRate: number | null
        hoursUtilisationRate: number | null
    }
    hoursTrend: { weekStart: string; hours: number }[]
    jobHistory: {
        _id: string
        jobId: string
        title: string
        location: string
        priority: string
        date: string
        startTime: string
        endTime: string
        status: string
        hours: number
    }[]
    recentActivity: {
        _id: string
        type: string
        job: { _id: string; title: string } | null
        createdAt: string
    }[]
}

const workerStatsQuery = (id: string) => ({
    queryKey: ['worker-stats', id],
    queryFn: async () => {
        const { data } = await customFetch.get<WorkerStatsResponse>(`/users/${id}/stats`)
        return data
    },
})

const restrictionsQuery = () => ({
    queryKey: ['restrictions', 'active'],
    queryFn: getActiveRestrictions,
})

export const loader = (queryClient: QueryClient) => async ({ params }: LoaderFunctionArgs) => {
    const id = params.id as string
    await queryClient.ensureQueryData(workerStatsQuery(id))
    return null
}

// ─── Activity feed labels ─────────────────────────────────────────────────

const ACTIVITY_LABEL: Partial<Record<string, string>> = {
    assignment_claimed: 'claimed an open shift',
    assignment_claim_approved: 'had their claim approved',
    assignment_claim_declined: 'had their claim declined',
    assignment_accepted: 'accepted a shift',
    assignment_declined: 'declined a shift',
    assignment_in_progress: 'started a shift',
    assignment_checked_in: 'clocked in',
    assignment_break_started: 'started a break',
    assignment_break_ended: 'ended a break',
    assignment_checked_out: 'clocked out',
    assignment_completed: 'completed a shift',
    assignment_cancelled: 'had a shift cancelled',
    assignment_auto_completed: 'was auto-completed by the system',
    assignment_overtime_flagged: 'had overtime flagged for review',
    assignment_overtime_reviewed: 'had overtime reviewed',
}

const ACTIVITY_DOT: Partial<Record<string, string>> = {
    assignment_completed: 'bg-emerald-500',
    assignment_auto_completed: 'bg-emerald-400',
    assignment_claim_approved: 'bg-emerald-500',
    assignment_in_progress: 'bg-blue-500',
    assignment_checked_in: 'bg-blue-500',
    assignment_checked_out: 'bg-blue-400',
    assignment_accepted: 'bg-violet-500',
    assignment_claimed: 'bg-violet-400',
    assignment_declined: 'bg-red-400',
    assignment_claim_declined: 'bg-red-400',
    assignment_cancelled: 'bg-slate-400',
    assignment_overtime_flagged: 'bg-amber-400',
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

const pct = (n: number | null) => (n === null ? '—' : `${n}%`)

export function WorkerProfile() {
    const navigate = useNavigate()
    const onNavigate = (path: string) => navigate(path)
    const { id } = useParams<{ id: string }>()
    const workerId = id as string

    const { data } = useQuery(workerStatsQuery(workerId))
    const restrictions = useQuery(restrictionsQuery()).data ?? []
    const restriction = restrictions.find(r => (r as unknown as { user: { _id: string } }).user._id === workerId)

    const [activeJobTab, setActiveJobTab] = useState<'all' | 'active' | 'completed'>('all')
    const [showSuspend, setShowSuspend] = useState(false)
    const [suspending, setSuspending] = useState(false)
    const [lifting, setLifting] = useState(false)

    const [timesheetPeriod, setTimesheetPeriod] = useState<TimesheetPeriodType>('weekly')
    const { data: timesheetData, isPending: timesheetLoading } = useQuery({
        queryKey: ['worker-timesheet', workerId, timesheetPeriod],
        queryFn: () => getWorkerTimesheet({ workerId, period: timesheetPeriod }),
    })

    if (!data) return null
    const { worker, stats, hoursTrend, jobHistory, recentActivity } = data

    const filteredJobs = jobHistory.filter(j => {
        if (activeJobTab === 'active') return j.status === 'accepted' || j.status === 'in-progress'
        if (activeJobTab === 'completed') return j.status === 'completed'
        return true
    })

    const trendData = hoursTrend.map((w, i) => ({ week: `W${i + 1}`, hours: w.hours }))
    const workerIndex = workerId.charCodeAt(workerId.length - 1) || 0
    const initials = worker.fullname.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

    const handleApplyRestriction = async (payload: Omit<CreateRestrictionPayload, 'user'>) => {
        setSuspending(true)
        try {
            await createRestriction({ user: workerId, ...payload })
            setShowSuspend(false)
        } catch {
            // createRestriction already toasted why — leave the dialog open.
        } finally {
            setSuspending(false)
        }
    }

    const handleLift = async () => {
        if (!restriction?._id) return
        setLifting(true)
        await liftRestriction(restriction._id)
        setLifting(false)
    }

    const [downloadingTimesheet, setDownloadingTimesheet] = useState(false)
    const handleDownloadTimesheet = async () => {
        if (!timesheetData) return
        setDownloadingTimesheet(true)
        // Reuses the exact range the summary above is already showing —
        // whatever period is selected, the PDF matches what's on screen.
        await downloadWorkerTimesheet({
            workerId,
            start: dayjs(timesheetData.start).format('YYYY-MM-DD'),
            end: dayjs(timesheetData.end).subtract(1, 'day').format('YYYY-MM-DD'),
        })
        setDownloadingTimesheet(false)
    }

    return (
        <div className="p-6 animate-fade-in">

            {/* Breadcrumb */}
            <button
                onClick={() => onNavigate('/workers')}
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
                    <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-white/10" />
                    <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full border border-white/10" />
                </div>

                {/* Profile row */}
                <div className="px-6 pb-6 relative z-10">
                    <div className="flex items-end justify-between -mt-7 mb-5">
                        <div className="ring-4 ring-white rounded-full shadow-lg">
                            <Avatar initials={initials} size="xl" index={workerIndex} />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                            <Button variant="outline" size="sm">
                                <MessageSquare size={13} /> Message
                            </Button>
                            <Button variant="outline" size="sm">
                                <Edit size={13} /> Edit
                            </Button>
                            <Button size="sm" onClick={() => onNavigate('/create-job')}>
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
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{worker.fullname}</h1>
                                <StatusBadge status={restriction ? 'suspended' : worker.isActive ? 'active' : 'suspended'} />
                            </div>
                            <p className="text-sm text-slate-500 mb-3 capitalize">{worker.role}</p>
                            <div className="flex flex-wrap gap-4">
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Mail size={12} className="text-slate-400" />{worker.email}
                                </span>
                                {worker.phone && (
                                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Phone size={12} className="text-slate-400" />{worker.phone}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Calendar size={12} className="text-slate-400" />Joined {new Date(worker.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Top stats ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                {[
                    {
                        label: 'Hours This Week',
                        value: `${stats.hoursThisWeek}h`,
                        sub: 'of 40h target',
                        icon: Clock,
                        color: 'text-blue-600',
                        bg: 'bg-blue-50',
                        progress: (stats.hoursThisWeek / 40) * 100,
                        progressColor: 'bg-blue-500',
                    },
                    {
                        label: 'Hours This Month',
                        value: `${stats.hoursThisMonth}h`,
                        sub: `${stats.totalHours}h worked all-time`,
                        icon: TrendingUp,
                        color: 'text-violet-600',
                        bg: 'bg-violet-50',
                        progress: null,
                        progressColor: '',
                    },
                    {
                        label: 'Jobs Completed',
                        value: stats.jobsCompleted,
                        sub: `${pct(stats.completionRate)} completion rate`,
                        icon: CheckCircle2,
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50',
                        progress: stats.completionRate,
                        progressColor: 'bg-emerald-500',
                    },
                    {
                        label: 'Avg Hours / Job',
                        value: `${stats.avgHoursPerJob}h`,
                        sub: `across ${stats.jobsCompleted} jobs`,
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
                            <Badge variant="info">{stats.hoursThisWeek}h this week</Badge>
                        </div>
                        <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={trendData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                                <defs>
                                    <linearGradient id={`grad-${workerId}`} x1="0" y1="0" x2="0" y2="1">
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
                                    fill={`url(#grad-${workerId})`}
                                    dot={{ fill: '#1E3A5F', r: 3.5, strokeWidth: 0 }}
                                    activeDot={{ r: 5, fill: '#1E3A5F' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#F8FAFC] text-xs text-slate-400">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-[#1E3A5F] inline-block" />Actual hours</span>
                        </div>
                    </Card>

                    {/* Job history table */}
                    <Card>
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E2E8F0]">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Job History</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{jobHistory.length} recent assignments</p>
                            </div>
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
                                        key={job._id}
                                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer group"
                                        onClick={() => onNavigate(`/jobs/${job.jobId}`)}
                                    >
                                        <div className={`w-1.5 h-8 rounded-full shrink-0 ${job.status === 'completed' ? 'bg-emerald-400' :
                                            job.status === 'in-progress' ? 'bg-blue-500' :
                                                job.status === 'accepted' ? 'bg-violet-400' : 'bg-slate-200'
                                            }`} />

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-700 transition-colors">{job.title}</p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <Calendar size={10} />{new Date(job.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <Clock size={10} />{job.startTime}–{job.endTime}
                                                </span>
                                                {job.location && (
                                                    <span className="flex items-center gap-1 text-xs text-slate-400 truncate">
                                                        {job.location.split(',')[0]}
                                                    </span>
                                                )}
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

                    {/* Timesheet summary */}
                    <Card className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-slate-900">Timesheet</h3>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg mb-4">
                            {([
                                { id: 'weekly', label: 'Weekly' },
                                { id: 'biweekly', label: 'Bi-weekly' },
                                { id: 'monthly', label: 'Monthly' },
                            ] as { id: TimesheetPeriodType; label: string }[]).map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setTimesheetPeriod(p.id)}
                                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${timesheetPeriod === p.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center justify-between py-1.5">
                            <span className="text-xs text-slate-500">Hours worked</span>
                            <span className="text-sm font-bold text-slate-900">
                                {timesheetLoading ? '—' : `${timesheetData?.summary.totalHours ?? 0}h`}
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 mb-4">
                            <span className="text-xs text-slate-500">Shifts</span>
                            <span className="text-sm font-bold text-slate-900">
                                {timesheetLoading ? '—' : (timesheetData?.summary.shiftsCount ?? 0)}
                            </span>
                        </div>
                        <button
                            onClick={handleDownloadTimesheet}
                            disabled={timesheetLoading || downloadingTimesheet || !timesheetData?.summary.hasData}
                            className="flex items-center justify-center gap-2 w-full h-9 rounded-xl bg-[#1E3A5F] text-white text-xs font-bold hover:bg-[#162D4A] transition-colors disabled:opacity-40"
                        >
                            <Download size={13} />
                            {downloadingTimesheet ? 'Downloading…' : 'Download PDF'}
                        </button>
                        {!timesheetLoading && !timesheetData?.summary.hasData && (
                            <p className="text-[11px] text-center text-slate-400 mt-2">No shifts in this period</p>
                        )}
                    </Card>

                    {/* Performance metrics */}
                    <Card className="p-5">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Performance</h3>
                        <div className="flex flex-col gap-4">
                            {[
                                { label: 'Completion Rate', value: stats.completionRate, color: 'bg-emerald-500' },
                                { label: 'On-Time Arrival', value: stats.onTimeArrivalRate, color: 'bg-blue-500' },
                                { label: 'Hours Utilisation', value: stats.hoursUtilisationRate, color: 'bg-violet-500' },
                                { label: 'Acceptance Rate', value: stats.acceptanceRate, color: 'bg-amber-500' },
                            ].map(m => (
                                <div key={m.label}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-xs font-medium text-slate-600">{m.label}</p>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-slate-900">{pct(m.value)}</span>
                                            {m.value !== null && (m.value >= 80
                                                ? <CheckCircle2 size={12} className="text-emerald-500" />
                                                : <AlertCircle size={12} className="text-amber-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${m.color} rounded-full transition-all`} style={{ width: `${m.value ?? 0}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Activity feed */}
                    <Card className="p-5">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h3>
                        {recentActivity.length === 0 ? (
                            <p className="text-xs text-slate-400">No activity yet.</p>
                        ) : (
                            <div className="flex flex-col gap-0">
                                {recentActivity.map((a, i) => (
                                    <div key={a._id} className="flex items-start gap-3 pb-4 relative">
                                        {i < recentActivity.length - 1 && (
                                            <div className="absolute left-[7px] top-5 bottom-0 w-px bg-slate-100" />
                                        )}
                                        <span className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 border-2 border-white ring-1 ring-slate-200 ${ACTIVITY_DOT[a.type] ?? 'bg-slate-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-slate-700 leading-relaxed">
                                                {ACTIVITY_LABEL[a.type] ?? a.type}{a.job ? ` — ${a.job.title}` : ''}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {new Date(a.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                                onClick={() => onNavigate('/create-job')}
                                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 border border-[#E2E8F0] transition-colors text-sm font-medium text-slate-700"
                            >
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <Briefcase size={13} className="text-emerald-600" />
                                </div>
                                Assign to Job
                            </button>
                            {restriction ? (
                                <button
                                    onClick={handleLift}
                                    disabled={lifting}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-emerald-50 border border-emerald-100 transition-colors text-sm font-medium text-emerald-600 mt-1 disabled:opacity-50"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                                        <ShieldCheck size={13} className="text-emerald-600" />
                                    </div>
                                    {lifting ? 'Lifting…' : 'Lift Restriction'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowSuspend(true)}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-red-50 border border-red-100 transition-colors text-sm font-medium text-red-500 mt-1"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                                        <UserMinus size={13} className="text-red-500" />
                                    </div>
                                    Suspend Worker
                                </button>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {showSuspend && (
                <RestrictUserDialog
                    workerName={worker.fullname}
                    onApply={handleApplyRestriction}
                    onClose={() => { if (!suspending) setShowSuspend(false) }}
                />
            )}
        </div>
    )
}
