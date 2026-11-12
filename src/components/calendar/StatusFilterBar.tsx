import { AlertTriangle } from 'lucide-react'
import { STATUS_FILTERS, type FilterStatus } from './calendarUtils'

// Colour key and status filter in one: each chip's swatch matches the job
// colours on the calendar, and clicking it hides/shows that status.
const SWATCH: Record<FilterStatus, string> = {
  published: 'bg-[var(--primary)]',
  'in-progress': 'bg-blue-600',
  completed: 'bg-emerald-700',
  cancelled: 'bg-muted border-[1.5px] border-dashed border-muted-foreground',
  draft: 'bg-card border-[1.5px] border-dashed border-muted-foreground',
}

interface Props {
  counts: Record<FilterStatus, number>
  hidden: Set<FilterStatus>
  onToggle: (status: FilterStatus) => void
  issueCount: number
  onlyIssues: boolean
  onToggleIssues: () => void
  onReset: () => void
}

export function StatusFilterBar({ counts, hidden, onToggle, issueCount, onlyIssues, onToggleIssues, onReset }: Props) {
  const filtered = onlyIssues || hidden.size > 0
  return (
    <div
      role="group"
      aria-label="Filter jobs by status"
      className="flex items-center gap-2 px-3 sm:px-5 py-2.5 border-b border-[var(--border)] bg-muted/30 overflow-x-auto scrollto"
    >
      <span className="text-xs font-semibold text-muted-foreground shrink-0 mr-0.5">Show</span>

      {STATUS_FILTERS.map(({ status, label }) => {
        const on = !hidden.has(status)
        return (
          <button
            key={status}
            type="button"
            aria-pressed={on}
            title={`${on ? 'Hide' : 'Show'} ${label.toLowerCase()} jobs`}
            onClick={() => onToggle(status)}
            className={`shrink-0 inline-flex items-center gap-1.5 h-8 pl-2.5 pr-1.5 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
              on
                ? 'bg-card border-[var(--border)] text-foreground hover:border-muted-foreground/50'
                : 'bg-muted border-transparent text-muted-foreground hover:bg-muted/70'
            }`}
          >
            <span
              className={`size-2.5 rounded-[3px] shrink-0 ${on ? SWATCH[status] : 'border-[1.5px] border-muted-foreground/60'}`}
              aria-hidden
            />
            <span className={on ? '' : 'line-through'}>{label}</span>
            <span
              className={`min-w-5 px-1.5 rounded-full text-[11px] font-bold tabular-nums text-center ${
                on ? 'bg-muted text-foreground' : 'text-muted-foreground'
              }`}
            >
              {counts[status]}
            </span>
          </button>
        )
      })}

      <span aria-hidden className="w-px h-5 bg-[var(--border)] shrink-0 mx-1" />

      <button
        type="button"
        aria-pressed={onlyIssues}
        title="Show only jobs that need action"
        onClick={onToggleIssues}
        disabled={issueCount === 0 && !onlyIssues}
        className={`shrink-0 inline-flex items-center gap-1.5 h-8 pl-2.5 pr-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer disabled:cursor-default disabled:opacity-60 text-amber-900 dark:text-amber-200 ${
          onlyIssues ? 'bg-amber-100 dark:bg-amber-500/25 border-2 border-amber-500' : 'bg-[var(--warning-bg)] border border-amber-300 dark:border-amber-500/40 hover:border-amber-500'
        }`}
      >
        <AlertTriangle size={13} className="text-amber-600 shrink-0" aria-hidden />
        {onlyIssues ? 'Showing issues only' : 'Needs attention'}
        <span className="min-w-5 px-1.5 rounded-full text-[11px] font-bold tabular-nums text-center bg-amber-200 text-amber-900 dark:bg-amber-500/30 dark:text-amber-100">
          {issueCount}
        </span>
      </button>

      {filtered && (
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 h-8 px-2 text-xs font-semibold text-[var(--primary)] underline underline-offset-2 cursor-pointer"
        >
          Reset
        </button>
      )}
    </div>
  )
}
