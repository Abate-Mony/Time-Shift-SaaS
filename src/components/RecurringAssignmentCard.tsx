import { queryClient } from "@/lib/queryClient"
import customFetch from "@/utils/customFetch"
import { fmtDate, statusLabel, statusStyle } from "@/utils/recurring"
import type { WorkerRecurringGroup } from "@/utils/types"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, ChevronDown, ChevronRight, Clock, MapPin, MoreHorizontal, Repeat2 } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"
import { BulkAcceptDialog } from "./BulkAcceptDialog"

export function RecurringAssignmentCard({
  group,

}: {
  group: WorkerRecurringGroup

}) {
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)
  const [confirmingDecline, setConfirmingDecline] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const allAccepted = group.pendingCount === 0 && group.acceptedCount > 0
  const isNew = group.pendingCount > 0 && group.acceptedCount > 0

  const handleDeclineAll = async () => {
    setDeclining(true)
    try {
      await customFetch.patch(`/workers/recurring-jobs/${group.recurringJobId}/decline-all`)
      queryClient.invalidateQueries({ queryKey: ['worker-recurring-groups'] })
      toast.success(`Declined ${group.pendingCount} pending shift${group.pendingCount === 1 ? '' : 's'}.`)
    } catch (err: any) {
      toast.error(err.response?.data?.msg ?? 'Failed to decline these shifts.')
    } finally {
      setDeclining(false)
      setConfirmingDecline(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-[#1E3A5F]/15 overflow-hidden shadow-sm">
      {/* Recurring indicator stripe */}
      <div className="bg-[#1E3A5F]/[0.04] border-b border-[#1E3A5F]/8 px-4 py-2 flex items-center gap-1.5">
        <Repeat2 size={11} className="text-[#1E3A5F]/60" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#1E3A5F]/60">Recurring shifts</span>
        {isNew && (
          <span className="ml-auto text-[10px] font-bold bg-amber-400 text-white px-1.5 py-0.5 rounded-full">New</span>
        )}
      </div>

      <div className="p-4">
        {/* Title + location */}
        <h3 className="text-sm font-bold text-slate-900 leading-snug mb-0.5 min-w-0">{group.title}</h3>
        <p className="text-xs text-slate-500 mb-0.5">{group.recurrenceLabel} · {group.startTime}–{group.endTime}</p>
        {group.location && (
          <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
            <MapPin size={10} /> {group.location}
          </p>
        )}

        {allAccepted ? (
          /* All accepted state */
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-700 font-semibold">
              All {group.acceptedCount} currently scheduled shifts accepted
            </p>
          </div>
        ) : (
          <>
            {/* Pending count */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold shrink-0">
                {group.pendingCount}
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {group.pendingCount === 1 ? '1 shift' : `${group.pendingCount} shifts`} waiting for your response
              </p>
            </div>

            {/* Next shift */}
            {group.nextShift && (
              <div className="bg-slate-50 rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2.5">
                <Clock size={12} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Next shift</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {fmtDate(group.nextShift.date)} · {group.nextShift.startTime}–{group.nextShift.endTime}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {group.pendingCount > 0 && (
            <button
              onClick={() => setShowAcceptDialog(true)}
              className="w-full h-11 bg-[#1E3A5F] text-white rounded-xl text-sm font-bold hover:bg-[#162D4A] transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={14} />
              Accept all {group.pendingCount} pending
            </button>
          )}

          <button
            onClick={() => setExpanded(e => !e)}
            className={`w-full h-10 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              allAccepted
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {allAccepted ? 'View shifts' : 'Review shifts'}
            <ChevronRight size={13} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-1.5 pt-1">
                  {group.shifts.map(s => (
                    <div key={s.jobId} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-600">{fmtDate(s.date)} · {s.startTime}–{s.endTime}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusStyle(s.status)}`}>
                        {statusLabel(s.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* More actions (decline all) */}
        {!allAccepted && group.pendingCount > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowMoreActions(o => !o)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors mx-auto"
            >
              <MoreHorizontal size={12} />
              More actions
              <ChevronDown size={11} className={`transition-transform ${showMoreActions ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showMoreActions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  {!confirmingDecline ? (
                    <button
                      onClick={() => setConfirmingDecline(true)}
                      className="w-full mt-2 h-9 border border-red-200 text-red-600 rounded-xl text-xs font-semibold hover:bg-red-50 transition-colors"
                    >
                      Decline all {group.pendingCount} pending shifts
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-slate-600 flex-1">Decline all {group.pendingCount}?</p>
                      <button
                        onClick={() => setConfirmingDecline(false)}
                        disabled={declining}
                        className="h-8 px-3 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeclineAll}
                        disabled={declining}
                        className="h-8 px-3 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                      >
                        {declining && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        Yes, decline
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {showAcceptDialog && (
        <BulkAcceptDialog
          group={group}
          onClose={() => setShowAcceptDialog(false)}
          onAccepted={() => setShowAcceptDialog(false)}
        />
      )}
    </div>
  )
}
