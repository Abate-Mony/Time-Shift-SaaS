import customFetch from '@/utils/customFetch'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
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
    Receipt,
    Timer,
    Trash2,
    Users
} from 'lucide-react'
import {
    Pencil, Send, XCircle,
    UserMinus, XOctagon,
    LogIn, LogOut, Coffee, CoffeeIcon,
    Ban, Bot, StickyNote, CircleCheck,
} from "lucide-react"
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Avatar, Card, Divider, PriorityBadge, StatusBadge } from '../components/ui'
import { singleJob } from './EditJobPage'

// ── Timeline events per job ──────────────────────────────────────────────────
const timelineEvents = [
    { type: 'created', label: 'Job created by Owen Wright', time: '22 Jul, 09:14', icon: FileText, color: 'bg-slate-400' },
    { type: 'assigned', label: 'Workers assigned', time: '22 Jul, 09:20', icon: Users, color: 'bg-violet-500' },
    { type: 'accepted', label: 'James Mitchell accepted', time: '22 Jul, 11:30', icon: CheckCircle2, color: 'bg-emerald-500' },
    { type: 'accepted', label: 'Priya Patel accepted', time: '22 Jul, 13:45', icon: CheckCircle2, color: 'bg-emerald-500' },
    { type: 'started', label: 'James Mitchell clocked in', time: '25 Jul, 22:03', icon: Play, color: 'bg-blue-500' },
    { type: 'started', label: 'Priya Patel clocked in', time: '25 Jul, 22:07', icon: Play, color: 'bg-blue-500' },
]

const workerTimeLogs: Record<string, { clockIn: string; clockOut: string | null; break: string; billable: string }> = {
    w1: { clockIn: '22:03', clockOut: null, break: '0m', billable: '4h 02m (ongoing)' },
    w4: { clockIn: '22:07', clockOut: null, break: '0m', billable: '3h 58m (ongoing)' },
    w2: { clockIn: '08:02', clockOut: '20:08', break: '30m', billable: '11h 30m' },
    w3: { clockIn: '08:00', clockOut: '20:05', break: '45m', billable: '11h 15m' },
}

import type { LucideIcon } from "lucide-react"
import type { ActivityType } from '@/utils/types'
import { cn } from '@/lib/utils'

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

const activityLog = [{
    "_id": "6a6f1fc1153487a6a6e0cc55", "job": "6a6f15615746445f28c4fcfc", "workers": [{ "_id": "6a6ed4d18dc34eebbf1a4188", "fullname": "manager" }],
    "actor": { "_id": "6a6ec368b301e127831156a1", "fullname": "Emmanuel Ako Bate" }, "createdAt": "2026-08-02T10:45:21.315Z", "updatedAt": "2026-08-02T10:45:21.315Z", "__v": 0
}]
function describeActivity(entry: typeof activityLog[number] & {
    type: ActivityType
}): React.ReactNode {
    const ui = recordFormatUI[entry.type]

    // Per-assignment events describe the worker; job-level events describe the actor
    const subject =
        // entry.workers?.fullname ??
        entry.actor?.fullname ??
        "System"

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
                <span className="text-slate-600">{ui?.label ?? entry.type}</span>
            </span>
            <p className="pl-5 text-[10px] text-slate-400 mt-0.5 font-medium">{dayjs(entry.createdAt).format("DD/MM h:mm A")}</p>

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
    const assignedWorkers = job?.workers
    const [showApproveModal, setShowApproveModal] = useState(false)

    const statusColor: Record<string, string> = {
        'in-progress': 'from-blue-600 to-blue-700',
        'assigned': 'from-[#1E3A5F] to-[#2D5A8E]',
        'completed': 'from-emerald-600 to-emerald-700',
        'pending': 'from-amber-500 to-amber-600',
        'draft': 'from-slate-500 to-slate-600',
    }
    const gradient = statusColor[job?.status ?? "accepted"] ?? 'from-[#1E3A5F] to-[#2D5A8E]'

    const totalHours = assignedWorkers.length * 10
    const estimatedCost = assignedWorkers.length * 10 * 18
    console.log(job.workers)
    return (
        <div className="p-6 animate-fade-in">
            {JSON.stringify(data ?? {})}
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
                            <button className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors backdrop-blur-sm">
                                <Edit size={13} /> Edit
                            </button>
                            <button className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors backdrop-blur-sm">
                                <Copy size={13} /> Duplicate
                            </button>
                            <button className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
                                <MoreHorizontal size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Key metrics bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { icon: Calendar, label: 'Date', value: new Date(job.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) },
                            { icon: Clock, label: 'Shift', value: `${job.startTime} – ${job.endTime}` },
                            { icon: Timer, label: 'Duration', value: `${10}h per worker` },
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
                                { icon: Calendar, label: 'Date', value: new Date(job.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                                { icon: Clock, label: 'Start Time', value: job.startTime },
                                { icon: Clock, label: 'Finish Time', value: job.endTime },
                                { icon: Timer, label: 'Shift Duration', value: `${10} hours per worker` },
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
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">Time Logs</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Individual clock-in/out records</p>
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
                                    // const log = w.checkedInAt
                                    //  ?? { clockIn: '—', clockOut: '—', break: '—', billable: '—' }
                                    const { checkedOutAt, checkedInAt } = w
                                    console.log("worker : ", w)
                                    return (
                                        <div
                                            key={w.email}
                                            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 items-center hover:bg-slate-50/50 transition-colors cursor-pointer"
                                            onClick={() => onNavigate(`/user/${w.job}/worker-profile`)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Avatar initials={w.fullname?.[0]} size="sm" index={i} />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{w.fullname}</p>
                                                    <p className="text-[10px] text-slate-400">{"worker"}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-700 mono">{dayjs(w?.checkedInAt!).format("HH:mm")}</p>
                                            <div>
                                                {checkedInAt
                                                    ? <p className="text-xs font-semibold text-slate-700 ">{dayjs(checkedOutAt).format("HH:mm")}</p>
                                                    : <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full pulse-dot" />Live</span>
                                                }
                                            </div>
                                            <p className="text-xs text-slate-500 mono">{"log.break"}</p>
                                            <p className="text-xs font-semibold text-emerald-700 mono">{w.payRate || "£14/ph"}</p>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Totals row */}
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 bg-slate-50/60 border-t border-[#E2E8F0]">
                                <p className="text-xs font-bold text-slate-700 col-span-4">Estimated Total Billable</p>
                                <p className="text-xs font-bold text-emerald-700">{totalHours}h</p>
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
                                data?.activity?.map((entry: typeof activityLog[number], i: number) => (
                                    <div key={i} className="">
                              
                                        <div className="flex-1 min-w-0 pt-px">
                                            <p className="text-sm text-slate-700 leading-snug">{describeActivity(entry)}</p>
                                        </div>
                                    </div>
                                ))}
                            {timelineEvents.map((e, i) => (
                                <div key={i} className="flex items-start gap-3.5 pb-5 last:pb-0 hidden">
                                    <div className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 ${e.color} ring-2 ring-white z-10 flex items-center justify-center`}>
                                        <e.icon size={7} className="text-white" strokeWidth={3} />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-px">
                                        <p className="text-sm text-slate-700 leading-snug">{e.label}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{e.time}</p>
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
                                <button className="w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold hover:bg-[#162D4A] transition-colors flex items-center justify-center gap-2 shadow-sm shadow-[#1E3A5F]/20">
                                    <Users size={14} /> Assign Workers
                                </button>
                            )}
                            <button
                                onClick={() => onNavigate(`/jobs/${id}/edit`)}
                                className="w-full h-10 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                            >
                                <Edit size={13} className="text-slate-400" /> Edit Job
                            </button>
                            <button className="w-full h-10 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
                                <Copy size={13} className="text-slate-400" /> Duplicate
                            </button>
                            <button className="w-full h-10 rounded-xl border border-red-100 bg-red-50 text-sm font-semibold text-red-500 hover:bg-red-100 flex items-center justify-center gap-2 transition-colors mt-1">
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
                            <Link to={`/jobs/${id}/edit?edit=assigned-workers#assigned-worker`}>
                                <button className="h-7 px-2.5 rounded-lg bg-[#1E3A5F]/10 text-[#1E3A5F] text-xs font-semibold hover:bg-[#1E3A5F]/20 transition-colors flex items-center gap-1">
                                    <Plus size={11} /> Add
                                </button>
                            </Link>
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
                                        onClick={() => onNavigate('worker-profile')}
                                    >
                                        <Avatar initials={w.fullname?.slice(0, 2)} size="sm" index={i} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors">{w.fullname}</p>
                                            <p className="text-[10px] text-slate-400">{"w.role"}</p>
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
                                { label: 'Hours each', value: `${"job.hours"}h` },
                                { label: 'Total hours', value: `${totalHours}h` },
                                { label: 'Rate (avg)', value: '£18.00/hr' },
                            ].map(r => (
                                <div key={r.label} className="flex items-center justify-between">
                                    <p className="text-xs text-slate-500">{r.label}</p>
                                    <p className="text-xs font-semibold text-slate-800 mono">{r.value}</p>
                                </div>
                            ))}
                            <Divider className="my-1" />
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-slate-900">Estimated Cost</p>
                                <p className="text-base font-bold text-slate-900 mono">£{estimatedCost.toLocaleString()}</p>
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
                                { label: 'Job', value: job.title.split('—')[0].trim() },
                                { label: 'Workers', value: `${assignedWorkers.length} workers` },
                                { label: 'Total Hours', value: `${totalHours}h` },
                                { label: 'Est. Cost', value: `£${estimatedCost.toLocaleString()}` },
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

// Small helper used in JobDetail
function Plus({ size, className }: { size?: number; className?: string }) {
    return (
        <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 5v14M5 12h14" />
        </svg>
    )
}
