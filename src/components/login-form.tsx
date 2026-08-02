import { Link, redirect, useActionData, useLoaderData, useNavigate, useNavigation, Form, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router"
import customFetch from "@/utils/customFetch"
import { isAxiosError } from "axios"
import useError from "@/utils/useError"
import { useState } from "react"
import type { User } from "@/utils/types"
import { useGoogleLogin } from "@react-oauth/google"
import { motion, AnimatePresence } from "framer-motion"
import {
  Eye, EyeOff, ArrowRight, Loader2, AlertCircle,
  Briefcase, Clock, Zap, TrendingUp,
} from "lucide-react"

// ── react-router action/loader (unchanged logic from your old form) ───────────
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const data = Object.fromEntries(formData)

  const url = new URL(request.url)
  const from = url.searchParams.get("from")

  try {
    const response = await customFetch.post<{ user: User }>("/auth/login", data)
    const currentUser = response.data?.user
    const role = currentUser?.role

    if (from) {
      const fromUrl = new URL(from)
      const pathname = fromUrl.pathname

      if (role === "worker" && pathname.startsWith("/worker")) {
        return redirect(pathname + fromUrl.search)
      }
      if ((role === "admin" || role === "manager") && !pathname.startsWith("/worker")) {
        return redirect(pathname + fromUrl.search)
      }
    }
    return redirect(role === "worker" ? "/worker" : "/")
  } catch (err) {
    if (isAxiosError(err)) {
      return err.response?.data?.msg ?? err.response?.data ?? null
    }
    return err instanceof Error ? err.message : "Something went wrong"
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const params = Object.fromEntries([...new URL(request.url).searchParams.entries()])
  return params?.message || null
}

// ── Google icon ───────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

// ── Left brand panel (unchanged) ───────────────────────────────────────────────
function BrandPanel() {
  const features = [
    { icon: Briefcase, text: "Create and assign jobs in seconds" },
    { icon: Clock, text: "Real-time clock-in tracking with GPS" },
    { icon: TrendingUp, text: "Automated payroll and timesheets" },
  ]
  const stats = [
    { label: "Active Workers", value: "24", delta: "+3 today" },
    { label: "Jobs This Week", value: "87", delta: "↑ 12%" },
    { label: "Hours Logged", value: "640h", delta: "on track" },
  ]
  const bars = [48, 72, 60, 88, 76, 52, 80]

  return (
    <div className="relative h-full flex flex-col p-10 overflow-hidden w-full bg-[#0B1628]">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)", backgroundSize: "24px 24px" }}
      />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl" />

      <div className="relative flex flex-col h-full w-full ">
        <div className="flex items-center gap-2.5 mb-auto">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            work<span className="text-blue-400">.wrk</span>
          </span>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">
            Your workforce,<br />managed smarter.
          </h2>
          <p className="text-sm text-white/50 leading-relaxed max-w-xs">
            Replace paper timesheets and WhatsApp chaos with one elegant platform your whole team will actually use.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {features.map(f => (
            <div key={f.text} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <f.icon size={13} className="text-blue-400" />
              </div>
              <p className="text-sm text-white/65">{f.text}</p>
            </div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white/[0.06] border border-white/[0.1] rounded-2xl p-4 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-white/60">Today's Overview</p>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />Live
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {stats.map(s => (
              <div key={s.label} className="bg-white/[0.06] rounded-xl p-2.5 text-center">
                <p className="text-base font-bold text-white">{s.value}</p>
                <p className="text-[9px] text-white/40 mt-0.5">{s.label}</p>
                <p className="text-[9px] text-emerald-400 font-semibold">{s.delta}</p>
              </div>
            ))}
          </div>

          <div className="flex items-end gap-1.5 h-10">
            {bars.map((h, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.5 + i * 0.07, duration: 0.4, ease: "easeOut" }}
                style={{ originY: 1, height: `${h}%` }}
                className={`flex-1 rounded-sm ${i === 4 ? "bg-blue-400" : "bg-white/15"}`}
              />
            ))}
          </div>
          <p className="text-[9px] text-white/30 mt-2">Hours by day — this week</p>
        </motion.div>

        <div className="mt-5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">S</div>
          <div>
            <p className="text-xs text-white/50 italic leading-relaxed">"Replaced 3 tools and saved us 6 hours of admin every week."</p>
            <p className="text-[10px] text-white/30 mt-1 font-semibold">Sarah T. · Operations Manager</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Auth input ────────────────────────────────────────────────────────────────
function AuthInput({
  label, name, type = "text", value, onChange, placeholder, error, autoComplete,
  suffix, disabled,
}: {
  label: string; name: string; type?: string; value: string; onChange: (v: string) => void
  placeholder?: string; error?: string; autoComplete?: string
  suffix?: React.ReactNode; disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`w-full h-11 px-3.5 ${suffix ? "pr-11" : "pr-3.5"} rounded-xl border text-sm text-slate-800 bg-white placeholder:text-slate-400 transition-all outline-none
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            disabled:opacity-60 disabled:cursor-not-allowed
            ${error ? "border-red-400 bg-red-50/30 focus:ring-red-400/20 focus:border-red-400" : "border-slate-200 hover:border-slate-300"}`}
        />
        {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18 }}
            className="text-xs text-red-500 flex items-center gap-1"
          >
            <AlertCircle size={11} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Login Page ───────────────────────────────────────────────────────────
export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [googleErr, setGoogleErr] = useState("")

  const navigation = useNavigation()
  const loading = navigation.state === "loading" || navigation.state === "submitting"
  const navigate = useNavigate()

  const actionError = useActionData() as string | null
  const loaderMessage = useLoaderData() as string | null
  const errorMsg = useError([actionError, loaderMessage, googleErr])

  const login = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async codeResponse => {
      try {
        await customFetch.post("/auth/login/google", { code: codeResponse.code })
        navigate("/")
      } catch (err) {
        if (isAxiosError(err)) {
          setGoogleErr(err.response?.data?.msg || err.response?.data || "Something went wrong, try again")
          setTimeout(() => setGoogleErr(""), 5000)
        }
      }
    },
    onError: () => {
      setGoogleErr("Google login failed")
      setTimeout(() => setGoogleErr(""), 5000)
    },
  })

  const validate = () => {
    const errs: { email?: string; password?: string } = {}
    if (!email) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address"
    if (!password) errs.password = "Password is required"
    else if (password.length < 6) errs.password = "Password must be at least 6 characters"
    return errs
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const errs = validate()
    if (Object.keys(errs).length) {
      e.preventDefault()
      setFieldErrors(errs)
    } else {
      setFieldErrors({})
    }
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%]">
        <BrandPanel />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[400px]"
        >
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-slate-900 font-semibold text-lg tracking-tight">
              work<span className="text-blue-500">.wrk</span>
            </span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">Welcome back</h1>
            <p className="text-sm text-slate-500">Sign in to your account to continue</p>
          </div>

          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.22 }}
                className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
              >
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <Form method="post" onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
            <AuthInput
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={v => { setEmail(v); setFieldErrors(e => ({ ...e, email: undefined })) }}
              placeholder="you@company.com"
              error={fieldErrors.email}
              autoComplete="email"
              disabled={loading}
            />
            <AuthInput
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={v => { setPassword(v); setFieldErrors(e => ({ ...e, password: undefined })) }}
              placeholder="••••••••"
              error={fieldErrors.password}
              autoComplete="current-password"
              disabled={loading}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded accent-blue-600" />
                <span className="text-xs text-slate-500">Remember me</span>
              </label>
              <button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                Forgot password?
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 hover:bg-[#162D4A] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={15} />
                </>
              )}
            </motion.button>
          </Form>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            onClick={() => login()}
            className="w-full h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 flex items-center justify-center gap-2.5 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-60 mb-6"
          >
            <GoogleIcon />
            Continue with Google
          </motion.button>

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/auth/signup" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}