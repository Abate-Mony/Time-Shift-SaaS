import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import type { CreateJobForm } from '@/utils/types'

dayjs.extend(utc)

export type IssueKind = 'unassigned' | 'understaffed' | 'conflict'

export interface JobIssue {
  jobId: string
  kind: IssueKind
  message: string
  detail: string
}

/** "09:30" → 9.5. Returns null for anything unparseable. */
export function timeToHours(t?: string | null): number | null {
  if (!t) return null
  const m = /^(\d{1,2}):(\d{2})/.exec(t.trim())
  if (!m) return null
  return Number(m[1]) + Number(m[2]) / 60
}

/** Start/end in decimal hours; an end at or before the start is treated as running past midnight. */
export function jobSpan(job: Pick<CreateJobForm, 'startTime' | 'endTime'>) {
  const s = timeToHours(job.startTime) ?? 0
  let e = timeToHours(job.endTime) ?? s + 1
  if (e <= s) e = 24
  return { s, e }
}

/** Stored job dates are UTC — compare them in UTC (see Calendar.tsx getJobsForDate). */
export const jobDateStr = (job: Pick<CreateJobForm, 'date'>) =>
  dayjs.utc(job.date).format('YYYY-MM-DD')

const ACTIVE_ASSIGNMENT = (status?: string) => status !== 'declined' && status !== 'cancelled'

export function activeWorkers(job: CreateJobForm) {
  return (job.workers ?? []).filter(w => ACTIVE_ASSIGNMENT(w.status))
}

const isLive = (job: CreateJobForm) =>
  job.status !== 'cancelled' && job.status !== 'completed' && job.status !== 'draft'

/**
 * Things a manager needs to act on: jobs with nobody on them, jobs short of
 * requiredWorkers, and workers booked on two overlapping jobs the same day.
 * Cancelled, completed and draft jobs are ignored.
 */
export function findIssues(jobs: CreateJobForm[]): Map<string, JobIssue[]> {
  const out = new Map<string, JobIssue[]>()
  const add = (i: JobIssue) => out.set(i.jobId, [...(out.get(i.jobId) ?? []), i])

  const live = jobs.filter(j => j._id && isLive(j))

  for (const job of live) {
    const assigned = activeWorkers(job).length
    const needed = job.requiredWorkers ?? 1
    if (assigned === 0) {
      add({ jobId: job._id!, kind: 'unassigned', message: 'No worker assigned', detail: 'Nobody is assigned to this job yet.' })
    } else if (assigned < needed) {
      add({
        jobId: job._id!,
        kind: 'understaffed',
        message: `Understaffed (${assigned} of ${needed})`,
        detail: `This job needs ${needed} workers but only ${assigned} ${assigned === 1 ? 'is' : 'are'} assigned.`,
      })
    }
  }

  // Double-bookings: same worker, same date, overlapping times
  const byDate = new Map<string, CreateJobForm[]>()
  for (const job of live) {
    const d = jobDateStr(job)
    byDate.set(d, [...(byDate.get(d) ?? []), job])
  }
  for (const dayJobs of byDate.values()) {
    for (let a = 0; a < dayJobs.length; a++) {
      for (let b = a + 1; b < dayJobs.length; b++) {
        const A = dayJobs[a], B = dayJobs[b]
        const sa = jobSpan(A), sb = jobSpan(B)
        if (!(sa.s < sb.e && sb.s < sa.e)) continue
        const idsA = new Map(activeWorkers(A).map(w => [w.worker, w.fullname]))
        for (const w of activeWorkers(B)) {
          if (!idsA.has(w.worker)) continue
          const name = w.fullname || 'A worker'
          add({ jobId: A._id!, kind: 'conflict', message: `${name} is double-booked`, detail: `${name} is also on “${B.title}” ${B.startTime}–${B.endTime}.` })
          add({ jobId: B._id!, kind: 'conflict', message: `${name} is double-booked`, detail: `${name} is also on “${A.title}” ${A.startTime}–${A.endTime}.` })
        }
      }
    }
  }
  return out
}

export interface PlacedJob {
  job: CreateJobForm
  s: number
  e: number
  lane: number
  lanes: number
}

/** Side-by-side lanes for overlapping jobs within one day column. */
export function layoutDay(jobs: CreateJobForm[]): PlacedJob[] {
  const placed: PlacedJob[] = jobs
    .map(job => ({ job, ...jobSpan(job), lane: 0, lanes: 1 }))
    .sort((a, b) => a.s - b.s || b.e - a.e)

  const laneEnds: number[] = []
  for (const p of placed) {
    let l = laneEnds.findIndex(end => end <= p.s)
    if (l < 0) { l = laneEnds.length; laneEnds.push(0) }
    laneEnds[l] = p.e
    p.lane = l
  }
  // Each job's lane count = widest lane among everything it overlaps (two passes settle chains)
  for (let pass = 0; pass < 2; pass++) {
    for (const p of placed) {
      for (const q of placed) {
        if (q.s < p.e && p.s < q.e) p.lanes = Math.max(p.lanes, q.lane + 1, q.lanes)
      }
    }
  }
  return placed
}

export const STATUS_LABEL: Record<string, string> = {
  published: 'Published',
  'in-progress': 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  draft: 'Draft',
}

export type FilterStatus = 'published' | 'in-progress' | 'completed' | 'cancelled' | 'draft'

export const STATUS_FILTERS: { status: FilterStatus; label: string }[] = [
  { status: 'published', label: 'Published' },
  { status: 'in-progress', label: 'In progress' },
  { status: 'completed', label: 'Completed' },
  { status: 'cancelled', label: 'Cancelled' },
  { status: 'draft', label: 'Draft' },
]
