import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft, Repeat2, MapPin, Edit2, StopCircle, PlayCircle,
    X, AlertTriangle, CheckCircle2, Clock, Users, Calendar, Info,
} from 'lucide-react'
import {
    SCHEDULE_DETAILS, SCHEDULES, describeRecurrence, fmtDate, fmtDateLong,
    type RecurringOccurrence,
} from '../data/recurringMockData'
import { useNavigate } from 'react-router'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
            {active ? 'Active' : 'Stopped'}
        </span>
    )
}

function OccurrenceStatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        Completed: 'bg-emerald-50 text-emerald-700',
        Published: 'bg-blue-50 text-[#1E3A5F]',
        Draft: 'bg-slate-100 text-slate-600',
        Cancelled: 'bg-red-50 text-red-600',
    }
    return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] ?? 'bg-slate-100 text-slate-500'}`}>
            {status}
        </span>
    )
}

// ─── Dialog backdrop ──────────────────────────────────────────────────────────

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ duration: 0.18 }}
                className="w-full max-w-md"
            >
                {children}
            </motion.div>
        </motion.div>
    )
}

// ─── Stop schedule dialog ─────────────────────────────────────────────────────

function StopScheduleDialog({
    upcomingCount,
    onConfirm,
    onClose,
}: {
    upcomingCount: number
    onConfirm: (cancelFutureJobs: boolean) => void
    onClose: () => void
}) {
    const [choice, setChoice] = useState<'keep' | 'cancel'>('keep')
    const [loading, setLoading] = useState(false)

    const handleConfirm = () => {
        setLoading(true)
        setTimeout(() => onConfirm(choice === 'cancel'), 1200)
    }

    return (
        <Backdrop onClose={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <StopCircle size={16} className="text-slate-600" />
                            <h3 className="text-base font-bold text-slate-900">Stop this recurring shift?</h3>
                        </div>
                        <p className="text-sm text-slate-500">Choose what should happen to shifts that have already been created.</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors ml-3 shrink-0">
                        <X size={15} />
                    </button>
                </div>

                <div className="px-6 py-5 flex flex-col gap-3">
                    {/* Option A */}
                    <button
                        type="button"
                        onClick={() => setChoice('keep')}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${choice === 'keep' ? 'border-[#1E3A5F] bg-[#1E3A5F]/[0.03]' : 'border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${choice === 'keep' ? 'border-[#1E3A5F]' : 'border-slate-300'}`}>
                                {choice === 'keep' && <div className="w-2 h-2 rounded-full bg-[#1E3A5F]" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 mb-0.5">Stop it repeating</p>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    No new shifts will be created. The <strong className="text-slate-700">{upcomingCount}</strong> already scheduled shifts stay as they are.
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Option B */}
                    <button
                        type="button"
                        onClick={() => setChoice('cancel')}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${choice === 'cancel' ? 'border-red-400 bg-red-50/40' : 'border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${choice === 'cancel' ? 'border-red-500' : 'border-slate-300'}`}>
                                {choice === 'cancel' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 mb-0.5">Stop it and cancel upcoming shifts</p>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Stops the schedule and also cancels <strong className="text-slate-700">{upcomingCount}</strong> upcoming shifts. Workers who already accepted will be notified.
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        Keep schedule running
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`h-9 px-5 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2 ${choice === 'cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1E3A5F] hover:bg-[#162D4A]'
                            }`}
                    >
                        {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {loading ? 'Stopping…' : choice === 'cancel' ? `Stop & cancel ${upcomingCount} shifts` : 'Stop schedule'}
                    </button>
                </div>
            </div>
        </Backdrop>
    )
}

// ─── Restart dialog ───────────────────────────────────────────────────────────

function RestartScheduleDialog({
    onConfirm,
    onClose,
    endDatePassed,
}: {
    onConfirm: () => void
    onClose: () => void
    endDatePassed?: boolean
}) {
    const [loading, setLoading] = useState(false)
    const handleConfirm = () => { setLoading(true); setTimeout(onConfirm, 1200) }

    if (endDatePassed) {
        return (
            <Backdrop onClose={onClose}>
                <div className="bg-white rounded-2xl shadow-2xl p-6">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                        <AlertTriangle size={18} className="text-amber-500" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">{"Can't restart this schedule"}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-2">
                        The schedule end date has already passed. Update the end date before restarting.
                    </p>
                    <p className="text-xs text-slate-400 mb-5">Pattern editing is coming soon.</p>
                    <button onClick={onClose} className="w-full h-10 border border-slate-200 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
                        Close
                    </button>
                </div>
            </Backdrop>
        )
    }

    return (
        <Backdrop onClose={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex items-center gap-2 mb-1">
                    <PlayCircle size={16} className="text-[#1E3A5F]" />
                    <h3 className="text-base font-bold text-slate-900">Restart recurring shift?</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mt-1 mb-6">
                    New shifts will be generated from today. Past dates will not be recreated.
                </p>
                <div className="flex items-center justify-end gap-3">
                    <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="h-9 px-5 text-sm font-bold text-white bg-[#1E3A5F] rounded-xl hover:bg-[#162D4A] transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                        {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {loading ? 'Restarting…' : 'Restart schedule'}
                    </button>
                </div>
            </div>
        </Backdrop>
    )
}

// ─── Pattern card ─────────────────────────────────────────────────────────────

function SchedulePatternCard({ schedule }: { schedule: ReturnType<typeof SCHEDULES[0]['frequency'] extends string ? any : any> }) {
    const FREQ_LABEL: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const rows = [
        { label: 'Repeats', value: FREQ_LABEL[schedule.frequency] ?? schedule.frequency },
        { label: 'Every', value: schedule.interval === 1 ? `1 ${schedule.frequency === 'weekly' ? 'week' : schedule.frequency === 'monthly' ? 'month' : 'day'}` : `${schedule.interval} ${schedule.frequency === 'weekly' ? 'weeks' : schedule.frequency === 'monthly' ? 'months' : 'days'}` },
        schedule.daysOfWeek?.length ? { label: 'Days', value: schedule.daysOfWeek.map((d: number) => DAY_NAMES[d]).join(', ') } : null,
        { label: 'Start date', value: fmtDateLong(schedule.startDate) },
        { label: 'End date', value: schedule.endDate ? fmtDateLong(schedule.endDate) : 'No end date' },
        { label: 'Shift time', value: `${schedule.templateJob.startTime}–${schedule.templateJob.endTime}` },
        schedule.generatedUntil ? { label: 'Generated through', value: fmtDateLong(schedule.generatedUntil) } : null,
    ].filter(Boolean) as { label: string; value: string }[]

    return (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Schedule pattern</h3>
            <div className="flex flex-col gap-0">
                {rows.map((row, i) => (
                    <div key={row.label} className={`flex items-center justify-between py-2.5 ${i < rows.length - 1 ? 'border-b border-slate-50' : ''}`}>
                        <span className="text-sm text-slate-500">{row.label}</span>
                        <span className="text-sm font-semibold text-slate-800 text-right">{row.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Default workers card ─────────────────────────────────────────────────────

function DefaultWorkersCard({ workers }: { workers: { _id: string; fullname: string; email: string }[] }) {
    const COLORS = ['#1E3A5F', '#0D9488', '#7C3AED', '#B45309']
    return (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Default workers</h3>
            <p className="text-xs text-slate-400 mb-4">Automatically assigned when new shifts are generated.</p>
            {workers.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No default workers. New shifts are created without automatic worker assignments.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {workers.map((w, i) => (
                        <div key={w._id} className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                                style={{ background: COLORS[i % COLORS.length] }}
                            >
                                {w.fullname.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{w.fullname}</p>
                                <p className="text-xs text-slate-400 truncate">{w.email}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Schedule metadata card ───────────────────────────────────────────────────

function ScheduleMetadataCard({ detail }: { detail: (typeof SCHEDULE_DETAILS)[keyof typeof SCHEDULE_DETAILS] }) {
    const rows = [
        { label: 'Created by', value: detail.createdBy.fullname },
        { label: 'Created', value: fmtDateLong(detail.createdAt) },
        { label: 'Total generated', value: `${detail.occurrenceCount} shifts` },
        { label: 'Upcoming', value: `${detail.upcomingCount} shifts` },
    ]
    return (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Schedule details</h3>
            {rows.map(r => (
                <div key={r.label} className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-slate-500">{r.label}</span>
                    <span className="text-xs font-semibold text-slate-700">{r.value}</span>
                </div>
            ))}
        </div>
    )
}

// ─── Occurrence row ───────────────────────────────────────────────────────────

function OccurrenceRow({
    occ,
    onNavigate,
}: {
    occ: RecurringOccurrence
    onNavigate: (id: string, recordId?: string) => void
}) {
    return (
        <button
            onClick={() => onNavigate('/jobs/id')}
            className="w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors border-b border-slate-50 last:border-0 group"
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-xs font-semibold text-slate-500">{fmtDate(occ.date)}</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{occ.title}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> {occ.startTime}–{occ.endTime}
                    </span>
                    {occ.requiredWorkers > 0 && occ.status !== 'Completed' && occ.status !== 'Cancelled' && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Users size={10} /> {occ.requiredWorkers} workers needed
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <OccurrenceStatusBadge status={occ.status} />
                <ChevronLeft size={14} className="rotate-180 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
        </button>
    )
}

// ─── Occurrences tabs ─────────────────────────────────────────────────────────

function OccurrencesTabs({
    detail,
    active,
    onNavigate,
}: {
    detail: any
    active: boolean
    onNavigate: (id: string, recordId?: string) => void
}) {
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
    const upcoming = detail.occurrences.upcoming as RecurringOccurrence[]
    const past = detail.occurrences.past as RecurringOccurrence[]
    const list = tab === 'upcoming' ? upcoming : past

    return (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-0 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Generated shifts</h3>
                <div className="flex gap-0">
                    {(['upcoming', 'past'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all capitalize -mb-px ${tab === t
                                    ? 'border-[#1E3A5F] text-[#1E3A5F]'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    {list.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <Calendar size={20} className="text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">
                                {tab === 'upcoming'
                                    ? active
                                        ? 'No upcoming shifts. More may be generated automatically as this schedule progresses.'
                                        : 'This schedule is stopped and will not create new shifts.'
                                    : 'No past shifts for this schedule yet.'
                                }
                            </p>
                        </div>
                    ) : (
                        list.map(occ => (
                            <OccurrenceRow key={occ._id} occ={occ} onNavigate={onNavigate} />
                        ))
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onAnimationComplete={() => setTimeout(onDone, 3500)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl text-sm font-semibold pointer-events-none"
        >
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            {message}
        </motion.div>
    )
}

// ─── Main detail page ─────────────────────────────────────────────────────────

export function RecurringJobDetail({
    scheduleId,

}: {
    scheduleId: string
    //   onNavigate: (id: string, recordId?: string) => void
}) {
    const detail = SCHEDULE_DETAILS[scheduleId] ?? SCHEDULE_DETAILS['rs1']
    const [active, setActive] = useState(detail.active)
    const [showStop, setShowStop] = useState(false)
    const [showRestart, setShowRestart] = useState(false)
    const [toast, setToast] = useState<string | null>(null)
    const navigate = useNavigate()
    const onNavigate = (path: string) => navigate(path)
    const handleStop = (cancelFutureJobs: boolean) => {
        setActive(false)
        setShowStop(false)
        setToast(
            cancelFutureJobs
                ? `Schedule stopped — ${detail.upcomingCount} upcoming shifts cancelled. Affected workers were notified.`
                : 'Schedule stopped.'
        )
    }

    const handleRestart = () => {
        setActive(true)
        setShowRestart(false)
        setToast('Schedule restarted — 12 shifts created.')
    }

    return (
        <div className="p-6 max-w-[960px]">
            {/* Back link */}
            <button
                onClick={() => onNavigate('recurring-jobs')}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-5"
            >
                <ChevronLeft size={15} /> Recurring Shifts
            </button>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight min-w-0 truncate">
                            {detail.templateJob.title}
                        </h1>
                        <StatusBadge active={active} />
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                        {describeRecurrence(detail)} · {detail.templateJob.startTime}–{detail.templateJob.endTime}
                        {detail.endDate ? ` · until ${fmtDateLong(detail.endDate)}` : ''}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin size={11} /> {detail.templateJob.client} · {detail.templateJob.location}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Edit pattern — disabled with tooltip */}
                    <div className="relative group">
                        <button
                            disabled
                            className="h-9 px-4 text-sm font-semibold text-slate-400 border border-slate-200 rounded-xl flex items-center gap-2 cursor-not-allowed"
                            aria-label="Edit pattern — coming soon"
                        >
                            <Edit2 size={13} /> Edit pattern
                        </button>
                        <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Editing recurring patterns is coming soon.
                        </div>
                    </div>

                    {active ? (
                        <button
                            onClick={() => setShowStop(true)}
                            className="h-9 px-4 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                            <StopCircle size={13} /> Stop schedule
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowRestart(true)}
                            className="h-9 px-4 text-sm font-semibold text-white bg-[#1E3A5F] rounded-xl hover:bg-[#162D4A] transition-colors flex items-center gap-2"
                        >
                            <PlayCircle size={13} /> Restart schedule
                        </button>
                    )}
                </div>
            </div>

            {/* Stopped notice */}
            <AnimatePresence>
                {!active && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-5"
                    >
                        <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-600">
                            <Info size={15} className="text-slate-400 shrink-0 mt-0.5" />
                            <span>This schedule is stopped. No new shifts will be generated until it is restarted.</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Two-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left column — cards */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <SchedulePatternCard schedule={detail} />
                    <DefaultWorkersCard workers={detail.defaultWorkers} />
                    <ScheduleMetadataCard detail={detail} />
                </div>

                {/* Right column — occurrences */}
                <div className="lg:col-span-2">
                    <OccurrencesTabs detail={detail} active={active} onNavigate={onNavigate} />
                </div>
            </div>

            {/* Dialogs */}
            <AnimatePresence>
                {showStop && (
                    <StopScheduleDialog
                        upcomingCount={detail.upcomingCount}
                        onConfirm={handleStop}
                        onClose={() => setShowStop(false)}
                    />
                )}
                {showRestart && (
                    <RestartScheduleDialog
                        onConfirm={handleRestart}
                        onClose={() => setShowRestart(false)}
                    />
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast message={toast} onDone={() => setToast(null)} />}
            </AnimatePresence>
        </div>
    )
}
