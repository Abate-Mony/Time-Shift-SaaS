import { useGoogleLogin } from "@react-oauth/google"
import {
  Link, redirect, useActionData, useLoaderData, useNavigate, useNavigation,
  useSubmit, type ActionFunctionArgs, type LoaderFunctionArgs,
} from "react-router"
import customFetch from "@/utils/customFetch"
import { isAxiosError } from "axios"
import useError from "@/utils/useError"
import type { User as iUser } from "@/utils/types"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Eye, EyeOff, ChevronLeft, Check, AlertCircle, Building2,
  User, Mail, Lock, Globe, Phone, Edit2,
  ArrowRight, Loader2, CheckCircle2, RefreshCw, ExternalLink,
} from "lucide-react"

// ── react-router action/loader (unchanged logic) ──────────────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const data = Object.fromEntries(formData)

  const url = new URL(request.url)
  const from = url.searchParams.get("from")

  try {
    const response = await customFetch.post<{ user: iUser }>("/auth/signup", data)
    const currentUser = response.data.user
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

// ── Business types ────────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  "Cleaning Company", "Security Company", "Care Agency", "Construction",
  "Hospitality", "Warehouse", "Logistics", "Healthcare", "Retail",
  "Manufacturing", "Education", "Other",
]

const COMPANY_SIZES = [
  "1–10 workers", "11–25 workers", "26–50 workers",
  "51–100 workers", "100+",
]

const COUNTRIES = [
  "United Kingdom", "United States", "Ireland", "Australia",
  "Canada", "Germany", "France", "Spain", "Other",
]

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pwd: string) {
  if (!pwd) return { score: 0, label: "", color: "" }
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  const s = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4
  return {
    score: s,
    label: ["Too short", "Weak", "Fair", "Good", "Strong"][s],
    color: ["#EF4444", "#F97316", "#F59E0B", "#10B981", "#059669"][s],
  }
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { score, label, color } = getStrength(password)
  if (!password) return null
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-1.5"
    >
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <motion.div key={i} className="h-1 flex-1 rounded-full overflow-hidden bg-slate-100">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: score >= i ? 1 : 0 }}
              style={{ originX: 0, backgroundColor: color }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full rounded-full"
            />
          </motion.div>
        ))}
      </div>
      <p className="text-xs font-semibold" style={{ color }}>{label}</p>
    </motion.div>
  )
}

// ── Form input ────────────────────────────────────────────────────────────────
function FormInput({
  label, name, type = "text", value, onChange, placeholder, error, autoComplete,
  suffix, icon, optional, hint,
}: {
  label: string; name: string; type?: string; value: string; onChange: (v: string) => void
  placeholder?: string; error?: string; autoComplete?: string
  suffix?: React.ReactNode; icon?: React.ReactNode; optional?: boolean; hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
          {icon && <span className="text-slate-400">{icon}</span>}
          {label}
        </label>
        {optional && <span className="text-[10px] text-slate-400 font-medium">Optional</span>}
      </div>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full h-11 px-3.5 rounded-xl border text-sm text-slate-800 bg-white placeholder:text-slate-400 transition-all outline-none
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            ${error ? "border-red-400 bg-red-50/30 focus:ring-red-400/20 focus:border-red-400" : "border-slate-200 hover:border-slate-300"}
            ${suffix ? "pr-11" : ""}`}
        />
        {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
      {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
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

// ── Searchable select ─────────────────────────────────────────────────────────
function SearchableSelect({
  label, name, value, onChange, options, placeholder, error, optional,
}: {
  label: string; name: string; value: string; onChange: (v: string) => void
  options: string[]; placeholder?: string; error?: string; optional?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const select = (opt: string) => { onChange(opt); setOpen(false); setQuery("") }

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
        {optional && <span className="text-[10px] text-slate-400 font-medium">Optional</span>}
      </div>
      <div className="relative">
        {/* hidden input keeps the value in the FormData collected on submit */}
        <input type="hidden" name={name} value={value} />
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`w-full h-11 px-3.5 rounded-xl border text-sm text-left flex items-center justify-between transition-all outline-none
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            ${error ? "border-red-400 bg-red-50/30" : "border-slate-200 hover:border-slate-300 bg-white"}
            ${value ? "text-slate-800" : "text-slate-400"}`}
        >
          {value || placeholder}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{ originY: 0 }}
              className="absolute top-12 left-0 right-0 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-50 overflow-hidden"
            >
              {options.length > 6 && (
                <div className="p-2 border-b border-[#F1F5F9]">
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search..."
                    autoFocus
                    className="w-full h-8 px-3 bg-slate-50 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              )}
              <div className="max-h-52 overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <p className="px-3.5 py-3 text-sm text-slate-400">No results</p>
                ) : (
                  filtered.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => select(opt)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors
                        ${value === opt ? "text-blue-700 font-semibold" : "text-slate-700"}`}
                    >
                      {opt}
                      {value === opt && <Check size={13} className="text-blue-600" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

// ── Step progress bar ─────────────────────────────────────────────────────────
function StepProgress({ current, total }: { current: number; total: number }) {
  const steps = ["Account", "Company", "Review", "Verify"]
  return (
    <div className="flex flex-col gap-3 mb-8">
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#1E3A5F] rounded-full"
          initial={false}
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <motion.div
              animate={{
                backgroundColor: i < current ? "#10B981" : i === current - 1 ? "#1E3A5F" : "#E2E8F0",
                scale: i === current - 1 ? 1.1 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="w-5 h-5 rounded-full flex items-center justify-center"
            >
              {i < current - 1 ? (
                <Check size={10} className="text-white" strokeWidth={3} />
              ) : (
                <span className="text-[9px] font-bold text-white">{i + 1}</span>
              )}
            </motion.div>
            <span className={`text-[10px] font-semibold hidden sm:block ${i === current - 1 ? "text-slate-700" : i < current - 1 ? "text-emerald-600" : "text-slate-400"}`}>
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Step slide variants ───────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 40 : -40, opacity: 0 }),
}

// ── Form data types ───────────────────────────────────────────────────────────
interface Step1Data { name: string; email: string; password: string; confirm: string }
interface Step2Data { companyName: string; businessType: string; companySize: string; website: string; phone: string; country: string }

// ── Step 1: Create Account ────────────────────────────────────────────────────
function Step1({
  data, onChange, onNext,
}: {
  data: Step1Data; onChange: (d: Partial<Step1Data>) => void; onNext: () => void
}) {
  const [errors, setErrors] = useState<Partial<Step1Data>>({})
  const [attempted, setAttempted] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const validate = () => {
    const e: Partial<Step1Data> = {}
    if (!data.name.trim()) e.name = "Full name is required"
    if (!data.email) e.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Enter a valid email"
    if (!data.password) e.password = "Password is required"
    else if (data.password.length < 8) e.password = "At least 8 characters required"
    else if (getStrength(data.password).score < 2) e.password = "Please choose a stronger password"
    if (!data.confirm) e.confirm = "Please confirm your password"
    else if (data.confirm !== data.password) e.confirm = "Passwords do not match"
    return e
  }

  const handleChange = <K extends keyof Step1Data>(key: K, val: string) => {
    onChange({ [key]: val } as Partial<Step1Data>)
    if (attempted) setErrors(v => ({ ...v, [key]: undefined }))
  }

  const handleNext = () => {
    setAttempted(true)
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onNext()
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Create your account</h2>
        <p className="text-sm text-slate-500">Start your free trial. No credit card required.</p>
      </div>

      <FormInput
        label="Full Name" name="name" value={data.name} onChange={v => handleChange("name", v)}
        placeholder="James Mitchell" icon={<User size={13} />}
        error={errors.name} autoComplete="name"
      />
      <FormInput
        label="Email" name="email" type="email" value={data.email} onChange={v => handleChange("email", v)}
        placeholder="you@company.com" icon={<Mail size={13} />}
        error={errors.email} autoComplete="email"
      />
      <div className="flex flex-col gap-1.5">
        <FormInput
          label="Password" name="password" type={showPwd ? "text" : "password"}
          value={data.password} onChange={v => handleChange("password", v)}
          placeholder="Min. 8 characters" icon={<Lock size={13} />}
          error={errors.password} autoComplete="new-password"
          suffix={
            <button type="button" onClick={() => setShowPwd(s => !s)} className="text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />
        <AnimatePresence>
          {data.password && <PasswordStrengthBar password={data.password} />}
        </AnimatePresence>
      </div>
      <FormInput
        label="Confirm Password" name="confirmPassword" type={showConfirm ? "text" : "password"}
        value={data.confirm} onChange={v => handleChange("confirm", v)}
        placeholder="Repeat your password" icon={<Lock size={13} />}
        error={errors.confirm} autoComplete="new-password"
        suffix={
          <button type="button" onClick={() => setShowConfirm(s => !s)} className="text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }
      />

      <ContinueButton onClick={handleNext} label="Continue" />
    </div>
  )
}

// ── Step 2: Company Info ──────────────────────────────────────────────────────
function Step2({
  data, onChange, onNext,
}: {
  data: Step2Data; onChange: (d: Partial<Step2Data>) => void; onNext: () => void
}) {
  const [errors, setErrors] = useState<Partial<Step2Data>>({})
  const [attempted, setAttempted] = useState(false)

  const validate = () => {
    const e: Partial<Step2Data> = {}
    if (!data.companyName.trim()) e.companyName = "Company name is required"
    if (!data.businessType) e.businessType = "Please select a business type"
    if (!data.companySize) e.companySize = "Please select your company size"
    return e
  }

  const handleChange = <K extends keyof Step2Data>(key: K, val: string) => {
    onChange({ [key]: val } as Partial<Step2Data>)
    if (attempted) setErrors(v => ({ ...v, [key]: undefined }))
  }

  const handleNext = () => {
    setAttempted(true)
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onNext()
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Company information</h2>
        <p className="text-sm text-slate-500">Tell us about the business you're managing.</p>
      </div>

      <FormInput
        label="Company Name" name="companyName" value={data.companyName} onChange={v => handleChange("companyName", v)}
        placeholder="SecureGuard Ltd" icon={<Building2 size={13} />}
        error={errors.companyName}
      />

      <SearchableSelect
        label="Business Type" name="businessType" value={data.businessType}
        onChange={v => handleChange("businessType", v)}
        options={BUSINESS_TYPES} placeholder="Select your industry..."
        error={errors.businessType}
      />

      <SearchableSelect
        label="Company Size" name="companySize" value={data.companySize}
        onChange={v => handleChange("companySize", v)}
        options={COMPANY_SIZES} placeholder="How many workers?"
        error={errors.companySize}
      />

      <div className="border-t border-[#F1F5F9] pt-4 flex flex-col gap-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optional details</p>

        <FormInput
          label="Company Website" name="website" value={data.website} onChange={v => handleChange("website", v)}
          placeholder="https://company.com" icon={<Globe size={13} />} optional
        />
        <FormInput
          label="Phone Number" name="phone" type="tel" value={data.phone} onChange={v => handleChange("phone", v)}
          placeholder="+44 7700 900000" icon={<Phone size={13} />} optional
        />
        <SearchableSelect
          label="Country" name="country" value={data.country}
          onChange={v => handleChange("country", v)}
          options={COUNTRIES} placeholder="Select country..."
          optional
        />
      </div>

      <ContinueButton onClick={handleNext} label="Continue" />
    </div>
  )
}

// ── Step 3: Review ────────────────────────────────────────────────────────────
function Step3({
  step1, step2, onEdit, onNext, loading,
}: {
  step1: Step1Data; step2: Step2Data; onEdit: (step: 1 | 2) => void; onNext: () => void; loading: boolean
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Review your details</h2>
        <p className="text-sm text-slate-500">Make sure everything looks right before creating your account.</p>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9] bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <User size={13} className="text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-slate-800">Personal Information</p>
          </div>
          <button onClick={() => onEdit(1)} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            <Edit2 size={11} /> Edit
          </button>
        </div>
        <div className="divide-y divide-[#F8FAFC]">
          {[
            { label: "Full Name", value: step1.name },
            { label: "Email", value: step1.email },
            { label: "Password", value: "••••••••" },
          ].map(row => (
            <div key={row.label} className="flex items-center px-5 py-3">
              <p className="text-xs text-slate-400 w-28 font-medium">{row.label}</p>
              <p className="text-sm text-slate-800 font-medium">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9] bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <Building2 size={13} className="text-violet-600" />
            </div>
            <p className="text-sm font-semibold text-slate-800">Company Information</p>
          </div>
          <button onClick={() => onEdit(2)} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            <Edit2 size={11} /> Edit
          </button>
        </div>
        <div className="divide-y divide-[#F8FAFC]">
          {[
            { label: "Company", value: step2.companyName },
            { label: "Business Type", value: step2.businessType },
            { label: "Size", value: step2.companySize },
            step2.website ? { label: "Website", value: step2.website } : null,
            step2.phone ? { label: "Phone", value: step2.phone } : null,
            step2.country ? { label: "Country", value: step2.country } : null,
          ].filter(Boolean).map(row => (
            <div key={row!.label} className="flex items-center px-5 py-3">
              <p className="text-xs text-slate-400 w-28 font-medium">{row!.label}</p>
              <p className="text-sm text-slate-800 font-medium">{row!.value}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center leading-relaxed px-4">
        By creating an account you agree to our{" "}
        <button className="text-blue-600 font-semibold hover:underline">Terms of Service</button>{" "}
        and{" "}
        <button className="text-blue-600 font-semibold hover:underline">Privacy Policy</button>.
      </p>

      <motion.button
        onClick={onNext}
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
        className="w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 hover:bg-[#162D4A] transition-colors disabled:opacity-70"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" />Creating account…</>
        ) : (
          <><CheckCircle2 size={15} />Create Account</>
        )}
      </motion.button>
    </div>
  )
}

// ── Step 4: Email verification ────────────────────────────────────────────────
function Step4({ email, onDone }: { email: string; onDone: () => void }) {
  const [countdown, setCountdown] = useState(45)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleResend = () => {
    setResent(true)
    setCountdown(45)
    setTimeout(() => setResent(false), 2000)
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
        <h2 className="text-xl font-bold text-slate-900 mb-2">Check your inbox!</h2>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
          Your account has been created successfully. We sent a verification link to:
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2.5">
          <Mail size={14} className="text-slate-500" />
          <p className="text-sm font-semibold text-slate-800">{email}</p>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3 mt-2">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDone}
          className="w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 hover:bg-[#162D4A] transition-colors"
        >
          <ExternalLink size={15} />
          Open Email App
        </motion.button>

        <button
          onClick={handleResend}
          disabled={countdown > 0 || resent}
          className={`w-full h-11 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all
            ${countdown > 0 || resent ? "border-slate-200 text-slate-400 cursor-not-allowed" : "border-[#E2E8F0] text-slate-700 hover:bg-slate-50"}`}
        >
          {resent ? (
            <><Check size={14} className="text-emerald-500" />Email sent!</>
          ) : countdown > 0 ? (
            <><RefreshCw size={14} />Resend in {countdown}s</>
          ) : (
            <><RefreshCw size={14} />Resend Verification Email</>
          )}
        </button>
      </div>

      <div className="text-center">
        <button
          onClick={onDone}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium"
        >
          Continue to dashboard →
        </button>
      </div>
    </div>
  )
}

// ── Continue button ───────────────────────────────────────────────────────────
function ContinueButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 hover:bg-[#162D4A] transition-colors mt-1"
    >
      {label} <ArrowRight size={15} />
    </motion.button>
  )
}

// ── Main Signup Page ──────────────────────────────────────────────────────────
export function SignUpForm() {
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1) // 1 = forward, -1 = back

  const [step1, setStep1] = useState<Step1Data>({ name: "", email: "", password: "", confirm: "" })
  const [step2, setStep2] = useState<Step2Data>({ companyName: "", businessType: "", companySize: "", website: "", phone: "", country: "" })

  const navigate = useNavigate()
  const navigation = useNavigation()
  const submitting = navigation.state === "submitting" || navigation.state === "loading"

  const submit = useSubmit()
  const actionError = useActionData() as string | null
  const loaderMessage = useLoaderData() as string | null
  const [googleErr, setGoogleErr] = useState("")
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
      setGoogleErr("Google sign-up failed")
      setTimeout(() => setGoogleErr(""), 5000)
    },
  })

  const goTo = useCallback((n: number) => {
    setDir(n > step ? 1 : -1)
    setStep(n)
  }, [step])

  const handleNext = useCallback(() => {
    if (step < 3) {
      goTo(step + 1)
      return
    }

    // Final step: build the real payload and hand it off to the `action`
    const formData = new FormData()
    formData.set("name", step1.name)
    formData.set("email", step1.email)
    formData.set("password", step1.password)
    formData.set("confirmPassword", step1.confirm)
    formData.set("companyName", step2.companyName)
    formData.set("businessType", step2.businessType)
    formData.set("companySize", step2.companySize)
    if (step2.website) formData.set("website", step2.website)
    if (step2.phone) formData.set("phone", step2.phone)
    if (step2.country) formData.set("country", step2.country)

    submit(formData, { method: "post" })
  }, [step, step1, step2, goTo, submit])

  // Once the action succeeds it redirects server-side; if it returns an error
  // string instead, actionError above will surface it via <AnimateError />.
  // On success (no error, no longer submitting, and we were on step 3) show verification step.
  useEffect(() => {
    if (step === 3 && !submitting && navigation.state === "idle" && !actionError && navigation.formData) {
      goTo(4)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting, navigation.state])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-start justify-center pt-6 pb-12 px-4">
      <div className="w-full max-w-[560px]">

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={step === 1 ? () => navigate("/auth/login") : () => goTo(step - 1)}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            {step === 1 ? "Back to login" : "Back"}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            <span className="text-slate-900 font-semibold tracking-tight">
              work<span className="text-blue-500">.wrk</span>
            </span>
          </div>

          <div className="w-20 text-right">
            <p className="text-xs text-slate-400 font-medium">Step {Math.min(step, 4)} of 4</p>
          </div>
        </div>

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

        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-slate-200/60 overflow-hidden">
          <div className="p-7 sm:p-8">
            {step < 4 && <StepProgress current={step} total={4} />}

            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {step === 1 && (
                  <Step1
                    data={step1}
                    onChange={d => setStep1(s => ({ ...s, ...d }))}
                    onNext={handleNext}
                  />
                )}
                {step === 2 && (
                  <Step2
                    data={step2}
                    onChange={d => setStep2(s => ({ ...s, ...d }))}
                    onNext={handleNext}
                  />
                )}
                {step === 3 && (
                  <Step3
                    step1={step1}
                    step2={step2}
                    onEdit={n => goTo(n)}
                    onNext={handleNext}
                    loading={submitting}
                  />
                )}
                {step === 4 && (
                  <Step4 email={step1.email || "you@company.com"} onDone={() => navigate("/")} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}