import { ArrowRight, Check, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { getPrice, type Billing, type Plan } from '@/utils/constants/plant'

interface PlanCardProps {
  plan: Plan
  billing: Billing
  isCurrent?: boolean
  onSelect: () => void
}

export function PlanCard({ plan, billing, isCurrent, onSelect }: PlanCardProps) {
  const price = getPrice(plan, billing)

  return (
    <motion.div
      whileHover={isCurrent ? undefined : { y: -2 }}
      transition={{ duration: 0.15 }}
      className={`relative flex flex-col h-full rounded-2xl border-2 overflow-hidden transition-all ${
        isCurrent
          ? 'bg-white border-[#1E3A5F]/25'
          : plan.highlighted
            ? 'bg-[#1E3A5F] border-[#1E3A5F] shadow-2xl shadow-[#1E3A5F]/25'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      {!isCurrent && plan.highlighted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400" />
      )}

      {/* One ribbon at a time — being on the plan you're already on is the
          more useful thing to tell someone than that it's also popular. */}
      {isCurrent ? (
        <div className="absolute -top-px left-1/2 -translate-x-1/2">
          <span className="inline-block px-3 py-1 bg-[#1E3A5F] text-white text-[10px] font-bold tracking-widest uppercase rounded-b-lg shadow-lg">
            Current plan
          </span>
        </div>
      ) : plan.highlighted ? (
        <div className="absolute -top-px left-1/2 -translate-x-1/2">
          <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-500 to-violet-500 text-white text-[10px] font-bold tracking-widest uppercase rounded-b-lg shadow-lg">
            Most Popular
          </span>
        </div>
      ) : null}

      <div className="p-7 pt-9 flex flex-col flex-1">
        {/* Plan header */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            !isCurrent && plan.highlighted ? 'bg-white/15 text-white' : 'bg-[#1E3A5F]/8 text-[#1E3A5F]'
          }`}>
            {plan.icon}
          </div>
          <h3 className={`text-lg font-bold ${!isCurrent && plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
            {plan.name}
          </h3>
        </div>
        <p className={`text-sm mb-6 ${!isCurrent && plan.highlighted ? 'text-white/55' : 'text-slate-500'}`}>
          {plan.tagline}
        </p>

        {/* Price */}
        <div className="mb-7">
          {price === null ? (
            <div>
              <p className={`text-3xl font-bold ${!isCurrent && plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                Custom
              </p>
              <p className={`text-sm mt-1 ${!isCurrent && plan.highlighted ? 'text-white/50' : 'text-slate-400'}`}>
                Contact us for pricing
              </p>
            </div>
          ) : price === 0 ? (
            <div>
              <p className={`text-3xl font-bold ${!isCurrent && plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                Free
              </p>
              <p className={`text-sm mt-1 ${!isCurrent && plan.highlighted ? 'text-white/50' : 'text-slate-400'}`}>
                Limited features
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-end gap-1.5">
                <p className={`text-3xl font-bold tracking-tight ${!isCurrent && plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                  £{price}
                </p>
                <p className={`text-sm mb-1 ${!isCurrent && plan.highlighted ? 'text-white/50' : 'text-slate-400'}`}>
                  / mo
                </p>
              </div>
              {billing === 'annual' && plan.annualPrice != null && (
                <p className={`text-xs mt-1 ${!isCurrent && plan.highlighted ? 'text-emerald-300' : 'text-emerald-600'}`}>
                  Billed £{plan.annualPrice}/year · save £{(plan.monthlyPrice! - plan.annualMonthly!) * 12}/year
                </p>
              )}
              {billing === 'monthly' && plan.annualMonthly != null && (
                <p className={`text-xs mt-1 ${!isCurrent && plan.highlighted ? 'text-white/40' : 'text-slate-400'}`}>
                  Switch to annual and save £{(plan.monthlyPrice! - plan.annualMonthly!) * 12}/year
                </p>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        {isCurrent ? (
          <div className="w-full h-11 rounded-xl text-sm font-bold mb-7 flex items-center justify-center gap-2 border border-[#1E3A5F]/20 text-[#1E3A5F] bg-[#1E3A5F]/[0.04]">
            <CheckCircle size={14} /> Your current plan
          </div>
        ) : (
          <button
            type="button"
            onClick={onSelect}
            className={`w-full h-11 rounded-xl text-sm font-bold transition-all active:scale-[0.98] mb-7 flex items-center justify-center gap-2 ${
              plan.highlighted
                ? 'bg-white text-[#1E3A5F] hover:bg-white/90'
                : plan.id === 'starter'
                  ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  : 'bg-[#1E3A5F] text-white hover:bg-[#162D4A]'
            }`}
          >
            {plan.ctaLabel}
            {plan.id !== 'starter' && <ArrowRight size={14} />}
          </button>
        )}

        {/* Divider */}
        <div className={`h-px mb-6 ${!isCurrent && plan.highlighted ? 'bg-white/10' : 'bg-slate-100'}`} />

        {/* Features */}
        <div className="flex flex-col gap-3 flex-1">
          {plan.features.map(f => (
            <div key={f} className="flex items-start gap-2.5">
              <Check size={14} className={`shrink-0 mt-0.5 ${!isCurrent && plan.highlighted ? 'text-emerald-400' : 'text-[#1E3A5F]'}`} />
              <span className={`text-sm leading-snug ${!isCurrent && plan.highlighted ? 'text-white/80' : 'text-slate-600'}`}>{f}</span>
            </div>
          ))}
          {plan.notIncluded?.map(f => (
            <div key={f} className="flex items-start gap-2.5 opacity-35">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
              <span className="text-sm text-slate-500 leading-snug line-through">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
