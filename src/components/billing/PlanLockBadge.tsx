import { Lock } from 'lucide-react'

// Small "this needs a higher plan" pill — dropped next to any control muted
// by useCompanyPlan().hasFeature(). Purely a UI hint; the backend rejects
// the request independently either way (see server's planLimits.ts) if
// someone gets past this via devtools.
export function PlanLockBadge({ label = 'Upgrade to unlock' }: { label?: string }) {
    return (
        <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
            <Lock size={9} /> {label}
        </span>
    )
}
