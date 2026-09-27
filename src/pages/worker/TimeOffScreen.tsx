import { useState } from "react"
import { useNavigate } from "react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { CalendarOff, ChevronLeft, Loader2, X } from "lucide-react"
import toast from "react-hot-toast"

import { cancelMyTimeOffRequest, myTimeOffQuery, requestMyTimeOff, type TimeOffRequest, type TimeOffStatus, type TimeOffType } from "@/utils/timeOff"

export const loader = async () => null

const TYPES: { id: TimeOffType; label: string }[] = [
  { id: "vacation", label: "Vacation" },
  { id: "sick", label: "Sick" },
  { id: "personal", label: "Personal" },
  { id: "other", label: "Other" },
]

const STATUS_STYLES: Record<TimeOffStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Approved" },
  rejected: { bg: "bg-rose-50", text: "text-rose-700", label: "Declined" },
  cancelled: { bg: "bg-slate-100", text: "text-slate-600", label: "Cancelled" },
}

function formatRange(startDate: string, endDate: string): string {
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  if (start.isSame(end, "day")) return start.format("ddd, D MMM YYYY")
  return `${start.format("D MMM")} – ${end.format("D MMM YYYY")}`
}

export default function TimeOffScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: requests = [], isLoading } = useQuery(myTimeOffQuery)

  const [type, setType] = useState<TimeOffType>("vacation")
  const [startDate, setStartDate] = useState(() => dayjs().add(1, "day").format("YYYY-MM-DD"))
  const [endDate, setEndDate] = useState(() => dayjs().add(1, "day").format("YYYY-MM-DD"))
  const [reason, setReason] = useState("")

  const submitMutation = useMutation({
    mutationFn: () => requestMyTimeOff({ startDate, endDate, type, reason: reason.trim() || undefined }),
    onSuccess: (success) => {
      if (!success) return
      setReason("")
      setType("vacation")
      queryClient.invalidateQueries({ queryKey: ["time-off", "me"] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelMyTimeOffRequest(id),
    onSuccess: (success) => {
      if (!success) return
      queryClient.invalidateQueries({ queryKey: ["time-off", "me"] })
    },
  })

  const handleStartChange = (value: string) => {
    setStartDate(value)
    if (dayjs(endDate).isBefore(value, "day")) setEndDate(value)
  }

  const handleSubmit = () => {
    if (dayjs(endDate).isBefore(startDate, "day")) {
      toast.error("End date must be on or after the start date.")
      return
    }
    submitMutation.mutate()
  }

  return (
    <div className="flex flex-col gap-4 pb-4 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -mb-1"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
            <CalendarOff size={15} className="text-muted-foreground" />
          </span>
          Time Off
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Request time off and track your requests.</p>
      </div>

      {/* New request */}
      <div className="bg-card rounded-2xl border border-[var(--border)] p-4 shadow-sm flex flex-col gap-3">
        <p className="text-sm font-bold text-foreground">New Request</p>

        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-colors ${type === t.id
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-muted text-muted-foreground border-[var(--border)] hover:bg-muted/70"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Start date</span>
            <input
              type="date"
              value={startDate}
              min={dayjs().format("YYYY-MM-DD")}
              onChange={e => handleStartChange(e.target.value)}
              className="h-10 px-3 rounded-xl border border-[var(--border)] text-sm text-foreground bg-background outline-none focus:border-slate-400"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">End date</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              className="h-10 px-3 rounded-xl border border-[var(--border)] text-sm text-foreground bg-background outline-none focus:border-slate-400"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Reason (optional)</span>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Let your manager know why..."
            rows={3}
            className="text-sm border border-[var(--border)] rounded-xl px-3 py-2.5 outline-none focus:border-slate-400 resize-none bg-background text-foreground placeholder:text-muted-foreground"
          />
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
          className="h-11 rounded-xl bg-[var(--primary)] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {submitMutation.isPending && <Loader2 size={14} className="animate-spin" />}
          {submitMutation.isPending ? "Submitting…" : "Submit Request"}
        </button>
      </div>

      {/* History */}
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mt-1">Your Requests</p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No time-off requests yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map(request => {
            const statusStyle = STATUS_STYLES[request.status]
            return (
              <div key={request._id} className="bg-card rounded-2xl border border-[var(--border)] p-4 shadow-sm flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{formatRange(request.startDate, request.endDate)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{request.type}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusStyle.label}
                  </span>
                </div>

                {!!request.reason && <p className="text-xs text-muted-foreground">{request.reason}</p>}

                {!!request.managerNotes && (
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Manager: </span>
                      {request.managerNotes}
                    </p>
                  </div>
                )}

                {request.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => cancelMutation.mutate(request._id)}
                    disabled={cancelMutation.isPending}
                    className="h-9 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-100 transition-colors disabled:opacity-40"
                  >
                    <X size={12} /> Cancel request
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
