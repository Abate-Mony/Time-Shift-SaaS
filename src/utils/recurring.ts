import type { AssignmentStatus } from "./types"

export type Frequency = 'daily' | 'weekly' | 'monthly'

export interface RecurringSchedule {
  _id: string
  frequency: Frequency
  interval: number
  daysOfWeek?: number[]
  startDate: string
  endDate?: string
  generatedUntil?: string
  active: boolean
  templateJob: {
    _id: string
    title: string
    location: string
    startTime: string
    endTime: string
    client?: string
  }
  maxOccurrences?: number
  occurrenceCount: number
  upcomingCount: number
  nextOccurrence?: string | null
}

export interface RecurringOccurrence {
  _id: string
  title: string
  date: string
  startTime: string
  endTime: string
  status: string
  requiredWorkers: number
}

export interface RecurringDetail extends RecurringSchedule {
  defaultWorkers: { _id: string; fullname: string; email: string }[]
  createdBy: { _id: string; fullname: string }
  createdAt: string
  occurrences: {
    upcoming: RecurringOccurrence[]
    past: RecurringOccurrence[]
    total: number
  }
}

// ─── Day names ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function describeRecurrence(s: Pick<RecurringSchedule, 'frequency' | 'interval' | 'daysOfWeek'>): string {
  const days = s.daysOfWeek?.map(d => DAY_NAMES[d]).join(', ') ?? ''
  if (s.frequency === 'daily') {
    return s.interval === 1 ? 'Every day' : `Every ${s.interval} days`
  }
  if (s.frequency === 'weekly') {
    const dStr = days || 'weekly'
    return s.interval === 1 ? `Every ${dStr}` : `Every ${s.interval} weeks on ${dStr}`
  }
  if (s.frequency === 'monthly') {
    return s.interval === 1 ? 'Monthly' : `Every ${s.interval} months`
  }
  return ''
}

export function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function fmtDateLong(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const  statusStyle=(s: AssignmentStatus)=> {
  if (s === 'accepted')  return 'bg-emerald-50 text-emerald-700'
  if (s === 'pending')   return 'bg-amber-50 text-amber-700'
  if (s === 'declined')  return 'bg-red-50 text-red-600'
  if (s === 'in-progress') return 'bg-blue-50 text-blue-700'
  if (s === 'completed') return 'bg-slate-100 text-slate-500'
  return 'bg-slate-100 text-slate-400'
}

export const  statusLabel=(s: AssignmentStatus)=> {
  return s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')
}

