import dayjs from "dayjs"
import isoWeek from "dayjs/plugin/isoWeek"
import customFetch from "@/utils/customFetch"
import type { CreateJobForm } from "@/utils/types"

dayjs.extend(isoWeek)

// ── Shape of GET /jobs (jobController.ts getAllJobs) ──────────────────────

export interface Staffing {
  required: number
  /** Accepted, in progress or completed. */
  filled: number
  /** Invited, not answered yet. */
  pending: number
  /** Places with nobody on them at all. */
  open: number
}

export type AttentionReason = "unfilled" | "time" | "draft_soon"

export type JobListItem = Omit<CreateJobForm, "site"> & {
  staffing: Staffing
  attention: AttentionReason[]
  bookingPosition: { day: number; of: number } | null
  repeat: string | null
  site?: { _id: string; name: string } | string | null
  siteSnapshot?: { name?: string } | null
}

export interface JobsListResponse {
  jobs: JobListItem[]
  totalJobs: number
  totalPages: number
  currentPage: number
  statusCounts: Record<"all" | "draft" | "published" | "completed" | "cancelled", number>
  attentionCount: number
}

/** Every URL param the Jobs page understands — all optional. */
export const JOB_LIST_PARAMS = [
  "search", "status", "priority", "client", "site", "worker", "unassigned", "unfilled",
  "attention", "start", "end", "sourceQuote", "sort", "page", "limit",
] as const

export const pickJobListParams = (params: Record<string, string | undefined>) =>
  Object.fromEntries(
    JOB_LIST_PARAMS.filter(k => params[k] !== undefined && params[k] !== "").map(k => [k, params[k] as string])
  )

export const jobsQuery = (params: Record<string, string | undefined>) => {
  const p = pickJobListParams(params)
  return {
    // Sorted keys so the same filters always hit the same cache entry.
    queryKey: ["jobs", Object.fromEntries(Object.entries(p).sort(([a], [b]) => a.localeCompare(b)))],
    queryFn: async () => {
      const { data } = await customFetch.get<JobsListResponse>("/jobs", { params: p })
      return data
    },
  }
}

/** Downloads GET /jobs/export with the page's current filters. */
export async function downloadJobsExport(params: Record<string, string | undefined>) {
  const p = pickJobListParams(params)
  delete p.page
  delete p.limit
  const res = await customFetch.get<Blob>("/jobs/export", { params: p, responseType: "blob" })
  const truncatedAt = res.headers?.["x-export-truncated"]
  saveBlob(res.data, `jobs-${dayjs().format("YYYY-MM-DD")}.csv`)
  return truncatedAt ? Number(truncatedAt) : null
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ── Filter panel ──────────────────────────────────────────────────────────

export const FILTER_PANEL_KEYS = ["client", "site", "worker", "priority", "unfilled", "unassigned"] as const

/** Workers for the Worker filter and bulk "Assign worker". */
export const companyWorkersQuery = {
  queryKey: ["workers", "filter-options"],
  queryFn: async () => {
    const { data } = await customFetch.get<{ users: { _id: string; fullname: string; email: string }[] }>("/users/users", {
      params: { role: "worker", limit: 500 },
    })
    return data.users ?? []
  },
  staleTime: 5 * 60_000,
}

// ── Date presets → the existing start/end params ──────────────────────────

export type DatePreset = "any" | "today" | "week" | "upcoming" | "past" | "custom"

const ISO = "YYYY-MM-DD"

export function presetRange(preset: Exclude<DatePreset, "custom">, now = dayjs()) {
  switch (preset) {
    case "any": return { start: null, end: null }
    case "today": return { start: now.format(ISO), end: now.format(ISO) }
    case "week": return { start: now.startOf("isoWeek").format(ISO), end: now.endOf("isoWeek").format(ISO) }
    case "upcoming": return { start: now.format(ISO), end: null }
    case "past": return { start: null, end: now.subtract(1, "day").format(ISO) }
  }
}

/** Which preset the current start/end match, if any. */
export function activePreset(start: string | null, end: string | null, now = dayjs()): DatePreset {
  for (const p of ["any", "today", "week", "upcoming", "past"] as const) {
    const r = presetRange(p, now)
    if ((r.start ?? null) === (start || null) && (r.end ?? null) === (end || null)) return p
  }
  return "custom"
}

// ── Display helpers ───────────────────────────────────────────────────────

export const isAllDay = (job: Pick<CreateJobForm, "startTime" | "endTime">) =>
  job.startTime === "00:00" && (job.endTime === "23:59" || job.endTime === "24:00")

export const liveWorkers = <W extends { status?: string }>(workers: W[] = []) =>
  workers.filter(w => w.status !== "declined" && w.status !== "cancelled")

export const dayKey = (date: string | Date | undefined) => dayjs(date).format(ISO)

export interface DayGroup<T> {
  key: string
  month: string
  jobs: T[]
}

/** Consecutive jobs on the same day, in the order the server sorted them. */
export function groupByDay<T extends { date?: string | Date }>(jobs: T[]): DayGroup<T>[] {
  const groups: DayGroup<T>[] = []
  for (const job of jobs) {
    const key = dayKey(job.date)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.jobs.push(job)
    else groups.push({ key, month: dayjs(job.date).format("MMMM YYYY"), jobs: [job] })
  }
  return groups
}

/** Summary on a day header: "2 of 3 fully staffed", "1 unfilled", "All staffed". */
export function daySummary(jobs: JobListItem[]) {
  const upcoming = jobs.filter(j => j.status === "draft" || j.status === "published")
  if (!upcoming.length) return { text: "", tone: "muted" as const }
  const unfilled = upcoming.filter(j => j.staffing?.open > 0).length
  if (unfilled) return { text: `${unfilled} unfilled`, tone: "bad" as const }
  return { text: upcoming.length > 1 ? "All staffed" : "Staffed", tone: "muted" as const }
}

export const siteName = (job: JobListItem) =>
  (typeof job.site === "object" && job.site?.name) || job.siteSnapshot?.name || ""

/** Splits text around case-insensitive matches of `term`, for highlighting. */
export function splitMatches(text: string, term: string | null | undefined) {
  const t = term?.trim()
  if (!t) return [{ text, match: false }]
  const lower = text.toLowerCase()
  const needle = t.toLowerCase()
  const parts: { text: string; match: boolean }[] = []
  let i = 0
  while (i < text.length) {
    const at = lower.indexOf(needle, i)
    if (at === -1) { parts.push({ text: text.slice(i), match: false }); break }
    if (at > i) parts.push({ text: text.slice(i, at), match: false })
    parts.push({ text: text.slice(at, at + t.length), match: true })
    i = at + t.length
  }
  return parts
}

/** CSV of the selected rows (same columns as the server export). */
export function jobsToCsv(jobs: JobListItem[]) {
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? "" : String(v)
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = ["Date", "Start", "End", "Hours", "Title", "Client", "Site", "Location", "Status", "Priority",
    "Workers needed", "Confirmed", "Invited", "Workers", "Booking", "Repeats"]
  const rows = jobs.map(j => [
    dayKey(j.date), j.startTime, j.endTime, Math.round(((j.minutes ?? 0) / 60) * 100) / 100, j.title,
    j.client?.name ?? "", siteName(j), j.location, j.status, j.priority,
    j.staffing?.required, j.staffing?.filled, j.staffing?.pending,
    liveWorkers(j.workers).map(w => w.fullname || w.email).join("; "),
    j.bookingPosition ? `Day ${j.bookingPosition.day} of ${j.bookingPosition.of}` : "",
    j.repeat ?? "",
  ])
  return "﻿" + [header, ...rows].map(r => r.map(cell).join(",")).join("\r\n") + "\r\n"
}
