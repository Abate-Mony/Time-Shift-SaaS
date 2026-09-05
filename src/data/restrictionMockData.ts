export type RestrictionCapability =
  | 'accept_jobs'
  | 'claim_jobs'
  | 'clock_in'
  | 'clock_out'
  | 'edit_profile'
  | 'view_timesheets'
  | 'view_earnings'
  | 'view_messages'

export type RestrictionReason =
  | 'document_expired'
  | 'disciplinary'
  | 'no_show'
  | 'left_company'
  | 'other'

export type RestrictionRemedy =
  | 'upload_document'
  | 'contact_manager'
  | 'appeal'
  | 'none'

export type AccessLevel = 'none' | 'read_only' | 'limited'

export type AppealStatus = 'pending' | 'accepted' | 'rejected'

export interface AppealState {
  submittedAt?: string
  message?: string
  status?: AppealStatus
  respondedAt?: string
  response?: string
}

export interface AccountRestriction {
  _id: string
  accessLevel: AccessLevel
  restrictions: RestrictionCapability[]
  reason: RestrictionReason
  message: string
  remedy: RestrictionRemedy
  canAppeal: boolean
  startsAt: string
  expiresAt?: string
  liftedAt?: string
  liftReason?: string
  appeal?: AppealState
  workerName?: string
  workerUpcomingShifts?: number
}

// ─── Human labels ─────────────────────────────────────────────────────────────

export const CAPABILITY_LABELS: Record<RestrictionCapability, string> = {
  accept_jobs: 'Accept new shifts',
  claim_jobs: 'Claim open shifts',
  clock_in: 'Clock in',
  clock_out: 'Clock out',
  edit_profile: 'Edit profile',
  view_timesheets: 'View timesheets',
  view_earnings: 'View earnings',
  view_messages: 'View messages',
}

export const CAPABILITY_GROUPS: { label: string; items: RestrictionCapability[] }[] = [
  { label: 'Work', items: ['accept_jobs', 'claim_jobs', 'clock_in', 'clock_out'] },
  { label: 'Account', items: ['edit_profile'] },
  { label: 'Information', items: ['view_timesheets', 'view_earnings', 'view_messages'] },
]

export const REASON_LABELS: Record<RestrictionReason, string> = {
  document_expired: 'Document expired',
  disciplinary: 'Disciplinary',
  no_show: 'No show',
  left_company: 'Left company',
  other: 'Other',
}

export const REMEDY_LABELS: Record<RestrictionRemedy, string> = {
  upload_document: 'Upload document',
  contact_manager: 'Contact manager',
  appeal: 'Appeal',
  none: 'No action required',
}

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  none: 'Suspended',
  read_only: 'Read only',
  limited: 'Limited',
}

// ─── All capabilities (allowed = not in restrictions) ─────────────────────────

export const ALL_CAPABILITIES: RestrictionCapability[] = [
  'accept_jobs', 'claim_jobs', 'clock_in', 'clock_out',
  'edit_profile', 'view_timesheets', 'view_earnings', 'view_messages',
]

// ─── Mock data — multiple worker restriction states ───────────────────────────

export const MOCK_RESTRICTIONS: Record<string, AccountRestriction | null> = {
  // w1 — limited (document expired)
  w1: {
    _id: 'r1',
    accessLevel: 'limited',
    restrictions: ['accept_jobs', 'claim_jobs', 'clock_in'],
    reason: 'document_expired',
    message: 'Your right-to-work document has expired. Please upload a replacement so your manager can review it.',
    remedy: 'upload_document',
    canAppeal: true,
    startsAt: '2026-09-04T09:00:00Z',
    expiresAt: '2026-09-11T23:59:00Z',
    appeal: undefined,
    workerName: 'James Mitchell',
    workerUpcomingShifts: 4,
  },
  // w2 — read only (disciplinary)
  w2: {
    _id: 'r2',
    accessLevel: 'read_only',
    restrictions: ALL_CAPABILITIES.filter(c => c !== 'view_timesheets' && c !== 'view_earnings' && c !== 'view_messages'),
    reason: 'disciplinary',
    message: 'Some actions are temporarily restricted while an internal review is completed.',
    remedy: 'contact_manager',
    canAppeal: false,
    startsAt: '2026-09-03T14:00:00Z',
    workerName: 'Aisha Patel',
    workerUpcomingShifts: 0,
  },
  // w3 — fully suspended
  w3: {
    _id: 'r3',
    accessLevel: 'none',
    restrictions: ALL_CAPABILITIES,
    reason: 'no_show',
    message: 'Your account has been suspended following a missed shift. Please contact your manager.',
    remedy: 'appeal',
    canAppeal: true,
    startsAt: '2026-09-02T10:00:00Z',
    expiresAt: '2026-09-09T23:59:00Z',
    appeal: {
      submittedAt: '2026-09-04T11:30:00Z',
      message: 'I had a family emergency and couldn\'t reach anyone in time. I have documentation available.',
      status: 'pending',
    },
    workerName: 'Carlos Santos',
    workerUpcomingShifts: 2,
  },
  // w4 — active (no restriction)
  w4: null,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function can(restriction: AccountRestriction | null, capability: RestrictionCapability): boolean {
  if (!restriction) return true
  if (restriction.accessLevel === 'none') return false
  if (restriction.accessLevel === 'read_only') {
    return ['view_timesheets', 'view_earnings', 'view_messages'].includes(capability)
  }
  return !restriction.restrictions.includes(capability)
}

export function isRestricted(restriction: AccountRestriction | null): boolean {
  return restriction !== null && restriction.accessLevel !== 'none'
}

export function isSuspended(restriction: AccountRestriction | null): boolean {
  return restriction !== null && restriction.accessLevel === 'none'
}

export function getAllowedCapabilities(restriction: AccountRestriction | null): RestrictionCapability[] {
  return ALL_CAPABILITIES.filter(c => can(restriction, c))
}

export function getBlockedCapabilities(restriction: AccountRestriction | null): RestrictionCapability[] {
  if (!restriction) return []
  return ALL_CAPABILITIES.filter(c => !can(restriction, c))
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
