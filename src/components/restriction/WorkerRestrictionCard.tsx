import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, ShieldAlert, Ban, X,
} from 'lucide-react'
import {
  type AccountRestriction, type RestrictionCapability,
  REASON_LABELS, CAPABILITY_LABELS,
  getBlockedCapabilities, fmtDate,
} from '../../data/restrictionMockData.ts'
import { RestrictUserDialog } from './RestrictUserDialog'

// ─── Lift restriction dialog ──────────────────────────────────────────────────

function LiftRestrictionDialog({
  workerName,
  onConfirm,
  onClose,
}: {
  workerName: string
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [liftReason, setLiftReason] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
      >
        <div className="p-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <ShieldCheck size={18} className="text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1.5">Restore full access?</h3>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            {workerName} will regain normal access to TimeShift.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Optional reason</label>
            <input
              value={liftReason}
              onChange={e => setLiftReason(e.target.value)}
              placeholder="Updated document approved"
              className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
            />
          </div>
        </div>
        <div className="border-t border-[#E2E8F0] px-6 py-4 flex items-center justify-end gap-2.5">
          <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
          <button onClick={() => onConfirm(liftReason)} className="h-9 px-5 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">Restore access</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Manager appeal review ────────────────────────────────────────────────────

function AppealReviewDialog({
  appeal,
  onAccept,
  onReject,
  onClose,
}: {
  appeal: NonNullable<AccountRestriction['appeal']>
  onAccept: (response: string) => void
  onReject: (response: string) => void
  onClose: () => void
}) {
  const [response, setResponse] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-slate-900">Review appeal</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={15} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Submitted {appeal.submittedAt ? fmtDate(appeal.submittedAt) : '—'}</p>
            <p className="text-sm text-slate-700 leading-relaxed italic">"{appeal.message}"</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Response to worker</label>
            <textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              rows={3}
              placeholder="Write a response for the worker…"
              className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 resize-none transition-all"
            />
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => onReject(response)}
              className="flex-1 h-10 text-sm font-semibold text-slate-700 border border-[#E2E8F0] rounded-xl hover:bg-slate-50 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => onAccept(response)}
              className="flex-1 h-10 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Accept appeal
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Restriction status badge ─────────────────────────────────────────────────

export function RestrictionStatusBadge({ restriction }: { restriction: AccountRestriction | null }) {
  if (!restriction) {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full"><ShieldCheck size={11} />Active</span>
  }
  if (restriction.accessLevel === 'none') {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full"><Ban size={11} />Suspended</span>
  }
  if (restriction.accessLevel === 'read_only') {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full"><ShieldAlert size={11} />Read only</span>
  }
  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full"><ShieldAlert size={11} />Limited</span>
}

// ─── Main worker restriction card (for WorkerProfile) ─────────────────────────

interface WorkerRestrictionCardProps {
  workerName: string
  restriction: AccountRestriction | null
  onRestrictionChange: (r: AccountRestriction | null) => void
}

export function WorkerRestrictionCard({ workerName, restriction, onRestrictionChange }: WorkerRestrictionCardProps) {
  const [showRestrict, setShowRestrict] = useState(false)
  const [showLift, setShowLift] = useState(false)
  const [showAppealReview, setShowAppealReview] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }
  const blocked = restriction ? getBlockedCapabilities(restriction) : []
  const hasPendingAppeal = restriction?.appeal?.status === 'pending'

  type ApplyData = {
    reason: AccountRestriction['reason']
    message: string
    internalNote: string
    accessLevel: AccountRestriction['accessLevel']
    restrictions: AccountRestriction['restrictions']
    remedy: AccountRestriction['remedy']
    canAppeal: boolean
    expiresAt: string
  }

  const handleApplyRestriction = (data: ApplyData) => {
    const newRestriction: AccountRestriction = {
      _id: `r${Date.now()}`,
      accessLevel: data.accessLevel,
      restrictions: data.restrictions,
      reason: data.reason,
      message: data.message,
      remedy: data.remedy,
      canAppeal: data.canAppeal,
      startsAt: new Date().toISOString(),
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
    }
    onRestrictionChange(newRestriction)
    setShowRestrict(false)
    showToast('Restriction applied.')
  }

  const handleLift = (_reason: string) => {
    onRestrictionChange(null)
    setShowLift(false)
    showToast('Access restored.')
  }

  return (
    <>
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Account access</p>
            <RestrictionStatusBadge restriction={restriction} />
          </div>
          {!restriction ? (
            <button
              onClick={() => setShowRestrict(true)}
              className="h-8 px-3.5 text-xs font-bold text-slate-600 border border-[#E2E8F0] rounded-xl hover:bg-slate-50 transition-colors shrink-0"
            >
              Restrict access
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowRestrict(true)}
                className="h-8 px-3.5 text-xs font-bold text-slate-600 border border-[#E2E8F0] rounded-xl hover:bg-slate-50 transition-colors"
              >
                Manage
              </button>
              <button
                onClick={() => setShowLift(true)}
                className="h-8 px-3.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                Lift restriction
              </button>
            </div>
          )}
        </div>

        {!restriction ? (
          <p className="text-sm text-slate-400">No current restrictions.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Reason</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">{REASON_LABELS[restriction.reason]}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Started</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">{fmtDate(restriction.startsAt)}</p>
              </div>
              {restriction.expiresAt && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Ends</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{fmtDate(restriction.expiresAt)}</p>
                </div>
              )}
              {restriction.accessLevel === 'limited' && blocked.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Blocked</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {blocked.slice(0, 3).map(c => (
                      <span key={c} className="text-[10px] font-semibold bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                        {CAPABILITY_LABELS[c as RestrictionCapability]}
                      </span>
                    ))}
                    {blocked.length > 3 && (
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">+{blocked.length - 3}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pending appeal notice */}
            {hasPendingAppeal && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-blue-900">Appeal pending</p>
                  <p className="text-xs text-blue-600 mt-0.5">Submitted {fmtDate(restriction.appeal!.submittedAt!)}</p>
                </div>
                <button
                  onClick={() => setShowAppealReview(true)}
                  className="h-7 px-3 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                >
                  Review
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <AnimatePresence>
        {showRestrict && (
          <RestrictUserDialog
            workerName={workerName}
            upcomingShifts={restriction?.workerUpcomingShifts ?? 0}
            onApply={handleApplyRestriction}
            onClose={() => setShowRestrict(false)}
          />
        )}
        {showLift && restriction && (
          <LiftRestrictionDialog
            workerName={workerName}
            onConfirm={handleLift}
            onClose={() => setShowLift(false)}
          />
        )}
        {showAppealReview && restriction?.appeal && (
          <AppealReviewDialog
            appeal={restriction.appeal}
            onAccept={(response) => {
              onRestrictionChange({ ...restriction, appeal: { ...restriction.appeal!, status: 'accepted', response, respondedAt: new Date().toISOString() } })
              setShowAppealReview(false)
              showToast('Appeal accepted.')
            }}
            onReject={(response) => {
              onRestrictionChange({ ...restriction, appeal: { ...restriction.appeal!, status: 'rejected', response, respondedAt: new Date().toISOString() } })
              setShowAppealReview(false)
              showToast('Appeal rejected.')
            }}
            onClose={() => setShowAppealReview(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
