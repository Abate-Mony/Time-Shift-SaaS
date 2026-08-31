import { claimOpenShift } from "@/utils/api-request-functions"
import { formatDate, formatDuration } from "@/utils/date"
import type { CreateJobForm } from "@/utils/types"
import { CalendarDays, Check, Clock, Loader2, MapPin, Timer } from "lucide-react"
import { useState } from "react"

export default function OpenShiftCard({
  shift,
}: {
  shift: CreateJobForm
}) {
  const [isClaiming, setIsClaiming] = useState(false)

  const onPickUp = async () => {
    setIsClaiming(true)
    await claimOpenShift(shift._id!)
    setIsClaiming(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
      <div className="h-1 bg-blue-500" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 leading-snug">{shift.title}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{shift.client}</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600 shrink-0">
            Open
          </span>
        </div>

        <div className="grid grid-cols-2 gap-y-2 gap-x-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 col-span-2">
            <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
              <CalendarDays size={11} className="text-slate-400" />
            </div>
            {formatDate(shift.date, "dd MMMM")}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
              <Clock size={11} className="text-slate-400" />
            </div>
            {shift.startTime} – {shift.endTime}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
              <Timer size={11} className="text-slate-400" />
            </div>
            {shift.minutes ? `${formatDuration(shift.minutes)} shift` : "—"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 col-span-2">
            <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
              <MapPin size={11} className="text-slate-400" />
            </div>
            <span className="truncate">{shift.location}</span>
          </div>
        </div>

        {/* instructions is the current worker-visible field; additional_notes
            is its predecessor, kept as a fallback for jobs created before
            the split into instructions (worker-visible) vs notes (internal). */}
        {(shift.instructions || shift.additional_notes) && (
          <p className="mt-3 text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
            {shift.instructions || shift.additional_notes}
          </p>
        )}

        <button
          onClick={onPickUp}
          disabled={isClaiming}
          className="mt-4 w-full h-11 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isClaiming ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Pick Up Shift
        </button>
      </div>
    </div>
  )
}
