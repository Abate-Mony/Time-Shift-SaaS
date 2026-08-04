import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, ChevronDown, Info } from 'lucide-react'
import { Input } from './ui'

// ─── Types ───────────────────────────────────────────────────────────────────

export type RecurPattern = 'daily' | 'weekly' | 'monthly' | 'custom'
export type EndType = 'never' | 'on-date' | 'after'
export type MonthlyMode = 'day-of-month' | 'day-of-week'

export interface RecurringState {
  enabled: boolean
  pattern: RecurPattern
  repeatEvery: number
  weekdays: string[]
  monthlyMode: MonthlyMode
  monthlyDay: number
  monthlyWeekNum: string
  monthlyWeekDay: string
  customUnit: 'days' | 'weeks' | 'months'
  endType: EndType
  endDate: string
  endOccurrences: number
}

export const defaultRecurring = (): RecurringState => ({
  enabled: false,
  pattern: 'weekly',
  repeatEvery: 1,
  weekdays: ['Mon'],
  monthlyMode: 'day-of-month',
  monthlyDay: 1,
  monthlyWeekNum: 'first',
  monthlyWeekDay: 'Monday',
  customUnit: 'weeks',
  endType: 'never',
  endDate: '',
  endOccurrences: 10,
})

// ─── Constants ───────────────────────────────────────────────────────────────

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const PATTERNS: { id: RecurPattern; label: string; sub: string }[] = [
  { id: 'daily', label: 'Daily', sub: 'Repeat every day' },
  { id: 'weekly', label: 'Weekly', sub: 'Repeat on selected days' },
  { id: 'monthly', label: 'Monthly', sub: 'Repeat on a set day' },
  { id: 'custom', label: 'Custom', sub: 'Advanced schedule' },
]

const WEEK_NUMS = ['first', 'second', 'third', 'fourth', 'last']
const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// ─── Internal helpers ─────────────────────────────────────────────────────────

function InlineSelect({
  value, onChange, options, className = '',
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`h-9 pl-3 pr-8 border border-[#E2E8F0] rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] appearance-none cursor-pointer transition-all ${className}`}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  )
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-slate-700 shrink-0">{children}</p>
}

// ─── Summary builder ──────────────────────────────────────────────────────────

function buildSummary(r: RecurringState, startDate: string): string {
  if (!r.enabled) return ''

  const parts: string[] = []

  if (r.pattern === 'daily') {
    parts.push(r.repeatEvery === 1 ? 'Repeats every day' : `Repeats every ${r.repeatEvery} days`)
  } else if (r.pattern === 'weekly') {
    const days = r.weekdays
    const dayStr = days.length === 0 ? 'no days selected'
      : days.length === 1 ? days[0]
        : days.length === 7 ? 'every day'
          : `${days.slice(0, -1).join(', ')} and ${days[days.length - 1]}`
    parts.push(
      r.repeatEvery === 1
        ? `Repeats every ${dayStr}`
        : `Repeats every ${r.repeatEvery} weeks on ${dayStr}`
    )
  } else if (r.pattern === 'monthly') {
    if (r.monthlyMode === 'day-of-month') {
      const suffix = r.monthlyDay === 1 ? 'st' : r.monthlyDay === 2 ? 'nd' : r.monthlyDay === 3 ? 'rd' : 'th'
      parts.push(
        r.repeatEvery === 1
          ? `Repeats on the ${r.monthlyDay}${suffix} of every month`
          : `Repeats on the ${r.monthlyDay}${suffix} every ${r.repeatEvery} months`
      )
    } else {
      parts.push(`Repeats on the ${r.monthlyWeekNum} ${r.monthlyWeekDay} of every month`)
    }
  } else {
    const unit = r.repeatEvery === 1 ? r.customUnit.replace(/s$/, '') : r.customUnit
    parts.push(`Repeats every ${r.repeatEvery} ${unit}`)
  }

  if (startDate) {
    const d = new Date(startDate)
    if (!isNaN(d.getTime())) {
      parts.push(`Starting ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`)
    }
  }

  if (r.endType === 'on-date' && r.endDate) {
    const d = new Date(r.endDate)
    if (!isNaN(d.getTime())) {
      parts.push(`Ends ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`)
    }
  } else if (r.endType === 'after') {
    parts.push(`Ends after ${r.endOccurrences} occurrence${r.endOccurrences !== 1 ? 's' : ''}`)
  } else {
    parts.push('No end date')
  }

  return parts.join('. ') + '.'
}

// ─── Section props ────────────────────────────────────────────────────────────

interface Props {
  value: RecurringState
  onChange: (next: RecurringState) => void
  startDate?: string
  sectionIndex: number
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RecurringJobSection({ value: r, onChange, startDate = '', sectionIndex }: Props) {
  const set = (partial: Partial<RecurringState>) => onChange({ ...r, ...partial })

  const summary = buildSummary(r, startDate)

  const repeatEveryOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }))

  const unitLabel = {
    daily: r.repeatEvery === 1 ? 'day' : 'days',
    weekly: r.repeatEvery === 1 ? 'week' : 'weeks',
    monthly: r.repeatEvery === 1 ? 'month' : 'months',
    custom: r.customUnit,
  }[r.pattern] as string

  return (
    <div className="w-full min-w-0 bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      {/* ── Section header + toggle ────────────────────────────────────── */}
      <div className="p-6 flex items-center justify-between gap-3 min-w-0">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 min-w-0">
          <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            {sectionIndex}
          </span>
          <span className="truncate">Recurring Job</span>
        </h2>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            {r.enabled ? 'Enabled' : 'Off'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={r.enabled}
            onClick={() => set({ enabled: !r.enabled })}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-1 shrink-0 ${r.enabled ? 'bg-[#1E3A5F]' : 'bg-slate-200'}`}
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm ${r.enabled ? 'left-6' : 'left-1'}`}
            />
          </button>
        </div>
      </div>

      {/* ── Expandable body ────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {r.enabled && (
          <motion.div
            key="recurring-body"
            className="min-w-0  overflow-hidden!"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}

          >
            <div className="px-6 pb-6 flex flex-col gap-6 min-w-0 overflow-hidden">
              {/* Divider */}
              <div className="h-px bg-[#F1F5F9] -mx-6" />

              {/* ── Pattern selector ───────────────────────────────────── */}
              <div className="flex flex-col gap-2.5 min-w-0 ">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Recurrence Pattern
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-0">
                  {PATTERNS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => set({ pattern: p.id })}
                      className={`relative flex flex-col gap-0.5 text-left px-3.5 py-3 rounded-xl border-2 transition-all duration-150 min-w-0
                        ${r.pattern === p.id
                          ? 'border-[#1E3A5F] bg-[#1E3A5F]/[0.04]'
                          : 'border-[#E2E8F0] hover:border-slate-300 bg-white'}`}
                    >
                      <span className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                        ${r.pattern === p.id ? 'border-[#1E3A5F] bg-[#1E3A5F]' : 'border-slate-300 bg-white'}`}>
                        {r.pattern === p.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      <span className={`text-sm font-semibold pr-5 truncate ${r.pattern === p.id ? 'text-[#1E3A5F]' : 'text-slate-800'}`}>
                        {p.label}
                      </span>
                      <span className="text-[11px] text-slate-400 leading-snug truncate">{p.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Repeat every (not daily) ────────────────────────────── */}
              {(r.pattern === 'weekly' || r.pattern === 'monthly') && false && (
                <motion.div
                  key="repeat-every"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-3 flex-wrap min-w-0"
                >
                  <RowLabel>Repeat every</RowLabel>
                  <InlineSelect
                    value={String(r.repeatEvery)}
                    onChange={v => set({ repeatEvery: Number(v) })}
                    options={repeatEveryOptions}
                    className="w-20"
                  />
                  <span className="text-sm text-slate-500 shrink-0">{unitLabel}</span>
                </motion.div>
              )}

              {/* ── Weekly: day chips ────────────────────────────────────── */}
              {r.pattern === 'weekly' && (
                <motion.div
                  key="weekdays"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-2.5 min-w-0"
                >
                  <p className="text-sm font-medium text-slate-700">Repeat on</p>
                  <div className="flex flex-wrap gap-2 min-w-0">
                    {WEEKDAYS.map(day => {
                      const active = r.weekdays.includes(day)
                      return (
                        <motion.button
                          key={day}
                          type="button"
                          whileTap={{ scale: 0.93 }}
                          onClick={() => {
                            const next = active
                              ? r.weekdays.filter(d => d !== day)
                              : [...r.weekdays, day]
                            if (next.length > 0) set({ weekdays: next })
                          }}
                          className={`h-9 w-12 shrink-0 rounded-xl text-xs font-bold transition-all duration-150 border
                              ${active
                              ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] shadow-sm shadow-[#1E3A5F]/20'
                              : 'bg-white text-slate-600 border-[#E2E8F0] hover:border-slate-300'}`}
                        >
                          {day}
                        </motion.button>
                      )
                    })}
                  </div>
                  {r.weekdays.length === 0 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <Info size={11} /> Select at least one day
                    </p>
                  )}
                </motion.div>
              )}

              {/* ── Monthly options ─────────────────────────────────────── */}
              {r.pattern === 'monthly' && (
                <motion.div
                  key="monthly"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-3 min-w-0 overflow-hidden"
                >
                  {/* Option A: Day of month */}
                  <label className={`flex items-center gap-3 h p-3.5 rounded-xl border-2 cursor-pointer transition-all flex-wrap min-w-0
                      ${r.monthlyMode === 'day-of-month' ? 'border-[#1E3A5F] bg-[#1E3A5F]/[0.03]' : 'border-[#E2E8F0] hover:border-slate-300'}`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                        ${r.monthlyMode === 'day-of-month' ? 'border-[#1E3A5F] bg-[#1E3A5F]' : 'border-slate-300'}`}>
                      {r.monthlyMode === 'day-of-month' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <Input type="radio" className="sr-only " checked={r.monthlyMode === 'day-of-month'} onChange={() => set({ monthlyMode: 'day-of-month' })} />
                    <span className="text-sm text-slate-700 font-medium flex-1 min-w-0">Day of month</span>
                    {r.monthlyMode === 'day-of-month' && (
                      <InlineSelect
                        value={String(r.monthlyDay)}
                        onChange={v => set({ monthlyDay: Number(v) })}
                        options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
                        className="w-20"
                      />
                    )}
                  </label>

                  {/* Option B: Day of week */}
                  <label className={`flex items-center gap-3 p-3.5 rounded-xl
                 border-2 cursor-pointer transition-all
                      ${r.monthlyMode === 'day-of-week' ? 'border-[#1E3A5F] bg-[#1E3A5F]/[0.03]' : 'border-[#E2E8F0] hover:border-slate-300'}`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                        ${r.monthlyMode === 'day-of-week' ? 'border-[#1E3A5F] bg-[#1E3A5F]' : 'border-slate-300'}`}>
                      {r.monthlyMode === 'day-of-week' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <Input type="radio" className="sr-only" checked={r.monthlyMode === 'day-of-week'} onChange={() => set({ monthlyMode: 'day-of-week' })} />
                    <span className="text-sm text-slate-700 font-medium shrink-0">The</span>
                    {r.monthlyMode === 'day-of-week' ? (
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <InlineSelect
                          value={r.monthlyWeekNum}
                          onChange={v => set({ monthlyWeekNum: v })}
                          options={WEEK_NUMS.map(n => ({ value: n, label: n.charAt(0).toUpperCase() + n.slice(1) }))}
                          className="w-28"
                        />
                        <InlineSelect
                          value={r.monthlyWeekDay}
                          onChange={v => set({ monthlyWeekDay: v })}
                          options={WEEK_DAYS.map(d => ({ value: d, label: d }))}
                          className="w-32"
                        />
                        <span className="text-sm text-slate-500 shrink-0">of the month</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400 truncate">first / last weekday of the month</span>
                    )}
                  </label>
                </motion.div>
              )}

              {/* ── Custom recurrence ────────────────────────────────────── */}
              {r.pattern === 'custom' && (
                <motion.div
                  key="custom"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-3 min-w-0"
                >
                  <p className="text-sm font-medium text-slate-700">Custom schedule</p>
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <RowLabel>Repeat every</RowLabel>
                    <InlineSelect
                      value={String(r.repeatEvery)}
                      onChange={v => set({ repeatEvery: Number(v) })}
                      options={repeatEveryOptions}
                      className="w-20"
                    />
                    <InlineSelect
                      value={r.customUnit}
                      onChange={v => set({ customUnit: v as RecurringState['customUnit'] })}
                      options={[
                        { value: 'days', label: 'days' },
                        { value: 'weeks', label: 'weeks' },
                        { value: 'months', label: 'months' },
                      ]}
                      className="w-28"
                    />
                  </div>
                </motion.div>
              )}

              {/* ── End condition ────────────────────────────────────────── */}
              {/* error in here */}
              <div className="flex flex-col gap-3 min-w-0 ">
                <p className="text-sm font-medium text-slate-700">Ends</p>
                <div className="flex flex-col gap-2 min-w-0">
                  {/* Never */}
                  <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all min-w-0
                    ${r.endType === 'never' ? 'border-[#1E3A5F] bg-[#1E3A5F]/[0.03]' : 'border-[#E2E8F0] hover:border-slate-300'}`}>
                    <RadioDot active={r.endType === 'never'} />
                    <Input type="radio" className="sr-only" checked={r.endType === 'never'} onChange={() => set({ endType: 'never' })} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">Never</p>
                      <p className="text-xs text-slate-400 mt-0.5">This job repeats indefinitely</p>
                    </div>
                  </label>

                  {/* On Date */}
                  <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all min-w-0
                    ${r.endType === 'on-date' ? 'border-[#1E3A5F] bg-[#1E3A5F]/[0.03]' : 'border-[#E2E8F0] hover:border-slate-300'}`}>
                    <RadioDot active={r.endType === 'on-date'} />
                    <Input type="radio" className="sr-only" checked={r.endType === 'on-date'} onChange={() => set({ endType: 'on-date' })} />
                    <div className="flex-1 flex items-center justify-between gap-3 flex-wrap min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">On date</p>
                        <p className="text-xs text-slate-400 mt-0.5">Choose a specific end date</p>
                      </div>
                      {r.endType === 'on-date' && (
                        <Input
                          type="date"
                          value={r.endDate}
                          onClick={e => e.stopPropagation()}
                          onChange={e => set({ endDate: e.target.value })}
                          className="h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all shrink-0"
                        />
                      )}
                    </div>
                  </label>

                  {/* After N occurrences */}
                  <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all min-w-0
                    ${r.endType === 'after' ? 'border-[#1E3A5F] bg-[#1E3A5F]/[0.03]' : 'border-[#E2E8F0] hover:border-slate-300'}`}>
                    <RadioDot active={r.endType === 'after'} />
                    <Input type="radio" className="sr-only" checked={r.endType === 'after'} onChange={() => set({ endType: 'after' })} />
                    <div className="flex-1 flex items-center justify-between gap-3 flex-wrap min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">After</p>
                        <p className="text-xs text-slate-400 mt-0.5">Stop after a number of runs</p>
                      </div>
                      {r.endType === 'after' && (
                        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                          <Input
                            type="number"
                            min={1}
                            max={999}
                            value={r.endOccurrences}
                            onChange={e => set({ endOccurrences: Math.max(1, Number(e.target.value)) })}
                            className="w-20 h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all text-center"
                          />
                          <span className="text-sm text-slate-500 shrink-0">
                            occurrence{r.endOccurrences !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* ── Live summary card ────────────────────────────────────── */}
              {summary && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#1E3A5F]/[0.04] border border-[#1E3A5F]/20 rounded-xl px-4 py-3.5 flex items-start gap-3 min-w-0"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <RefreshCw size={13} className="text-[#1E3A5F]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1E3A5F] uppercase tracking-wide mb-1">Schedule Summary</p>
                    <p className="text-sm text-[#1E3A5F]/80 leading-relaxed break-words">{summary}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Radio dot ─────────────────────────────────────────────────────────────────
function RadioDot({ active }: { active: boolean }) {
  return (
    <span className={`w-4 h-4 rounded-full border-2  flex hidden items-center justify-center shrink-0 transition-all duration-150
      ${active ? 'border-[#1E3A5F] bg-[#1E3A5F]' : 'border-slate-300 bg-white'}`}>
      {active && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-1.5 h-1.5 rounded-full bg-white"
        />
      )}
    </span>
  )
}

// ─── Edit-job confirmation modal ─────────────────────────────────────────────

export type EditScope = 'this' | 'future' | 'all'

interface RecurEditModalProps {
  open: boolean
  onConfirm: (scope: EditScope) => void
  onCancel: () => void
}

export function RecurEditModal({ open, onConfirm, onCancel }: RecurEditModalProps) {
  const [selected, setSelected] = useState<EditScope>('this')

  const options: { id: EditScope; label: string; sub: string }[] = [
    { id: 'this', label: 'This occurrence only', sub: 'Only this single job will be updated.' },
    { id: 'future', label: 'This and all future occurrences', sub: 'This job and every one after it will be updated.' },
    { id: 'all', label: 'All occurrences', sub: 'Every instance of this recurring job will be updated.' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onCancel}
        >
          <motion.div
            key="modal-card"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5 px-6 pt-6 pb-5 border-b border-[#F1F5F9]">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <RefreshCw size={16} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 mb-0.5">Edit recurring job</h3>
                <p className="text-sm text-slate-500">This is a recurring job. Which occurrences should be updated?</p>
              </div>
            </div>

            <div className="px-6 py-4 flex flex-col gap-2">
              {options.map(opt => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150 min-w-0
                    ${selected === opt.id ? 'border-[#1E3A5F] bg-[#1E3A5F]/[0.04]' : 'border-[#E2E8F0] hover:border-slate-300'}`}
                >
                  <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                    ${selected === opt.id ? 'border-[#1E3A5F] bg-[#1E3A5F]' : 'border-slate-300'}`}>
                    {selected === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <Input type="radio" className="sr-only" checked={selected === opt.id} onChange={() => setSelected(opt.id)} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.sub}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3 px-6 pb-6 pt-2">
              <button
                onClick={onCancel}
                className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                onClick={() => onConfirm(selected)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 h-10 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold hover:bg-[#162D4A] transition-colors shadow-sm shadow-[#1E3A5F]/20"
              >
                Apply changes
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}