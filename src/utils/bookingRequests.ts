import customFetch from "@/utils/customFetch"
import { isAxiosError } from "axios"
import toast from "react-hot-toast"

export type BookingRequestStatus = "pending" | "approved" | "declined" | "cancelled"

export interface BookingRequest {
  _id: string
  client: { _id: string; name: string } | string
  requestedBy: { _id: string; fullname: string; email: string } | string
  company: string
  service: string
  preferredDate: string
  preferredTime?: string
  notes: string
  status: BookingRequestStatus
  reviewedBy?: string | null
  reviewedAt?: string | null
  reviewNotes?: string
  convertedJob?: string | null
  createdAt: string
  updatedAt: string
}

export const bookingRequestsQuery = (status?: BookingRequestStatus) => ({
  queryKey: ["booking-requests", status ?? "all"],
  queryFn: async (): Promise<BookingRequest[]> => {
    const { data } = await customFetch.get<{ requests: BookingRequest[] }>("/booking-requests", {
      params: status ? { status } : undefined,
    })
    return data.requests
  },
})

export const singleBookingRequest = (id: string) => ({
  queryKey: ["booking-request", id],
  queryFn: async (): Promise<BookingRequest> => {
    const { data } = await customFetch.get<{ request: BookingRequest }>(`/booking-requests/${id}`)
    return data.request
  },
})

const getErrorMessage = (err: unknown): string =>
  isAxiosError(err)
    ? err.response?.data?.msg ?? err.response?.data?.message ?? "Something went wrong."
    : err instanceof Error
      ? err.message
      : "Something went wrong."

export const declineBookingRequest = async (id: string, reviewNotes?: string): Promise<BookingRequest | null> => {
  try {
    const { data } = await customFetch.patch<{ request: BookingRequest }>(`/booking-requests/${id}/decline`, { reviewNotes })
    toast.success("Request declined.")
    return data.request
  } catch (err) {
    toast.error(getErrorMessage(err))
    return null
  }
}
