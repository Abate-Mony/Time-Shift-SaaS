// utils/mapRecurringStateToPayload.ts

import type { RecurringState } from "@/components/RecurringJobSection"

const WEEKDAY_TO_NUM: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

export interface RecurringPayload {
  isRecurring: boolean
  frequency?: 'daily' | 'weekly' | 'monthly'
  interval?: number
  daysOfWeek?: number[]
  endDate?: string
}

export function mapRecurringStateToPayload(r: RecurringState): RecurringPayload {
  if (!r.enabled) return { isRecurring: false }

  // Backend only supports daily/weekly/monthly — 'custom' has no equivalent yet.
  // Falling back to the closest supported unit so submission doesn't silently fail;
  // replace this once the backend supports a custom interval unit.
  const frequency: 'daily' | 'weekly' | 'monthly' =
    r.pattern === 'custom'
      ? r.customUnit === 'days' ? 'daily' : r.customUnit === 'weeks' ? 'weekly' : 'monthly'
      : r.pattern

  const payload: RecurringPayload = {
    isRecurring: true,
    frequency,
    interval: r.repeatEvery,
  }

  if (frequency === 'weekly') {
    payload.daysOfWeek = r.weekdays.map(d => WEEKDAY_TO_NUM[d])
  }

  // Backend has no equivalent for monthlyMode: 'day-of-week' (e.g. "second Tuesday").
  // Only day-of-month is representable via startDate's date-of-month — nothing extra to send.
  // If monthlyWeekNum/monthlyWeekDay are set, that choice is currently lost on submit.

  // Backend only supports endDate, not endOccurrences — 'after N occurrences' can't be sent yet.
  if (r.endType === 'on-date' && r.endDate) {
    payload.endDate = r.endDate
  }
  // r.endType === 'after' has no backend field to map to right now.

  return payload
}