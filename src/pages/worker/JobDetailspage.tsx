import { PriorityBadge, StatusBadge } from "@/components/ui"
import { queryClient } from "@/lib/queryClient"
import { changeWorkerJobStaus } from "@/utils/api-request-functions"
import customFetch from "@/utils/customFetch"
import { formatDate, formatDuration } from "@/utils/date"
import { useShiftStartGate } from "@/hooks/useShiftStartGate"
import { ensureNotificationPermission } from "@/utils/notifications"
import { ensurePushSubscription } from "@/utils/pushSubscription"
import { buildMapUrl, MAP_SERVICES, type MapService } from "@/utils/mapLinks"
import type { CreateJobForm } from "@/utils/types"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, Briefcase, CalendarDays, Check, CheckCircle2, ChevronLeft, Clock, Dot, Loader2, MapPin, Navigation, Timer, X } from "lucide-react"
import { useNavigate, useParams, type LoaderFunctionArgs } from "react-router"
import { useState } from "react"

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

    // The job's over either way — no reason to keep offering directions to it.
    const showDirections = directionsHref && job?.status !== 'completed' && job?.status !== 'declined'

    const heroGradient = job?.status === 'completed'
        ? 'from-emerald-500 to-emerald-600'
        : job?.status === 'declined'
            ? 'from-slate-400 to-slate-500'
            : 'from-[#1E3A5F] to-[#2D5A8E]'

    return (
        <div className="flex flex-col gap-4 pb-4 animate-fade-in">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors -mb-1"
            >
                <ChevronLeft size={16} /> Back
            </button>

            {/* Hero card */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
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
                        <div key={i} className={`flex items-center gap-3 py-3 ${i < infoRows.length - 1 ? 'border-b border-[#F8FAFC]' : ''}`}>
                            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                <row.icon size={14} className="text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{row.label}</p>
                                <p className="text-sm text-slate-800 font-medium truncate">{row.value}</p>
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
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <X size={16} className="text-slate-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700">You declined this shift</p>
                        <p className="text-xs text-slate-500 mt-0.5">This job is no longer assigned to you.</p>
                    </div>
                </div>
            )}

            {/* Primary CTA — the actual decision/action for this job, shown before secondary actions */}
            {job?.status === 'pending' && (
                <div className="grid grid-cols-2 gap-2.5" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={onReject}
                        disabled={loadingAction !== null}
                        className="h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
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
                    className="w-full h-11 rounded-xl bg-[#1E3A5F] text-center  text-white text-sm font-bold hover:bg-[#162D4A] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#1E3A5F]/25"
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
                        className="w-full h-11 rounded-xl bg-[#1b7b3d] text-white text-sm font-bold hover:bg-[#13a166] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#1E3A5F]/25 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loadingAction === 'start' ? <Loader2 size={14} className="animate-spin" /> : <Timer size={14} />} Start Working Job
                    </button>
                ) : (
                    <div className="w-full h-11 rounded-xl bg-slate-100 text-slate-500 text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                        <Timer size={14} className="text-slate-400" />
                        {hasExpired ? "Shift window missed" : `Starts in ${formatDuration(minutesUntilStart ?? 0)}`}
                    </div>
                )
            )}

            {/* Secondary action — directions to the actual job site */}
            {showDirections && (
                <div className="flex flex-col gap-2">
                    <a href={directionsHref} target="_blank" rel="noreferrer">
                        <button className="w-full h-11 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                            <Navigation size={15} className="text-slate-500" />
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
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
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
