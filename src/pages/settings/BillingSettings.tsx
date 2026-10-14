import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { iUser } from '@/layouts/dashboardlayout'
import { getCompanyPlan, getPlanCatalog, createPortalSession } from '@/utils/api-request-functions'
import { isAdminRole } from '@/utils/roles'
import { useQuery } from '@tanstack/react-query'
import { Check, Loader2, Lock } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router'
import toast from 'react-hot-toast'

// "Manage billing" (Stripe's hosted Billing Portal) is the only entry
// point for cancelling, updating the card on file, and viewing invoices —
// no custom UI for any of that lives in this app. A company only sees it
// once there's something to manage; hasStripeCustomer alone would be
// wrong here (a fully-cancelled company still has one on file but nothing
// live to manage, and would otherwise get stuck with no way to resubscribe).
const LIVE_SUBSCRIPTION_STATUSES = ['active', 'past_due', 'unpaid']

const FEATURE_LABEL = {
    gpsVerification: 'GPS clock-in verification',
    recurringJobs: 'Recurring job templates',
    openShifts: 'Open shifts & approval workflows',
    advancedReports: 'Advanced reports & analytics',
    aiJobAssistant: 'AI job-creation assistant',
    aiDashboardInsights: 'AI dashboard insights',
} as const

export default function BillingSettings() {
    const { user } = useOutletContext<{ user: iUser }>()
    const isAdmin = isAdminRole(user?.role)
    const navigate = useNavigate()

    // Same source of truth the plan picker (ChangePlanSettings) uses, so this
    // badge and "your current plan" over there can't silently disagree.
    const { data } = useQuery({ queryKey: ['company-plan'], queryFn: getCompanyPlan, enabled: isAdmin })
    const { data: plans } = useQuery({ queryKey: ['plan-catalog'], queryFn: getPlanCatalog, enabled: isAdmin })
    const currentPlan = plans?.find(p => p.id === data?.plan)
    const [openingPortal, setOpeningPortal] = useState(false)
    const hasLiveSubscription = LIVE_SUBSCRIPTION_STATUSES.includes(data?.subscriptionStatus ?? '')

    const handleManageBilling = async () => {
        setOpeningPortal(true)
        try {
            const { url } = await createPortalSession()
            window.location.href = url
        } catch (err: any) {
            toast.error(err?.response?.data?.msg ?? "Couldn't open billing management. Try again.")
            setOpeningPortal(false)
        }
    }

    if (!isAdmin) {
        return (
            <div className="p-6 max-w-3xl mx-auto animate-fade-in">
                <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex items-center gap-3 min-w-0">
                    <Lock size={16} className="text-amber-600 shrink-0" />
                    <p className="text-sm text-muted-foreground">You don't have access to this.</p>
                </div>
            </div>
        )
    }

    const enabledFeatures = data
        ? (Object.entries(data.limits.features) as [keyof typeof FEATURE_LABEL, boolean][])
            .filter(([, enabled]) => enabled)
            .map(([key]) => FEATURE_LABEL[key])
        : []
    const workerLimitLabel = data
        ? data.maxWorkers === -1 ? 'Unlimited workers' : `Up to ${data.maxWorkers} workers`
        : null
    const jobLimitLabel = data
        ? data.limits.maxJobsPerMonth === -1 ? 'Unlimited jobs' : `Up to ${data.limits.maxJobsPerMonth} jobs per month`
        : null

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in flex flex-col gap-4">
            <div className="bg-card rounded-xl border border-[var(--border)] p-6 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-5 min-w-0">
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">Current Plan</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Billed monthly</p>
                    </div>
                    <span className="bg-[var(--primary)] text-white text-xs font-semibold px-3 py-1 rounded-full shrink-0">
                        {currentPlan?.name ?? '—'}
                    </span>
                </div>
                {currentPlan?.monthlyPrice != null && (
                    <div className="flex items-end gap-1 mb-4">
                        <span className="text-3xl font-bold text-foreground">£{currentPlan.monthlyPrice}</span>
                        <span className="text-muted-foreground text-sm mb-1">/month</span>
                    </div>
                )}
                <div className="flex flex-col gap-2 mb-5">
                    {[jobLimitLabel, workerLimitLabel, ...enabledFeatures].filter((f): f is string => !!f).map(f => (
                        <div key={f} className="flex items-center gap-2">
                            <Check size={14} className="text-emerald-500 shrink-0" />
                            <span className="text-sm text-foreground">{f}</span>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3">
                    {hasLiveSubscription ? (
                        <Button variant="outline" size="sm" onClick={handleManageBilling} disabled={openingPortal}>
                            {openingPortal && <Loader2 size={14} className="animate-spin" />}
                            Manage billing
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => navigate('/settings/billing/plans')}>
                            Change Plan
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
