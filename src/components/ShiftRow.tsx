import { fmtDate, statusLabel, statusStyle } from "@/utils/recurring"
import type { WorkerRecurringShift } from "@/utils/types"
import { ChevronRight, Clock, MapPin } from "lucide-react"
import { Link } from "react-router"

export default function ShiftRow({
  shift,
}: {
  shift: WorkerRecurringShift
}) {
  return (
    <Link to={"/"}
    //   onClick={() => onViewShift(shift.jobId)}
      className="w-full text-left flex items-center gap-3 py-3.5 px-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-slate-800">{fmtDate(shift.date)}</p>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyle(shift.status)}`}>
            {statusLabel(shift.status)}
          </span>
        </div>
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <Clock size={10} /> {shift.startTime}–{shift.endTime}
          {shift.location && <> · <MapPin size={10} /> {shift.location}</>}
        </p>
      </div>
      <div className="flex items-center gap-1 text-xs text-[#1E3A5F] font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        View shift <ChevronRight size={12} />
      </div>
    </Link>
  )
}