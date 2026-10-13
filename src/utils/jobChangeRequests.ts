import customFetch from "@/utils/customFetch"
import { isAxiosError } from "axios"
import toast from "react-hot-toast"

export type JobChangeRequestStatus = "pending" | "approved" | "declined" | "cancelled"
export type JobChangeRequestType = "reschedule" | "cancel"

export interface JobChangeRequest {
  _id: string
  client: { _id: string; name: string } | string
  requestedBy: { _id: string; fullname: string; email: string } | string
  job: { _id: string; title: string; date: string; startTime: string; endTime: string; status: string } | string
  company: string
  type: JobChangeRequestType
  requestedDate?: string
  requestedStartTime?: string
  requestedEndTime?: string
  reason: string
  originalDate: string
  originalStartTime: string
  originalEndTime: string
  status: JobChangeRequestStatus
  reviewedBy?: string | null
  reviewedAt?: string | null
  reviewNotes?: string
  createdAt: string
  updatedAt: string
}

export const jobChangeRequestsQuery = (status?: JobChangeRequestStatus, type?: JobChangeRequestType) => ({
  queryKey: ["job-change-requests", status ?? "all", type ?? "all"],
  queryFn: async (): Promise<JobChangeRequest[]> => {
    const { data } = await customFetch.get<{ requests: JobChangeRequest[] }>("/job-change-requests", {
      params: { ...(status ? { status } : {}), ...(type ? { type } : {}) },
    })
    return data.requests
  },
})

export const singleJobChangeRequest = (id: string) => ({
  queryKey: ["job-change-request", id],
  queryFn: async (): Promise<JobChangeRequest> => {
    const { data } = await customFetch.get<{ request: JobChangeRequest }>(`/job-change-requests/${id}`)
    return data.request
  },
})

const getErrorMessage = (err: unknown): string =>
  isAxiosError(err)
    ? err.response?.data?.msg ?? err.response?.data?.message ?? "Something went wrong."
    : err instanceof Error
      ? err.message
      : "Something went wrong."

export const declineJobChangeRequest = async (id: string, reviewNotes?: string): Promise<JobChangeRequest | null> => {
  try {
    const { data } = await customFetch.patch<{ request: JobChangeRequest }>(`/job-change-requests/${id}/decline`, { reviewNotes })
    toast.success("Request declined.")
    return data.request
  } catch (err) {
    toast.error(getErrorMessage(err))
    return null
  }
}

export const approveCancelJobChangeRequest = async (id: string): Promise<JobChangeRequest | null> => {
  try {
    const { data } = await customFetch.patch<{ request: JobChangeRequest }>(`/job-change-requests/${id}/approve-cancel`)
    toast.success("Cancellation approved.")
    return data.request
  } catch (err) {
    toast.error(getErrorMessage(err))
    return null
  }
}
