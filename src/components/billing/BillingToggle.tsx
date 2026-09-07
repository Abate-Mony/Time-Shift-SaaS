import type { Billing } from '@/utils/constants/plant'

export function BillingToggle({ billing, onChange }: { billing: Billing; onChange: (b: Billing) => void }) {
  return (
    <div className="inline-flex items-center gap-1 bg-slate-100 rounded-xl p-1">
      {(['monthly', 'annual'] as Billing[]).map(b => (
        <button
          key={b}
          type="button"
          onClick={() => onChange(b)}
          className={`relative h-8 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
            billing === b ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {b === 'annual' ? 'Annual' : 'Monthly'}
          {b === 'annual' && (
            <span
              className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-opacity ${
                billing === 'annual' ? 'bg-emerald-100 text-emerald-700 opacity-100' : 'opacity-0'
              }`}
            >
              SAVE 20%
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
