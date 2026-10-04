import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PlatformPreviewBanner } from "@/components/platform/PlatformPreviewBanner";

// No usage-telemetry pipeline exists yet (no event aggregation across
// companies) — ported directly from the Figma source's UsageScreen. Real
// per-company usage (jobs/quotes/invoices this month) lives on each
// Company Detail page's Usage tab.
const DAILY_ACTIVE = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  active: 980 + Math.round(Math.sin(i / 3) * 40 + (i / 30) * 100),
}));

const METRICS = [
  { label: "Active companies", value: "1,102" },
  { label: "Active workers", value: "18,492" },
  { label: "Jobs created (30d)", value: "14,821" },
  { label: "Clock events (30d)", value: "62,340" },
  { label: "Emails sent (30d)", value: "9,241" },
] as const;

export function PlatformUsage() {
  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Platform Usage</h1>
        <p className="text-sm text-slate-500 mt-0.5">Aggregate product usage across all OnClockly companies.</p>
      </div>

      <PlatformPreviewBanner reason="There's no cross-company usage telemetry yet, so the figures below are illustrative, not live." />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {METRICS.map((m) => (
          <div key={m.label} className="bg-white border border-[#E2E8F0] rounded-lg p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Daily active companies — last 30 days</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={DAILY_ACTIVE} margin={{ left: -20, right: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E2E8F0", borderRadius: 8 }} />
            <Line type="monotone" dataKey="active" stroke="#1E3A5F" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
