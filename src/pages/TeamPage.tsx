import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus, Search, Mail, Users, ShieldCheck, Clock, MoreHorizontal,
  RefreshCw, Ban, ChevronDown, ShieldAlert, Scale, Check,
  Briefcase, User,
} from 'lucide-react'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { backLinkState } from '@/hooks/useBackLink'
import toast from 'react-hot-toast'
import customFetch from '@/utils/customFetch'
import { queryClient } from '@/lib/queryClient'
import type { User as AppUser } from '@/utils/types'
import { RestrictUserDialog } from '@/components/restriction/RestrictUserDialog'
import { ACCESS_LEVEL_LABELS, type AccessLevel, type AccountRestriction } from '@/data/restrictionMockData'
import {
  createRestriction,
  getActiveRestrictions,
  liftRestriction,
  respondToRestrictionAppeal,
  type CreateRestrictionPayload,
} from '@/utils/api-request-functions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TeamRole = 'worker' | 'manager' | 'admin'
type RowStatus = 'active' | 'suspended' | 'pending'

interface TeamUser extends AppUser {
  jobsCompleted: number
  hoursThisWeek: number
}

export interface InvitationListItem {
  _id: string
  email: string
  fullname?: string
  role: TeamRole
  status: 'pending' | 'expired' | 'revoked' | 'accepted'
  expiresAt: string
  createdAt: string
  invitedBy?: { _id: string; fullname: string }
}

// A member row (real account) and an invitation row (pending, not yet an
// account) are rendered in the same table — this is the shape both get
// normalized into.
interface Row {
  key: string
  email: string
  fullname?: string
  role: TeamRole
  status: RowStatus
  lastActive?: string | null
  invitedAt?: string
  invitationId?: string
  // Present only when this member currently has an active UserRestriction.
  restriction?: AccountRestriction
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const restrictionsQuery = () => ({
  queryKey: ['restrictions', 'active'],
  queryFn: getActiveRestrictions,
})

export const teamQuery = () => ({
  queryKey: ['team'],
  queryFn: async () => {
    // No `role` param — the backend already scopes an admin's /users/users
    // to manager+worker (and a manager's to worker-only), which is exactly
    // "both workers and managers" for this page.
    const { data } = await customFetch.get<{ users: TeamUser[]; nHits: number }>('/users/users')
    return data
  },
})

export const invitationsQuery = () => ({
  queryKey: ['invitations', 'pending'],
  queryFn: async () => {
    const { data } = await customFetch.get<{ invitations: InvitationListItem[]; totalInvitations: number }>(
      '/invitations',
      { params: { status: 'pending' } }
    )
    return data
  },
})

export const loader = (queryClient: QueryClient) => async () => {
  await Promise.all([
    queryClient.ensureQueryData(teamQuery()),
    queryClient.ensureQueryData(invitationsQuery()),
    queryClient.ensureQueryData(restrictionsQuery()),
  ])
  return null
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

// ─── Avatar ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#1E3A5F', '#0D9488', '#7C3AED', '#B45309', '#DC2626', '#0369A1']
function MemberAvatar({ row, size = 'md' }: { row: Row; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-9 h-9 text-xs'
  if (row.status === 'pending') {
    return (
      <div className={`${sz} rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center`}>
        <Mail size={size === 'sm' ? 10 : 13} className="text-slate-400" />
      </div>
    )
  }
  const color = AVATAR_COLORS[row.key.charCodeAt(1) % AVATAR_COLORS.length]
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0`} style={{ background: color }}>
      {(row.fullname ?? row.email).slice(0, 2).toUpperCase()}
    </div>
  )
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function StatusBadge({ status, sentDate, restriction }: { status: RowStatus; sentDate?: string; restriction?: AccountRestriction }) {
  if (status === 'active') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  )
  if (status === 'pending') return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Invitation pending
      </span>
      {sentDate && <span className="text-[11px] text-slate-400 pl-1">Sent {sentDate}</span>}
    </div>
  )
  // A restriction can be a full suspension or something lighter (read-only /
  // limited) — show which, rather than flattening every non-active worker
  // into the same "Suspended" label.
  const label = restriction ? ACCESS_LEVEL_LABELS[restriction.accessLevel] : 'Suspended'
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${restriction && restriction.accessLevel !== 'none' ? 'text-amber-700 bg-amber-50' : 'text-red-600 bg-red-50'
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${restriction && restriction.accessLevel !== 'none' ? 'bg-amber-400' : 'bg-red-500'}`} />
      {label}
    </span>
  )
}

function RoleBadge({ role }: { role: TeamRole }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${role === 'manager'
      ? 'bg-[#1E3A5F]/8 text-[#1E3A5F]'
      : 'bg-slate-100 text-slate-600'
      }`}>
      {role === 'manager' ? <ShieldCheck size={10} /> : <Briefcase size={10} />}
      {role === 'manager' ? 'Manager' : 'Worker'}
    </span>
  )
}

// ─── Actions dropdown ─────────────────────────────────────────────────────────

function ActionsMenu({
  row,
  onResend,
  onRevoke,
  onSuspend,
  onLift,
  onReviewAppeal,
  liftLoading,
}: {
  row: Row
  onResend: (row: Row) => void
  onRevoke: (row: Row) => void
  onSuspend: (row: Row) => void
  onLift: (row: Row) => void
  onReviewAppeal: (row: Row) => void
  liftLoading: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        aria-label="Actions"
      >
        <MoreHorizontal size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-9 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1 overflow-hidden"
          >
            {row.status === 'pending' ? (
              <>
                <MenuButton icon={<RefreshCw size={13} />} label="Resend invitation" onClick={() => { onResend(row); setOpen(false) }} />
                <div className="h-px bg-slate-100 my-1" />
                <MenuButton icon={<Ban size={13} />} label="Revoke invitation" onClick={() => { onRevoke(row); setOpen(false) }} destructive />
              </>
            ) : (
              <>
                {/* Active managers don't have a profile page yet */}
                {row.role === 'worker' && (
                  <Link
                    to={`/workers/${row.key}/worker-profile`}
                    state={backLinkState('Team')}
                    onClick={() => setOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors text-left text-slate-700 hover:bg-slate-50"
                  >
                    <User size={13} className="shrink-0" /> View profile
                  </Link>
                )}
                {row.role === 'worker' && <div className="h-px bg-slate-100 my-1" />}
                {row.restriction?.appeal?.status === 'pending' && (
                  <MenuButton
                    icon={<Scale size={13} />}
                    label="Review appeal"
                    onClick={() => { onReviewAppeal(row); setOpen(false) }}
                  />
                )}
                {row.restriction ? (
                  <MenuButton
                    icon={<ShieldCheck size={13} />}
                    label={liftLoading ? 'Lifting…' : 'Lift restriction'}
                    onClick={() => { if (!liftLoading) { onLift(row); setOpen(false) } }}
                  />
                ) : (
                  <MenuButton icon={<ShieldAlert size={13} />} label="Suspend / restrict" onClick={() => { onSuspend(row); setOpen(false) }} destructive />
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuButton({ icon, label, onClick, destructive }: { icon: React.ReactNode; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors text-left ${destructive ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
        }`}
    >
      <span className="shrink-0">{icon}</span>
      {label}
    </button>
  )
}

// ─── Revoke confirmation dialog ───────────────────────────────────────────────

function RevokeDialog({ row, onConfirm, onCancel, loading }: {
  row: Row; onConfirm: () => void; onCancel: () => void; loading: boolean
}) {
  return (
    <DialogBackdrop onClose={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <Ban size={18} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Revoke invitation?</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          <strong className="text-slate-700">{row.email}</strong> will no longer be able to use the current invitation link.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="h-9 px-4 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-9 px-4 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Revoke invitation
          </button>
        </div>
      </div>
    </DialogBackdrop>
  )
}

// ─── Appeal review dialog ─────────────────────────────────────────────────────

function ReviewAppealDialog({ row, onRespond, onCancel, loading }: {
  row: Row
  onRespond: (status: 'accepted' | 'rejected', response: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [response, setResponse] = useState('')
  const appeal = row.restriction?.appeal

  return (
    <DialogBackdrop onClose={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <Scale size={18} className="text-blue-500" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          {row.fullname ?? row.email}'s appeal
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">
          Their restriction: <strong className="text-slate-700">{row.restriction && ACCESS_LEVEL_LABELS[row.restriction.accessLevel]}</strong>
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">Their message</p>
          <p className="text-sm text-slate-700 leading-relaxed">{appeal?.message}</p>
        </div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your response <span className="text-red-400">*</span></label>
        <p className="text-[11px] text-slate-400 mb-1.5">Sent to them either way — a decline with no explanation is worse than no appeal process.</p>
        <textarea
          value={response}
          onChange={e => setResponse(e.target.value)}
          rows={3}
          placeholder="Explain your decision…"
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 resize-none transition-all mb-5"
        />
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 h-10 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => response.trim() && onRespond('rejected', response)}
            disabled={loading || !response.trim()}
            className="flex-1 h-10 text-sm font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-40 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={() => response.trim() && onRespond('accepted', response)}
            disabled={loading || !response.trim()}
            className="flex-1 h-10 text-sm font-bold bg-[#1E3A5F] text-white rounded-xl hover:bg-[#162D4A] disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
          >
            {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={13} />}
            Approve
          </button>
        </div>
      </div>
    </DialogBackdrop>
  )
}

// ─── Dialog backdrop ──────────────────────────────────────────────────────────

function DialogBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// ─── Main Team page ───────────────────────────────────────────────────────────

type FilterRole = 'all' | 'worker' | 'manager'
type FilterStatus = 'all' | 'active' | 'pending' | 'suspended'

export function Team() {
  const navigate = useNavigate()
  const { users } = useQuery(teamQuery()).data as { users: TeamUser[]; nHits: number }
  const { invitations } = useQuery(invitationsQuery()).data as { invitations: InvitationListItem[]; totalInvitations: number }
  const restrictions = useQuery(restrictionsQuery()).data ?? []

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<FilterRole>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [revokeTarget, setRevokeTarget] = useState<Row | null>(null)
  const [revokeLoading, setRevokeLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState<string | null>(null)
  const [suspendTarget, setSuspendTarget] = useState<Row | null>(null)
  const [suspending, setSuspending] = useState(false)
  const [liftingKey, setLiftingKey] = useState<string | null>(null)
  const [appealTarget, setAppealTarget] = useState<Row | null>(null)
  const [respondingToAppeal, setRespondingToAppeal] = useState(false)

  const restrictionByUser = new Map(
    restrictions.map(r => [(r as unknown as { user: { _id: string } }).user._id, r])
  )

  const rows: Row[] = [
    ...users.map((u): Row => {
      const restriction = restrictionByUser.get(u._id)
      return {
        key: u._id,
        email: u.email,
        fullname: u.fullname,
        role: u.role as TeamRole,
        // An active restriction of any level takes precedence over the
        // legacy isActive flag — it's the richer, user-visible mechanism now.
        status: restriction ? 'suspended' : (u.isActive ? 'active' : 'suspended'),
        lastActive: u.lastLogin,
        restriction,
      }
    }),
    ...invitations.map((inv): Row => ({
      key: inv._id,
      email: inv.email,
      fullname: inv.fullname,
      role: inv.role,
      status: 'pending',
      invitedAt: formatDate(inv.createdAt),
      invitationId: inv._id,
    })),
  ]

  const filtered = rows.filter(m => {
    const q = search.toLowerCase()
    const matchesSearch = !q || m.email.toLowerCase().includes(q) || (m.fullname?.toLowerCase().includes(q) ?? false)
    const matchesRole = filterRole === 'all' || m.role === filterRole
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const stats = {
    total: rows.length,
    workers: users.filter(m => m.role === 'worker' && m.isActive).length,
    managers: users.filter(m => m.role === 'manager' && m.isActive).length,
    pending: invitations.length,
  }

  const handleRevoke = async () => {
    if (!revokeTarget?.invitationId) return
    setRevokeLoading(true)
    try {
      await customFetch.patch(`/invitations/${revokeTarget.invitationId}/revoke`)
      toast.success(`Invitation to ${revokeTarget.email} has been revoked`)
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      setRevokeTarget(null)
    } catch (err: any) {
      toast.error(err.response?.data?.msg ?? 'Failed to revoke the invitation.')
    } finally {
      setRevokeLoading(false)
    }
  }

  const handleResend = async (row: Row) => {
    if (!row.invitationId) return
    setResendLoading(row.invitationId)
    try {
      await customFetch.post(`/invitations/${row.invitationId}/resend`)
      toast.success(`Invitation resent to ${row.email}`)
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    } catch (err: any) {
      toast.error(err.response?.data?.msg ?? 'Failed to resend the invitation.')
    } finally {
      setResendLoading(null)
    }
  }

  const handleApplyRestriction = async (data: Omit<CreateRestrictionPayload, 'user'>) => {
    if (!suspendTarget) return
    setSuspending(true)
    try {
      await createRestriction({ user: suspendTarget.key, ...data })
      setSuspendTarget(null)
    } catch {
      // createRestriction already toasted why — leave the dialog open so
      // the manager can adjust and retry instead of losing their input.
    } finally {
      setSuspending(false)
    }
  }

  const handleLift = async (row: Row) => {
    if (!row.restriction?._id) return
    setLiftingKey(row.key)
    await liftRestriction(row.restriction._id)
    setLiftingKey(null)
  }

  const handleRespondToAppeal = async (status: 'accepted' | 'rejected', response: string) => {
    if (!appealTarget?.restriction?._id) return
    setRespondingToAppeal(true)
    const ok = await respondToRestrictionAppeal(appealTarget.restriction._id, status, response)
    setRespondingToAppeal(false)
    // An accepted appeal also lifts the restriction server-side — either
    // way there's nothing left to review, so the dialog closes on success.
    if (ok) setAppealTarget(null)
  }

  const isEmpty = rows.length === 0

  return (
    <div className="p-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Team</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage the people who work across your company.</p>
        </div>
        <Link to="/team/invite" className="shrink-0">
          <button
            className="h-9 px-4 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center gap-2 shadow-sm"
          >
            <UserPlus size={14} />
            Invite team member
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Team members', value: stats.total, icon: <Users size={15} /> },
          { label: 'Active workers', value: stats.workers, icon: <Briefcase size={15} /> },
          { label: 'Managers', value: stats.managers, icon: <ShieldCheck size={15} /> },
          { label: 'Pending invitations', value: stats.pending, icon: <Mail size={15} />, accent: true },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.accent && s.value > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
            <div className={`flex items-center gap-1.5 text-sm font-semibold mb-1 ${s.accent && s.value > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
              {s.icon} {s.label}
            </div>
            <p className={`text-2xl font-bold ${s.accent && s.value > 0 ? 'text-amber-800' : 'text-slate-900'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {isEmpty ? (
        /* Empty state */
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#1E3A5F]/8 flex items-center justify-center mb-5">
            <Users size={26} className="text-[#1E3A5F]" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">Build your team</h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-6">
            Invite workers and managers so you can assign jobs, manage schedules and track work.
          </p>
          <button
            onClick={() => navigate('/team/invite')}
            className="h-10 px-5 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center gap-2"
          >
            <UserPlus size={14} />
            Invite your first team member
          </button>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
              />
            </div>
            <FilterSelect
              label="Role"
              value={filterRole}
              options={[
                { value: 'all', label: 'All roles' },
                { value: 'worker', label: 'Worker' },
                { value: 'manager', label: 'Manager' },
              ]}
              onChange={v => setFilterRole(v as FilterRole)}
            />
            <FilterSelect
              label="Status"
              value={filterStatus}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'pending', label: 'Invitation pending' },
                { value: 'suspended', label: 'Suspended' },
              ]}
              onChange={v => setFilterStatus(v as FilterStatus)}
            />
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Member', 'Role', 'Status', 'Last active', ''].map(col => (
                    <th key={col} className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">No team members match your filters.</td></tr>
                ) : filtered.map(m => (
                  <tr key={m.key} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <MemberAvatar row={m} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {m.fullname ?? <span className="text-slate-500 italic">No name set</span>}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><RoleBadge role={m.role} /></td>
                    <td className="px-5 py-4"><StatusBadge status={m.status} sentDate={m.invitedAt} restriction={m.restriction} /></td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-500">
                        {m.status === 'pending'
                          ? <span className="text-slate-300">—</span>
                          : m.lastActive ?? '—'
                        }
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {resendLoading === m.invitationId || liftingKey === m.key
                        ? <span className="w-5 h-5 border-2 border-[#1E3A5F] border-t-transparent rounded-full animate-spin block mx-auto" />
                        : <ActionsMenu row={m} onResend={handleResend} onRevoke={setRevokeTarget} onSuspend={setSuspendTarget} onLift={handleLift} onReviewAppeal={setAppealTarget} liftLoading={liftingKey === m.key} />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No team members match your filters.</p>
            ) : filtered.map(m => (
              <div key={m.key} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                <MemberAvatar row={m} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-slate-900 truncate">{m.fullname ?? m.email}</p>
                    <ActionsMenu row={m} onResend={handleResend} onRevoke={setRevokeTarget} onSuspend={setSuspendTarget} onLift={handleLift} onReviewAppeal={setAppealTarget} liftLoading={liftingKey === m.key} />
                  </div>
                  {m.fullname && <p className="text-xs text-slate-400 mb-2">{m.email}</p>}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <RoleBadge role={m.role} />
                    <StatusBadge status={m.status} sentDate={m.invitedAt} restriction={m.restriction} />
                    {m.lastActive && <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{m.lastActive}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Dialogs */}
      <AnimatePresence>
        {revokeTarget && (
          <RevokeDialog
            row={revokeTarget}
            onConfirm={handleRevoke}
            onCancel={() => setRevokeTarget(null)}
            loading={revokeLoading}
          />
        )}
        {suspendTarget && (
          <RestrictUserDialog
            workerName={suspendTarget.fullname ?? suspendTarget.email}
            onApply={handleApplyRestriction}
            onClose={() => { if (!suspending) setSuspendTarget(null) }}
          />
        )}
        {appealTarget && (
          <ReviewAppealDialog
            row={appealTarget}
            onRespond={handleRespondToAppeal}
            onCancel={() => { if (!respondingToAppeal) setAppealTarget(null) }}
            loading={respondingToAppeal}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Helper subcomponents ─────────────────────────────────────────────────────

function FilterSelect({ label, value, options, onChange }: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-9 pl-3 pr-8 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
        aria-label={label}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  )
}
