import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft, Edit2, StopCircle, PlayCircle,
    X, AlertTriangle, Clock, Users, Calendar, Info, MapPin,
} from 'lucide-react'
import {
    fmtDate, fmtDateLong, describeRecurrence,
    type Frequency, type RecurringDetail, type RecurringOccurrence,
} from '@/utils/recurring'
import { useNavigate, useParams, type LoaderFunctionArgs } from 'react-router'
import { useMutation, useQuery, type QueryClient } from '@tanstack/react-query'
import customFetch from '@/utils/customFetch'
import { queryClient } from '@/lib/queryClient'
import toast from 'react-hot-toast'
import { StatusBadge as JobStatusBadge } from '@/components/ui'
import { shiftHoursFrom, formatHours } from '@/components/create-job/wizardConfig'

// ─── Data ─────────────────────────────────────────────────────────────────────

type ScheduleDoc = Omit<RecurringDetail, 'occurrences'>

const recurringJobDetailQuery = (id: string) => ({
    queryKey: ['recurring-job', id],
    queryFn: async () => {
        const { data } = await customFetch.get<{
            schedule: ScheduleDoc
            occurrences: RecurringDetail['occurrences']
        }>(`/recurring-jobs/${id}`)
        return data
    },
})

export const loader = (queryClient: QueryClient) => async ({ params }: LoaderFunctionArgs) => {
    await queryClient.ensureQueryData(recurringJobDetailQuery(params.id as string))
    return null
}

const invalidateSchedule = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ['recurring-job', id] })
    queryClient.invalidateQueries({ queryKey: ['recurring-jobs'] })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScheduleStatusBadge({ active }: { active: boolean }) {
    return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
            {active ? 'Active' : 'Stopped'}
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
    loading,
}: {
    upcomingCount: number
    onConfirm: (cancelFutureJobs: boolean) => void
    onClose: () => void
    loading: boolean
}) {
    const [choice, setChoice] = useState<'keep' | 'cancel'>('keep')

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
                        onClick={() => onConfirm(choice === 'cancel')}
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
    onEditInstead,
    blocked,
    loading,
}: {
    onConfirm: () => void
    onClose: () => void
    onEditInstead: () => void
    blocked: string | null
    loading: boolean
}) {
    if (blocked) {
        return (
            <Backdrop onClose={onClose}>
                <div className="bg-white rounded-2xl shadow-2xl p-6">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                        <AlertTriangle size={18} className="text-amber-500" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">{"Can't restart this schedule"}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-5">{blocked}</p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="flex-1 h-10 border border-slate-200 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
                            Close
                        </button>
                        <button onClick={onEditInstead} className="flex-1 h-10 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors">
                            Edit end date
                        </button>
                    </div>
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
                        onClick={onConfirm}
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

// ─── Edit pattern dialog ──────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const FREQUENCIES: { value: Frequency; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
]

export interface EditPatternForm {
    frequency: Frequency
    interval: number
    daysOfWeek: number[]
    endDate: string
    maxOccurrences: string
    defaultWorkerIds: string[]
    startTime: string
    endTime: string
}

function EditPatternDialog({
    detail,
    workers,
    workersLoading,
    onClose,
    onSubmit,
    loading,
}: {
    detail: RecurringDetail
    workers: { _id: string; fullname: string; email: string }[]
    workersLoading: boolean
    onClose: () => void
    onSubmit: (form: EditPatternForm) => void
    loading: boolean
}) {
    const buildFormFromDetail = (d: RecurringDetail): EditPatternForm => ({
        frequency: d.frequency,
        interval: d.interval,
        daysOfWeek: d.daysOfWeek ?? [],
        endDate: d.endDate ? d.endDate.slice(0, 10) : '',
        maxOccurrences: d.maxOccurrences ? String(d.maxOccurrences) : '',
        defaultWorkerIds: d.defaultWorkers.map(w => w._id),
        startTime: d.templateJob.startTime,
        endTime: d.templateJob.endTime,
    })

    const [form, setForm] = useState<EditPatternForm>(() => buildFormFromDetail(detail))
    // Never updated after mount — the baseline the Save button compares
    // against to know whether anything has actually changed.
    const initialFormRef = useRef(buildFormFromDetail(detail))

    const toggleDay = (d: number) => setForm(f => ({
        ...f,
        daysOfWeek: f.daysOfWeek.includes(d) ? f.daysOfWeek.filter(x => x !== d) : [...f.daysOfWeek, d].sort(),
    }))
    const toggleWorker = (id: string) => setForm(f => ({
        ...f,
        defaultWorkerIds: f.defaultWorkerIds.includes(id) ? f.defaultWorkerIds.filter(x => x !== id) : [...f.defaultWorkerIds, id],
    }))

    const daysMissing = form.frequency === 'weekly' && form.daysOfWeek.length === 0
    const timeMissing = !form.startTime || !form.endTime

    // Order doesn't carry meaning for either array (days get re-sorted on
    // toggle; worker selection order isn't a thing a manager would notice
    // or intend to change), so compare them as sets, not sequences.
    const sameMembers = (a: (string | number)[], b: (string | number)[]) =>
        a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])

    const initial = initialFormRef.current
    const isDirty =
        form.frequency !== initial.frequency ||
        form.interval !== initial.interval ||
        !sameMembers(form.daysOfWeek, initial.daysOfWeek) ||
        form.endDate !== initial.endDate ||
        form.maxOccurrences !== initial.maxOccurrences ||
        !sameMembers(form.defaultWorkerIds, initial.defaultWorkerIds) ||
        form.startTime !== initial.startTime ||
        form.endTime !== initial.endTime

    const canSubmit = !daysMissing && !timeMissing && form.interval >= 1 && isDirty

    const shiftHours = shiftHoursFrom(form.startTime, form.endTime)
    const isOvernight = !!form.startTime && !!form.endTime && form.endTime < form.startTime

    return (
        <Backdrop onClose={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] w-full max-w-lg">
                <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-start justify-between shrink-0">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Edit schedule pattern</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Pending future shifts are regenerated under the new pattern. Shifts a worker already accepted are left as-is.
                        </p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors ml-3 shrink-0">
                        <X size={15} />
                    </button>
                </div>

                <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto">
                    {/* Frequency */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Repeats</label>
                        <div className="grid grid-cols-3 gap-2">
                            {FREQUENCIES.map(f => (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => setForm(v => ({ ...v, frequency: f.value }))}
                                    className={`h-10 rounded-xl text-sm font-semibold border-2 transition-all ${form.frequency === f.value
                                        ? 'border-[#1E3A5F] bg-[#1E3A5F]/[0.04] text-[#1E3A5F]'
                                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interval */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-slate-700 shrink-0">Every</label>
                        <input
                            type="number"
                            min={1}
                            value={form.interval}
                            onChange={e => setForm(v => ({ ...v, interval: Math.max(1, Number(e.target.value) || 1) }))}
                            className="w-20 h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
                        />
                        <span className="text-sm text-slate-500">
                            {form.frequency === 'weekly' ? (form.interval === 1 ? 'week' : 'weeks') : form.frequency === 'monthly' ? (form.interval === 1 ? 'month' : 'months') : (form.interval === 1 ? 'day' : 'days')}
                        </span>
                    </div>

                    {/* Shift time */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Shift time</label>
                        <p className="text-xs text-slate-400 -mt-1">
                            Applies to future shifts only — already-generated shifts, and any a worker has already accepted, keep their current time.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-slate-500">Start time</label>
                                <input
                                    type="time"
                                    value={form.startTime}
                                    onChange={e => setForm(v => ({ ...v, startTime: e.target.value }))}
                                    className="h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs text-slate-500">End time</label>
                                <input
                                    type="time"
                                    value={form.endTime}
                                    onChange={e => setForm(v => ({ ...v, endTime: e.target.value }))}
                                    className="h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
                                />
                            </div>
                        </div>
                        {timeMissing ? (
                            <p className="text-xs text-amber-600 flex items-center gap-1">
                                <Info size={11} /> Start and end time are both required
                            </p>
                        ) : (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3.5 py-2 flex items-center gap-2">
                                <Clock size={13} className="text-blue-500 shrink-0" />
                                <p className="text-sm text-blue-700">
                                    <span className="font-semibold">{formatHours(shiftHours)}</span> shift duration
                                    {isOvernight && <span className="text-blue-500"> · overnight</span>}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Days of week */}
                    {form.frequency === 'weekly' && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-700">Repeat on</label>
                            <div className="flex flex-wrap gap-2">
                                {DAY_NAMES.map((day, i) => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(i)}
                                        className={`h-9 w-12 rounded-xl text-xs font-bold transition-all border ${form.daysOfWeek.includes(i)
                                            ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                            {daysMissing && (
                                <p className="text-xs text-amber-600 flex items-center gap-1">
                                    <Info size={11} /> Select at least one day
                                </p>
                            )}
                        </div>
                    )}

                    {/* End date + max occurrences */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-700">End date</label>
                            <input
                                type="date"
                                value={form.endDate}
                                onChange={e => setForm(v => ({ ...v, endDate: e.target.value }))}
                                className="h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
                            />
                            <p className="text-xs text-slate-400">Leave blank for no end date.</p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-slate-700">Max occurrences</label>
                            <input
                                type="number"
                                min={1}
                                value={form.maxOccurrences}
                                onChange={e => setForm(v => ({ ...v, maxOccurrences: e.target.value }))}
                                placeholder="No limit"
                                className="h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
                            />
                        </div>
                    </div>

                    {/* Default workers */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-700">Default workers</label>
                        <p className="text-xs text-slate-400 -mt-1">Automatically assigned when new shifts are generated.</p>
                        {workersLoading ? (
                            <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
                        ) : workers.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No workers available.</p>
                        ) : (
                            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2">
                                {workers.map(w => (
                                    <label key={w._id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.defaultWorkerIds.includes(w._id)}
                                            onChange={() => toggleWorker(w._id)}
                                            className="rounded border-slate-300 text-[#1E3A5F] focus:ring-[#1E3A5F]/30"
                                        />
                                        <span className="text-sm text-slate-700">{w.fullname}</span>
                                        <span className="text-xs text-slate-400">{w.email}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-white">
                    <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(form)}
                        disabled={!canSubmit || loading}
                        className="h-9 px-5 text-sm font-bold text-white bg-[#1E3A5F] rounded-xl hover:bg-[#162D4A] transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                        {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {loading ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </div>
        </Backdrop>
    )
}

// ─── Pattern card ─────────────────────────────────────────────────────────────

function SchedulePatternCard({ schedule }: { schedule: RecurringDetail }) {
    const FREQ_LABEL: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }

    const rows = [
        { label: 'Repeats', value: FREQ_LABEL[schedule.frequency] ?? schedule.frequency },
        { label: 'Every', value: schedule.interval === 1 ? `1 ${schedule.frequency === 'weekly' ? 'week' : schedule.frequency === 'monthly' ? 'month' : 'day'}` : `${schedule.interval} ${schedule.frequency === 'weekly' ? 'weeks' : schedule.frequency === 'monthly' ? 'months' : 'days'}` },
        schedule.daysOfWeek?.length ? { label: 'Days', value: schedule.daysOfWeek.map((d: number) => DAY_NAMES[d]).join(', ') } : null,
        { label: 'Start date', value: fmtDateLong(schedule.startDate) },
        { label: 'End date', value: schedule.endDate ? fmtDateLong(schedule.endDate) : 'No end date' },
        schedule.maxOccurrences ? { label: 'Max occurrences', value: String(schedule.maxOccurrences) } : null,
        { label: 'Shift time', value: `${schedule.templateJob.startTime}–${schedule.templateJob.endTime}` },
        schedule.generatedUntil ? { label: 'Generated through', value: fmtDateLong(schedule.generatedUntil) } : null,
    ].filter(Boolean) as { label: string; value: string }[]

    return (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 ">
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

function ScheduleMetadataCard({ detail }: { detail: RecurringDetail }) {
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
    onNavigate: (path: string) => void
}) {
    return (
        <button
            onClick={() => onNavigate(`/jobs/${occ._id}`)}
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
                    {occ.requiredWorkers > 0 && occ.status !== 'completed' && occ.status !== 'cancelled' && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Users size={10} /> {occ.requiredWorkers} workers needed
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <JobStatusBadge status={occ.status} />
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
    detail: RecurringDetail
    active: boolean
    onNavigate: (path: string) => void
}) {
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
    const upcoming = detail.occurrences.upcoming
    const past = detail.occurrences.past
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

// ─── Main detail page ─────────────────────────────────────────────────────────

export function RecurringJobDetail() {
    const { id } = useParams() as { id: string }
    const navigate = useNavigate()
    const onNavigate = (path: string) => navigate(path)

    const { schedule, occurrences } = useQuery(recurringJobDetailQuery(id)).data as {
        schedule: ScheduleDoc
        occurrences: RecurringDetail['occurrences']
    }
    const detail: RecurringDetail = { ...schedule, occurrences }
    const active = detail.active

    const [showStop, setShowStop] = useState(false)
    const [showRestart, setShowRestart] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const [restartError, setRestartError] = useState<string | null>(null)

    const { data: editWorkers, isLoading: editWorkersLoading } = useQuery({
        queryKey: ['recurring-edit-workers'],
        queryFn: async () => {
            const { data } = await customFetch.get<{ users: { _id: string; fullname: string; email: string }[] }>(
                '/users/users',
                { params: { role: 'worker', limit: 100 } }
            )
            return data.users
        },
        enabled: showEdit,
    })

    const stopMutation = useMutation({
        mutationFn: (cancelFutureJobs: boolean) =>
            customFetch.patch(`/recurring-jobs/${id}/cancel`, { cancelFutureJobs }),
        onSuccess: ({ data }) => {
            setShowStop(false)
            invalidateSchedule(id)
            toast.success(data.message)
            if (data.notifiedWorkers?.length) {
                toast(`Workers with an already-accepted shift affected: ${data.notifiedWorkers.join(', ')}`, { duration: 7000 })
            }
        },
        onError: (err: any) => toast.error(err.response?.data?.msg ?? 'Failed to stop the schedule.'),
    })

    const restartMutation = useMutation({
        mutationFn: () => customFetch.patch(`/recurring-jobs/${id}/reactivate`),
        onSuccess: ({ data }) => {
            setShowRestart(false)
            setRestartError(null)
            invalidateSchedule(id)
            toast.success(data.message)
        },
        onError: (err: any) => setRestartError(err.response?.data?.msg ?? 'Failed to restart the schedule.'),
    })

    const editMutation = useMutation({
        mutationFn: (form: EditPatternForm) =>
            customFetch.patch(`/recurring-jobs/${id}`, {
                frequency: form.frequency,
                interval: form.interval,
                daysOfWeek: form.frequency === 'weekly' ? form.daysOfWeek : undefined,
                endDate: form.endDate || null,
                // No way to explicitly clear this server-side today — only
                // send it when set, leave the existing value alone otherwise.
                maxOccurrences: form.maxOccurrences ? Number(form.maxOccurrences) : undefined,
                defaultWorkers: form.defaultWorkerIds,
                startTime: form.startTime,
                endTime: form.endTime,
            }),
        onSuccess: ({ data }) => {
            setShowEdit(false)
            invalidateSchedule(id)
            toast.success(
                `Schedule updated. ${data.regenerated} shift${data.regenerated === 1 ? '' : 's'} regenerated under the new pattern — any already accepted by a worker were left as-is.`,
                { duration: 7000 }
            )
        },
        onError: (err: any) => toast.error(err.response?.data?.msg ?? 'Failed to update the schedule.'),
    })

    const endDatePassed = !!detail.endDate && new Date(detail.endDate) < new Date()

    return (
        <div className="p-6 max-w-8xl mx-x-auto">
            {/* Back link */}
            <button
                onClick={() => onNavigate('/jobs/recurring')}
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
                        <ScheduleStatusBadge active={active} />
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                        {describeRecurrence(detail)} · {detail.templateJob.startTime}–{detail.templateJob.endTime}
                        {detail.endDate ? ` · until ${fmtDateLong(detail.endDate)}` : ''}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin size={11} />
                        {detail.templateJob.client ? `${detail.templateJob.client} · ` : ''}{detail.templateJob.location}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setShowEdit(true)}
                        className="h-9 px-4 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        <Edit2 size={13} /> Edit pattern
                    </button>

                    {active ? (
                        <button
                            onClick={() => setShowStop(true)}
                            className="h-9 px-4 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                            <StopCircle size={13} /> Stop schedule
                        </button>
                    ) : (
                        <button
                            onClick={() => { setRestartError(null); setShowRestart(true) }}
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
                        onConfirm={cancelFutureJobs => stopMutation.mutate(cancelFutureJobs)}
                        onClose={() => setShowStop(false)}
                        loading={stopMutation.isPending}
                    />
                )}
                {showRestart && (
                    <RestartScheduleDialog
                        onConfirm={() => restartMutation.mutate()}
                        onClose={() => { setShowRestart(false); setRestartError(null) }}
                        onEditInstead={() => { setShowRestart(false); setRestartError(null); setShowEdit(true) }}
                        blocked={endDatePassed ? "This schedule's end date has already passed. Set a new end date before reactivating." : restartError}
                        loading={restartMutation.isPending}
                    />
                )}
                {showEdit && (
                    <EditPatternDialog
                        detail={detail}
                        workers={editWorkers ?? []}
                        workersLoading={editWorkersLoading}
                        onClose={() => setShowEdit(false)}
                        onSubmit={form => editMutation.mutate(form)}
                        loading={editMutation.isPending}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
