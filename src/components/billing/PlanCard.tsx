import { ArrowRight, Check, CheckCircle, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { getPrice, type Billing } from '@/utils/constants/plant'
import type { PlanCatalogEntry } from '@/utils/types'

interface PlanCardProps {
  plan: PlanCatalogEntry
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
          ? 'bg-card border-[var(--primary)]/25'
          : plan.highlighted
            ? 'bg-[var(--primary)] border-[var(--primary)] shadow-2xl shadow-[var(--primary)]/25'
            : 'bg-card border-border hover:border-slate-300 shadow-sm'
      }`}
    >
      {!isCurrent && plan.highlighted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400" />
      )}

      {/* One ribbon at a time — being on the plan you're already on is the
          more useful thing to tell someone than that it's also popular. */}
      {isCurrent ? (
        <div className="absolute -top-px left-1/2 -translate-x-1/2">
          <span className="inline-block px-3 py-1 bg-[var(--primary)] text-white text-[10px] font-bold tracking-widest uppercase rounded-b-lg shadow-lg">
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
            !isCurrent && plan.highlighted ? 'bg-white/15 text-white' : 'bg-[var(--primary)]/8 text-[var(--primary)]'
          }`}>
            <Sparkles size={14} />
          </div>
          <h3 className={`text-lg font-bold ${!isCurrent && plan.highlighted ? 'text-white' : 'text-foreground'}`}>
            {plan.name}
          </h3>
        </div>
        <p className={`text-sm mb-6 ${!isCurrent && plan.highlighted ? 'text-white/55' : 'text-muted-foreground'}`}>
          {plan.tagline}
        </p>

        {/* Price */}
        <div className="mb-7">
          {price === null ? (
            <div>
              <p className={`text-3xl font-bold ${!isCurrent && plan.highlighted ? 'text-white' : 'text-foreground'}`}>
                Custom
              </p>
              <p className={`text-sm mt-1 ${!isCurrent && plan.highlighted ? 'text-white/50' : 'text-muted-foreground'}`}>
                Contact us for pricing
              </p>
            </div>
          ) : price === 0 ? (
            <div>
              <p className={`text-3xl font-bold ${!isCurrent && plan.highlighted ? 'text-white' : 'text-foreground'}`}>
                Free
              </p>
              <p className={`text-sm mt-1 ${!isCurrent && plan.highlighted ? 'text-white/50' : 'text-muted-foreground'}`}>
                Limited features
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-end gap-1.5">
                <p className={`text-3xl font-bold tracking-tight ${!isCurrent && plan.highlighted ? 'text-white' : 'text-foreground'}`}>
                  £{price}
                </p>
                <p className={`text-sm mb-1 ${!isCurrent && plan.highlighted ? 'text-white/50' : 'text-muted-foreground'}`}>
                  / mo
                </p>
              </div>
              {billing === 'annual' && plan.annualPrice != null && (
                <p className={`text-xs mt-1 ${!isCurrent && plan.highlighted ? 'text-emerald-300' : 'text-emerald-600'}`}>
                  Billed £{plan.annualPrice}/year · save £{(plan.monthlyPrice! - plan.annualMonthly!) * 12}/year
                </p>
              )}
              {billing === 'monthly' && plan.annualMonthly != null && (
                <p className={`text-xs mt-1 ${!isCurrent && plan.highlighted ? 'text-white/40' : 'text-muted-foreground'}`}>
                  Switch to annual and save £{(plan.monthlyPrice! - plan.annualMonthly!) * 12}/year
                </p>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        {isCurrent ? (
          <div className="w-full h-11 rounded-xl text-sm font-bold mb-7 flex items-center justify-center gap-2 border border-[var(--primary)]/20 text-[var(--primary)] bg-[var(--primary)]/[0.04]">
            <CheckCircle size={14} /> Your current plan
          </div>
        ) : (
          <button
            type="button"
            onClick={onSelect}
            className={`w-full h-11 rounded-xl text-sm font-bold transition-all active:scale-[0.98] mb-7 flex items-center justify-center gap-2 ${
              plan.highlighted
                ? 'bg-card text-[var(--primary)] hover:bg-white/90'
                : plan.id === 'free'
                  ? 'border border-border text-muted-foreground hover:bg-muted'
                  : 'bg-[var(--primary)] text-white hover:bg-primary/90'
            }`}
          >
            {plan.ctaLabel}
            {plan.id !== 'free' && <ArrowRight size={14} />}
          </button>
        )}

        {/* Divider */}
        <div className={`h-px mb-6 ${!isCurrent && plan.highlighted ? 'bg-white/10' : 'bg-muted'}`} />

        {/* Features */}
        <div className="flex flex-col gap-3 flex-1">
          {plan.features.map(f => (
            <div key={f} className="flex items-start gap-2.5">
              <Check size={14} className={`shrink-0 mt-0.5 ${!isCurrent && plan.highlighted ? 'text-emerald-400' : 'text-[var(--primary)]'}`} />
              <span className={`text-sm leading-snug ${!isCurrent && plan.highlighted ? 'text-white/80' : 'text-muted-foreground'}`}>{f}</span>
            </div>
          ))}
          {plan.notIncluded?.map(f => (
            <div key={f} className="flex items-start gap-2.5 opacity-35">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground leading-snug line-through">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
