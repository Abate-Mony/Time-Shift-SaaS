import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert, CalendarDays, Upload, Scale, MessageSquare, LogOut,
  Check, X, FileUp, Loader2,
} from 'lucide-react'
import { fmtDate, REASON_LABELS } from '@/data/restrictionMockData.ts';
import { logoutUser } from '@/utils/logout';
import { getMyRestriction, submitRestrictionAppeal } from '@/utils/api-request-functions';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

// ─── Appeal dialog ────────────────────────────────────────────────────────────

function AppealDialog({ onSubmit, onClose }: { onSubmit: (msg: string) => Promise<boolean>; onClose: () => void }) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.22 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-slate-900">Submit an appeal</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={15} /></button>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-500 mb-3">Explain why you think this restriction should be reviewed.</p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            placeholder="Describe your situation…"
            className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 resize-none transition-all"
          />
          <p className="text-xs text-slate-400 mt-2">Your message will be sent to your manager.</p>
        </div>
        <div className="flex gap-2.5 px-5 pb-5">
          <button onClick={onClose} className="flex-1 h-10 text-sm font-semibold text-slate-600 border border-[#E2E8F0] rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
          <button
            onClick={async () => {
              if (!message.trim()) return
              setSubmitting(true)
              const ok = await onSubmit(message)
              setSubmitting(false)
              if (!ok) return
            }}
            disabled={!message.trim() || submitting}
            className="flex-1 h-10 text-sm font-bold bg-[#1E3A5F] text-white rounded-xl hover:bg-[#162D4A] disabled:opacity-40 transition-colors flex items-center justify-center"
          >
            {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit appeal'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Document upload dialog ───────────────────────────────────────────────────

function DocumentUploadDialog({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.22 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md"
      >
        {done ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">Document submitted</h3>
            <p className="text-sm text-slate-500 leading-relaxed">Your manager will review it. Your current restriction remains until approved.</p>
            <button onClick={onClose} className="mt-5 h-10 px-6 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
              <h3 className="text-base font-bold text-slate-900">Upload document</h3>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={15} /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-0.5">Required</p>
                <p className="text-sm font-bold text-slate-900">Right-to-work document</p>
                <p className="text-xs text-slate-400 mt-0.5">PDF, JPG or PNG</p>
              </div>
              <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-[#1E3A5F]/30 hover:bg-slate-50'}`}>
                <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                <FileUp size={20} className={`mb-2 ${file ? 'text-emerald-500' : 'text-slate-400'}`} />
                <p className={`text-sm font-semibold ${file ? 'text-emerald-700' : 'text-slate-600'}`}>{file ? file.name : 'Choose file'}</p>
                {!file && <p className="text-xs text-slate-400 mt-0.5">or drag and drop</p>}
              </label>
            </div>
            <div className="flex gap-2.5 px-5 pb-5">
              <button onClick={onClose} className="h-10 px-4 text-sm font-semibold text-slate-600 border border-[#E2E8F0] rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button
                onClick={() => { if (!file) return; setSubmitting(true); setTimeout(() => { setSubmitting(false); setDone(true) }, 1000) }}
                disabled={!file || submitting}
                className="flex-1 h-10 text-sm font-bold bg-[#1E3A5F] text-white rounded-xl hover:bg-[#162D4A] disabled:opacity-40 transition-colors flex items-center justify-center"
              >
                {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit for review'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Main suspended page ──────────────────────────────────────────────────────

export function SuspendedAccountPage() {
  const navigate = useNavigate()
  const { data: restriction, isPending } = useQuery({
    queryKey: ['my-restriction'],
    queryFn: getMyRestriction,
  })
  const [showAppeal, setShowAppeal] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [appealSubmitted, setAppealSubmitted] = useState(false)

  useEffect(() => {
    setAppealSubmitted(restriction?.appeal?.status === 'pending')
  }, [restriction?.appeal?.status])

  // Nothing to show once the restriction is gone (lifted, expired, or the
  // worker landed here without one) — this screen only makes sense while
  // accessLevel is genuinely "none".
  useEffect(() => {
    if (!isPending && (!restriction || restriction.accessLevel !== 'none')) {
      navigate('/worker', { replace: true })
    }
  }, [isPending, restriction, navigate])

  const onSignOut = async () => {
    await logoutUser()
  }

  const handleSubmitAppeal = async (message: string) => {
    const ok = await submitRestrictionAppeal(message)
    if (ok) {
      setAppealSubmitted(true)
      setShowAppeal(false)
    }
    return ok
  }

  if (isPending || !restriction || restriction.accessLevel !== 'none') {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <Loader2 size={22} className="text-white/40 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
          <span className="text-white font-bold text-xs">W</span>
        </div>
        <span className="text-white font-semibold text-base tracking-tight">work<span className="text-blue-400">.wrk</span></span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm flex flex-col gap-4"
        >
          {/* Icon + title */}
          <div className="text-center mb-2">
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={28} className="text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Your account is temporarily suspended</h1>
            <p className="text-sm text-white/50 leading-relaxed">
              You can still see why access was suspended and use the options below.
            </p>
          </div>

          {/* Reason card */}
          <div className="bg-white/6 border border-white/10 rounded-2xl p-5">
            <div className="divide-y divide-white/8">
              <div className="flex items-start justify-between py-2.5 gap-3">
                <span className="text-xs text-white/45">Reason</span>
                <span className="text-xs font-semibold text-white/90 text-right">{REASON_LABELS[restriction!.reason]}</span>
              </div>
              <div className="flex items-start justify-between py-2.5 gap-3">
                <span className="text-xs text-white/45">Suspended</span>
                <span className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                  <CalendarDays size={11} className="text-white/30" />
                  {fmtDate(restriction!.startsAt)}
                </span>
              </div>
              {restriction!.expiresAt && (
                <div className="flex items-start justify-between py-2.5 gap-3">
                  <span className="text-xs text-white/45">Restriction ends</span>
                  <span className="text-xs font-semibold text-white/90">{fmtDate(restriction!.expiresAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="bg-amber-500/10 border border-amber-400/20 rounded-2xl p-5">
            <p className="text-sm text-amber-200 leading-relaxed">{restriction!.message}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            {restriction!.remedy === 'upload_document' && (
              <button
                onClick={() => setShowUpload(true)}
                className="w-full h-12 flex items-center justify-center gap-2 bg-white text-[#0A1628] text-sm font-bold rounded-xl hover:bg-white/90 transition-colors"
              >
                <Upload size={15} /> Upload document
              </button>
            )}
            {restriction!.canAppeal && !appealSubmitted && (
              <button
                onClick={() => setShowAppeal(true)}
                className="w-full h-12 flex items-center justify-center gap-2 bg-white/10 border border-white/15 text-white text-sm font-semibold rounded-xl hover:bg-white/15 transition-colors"
              >
                <Scale size={15} /> Submit appeal
              </button>
            )}
            {appealSubmitted && (
              <div className="bg-blue-500/15 border border-blue-400/20 rounded-xl px-4 py-3 flex items-center gap-2.5">
                <Scale size={14} className="text-blue-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Appeal submitted</p>
                  <p className="text-xs text-white/50">Waiting for manager review.</p>
                </div>
              </div>
            )}
            {restriction!.remedy === 'contact_manager' && (
              <button className="w-full h-12 flex items-center justify-center gap-2 bg-white/10 border border-white/15 text-white text-sm font-semibold rounded-xl hover:bg-white/15 transition-colors">
                <MessageSquare size={15} /> Contact manager
              </button>
            )}
          </div>

          {/* Sign out */}
          <button
            onClick={onSignOut}
            className="w-full h-11 flex items-center justify-center gap-2 text-white/40 text-sm font-semibold hover:text-white/70 transition-colors mt-2"
          >
            <LogOut size={14} /> Sign out
          </button>
        </motion.div>
      </div>

      {/* Dialogs */}
      <AnimatePresence>
        {showAppeal && (
          <AppealDialog
            onSubmit={handleSubmitAppeal}
            onClose={() => setShowAppeal(false)}
          />
        )}
        {showUpload && <DocumentUploadDialog onClose={() => setShowUpload(false)} />}
      </AnimatePresence>
    </div>
  )
}
