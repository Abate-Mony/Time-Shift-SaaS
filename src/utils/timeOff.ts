import customFetch from "@/utils/customFetch"

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
