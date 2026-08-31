// ─── Recurring badge (for individual job cards) ────────────────────────────────

import { Repeat2 } from "lucide-react";

export function RecurringBadge({ onViewAll }: { onViewAll?: () => void }) {
  return (
    <button
      onClick={onViewAll}
      className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2.5 py-1 hover:bg-[#1E3A5F]/8 hover:text-[#1E3A5F] transition-colors"
      aria-label="Part of a recurring shift"
    >
      <Repeat2 size={10} />
      Recurring shift
    </button>
  )
}