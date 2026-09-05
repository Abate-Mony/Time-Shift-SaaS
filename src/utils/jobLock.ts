import dayjs from "dayjs"

/**
 * Whether a job's date/pay/charge fields should no longer be editable.
 *
 * A draft was never live — nobody could have worked it — so it stays
 * editable regardless of what date it's set to. Anything else locks once
 * its shift date has passed, or once it's explicitly completed/cancelled,
 * since retroactively changing the time or rates on a shift that already
 * happened (or was called off) silently corrupts payroll/invoicing records.
 * Mirrors the same rule enforced server-side in jobController.ts's updateJob.
 */
export function isJobLocked(job: { status?: string | null; date?: string | Date | null }): boolean {
  if (!job.date) return false
  if (job.status === "draft") return false
  if (job.status === "completed" || job.status === "cancelled") return true
  return dayjs(job.date).isBefore(dayjs(), "day")
}
