import { PriorityBadge, StatusBadge } from "@/components/ui"
import { queryClient } from "@/lib/queryClient"
import { changeWorkerJobStaus, toggleChecklistItem } from "@/utils/api-request-functions"
import customFetch from "@/utils/customFetch"
import { formatDate, formatDuration, formatTimeUntil } from "@/utils/date"
import { useShiftStartGate } from "@/hooks/useShiftStartGate"
import { ensureNotificationPermission } from "@/utils/notifications"
import { ensurePushSubscription } from "@/utils/pushSubscription"
import { buildMapUrl, MAP_SERVICES, type MapService } from "@/utils/mapLinks"
import type { CreateJobForm } from "@/utils/types"
import { useMutation, useQuery } from "@tanstack/react-query"
import { AlertCircle, AlertTriangle, Briefcase, CalendarDays, Check, CheckCircle2, ChevronLeft, Circle, Clock, Dot, ListChecks, Loader2, MapPin, Navigation, Paperclip, RefreshCw, Timer, X } from "lucide-react"
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
export default function JobDetailScreen() {
    const id = useParams().id
    const navigate = useNavigate()

    const job = useQuery(singleWorkerJob(id)).data?.job
    const [loadingAction, setLoadingAction] = useState<'accept' | 'reject' | 'start' | null>(null)
    const { canStart, minutesUntilStart, hasExpired } = useShiftStartGate(job?.date, job?.startTime, job?.endTime)

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
                            <StatusBadge status={job?.status || "pending"} />
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
        </div>
    )
}
