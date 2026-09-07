export type Billing = 'monthly' | 'annual'

export interface Plan {
    id: 'starter' | 'growth' | 'enterprise'
    name: string
    tagline: string
    monthlyPrice: number | null   // null = custom
    annualPrice: number | null    // annual total (null = custom)
    annualMonthly: number | null  // monthly equivalent when billed annually
    ctaLabel: string
    highlighted: boolean
    features: string[]
    notIncluded?: string[]
    icon?: React.ReactNode
}

export const PLANS: Plan[] = [
    {
        id: 'starter',
        name: 'Starter',
        tagline: 'For small teams',
        monthlyPrice: 0,
        annualPrice: 0,
        annualMonthly: 0,
        ctaLabel: 'Continue free',
        highlighted: false,
        features: [
            'Up to 5 workers',
            'Up to 10 jobs per month',
            'Clock-in / clock-out',
            'Basic timesheets',
            'CSV export',
            'Email support',
        ],
        notIncluded: ['GPS verification', 'Recurring jobs', 'Advanced reports'],
    },
    {
        id: 'growth',
        name: 'Growth',
        tagline: 'For operational teams',
        monthlyPrice: 49,
        annualPrice: 468,
        annualMonthly: 39,
        ctaLabel: 'Upgrade to Growth',
        highlighted: true,
        features: [
            'Unlimited workers',
            'Unlimited jobs',
            'GPS clock-in verification',
            'Recurring job templates',
            'Manager approval workflows',
            'Advanced reports & analytics',
            'Location management',
            'Priority support',
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        tagline: 'For large organisations',
        monthlyPrice: null,
        annualPrice: null,
        annualMonthly: null,
        ctaLabel: 'Contact sales',
        highlighted: false,
        features: [
            'Everything in Growth',
            'Multi-site management',
            'Google Workspace / SSO',
            'Dedicated account manager',
            'Custom integrations',
            'Audit logs',
            'SLA guarantee',
            'Bulk data import',
        ],
    },
]

export function getPrice(plan: Plan, billing: Billing): number | null {
    if (billing === 'annual') return plan.annualMonthly
    return plan.monthlyPrice
}

// Mock — there's no real subscription backend behind this billing area yet
// (see BillingSettings' hardcoded "Current Plan" card). Centralised here so
// the plan picker and the current-plan display can't silently disagree.
export const CURRENT_PLAN_ID: Plan['id'] = 'enterprise'
