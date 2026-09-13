import { useState } from "react"
import { Sparkles, Loader2, AlertTriangle, Info, AlertCircle } from "lucide-react"
import { isAxiosError } from "axios"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui"
import { useCompanyPlan } from "@/hooks/useCompanyPlan"
import { PlanLockBadge } from "@/components/billing/PlanLockBadge"
import {
  getDashboardInsightsAI,
  type AIDashboardInsight,
  type AIDashboardInsightsResponse,
} from "@/utils/api-request-functions"

const SEVERITY_STYLE: Record<AIDashboardInsight["severity"], { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "text-blue-600 bg-blue-50 border-blue-100" },
  warning: { icon: AlertTriangle, className: "text-amber-600 bg-amber-50 border-amber-100" },
  critical: { icon: AlertCircle, className: "text-rose-600 bg-rose-50 border-rose-100" },
}

function InsightRow({ insight }: { insight: AIDashboardInsight }) {
  const { icon: Icon, className } = SEVERITY_STYLE[insight.severity]
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${className}`}>
      <Icon size={14} className="shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{insight.title}</p>
        <p className="text-xs opacity-80 mt-0.5">{insight.detail}</p>
      </div>
    </div>
  )
}

// Explicit, manager-triggered — deliberately does NOT auto-fetch on mount.
// Every click is a real billed AI request, so this stays opt-in rather than
// firing every time the dashboard loads.
export function AIDashboardInsights() {
  const { hasFeature } = useCompanyPlan()
  const canUseAI = hasFeature("aiDashboardInsights")

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIDashboardInsightsResponse | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await getDashboardInsightsAI()
      setResult(response)
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.msg ?? "Couldn't generate insights — try again."
        : "Couldn't generate insights — try again."
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={16} className="text-[#1E3A5F] shrink-0" />
          <h3 className="text-sm font-semibold text-slate-900 truncate">What needs attention</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!canUseAI && <PlanLockBadge label="Upgrade to unlock" />}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleGenerate}
            disabled={!canUseAI || loading}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Thinking…" : result ? "Refresh" : "Generate"}
          </Button>
        </div>
      </div>

      {!result && !loading && (
        <p className="text-sm text-slate-400">
          Get a quick, prioritised read on today's schedule — staffing gaps, overtime approvals,
          and anything else worth a look.
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-700">{result.headline}</p>
          {result.insights.length > 0 && (
            <div className="flex flex-col gap-2">
              {result.insights.map((insight, i) => (
                <InsightRow key={i} insight={insight} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
