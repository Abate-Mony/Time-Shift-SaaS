// Direct ports of the shared building blocks from the Figma Make source
// (PlatformDashboard.tsx) — same markup, same literal Tailwind values
// (text-[11px], ring-1, #0F172A, etc.), not re-expressed through this
// app's shadcn Card/Table/Badge components. Those components have their
// own padding/radius/shadow defaults that don't match the Figma file
// pixel-for-pixel, which is exactly the mismatch this file exists to stop.
// Real data comes from this app's own API — only the rendering is copied.
import { useState, useRef, useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, AlertTriangle, X, CheckCircle2, Clock, XCircle, Minus, TrendingUp, TrendingDown } from "lucide-react";

// ─── Status badges ─────────────────────────────────────────────────────────

export const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  suspended: { label: "Suspended", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  disabled: { label: "Disabled", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
  pending: { label: "Pending", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  invited: { label: "Invited", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  verified: { label: "Verified", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  failed: { label: "Failed", cls: "bg-red-50 text-red-700 ring-red-200" },
  not_connected: { label: "Not connected", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
  success: { label: "Success", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  denied: { label: "Denied", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  operational: { label: "Operational", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  degraded: { label: "Degraded", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  down: { label: "Down", cls: "bg-red-50 text-red-700 ring-red-200" },
  unknown: { label: "Unknown", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
  ending_soon: { label: "Ending soon", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  expired: { label: "Expired", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
  used: { label: "Used", cls: "bg-slate-50 text-slate-400 ring-slate-100" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, cls: "bg-slate-100 text-slate-500 ring-slate-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ring-1 ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

const DOMAIN_CFG: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  verified: { label: "Verified", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: CheckCircle2 },
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 ring-amber-200", icon: Clock },
  failed: { label: "Failed", cls: "bg-red-50 text-red-700 ring-red-200", icon: XCircle },
  not_connected: { label: "Not connected", cls: "bg-slate-100 text-slate-500 ring-slate-200", icon: Minus },
};

export function DomainBadge({ status }: { status: string }) {
  const cfg = DOMAIN_CFG[status] ?? DOMAIN_CFG.not_connected;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ring-1 ${cfg.cls}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// ─── Company / user avatar ──────────────────────────────────────────────────

const AVATAR_COLORS: Record<string, string> = {
  A: "bg-blue-100 text-blue-700", B: "bg-violet-100 text-violet-700",
  C: "bg-amber-100 text-amber-700", D: "bg-rose-100 text-rose-700",
  E: "bg-rose-100 text-rose-700", F: "bg-cyan-100 text-cyan-700",
  G: "bg-emerald-100 text-emerald-700", H: "bg-indigo-100 text-indigo-700",
  I: "bg-blue-100 text-blue-700", J: "bg-amber-100 text-amber-700",
  K: "bg-violet-100 text-violet-700", L: "bg-cyan-100 text-cyan-700",
  M: "bg-indigo-100 text-indigo-700", N: "bg-teal-100 text-teal-700",
  O: "bg-orange-100 text-orange-700", P: "bg-orange-100 text-orange-700",
  Q: "bg-blue-100 text-blue-700", R: "bg-rose-100 text-rose-700",
  S: "bg-emerald-100 text-emerald-700", T: "bg-teal-100 text-teal-700",
  U: "bg-violet-100 text-violet-700", V: "bg-cyan-100 text-cyan-700",
  W: "bg-indigo-100 text-indigo-700", X: "bg-amber-100 text-amber-700",
  Y: "bg-rose-100 text-rose-700", Z: "bg-emerald-100 text-emerald-700",
};

export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
  const color = AVATAR_COLORS[initials[0]] ?? "bg-slate-100 text-slate-600";
  const sz = size === "lg" ? "w-10 h-10 text-sm" : size === "md" ? "w-8 h-8 text-xs" : "w-7 h-7 text-[11px]";
  return <div className={`${sz} ${color} rounded-lg flex items-center justify-center font-bold shrink-0`}>{initials}</div>;
}

// ─── Metric card ─────────────────────────────────────────────────────────

export function MetricCard({
  label, value, sub, trend, trendLabel, danger,
}: {
  label: string; value: string; sub?: string;
  trend?: "up" | "down" | "neutral"; trendLabel?: string; danger?: boolean;
}) {
  return (
    <div className={`bg-white border rounded-lg p-4 flex flex-col gap-1 ${danger ? "border-red-200 bg-red-50/40" : "border-[#E2E8F0]"}`}>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold tabular-nums leading-tight ${danger ? "text-red-700" : "text-slate-900"}`}>{value}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        {trend && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-slate-400"}`}>
            {trend === "up" ? <TrendingUp size={11} /> : trend === "down" ? <TrendingDown size={11} /> : <Minus size={11} />}
            {trendLabel}
          </span>
        )}
        {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
      </div>
    </div>
  );
}

export function CompactMetric({ label, value, color = "text-slate-900" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-base font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

// ─── Table primitives ───────────────────────────────────────────────────

export function TH({ children }: { children?: ReactNode }) {
  return <th className="text-left px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{children}</th>;
}

export function TD({ children, className = "", onClick }: { children?: ReactNode; className?: string; onClick?: (e: React.MouseEvent) => void }) {
  return <td onClick={onClick} className={`px-4 py-3.5 text-sm text-slate-700 ${className}`}>{children}</td>;
}

export function PlatformTable({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]"><tr>{children}</tr></thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[#F8FAFC]">{children}</tbody>;
}

export function Row({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <tr onClick={onClick} className={`hover:bg-slate-50/60 transition-colors ${onClick ? "cursor-pointer" : ""} ${className}`}>
      {children}
    </tr>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center text-sm text-slate-400">{children}</td>
    </tr>
  );
}

// ─── Row actions menu ────────────────────────────────────────────────────

export function RowMenu({ items }: { items: Array<{ label: string; icon: typeof X; danger?: boolean; onClick: () => void }> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors"
      >
        <MoreHorizontal size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.09 }}
            className="absolute right-0 top-8 z-30 w-48 bg-white border border-[#E2E8F0] rounded-lg shadow-xl py-1"
          >
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={() => { item.onClick(); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${item.danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  <Icon size={12} className={item.danger ? "text-red-500" : "text-slate-400"} />
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Confirmation modal ──────────────────────────────────────────────────

export function ConfirmModal({
  title, body, consequence, confirmLabel, danger, busy, showReason = true, onConfirm, onClose, children,
}: {
  title: string; body: string; consequence?: string; confirmLabel: string;
  danger?: boolean; busy?: boolean; showReason?: boolean;
  onConfirm: (reason: string) => void; onClose: () => void; children?: ReactNode;
}) {
  const [reason, setReason] = useState("");
  const canConfirm = !showReason || reason.trim().length > 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl w-full max-w-md"
      >
        <div className="p-5 border-b border-[#F1F5F9]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {danger && (
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={15} className="text-red-600" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{body}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400 shrink-0">
              <X size={13} />
            </button>
          </div>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {consequence && (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">{consequence}</p>
          )}
          {children}
          {showReason && (
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]/50 resize-none"
              />
            </div>
          )}
          <p className="text-[11px] text-slate-400">This action will be recorded in the platform audit log.</p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={busy || !canConfirm}
              className={`h-9 px-4 text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${danger ? "bg-red-600 text-white hover:bg-red-700" : "bg-[#0F172A] text-white hover:bg-slate-800"}`}
            >
              {busy ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Search input ────────────────────────────────────────────────────────

export function SearchInput({ value, onChange, placeholder, className = "" }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 pl-8 pr-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/12 focus:border-[#1E3A5F]/40"
      />
    </div>
  );
}

// ─── Pill filter group ───────────────────────────────────────────────────

export function PillFilter<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors capitalize ${value === opt ? "bg-[#0F172A] text-white" : "bg-white border border-[#E2E8F0] text-slate-500 hover:bg-slate-50"}`}
        >
          {opt === "all" ? "All" : opt}
        </button>
      ))}
    </>
  );
}
