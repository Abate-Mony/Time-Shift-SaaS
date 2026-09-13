import { changeWorkerJobStaus } from "@/utils/api-request-functions"
import { formatDate, formatDuration, formatTimeUntil } from "@/utils/date"
import type { CreateJobForm } from "@/utils/types"
import { useShiftStartGate } from "@/hooks/useShiftStartGate"
import {
    AlertCircle,
    CalendarDays,
    Check,
    Clock,
    Dot,
    Loader2,
    MapPin,
    Timer,
    X,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { StatusBadge } from "./ui"

export default function JobCard({
    job,
}: {
    job: CreateJobForm
}) {
    const statusColor: Record<string, string> = {
        "in-progress": "bg-blue-500",
        assigned: "bg-violet-500",
        completed: "bg-emerald-500",
        pending: "bg-amber-500",
        declined: "bg-rose-500",
        accepted: "bg-green-500",
    }

    const accent = statusColor[job.status || "completed"] ?? "bg-slate-400"

    const navigate = useNavigate()

    const {
        canStart,
        minutesUntilStart,
        hasExpired,
    } = useShiftStartGate(job.date, job.startTime, job.endTime)

    const [loadingAction, setLoadingAction] = useState<
        "accept" | "reject" | "start" | null
    >(null)

    const [actionError, setActionError] = useState<string | null>(null)
    const [errorNonce, setErrorNonce] = useState(0)

    const [showDeclineModal, setShowDeclineModal] = useState(false)
    const [declineReason, setDeclineReason] = useState("")

    const raiseError = (message: string) => {
        setActionError(message)
        setErrorNonce((n) => n + 1)
    }

    useEffect(() => {
        if (!actionError) return

        const id = setTimeout(() => {
            setActionError(null)
        }, 5000)

        return () => clearTimeout(id)
    }, [actionError, errorNonce])

    useEffect(() => {
        if (!showDeclineModal) return

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && loadingAction !== "reject") {
                setShowDeclineModal(false)
                setDeclineReason("")
            }
        }

        window.addEventListener("keydown", onKeyDown)

        return () => {
            window.removeEventListener("keydown", onKeyDown)
        }
    }, [showDeclineModal, loadingAction])

    const onAccept = async () => {
        setLoadingAction("accept")
        setActionError(null)

        const result = await changeWorkerJobStaus(job._id!, "accepted")

        if (!result.success) {
            raiseError(
                result.message ?? "Couldn't accept this job. Try again."
            )
        }

        setLoadingAction(null)
    }

    const onReject = async () => {
        setLoadingAction("reject")
        setActionError(null)

        /*
         * If your backend later supports a decline reason, pass
         * `declineReason.trim()` through changeWorkerJobStaus here.
         *
         * For now, the modal confirms the action and captures the reason
         * without changing the existing API signature.
         */
        const result = await changeWorkerJobStaus(job._id!, "declined")

        if (!result.success) {
            raiseError(
                result.message ?? "Couldn't decline this job. Try again."
            )
            setLoadingAction(null)
            return
        }

        setShowDeclineModal(false)
        setDeclineReason("")
        setLoadingAction(null)
    }

    const startWorking = async () => {
        setLoadingAction("start")
        setActionError(null)

        const result = await changeWorkerJobStaus(job._id!, "in-progress")

        if (!result.success) {
            raiseError(
                result.message ?? "Couldn't start this job. Try again."
            )
        }

        setLoadingAction(null)
    }

    const openDeclineModal = () => {
        setActionError(null)
        setShowDeclineModal(true)
    }

    const closeDeclineModal = () => {
        if (loadingAction === "reject") return

        setShowDeclineModal(false)
        setDeclineReason("")
    }

    return (
        <>
            <div
                onClick={() => navigate(`/worker/jobs/${job._id}`)}
                className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
            >
                {/* Accent stripe */}
                <div className={`h-1 ${accent}`} />

                <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 leading-snug">
                                {job.title}
                            </p>

                            {job.client?.name && (
                                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                    {job.client.name}
                                </p>
                            )}
                        </div>

                        <StatusBadge status={job.status!} />
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                                <CalendarDays
                                    size={11}
                                    className="text-slate-400"
                                />
                            </div>

                            {formatDate(job.date, "ddd, D MMM")}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                                <Clock
                                    size={11}
                                    className="text-slate-400"
                                />
                            </div>

                            {job.startTime} – {job.endTime}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 col-span-2">
                            <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                                <Timer
                                    size={11}
                                    className="text-slate-400"
                                />
                            </div>

                            {formatDuration(job.minutes)} shift
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 col-span-2">
                            <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                                <MapPin
                                    size={11}
                                    className="text-slate-400"
                                />
                            </div>

                            <span className="truncate">
                                {job.location}
                            </span>
                        </div>
                    </div>

                    {job.description && (
                        <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                            <AlertCircle
                                size={12}
                                className="text-amber-500 shrink-0 mt-0.5"
                            />

                            <p className="text-xs text-amber-700 leading-relaxed">
                                {job.description}
                            </p>
                        </div>
                    )}

                    {actionError && (
                        <div
                            className="mt-3 rounded-xl bg-red-50 border border-red-100 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start gap-2 px-3 py-2">
                                <AlertCircle
                                    size={12}
                                    className="text-red-500 shrink-0 mt-0.5"
                                />

                                <p className="text-xs text-red-600 leading-relaxed">
                                    {actionError}
                                </p>
                            </div>

                            <div className="h-0.5 bg-red-100">
                                <div
                                    key={errorNonce}
                                    className="h-full bg-red-400 animate-shrink-5s"
                                />
                            </div>
                        </div>
                    )}

                    {/* Pending actions */}
                    {job.status === "pending" && (
                        <div
                            className="mt-4 flex items-center gap-3"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={openDeclineModal}
                                disabled={loadingAction !== null}
                                className="h-11 px-5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <X size={14} />
                                Decline
                            </button>

                            <button
                                type="button"
                                onClick={onAccept}
                                disabled={loadingAction !== null}
                                className="flex-1 h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                {loadingAction === "accept" ? (
                                    <Loader2
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Check size={15} />
                                )}

                                {loadingAction === "accept"
                                    ? "Accepting..."
                                    : "Accept shift"}
                            </button>
                        </div>
                    )}

                    {job.status === "in-progress" && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                navigate("/worker/clock")
                            }}
                            className="mt-4 w-full h-11 rounded-xl bg-[#1E3A5F] text-center text-white text-sm font-bold hover:bg-[#162D4A] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#1E3A5F]/25"
                        >
                            <Dot
                                className="text-green-400 animate-ping"
                                size={50}
                            />
                            Job Live
                        </button>
                    )}

                    {job.status === "accepted" &&
                        (canStart ? (
                            <button
                                type="button"
                                disabled={loadingAction !== null}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    e.preventDefault()
                                    startWorking()
                                }}
                                className="mt-4 w-full h-11 rounded-xl bg-[#1b7b3d] text-white text-sm font-bold hover:bg-[#13a166] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#1E3A5F]/25 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loadingAction === "start" ? (
                                    <Loader2
                                        size={14}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Timer size={14} />
                                )}

                                {loadingAction === "start"
                                    ? "Starting..."
                                    : "Start working"}
                            </button>
                        ) : (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="mt-4 w-full h-11 rounded-xl bg-slate-100 text-slate-500 text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
                            >
                                <Timer
                                    size={14}
                                    className="text-slate-400"
                                />

                                {hasExpired
                                    ? "Shift window missed"
                                    : `Starts in ${formatTimeUntil(
                                          minutesUntilStart ?? 0
                                      )}`}
                            </div>
                        ))}
                </div>
            </div>

            {/* Decline confirmation */}
            {showDeclineModal && (
                <div
                    className="fixed inset-0 z-200 flex items-end sm:items-center justify-center bg-slate-950/35 backdrop-blur-[2px] px-0 sm:px-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closeDeclineModal()
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`decline-job-${job._id}`}
                        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 pt-5 pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p
                                        id={`decline-job-${job._id}`}
                                        className="text-base font-semibold text-slate-900"
                                    >
                                        Decline this shift?
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Your manager will see that you are not
                                        available for this assignment.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeDeclineModal}
                                    disabled={loadingAction === "reject"}
                                    aria-label="Close decline confirmation"
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                    {job.title}
                                </p>

                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                    <span>
                                        {formatDate(job.date, "ddd, D MMM")}
                                    </span>

                                    <span>
                                        {job.startTime} – {job.endTime}
                                    </span>
                                </div>

                                {job.location && (
                                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                                        <MapPin
                                            size={12}
                                            className="shrink-0 text-slate-400"
                                        />
                                        <span className="truncate">
                                            {job.location}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4">
                                <label
                                    htmlFor={`decline-reason-${job._id}`}
                                    className="text-sm font-medium text-slate-700"
                                >
                                    Reason{" "}
                                    <span className="font-normal text-slate-400">
                                        (optional)
                                    </span>
                                </label>

                                <textarea
                                    id={`decline-reason-${job._id}`}
                                    value={declineReason}
                                    onChange={(e) =>
                                        setDeclineReason(
                                            e.target.value.slice(0, 300)
                                        )
                                    }
                                    placeholder="Tell your manager why you can't attend this shift..."
                                    rows={4}
                                    className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#1E3A5F]/50 focus:ring-4 focus:ring-[#1E3A5F]/5"
                                />

                                <div className="mt-1.5 flex justify-end">
                                    <span className="text-[11px] text-slate-400">
                                        {declineReason.length}/300
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                            <button
                                type="button"
                                onClick={closeDeclineModal}
                                disabled={loadingAction === "reject"}
                                className="flex-1 h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Keep shift
                            </button>

                            <button
                                type="button"
                                onClick={onReject}
                                disabled={loadingAction === "reject"}
                                className="flex-1 h-11 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-rose-600/15 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loadingAction === "reject" ? (
                                    <>
                                        <Loader2
                                            size={15}
                                            className="animate-spin"
                                        />
                                        Declining...
                                    </>
                                ) : (
                                    "Decline shift"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
