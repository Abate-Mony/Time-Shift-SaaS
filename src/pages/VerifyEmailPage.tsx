import { VerifyEmailPanel } from "@/components/VerifyEmailPanel"
import customFetch from "@/utils/customFetch"
import { isAxiosError } from "axios"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router"

type TokenStatus = "verifying" | "success" | "error"

// Consumes the ?token=... from the emailed verification link. Guarded with a
// ref, not just the effect dependency array, because React 18 Strict Mode
// double-invokes effects in dev — without it, the second call would hit an
// already-consumed token and show a false "expired" error.
function TokenVerifier({ token }: { token: string }) {
  const [status, setStatus] = useState<TokenStatus>("verifying")
  const [errorMsg, setErrorMsg] = useState("")
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    customFetch.post("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch(err => {
        setStatus("error")
        setErrorMsg(
          isAxiosError(err)
            ? (err.response?.data?.msg ?? "This verification link has expired or is invalid.")
            : "This verification link has expired or is invalid."
        )
      })
  }, [token])

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-6">
        <Loader2 size={28} className="animate-spin text-blue-500" />
        <p className="text-sm text-slate-500">Verifying your email…</p>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Email verified!</h2>
          <p className="text-sm text-slate-500">You can now sign in to your account.</p>
        </div>
        <Link
          to="/auth/login"
          className="w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold flex items-center justify-center hover:bg-[#162D4A] transition-colors"
        >
          Continue to login
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center gap-4 py-4">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
        <AlertCircle size={28} className="text-red-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Link expired</h2>
        <p className="text-sm text-slate-500">{errorMsg}</p>
      </div>
      <Link
        to="/auth/login"
        className="w-full h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors"
      >
        Back to login
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center px-4">
      <div className="w-full max-w-[440px] bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-slate-200/60 p-7 sm:p-8">
        {token ? (
          <TokenVerifier token={token} />
        ) : email ? (
          <>
            <VerifyEmailPanel email={email} />
            <p className="text-center text-xs text-slate-400 mt-6">
              Already verified?{" "}
              <Link to="/auth/" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <AlertCircle size={28} className="text-slate-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Nothing to verify</h2>
              <p className="text-sm text-slate-500">This page needs a verification link or an email address.</p>
            </div>
            <Link
              to="/auth"
              className="w-full h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
