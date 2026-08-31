import customFetch from "@/utils/customFetch"
import { isAxiosError } from "axios"
import { motion } from "framer-motion"
import { AlertCircle, ArrowRight, ChevronLeft, Loader2, Mail } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return setFieldError("Email is required")
    if (!EMAIL_RE.test(email)) return setFieldError("Enter a valid email address")

    setFieldError("")
    setStatus("submitting")
    try {
      await customFetch.post("/auth/forgot-password", { email })
      // Backend always returns the same generic success regardless of
      // whether the email exists — never branch UI on "not found" here,
      // that would defeat the point of the generic response.
      setStatus("sent")
    } catch (err) {
      setStatus("idle")
      setFieldError(
        isAxiosError(err)
          ? (err.response?.data?.msg ?? "Enter a valid email address")
          : "Something went wrong"
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center px-4">
      <div className="w-full max-w-[440px]">
        <Link
          to="/auth"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-6 w-fit"
        >
          <ChevronLeft size={16} />
          Back to login
        </Link>

        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-slate-200/60 p-7 sm:p-8">
          {status === "sent" ? (
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center"
              >
                <Mail size={26} className="text-blue-600" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Check your email</h2>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                  If an account exists for <span className="font-semibold text-slate-700">{email}</span>,
                  a reset link is on its way — it expires in 30 minutes.
                </p>
              </div>
              <Link
                to="/auth"
                className="w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold flex items-center justify-center hover:bg-[#162D4A] transition-colors mt-2"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">Forgot password?</h1>
                <p className="text-sm text-slate-500">Enter your email and we'll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setFieldError("") }}
                    placeholder="you@company.com"
                    autoComplete="email"
                    disabled={status === "submitting"}
                    className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-800 bg-white placeholder:text-slate-400 transition-all outline-none
                      focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                      disabled:opacity-60 disabled:cursor-not-allowed
                      ${fieldError ? "border-red-400 bg-red-50/30 focus:ring-red-400/20 focus:border-red-400" : "border-slate-200 hover:border-slate-300"}`}
                  />
                  {fieldError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={11} /> {fieldError}
                    </p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={status === "submitting"}
                  whileHover={{ scale: status === "submitting" ? 1 : 1.01 }}
                  whileTap={{ scale: status === "submitting" ? 1 : 0.98 }}
                  className="w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 hover:bg-[#162D4A] transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-1"
                >
                  {status === "submitting" ? (
                    <><Loader2 size={16} className="animate-spin" />Sending…</>
                  ) : (
                    <>Send reset link<ArrowRight size={15} /></>
                  )}
                </motion.button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
