import dayjs from "dayjs"
import type { RecurringState } from "@/components/RecurringJobSection"

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** Human-readable summary of a recurrence rule, for the review screen. */
export function describeRecurring(r: RecurringState): string {
  if (!r.enabled) return "Does not repeat"

  const parts: string[] = []

  if (r.pattern === "daily") {
    parts.push(r.repeatEvery === 1 ? "Every day" : `Every ${r.repeatEvery} days`)
  } else if (r.pattern === "weekly") {
    const days = r.weekdays.length
      ? r.weekdays.length === 7
        ? "every day"
        : r.weekdays.length === 1
          ? r.weekdays[0]
          : `${r.weekdays.slice(0, -1).join(", ")} and ${r.weekdays[r.weekdays.length - 1]}`
      : "no days selected"
    parts.push(r.repeatEvery === 1 ? `Every ${days}` : `Every ${r.repeatEvery} weeks on ${days}`)
  } else if (r.pattern === "monthly") {
    if (r.monthlyMode === "day-of-month") {
      const n = r.monthlyDay
      const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"
      parts.push(`Monthly on the ${n}${suffix}`)
    } else {
      parts.push(`Monthly on the ${r.monthlyWeekNum} ${r.monthlyWeekDay}`)
    }
  } else {
    const unit = r.repeatEvery === 1 ? r.customUnit.replace(/s$/, "") : r.customUnit
    parts.push(`Every ${r.repeatEvery} ${unit}`)
  }

  if (r.endType === "on-date" && r.endDate) {
    parts.push(`until ${dayjs(r.endDate).format("D MMM YYYY")}`)
  } else if (r.endType === "after") {
    parts.push(`for ${r.endOccurrences} occurrence${r.endOccurrences === 1 ? "" : "s"}`)
  } else {
    parts.push("with no end date")
  }

  return parts.join(", ")
}

export { DAY_NAMES }
