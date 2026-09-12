import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Card } from '@/components/ui'
import { Button } from '@/components/ui/button'

// Shown in place of a gated page/panel's real content when the company's
// plan doesn't include it — e.g. a report tab reached by direct URL rather
// than the (already-muted) nav link. The backend rejects the underlying
// request independently either way (see server's planLimits.ts); this is
// just what the reached-anyway page looks like instead of a raw API error.
export function PlanUpgradeNotice({ feature }: { feature: string }) {
    const navigate = useNavigate()
    return (
        <Card className="p-8 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Lock size={16} className="text-amber-600" />
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-800">{feature} isn't on your plan</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    Upgrade to a plan that includes {feature.toLowerCase()} to unlock this.
                </p>
            </div>
            <Button size="sm" className="mt-1" onClick={() => navigate('/settings/billing/plans')}>
                View plans
            </Button>
        </Card>
    )
}
