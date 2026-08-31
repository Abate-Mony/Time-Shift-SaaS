// ─── Affected shifts preview ──────────────────────────────────────────────────

import { fmtDate } from "@/utils/recurring"
import type { WorkerRecurringShift } from "@/utils/types"

export default function AffectedShiftPreview({ shifts }: { shifts: WorkerRecurringShift[] }) {
  const pending = shifts.filter(s => s.status === 'pending')
  const MAX_SHOW = 5
  const shown = pending.slice(0, MAX_SHOW)
  const rest = pending.length - shown.length
  return (
    <div className="bg-slate-50 rounded-xl p-3.5 mt-3">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Affected shifts</p>
      <div className="flex flex-col gap-1.5">
        {shown.map(s => (
          <div key={s.jobId} className="flex items-center gap-2 text-sm text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            {fmtDate(s.date)} · {s.startTime}–{s.endTime}
          </div>
        ))}
        {rest > 0 && (
          <p className="text-xs text-slate-400 pl-3.5">+ {rest} more</p>
        )}
      </div>
    </div>
  )
}