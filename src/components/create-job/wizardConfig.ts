/** Step definitions and the field-to-step map used to jump to the first
 *  invalid step on a failed publish. */

export const STEPS = [
  { id: 1, title: "Job details", shortTitle: "Details" },
  { id: 2, title: "Schedule & staffing", shortTitle: "Staffing" },
  { id: 3, title: "Pay & billing", shortTitle: "Billing" },
  { id: 4, title: "Instructions & policies", shortTitle: "Policies" },
  { id: 5, title: "Review", shortTitle: "Review" },
] as const

export const TOTAL_STEPS = STEPS.length

/** Fields validated before advancing past each step. */
export const STEP_FIELDS: Record<number, string[]> = {
  1: ["title", "description", "client", "priority", "location", "date", "startTime", "endTime"],
  2: ["requiredWorkers", "workers", "supervisor"],
  3: ["payRate", "chargeType", "chargeRate", "chargeAmount"],
  4: ["instructions", "notes", "clockInGraceMinutes", "geofenceMode", "geofenceRadiusMeters"],
  5: [],
}

/** Which step owns each field, so a failed publish can jump to the earliest one. */
export const FIELD_STEP_MAP: Record<string, number> = {
  title: 1,
  description: 1,
  client: 1,
  priority: 1,
  location: 1,
  address: 1,
  coordinates: 1,
  date: 1,
  startTime: 1,
  endTime: 1,

  workers: 2,
  requiredWorkers: 2,
  supervisor: 2,
  openToClaims: 2,
  requiresApproval: 2,

  payRate: 3,
  chargeType: 3,
  chargeRate: 3,
  chargeAmount: 3,

  instructions: 4,
  notes: 4,
  clockInGraceMinutes: 4,
  geofenceMode: 4,
  geofenceRadiusMeters: 4,
}

/**
 * A draft can be saved from step 3 onwards. By then the job has a name,
 * a date and staffing — enough to be a useful record to come back to.
 *
 * Note: the backend must accept a partial payload when status === "draft",
 * or this will fail the same validation as publishing.
 */
export const DRAFT_AVAILABLE_FROM_STEP = 3

export const DRAFT_REQUIRED_FIELDS = ["title", "date", "startTime", "endTime"]

/**
 * Every user-settable field, across all steps. Used to gate publish.
 *
 * Deliberately explicit rather than calling `trigger()` with no arguments:
 * RHF only tracks fields once they've actually been `register()`-ed, and a
 * step that was never mounted this session (e.g. the page loaded straight
 * onto Review via the URL, or the stepper jumped ahead) never registers its
 * inputs — so an argument-less `trigger()` validates against an empty field
 * set and resolves true even though the schema itself would reject the
 * values. Naming every field forces the resolver to check them regardless
 * of registration state.
 */
export const ALL_FIELDS = Object.values(STEP_FIELDS).flat()

/** Shift length in hours. Handles overnight shifts, where the end time is
 *  earlier than the start. */
export function shiftHoursFrom(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) return 0
  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)
  if ([sh, sm, eh, em].some(Number.isNaN)) return 0
  let mins = eh * 60 + em - (sh * 60 + sm)
  if (mins <= 0) mins += 24 * 60
  return mins / 60
}

export function formatHours(hours: number): string {
  const total = Math.round(hours * 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
