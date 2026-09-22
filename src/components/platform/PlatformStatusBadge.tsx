import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// One consistent status-color mapping across every platform screen — the
// brief is explicit that "equivalent statuses" (active/verified/operational,
// etc.) must never drift into slightly different colors per screen.
const TONE_CLASSES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-border bg-muted text-muted-foreground",
} as const;

type Tone = keyof typeof TONE_CLASSES;

const STATUS_TONE: Record<string, Tone> = {
  // Company / user account status
  active: "success",
  suspended: "warning",
  disabled: "danger",
  // Email domain status
  verified: "success",
  pending: "warning",
  failed: "danger",
  not_connected: "neutral",
  // Audit result
  success: "success",
  denied: "warning",
  // System status
  operational: "success",
  degraded: "warning",
  down: "danger",
  unknown: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  not_connected: "Not connected",
};

export function PlatformStatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  const label = STATUS_LABEL[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge variant="outline" className={cn(TONE_CLASSES[tone], "capitalize", className)}>{label}</Badge>;
}
