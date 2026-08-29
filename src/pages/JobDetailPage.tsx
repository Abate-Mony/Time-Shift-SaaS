import customFetch from '@/utils/customFetch'
import { formatCurrency } from '@/utils/format'
import { formatDate, formatDuration } from '@/utils/date'
import { queryClient } from '@/lib/queryClient'
import { deleteJob, duplicateJob, updateJobWorkers } from '@/utils/api-request-functions'
import { useMutation, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import {
    AlertCircle,
    Briefcase,
    Calendar,
    Camera,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Copy,
    Download,
    Edit,
    FileText,
    Flag,
    MapPin,
    MoreHorizontal,
    Navigation,
    Play,
    Plus,
    Receipt,
    Timer,
    Trash2,
    Users,
    X
} from 'lucide-react'
import {
    Pencil, Send, XCircle,
    UserMinus, XOctagon,
    LogIn, LogOut, Coffee,
    Ban, Bot, StickyNote, CircleCheck,
} from "lucide-react"
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import AssignWorkersModal from '@/components/AssignWorkersModal'
import { Avatar, Card, Divider, PriorityBadge, StatusBadge } from '../components/ui'
import { singleJob } from './EditJobPage'

import type { LucideIcon } from "lucide-react"
import type { ActivityType, CreateJobForm } from '@/utils/types'
import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/getInitials'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export const recordFormatUI: Record<ActivityType, { icon: LucideIcon; className: string; label: string }> = {
    // ── Job lifecycle ──────────────────────────────────────────────
    job_created: { icon: FileText, className: "bg-slate-400", label: "created this job" },
    job_updated: { icon: Pencil, className: "bg-amber-500", label: "updated this job" },
    job_published: { icon: Send, className: "bg-[#1E3A5F]", label: "published this job" },
    job_cancelled: { icon: XCircle, className: "bg-red-500", label: "cancelled this job" },
    job_deleted: { icon: Trash2, className: "bg-red-600", label: "deleted this job" },
    job_completed: { icon: CircleCheck, className: "bg-emerald-600", label: "job completed" },

    // ── Staffing ───────────────────────────────────────────────────
    workers_assigned: { icon: Users, className: "bg-violet-500", label: "assigned workers" },
    worker_unassigned: { icon: UserMinus, className: "bg-orange-500", label: "removed a worker" },

    // ── Worker responses ───────────────────────────────────────────
    assignment_accepted: { icon: CheckCircle2, className: "bg-emerald-500", label: "accepted" },
    assignment_declined: { icon: XOctagon, className: "bg-red-400", label: "declined" },

    // ── Shift progress ─────────────────────────────────────────────
    assignment_in_progress: { icon: Play, className: "bg-blue-500", label: "started work" },
    assignment_checked_in: { icon: LogIn, className: "bg-blue-500", label: "clocked in" },
    assignment_break_started: { icon: Coffee, className: "bg-amber-400", label: "started a break" },
    assignment_break_ended: { icon: Play, className: "bg-amber-500", label: "ended their break" },
    assignment_checked_out: { icon: LogOut, className: "bg-emerald-500", label: "clocked out" },
    assignment_completed: { icon: CheckCircle2, className: "bg-emerald-600", label: "completed the shift" },
    assignment_cancelled: { icon: Ban, className: "bg-slate-500", label: "assignment cancelled" },
    assignment_auto_completed: { icon: Bot, className: "bg-slate-400", label: "auto-completed by system" },

    // ── Misc ───────────────────────────────────────────────────────
    note_added: { icon: StickyNote, className: "bg-sky-500", label: "added a note" },
}

interface PopulatedRef {
    _id: string
    fullname: string
}

// Matches the GET /activity-logs/:id response — actor and workers come back
// populated with fullname, worker (singular) does not (denormalised for
// querying only, never displayed).
interface ActivityLogEntry {
    _id: string
    job: string
    type: ActivityType
    assignment?: string
    worker?: string
    workers?: PopulatedRef[]
    actor?: PopulatedRef | null
    isSystem?: boolean
    jobDate?: string
    changes?: { field: string; from: unknown; to: unknown }[]
    // Mixed by design — shape varies per event type. assignment_checked_in
    // carries geo-verification fields (see CheckInMetadata below); other
    // event types may put unrelated things here.
    metadata?: Record<string, unknown>
    createdAt: string
    updatedAt: string
}

interface CheckInMetadata {
    minutesLate?: number
    location?: string
    distanceMeters?: number
    flagged?: boolean
    accuracy?: number | null
}

type AssignedWorker = CreateJobForm["workers"][number]

function getWorkerBreakMinutes(w: AssignedWorker): number {
    if (!w.breaks?.length) return 0
    const now = dayjs()
    return w.breaks.reduce((total, b) => {
        const start = dayjs(b.startedAt)
        const end = b.endedAt ? dayjs(b.endedAt) : now
        return total + Math.max(end.diff(start, "minute"), 0)
    }, 0)
}

// Trusts the backend's hoursWorked once a shift is checked out (it may factor
// in things this component doesn't know about); computes live from
// checkedInAt otherwise, so an in-progress shift still shows a real number.
function getWorkerMinutes(w: AssignedWorker): number {
    if (w.checkedOutAt && w.hoursWorked) return w.hoursWorked * 60
    if (!w.checkedInAt) return 0
    const start = dayjs(w.checkedInAt)
    const end = w.checkedOutAt ? dayjs(w.checkedOutAt) : dayjs()
    const totalMinutes = Math.max(end.diff(start, "minute"), 0)
    return Math.max(totalMinutes - getWorkerBreakMinutes(w), 0)
}

function describeActivity(entry: ActivityLogEntry): React.ReactNode {
    const type = entry.type ?? 'job_updated'
    const ui = recordFormatUI[type] ?? recordFormatUI.job_updated

    // actor is the worker themselves for self-service events (accept, check-in,
    // break, ...) and the admin/manager for job-level events — already the
    // right "who did this" field for every event type.
    const subject = entry.actor?.fullname ?? "System"

    // workers_assigned is the one batch event — actor did the assigning,
    // but which workers were assigned is worth naming, not just implying.
    const assignedNames = type === 'workers_assigned' ? entry.workers?.map(w => w.fullname).filter(Boolean) : undefined

    // Geo-verification details attached to check-ins — surface them so a
    // late or off-site check-in doesn't get buried in an unread metadata blob.
    const checkIn = type === 'assignment_checked_in' ? (entry.metadata as CheckInMetadata | undefined) : undefined
    const hasCheckInDetail = !!checkIn && (
        checkIn.flagged || (checkIn.minutesLate ?? 0) > 0 || checkIn.distanceMeters != null
        || checkIn.accuracy != null || !!checkIn.location
    )

    return (
        <div className='relative  ml-2 -mb-px'>
            <span className="absolute h-full w-px bg-slate-200 left-1.5 top-0"></span>
            <span className='flex items-center space-x-1.5  py-4 '>
                <span className={cn("size-4 relative z-10 rounded-full flex items-center justify-center shadow-sm", ui.className)}>
                    <ui.icon className={cn(
                        "rounded-full ",

                    )}
                        size={10}
                    ></ui.icon>

                </span>

                <span className="font-semibold text-slate-900">{subject} </span>{" "}
                <span className="text-slate-600">
                    {ui?.label ?? type}
                    {assignedNames?.length ? `: ${assignedNames.join(", ")}` : ""}
                </span>
            </span>
            <p className="pl-5 text-[10px] text-slate-400 mt-0.5 font-medium">{dayjs(entry.createdAt).format("DD/MM h:mm A")}</p>

            {hasCheckInDetail && (
                <div className="pl-5 mt-1 flex flex-wrap items-center gap-1.5">
                    {checkIn.flagged && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                            <AlertCircle size={9} /> Flagged
                        </span>
                    )}
                    {(checkIn.minutesLate ?? 0) > 0 && (
                        <span className="text-[10px] font-medium text-amber-600">
                            {checkIn.minutesLate}m late
                        </span>
                    )}
                    {checkIn.distanceMeters != null && (
                        <span className="text-[10px] text-slate-400">
                            ~{Math.round(checkIn.distanceMeters)}m from site
                        </span>
                    )}
                    {checkIn.location && (
                        <span className="text-[10px] text-slate-400">
                            near {checkIn.location}
                        </span>
                    )}
                    {checkIn.accuracy != null && (
                        <span className="text-[10px] text-slate-300">
                            (±{Math.round(checkIn.accuracy)}m GPS accuracy)
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
export function JobDetail() {
    const id = useParams().id
    const navigate = useNavigate()
    const onNavigate = (path: string) => navigate(path)
    const job = useQuery(singleJob(id))?.data?.job!
    const { data, isLoading } = useQuery({
        queryKey: ["activity", id],
        queryFn: async (): Promise<any> => {
            const { data } = await customFetch.get(`/activity-logs/${id}`)
            return data
        }
    })
    const assignedWorkers = job?.workers ?? []
    console.log("assign workers :",assignedWorkers)
    const [showApproveModal, setShowApproveModal] = useState(false)
    const [showAssignWorkersModal, setShowAssignWorkersModal] = useState(false)

    const duplicateJobMutation = useMutation({
        mutationFn: duplicateJob,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["jobs"] })
            toast.success("Job duplicated successfully")
        },
        onError: (error) => {
            console.error(error)
            toast.error("Failed to duplicate job")
        },
    })

    const removeWorkerMutation = useMutation({
        mutationFn: (worker: typeof assignedWorkers[number]) =>
            updateJobWorkers(
                id!,
                assignedWorkers.filter(w => w.email !== worker.email),
                `${worker.fullname} removed from this job`
            ),
    })

    const statusColor: Record<string, string> = {
        'in-progress': 'from-blue-600 to-blue-700',
        'assigned': 'from-[#1E3A5F] to-[#2D5A8E]',
        'completed': 'from-emerald-600 to-emerald-700',
        'pending': 'from-amber-500 to-amber-600',
        'draft': 'from-slate-500 to-slate-600',
    }
    const gradient = statusColor[job?.status ?? "accepted"] ?? 'from-[#1E3A5F] to-[#2D5A8E]'

    // Total minutes across all workers — trusts hoursWorked for a checked-out
    // shift, computes live (minus breaks) for one still in progress.
    const totalMinutes = assignedWorkers.reduce((sum, w) => sum + getWorkerMinutes(w), 0)
    const avgRate = assignedWorkers.length
        ? assignedWorkers.reduce((sum, w) => sum + (w.payRate || 0), 0) / assignedWorkers.length
        : 0
    const estimatedCost = assignedWorkers.reduce((sum, w) => {
        if (w.checkedOutAt && w.totalPay) return sum + w.totalPay
        return sum + (getWorkerMinutes(w) / 60) * (w.payRate || 0)
    }, 0)
    const overtimeWorkersCount = job?.minutes
        ? assignedWorkers.filter(w => !!w.checkedInAt && getWorkerMinutes(w) > job.minutes!).length
        : 0

    return (
        <div className="p-6 animate-fade-in">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-5">
                <button
                    onClick={() => onNavigate('jobs')}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors group"
                >
                    <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                    Jobs
                </button>
                <span className="text-slate-300">/</span>
                <span className="text-sm text-slate-800 font-medium truncate max-w-xs">{job.title}</span>
            </div>

            {/* ── Hero card ────────────────────────────────────────────────────── */}
            <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 mb-5 relative overflow-hidden`}>
                {/* Texture */}
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)', backgroundSize: '22px 22px' }}
                />
                <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full border border-white/10" />
                <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full border border-white/10" />

                <div className="relative">
                    <div className="flex items-start justify-between gap-4 mb-5">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <StatusBadge status={job?.status ?? "accepted"} />
                                <PriorityBadge priority={job.priority} />
                            </div>
                            <h1 className="text-xl font-bold text-white leading-snug mb-1">{job.title}</h1>
                            <p className="text-sm text-white/60">{job.client}</p>
                        </div>

                        {/* Hero actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => onNavigate(`/jobs/${id}/edit`)}
                                className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors backdrop-blur-sm"
                            >
                                <Edit size={13} /> Edit
                            </button>
                            <button
                                onClick={() => duplicateJobMutation.mutate(id!)}
                                disabled={duplicateJobMutation.isPending}
                                className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors backdrop-blur-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Copy size={13} /> {duplicateJobMutation.isPending ? "Duplicating..." : "Duplicate"}
                            </button>
                            <button className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                                <MoreHorizontal size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Key metrics bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { icon: Calendar, label: 'Date', value: formatDate(job.date, "ddd, D MMM") },
                            { icon: Clock, label: 'Shift', value: `${job.startTime} – ${job.endTime}` },
                            { icon: Timer, label: 'Duration', value: `${formatDuration(job.minutes)} per worker` },
                            { icon: Users, label: 'Workers', value: assignedWorkers.length > 0 ? `${assignedWorkers.length} assigned` : 'Unassigned' },
                        ].map(m => (
                            <div key={m.label} className="bg-white/10 rounded-xl px-3.5 py-3 backdrop-blur-sm">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <m.icon size={11} className="text-white/50" />
                                    <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wide">{m.label}</p>
                                </div>
                                <p className="text-sm font-bold text-white">{m.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Main content grid ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left — 2 cols */}
                <div className="lg:col-span-2 flex flex-col gap-5">

                    {/* Job info */}
                    <Card>
                        <div className="px-5 pt-5 pb-4 border-b border-[#E2E8F0]">
                            <h3 className="text-sm font-semibold text-slate-900">Job Details</h3>
                        </div>
                        <div className="divide-y divide-[#F8FAFC]">
                            {[
                                {
                                    icon: MapPin,
                                    label: 'Location',
                                    value: job.location,
                                    action: (
                                        <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                                            <Navigation size={11} /> Directions
                                        </button>
                                    ),
                                },
                                { icon: Calendar, label: 'Date', value: formatDate(job.date, "dddd, D MMMM YYYY") },
                                { icon: Clock, label: 'Start Time', value: job.startTime },
                                { icon: Clock, label: 'Finish Time', value: job.endTime },
                                { icon: Timer, label: 'Shift Duration', value: `${formatDuration(job.minutes)} per worker` },
                                { icon: Briefcase, label: 'Client / Company', value: job.client },
                                { icon: Flag, label: 'Priority', value: <PriorityBadge priority={job.priority} /> },
                            ].map((row, i) => (
                                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                        <row.icon size={14} className="text-slate-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{row.label}</p>
                                        {typeof row.value === 'string'
                                            ? <p className="text-sm text-slate-800 font-medium mt-0.5">{row.value}</p>
                                            : <div className="mt-0.5">{row.value}</div>
                                        }
                                    </div>
                                    {row.action && <div className="shrink-0">{row.action}</div>}
                                </div>
                            ))}
                        </div>

                        {/* Notes */}
                        {job.description && (
                            <div className="mx-5 mb-5 mt-2">
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle size={14} className="text-amber-600" />
                                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Manager Notes</p>
                                    </div>
                                    <p className="text-sm text-amber-800 leading-relaxed">{job.description}</p>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Worker time logs */}
                    {assignedWorkers.length > 0 && (
                        <Card>
                            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E2E8F0]">
                                <div className="flex items-center gap-2.5">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-900">Time Logs</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Individual clock-in/out records</p>
                                    </div>
                                    {overtimeWorkersCount > 0 && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                                            <Flag size={9} /> {overtimeWorkersCount} over required time
                                        </span>
                                    )}
                                </div>
                                <button className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-[#E2E8F0] rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
                                    <Download size={12} /> Export
                                </button>
                            </div>

                            {/* Table header */}
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-2.5 bg-slate-50/60 border-b border-[#F1F5F9]">
                                {['Worker', 'Clock In', 'Clock Out', 'Break', 'Billable'].map(h => (
                                    <p key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{h}</p>
                                ))}
                            </div>

                            <div className="divide-y divide-[#F8FAFC]">
                                {assignedWorkers.map((w, i) => {
                                    const breakMinutes = getWorkerBreakMinutes(w)
                                    const workedMinutes = getWorkerMinutes(w)
                                    // Flag once they've worked past the job's required duration —
                                    // whether still clocked in (live overtime) or already checked
                                    // out, either way it's worth a manager's eyes before payroll.
                                    const isOvertime = !!w.checkedInAt && !!job?.minutes && workedMinutes > job.minutes
                                    return (
                                        <div
                                            key={w.email}
                                            className={cn(
                                                "grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 items-center hover:bg-slate-50/50 transition-colors cursor-pointer",
                                                isOvertime && "bg-amber-50/40"
                                            )}
                                            onClick={() => onNavigate(`/workers/${w.user}/worker-profile`)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Avatar initials={getInitials(w.fullname)} size="sm" index={i} />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{w.fullname}</p>
                                                    <p className="text-[10px] text-slate-400">{w.email}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-700 mono">
                                                {w.checkedInAt ? dayjs(w.checkedInAt).format("HH:mm") : "—"}
                                            </p>
                                            <div>
                                                {w.checkedOutAt
                                                    ? <p className="text-xs font-semibold text-slate-700 ">{dayjs(w.checkedOutAt).format("HH:mm")}</p>
                                                    : w.checkedInAt
                                                        ? <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full pulse-dot" />Live</span>
                                                        : <span className="text-xs text-slate-300">—</span>
                                                }
                                            </div>
                                            <p className="text-xs text-slate-500 mono">{breakMinutes > 0 ? formatDuration(breakMinutes) : "—"}</p>
                                            <div>
                                                <p className={cn("text-xs font-semibold mono", isOvertime ? "text-amber-700" : "text-emerald-700")}>
                                                    {w.checkedInAt ? formatDuration(workedMinutes) : "—"}
                                                </p>
                                                {isOvertime && (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full mt-1">
                                                        <Flag size={8} /> +{formatDuration(workedMinutes - job.minutes!)} over
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Totals row */}
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 bg-slate-50/60 border-t border-[#E2E8F0]">
                                <p className="text-xs font-bold text-slate-700 col-span-4">Estimated Total Billable</p>
                                <p className="text-xs font-bold text-emerald-700">{formatDuration(totalMinutes)}</p>
                            </div>
                        </Card>
                    )}

                    {/* Activity timeline */}
                    <Card className="p-5">
                        <h3 className="text-sm font-semibold text-slate-900 mb-5">Activity Timeline</h3>
                        <div className="flex flex-col gap-0 relative">
                            {/* <div className="absolute left-[7px] top-4 bottom-4 w-px bg-slate-100" /> */}
                            {
                                data?.activity?.length === 0 && (
                                    <div className="px-5 py-8 text-center">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                                            <FileText size={16} className="text-slate-400" />
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">No activity yet</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">All job activity will appear here</p>
                                    </div>
                                )
                            }
                            {
                                data?.activity?.map((entry: ActivityLogEntry, i: number) => (
                                    <div key={i} className="">

                                        <div className="flex-1 min-w-0 pt-px">
                                            <p className="text-sm text-slate-700 leading-snug">{describeActivity(entry)}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </Card>
                </div>

                {/* Right — 1 col */}
                <div className="flex flex-col gap-5">

                    {/* Manager actions */}
                    <Card className="p-5">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Actions</h3>
                        <div className="flex flex-col gap-2.5">
                            {job?.status === 'in-progress' && (
                                <button
                                    onClick={() => setShowApproveModal(true)}
                                    className="w-full h-11 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/25"
                                >
                                    <CheckCircle2 size={15} /> Approve & Complete
                                </button>
                            )}
                            {job?.status === 'completed' && (
                                <>
                                    <div className="w-full h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2">
                                        <CheckCircle2 size={14} className="text-emerald-600" />
                                        <span className="text-sm font-semibold text-emerald-700">Job Approved</span>
                                    </div>
                                    <button
                                        onClick={() => onNavigate(`/invoices/new?jobId=${id}`)}
                                        className="w-full h-10 rounded-xl bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#162D4A] transition-colors flex items-center justify-center gap-2 shadow-sm shadow-[#1E3A5F]/20"
                                    >
                                        <Receipt size={13} /> Generate Invoice
                                    </button>
                                </>
                            )}
                            {(job?.status === 'assigned' || job?.status === 'accepted' || job.status === 'draft') && (
                                <button
                                    onClick={() => onNavigate(`/jobs/${id}/edit?edit=assigned-workers#assigned-worker`)}
                                    className="w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold hover:bg-[#162D4A] transition-colors flex items-center justify-center gap-2 shadow-sm shadow-[#1E3A5F]/20"
                                >
                                    <Users size={14} /> Assign Workers
                                </button>
                            )}
                            <button
                                onClick={() => onNavigate(`/jobs/${id}/edit`)}
                                className="w-full h-10 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                            >
                                <Edit size={13} className="text-slate-400" /> Edit Job
                            </button>
                            <button
                                onClick={() => duplicateJobMutation.mutate(id!)}
                                disabled={duplicateJobMutation.isPending}
                                className="w-full h-10 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Copy size={13} className="text-slate-400" /> {duplicateJobMutation.isPending ? "Duplicating..." : "Duplicate"}
                            </button>
                            <button
                                onClick={() => deleteJob(job!._id as string).then(undefined => {
                                    navigate("/jobs")
                                })}
                                className="w-full h-10 rounded-xl border border-red-100 bg-red-50 text-sm font-semibold text-red-500 hover:bg-red-100 flex items-center justify-center gap-2 transition-colors mt-1">
                                <Trash2 size={13} /> Cancel Job
                            </button>
                        </div>
                    </Card>

                    {/* Assigned workers */}
                    <Card className="overflow-hidden">
                        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E2E8F0]">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Assigned Workers</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{assignedWorkers.length} assigned</p>
                            </div>
                            <button
                                onClick={() => setShowAssignWorkersModal(true)}
                                className="h-7 px-2.5 rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F] text-xs font-semibold hover:bg-[#1E3A5F]/20 transition-colors flex items-center gap-1"
                            >
                                <Plus size={11} /> Add
                            </button>
                        </div>

                        {assignedWorkers.length === 0 ? (
                            <div className="px-5 py-8 text-center">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                                    <Users size={16} className="text-slate-400" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium">No workers assigned</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Add workers to this job</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#F8FAFC]">
                                {assignedWorkers.map((w, i) => (
                                    <div
                                        key={w.email}
                                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer group"
                                        onClick={() => onNavigate(`/workers/${w.user}/worker-profile`)}
                                    >

                                        <Tooltip>
                                            <TooltipTrigger asChild
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    removeWorkerMutation.mutate(w)
                                                }}
                                            >
                                                <button
                                                    disabled={removeWorkerMutation.isPending}
                                                    className="p-1 cursor-pointer rounded-full hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    <X size={20} className='text-rose-400' />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent className='bg-black'>
                                                Remove <span className='font-black '>{w.fullname}</span>  <br/>
                                                from this job
                                            </TooltipContent>
                                        </Tooltip>

                                        <Avatar initials={w.fullname?.slice(0, 2)} size="sm" index={i} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors">{w.fullname}</p>
                                            <p className="text-[10px] text-slate-400">{w.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={w.status} />
                                            <ChevronLeft size={12} className="text-slate-300 rotate-180" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Cost estimate */}
                    <Card className="p-5">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Cost Summary</h3>
                        <div className="flex flex-col gap-2.5">
                            {[
                                { label: 'Workers', value: `${assignedWorkers.length}` },
                                { label: 'Hours each', value: formatDuration(job?.minutes) },
                                { label: 'Total hours', value: formatDuration(totalMinutes) },
                                { label: 'Rate (avg)', value: avgRate ? `${formatCurrency(avgRate)}/hr` : '—' },
                            ].map(r => (
                                <div key={r.label} className="flex items-center justify-between">
                                    <p className="text-xs text-slate-500">{r.label}</p>
                                    <p className="text-xs font-semibold text-slate-800 mono">{r.value}</p>
                                </div>
                            ))}
                            <Divider className="my-1" />
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-slate-900">Estimated Cost</p>
                                <p className="text-base font-bold text-slate-900 mono">{formatCurrency(estimatedCost)}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Attachments */}
                    <Card className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-slate-900">Attachments</h3>
                            <Link to={`/jobs/${id}/edit?edit=attachments`} className="flex items-center gap-1.5">
                                <button className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                                >+ Add</button>
                            </Link>
                        </div>
                        <div className="flex flex-col gap-2">
                            {[
                                { name: 'Site_Briefing.pdf', size: '284 KB', icon: FileText },
                                { name: 'Access_Passes.jpg', size: '1.2 MB', icon: Camera },
                            ].map(f => (
                                <div key={f.name} className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 cursor-pointer transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                        <f.icon size={14} className="text-slate-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-slate-800 truncate">{f.name}</p>
                                        <p className="text-[10px] text-slate-400">{f.size}</p>
                                    </div>
                                    <Download size={13} className="text-slate-400 shrink-0" />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            <AssignWorkersModal
                // assignedWorkers
                jobId={id!}
                assignedWorkers={assignedWorkers}
                open={showAssignWorkersModal}
                onOpenChange={setShowAssignWorkersModal}
            />

            {/* Approve modal */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={24} className="text-emerald-600" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 text-center mb-1">Approve this job?</h3>
                        <p className="text-sm text-slate-500 text-center mb-6">This will mark the job as completed and notify all workers. Hours will be submitted for payroll.</p>
                        <div className="bg-slate-50 rounded-xl p-4 mb-5 flex flex-col gap-2">
                            {[
                                { label: 'Job', value: job.title?.split('—')[0]?.trim() },
                                { label: 'Workers', value: `${assignedWorkers.length} workers` },
                                { label: 'Total Hours', value: formatDuration(totalMinutes) },
                                { label: 'Est. Cost', value: formatCurrency(estimatedCost) },
                            ].map(r => (
                                <div key={r.label} className="flex items-center justify-between">
                                    <p className="text-xs text-slate-500">{r.label}</p>
                                    <p className="text-xs font-semibold text-slate-800">{r.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowApproveModal(false)}
                                className="flex-1 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowApproveModal(false)}
                                className="flex-1 h-11 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/25"
                            >
                                Approve Job
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
