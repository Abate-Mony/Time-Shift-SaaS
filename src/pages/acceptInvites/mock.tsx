import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Eye, EyeOff, ArrowRight, AlertTriangle, Clock, Ban, Mail } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type InviteStatus = 'loading' | 'new-user' | 'existing-user' | 'success' | 'expired' | 'revoked' | 'already-accepted' | 'invalid'

interface InviteData {
  company: string
  role: 'worker' | 'manager'
  email: string
  invitedBy: string
}

// ─── Mock invite data ─────────────────────────────────────────────────────────

const MOCK_INVITE: InviteData = {
  company: 'Sparkle Cleaning Ltd',
  role: 'worker',
  email: 'john@example.com',
  invitedBy: 'Sarah Jones',
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-2.5 justify-center mb-8">
      <div className="w-8 h-8 rounded-xl bg-[#1E3A5F] flex items-center justify-center">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
          <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="white" />
          <rect x="9.5" y="1" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.6" />
          <rect x="1" y="9.5" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.6" />
          <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.3" />
        </svg>
      </div>
      <span className="text-base font-bold text-slate-800">work<span className="text-slate-300">.wrk</span></span>
    </div>
  )
}

// ─── Invitation summary card ──────────────────────────────────────────────────

function InvitationSummary({ invite }: { invite: InviteData }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 mb-6">
      {[
        { label: 'Company', value: invite.company },
        { label: 'Role', value: invite.role === 'worker' ? 'Worker' : 'Manager' },
        { label: 'Email', value: invite.email },
      ].map((row, i, arr) => (
        <div key={row.label} className={`flex items-center justify-between py-2 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
          <span className="text-sm text-slate-500">{row.label}</span>
          <span className="text-sm font-semibold text-slate-800">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Input field ──────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputCls = (err?: string) =>
  `w-full h-11 px-4 border rounded-xl text-sm text-slate-800 bg-white placeholder:text-slate-400
   focus:outline-none focus:ring-2 transition-all ${
    err
      ? 'border-red-400 focus:ring-red-100'
      : 'border-slate-200 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40'
  }`

// ─── Password field with visibility toggle ────────────────────────────────────

function PasswordInput({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void; placeholder?: string; error?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        className={inputCls(error) + ' pr-11'}
        placeholder={placeholder ?? '••••••••'}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

// ─── OR divider ───────────────────────────────────────────────────────────────

function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs text-slate-400 font-medium">or</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  )
}

// ─── Google button ────────────────────────────────────────────────────────────

function GoogleButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="w-full h-11 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2.5"
    >
      <svg viewBox="0 0 18 18" width="16" height="16">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
      </svg>
      {label}
    </button>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-4">
      <div className="h-5 bg-slate-200 rounded-lg w-2/3 mx-auto" />
      <div className="h-4 bg-slate-200 rounded-lg w-1/2 mx-auto" />
      <div className="h-20 bg-slate-100 rounded-xl mt-2" />
      <div className="h-4 bg-slate-200 rounded-lg w-full mt-2" />
      <div className="h-11 bg-slate-200 rounded-xl" />
      <div className="h-11 bg-slate-200 rounded-xl" />
      <div className="h-11 bg-slate-100 rounded-xl" />
    </div>
  )
}

// ─── State screens ────────────────────────────────────────────────────────────

function ExpiredScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="text-center py-4">
      <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
        <Clock size={22} className="text-amber-500" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-2">Invitation expired</h2>
      <p className="text-sm text-slate-500 leading-relaxed mb-2">
        This invitation is no longer valid.
      </p>
      <p className="text-sm text-slate-500 leading-relaxed mb-8">
        Ask a manager at <strong className="text-slate-700">Sparkle Cleaning Ltd</strong> to send you a new invitation.
      </p>
      <button
        onClick={onSignIn}
        className="w-full h-11 border border-slate-200 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
      >
        Back to sign in
      </button>
    </div>
  )
}

function RevokedScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="text-center py-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
        <Ban size={22} className="text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-2">Invitation no longer available</h2>
      <p className="text-sm text-slate-500 leading-relaxed mb-8">
        This invitation has been cancelled by <strong className="text-slate-700">Sparkle Cleaning Ltd</strong>. Contact your manager if you believe this is a mistake.
      </p>
      <button onClick={onSignIn} className="w-full h-11 border border-slate-200 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
        Back to sign in
      </button>
    </div>
  )
}

function AlreadyAcceptedScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="text-center py-4">
      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 size={22} className="text-emerald-500" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-2">Invitation already accepted</h2>
      <p className="text-sm text-slate-500 leading-relaxed mb-8">
        This invitation has already been used.
      </p>
      <button onClick={onSignIn} className="w-full h-11 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors">
        Sign in
      </button>
    </div>
  )
}

function InvalidScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="text-center py-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
        <AlertTriangle size={22} className="text-slate-400" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-2">Invitation not found</h2>
      <p className="text-sm text-slate-500 leading-relaxed mb-8">
        This invitation link may be invalid or no longer available.
      </p>
      <button onClick={onSignIn} className="w-full h-11 border border-slate-200 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
        Go to sign in
      </button>
    </div>
  )
}

function SuccessScreen({ invite, onDone }: { invite: InviteData; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="text-center py-4">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 relative"
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1.3, opacity: 0 }}
          transition={{ duration: 0.7, repeat: 1, delay: 0.2 }}
          className="absolute inset-0 rounded-full border-2 border-emerald-400"
        />
        <CheckCircle2 size={32} className="text-emerald-500" strokeWidth={1.5} />
      </motion.div>
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">All set</p>
      <h2 className="text-xl font-bold text-slate-900 mb-2">{"You're all set!"}</h2>
      <p className="text-sm text-slate-500 leading-relaxed mb-8">
        {"You've joined "}
        <strong className="text-slate-700">{invite.company}</strong>
        {` as a ${invite.role === 'worker' ? 'Worker' : 'Manager'}.`}
      </p>
      <button
        onClick={onDone}
        className="w-full h-11 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center justify-center gap-2"
      >
        {invite.role === 'worker' ? 'Go to my jobs' : 'Go to dashboard'}
        <ArrowRight size={14} />
      </button>
      <p className="text-xs text-slate-400 mt-3">Redirecting automatically in a moment…</p>
    </div>
  )
}

// ─── New user form ────────────────────────────────────────────────────────────

function NewUserForm({ invite, onSuccess }: { invite: InviteData; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Enter your full name.'
    if (password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (password !== confirm) errs.confirm = 'Passwords do not match.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submit = () => {
    if (!validate()) return
    setLoading(true)
    setTimeout(onSuccess, 1500)
  }

  return (
    <div className="flex flex-col gap-4">
      <InvitationSummary invite={invite} />

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Create your account</p>
        <div className="flex flex-col gap-4">
          <Field label="Full name" error={errors.name}>
            <input className={inputCls(errors.name)} placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} />
          </Field>
          <Field label="Email address">
            <input className={inputCls() + ' bg-slate-50 text-slate-500 cursor-not-allowed'} value={invite.email} readOnly tabIndex={-1} />
          </Field>
          <Field label="Password" error={errors.password}>
            <PasswordInput value={password} onChange={setPassword} error={errors.password} />
            {!errors.password && <p className="text-xs text-slate-400">At least 8 characters.</p>}
          </Field>
          <Field label="Confirm password" error={errors.confirm}>
            <PasswordInput value={confirm} onChange={setConfirm} placeholder="Re-enter password" error={errors.confirm} />
          </Field>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="w-full h-11 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {loading
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Accepting invitation…</>
          : 'Accept invitation & create account'
        }
      </button>

      <OrDivider />
      <GoogleButton label="Continue with Google" />
    </div>
  )
}

// ─── Existing user form ───────────────────────────────────────────────────────

function ExistingUserForm({ invite, onSuccess }: { invite: InviteData; onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const submit = () => {
    const errs: Record<string, string> = {}
    if (!password) errs.password = 'Enter your password.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    setTimeout(onSuccess, 1500)
  }

  return (
    <div className="flex flex-col gap-4">
      <InvitationSummary invite={invite} />

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">You already have an account</h3>
        <p className="text-sm text-slate-500 mb-4">
          Sign in to accept your invitation to <strong className="text-slate-700">{invite.company}</strong>.
        </p>
        <div className="flex flex-col gap-4">
          <Field label="Email address">
            <input className={inputCls() + ' bg-slate-50 text-slate-500 cursor-not-allowed'} value={invite.email} readOnly tabIndex={-1} />
          </Field>
          <Field label="Password" error={errors.password}>
            <PasswordInput value={password} onChange={setPassword} error={errors.password} />
          </Field>
          <button className="text-xs text-[#1E3A5F] font-semibold text-left hover:underline">
            Forgot password?
          </button>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="w-full h-11 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {loading
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in…</>
          : 'Sign in & accept invitation'
        }
      </button>

      <OrDivider />
      <GoogleButton label="Continue with Google" />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

// Prototype toggle: cycle through all states for demo
const DEMO_STATES: InviteStatus[] = ['new-user', 'existing-user', 'expired', 'revoked', 'already-accepted', 'invalid']

export function AcceptInvite({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState<InviteStatus>('loading')
  const [demoIdx, setDemoIdx] = useState(0)

  // Simulate loading → resolve
  useEffect(() => {
    const t = setTimeout(() => setStatus('new-user'), 1400)
    return () => clearTimeout(t)
  }, [])

  const cycleDemo = () => {
    const next = (demoIdx + 1) % DEMO_STATES.length
    setDemoIdx(next)
    setStatus(DEMO_STATES[next])
  }

  const invite = MOCK_INVITE

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Logo />

        {/* Invitation header (shown when invite is valid) */}
        <AnimatePresence mode="wait">
          {['new-user', 'existing-user', 'loading'].includes(status) && (
            <motion.div
              key="invite-header"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="text-center mb-6"
            >
              <div className="w-12 h-12 rounded-full bg-[#1E3A5F]/8 flex items-center justify-center mx-auto mb-4">
                <Mail size={20} className="text-[#1E3A5F]" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#1E3A5F] mb-1">{"You're invited"}</p>
              <h1 className="text-xl font-bold text-slate-900">
                {"Join "}
                <span className="text-[#1E3A5F]">{invite.company}</span>
              </h1>
              {status !== 'loading' && (
                <p className="text-sm text-slate-500 mt-1.5">
                  {invite.invitedBy} invited you as a{' '}
                  <span className="font-semibold text-slate-700">{invite.role === 'worker' ? 'Worker' : 'Manager'}</span>.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <AnimatePresence mode="wait">
            {status === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LoadingSkeleton />
              </motion.div>
            )}
            {status === 'new-user' && (
              <motion.div key="new-user" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <NewUserForm invite={invite} onSuccess={() => setStatus('success')} />
              </motion.div>
            )}
            {status === 'existing-user' && (
              <motion.div key="existing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <ExistingUserForm invite={invite} onSuccess={() => setStatus('success')} />
              </motion.div>
            )}
            {status === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <SuccessScreen invite={invite} onDone={onDone} />
              </motion.div>
            )}
            {status === 'expired' && (
              <motion.div key="expired" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <ExpiredScreen onSignIn={onDone} />
              </motion.div>
            )}
            {status === 'revoked' && (
              <motion.div key="revoked" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <RevokedScreen onSignIn={onDone} />
              </motion.div>
            )}
            {status === 'already-accepted' && (
              <motion.div key="accepted" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <AlreadyAcceptedScreen onSignIn={onDone} />
              </motion.div>
            )}
            {status === 'invalid' && (
              <motion.div key="invalid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <InvalidScreen onSignIn={onDone} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Demo switcher */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            onClick={cycleDemo}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors border border-slate-200 rounded-lg px-3 py-1.5"
          >
            Demo: cycle states →
          </button>
          <p className="text-[10px] text-slate-300 uppercase tracking-wider">{status}</p>
        </div>

        <p className="text-xs text-slate-400 text-center mt-6">
          Powered by{' '}
          <span className="font-semibold text-slate-600">work.wrk</span>
        </p>
      </div>
    </div>
  )
}
