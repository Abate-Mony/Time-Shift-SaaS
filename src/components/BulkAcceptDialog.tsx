import { queryClient } from "@/lib/queryClient"
import customFetch from "@/utils/customFetch"
import { fmtDate } from "@/utils/recurring"
import type { DialogState, WorkerRecurringGroup } from "@/utils/types"
import { AnimatePresence,motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import { useState } from "react"
import AffectedShiftPreview from "./AffectedShiftPreview"

export function BulkAcceptDialog({
  group,
  onClose,
  onAccepted,
}: {
  group: WorkerRecurringGroup
  onClose: () => void
  onAccepted: (count: number) => void
}) {
  const [state, setState] = useState<DialogState>('confirm')
  const [acceptedCount, setAcceptedCount] = useState(0)
  const pending = group.shifts.filter(s => s.status === 'pending')
  const firstShift = pending[0]
  const lastShift = pending[pending.length - 1]

  const handleConfirm = async () => {
    setState('loading')
    try {
      // The backend re-checks what's actually still pending rather than
      // trusting group.pendingCount — the returned count can legitimately
      // differ (another tab, a shift expiring, a manager cancelling one).
      const { data } = await customFetch.patch<{ accepted: number }>(
        `/workers/recurring-jobs/${group.recurringJobId}/accept-all`
      )
      const returned = data.accepted
      setAcceptedCount(returned)
      queryClient.invalidateQueries({ queryKey: ['worker-recurring-groups'] })
      if (returned === 0) setState('empty')
      else if (returned < group.pendingCount) setState('partial')
      else setState('success')
      onAccepted(returned)
    } catch {
      setState('error')
    }
  }

  // Escape key
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && state !== 'loading') onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget && state !== 'loading') onClose() }}
      onKeyDown={handleKey}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>

        <AnimatePresence mode="wait">
          {state === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
              {/* Close */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Accept upcoming shifts</p>
                  <h3 className="text-base font-bold text-foreground">Accept all {group.pendingCount} pending shifts?</h3>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors ml-2 shrink-0">
                  <X size={15} />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-1">
                {"You're accepting "}
                <strong>{group.pendingCount} currently scheduled shifts</strong> for:
              </p>
              <div className="bg-[var(--primary)]/[0.04] border border-[var(--primary)]/10 rounded-xl px-4 py-3 mb-4">
                <p className="text-sm font-bold text-foreground">{group.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{group.recurrenceLabel} · {group.startTime}–{group.endTime}</p>
              </div>

              {firstShift && lastShift && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-muted rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">First shift</p>
                    <p className="text-sm font-semibold text-foreground">{fmtDate(firstShift.date)}</p>
                  </div>
                  <div className="bg-muted rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Last current shift</p>
                    <p className="text-sm font-semibold text-foreground">{fmtDate(lastShift.date)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5 mb-4">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{group.pendingCount} shifts will be accepted</p>
              </div>

              <AffectedShiftPreview shifts={group.shifts} />

              {/* Critical notice */}
              <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Future shifts created later are not included.</strong> You will need to respond to any new shifts separately.
                </p>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={onClose} className="flex-1 h-11 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  Accept all {group.pendingCount}
                </button>
              </div>
            </motion.div>
          )}

          {state === 'loading' && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[var(--primary)]/8 flex items-center justify-center">
                <span className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Accepting {group.pendingCount} shifts…</p>
                <p className="text-sm text-muted-foreground mt-1">Please wait</p>
              </div>
            </motion.div>
          )}

          {state === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="p-8 flex flex-col items-center text-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center"
              >
                <CheckCircle2 size={32} className="text-emerald-500" strokeWidth={1.5} />
              </motion.div>
              <div>
                <p className="text-base font-bold text-foreground">{acceptedCount} shifts accepted!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {"You're confirmed for all currently scheduled shifts."}
                </p>
              </div>
              <div className="w-full bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-sm text-emerald-700">
                Remember: future shifts created later will need a separate response.
              </div>
              <button onClick={onClose} className="w-full h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
                Done
              </button>
            </motion.div>
          )}

          {state === 'partial' && (
            <motion.div key="partial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <AlertTriangle size={18} className="text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">Some shifts changed</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                <strong className="text-foreground">{acceptedCount} shifts were accepted.</strong>{' '}
                {group.pendingCount - acceptedCount} were no longer available. Your job list has been refreshed.
              </p>
              <button onClick={onClose} className="w-full h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
                Done
              </button>
            </motion.div>
          )}

          {state === 'empty' && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={18} className="text-muted-foreground" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">No shifts need a response</h3>
              <p className="text-sm text-muted-foreground mb-5">These shifts have already been updated.</p>
              <button onClick={onClose} className="w-full h-11 border border-border text-sm font-semibold text-muted-foreground rounded-xl hover:bg-muted transition-colors">
                Close
              </button>
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">{"Couldn't accept these shifts"}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Your shifts have not been changed. Please try again.
              </p>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 h-11 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button onClick={() => setState('confirm')} className="flex-1 h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
                  Try again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}