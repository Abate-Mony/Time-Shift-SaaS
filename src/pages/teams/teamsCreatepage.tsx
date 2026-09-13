import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Briefcase, ChevronLeft, Mail, Shield, ShieldCheck, UserPlus } from 'lucide-react'
import customFetch from '@/utils/customFetch'
import { queryClient } from '@/lib/queryClient'
import { PlanLockBadge } from '@/components/billing/PlanLockBadge'
import { useCompanyPlan } from '@/hooks/useCompanyPlan'
import type { iUser } from '@/layouts/dashboardlayout'
import { isAdminRole } from '@/utils/roles'
import { invitationsQuery, teamQuery, type InvitationListItem, type TeamRole } from '../TeamPage'

// Same two queries the Team list page's own loader ensures — pre-fetched
// here too so this page doesn't flash an empty duplicate-check/worker-count
// state when reached directly rather than via a click from /team.
export const loader = (queryClient: QueryClient) => async () => {
  await Promise.all([
    queryClient.ensureQueryData(teamQuery()),
    queryClient.ensureQueryData(invitationsQuery()),
  ])
  return null
}

// ─── Types ────────────────────────────────────────────────────────────────────

type InviteFormError = Partial<Record<'email', string>>
type ApiState = 'idle' | 'submitting' | 'duplicate'

interface InviteForm {
  email: string
  role: TeamRole
  fullname: string
  phone: string
  payRate: string
  employeeId: string
}

// ─── Role card ────────────────────────────────────────────────────────────────

// "owner" is deliberately excluded — it's never an invitable role (the
// company founder only), so this invite form never needs to render a card
// for it.
type InvitableRole = Exclude<TeamRole, 'owner'>

function RoleCard({
  role,
  selected,
  onSelect,
  disabled,
  lockedLabel,
}: {
  role: InvitableRole
  selected: boolean
  onSelect: () => void
  disabled?: boolean
  lockedLabel?: string
}) {
  const roleConfig = {
    worker: {
      label: 'Worker',
      icon: Briefcase,
      description: 'Can view assigned jobs, accept shifts, clock in/out and access timesheets.',
    },
    manager: {
      label: 'Manager',
      icon: ShieldCheck,
      description: 'Can manage jobs, workers and operational activity based on permissions.',
    },
    admin: {
      label: 'Admin',
      icon: Shield,
      description: 'Can manage workers, managers, jobs and company settings with administrative access.',
    },
  } satisfies Record<InvitableRole, { label: string; icon: React.ElementType; description: string }>

  const config = roleConfig[role]
  const Icon = config.icon

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      title={disabled ? 'Upgrade your plan to add more workers' : undefined}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${disabled
        ? 'border-border bg-muted opacity-60 cursor-not-allowed'
        : selected
          ? 'border-[var(--primary)] bg-[var(--primary)]/[0.03]'
          : 'border-border hover:border-slate-300 bg-card'
        }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${selected && !disabled ? 'border-[var(--primary)]' : 'border-slate-300'
            }`}
        >
          {selected && !disabled && <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />}
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <Icon size={13} className={selected && !disabled ? 'text-[var(--primary)]' : 'text-muted-foreground'} />
            <span className={`text-sm font-bold ${selected && !disabled ? 'text-[var(--primary)]' : 'text-foreground'}`}>
              {config.label}
            </span>
            {disabled && lockedLabel && <PlanLockBadge label={lockedLabel} />}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{config.description}</p>
        </div>
      </div>
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function TeamsCreatepage() {
  const navigate = useNavigate()
  const { user } = useOutletContext<{ user: iUser }>()
  // Mirrors the backend's assertCanAssignRole: a manager can only invite
  // workers, so Manager/Admin are shown but locked rather than picked and
  // rejected only after a round trip to the server. Owners get the same
  // access as admins here (isAdminRole), same as everywhere else.
  const isAdmin = isAdminRole(user?.role)

  // Same two queries the Team list page already loads — reused here (React
  // Query dedupes by key) rather than re-fetched from scratch, so this page
  // works whether it's opened via the list's own cache or a direct link.
  const { users } = useQuery(teamQuery()).data ?? { users: [] }
  const { invitations } = useQuery(invitationsQuery()).data ?? { invitations: [] }
  const existingEmails = [...users.map(u => u.email), ...invitations.map((i: InvitationListItem) => i.email)]
  const workerCount = users.filter(u => u.role === 'worker' && u.isActive).length

  const { maxWorkers } = useCompanyPlan()
  const atWorkerCap = maxWorkers != null && maxWorkers !== -1 && workerCount >= maxWorkers

  const [form, setForm] = useState<InviteForm>({
    // Default straight to Manager when the worker slot is muted — no point
    // opening on a role the admin can't actually pick. A manager stays on
    // Worker regardless (it's the only role they're allowed to assign).
    email: '', role: atWorkerCap && isAdmin ? 'manager' : 'worker', fullname: '', phone: '', payRate: '', employeeId: '',
  })
  const [errors, setErrors] = useState<InviteFormError>({})
  const [apiState, setApiState] = useState<ApiState>('idle')
  const [duplicateMessage, setDuplicateMessage] = useState('')
  const [permissionError, setPermissionError] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => { emailRef.current?.focus() }, [])

  const validate = () => {
    const errs: InviteFormError = {}
    const email = form.email.trim().toLowerCase()
    if (!email) errs.email = 'Enter an email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    const email = form.email.trim().toLowerCase()

    // Fast client-side pre-check for UX — the backend re-checks
    // authoritatively regardless (someone else could invite the same
    // email between this render and the submit).
    if (existingEmails.includes(email)) {
      setDuplicateMessage(`An invitation or account already exists for ${email}.`)
      setApiState('duplicate')
      return
    }

    setPermissionError('')
    setApiState('submitting')
    try {
      const payRate = form.payRate.trim() ? Number(form.payRate) : undefined
      const { data } = await customFetch.post<{ invitation: InvitationListItem }>('/invitations', {
        email,
        role: form.role,
        fullname: form.fullname.trim() || undefined,
        phone: form.phone.trim() || undefined,
        employeeId: form.employeeId.trim() || undefined,
        payRate,
      })
      toast.success(`Invitation sent to ${data.invitation.email}`)
      await queryClient.invalidateQueries({ queryKey: ['invitations'] })
      navigate('/team')
    } catch (err: any) {
      const code: string | undefined = err.response?.data?.code
      const message: string | undefined = err.response?.data?.msg

      if (code === 'ALREADY_MEMBER' || code === 'INVITATION_PENDING') {
        setDuplicateMessage(message ?? 'This email already has a pending invitation or account.')
        setApiState('duplicate')
      } else if (code === 'INSUFFICIENT_PERMISSION') {
        setPermissionError(message ?? 'Only admins can invite managers or other admins.')
        setApiState('idle')
      } else {
        toast.error(message ?? 'Failed to send the invitation, try again.')
        setApiState('idle')
      }
    }
  }

  const ifl = (err?: string) =>
    `w-full h-10 px-3.5 border rounded-xl text-sm text-foreground bg-card placeholder:text-muted-foreground
     focus:outline-none focus:ring-2 transition-all ${err ? 'border-red-400 focus:ring-red-100 focus:border-red-400' : 'border-border focus:ring-[var(--primary)]/15 focus:border-[var(--primary)]/40'
    }`

  // Duplicate state — replaces the form rather than layering a modal on top.
  if (apiState === 'duplicate') {
    return (
      <div className="px-2 pt-2.5 lg:p-6 max-w-2xl mx-auto animate-fade-in">
        <div className="bg-card rounded-2xl border border-[var(--border)] p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-4 mx-auto">
            <Mail size={18} className="text-amber-500" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">Can't send this invitation</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{duplicateMessage}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-6">
            If an invitation is already pending, use "Resend invitation" from their row in the team list instead.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/team')} className="h-9 px-4 text-sm font-semibold text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors">
              Back to Team
            </button>
            <button
              onClick={() => setApiState('idle')}
              className="h-9 px-4 text-sm font-semibold text-white bg-[var(--primary)] rounded-xl hover:bg-primary/90 transition-colors"
            >
              Edit details
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-2 pt-2.5 lg:p-6 max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => navigate('/team')} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Invite team member</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {"Send an invitation to join your company. They'll create their own password when they accept."}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Email + role */}
        <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Work email <span className="text-red-400">*</span></label>
            <input
              ref={emailRef}
              type="email"
              className={ifl(errors.email)}
              placeholder="john@example.com"
              value={form.email}
              onChange={e => { setForm(f => ({ ...f, email: e.target.value })); if (errors.email) setErrors(er => ({ ...er, email: undefined })) }}
            />
            {errors.email
              ? <p className="text-xs text-red-500">{errors.email}</p>
              : <p className="text-xs text-muted-foreground">{"We'll send the invitation to this address."}</p>
            }
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">Role <span className="text-red-400">*</span></label>
            <div className="flex flex-col gap-2">
              <RoleCard
                role="worker"
                selected={form.role === 'worker'}
                onSelect={() => { setForm(f => ({ ...f, role: 'worker' })); setPermissionError('') }}
                disabled={atWorkerCap}
                lockedLabel={atWorkerCap ? `Worker limit reached (${workerCount}/${maxWorkers})` : undefined}
              />
              <RoleCard
                role="manager"
                selected={form.role === 'manager'}
                onSelect={() => { setForm(f => ({ ...f, role: 'manager' })); setPermissionError('') }}
                disabled={!isAdmin}
                lockedLabel={!isAdmin ? 'Admins only' : undefined}
              />
              <RoleCard
                role="admin"
                selected={form.role === 'admin'}
                onSelect={() => { setForm(f => ({ ...f, role: 'admin' })); setPermissionError('') }}
                disabled={!isAdmin}
                lockedLabel={!isAdmin ? 'Admins only' : undefined}
              />
            </div>
            {permissionError && <p className="text-xs text-red-500">{permissionError}</p>}
          </div>
        </div>

        {/* Additional details */}
        <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex flex-col gap-5">
          <h2 className="text-sm font-semibold text-foreground">Additional details</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Full name <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input className={ifl()} placeholder="John Smith" value={form.fullname} onChange={e => setForm(f => ({ ...f, fullname: e.target.value }))} />
              <p className="text-xs text-muted-foreground">The team member can complete this later.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Phone <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input type="tel" className={ifl()} placeholder="+44 7700 900000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          {form.role === 'worker' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground">Default pay rate <span className="text-muted-foreground font-normal">(optional)</span></label>
              <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[var(--primary)]/15 focus-within:border-[var(--primary)]/40 transition-all max-w-xs">
                <span className="px-3 bg-muted border-r border-border text-sm text-muted-foreground h-10 flex items-center">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="flex-1 h-10 px-3 text-sm text-foreground bg-card outline-none min-w-0"
                  placeholder="13.50"
                  value={form.payRate}
                  onChange={e => setForm(f => ({ ...f, payRate: e.target.value }))}
                />
                <span className="px-3 bg-muted border-l border-border text-sm text-muted-foreground h-10 flex items-center">/ hour</span>
              </div>
              <p className="text-xs text-muted-foreground">This can be changed later and individual jobs may override it.</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5 max-w-xs">
            <label className="text-sm font-semibold text-foreground">Employee ID <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input className={ifl()} placeholder="CLN-104" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end pb-6">
          <button onClick={() => navigate('/team')} className="h-9 px-4 text-sm font-semibold text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={apiState === 'submitting'}
            className="h-9 px-5 text-sm font-bold text-white bg-[var(--primary)] rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {apiState === 'submitting'
              ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending invitation…</>
              : <><UserPlus size={14} /> Send invitation</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default TeamsCreatepage
