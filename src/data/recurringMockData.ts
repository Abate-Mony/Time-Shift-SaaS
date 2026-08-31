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
    client: string
  }
  occurrenceCount: number
  upcomingCount: number
  nextOccurrence?: string
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

export function describeRecurrence(s: RecurringSchedule): string {
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

// ─── Mock data ─────────────────────────────────────────────────────────────────

export const SCHEDULES: RecurringSchedule[] = [
  {
    _id: 'rs1',
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [1, 3, 5],
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    generatedUntil: '2026-09-30',
    active: true,
    templateJob: {
      _id: 'tj1',
      title: 'Canary Wharf Security — Night Shift',
      location: 'Canary Wharf, London',
      startTime: '22:00',
      endTime: '06:00',
      client: 'Harbour Property Management',
    },
    occurrenceCount: 47,
    upcomingCount: 14,
    nextOccurrence: '2026-09-02',
  },
  {
    _id: 'rs2',
    frequency: 'weekly',
    interval: 1,
    daysOfWeek: [5],
    startDate: '2026-06-06',
    generatedUntil: '2026-09-30',
    active: true,
    templateJob: {
      _id: 'tj2',
      title: 'Office Deep Clean',
      location: 'Bristol Office',
      startTime: '18:00',
      endTime: '21:00',
      client: 'ABC Property Management',
    },
    occurrenceCount: 21,
    upcomingCount: 6,
    nextOccurrence: '2026-09-05',
  },
  {
    _id: 'rs3',
    frequency: 'weekly',
    interval: 2,
    daysOfWeek: [6, 0],
    startDate: '2026-03-01',
    endDate: '2026-08-31',
    active: false,
    templateJob: {
      _id: 'tj3',
      title: 'Residential Care — Weekend Cover',
      location: 'Bath',
      startTime: '08:00',
      endTime: '20:00',
      client: 'Meadow Care',
    },
    occurrenceCount: 12,
    upcomingCount: 0,
  },
  {
    _id: 'rs4',
    frequency: 'daily',
    interval: 1,
    startDate: '2026-09-01',
    endDate: '2026-10-31',
    generatedUntil: '2026-09-30',
    active: true,
    templateJob: {
      _id: 'tj4',
      title: 'Swindon School Morning Clean',
      location: 'Swindon School',
      startTime: '06:30',
      endTime: '08:30',
      client: 'Wiltshire Council',
    },
    occurrenceCount: 8,
    upcomingCount: 22,
    nextOccurrence: '2026-09-01',
  },
  {
    _id: 'rs5',
    frequency: 'monthly',
    interval: 1,
    startDate: '2026-01-15',
    generatedUntil: '2026-09-15',
    active: true,
    templateJob: {
      _id: 'tj5',
      title: 'Monthly Equipment Audit',
      location: 'Cardiff Site',
      startTime: '09:00',
      endTime: '13:00',
      client: 'Cardiff Properties Ltd',
    },
    occurrenceCount: 8,
    upcomingCount: 3,
    nextOccurrence: '2026-10-15',
  },
]

export const SCHEDULE_DETAILS: Record<string, RecurringDetail> = {
  rs1: {
    ...SCHEDULES[0],
    defaultWorkers: [
      { _id: 'w1', fullname: 'James Carter',  email: 'james.carter@sparkle.com' },
      { _id: 'w2', fullname: 'Amina Mohamed', email: 'amina.m@sparkle.com' },
      { _id: 'w3', fullname: 'Tom Reeves',    email: 'tom.reeves@sparkle.com' },
    ],
    createdBy: { _id: 'u1', fullname: 'Sarah Jones' },
    createdAt: '2026-08-14',
    occurrences: {
      upcoming: [
        { _id: 'o1', title: 'Canary Wharf Security — Night Shift', date: '2026-09-02', startTime: '22:00', endTime: '06:00', status: 'Published', requiredWorkers: 3 },
        { _id: 'o2', title: 'Canary Wharf Security — Night Shift', date: '2026-09-04', startTime: '22:00', endTime: '06:00', status: 'Published', requiredWorkers: 3 },
        { _id: 'o3', title: 'Canary Wharf Security — Night Shift', date: '2026-09-07', startTime: '22:00', endTime: '06:00', status: 'Published', requiredWorkers: 3 },
        { _id: 'o4', title: 'Canary Wharf Security — Night Shift', date: '2026-09-09', startTime: '22:00', endTime: '06:00', status: 'Draft',     requiredWorkers: 3 },
        { _id: 'o5', title: 'Canary Wharf Security — Night Shift', date: '2026-09-11', startTime: '22:00', endTime: '06:00', status: 'Draft',     requiredWorkers: 3 },
      ],
      past: [
        { _id: 'p1', title: 'Canary Wharf Security — Night Shift', date: '2026-08-29', startTime: '22:00', endTime: '06:00', status: 'Completed', requiredWorkers: 3 },
        { _id: 'p2', title: 'Canary Wharf Security — Night Shift', date: '2026-08-27', startTime: '22:00', endTime: '06:00', status: 'Completed', requiredWorkers: 3 },
        { _id: 'p3', title: 'Canary Wharf Security — Night Shift', date: '2026-08-25', startTime: '22:00', endTime: '06:00', status: 'Cancelled', requiredWorkers: 3 },
        { _id: 'p4', title: 'Canary Wharf Security — Night Shift', date: '2026-08-22', startTime: '22:00', endTime: '06:00', status: 'Completed', requiredWorkers: 3 },
        { _id: 'p5', title: 'Canary Wharf Security — Night Shift', date: '2026-08-20', startTime: '22:00', endTime: '06:00', status: 'Completed', requiredWorkers: 3 },
        { _id: 'p6', title: 'Canary Wharf Security — Night Shift', date: '2026-08-18', startTime: '22:00', endTime: '06:00', status: 'Completed', requiredWorkers: 3 },
      ],
      total: 47,
    },
  },
  rs2: {
    ...SCHEDULES[1],
    defaultWorkers: [{ _id: 'w4', fullname: 'Priya Sharma', email: 'priya.sharma@sparkle.com' }],
    createdBy: { _id: 'u1', fullname: 'Sarah Jones' },
    createdAt: '2026-06-01',
    occurrences: {
      upcoming: [
        { _id: 'o6', title: 'Office Deep Clean', date: '2026-09-05', startTime: '18:00', endTime: '21:00', status: 'Published', requiredWorkers: 2 },
        { _id: 'o7', title: 'Office Deep Clean', date: '2026-09-12', startTime: '18:00', endTime: '21:00', status: 'Draft',     requiredWorkers: 2 },
      ],
      past: [
        { _id: 'p7', title: 'Office Deep Clean', date: '2026-08-29', startTime: '18:00', endTime: '21:00', status: 'Completed', requiredWorkers: 2 },
        { _id: 'p8', title: 'Office Deep Clean', date: '2026-08-22', startTime: '18:00', endTime: '21:00', status: 'Completed', requiredWorkers: 2 },
      ],
      total: 21,
    },
  },
  rs3: {
    ...SCHEDULES[2],
    defaultWorkers: [],
    createdBy: { _id: 'u2', fullname: 'Mike Andrews' },
    createdAt: '2026-02-20',
    occurrences: {
      upcoming: [],
      past: [
        { _id: 'p9',  title: 'Residential Care — Weekend Cover', date: '2026-08-30', startTime: '08:00', endTime: '20:00', status: 'Completed', requiredWorkers: 4 },
        { _id: 'p10', title: 'Residential Care — Weekend Cover', date: '2026-08-31', startTime: '08:00', endTime: '20:00', status: 'Completed', requiredWorkers: 4 },
        { _id: 'p11', title: 'Residential Care — Weekend Cover', date: '2026-08-16', startTime: '08:00', endTime: '20:00', status: 'Completed', requiredWorkers: 4 },
      ],
      total: 12,
    },
  },
}
