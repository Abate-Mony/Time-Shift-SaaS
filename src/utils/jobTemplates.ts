import customFetch from "@/utils/customFetch"
import { queryClient } from "@/lib/queryClient"

// Mirrors auth-service-saas src/models/JobTemplate.ts.
export const TEMPLATE_ICONS = ["spray", "sparkles", "home", "bed", "building", "window", "flame", "tooth", "truck", "leaf", "wrench", "briefcase"] as const
export type TemplateIcon = (typeof TEMPLATE_ICONS)[number]

export interface JobTemplate {
  _id: string
  name: string
  summary: string
  icon: TemplateIcon
  title: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  startTime: string
  endTime: string
  requiredWorkers: number
  payRate: number
  chargeType: "hourly" | "fixed"
  chargeRate: number
  chargeAmount: number
  instructions: string
  notes: string
  checklist: { text: string }[]
  openToClaims: boolean
  requiresApproval: boolean
  autoAccept: boolean
  useCount: number
  lastUsedAt: string | null
}

export type JobTemplateInput = Omit<JobTemplate, "_id" | "useCount" | "lastUsedAt">

export const emptyTemplate = (): JobTemplateInput => ({
  name: "", summary: "", icon: "sparkles", title: "", description: "", priority: "medium",
  startTime: "", endTime: "", requiredWorkers: 1, payRate: 0, chargeType: "hourly", chargeRate: 0,
  chargeAmount: 0, instructions: "", notes: "", checklist: [], openToClaims: false,
  requiresApproval: true, autoAccept: false,
})

export const jobTemplatesQuery = {
  queryKey: ["job-templates"],
  queryFn: async () => {
    const { data } = await customFetch.get<{ templates: JobTemplate[] }>("/job-templates")
    return data.templates
  },
}

const refresh = () => queryClient.invalidateQueries({ queryKey: ["job-templates"] })

export async function saveJobTemplate(input: JobTemplateInput, id?: string) {
  const { data } = id
    ? await customFetch.patch<{ template: JobTemplate }>(`/job-templates/${id}`, input)
    : await customFetch.post<{ template: JobTemplate }>("/job-templates", input)
  await refresh()
  return data.template
}

export async function deleteJobTemplate(id: string) {
  await customFetch.delete(`/job-templates/${id}`)
  await refresh()
}

export async function saveJobAsTemplate(jobId: string, meta: { name: string; summary?: string; icon?: TemplateIcon }) {
  const { data } = await customFetch.post<{ template: JobTemplate }>(`/job-templates/from-job/${jobId}`, meta)
  await refresh()
  return data.template
}

/** Fire-and-forget: keeps "most used first" ordering accurate. */
export function markTemplateUsed(id: string) {
  customFetch.post(`/job-templates/${id}/used`).then(refresh).catch(() => {})
}

export const templateErrorMessage = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { msg?: string } } })?.response?.data?.msg ?? fallback

// ── Display helpers ─────────────────────────────────────────────────────

export function templateHours(t: Pick<JobTemplate, "startTime" | "endTime">) {
  if (!t.startTime || !t.endTime) return null
  const [sh, sm] = t.startTime.split(":").map(Number)
  const [eh, em] = t.endTime.split(":").map(Number)
  let mins = eh * 60 + em - (sh * 60 + sm)
  if (mins <= 0) mins += 24 * 60
  return Math.round((mins / 60) * 100) / 100
}

const gbp = (n: number) => `£${n % 1 ? n.toFixed(2) : n}`

export function templatePrice(t: Pick<JobTemplate, "chargeType" | "chargeRate" | "chargeAmount">) {
  if (t.chargeType === "fixed") return t.chargeAmount ? gbp(t.chargeAmount) : null
  return t.chargeRate ? `${gbp(t.chargeRate)}/h` : null
}

/** "4h · 3 workers · £85/h" */
export function templateMeta(t: JobTemplate) {
  const h = templateHours(t)
  return [h ? `${h}h` : null, `${t.requiredWorkers} worker${t.requiredWorkers === 1 ? "" : "s"}`, templatePrice(t)]
    .filter(Boolean)
    .join(" · ")
}

/** Which form fields applying `t` sets — for the "Filled from…" banner. */
export function filledFieldLabels(t: JobTemplate) {
  return [
    "title",
    t.description && "description",
    t.startTime && "times",
    "workers needed",
    t.payRate && "pay rate",
    templatePrice(t) && "charge",
    t.instructions && "instructions",
    t.checklist.length && `${t.checklist.length}-item checklist`,
  ].filter(Boolean) as string[]
}
