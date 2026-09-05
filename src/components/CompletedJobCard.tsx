import { formatDate, formatDuration } from "@/utils/date"
import type { CreateJobForm } from "@/utils/types"
import { CalendarDays, CheckCircle2, Clock, MapPin } from "lucide-react"
import { useNavigate } from "react-router"

export default function CompletedJobCard({ job }: { job: CreateJobForm }) {
    const navigate = useNavigate()

    return (
        <div
            onClick={() => navigate(`/worker/jobs/${job._id}`)}
            className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
        >
            <div className="h-1 bg-emerald-500" />
            <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 leading-snug truncate">{job.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium truncate">{job.client?.name}</p>
                        </div>
                    </div>

                    {/* Hours worked is the headline stat on a completed card — biggest, most legible element on it. */}
                    <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-emerald-600 leading-none">{formatDuration(job.minutes)}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wide">Worked</p>
                    </div>
                </div>

                <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-3 border-t border-[#F1F5F9]">
                    <div className="flex items-center gap-1.5">
                        <CalendarDays size={12} className="text-slate-400" />
                        {formatDate(job.date, "ddd, D MMM")}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        {job.startTime} – {job.endTime}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{job.location}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
