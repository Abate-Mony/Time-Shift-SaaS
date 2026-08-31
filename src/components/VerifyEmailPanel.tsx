import customFetch from "@/utils/customFetch"
import { isAxiosError } from "axios"
import { motion } from "framer-motion"
import { AlertCircle, Check, Mail, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

// Reused on two screens: right after signup (still holding the session from
// account creation), and standalone via /auth/verify-email?email=... when an
// unverified user tries to log in later and needs a way back to this step.
export function VerifyEmailPanel({ email }: { email: string }) {
  const [countdown, setCountdown] = useState(45)
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleResend = async () => {
    setStatus("sending")
    setErrorMsg("")
    try {
      await customFetch.post("/auth/resend-verification", { email })
      setStatus("sent")
      setCountdown(45)
      setTimeout(() => setStatus("idle"), 3000)
    } catch (err) {
      setStatus("error")
      setErrorMsg(
        isAxiosError(err)
          ? (err.response?.data?.msg ?? "Couldn't resend the email. Try again.")
          : "Couldn't resend the email. Try again."
      )
    }
  }

  return (
    <div className="flex flex-col items-center text-center gap-5">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200/60 flex items-center justify-center shadow-lg shadow-blue-100">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="12" width="40" height="28" rx="4" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" />
            <path d="M4 16l20 14 20-14" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
            <motion.circle
              cx="38" cy="12" r="7" fill="#10B981"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            />
            <motion.path
              d="M34.5 12l2.5 2.5 4-4"
              stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            />
          </svg>
        </div>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-blue-300"
            style={{ top: 8 + i * 6, right: -8 - i * 3 }}
            animate={{ y: [0, -6, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </motion.div>

      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Verify your email</h2>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
          We sent a verification link to:
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2.5">
          <Mail size={14} className="text-slate-500" />
          <p className="text-sm font-semibold text-slate-800">{email}</p>
        </div>
      </div>

      {status === "error" && (
        <div className="w-full flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-left">
          <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{errorMsg}</p>
        </div>
      )}

      <div className="w-full flex flex-col gap-3 mt-1">
        <button
          onClick={handleResend}
          disabled={countdown > 0 || status === "sending"}
          className={`w-full h-11 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all
            ${countdown > 0 || status === "sending" ? "border-slate-200 text-slate-400 cursor-not-allowed" : "border-[#E2E8F0] text-slate-700 hover:bg-slate-50"}`}
        >
          {status === "sending" ? (
            <><RefreshCw size={14} className="animate-spin" />Sending…</>
          ) : status === "sent" ? (
            <><Check size={14} className="text-emerald-500" />Email sent!</>
          ) : countdown > 0 ? (
            <><RefreshCw size={14} />Resend in {countdown}s</>
          ) : (
            <><RefreshCw size={14} />Resend Verification Email</>
          )}
        </button>
      </div>
    </div>
  )
}
