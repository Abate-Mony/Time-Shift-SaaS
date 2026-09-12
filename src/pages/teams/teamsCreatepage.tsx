import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Briefcase, ChevronLeft, Mail, Shield, ShieldCheck, UserPlus } from 'lucide-react'
import customFetch from '@/utils/customFetch'
import { queryClient } from '@/lib/queryClient'
import { PlanLockBadge } from '@/components/billing/PlanLockBadge'
import { useCompanyPlan } from '@/hooks/useCompanyPlan'
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

function RoleCard({
  role,
  selected,
  onSelect,
  disabled,
  lockedLabel,
}: {
  role: TeamRole
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
  } satisfies Record<TeamRole, { label: string; icon: React.ElementType; description: string }>

  const config = roleConfig[role]
  const Icon = config.icon

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      title={disabled ? 'Upgrade your plan to add more workers' : undefined}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${disabled
        ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
        : selected
          ? 'border-[#1E3A5F] bg-[#1E3A5F]/[0.03]'
          : 'border-slate-200 hover:border-slate-300 bg-white'
        }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${selected && !disabled ? 'border-[#1E3A5F]' : 'border-slate-300'
            }`}
        >
          {selected && !disabled && <div className="w-2 h-2 rounded-full bg-[#1E3A5F]" />}
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <Icon size={13} className={selected && !disabled ? 'text-[#1E3A5F]' : 'text-slate-400'} />
            <span className={`text-sm font-bold ${selected && !disabled ? 'text-[#1E3A5F]' : 'text-slate-700'}`}>
              {config.label}
            </span>
            {disabled && lockedLabel && <PlanLockBadge label={lockedLabel} />}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{config.description}</p>
        </div>
      </div>
    </button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function TeamsCreatepage() {
  const navigate = useNavigate()

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
    // opening on a role the admin can't actually pick.
    email: '', role: atWorkerCap ? 'manager' : 'worker', fullname: '', phone: '', payRate: '', employeeId: '',
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
        setPermissionError(message ?? 'Only admins can invite managers.')
        setApiState('idle')
      } else {
        toast.error(message ?? 'Failed to send the invitation, try again.')
        setApiState('idle')
      }
    }
  }

  const ifl = (err?: string) =>
    `w-full h-10 px-3.5 border rounded-xl text-sm text-slate-800 bg-white placeholder:text-slate-400
     focus:outline-none focus:ring-2 transition-all ${err ? 'border-red-400 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40'
    }`

  // Duplicate state — replaces the form rather than layering a modal on top.
  if (apiState === 'duplicate') {
    return (
      <div className="px-2 pt-2.5 lg:p-6 max-w-2xl mx-auto animate-fade-in">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-4 mx-auto">
            <Mail size={18} className="text-amber-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Can't send this invitation</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">{duplicateMessage}</p>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            If an invitation is already pending, use "Resend invitation" from their row in the team list instead.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/team')} className="h-9 px-4 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Back to Team
            </button>
            <button
              onClick={() => setApiState('idle')}
              className="h-9 px-4 text-sm font-semibold text-white bg-[#1E3A5F] rounded-xl hover:bg-[#162D4A] transition-colors"
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
        <button onClick={() => navigate('/team')} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Invite team member</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {"Send an invitation to join your company. They'll create their own password when they accept."}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Email + role */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Work email <span className="text-red-400">*</span></label>
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
              : <p className="text-xs text-slate-400">{"We'll send the invitation to this address."}</p>
            }
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Role <span className="text-red-400">*</span></label>
            <div className="flex flex-col gap-2">
              <RoleCard
                role="worker"
                selected={form.role === 'worker'}
                onSelect={() => { setForm(f => ({ ...f, role: 'worker' })); setPermissionError('') }}
                disabled={atWorkerCap}
                lockedLabel={atWorkerCap ? `Worker limit reached (${workerCount}/${maxWorkers})` : undefined}
              />
              <RoleCard role="manager" selected={form.role === 'manager'} onSelect={() => setForm(f => ({ ...f, role: 'manager' }))} />
              <RoleCard
                role="admin"
                selected={form.role === 'admin'}
                onSelect={() => { setForm(f => ({ ...f, role: 'admin' })); setPermissionError('') }}
              />
            </div>
            {permissionError && <p className="text-xs text-red-500">{permissionError}</p>}
          </div>
        </div>

        {/* Additional details */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex flex-col gap-5">
          <h2 className="text-sm font-semibold text-slate-800">Additional details</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Full name <span className="text-slate-400 font-normal">(optional)</span></label>
              <input className={ifl()} placeholder="John Smith" value={form.fullname} onChange={e => setForm(f => ({ ...f, fullname: e.target.value }))} />
              <p className="text-xs text-slate-400">The team member can complete this later.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
              <input type="tel" className={ifl()} placeholder="+44 7700 900000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          {form.role === 'worker' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Default pay rate <span className="text-slate-400 font-normal">(optional)</span></label>
              <div className="flex items-center gap-0 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#1E3A5F]/15 focus-within:border-[#1E3A5F]/40 transition-all max-w-xs">
                <span className="px-3 bg-slate-50 border-r border-slate-200 text-sm text-slate-500 h-10 flex items-center">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="flex-1 h-10 px-3 text-sm text-slate-800 bg-white outline-none min-w-0"
                  placeholder="13.50"
                  value={form.payRate}
                  onChange={e => setForm(f => ({ ...f, payRate: e.target.value }))}
                />
                <span className="px-3 bg-slate-50 border-l border-slate-200 text-sm text-slate-500 h-10 flex items-center">/ hour</span>
              </div>
              <p className="text-xs text-slate-400">This can be changed later and individual jobs may override it.</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5 max-w-xs">
            <label className="text-sm font-semibold text-slate-700">Employee ID <span className="text-slate-400 font-normal">(optional)</span></label>
            <input className={ifl()} placeholder="CLN-104" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end pb-6">
          <button onClick={() => navigate('/team')} className="h-9 px-4 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={apiState === 'submitting'}
            className="h-9 px-5 text-sm font-bold text-white bg-[#1E3A5F] rounded-xl hover:bg-[#162D4A] transition-colors disabled:opacity-70 flex items-center gap-2"
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
