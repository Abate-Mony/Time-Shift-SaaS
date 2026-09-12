import type { PlanCatalogEntry } from '@/utils/types'

export type Billing = 'monthly' | 'annual'

// The plan catalog itself now comes from GET /companies/plans (see
// api-request-functions.ts's getPlanCatalog) — it used to be a hardcoded
// array here, which drifted out of sync with the backend's real limits
// (this file said "Up to 5 workers" on the free tier when the backend
// actually enforced 3). Only the billing-cycle helper stays local.
export function getPrice(plan: PlanCatalogEntry, billing: Billing): number | null {
    if (billing === 'annual') return plan.annualMonthly
    return plan.monthlyPrice
}
