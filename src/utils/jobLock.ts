import dayjs from "dayjs"

/**
 * Whether a job's date/time/pay/charge, assigned workers, and checklist
 * should no longer be editable.
 *
 * A draft was never live — nobody could have worked it — so it stays
 * editable regardless of what date it's set to. Anything else locks once
 * its shift date has passed, once it's explicitly completed/cancelled, or
 * once it's already been invoiced, since retroactively changing the time,
 * rates, staffing, or on-site checklist for a shift that already happened
 * (or was called off, or is already billed) silently corrupts
 * payroll/invoicing records or rewrites what's on record for it. Mirrors
 * the same rule enforced server-side in jobController.ts's updateJob.
 */
export function isJobLocked(job: { status?: string | null; date?: string | Date | null; billingStatus?: string | null }): boolean {
  if (!job.date) return false
  if (job.billingStatus === "invoiced") return true
  if (job.status === "draft") return false
  if (job.status === "completed" || job.status === "cancelled") return true
  return dayjs(job.date).isBefore(dayjs(), "day")
}
