import type { HealthLevel, PlatformTag } from "@/utils/platform-api";

const HEALTH: Record<HealthLevel, { label: string; dot: string; text: string; bg: string }> = {
  healthy: { label: "Healthy", dot: "bg-emerald-500", text: "text-emerald-800", bg: "bg-emerald-50" },
  watch: { label: "Watch", dot: "bg-amber-500", text: "text-amber-900", bg: "bg-amber-50" },
  at_risk: { label: "At risk", dot: "bg-red-500", text: "text-red-800", bg: "bg-red-50" },
};

export function HealthBadge({ level, score, title }: { level: HealthLevel; score?: number; title?: string }) {
  const h = HEALTH[level];
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-[11px] font-semibold ${h.bg} ${h.text} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full ${h.dot}`} aria-hidden />
      {h.label}
      {score !== undefined && <span className="font-normal opacity-80 tabular-nums">{score}</span>}
    </span>
  );
}

export const TAG_LABELS: Record<PlatformTag, string> = {
  vip: "VIP",
  at_risk: "At risk",
  beta: "Beta",
  partner: "Partner",
  churned: "Churned",
  needs_follow_up: "Needs follow-up",
};

const TAG_STYLE: Record<PlatformTag, string> = {
  vip: "bg-violet-50 text-violet-800 border-violet-200",
  at_risk: "bg-red-50 text-red-800 border-red-200",
  beta: "bg-blue-50 text-blue-800 border-blue-200",
  partner: "bg-teal-50 text-teal-800 border-teal-200",
  churned: "bg-slate-100 text-slate-700 border-slate-200",
  needs_follow_up: "bg-amber-50 text-amber-900 border-amber-200",
};

export function TagChip({ tag }: { tag: PlatformTag }) {
  return (
    <span className={`inline-flex items-center h-5 px-1.5 rounded border text-[10px] font-semibold ${TAG_STYLE[tag]}`}>{TAG_LABELS[tag]}</span>
  );
}

export function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#E2E8F0] rounded-lg">
      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-[#F1F5F9]">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ActionButton({
  children, onClick, danger, disabled, title,
}: { children: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
        danger ? "text-red-700 border-red-200 hover:bg-red-50" : "text-slate-700 bg-white border-[#E2E8F0] hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
