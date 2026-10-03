import customFetch from "@/utils/customFetch"
import dayjs from "dayjs"
import type { Lead, LeadDetailResponse, LeadListResponse, LeadSummary } from "@/utils/types/lead"

export interface LeadListParams {
  search?: string
  stage?: string
  source?: string
  assignedTo?: string
  followUp?: string
}

// Same "fetch a generous page, filter client-side" pattern as clients.ts/
// RecurringJobs — a company's open-lead list is a small, manageable set.
export const leadsQuery = (lifecycle: "open" | "lost" | "converted", params: LeadListParams = {}) => ({
  queryKey: ["leads", lifecycle, params],
  queryFn: async (): Promise<LeadListResponse> => {
    const endpoint = lifecycle === "lost" ? "/leads/lost" : lifecycle === "converted" ? "/leads/converted" : "/leads"
    const { data } = await customFetch.get<LeadListResponse>(endpoint, {
      params: { limit: 100, ...params },
    })
    return data
  },
})

export const leadSummaryQuery = () => ({
  queryKey: ["leads-summary"],
  queryFn: async (): Promise<{ summary: LeadSummary }> => {
    const { data } = await customFetch.get<{ summary: LeadSummary }>("/leads/summary")
    return data
  },
})

export const leadDetailQuery = (id: string) => ({
  queryKey: ["lead", id],
  queryFn: async (): Promise<LeadDetailResponse> => {
    const { data } = await customFetch.get<LeadDetailResponse>(`/leads/${id}`)
    return data
  },
})

// Admin/manager only — matches the backend's own assignedTo validation
// (leadController.ts's resolveAssignee). /users/users only filters by a
// single exact role server-side, so both roles are fetched together and
// filtered here rather than issuing two requests.
export const assignableUsersQuery = () => ({
  queryKey: ["leads-assignable-users"],
  queryFn: async (): Promise<{ _id: string; fullname: string; email: string; role: string }[]> => {
    const { data } = await customFetch.get<{ users: { _id: string; fullname: string; email: string; role: string }[] }>(
      "/users/users",
      { params: { limit: 100 } }
    )
    return data.users.filter(u => u.role === "admin" || u.role === "manager")
  },
})

export const fmtLeadValue = (v: number): string => `£${v.toLocaleString("en-GB")}`

export interface FollowUpLabel {
  text: string
  variant: "overdue" | "today" | "tomorrow" | "future"
}

// The backend hands back a raw ISO datetime (or null) — this is the one
// place that turns it into the "Overdue" / "Today, 14:30" / "Tomorrow, …"
// labels the design calls for, rather than the backend pre-formatting
// display strings it has no business owning.
export function formatFollowUp(iso?: string | null): FollowUpLabel | null {
  if (!iso) return null
  const d = dayjs(iso)
  const now = dayjs()
  if (d.isBefore(now)) return { text: "Overdue", variant: "overdue" }
  if (d.isSame(now, "day")) return { text: `Today, ${d.format("HH:mm")}`, variant: "today" }
  if (d.isSame(now.add(1, "day"), "day")) return { text: `Tomorrow, ${d.format("HH:mm")}`, variant: "tomorrow" }
  return { text: d.format("D MMM, HH:mm"), variant: "future" }
}
