import dayjs from "dayjs"

export function minutesToHours(minutes: number | null | undefined): number {
    return Number(((minutes ?? 0) / 60).toFixed(0))
}

export function formatDuration(minutes: number | null | undefined): string {
    const total = Math.max(Math.round(minutes ?? 0), 0)
    const h = Math.floor(total / 60)
    const m = total % 60
    if (h === 0) return `${m}m`
    return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// For a future point in time rather than an elapsed/worked span (e.g. "starts
// in…") — those can legitimately be days out, where formatDuration's "72h 0m"
// stops being readable. Anything under 24h still reads as hours/minutes.
export function formatTimeUntil(minutes: number | null | undefined): string {
    const total = Math.max(Math.round(minutes ?? 0), 0)
    const days = Math.floor(total / 1440)
    if (days === 0) return formatDuration(total)
    const remainingHours = Math.floor((total % 1440) / 60)
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
}

export function formatSecondsAsClock(seconds: number) {
    const total = Math.max(Math.round(seconds), 0)
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return {
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
    }
}

export function formatSecondsAsDuration(seconds: number): string {
    return formatDuration(seconds / 60)
}

// Pure schedule math — how far through its scheduled window a shift is right
// now, based on the job's own date/startTime/endTime, not any one worker's
// clock-in. Callers decide whether a bar should even render (only while at
// least one assignment is actually "in-progress" — a shift scheduled for
// later shouldn't show 0%, and one where everyone's clocked out shouldn't
// keep animating).
export function getShiftProgress(date: string | Date, startTime: string, endTime: string): { percent: number; isOverTime: boolean } {
    const day = dayjs(date).format('YYYY-MM-DD')
    const scheduledStart = dayjs(`${day} ${startTime}`)
    let scheduledEnd = dayjs(`${day} ${endTime}`)
    if (scheduledEnd.isBefore(scheduledStart)) scheduledEnd = scheduledEnd.add(1, 'day')

    const totalSeconds = scheduledEnd.diff(scheduledStart, 'second')
    const elapsedSeconds = Math.max(dayjs().diff(scheduledStart, 'second'), 0)
    const percent = totalSeconds > 0 ? Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100)) : 0
    const isOverTime = totalSeconds > 0 && elapsedSeconds > totalSeconds

    return { percent, isOverTime }
}

export function formatDate(date: string | Date | undefined, pattern = "ddd, D MMM"): string {
    if (!date) return "Date TBC"
    return dayjs(date).format(pattern)
}
