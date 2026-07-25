import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react'

// ── Badge ──────────────────────────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary'

const badgeStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger: 'bg-red-50 text-red-600 border border-red-200',
  info: 'bg-blue-50 text-blue-700 border border-blue-200',
  neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
  primary: 'bg-[#1E3A5F]/10 text-[#1E3A5F] border border-[#1E3A5F]/20',
}

export function Badge({ variant = 'neutral', children, dot }: { variant?: BadgeVariant; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[variant]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variant === 'success' ? 'bg-emerald-500' : variant === 'warning' ? 'bg-amber-500' : variant === 'danger' ? 'bg-red-500' : 'bg-blue-500'}`} />}
      {children}
    </span>
  )
}

// ── Status Badge ───────────────────────────────────────────────────────────
const statusMap: Record<string, { label: string; variant: BadgeVariant; dot?: boolean }> = {
  'in-progress': { label: 'In Progress', variant: 'info', dot: true },
  'assigned': { label: 'Assigned', variant: 'primary', dot: true },
  'completed': { label: 'Completed', variant: 'success' },
  'pending': { label: 'Pending', variant: 'warning' },
  'draft': { label: 'Draft', variant: 'neutral' },
  'cancelled': { label: 'Cancelled', variant: 'danger' },
  'working': { label: 'Working', variant: 'success', dot: true },
  'available': { label: 'Available', variant: 'neutral' },
  'off': { label: 'Off Duty', variant: 'warning' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] ?? { label: status, variant: 'neutral' as BadgeVariant }
  return <Badge variant={s.variant} dot={s.dot}>{s.label}</Badge>
}

// ── Priority Badge ─────────────────────────────────────────────────────────
export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    high: { label: 'High', variant: 'danger' },
    medium: { label: 'Medium', variant: 'warning' },
    low: { label: 'Low', variant: 'neutral' },
  }
  const p = map[priority] ?? { label: priority, variant: 'neutral' as BadgeVariant }
  return <Badge variant={p.variant}>{p.label}</Badge>
}

// ── Avatar ─────────────────────────────────────────────────────────────────
const avatarColors = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

export function Avatar({ initials, size = 'md', index = 0 }: { initials: string; size?: 'sm' | 'md' | 'lg' | 'xl'; index?: number }) {
  const color = avatarColors[index % avatarColors.length]
  const sz = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base', xl: 'w-14 h-14 text-lg' }[size]
  return (
    <div className={`${sz} ${color} rounded-full flex items-center justify-center font-semibold shrink-0 select-none`}>
      {initials}
    </div>
  )
}

// ── Button ─────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  loading?: boolean
}

const btnBase = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'
const btnVariants: Record<ButtonVariant, string> = {
  primary: 'bg-[#1E3A5F] text-white hover:bg-[#162D4A] active:scale-[0.98] focus-visible:ring-[#1E3A5F]',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.98] focus-visible:ring-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 active:scale-[0.98] focus-visible:ring-slate-400',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 active:scale-[0.98] focus-visible:ring-red-400',
  outline: 'border border-[#E2E8F0] text-slate-700 hover:bg-slate-50 active:scale-[0.98] focus-visible:ring-slate-400',
}
const btnSizes: Record<string, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
}

export function Button({ variant = 'primary', size = 'md', children, loading, className = '', ...props }: ButtonProps) {
  return (
    <button className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
}

// ── Input ──────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          className={`w-full h-9 ${icon ? 'pl-9' : 'pl-3'} pr-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all ${error ? 'border-red-400 focus:ring-red-200' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Select ─────────────────────────────────────────────────────────────────
export function Select({ label, options, value, onChange, className = '' }: { label?: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all appearance-none cursor-pointer ${className}`}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ── Textarea ───────────────────────────────────────────────────────────────
export function Textarea({ label, placeholder, value, onChange, rows = 3 }: { label?: string; placeholder?: string; value?: string; onChange?: (v: string) => void; rows?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all resize-none"
      />
    </div>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-xl ${onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, trend, trendUp }: { label: string; value: string | number; sub?: string; icon?: ReactNode; trend?: string; trendUp?: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-2 mt-1.5">
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
          {trend && (
            <span className={`text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>
      )}
    </Card>
  )
}

// ── Section Header ─────────────────────────────────────────────────────────
export function SectionHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">{icon}</div>
      <p className="text-sm font-medium text-slate-700 mb-1">{title}</p>
      {description && <p className="text-xs text-slate-400 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────
export function Toast({ message, type = 'success' }: { message: string; type?: 'success' | 'error' | 'info' }) {
  const styles = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-[#1E3A5F]',
  }
  return (
    <div className={`fixed bottom-6 right-6 ${styles[type]} text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg animate-fade-in z-50`}>
      {message}
    </div>
  )
}

// ── Divider ────────────────────────────────────────────────────────────────
export function Divider({ className = '' }: { className?: string }) {
  return <hr className={`border-0 border-t border-[#E2E8F0] ${className}`} />
}

// ── Tab Bar ────────────────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string; count?: number }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-[#E2E8F0]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${active === tab.id ? 'border-[#1E3A5F] text-[#1E3A5F]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${active === tab.id ? 'bg-[#1E3A5F]/10 text-[#1E3A5F]' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}
