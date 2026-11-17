import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import dayjs, { type Dayjs } from "dayjs"
import { AlertTriangle, Calendar, CalendarRange, ChevronLeft, ChevronRight, Clock, Repeat, X } from "lucide-react"
import { Input } from "@/components/ui"
import { cn } from "@/lib/utils"
import customFetch from "@/utils/customFetch"
import type { CreateJobForm } from "@/utils/types"
import { useCompanyPlan } from "@/hooks/useCompanyPlan"
import { PlanLockBadge } from "@/components/billing/PlanLockBadge"
import { activeWorkers, jobDateStr, jobSpan } from "@/components/calendar/calendarUtils"
import { useCreateJob, type ScheduleDay, type ScheduleMode, type SelectedWorker } from "./CreateJobContext"
import { FieldError } from "./FieldError"
import { formatHours } from "./wizardConfig"

const DOWS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const fmtDay = (d: string) => dayjs(d).format("ddd D MMM")

/**
 * "When is this job?" — the first section of step 2.
 * One day (date + times), Several days (pick dates on a calendar; one job
 * per day) or Repeats (the recurring schedule, rendered by the caller).
 */
export function WhenSection() {
  const { form, scheduleMode, setScheduleMode, scheduleDays, multiDayBlockedReason, shiftHours, totalHours } = useCreateJob()
  const { hasFeature } = useCompanyPlan()
  const canRecurring = hasFeature("recurringJobs")
  const { register, watch, formState: { errors } } = form
  const startTime = watch("startTime")
  const endTime = watch("endTime")

  const modes: { id: ScheduleMode; label: string; icon: React.ReactNode; disabled?: string | null }[] = [
    { id: "one", label: "One day", icon: <Calendar size={14} /> },
    { id: "multi", label: "Several days", icon: <CalendarRange size={14} />, disabled: multiDayBlockedReason },
    { id: "repeat", label: "Repeats", icon: <Repeat size={14} />, disabled: canRecurring ? null : "Upgrade your plan to use recurring jobs" },
  ]

  const timeInputs = (
    <>
      <div className="min-w-0">
        <Input
          label={scheduleMode === "multi" ? "Start" : "Start time"}
          type="time"
          icon={<Clock size={14} />}
          {...register("startTime")}
          className={cn(errors.startTime && "border-red-500!")}
        />
        <FieldError message={errors.startTime?.message as string} />
      </div>
      <div className="min-w-0">
        <Input
          label={scheduleMode === "multi" ? "Finish" : "End time"}
          type="time"
          icon={<Clock size={14} />}
          {...register("endTime")}
          className={cn(errors.endTime && "border-red-500!")}
        />
        <FieldError message={errors.endTime?.message as string} />
      </div>
    </>
  )

  return (
    <div className="bg-card rounded-xl border border-[var(--border)] p-6 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">When is this job?</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {scheduleMode === "multi"
              ? "Each day you pick becomes its own job, with the same details, workers and pay."
              : scheduleMode === "repeat"
                ? "Pick the first day and times, then how it repeats below."
                : "Pick the day and times."}
          </p>
        </div>
        <div role="group" aria-label="How often" className="flex gap-1 bg-muted p-1 rounded-lg shrink-0 max-w-full overflow-x-auto">
          {modes.map(m => (
            <button
              key={m.id}
              type="button"
              aria-pressed={scheduleMode === m.id}
              disabled={!!m.disabled}
              title={m.disabled ?? undefined}
              onClick={() => setScheduleMode(m.id)}
              className={cn(
                "h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                scheduleMode === m.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      {!canRecurring && scheduleMode !== "repeat" && (
        <div className="-mt-3 mb-4 flex justify-end">
          <PlanLockBadge label="Upgrade for repeating jobs" />
        </div>
      )}
      {multiDayBlockedReason && (
        <p className="-mt-3 mb-4 text-[11px] text-muted-foreground text-right">Several days: {multiDayBlockedReason}</p>
      )}

      {scheduleMode === "multi" ? (
        <MultiDayPicker timeInputs={timeInputs} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
            <div className="min-w-0">
              <Input
                label={scheduleMode === "repeat" ? "First day" : "Date"}
                type="date"
                min={dayjs().format("YYYY-MM-DD")}
                icon={<Calendar size={14} />}
                {...register("date")}
                className={cn(errors.date && "border-red-500!")}
              />
              <FieldError message={errors.date?.message as string} />
            </div>
            {timeInputs}
          </div>
          {shiftHours > 0 && (
            <DurationNote hours={shiftHours} overnight={!!endTime && !!startTime && endTime < startTime} />
          )}
        </>
      )}

      {scheduleMode === "multi" && scheduleDays.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{scheduleDays.length} job{scheduleDays.length === 1 ? "" : "s"}</span>{" "}
          will be created · {formatHours(totalHours)} per worker in total
        </p>
      )}
    </div>
  )
}

function DurationNote({ hours, overnight }: { hours: number; overnight: boolean }) {
  return (
    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 flex items-center gap-2 min-w-0 dark:bg-blue-500/10 dark:border-blue-500/20">
      <Clock size={14} className="text-blue-500 shrink-0" />
      <p className="text-sm text-blue-700 dark:text-blue-300 min-w-0">
        <span className="font-semibold">{formatHours(hours)}</span> shift duration
        {overnight && <span className="text-blue-500"> · overnight</span>}
      </p>
    </div>
  )
}

// ─── Several days ────────────────────────────────────────────────────────────

function MultiDayPicker({ timeInputs }: { timeInputs: React.ReactNode }) {
  const { multiDays, setMultiDays, perDayTimes, setPerDayTimes, scheduleDays, selectedWorkers } = useCreateJob()
  const today = dayjs().startOf("day")
  const firstPicked = scheduleDays[0]?.date
  const [month, setMonth] = useState<Dayjs>(() => (firstPicked ? dayjs(firstPicked) : today).startOf("month"))

  const toggle = (date: string) =>
    setMultiDays(prev => {
      const next = { ...prev }
      if (date in next) delete next[date]
      else next[date] = {}
      return next
    })
  const pick = (dates: string[]) => setMultiDays(Object.fromEntries(dates.map(d => [d, {}])))
  const setDayTime = (date: string, key: "startTime" | "endTime", value: string) =>
    setMultiDays(prev => ({ ...prev, [date]: { ...prev[date], [key]: value } }))

  const nextMonday = today.add(((8 - today.day()) % 7) || 7, "day")
  const weekdaysNextWeek = Array.from({ length: 5 }, (_, i) => nextMonday.add(i, "day").format("YYYY-MM-DD"))

  // ── Existing bookings of the picked workers, for double-booking warnings ──
  const visibleStart = month.startOf("month").format("YYYY-MM-DD")
  const visibleEnd = month.endOf("month").format("YYYY-MM-DD")
  const pickedStart = scheduleDays[0]?.date
  const pickedEnd = scheduleDays[scheduleDays.length - 1]?.date
  const busy = useWorkerBookings(selectedWorkers, visibleStart, visibleEnd)
  const busyPicked = useWorkerBookings(selectedWorkers, pickedStart, pickedEnd)
  const conflicts = useMemo(() => findConflicts(scheduleDays, busyPicked, selectedWorkers), [scheduleDays, busyPicked, selectedWorkers])
  const busyDays = useMemo(() => new Set(busy.map(b => jobDateStr(b))), [busy])

  const lead = (month.day() + 6) % 7
  const cells: (Dayjs | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: month.daysInMonth() }, (_, i) => month.date(i + 1)),
  ]

  return (
    <div className="flex flex-wrap gap-6 items-start min-w-0">
      {/* Calendar */}
      <div className="flex-1 basis-72 max-w-sm min-w-0">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!month.isAfter(today, "month")}
            onClick={() => setMonth(m => m.subtract(1, "month"))}
            className="size-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 cursor-pointer disabled:cursor-default"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-foreground">{month.format("MMMM YYYY")}</span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonth(m => m.add(1, "month"))}
            className="size-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DOWS.map(d => (
            <span key={d} className="text-center text-[10px] font-semibold uppercase text-muted-foreground py-1">{d}</span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={`pad-${i}`} />
            const key = d.format("YYYY-MM-DD")
            const past = d.isBefore(today, "day")
            const on = key in multiDays
            const isToday = d.isSame(today, "day")
            const hasBusy = !past && busyDays.has(key)
            return (
              <button
                key={key}
                type="button"
                disabled={past}
                aria-pressed={on}
                aria-label={`${d.format("D MMMM")}${on ? ", selected" : ""}${hasBusy ? ", a picked worker is already booked" : ""}`}
                onClick={() => toggle(key)}
                className={cn(
                  "relative h-10 rounded-lg border text-[13px] tabular-nums transition-colors cursor-pointer disabled:cursor-not-allowed",
                  on
                    ? "bg-[var(--primary)] border-[var(--primary)] text-white font-bold"
                    : past
                      ? "bg-muted/40 border-transparent text-muted-foreground/50"
                      : cn("bg-card hover:border-[var(--primary)] text-foreground", isToday ? "border-[var(--primary)] font-bold" : "border-[var(--border)]")
                )}
              >
                {d.date()}
                {hasBusy && (
                  <span aria-hidden className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full", on ? "bg-amber-300" : "bg-amber-600")} />
                )}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={() => pick(weekdaysNextWeek)}
            className="h-8 px-3 rounded-full border border-[var(--border)] text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
          >
            Weekdays next week
          </button>
          {scheduleDays.length > 0 && (
            <button type="button" onClick={() => pick([])} className="h-8 px-2 text-xs font-semibold text-[var(--primary)] underline underline-offset-2 cursor-pointer">
              Clear
            </button>
          )}
        </div>
        {selectedWorkers.length > 0 && (
          <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span aria-hidden className="size-1.5 rounded-full bg-amber-600 inline-block" /> A picked worker is already booked that day
          </p>
        )}
      </div>

      {/* Times + picked days */}
      <div className="flex-[999_1_18rem] min-w-0 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 max-w-sm">{timeInputs}</div>
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={perDayTimes}
            onChange={e => setPerDayTimes(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Different times on some days
        </label>

        <div className="border border-[var(--border)] rounded-xl overflow-hidden min-w-0">
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-[var(--border)]">
            <span className="text-sm font-semibold text-foreground">
              {scheduleDays.length ? `${scheduleDays.length} day${scheduleDays.length === 1 ? "" : "s"} picked` : "No days picked"}
            </span>
          </div>
          {scheduleDays.length === 0 ? (
            <p className="px-4 py-5 text-xs text-muted-foreground">Click days on the calendar to add them.</p>
          ) : (
            <ul className="divide-y divide-border max-h-96 overflow-y-auto scrollto">
              {scheduleDays.map(day => {
                const clash = conflicts.get(day.date)
                const own = multiDays[day.date] ?? {}
                return (
                  <li key={day.date} className="px-4 py-2.5 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex-1 min-w-0 text-sm font-semibold text-foreground">{fmtDay(day.date)}</span>
                      {!perDayTimes && (
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {day.startTime && day.endTime ? `${day.startTime}–${day.endTime}` : "Set times above"}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{day.hours ? formatHours(day.hours) : "—"}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${fmtDay(day.date)}`}
                        onClick={() => toggle(day.date)}
                        className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {perDayTimes && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <input
                          type="time"
                          aria-label={`Start time on ${fmtDay(day.date)}`}
                          value={day.startTime ?? ""}
                          onChange={e => setDayTime(day.date, "startTime", e.target.value)}
                          className={cn("h-9 w-[8rem] rounded-lg border bg-card px-2 text-sm tabular-nums", own.startTime ? "border-[var(--primary)]" : "border-[var(--border)]")}
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <input
                          type="time"
                          aria-label={`Finish time on ${fmtDay(day.date)}`}
                          value={day.endTime ?? ""}
                          onChange={e => setDayTime(day.date, "endTime", e.target.value)}
                          className={cn("h-9 w-[8rem] rounded-lg border bg-card px-2 text-sm tabular-nums", own.endTime ? "border-[var(--primary)]" : "border-[var(--border)]")}
                        />
                      </div>
                    )}
                    {clash && (
                      <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-900 dark:text-amber-200 bg-[var(--warning-bg)] border border-amber-300/70 rounded-lg px-2.5 py-1.5">
                        <AlertTriangle size={12} className="shrink-0 mt-0.5 text-amber-600" aria-hidden />
                        <span>{clash} You can still book it — change the time or swap the worker for that day later.</span>
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Double-booking check ─────────────────────────────────────────────────────

/** Existing (non-cancelled) jobs in [start, end] that any of the picked workers is on. */
function useWorkerBookings(workers: SelectedWorker[], start?: string, end?: string) {
  const enabled = workers.length > 0 && !!start && !!end
  // Same key/shape as the Calendar page's query, so its cache is shared
  const { data } = useQuery({
    queryKey: ["calendar", { start, end, status: "all" }],
    queryFn: async () => {
      const { data } = await customFetch.get<{ jobs: CreateJobForm[] }>("/calendar", { params: { start, end, status: "all" } })
      return data
    },
    enabled,
    staleTime: 60_000,
  })
  return useMemo(() => {
    if (!enabled) return []
    const ids = new Set(workers.map(w => w.worker))
    const emails = new Set(workers.map(w => w.email))
    return (data?.jobs ?? []).filter(
      j =>
        j.status !== "cancelled" &&
        activeWorkers(j).some((w: any) => ids.has(String(w.worker?._id ?? w.worker)) || emails.has(w.email ?? w.worker?.email))
    )
  }, [enabled, data, workers])
}

/** date → "Rose Mary is already on X 10:00–12:00." for picked days whose times overlap a booking. */
function findConflicts(days: ScheduleDay[], bookings: CreateJobForm[], workers: SelectedWorker[]): Map<string, string> {
  const out = new Map<string, string>()
  for (const day of days) {
    if (!day.startTime || !day.endTime) continue
    const mine = jobSpan(day)
    for (const b of bookings) {
      if (jobDateStr(b) !== day.date) continue
      const theirs = jobSpan(b)
      if (!(mine.s < theirs.e && theirs.s < mine.e)) continue
      const who = workers.find(w =>
        activeWorkers(b).some((a: any) => String(a.worker?._id ?? a.worker) === w.worker || (a.email ?? a.worker?.email) === w.email)
      )
      out.set(day.date, `${who?.fullname ?? "A picked worker"} is already on ${b.title} ${b.startTime}–${b.endTime}.`)
      break
    }
  }
  return out
}
