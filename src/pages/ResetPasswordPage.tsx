import customFetch from "@/utils/customFetch"
import { isAxiosError } from "axios"
import { motion } from "framer-motion"
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"

function PasswordField({
  label, value, onChange, error, show, onToggleShow, autoComplete, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string
  show: boolean; onToggleShow: () => void; autoComplete: string; disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete={autoComplete}
          disabled={disabled}
          className={`w-full h-11 px-3.5 pr-11 rounded-xl border text-sm text-slate-800 bg-white placeholder:text-slate-400 transition-all outline-none
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            disabled:opacity-60 disabled:cursor-not-allowed
            ${error ? "border-red-400 bg-red-50/30 focus:ring-red-400/20 focus:border-red-400" : "border-slate-200 hover:border-slate-300"}`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

function InvalidLinkState() {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-2">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <AlertCircle size={28} className="text-red-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Invalid reset link</h2>
        <p className="text-sm text-slate-500">This password reset link is missing or malformed.</p>
      </div>
      <Link
        to="/auth/forgot-password"
        className="w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold flex items-center justify-center hover:bg-[#162D4A] transition-colors"
      >
        Request a new link
      </Link>
    </div>
  )
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const navigate = useNavigate()

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({})
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // Never call the API with an empty token — this is the direct-bookmark /
  // stripped-query-string case, not something the backend needs to reject.
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center px-4">
        <div className="w-full max-w-[440px] bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-slate-200/60 p-7 sm:p-8">
          <InvalidLinkState />
        </div>
      </div>
    )
  }

  const validate = () => {
    const errs: { password?: string; confirm?: string } = {}
    if (password.length < 8) errs.password = "Password must be at least 8 characters"
    if (confirm !== password) errs.confirm = "Passwords don't match"
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length) return

    setFormError("")
    setSubmitting(true)
    try {
      await customFetch.post("/auth/reset-password", { token, password })
      // Backend clears the session/cookies on this response — there's
      // nothing to log the user into, so land them back on login rather
      // than trying to auto-authenticate.
      setDone(true)
    } catch (err) {
      setFormError(
        isAxiosError(err)
          ? (err.response?.data?.msg ?? err.response?.data?.message ?? "This reset link is invalid or has expired.")
          : "This reset link is invalid or has expired."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center px-4">
      <div className="w-full max-w-[440px] bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-slate-200/60 p-7 sm:p-8">
        {done ? (
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center"
            >
              <CheckCircle2 size={28} className="text-emerald-600" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Password reset</h2>
              <p className="text-sm text-slate-500">Please log in with your new password.</p>
            </div>
            <button
              onClick={() => navigate("/auth")}
              className="w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold flex items-center justify-center hover:bg-[#162D4A] transition-colors"
            >
              Continue to login
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Lock size={18} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Set a new password</h1>
                <p className="text-sm text-slate-500">Choose something you haven't used before</p>
              </div>
            </div>

            {formError && (
              <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <PasswordField
                label="New password"
                value={password}
                onChange={v => { setPassword(v); setFieldErrors(e => ({ ...e, password: undefined })) }}
                error={fieldErrors.password}
                show={showPassword}
                onToggleShow={() => setShowPassword(s => !s)}
                autoComplete="new-password"
                disabled={submitting}
              />
              <PasswordField
                label="Confirm password"
                value={confirm}
                onChange={v => { setConfirm(v); setFieldErrors(e => ({ ...e, confirm: undefined })) }}
                error={fieldErrors.confirm}
                show={showConfirm}
                onToggleShow={() => setShowConfirm(s => !s)}
                autoComplete="new-password"
                disabled={submitting}
              />

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: submitting ? 1 : 1.01 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
                className="w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 hover:bg-[#162D4A] transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-1"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" />Resetting…</>
                ) : (
                  <>Reset password<ArrowRight size={15} /></>
                )}
              </motion.button>
            </form>

            {/* Always available, not just on error — no need to guess whether
                a given 400 was a bad/expired token vs. a validation issue. */}
            <p className="text-center text-xs text-slate-400 mt-6">
              Trouble with this link?{" "}
              <Link to="/auth/forgot-password" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                Request a new one
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
