import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ShieldAlert, Eye, Sliders, Ban, TriangleAlert, Check,
} from 'lucide-react'
import {
  type RestrictionReason, type RestrictionRemedy, type AccessLevel,
  type RestrictionCapability,
  CAPABILITY_GROUPS, CAPABILITY_LABELS, REASON_LABELS, REMEDY_LABELS,
} from '../../data/restrictionMockData.ts'

interface RestrictUserDialogProps {
  workerName: string
  upcomingShifts?: number
  onApply: (data: {
    reason: RestrictionReason
    message: string
    internalNote: string
    accessLevel: AccessLevel
    restrictions: RestrictionCapability[]
    remedy: RestrictionRemedy
    canAppeal: boolean
    expiresAt: string
  }) => void
  onClose: () => void
}

// ─── Access level option ──────────────────────────────────────────────────────

function AccessLevelOption({
  value, selected, onSelect,
}: {
  value: AccessLevel
  selected: boolean
  onSelect: () => void
}) {
  const configs: Record<AccessLevel, { icon: React.FC<{ size?: number; className?: string }>; label: string; desc: string; danger?: boolean }> = {
    read_only: {
      icon: Eye,
      label: 'Read only',
      desc: 'The worker can view permitted information but cannot perform work-changing actions.',
    },
    limited: {
      icon: Sliders,
      label: 'Limited',
      desc: 'Choose exactly which actions to block.',
    },
    none: {
      icon: Ban,
      label: 'Suspended',
      desc: 'The worker cannot access the normal TimeShift app.',
      danger: true,
    },
  }
  const cfg = configs[value]
  const Icon = cfg.icon
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
        selected
          ? cfg.danger
            ? 'border-red-400 bg-red-50'
            : 'border-[#1E3A5F] bg-[#1E3A5F]/4'
          : 'border-[#E2E8F0] hover:border-slate-300 bg-white'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        selected ? (cfg.danger ? 'bg-red-100' : 'bg-[#1E3A5F]/10') : 'bg-slate-100'
      }`}>
        <Icon size={14} className={selected ? (cfg.danger ? 'text-red-600' : 'text-[#1E3A5F]') : 'text-slate-500'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-bold ${selected ? (cfg.danger ? 'text-red-700' : 'text-[#1E3A5F]') : 'text-slate-700'}`}>{cfg.label}</p>
          {selected && <Check size={13} className={cfg.danger ? 'text-red-500' : 'text-[#1E3A5F]'} />}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{cfg.desc}</p>
      </div>
    </button>
  )
}

// ─── Capability picker ────────────────────────────────────────────────────────

function CapabilityPicker({
  selected,
  onChange,
}: {
  selected: RestrictionCapability[]
  onChange: (caps: RestrictionCapability[]) => void
}) {
  const toggle = (c: RestrictionCapability) => {
    onChange(selected.includes(c) ? selected.filter(x => x !== c) : [...selected, c])
  }
  return (
    <div className="bg-slate-50 border border-[#E2E8F0] rounded-xl p-4">
      <p className="text-xs font-semibold text-slate-600 mb-3">Block these actions</p>
      {CAPABILITY_GROUPS.map(group => (
        <div key={group.label} className="mb-3 last:mb-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{group.label}</p>
          {group.items.map(cap => (
            <label key={cap} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selected.includes(cap)}
                onChange={() => toggle(cap)}
                className="w-4 h-4 rounded border-slate-300 accent-[#1E3A5F] cursor-pointer"
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                {CAPABILITY_LABELS[cap]}
              </span>
            </label>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Suspension confirmation ──────────────────────────────────────────────────

function SuspendConfirm({
  workerName,
  upcomingShifts,
  onConfirm,
  onCancel,
}: {
  workerName: string
  upcomingShifts?: number
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          <Ban size={18} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Suspend {workerName}?</h3>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">
        {workerName} will lose access to the normal TimeShift app immediately.
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
        <p className="text-xs font-semibold text-slate-600 mb-2">They can still:</p>
        <ul className="flex flex-col gap-1">
          {['See why access was suspended', 'Use the selected remedy', 'Submit an appeal if allowed', 'Sign out'].map(item => (
            <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
              <span className="w-1 h-1 rounded-full bg-slate-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      {upcomingShifts && upcomingShifts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
          <TriangleAlert size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-900">{workerName} has {upcomingShifts} accepted upcoming shifts.</p>
            <p className="text-xs text-amber-700 mt-0.5">Suspending the account does not automatically reassign these shifts.</p>
            <button className="text-xs font-semibold text-amber-800 underline mt-1.5">View shifts</button>
          </div>
        </div>
      )}
      <div className="flex gap-2.5">
        <button onClick={onCancel} className="flex-1 h-10 text-sm font-semibold text-slate-600 border border-[#E2E8F0] rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
        <button onClick={onConfirm} className="flex-1 h-10 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">Suspend account</button>
      </div>
    </div>
  )
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export function RestrictUserDialog({ workerName, upcomingShifts, onApply, onClose }: RestrictUserDialogProps) {
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [reason, setReason] = useState<RestrictionReason>('document_expired')
  const [message, setMessage] = useState('Your right-to-work document has expired. Please upload an updated copy.')
  const [internalNote, setInternalNote] = useState('')
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('limited')
  const [restrictions, setRestrictions] = useState<RestrictionCapability[]>(['accept_jobs', 'claim_jobs', 'clock_in'])
  const [remedy, setRemedy] = useState<RestrictionRemedy>('upload_document')
  const [canAppeal, setCanAppeal] = useState(true)
  const [expiresAt, setExpiresAt] = useState('')

  const handleNext = () => {
    if (accessLevel === 'none') { setStep('confirm'); return }
    handleApply()
  }

  const handleApply = () => {
    onApply({ reason, message, internalNote, accessLevel, restrictions, remedy, canAppeal, expiresAt })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.22 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg mx-0 sm:mx-4 max-h-[90vh] flex flex-col overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {step === 'confirm' ? (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
                <h2 className="text-base font-bold text-slate-900">Confirm suspension</h2>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={15} /></button>
              </div>
              <SuspendConfirm
                workerName={workerName}
                upcomingShifts={upcomingShifts}
                onConfirm={handleApply}
                onCancel={() => setStep('form')}
              />
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col overflow-hidden flex-1">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <ShieldAlert size={15} className="text-amber-600" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Restrict worker access</h2>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={15} /></button>
              </div>

              <div className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-5">
                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reason</label>
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value as RestrictionReason)}
                    className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
                  >
                    {(Object.entries(REASON_LABELS) as [RestrictionReason, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Message to worker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-0.5">Message to worker <span className="text-red-400">*</span></label>
                  <p className="text-[11px] text-slate-400 mb-1.5">The worker will see this.</p>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 resize-none transition-all"
                  />
                </div>

                {/* Access level */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Access level</label>
                  <div className="flex flex-col gap-2">
                    {(['read_only', 'limited', 'none'] as AccessLevel[]).map(level => (
                      <AccessLevelOption key={level} value={level} selected={accessLevel === level} onSelect={() => setAccessLevel(level)} />
                    ))}
                  </div>
                </div>

                {/* Capability picker (limited only) */}
                <AnimatePresence>
                  {accessLevel === 'limited' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                      <CapabilityPicker selected={restrictions} onChange={setRestrictions} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Remedy */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Remedy</label>
                  <select
                    value={remedy}
                    onChange={e => setRemedy(e.target.value as RestrictionRemedy)}
                    className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
                  >
                    {(Object.entries(REMEDY_LABELS) as [RestrictionRemedy, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>

                {/* Can appeal + end date row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Can appeal</label>
                    <button
                      onClick={() => setCanAppeal(a => !a)}
                      className={`h-10 w-full rounded-xl border text-sm font-semibold transition-colors ${canAppeal ? 'bg-[#1E3A5F] border-[#1E3A5F] text-white' : 'bg-white border-[#E2E8F0] text-slate-500'}`}
                    >
                      {canAppeal ? 'Yes' : 'No'}
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">End date (optional)</label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={e => setExpiresAt(e.target.value)}
                      className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
                    />
                  </div>
                </div>

                {/* Internal note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-0.5">Internal note</label>
                  <p className="text-[11px] text-slate-400 mb-1.5">Managers/admins only. The worker will never see this.</p>
                  <textarea
                    value={internalNote}
                    onChange={e => setInternalNote(e.target.value)}
                    rows={2}
                    placeholder="Notes for your team…"
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 resize-none transition-all"
                  />
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] px-5 py-4 flex gap-2.5 shrink-0">
                <button onClick={onClose} className="h-10 px-4 text-sm font-semibold text-slate-600 border border-[#E2E8F0] rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                <button
                  onClick={handleNext}
                  disabled={!message.trim()}
                  className={`flex-1 h-10 text-sm font-bold rounded-xl transition-colors disabled:opacity-40 ${
                    accessLevel === 'none' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-[#1E3A5F] text-white hover:bg-[#162D4A]'
                  }`}
                >
                  {accessLevel === 'none' ? 'Continue' : 'Apply restriction'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
