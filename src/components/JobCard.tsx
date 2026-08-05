import { changeWorkerJobStaus } from "@/utils/api-request-functions"
import type { CreateJobForm } from "@/utils/types"
import { AlertCircle, Check, Clock, Dot, Loader2, MapPin, Timer, X } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"
import { StatusBadge } from "./ui"

export default function JobCard({
    job,

}: {
    job: CreateJobForm,

}) {
    const statusColor: Record<string, string> = {
        'in-progress': 'bg-blue-500',
        'assigned': 'bg-violet-500',
        'completed': 'bg-emerald-500',
        'pending': 'bg-amber-500',
    }

    const accent = statusColor["in-progress"] ?? 'bg-slate-400'
    const navigate = useNavigate()

    const [loadingAction, setLoadingAction] = useState<'accept' | 'reject' | 'start' | null>(null)

    const onAccept = async () => {
        setLoadingAction('accept')
        await changeWorkerJobStaus(job._id!, "accepted")
        setLoadingAction(null)
    }

    const onReject = async () => {
        setLoadingAction('reject')
        await changeWorkerJobStaus(job._id!, "declined")
        setLoadingAction(null)
    }
    const startWorking = async () => {
        setLoadingAction('start')
        await changeWorkerJobStaus(job._id!, "in-progress")
        setLoadingAction(null)
    }

    return (
        <div onClick={() => navigate(`/worker/job/${job._id}`)}
            className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
        >
            {/* Accent stripe */}
            <div className={`h-1 ${accent}`} />
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 leading-snug">{job.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">{job.company}</p>
                    </div>
                    <StatusBadge status={job.status!} />
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                            <Clock size={11} className="text-slate-400" />
                        </div>
                        {job.startTime} – {job.endTime}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                            <Timer size={11} className="text-slate-400" />
                        </div>
                        {job.startTime}h shift
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 col-span-2">
                        <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                            <MapPin size={11} className="text-slate-400" />
                        </div>
                        <span className="truncate">{job.location}</span>
                    </div>
                </div>

                {job.description && (
                    <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                        <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 leading-relaxed">{job.description}</p>
                    </div>
                )}

                {/* Actions */}
                {job.status === 'pending' && (
                    <div className="mt-4 grid grid-cols-2 gap-2.5" onClick={e => e.stopPropagation()}>
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

                {job.status === 'in-progress' && (
                    <button

                        onClick={e => {
                            e.stopPropagation();
                            e.preventDefault()
                            navigate(`/worker/clock/${job._id}`)
                        }}
                        className="mt-4 w-full h-11 rounded-xl bg-[#1E3A5F] text-center  text-white text-sm font-bold hover:bg-[#162D4A] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#1E3A5F]/25"
                    >
                        <Dot className="text-green-400 animate-ping" size={50} /> Job Live
                    </button>
                )}
                {job.status === 'accepted' && (
                    <button
                        disabled={loadingAction !== null}
                        onClick={e => {
                            e.stopPropagation();
                            e.preventDefault()
                            // navigate(`/worker/clock/${job._id}`)
                            startWorking()
                        }}
                        className="mt-4 w-full h-11 rounded-xl bg-[#1b7b3d] text-white text-sm font-bold hover:bg-[#13a166] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#1E3A5F]/25 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loadingAction === 'start' ? <Loader2 size={14} className="animate-spin" /> : <Timer size={14} />} Start Working Job
                    </button>
                )}
            </div>
        </div>
    )
}