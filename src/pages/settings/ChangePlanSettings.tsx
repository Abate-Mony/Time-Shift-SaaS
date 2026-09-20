import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import { ArrowLeft, Loader2, Lock } from 'lucide-react'
import type { iUser } from '@/layouts/dashboardlayout'
import { getCompanyPlan, getPlanCatalog } from '@/utils/api-request-functions'
import { isAdminRole } from '@/utils/roles'
import type { Billing } from '@/utils/constants/plant'
import { useQuery } from '@tanstack/react-query'
import { BillingToggle } from '@/components/billing/BillingToggle'
import { PlanCard } from '@/components/billing/PlanCard'
import { Skeleton } from '@/components/ui/skeleton'

function PlanCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex flex-col gap-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-24" />
      <div className="flex flex-col gap-2.5 mt-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
      <Skeleton className="h-9 w-full rounded-lg mt-2" />
    </div>
  )
}

export default function ChangePlanSettings() {
  const { user } = useOutletContext<{ user: iUser }>()
  const isAdmin = isAdminRole(user?.role)
  const navigate = useNavigate()
  const [billing, setBilling] = useState<Billing>('annual')
  const { data } = useQuery({ queryKey: ['company-plan'], queryFn: getCompanyPlan, enabled: isAdmin })
  const { data: plans, isLoading } = useQuery({ queryKey: ['plan-catalog'], queryFn: getPlanCatalog, enabled: isAdmin })

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex items-center gap-3 min-w-0">
          <Lock size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-muted-foreground">You don't have access to this.</p>
        </div>
      </div>
    )
  }

  const onSelectPlan = (planId: string, billing: Billing) => {
    navigate(`/settings/billing/checkout?plan=${planId}&billing=${billing}`)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-fade-in">
      {/* <button
        type="button"
        onClick={() => navigate('/settings/billing')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit mb-8"
      >
        <ArrowLeft size={14} /> Back to Billing
      </button> */}

      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold text-foreground mb-1.5">Choose your plan</h1>
        <p className="text-sm text-muted-foreground mb-6">Switch any time — changes apply from your next billing date.</p>
        <BillingToggle billing={billing} onChange={setBilling} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {Array.from({ length: 4 }).map((_, i) => (
            <PlanCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {plans?.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billing={billing}
              isCurrent={plan.id === data?.plan}
              onSelect={() => {
                if (plan.id === 'enterprise') {
                  // Contact sales — no self-serve checkout for Enterprise.
                  return
                }
                onSelectPlan(plan.id, billing)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
