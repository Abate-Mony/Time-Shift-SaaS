import { useQuery, type QueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { AlertCircle, AlertTriangle, Check, X as XIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { MetricCard, CompactMetric } from "@/components/platform/figma/primitives";
import { platformOverviewQuery } from "@/utils/platform-api";
import dayjs from "dayjs";

export const platformOverviewLoader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData(platformOverviewQuery);
  return null;
};

// Illustrative only — no telemetry pipeline or billing provider exists to
// back a real growth series or plan mix (same gap as PlatformUsage /
// PlatformSubscriptions). Rendered with the exact Figma layout, tagged
// "Preview" rather than presented as live, unlike the real cards above them.
const GROWTH_DATA = [
  { month: "Apr", companies: 1180 }, { month: "May", companies: 1201 },
  { month: "Jun", companies: 1220 }, { month: "Jul", companies: 1245 },
  { month: "Aug", companies: 1262 }, { month: "Sep", companies: 1284 },
];
const SUB_DIST = [
  { name: "Free", value: 412, color: "#94a3b8" },
  { name: "Starter", value: 318, color: "#60a5fa" },
  { name: "Professional", value: 421, color: "#1E3A5F" },
  { name: "Enterprise", value: 133, color: "#7c3aed" },
];

function PreviewTag() {
  return <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 ring-1 ring-amber-200 px-1.5 py-0.5 rounded">Preview</span>;
}

export function PlatformOverview() {
  const { data: overview } = useQuery(platformOverviewQuery);
  if (!overview) return null;

  return (
    <div className="p-6 max-w-[1200px] flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">Monitor companies, subscriptions, trials and platform activity.</p>
      </div>

      {/* Primary metrics — all real */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total Companies"
          value={String(overview.companies.total)}
          trend={overview.companies.newThisMonth > 0 ? "up" : "neutral"}
          trendLabel={`+${overview.companies.newThisMonth} this month`}
        />
        <MetricCard
          label="Active Companies"
          value={String(overview.companies.active)}
          sub={overview.companies.total > 0 ? `${((overview.companies.active / overview.companies.total) * 100).toFixed(1)}% of total` : undefined}
          trend="neutral"
        />
        <MetricCard label="Active Workers" value={String(overview.users.activeWorkers)} sub="Across all companies" />
        <MetricCard
          label="Sending Domains"
          value={String(overview.email.verifiedDomains)}
          sub={overview.email.failedDomains > 0 ? `${overview.email.failedDomains} failed` : "Verified"}
        />
      </div>

      {/* Secondary metrics — mostly preview (amber dot marks non-real entries) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-px bg-[#E2E8F0] rounded-lg overflow-hidden border border-[#E2E8F0]">
        {[
          { label: "Active Trials", value: "3" },
          { label: "Ending Soon", value: "1" },
          { label: "Past Due", value: "2" },
          { label: "Suspended", value: "1" },
          { label: "New Signups", value: String(overview.companies.newThisMonth), real: true },
          { label: "Emails Sent", value: "9,241" },
          { label: "Failed Emails", value: "18" },
          { label: "API Errors", value: "0" },
        ].map((m) => (
          <div key={m.label} className="bg-white px-4 py-3 relative">
            {!m.real && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" title="Preview — not backed by real data" />}
            <CompactMetric label={m.label} value={m.value} />
          </div>
        ))}
      </div>

      {/* Needs attention + subscription mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={13} className="text-amber-500" />
              <h3 className="text-sm font-bold text-slate-800">Needs Attention</h3>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full ring-1 ring-amber-200">
                {overview.attention.length}
              </span>
            </div>
          </div>
          {overview.attention.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-400">Nothing needs attention right now.</p>
          ) : (
            <div className="divide-y divide-[#F8FAFC]">
              {overview.attention.map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-amber-50">
                    <AlertTriangle size={12} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700">{item.message}</p>
                    <p className="text-xs text-slate-500">{item.company.name}</p>
                  </div>
                  <Link
                    to={`/platform/companies/${item.company.id}`}
                    className="h-6 px-2.5 text-[11px] font-semibold text-[#1E3A5F] bg-[#1E3A5F]/6 rounded hover:bg-[#1E3A5F]/12 transition-colors shrink-0 flex items-center"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Subscription Mix</h3>
            <PreviewTag />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={SUB_DIST} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={44} strokeWidth={2} stroke="#F7F9FC">
                  {SUB_DIST.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(val) => [`${val} companies`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
            {SUB_DIST.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-slate-500">{d.name}</span>
                <span className="text-[11px] font-bold text-slate-700 ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth chart */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">Company Growth</h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Last 6 months</span>
            <PreviewTag />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={GROWTH_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E2E8F0", borderRadius: 8 }} />
            <Line type="monotone" dataKey="companies" stroke="#1E3A5F" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Activity feed — real */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-bold text-slate-800">Recent Platform Activity</h3>
        </div>
        {overview.recentActivity.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-400">No platform activity yet.</p>
        ) : (
          <div className="divide-y divide-[#F8FAFC]">
            {overview.recentActivity.map((event) => (
              <div key={event.id} className="flex items-start gap-3 px-4 py-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${event.result === "success" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {event.result === "success" ? <Check size={10} /> : <XIcon size={10} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold">{event.actorEmail}</span> {event.action}
                    {event.company && <> — <span className="font-semibold">{event.company}</span></>}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{event.targetType} {event.targetId}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 pt-0.5">{dayjs(event.createdAt).format("D MMM, HH:mm")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
