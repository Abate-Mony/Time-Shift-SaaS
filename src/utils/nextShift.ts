import dayjs, { type Dayjs } from "dayjs"
import utc from "dayjs/plugin/utc"
import type { CreateJobForm } from "./types"

dayjs.extend(utc)

/**
 * The worker's next shift: the earliest accepted shift that hasn't ended yet.
 * Mirrors the mobile app's Clock tab (time-sheet-mobile ec58ab1).
 *
 * `/workers?status=accepted&start=<today>` limits jobs to today or later but
 * sorts by date only (not start time), and today's list can include a shift
 * that's already over — so callers fetch a handful and this picks the right
 * one, by date then start time.
 */
export function pickNextShift<T extends Pick<CreateJobForm, "date" | "startTime" | "endTime">>(
  jobs: T[],
  now: Dayjs = dayjs()
): T | null {
  const upcoming = jobs
    .map(job => {
      // job.date is UTC midnight of the shift's own day
      const day = dayjs.utc(job.date).format("YYYY-MM-DD")
      const start = dayjs(`${day} ${job.startTime}`)
      let end = dayjs(`${day} ${job.endTime}`)
      if (!end.isAfter(start)) end = end.add(1, "day") // overnight shift
      return { job, start, end }
    })
    .filter(({ start, end }) => start.isValid() && end.isAfter(now))
    .sort((a, b) => a.start.valueOf() - b.start.valueOf())

  return upcoming[0]?.job ?? null
}

/** "Today", "Tomorrow", or "Sat, 21 Nov" for a job's UTC-midnight date. */
export function shiftDayLabel(date: string | Date | undefined, now: Dayjs = dayjs()): string {
  if (!date) return "Date TBC"
  const day = dayjs.utc(date).format("YYYY-MM-DD")
  if (day === now.format("YYYY-MM-DD")) return "Today"
  if (day === now.add(1, "day").format("YYYY-MM-DD")) return "Tomorrow"
  return dayjs.utc(date).format("ddd, D MMM")
}
