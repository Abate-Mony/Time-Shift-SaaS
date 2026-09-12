import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import { ArrowLeft, Loader2, Lock } from 'lucide-react'
import type { iUser } from '@/layouts/dashboardlayout'
import { getCompanyPlan, getPlanCatalog } from '@/utils/api-request-functions'
import type { Billing } from '@/utils/constants/plant'
import { useQuery } from '@tanstack/react-query'
import { BillingToggle } from '@/components/billing/BillingToggle'
import { PlanCard } from '@/components/billing/PlanCard'

export default function ChangePlanSettings() {
  const { user } = useOutletContext<{ user: iUser }>()
  const isAdmin = user?.role === 'admin'
  const navigate = useNavigate()
  const [billing, setBilling] = useState<Billing>('annual')
  const { data } = useQuery({ queryKey: ['company-plan'], queryFn: getCompanyPlan, enabled: isAdmin })
  const { data: plans, isLoading } = useQuery({ queryKey: ['plan-catalog'], queryFn: getPlanCatalog, enabled: isAdmin })

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 flex items-center gap-3 min-w-0">
          <Lock size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-slate-600">You don't have access to this.</p>
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
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors w-fit mb-8"
      >
        <ArrowLeft size={14} /> Back to Billing
      </button> */}

      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-1.5">Choose your plan</h1>
        <p className="text-sm text-slate-500 mb-6">Switch any time — changes apply from your next billing date.</p>
        <BillingToggle billing={billing} onChange={setBilling} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 size={22} className="animate-spin" />
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
