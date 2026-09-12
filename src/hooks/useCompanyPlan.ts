import { getCompanyPlan } from '@/utils/api-request-functions'
import type { PlanLimits } from '@/utils/types'
import { useQuery } from '@tanstack/react-query'

// Single place every plan-gated control on the frontend reads from — same
// query key everywhere (['company-plan']) so React Query dedupes it across
// components instead of firing one request per gated button on a page.
// This only ever mutes/hides UI; the backend re-checks independently on
// every request (see server's planLimits.ts) and is the real enforcement.
export function useCompanyPlan() {
    const { data, isLoading } = useQuery({ queryKey: ['company-plan'], queryFn: getCompanyPlan })

    const hasFeature = (feature: keyof PlanLimits['features']): boolean =>
        // Fail open while still loading — a control shouldn't flash disabled
        // then enabled a moment later; the backend still gates the request
        // either way once submitted.
        isLoading || !data ? true : data.limits.features[feature]

    return { plan: data?.plan, limits: data?.limits, maxWorkers: data?.limits.maxWorkers, isLoading, hasFeature }
}
