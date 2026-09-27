import customFetch from "@/utils/customFetch"
import { isAxiosError } from "axios"
import toast from "react-hot-toast"

export type TimeOffType = "vacation" | "sick" | "personal" | "other"
export type TimeOffStatus = "pending" | "approved" | "rejected" | "cancelled"

export interface TimeOffRequest {
  _id: string
  worker: { _id: string; fullname: string; email: string } | string
  company: string
  startDate: string
  endDate: string
  type: TimeOffType
  reason: string
  status: TimeOffStatus
  reviewedBy?: string | null
  reviewedAt?: string | null
  managerNotes?: string
  createdAt: string
  updatedAt: string
}

export const timeOffRequestsQuery = (status?: TimeOffStatus) => ({
  queryKey: ["time-off", status ?? "all"],
  queryFn: async (): Promise<TimeOffRequest[]> => {
    const { data } = await customFetch.get<{ requests: TimeOffRequest[] }>("/time-off", {
      params: status ? { status } : undefined,
    })
    return data.requests
  },
})

// ── Worker-facing ────────────────────────────────────────────────────────

export const myTimeOffQuery = {
  queryKey: ["time-off", "me"],
  queryFn: async (): Promise<TimeOffRequest[]> => {
    const { data } = await customFetch.get<{ requests: TimeOffRequest[] }>("/time-off/me")
    return data.requests
  },
}

const getErrorMessage = (err: unknown): string =>
  isAxiosError(err)
    ? err.response?.data?.msg ?? err.response?.data?.message ?? "Something went wrong."
    : err instanceof Error
      ? err.message
      : "Something went wrong."

export const requestMyTimeOff = async (params: {
  startDate: string
  endDate: string
  type: TimeOffType
  reason?: string
}): Promise<boolean> => {
  try {
    await customFetch.post("/time-off/me", params)
    toast.success("Your time-off request has been sent to your manager.")
    return true
  } catch (err) {
    toast.error(getErrorMessage(err))
    return false
  }
}

export const cancelMyTimeOffRequest = async (id: string): Promise<boolean> => {
  try {
    await customFetch.patch(`/time-off/me/${id}/cancel`)
    toast.success("Request cancelled.")
    return true
  } catch (err) {
    toast.error(getErrorMessage(err))
    return false
  }
}

// ── Manager-facing ───────────────────────────────────────────────────────

export const reviewTimeOffRequest = async (
  id: string,
  decision: "approve" | "reject",
  managerNotes?: string
): Promise<TimeOffRequest> => {
  const { data } = await customFetch.patch<{ request: TimeOffRequest }>(`/time-off/${id}/review`, {
    decision,
    managerNotes,
  })
  return data.request
}
