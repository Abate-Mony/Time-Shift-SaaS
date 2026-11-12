/**
 * Per-worker pay rates.
 *
 * A job has one default `payRate`; any assigned worker can be paid a
 * different rate. The backend stores the rate actually paid on the
 * assignment (`payRate`) plus `payRateIsCustom`. To set or keep an
 * override, a worker's entry in a create/update `workers` payload carries
 * `customPayRate` — entries without it are put on the job's default.
 */

type PayFields = { payRate?: number; payRateIsCustom?: boolean; customPayRate?: number | null }

/**
 * Before resending a job's roster (edit page, add/remove worker), carry each
 * existing override forward — otherwise the backend reads the resent roster
 * as "everyone on the default" and wipes custom rates.
 */
export function withCustomPayRates<T extends PayFields>(workers: T[]): T[] {
    return workers.map(w =>
        w.customPayRate == null && w.payRateIsCustom && typeof w.payRate === "number"
            ? { ...w, customPayRate: w.payRate }
            : w
    )
}

/** Raw input text → a valid rate, or undefined for empty/invalid. */
export function parseRateInput(raw: string | undefined): number | undefined {
    if (raw === undefined || raw.trim() === "") return undefined
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : undefined
}
