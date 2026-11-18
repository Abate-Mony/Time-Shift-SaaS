import { useQuery, type QueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import { platformUsageSummaryQuery, platformMetricsTrendQuery } from "@/utils/platform-api";

export const platformUsageLoader = (queryClient: QueryClient) => async () => {
  await Promise.all([
    queryClient.ensureQueryData(platformUsageSummaryQuery),
    queryClient.ensureQueryData(platformMetricsTrendQuery(30)),
  ]);
  return null;
};

export function PlatformUsage() {
  const { data: usage } = useQuery(platformUsageSummaryQuery);
  const { data: trend } = useQuery(platformMetricsTrendQuery(30));

  const metrics = usage
    ? [
        { label: "Active companies", value: usage.companiesActive.toLocaleString() },
        { label: "Active workers", value: usage.workersActive.toLocaleString() },
        { label: "Jobs created (30d)", value: usage.jobsCreated30d.toLocaleString() },
        { label: "Clock events (30d)", value: usage.clockEvents30d.toLocaleString() },
        { label: "Email failures (30d)", value: usage.emailFailures30d.toLocaleString(), danger: usage.emailFailures30d > 0 },
      ]
    : [];

  const jobsData = (trend ?? []).map((point) => ({ date: dayjs(point.date).format("D MMM"), jobs: point.jobsCreated }));

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Platform Usage</h1>
        <p className="text-sm text-slate-500 mt-0.5">Aggregate product usage across all OnClockly companies.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className={`bg-white border rounded-lg p-4 ${m.danger ? "border-red-200 bg-red-50/40" : "border-[#E2E8F0]"}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${m.danger ? "text-red-700" : "text-slate-900"}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-1">Jobs created — last 30 days</h3>
        <p className="text-xs text-slate-400 mb-4">Fed by a daily snapshot; a fresh deploy shows only the days since it started recording.</p>
        {jobsData.length < 2 ? (
          <p className="text-xs text-slate-400 py-10 text-center">Not enough snapshot history yet to chart a trend.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={jobsData} margin={{ left: -20, right: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E2E8F0", borderRadius: 8 }} />
              <Line type="monotone" dataKey="jobs" stroke="#1E3A5F" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
