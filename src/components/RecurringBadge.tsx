// ─── Recurring badge (for individual job cards) ────────────────────────────────

import { Repeat2 } from "lucide-react";

export function RecurringBadge({ onViewAll }: { onViewAll?: () => void }) {
  return (
    <button
      onClick={onViewAll}
      className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted rounded-full px-2.5 py-1 hover:bg-[var(--primary)]/8 hover:text-[var(--primary)] transition-colors"
      aria-label="Part of a recurring shift"
    >
      <Repeat2 size={10} />
      Recurring shift
    </button>
  )
}