import { Badge, PriorityBadge, StatusBadge } from "@/components/ui"
import { queryClient } from "@/lib/queryClient"
import { changeWorkerJobStaus, requestMissedShiftReview, toggleChecklistItem, withdrawMissedShiftRequest } from "@/utils/api-request-functions"
import customFetch from "@/utils/customFetch"
import { formatDate, formatDuration, formatTimeUntil } from "@/utils/date"
import { useShiftStartGate } from "@/hooks/useShiftStartGate"
import { ensureNotificationPermission } from "@/utils/notifications"
import { ensurePushSubscription } from "@/utils/pushSubscription"
import { buildMapUrl, MAP_SERVICES, type MapService } from "@/utils/mapLinks"
import type { CreateJobForm } from "@/utils/types"
import { useMutation, useQuery } from "@tanstack/react-query"
import { AlertCircle, AlertTriangle, Briefcase, CalendarDays, Check, CheckCircle2, ChevronLeft, Circle, Clock, Dot, ListChecks, Loader2, MapPin, Navigation, Paperclip, RefreshCw, Send, Timer, X } from "lucide-react"
import { useCompanyPlan } from "@/hooks/useCompanyPlan"
import { useNavigate, useParams, type LoaderFunctionArgs } from "react-router"
import { useState } from "react"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTrigger
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
const PREFERRED_MAP_STORAGE_KEY = "preferredMapService"
const singleWorkerJob = (id: string | undefined) => {
    return ({
        queryKey: ["job", id],
        queryFn: async (): Promise<{ job: CreateJobForm }> => {
            const { data } = await customFetch.get(`/workers/${id}`)
            return data
        }
    })
}
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
    const search = Object.fromEntries([
        ...new URL(request.url).searchParams.entries(),
    ]);
    await queryClient.ensureQueryData(singleWorkerJob(params.id!))
    return ({
        searchValues: { ...search }
    })
}
const MISSED_SHIFT_REASON_LABELS: Record<string, string> = {
    phone_died: "Phone died",
    no_signal: "No signal",
    forgot_to_clock_in: "Forgot to clock in",
    other: "Other",
}

// Computes and renders whichever of the 5 missed-shift states applies
// right now (Main/Pending/Approved/Declined/Closed) — a pure function of
// assignment fields + the current time, same component split as
// timeshift-mobile's own copy of this screen.
function MissedShiftCard({
    job,
    assignment,
    onRequestReview,
    onWithdraw,
    withdrawing,
}: {
    job: { title: string }
    assignment: NonNullable<CreateJobForm["workerJobDetails"]>
    onRequestReview: () => void
    onWithdraw: () => void
    withdrawing: boolean
}) {
    const reviewStatus = assignment.missedShiftReviewStatus ?? "none"
    const deadline = assignment.missedShiftReviewDeadline ? new Date(assignment.missedShiftReviewDeadline) : null
    const isClosed = !!deadline && new Date() > deadline && reviewStatus !== "approved"

    if (reviewStatus === "approved") {
        const approvedStart = assignment.missedShiftApprovedStartTime
        const approvedEnd = assignment.missedShiftApprovedEndTime
        const timesChanged = approvedStart !== assignment.missedShiftRequestedStartTime || approvedEnd !== assignment.missedShiftRequestedEndTime
        return (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-emerald-800">
                            Hours approved{assignment.approvedMinutes != null ? ` · ${formatDuration(assignment.approvedMinutes)} recorded` : ""}
                        </p>
                        <p className="text-xs text-emerald-700 mt-0.5">
                            {timesChanged ? "Your manager changed the time. " : ""}These hours are now on your timesheet.
                        </p>
                    </div>
                </div>
                <dl className="bg-card border border-emerald-200 rounded-xl px-3 divide-y divide-emerald-100">
                    {timesChanged && (
                        <div className="flex items-center justify-between py-2 text-xs">
                            <dt className="text-muted-foreground">You asked for</dt>
                            <dd className="font-semibold text-muted-foreground line-through">{assignment.missedShiftRequestedStartTime}–{assignment.missedShiftRequestedEndTime}</dd>
                        </div>
                    )}
                    <div className="flex items-center justify-between py-2 text-xs">
                        <dt className="text-muted-foreground">Approved</dt>
                        <dd className="font-bold text-foreground">{approvedStart}–{approvedEnd}</dd>
                    </div>
                    {!!assignment.missedShiftReviewedBy && (
                        <div className="flex items-center justify-between py-2 text-xs">
                            <dt className="text-muted-foreground">By</dt>
                            <dd className="font-bold text-foreground">
                                {assignment.missedShiftReviewedBy.fullname}
                                {assignment.missedShiftReviewedAt ? ` · ${formatDate(assignment.missedShiftReviewedAt, "ddd D MMM, HH:mm")}` : ""}
                            </dd>
                        </div>
                    )}
                </dl>
                {!!assignment.missedShiftReviewNote && (
                    <p className="text-xs text-emerald-700 leading-relaxed">
                        <span className="font-bold">Manager note: </span>{assignment.missedShiftReviewNote}
                    </p>
                )}
            </div>
        )
    }

    if (reviewStatus === "pending") {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <Clock size={16} className="text-amber-700" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-800">Review requested</p>
                        <p className="text-xs text-amber-700 mt-0.5">Waiting for your manager. You&apos;ll get a notification when they decide.</p>
                    </div>
                </div>
                <dl className="bg-card border border-amber-200 rounded-xl px-3 divide-y divide-amber-100">
                    <div className="flex items-center justify-between py-2 text-xs">
                        <dt className="text-muted-foreground">Hours</dt>
                        <dd className="font-bold text-foreground">{assignment.missedShiftRequestedStartTime}–{assignment.missedShiftRequestedEndTime}</dd>
                    </div>
                    <div className="flex items-center justify-between py-2 text-xs">
                        <dt className="text-muted-foreground">Reason</dt>
                        <dd className="font-bold text-foreground">{MISSED_SHIFT_REASON_LABELS[assignment.missedShiftReason ?? ""] ?? assignment.missedShiftReason}</dd>
                    </div>
                    {!!assignment.missedShiftRequestedAt && (
                        <div className="flex items-center justify-between py-2 text-xs">
                            <dt className="text-muted-foreground">Sent</dt>
                            <dd className="font-bold text-foreground">{formatDate(assignment.missedShiftRequestedAt, "ddd D MMM, HH:mm")}</dd>
                        </div>
                    )}
                </dl>
                <Button type="button" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100" disabled={withdrawing} onClick={onWithdraw}>
                    {withdrawing ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
                    Withdraw request
                </Button>
            </div>
        )
    }

    if (isClosed) {
        return (
            <div className="bg-card border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <AlertTriangle size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground">Review window closed</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {deadline ? `Requests for this shift closed on ${formatDate(deadline, "ddd D MMM, HH:mm")} (48 hours after it ended). ` : ""}
                            Contact your manager if you still need it reviewed.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (reviewStatus === "declined") {
        return (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <X size={16} className="text-red-700" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-red-800">Request declined</p>
                        <p className="text-xs text-red-700 mt-0.5">No hours were recorded for this shift.</p>
                    </div>
                </div>
                {!!assignment.missedShiftReviewNote && (
                    <div className="bg-card border border-red-200 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                            Manager note{assignment.missedShiftReviewedBy ? ` · ${assignment.missedShiftReviewedBy.fullname}` : ""}
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">{assignment.missedShiftReviewNote}</p>
                    </div>
                )}
                <Button type="button" className="bg-[var(--primary)] hover:bg-primary/90" onClick={onRequestReview}>
                    Send a new request
                </Button>
                {!!deadline && (
                    <p className="flex items-center gap-1.5 text-xs text-red-700">
                        <Clock size={13} /> You can resend until {formatDate(deadline, "ddd D MMM, HH:mm")}
                    </p>
                )}
            </div>
        )
    }

    // "none" — the default state right after the shift gets flagged, no
    // request submitted yet.
    return (
        <>
            <div className="h-11 rounded-xl bg-red-50 flex items-center justify-center gap-2 text-red-700 text-sm font-semibold">
                <AlertTriangle size={14} /> Shift window missed
            </div>
            <div className="bg-card border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-3">
                <div>
                    <p className="text-sm font-bold text-foreground">Worked this shift but couldn&apos;t clock in?</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Send your hours to your manager. Nothing is paid until they approve it.</p>
                </div>
                <Button type="button" className="bg-[var(--primary)] hover:bg-primary/90" onClick={onRequestReview}>
                    <Send size={14} className="mr-2" /> Request review
                </Button>
                {!!deadline && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-2">
                        <Clock size={13} className="text-amber-700 shrink-0" />
                        <p className="text-xs text-amber-800">Request by <span className="font-bold">{formatDate(deadline, "ddd D MMM, HH:mm")}</span></p>
                    </div>
                )}
            </div>
        </>
    )
}

// The "Request a review" drawer — same Drawer component this screen
// already uses for Cancel/Release, defaulting start/end to the job's
// scheduled window.
function MissedShiftRequestDrawer({
    open,
    onOpenChange,
    job,
    loading,
    onSubmit,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    job: { title: string; startTime: string; endTime: string } | undefined
    loading: boolean
    onSubmit: (input: { startTime: string; endTime: string; reason: string; note?: string }) => void
}) {
    const [startTime, setStartTime] = useState(job?.startTime ?? "")
    const [endTime, setEndTime] = useState(job?.endTime ?? "")
    const [reason, setReason] = useState("phone_died")
    const [note, setNote] = useState("")

    return (
        <Drawer open={open} onOpenChange={o => {
            onOpenChange(o)
            if (o) {
                setStartTime(job?.startTime ?? "")
                setEndTime(job?.endTime ?? "")
                setReason("phone_died")
                setNote("")
            }
        }}>
            <DrawerTrigger asChild className="hidden"><Button variant="outline">Open</Button></DrawerTrigger>
            <DrawerContent className="max-w-md mx-auto">
                <DrawerHeader className="text-left">
                    <DrawerDescription />
                </DrawerHeader>
                <div className="px-4 pb-2">
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex flex-col gap-4">
                        <div>
                            <h3 className="text-sm font-bold text-foreground">Request a review</h3>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {job?.title} · scheduled {job?.startTime}–{job?.endTime}. Your manager will confirm the hours.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="missedStart">Started</Label>
                                <input
                                    id="missedStart"
                                    type="text"
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                    placeholder="HH:mm"
                                    disabled={loading}
                                    className="h-11 w-full rounded-xl border border-border bg-muted px-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="missedEnd">Finished</Label>
                                <input
                                    id="missedEnd"
                                    type="text"
                                    value={endTime}
                                    onChange={e => setEndTime(e.target.value)}
                                    placeholder="HH:mm"
                                    disabled={loading}
                                    className="h-11 w-full rounded-xl border border-border bg-muted px-3 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                                />
                            </div>
                        </div>
                        <p className="-mt-2 text-xs text-muted-foreground">Must be within {job?.startTime}–{job?.endTime}</p>

                        <div className="space-y-2">
                            <Label>What happened?</Label>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(MISSED_SHIFT_REASON_LABELS).map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        disabled={loading}
                                        onClick={() => setReason(value)}
                                        className={`h-9 px-3.5 rounded-full border text-xs font-semibold transition-colors ${reason === value
                                            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="missedNote">
                                Note <span className="font-normal text-muted-foreground">optional</span>
                            </Label>
                            <Textarea
                                id="missedNote"
                                value={note}
                                onChange={e => setNote(e.target.value.slice(0, 1000))}
                                placeholder="Anything your manager should know"
                                className="min-h-[80px] resize-none"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" disabled={loading} onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="flex-1 bg-[var(--primary)] hover:bg-primary/90"
                                disabled={loading || !startTime || !endTime}
                                onClick={() => onSubmit({ startTime, endTime, reason, note: note.trim() || undefined })}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Submit request
                            </Button>
                        </div>
                    </div>
                </div>
                <DrawerFooter className="pt-2">
                    <DrawerClose asChild><Button variant="outline">Close</Button></DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}

export default function JobDetailScreen() {
    const id = useParams().id
    const navigate = useNavigate()

    const job = useQuery(singleWorkerJob(id)).data?.job
    const [loadingAction, setLoadingAction] = useState<'accept' | 'reject' | 'start' | null>(null)
    const { canStart, minutesUntilStart, hasExpired } = useShiftStartGate(job?.date, job?.startTime, job?.endTime)

    // Missed shift (never clocked in at all) — see markMissedShifts.ts on
    // the backend. missedShiftDetectedAt being set is the actual signal;
    // job.status stays "accepted" the whole time, nothing else moves it.
    const assignment = job?.workerJobDetails
    const isMissedShift = !!assignment?.missedShiftDetectedAt && assignment.missedShiftReviewStatus !== "approved"
    const [showMissedShiftRequest, setShowMissedShiftRequest] = useState(false)
    const [isSubmittingMissedShift, setIsSubmittingMissedShift] = useState(false)
    const [isWithdrawingMissedShift, setIsWithdrawingMissedShift] = useState(false)

    const submitMissedShiftRequest = async (input: { startTime: string; endTime: string; reason: string; note?: string }) => {
        if (!id || !assignment?._id) return
        setIsSubmittingMissedShift(true)
        const ok = await requestMissedShiftReview(id, assignment._id, input)
        setIsSubmittingMissedShift(false)
        if (ok) setShowMissedShiftRequest(false)
    }

    const withdrawMissedShift = async () => {
        if (!id || !assignment?._id) return
        setIsWithdrawingMissedShift(true)
        await withdrawMissedShiftRequest(id, assignment._id)
        setIsWithdrawingMissedShift(false)
    }

    const checklistMutation = useMutation({
        mutationFn: ({ itemId, done }: { itemId: string; done: boolean }) => toggleChecklistItem(id!, itemId, done),
    })

    const onAccept = async () => {
        setLoadingAction('accept')
        await changeWorkerJobStaus(job!._id!, "accepted")
        setLoadingAction(null)

        // Shift reminders are sent well before the shift starts — i.e.
        // before this job would ever show up as "active" — so the push
        // subscription has to exist from the moment the shift is accepted,
        // not only once the worker clocks in. Best-effort: a denied prompt
        // or failed subscribe shouldn't block accepting the shift.
        ensureNotificationPermission().then(permission => {
            if (permission === "granted") ensurePushSubscription().catch(() => { })
        })
    }

    const onReject = async () => {
        setLoadingAction('reject')
        await changeWorkerJobStaus(job!._id!, "declined")
        setLoadingAction(null)
    }

    const startWorking = async () => {
        setLoadingAction('start')
        await changeWorkerJobStaus(job!._id!, "in-progress")
        setLoadingAction(null)
    }

    const [cancellationReason, setCancellationReason] = useState('')
    const [isCancelling, setIsCancelling] = useState(false)

    const handleCancelShift = async () => {
        setIsCancelling(true)
        const result = await changeWorkerJobStaus(job!._id!, "cancelled", { reason: cancellationReason.trim() || undefined })
        setIsCancelling(false)
        if (result.success) {
            setCancellationReason('')
            setOpen(false)
        }
    }

    // "Release" — same underlying cancel, but also reopens the shift for
    // another worker to self-claim instead of leaving the manager to
    // reassign it. Gated behind the same plan feature as open shifts
    // generally, since that's what makes the release actually visible.
    const { hasFeature } = useCompanyPlan()
    const canRelease = hasFeature('openShifts')
    const [releaseOpen, setReleaseOpen] = useState(false)
    const [releaseReason, setReleaseReason] = useState('')
    const [isReleasing, setIsReleasing] = useState(false)

    const handleReleaseShift = async () => {
        setIsReleasing(true)
        const result = await changeWorkerJobStaus(job!._id!, "cancelled", {
            reason: releaseReason.trim() || undefined,
            release: true,
        })
        setIsReleasing(false)
        if (result.success) {
            setReleaseReason('')
            setReleaseOpen(false)
        }
    }

    // Shift time and client are already shown in the hero card above — no need to repeat them here
    const infoRows = [
        { icon: Timer, label: 'Duration', value: formatDuration(job?.minutes) },
        { icon: MapPin, label: 'Location', value: job?.location },
        { icon: CalendarDays, label: 'Date', value: formatDate(job?.date, "dddd, MMMM D, YYYY") },
    ]

    const [preferredMap, setPreferredMap] = useState<MapService>(
        () => (localStorage.getItem(PREFERRED_MAP_STORAGE_KEY) as MapService | null) ?? "google"
    )
    const chooseMapService = (service: MapService) => {
        setPreferredMap(service)
        localStorage.setItem(PREFERRED_MAP_STORAGE_KEY, service)
    }
    const directionsHref = buildMapUrl(preferredMap, {
        lat: job?.coordinates?.lat,
        lng: job?.coordinates?.lng,
        address: job?.address || job?.location,
    })
    const [open, setOpen] = useState(false)

    // The job's over either way — no reason to keep offering directions to it.
    const showDirections = directionsHref && job?.status !== 'completed' && job?.status !== 'declined'

    const heroGradient = job?.status === 'completed'
        ? 'from-emerald-500 to-emerald-600'
        : job?.status === 'declined'
            ? 'from-slate-400 to-slate-500'
            : 'from-[var(--primary)] to-[#2D5A8E]'

    return (
        <div className="flex flex-col gap-4 pb-4 animate-fade-in">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -mb-1"
            >
                <ChevronLeft size={16} /> Back
            </button>

            {/* Hero card */}
            <div className="bg-card rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
                <div className={`bg-gradient-to-br ${heroGradient} p-5 relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-[0.05]"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="relative">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">{job?.client?.name}</p>
                                <h2 className="text-base font-bold text-white leading-snug">{job?.title}</h2>
                            </div>
                            {assignment?.missedShiftReviewStatus === "pending" ? (
                                <Badge variant="warning">In review</Badge>
                            ) : isMissedShift ? (
                                <Badge variant="danger">Missed</Badge>
                            ) : (
                                <StatusBadge status={job?.status || "pending"} />
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                                <Clock size={13} className="text-white/60" />
                                <span className="text-sm font-bold text-white">{job?.startTime}</span>
                            </div>
                            <div className="w-8 h-px bg-white/20" />
                            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                                <Clock size={13} className="text-white/60" />
                                <span className="text-sm font-bold text-white">{job?.endTime}</span>
                            </div>
                            <PriorityBadge priority={job?.priority ?? "low"} />
                        </div>
                    </div>
                </div>

                <div className="p-4 flex flex-col gap-0">
                    {infoRows.map((row, i) => (
                        <div key={i} className={`flex items-center gap-3 py-3 ${i < infoRows.length - 1 ? 'border-b border-border' : ''}`}>
                            <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                                <row.icon size={14} className="text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{row.label}</p>
                                <p className="text-sm text-foreground font-medium truncate">{row.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {!!assignment?.missedShiftDetectedAt && (
                <MissedShiftCard
                    job={job!}
                    assignment={assignment}
                    onRequestReview={() => setShowMissedShiftRequest(true)}
                    onWithdraw={withdrawMissedShift}
                    withdrawing={isWithdrawingMissedShift}
                />
            )}

            {/* Notes */}
            {job?.description && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={14} className="text-amber-600" />
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Manager Note</p>
                    </div>
                    <p className="text-sm text-amber-800 leading-relaxed">{job?.description}</p>
                </div>
            )}

            {job?.instructions && (
                <div className="bg-card border border-[var(--border)] rounded-2xl p-4">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-2">Instructions</p>
                    <p className="text-sm text-foreground leading-relaxed">{job.instructions}</p>
                </div>
            )}

            {job?.checklist && job.checklist.length > 0 && (
                <div className="bg-card border border-[var(--border)] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <ListChecks size={13} className="text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                            Checklist · {job.checklist.filter(i => i.done).length}/{job.checklist.length}
                        </p>
                    </div>
                    <div className="flex flex-col gap-1">
                        {job.checklist.map((item, i) => (
                            <button
                                key={item._id ?? i}
                                type="button"
                                disabled={!item._id || checklistMutation.isPending}
                                onClick={() => item._id && checklistMutation.mutate({ itemId: item._id, done: !item.done })}
                                className="flex items-center gap-3 py-2 text-left disabled:opacity-60"
                            >
                                {item.done
                                    ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                                    : <Circle size={18} className="text-slate-300 shrink-0" />
                                }
                                <span className={`text-sm flex-1 ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                    {item.text}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {job?.attachment && (
                <a
                    href={job.attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 bg-card border border-[var(--border)] rounded-2xl p-4 hover:bg-muted transition-colors"
                >
                    <Paperclip size={14} className="text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Attachment</p>
                        <p className="text-sm text-foreground font-medium truncate underline underline-offset-2">
                            {job.attachment.filename}
                        </p>
                    </div>
                </a>
            )}

            {job?.siteSnapshot && (job.siteSnapshot.contact?.name || job.siteSnapshot.accessInstructions || job.siteSnapshot.parkingInstructions) && (
                <div className="bg-card border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-3">
                    {job.siteSnapshot.contact?.name && (
                        <div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Site contact</p>
                            <p className="text-sm font-medium text-foreground">{job.siteSnapshot.contact.name}</p>
                            {job.siteSnapshot.contact.phone && (
                                <a href={`tel:${job.siteSnapshot.contact.phone}`} className="text-xs text-muted-foreground">{job.siteSnapshot.contact.phone}</a>
                            )}
                        </div>
                    )}
                    {job.siteSnapshot.accessInstructions && (
                        <div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Access instructions</p>
                            <p className="text-sm text-foreground leading-relaxed">{job.siteSnapshot.accessInstructions}</p>
                        </div>
                    )}
                    {job.siteSnapshot.parkingInstructions && (
                        <div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-1">Parking</p>
                            <p className="text-sm text-foreground leading-relaxed">{job.siteSnapshot.parkingInstructions}</p>
                        </div>
                    )}
                </div>
            )}

            {job?.status === 'completed' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-emerald-800">Shift completed</p>
                        <p className="text-xs text-emerald-700 mt-0.5">Your hours have been recorded and sent to your manager.</p>
                    </div>
                </div>
            )}

            {job?.status === 'declined' && (
                <div className="bg-muted border border-border rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <X size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground">You declined this shift</p>
                        <p className="text-xs text-muted-foreground mt-0.5">This job is no longer assigned to you.</p>
                    </div>
                </div>
            )}

            {job?.status === 'cancelled' && (
                <div className="bg-muted border border-border rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <X size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground">You cancelled this shift</p>
                        <p className="text-xs text-muted-foreground mt-0.5">This job is no longer assigned to you.</p>
                    </div>
                </div>
            )}

            {/* Primary CTA — the actual decision/action for this job, shown before secondary actions */}
            {job?.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2.5" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={onReject}
                        disabled={loadingAction !== null}
                        className="h-11 rounded-xl bg-muted border border-border text-muted-foreground text-sm font-semibold hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loadingAction === 'reject' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Decline
                    </button>
                    <button
                        onClick={onAccept}
                        disabled={loadingAction !== null}
                        className="h-11 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loadingAction === 'accept' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Accept
                    </button>
                </div>
            )}

            {job?.status === 'in-progress' && (
                <button
                    onClick={e => {
                        e.stopPropagation();
                        e.preventDefault()
                        navigate(`/worker/clock`)
                    }}
                    className="w-full h-11 rounded-xl bg-[var(--primary)] text-center  text-white text-sm font-bold hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[var(--primary)]/25"
                >
                    <Dot className="text-green-400 animate-ping" size={50} /> Job Live
                </button>
            )}
            {job?.status === 'accepted' && (
                canStart ? (
                    <button
                        disabled={loadingAction !== null}
                        onClick={e => {
                            e.stopPropagation();
                            e.preventDefault()
                            startWorking()
                        }}
                        className="w-full h-11 rounded-xl bg-[#1b7b3d] text-white text-sm font-bold hover:bg-[#13a166] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[var(--primary)]/25 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loadingAction === 'start' ? <Loader2 size={14} className="animate-spin" /> : <Timer size={14} />} Start Working Job
                    </button>
                ) : (
                    <div className="w-full h-11 rounded-xl bg-muted text-muted-foreground text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                        <Timer size={14} className="text-muted-foreground" />
                        {hasExpired ? "Shift window missed" : `Starts in ${formatTimeUntil(minutesUntilStart ?? 0)}`}
                    </div>
                )
            )}
            {job?.status === 'accepted' && !hasExpired && canRelease && (
                <>
                    <Drawer open={releaseOpen} onOpenChange={o => { setReleaseOpen(o); if (!o) setReleaseReason('') }}>
                        <DrawerTrigger asChild className="hidden">
                            <Button variant="outline">Open</Button>
                        </DrawerTrigger>
                        <DrawerContent className="max-w-md mx-auto">
                            <DrawerHeader className="text-left">
                                <DrawerDescription />
                            </DrawerHeader>
                            <div className="px-4">
                                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                    <div className="mb-4">
                                        <h3 className="text-sm font-bold text-foreground">
                                            Release shift
                                        </h3>
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            Can't work this shift? Release it and it goes straight into open
                                            shifts for another worker to pick up — no need to wait on your manager.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="releaseReason">
                                                Reason
                                                <span className="ml-1 font-normal text-muted-foreground">
                                                    optional
                                                </span>
                                            </Label>

                                            <Textarea
                                                id="releaseReason"
                                                value={releaseReason}
                                                onChange={(e) => setReleaseReason(e.target.value)}
                                                placeholder="e.g. I'm unwell, transport issue, personal emergency..."
                                                className="min-h-[100px] resize-none"
                                                maxLength={300}
                                            />

                                            <div className="flex justify-end">
                                                <span className="text-[11px] text-muted-foreground">
                                                    {releaseReason.length}/300
                                                </span>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                                            <div className="flex items-start gap-2">
                                                <RefreshCw
                                                    size={16}
                                                    className="mt-0.5 shrink-0 text-blue-600"
                                                />

                                                <p className="text-xs leading-relaxed text-blue-800">
                                                    You'll be removed from this shift and it becomes an open shift
                                                    for any eligible worker to claim. Your manager is notified either way.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                disabled={isReleasing}
                                                onClick={() => setReleaseOpen(false)}
                                            >
                                                Keep shift
                                            </Button>

                                            <Button
                                                type="button"
                                                className="flex-1"
                                                disabled={isReleasing}
                                                onClick={handleReleaseShift}
                                            >
                                                {isReleasing ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Releasing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        Release shift
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DrawerFooter className="pt-2">
                                <DrawerClose asChild>
                                    <Button variant="outline">Close</Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer>
                    <button
                        type="button"
                        onClick={() => setReleaseOpen(o => !o)}
                        className="
        w-full h-10 rounded-xl
        border border-blue-200
        bg-blue-50
        text-blue-700
        text-sm font-semibold
        hover:bg-blue-100
        transition-colors
      "
                    >
                        Release Shift
                    </button>
                </>
            )}
            {job?.status === 'accepted' && !hasExpired && (
                <>
                    <Drawer open={open} onOpenChange={o => { setOpen(o); if (!o) setCancellationReason('') }}>
                        <DrawerTrigger asChild className="hidden">
                            <Button variant="outline">Open</Button>
                        </DrawerTrigger>
                        <DrawerContent className="max-w-md mx-auto">
                            <DrawerHeader className="text-left">
                                <DrawerDescription />
                            </DrawerHeader>
                            <div className="px-4">
                                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                    <div className="mb-4">
                                        <h3 className="text-sm font-bold text-foreground">
                                            Cancel shift
                                        </h3>
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            If you can no longer work this shift, you can cancel it here.
                                            Your manager will be notified.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="cancellationReason">
                                                Reason
                                                <span className="ml-1 font-normal text-muted-foreground">
                                                    optional
                                                </span>
                                            </Label>

                                            <Textarea
                                                id="cancellationReason"
                                                value={cancellationReason}
                                                onChange={(e) => setCancellationReason(e.target.value)}
                                                placeholder="e.g. I'm unwell, transport issue, personal emergency..."
                                                className="min-h-[100px] resize-none"
                                                maxLength={300}
                                            />

                                            <div className="flex justify-end">
                                                <span className="text-[11px] text-muted-foreground">
                                                    {cancellationReason.length}/300
                                                </span>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle
                                                    size={16}
                                                    className="mt-0.5 shrink-0 text-amber-600"
                                                />

                                                <p className="text-xs leading-relaxed text-amber-800">
                                                    Cancelling this shift will remove you from the assignment.
                                                    Your manager will be notified and may need to find a replacement.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                disabled={isCancelling}
                                                onClick={() => setOpen(false)}
                                            >
                                                Keep shift
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="destructive"
                                                className="flex-1"
                                                disabled={isCancelling}
                                                onClick={handleCancelShift}
                                            >
                                                {isCancelling ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Cancelling...
                                                    </>
                                                ) : (
                                                    <>
                                                        <X className="mr-2 h-4 w-4" />
                                                        Cancel shift
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DrawerFooter className="pt-2">
                                <DrawerClose asChild>
                                    <Button variant="outline">Close</Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer>
                    <button
                        type="button"
                        onClick={() => setOpen(o => !o)}
                        className="
        w-full h-10 rounded-xl
        border border-amber-200
        bg-amber-50
        text-amber-700
        text-sm font-semibold
        hover:bg-amber-100
        transition-colors
      "
                    >
                        Cancel Shift
                    </button>
                </>
            )}

            {/* Secondary action — directions to the actual job site */}
            {showDirections && (
                <div className="flex flex-col gap-2">
                    <a href={directionsHref} target="_blank" rel="noreferrer">
                        <button className="w-full h-11 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2">
                            <Navigation size={15} className="text-muted-foreground" />
                            Get Directions via {MAP_SERVICES.find(s => s.id === preferredMap)?.label}
                        </button>
                    </a>
                    <div className="flex items-center justify-center gap-1.5">
                        {MAP_SERVICES.map(service => (
                            <button
                                key={service.id}
                                type="button"
                                onClick={() => chooseMapService(service.id)}
                                className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${preferredMap === service.id
                                    ? 'bg-slate-800 text-white'
                                    : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                {service.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <MissedShiftRequestDrawer
                open={showMissedShiftRequest}
                onOpenChange={setShowMissedShiftRequest}
                job={job}
                loading={isSubmittingMissedShift}
                onSubmit={submitMissedShiftRequest}
            />
        </div>
    )
}
