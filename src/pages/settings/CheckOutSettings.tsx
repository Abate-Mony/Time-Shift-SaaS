import { useState } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import type { iUser } from '@/layouts/dashboardlayout'
import { getPrice, type Billing } from '@/utils/constants/plant'
import { Button } from '@/components/ui/button'
import { BillingToggle } from '@/components/billing/BillingToggle'
import { getPlanCatalog, updateCompanyPlan } from '@/utils/api-request-functions'
import { queryClient } from '@/lib/queryClient'
import { useQuery } from '@tanstack/react-query'

const CheckOutSettings = () => {
  const { user } = useOutletContext<{ user: iUser }>()
  const isAdmin = user?.role === 'admin'
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [confirming, setConfirming] = useState(false)

  const planId = searchParams.get('plan')
  const billing = (searchParams.get('billing') === 'annual' ? 'annual' : 'monthly') as Billing
  const { data: plans, isLoading } = useQuery({ queryKey: ['plan-catalog'], queryFn: getPlanCatalog, enabled: isAdmin })
  const plan = plans?.find(p => p.id === planId)

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

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in flex justify-center py-16 text-slate-400">
        <Loader2 size={22} className="animate-spin" />
      </div>
    )
  }

  // Enterprise has no self-serve checkout (BillingSettings routes it to
  // "Contact sales" instead) — and an unrecognised/missing plan id means
  // someone landed here directly rather than via a real plan selection.
  // Either way, there's nothing to check out.
  if (!plan || plan.id === 'enterprise') {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center min-w-0">
          <p className="text-sm font-semibold text-slate-700 mb-1">
            {plan ? "Enterprise doesn't have a self-serve checkout" : 'No plan selected'}
          </p>
          <p className="text-sm text-slate-500 mb-5">
            {plan
              ? "Get in touch and we'll set your plan up directly."
              : 'Pick a plan on the Billing page to continue.'}
          </p>
          <Button onClick={() => navigate('/settings/billing')}>Back to Billing</Button>
        </div>
      </div>
    )
  }

  const isFree = plan.id === 'free'
  const price = getPrice(plan, billing)

  const setBilling = (b: Billing) => {
    setSearchParams(prev => {
      prev.set('billing', b)
      return prev
    })
  }

  // No real payment processor behind this yet — the payment method below is
  // still the same mock Visa •••• 4242 BillingSettings shows. But the plan
  // change itself is real: confirming actually sets Company.plan, which is
  // what every limit check (worker cap, job cap, feature gates) reads.
  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await updateCompanyPlan(plan.id)
      await queryClient.invalidateQueries({ queryKey: ['company-plan'] })
      toast.success(isFree ? `You're on the ${plan.name} plan` : `Subscribed to ${plan.name}`)
      navigate('/settings/billing')
    } catch {
      toast.error("Couldn't update your plan. Try again.")
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in flex flex-col gap-5">
      {/* <button
        type="button"
        onClick={() => navigate('/settings/billing')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors w-fit"
      >
        <ArrowLeft size={14} /> Back to Billing 
      </button> */}

      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
          {isFree ? `Continue with ${plan.name}` : `Subscribe to ${plan.name}`}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isFree
            ? "No card needed — you can upgrade any time."
            : 'Review your order, then confirm to start your subscription.'}
        </p>
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-5 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-slate-800">{plan.name}</h3>
              {plan.highlighted && (
                <span className="bg-[#1E3A5F]/8 text-[#1E3A5F] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Most popular
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{plan.tagline}</p>
          </div>
          {!isFree && <BillingToggle billing={billing} onChange={setBilling} />}
        </div>

        <div className="flex items-end justify-between gap-3 mb-5 pb-5 border-b border-[#F1F5F9]">
          <div>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-bold text-slate-900 tracking-tight">£{price}</span>
              <span className="text-sm text-slate-400 mb-1">/mo</span>
            </div>
            {billing === 'annual' && !isFree && plan.annualPrice != null && (
              <p className="text-xs text-emerald-600 mt-1">Billed £{plan.annualPrice}/year</p>
            )}
            {billing === 'monthly' && !isFree && (
              <p className="text-xs text-slate-400 mt-1">Billed monthly, cancel any time</p>
            )}
          </div>
          {!isFree && (
            <p className="text-xs text-slate-400 shrink-0">
              {billing === 'annual' ? 'Billed annually' : 'Billed monthly'}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {plan.features.map(f => (
            <div key={f} className="flex items-center gap-2.5">
              <Check size={14} className="text-emerald-500 shrink-0" />
              <span className="text-sm text-slate-700">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment method — skipped entirely for the free plan */}
      {!isFree && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <CreditCard size={14} className="text-slate-400" /> Payment method
          </h3>
          <div className="flex items-center gap-3 p-3.5 border border-[#E2E8F0] rounded-xl min-w-0">
            <div className="w-10 h-7 bg-slate-800 rounded flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-bold">VISA</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">Visa ending in 4242</p>
              <p className="text-xs text-slate-400">Expires 08/2027</p>
            </div>
            <button type="button" className="ml-auto text-xs text-blue-600 font-medium hover:text-blue-800 shrink-0">
              Change
            </button>
          </div>
        </div>
      )}

      <motion.div whileTap={{ scale: 0.99 }}>
        <Button onClick={handleConfirm} disabled={confirming} className="w-full h-11">
          {confirming ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Processing…
            </>
          ) : isFree ? (
            <>
              <CheckCircle2 size={15} /> Continue on {plan.name}
            </>
          ) : (
            <>
              <ShieldCheck size={15} /> Confirm & subscribe — £{price}/mo
            </>
          )}
        </Button>
      </motion.div>
      {!isFree && (
        <p className="text-xs text-slate-400 text-center -mt-2">
          You can change or cancel your plan any time from Billing settings.
        </p>
      )}
    </div>
  )
}

export default CheckOutSettings
