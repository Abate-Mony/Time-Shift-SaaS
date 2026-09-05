import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { TrendingUp, TrendingDown, Clock, Users, Briefcase, CheckCircle, Download } from 'lucide-react'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { getAnalytics, type AnalyticsRange, type AnalyticsResponse } from '@/utils/api-request-functions'

// ─── Data ─────────────────────────────────────────────────────────────────────

const RANGE_OPTIONS: { id: AnalyticsRange; label: string }[] = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'year', label: 'This year' },
]

const STATUS_COLORS: Record<string, string> = {
  completed: '#10B981',
  'in-progress': '#1E3A5F',
  scheduled: '#94A3B8',
  cancelled: '#F87171',
}

const analyticsQuery = (range: AnalyticsRange) => ({
  queryKey: ['analytics', range],
  queryFn: () => getAnalytics(range),
})

export const loader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData(analyticsQuery('7d'))
  return null
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, delta, deltaLabel, accent = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  delta: number | null
  deltaLabel: string
  accent?: boolean
}) {
  const positive = (delta ?? 0) >= 0
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${accent ? 'bg-[#1E3A5F] border-[#1E3A5F]' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? 'bg-white/15 text-white' : 'bg-[#1E3A5F]/8 text-[#1E3A5F]'}`}>
          {icon}
        </div>
        {delta !== null && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            positive
              ? accent ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-50 text-emerald-600'
              : accent ? 'bg-red-400/20 text-red-300' : 'bg-red-50 text-red-500'
          }`}>
            {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {positive ? '+' : ''}{delta}%
          </div>
        )}
      </div>
      <div>
        <p className={`text-2xl font-bold tracking-tight ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</p>
        <p className={`text-sm font-medium mt-0.5 ${accent ? 'text-white/60' : 'text-slate-500'}`}>{label}</p>
      </div>
      <p className={`text-xs ${accent ? 'text-white/35' : 'text-slate-400'}`}>{deltaLabel}</p>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ─── Range selector ───────────────────────────────────────────────────────────

function RangeSelector({ value, onChange }: { value: AnalyticsRange; onChange: (r: AnalyticsRange) => void }) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
      {RANGE_OPTIONS.map(r => (
        <button
          key={r.id}
          onClick={() => onChange(r.id)}
          className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            value === r.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

function formatShiftLength(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function Analytics() {
  const [range, setRange] = useState<AnalyticsRange>('7d')
  const { data, isPending } = useQuery(analyticsQuery(range))

  if (isPending || !data) {
    return (
      <div className="p-6 max-w-[1400px]">
        <div className="h-40 flex items-center justify-center text-sm text-slate-400">Loading analytics…</div>
      </div>
    )
  }

  const d: AnalyticsResponse = data

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-7 flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Performance overview for your team</p>
        </div>
        <div className="flex items-center gap-3">
          <RangeSelector value={range} onChange={setRange} />
          <button
            title="Export isn't wired up yet"
            disabled
            className="h-9 px-4 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400 flex items-center gap-2 opacity-60 cursor-not-allowed"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard
          icon={<Clock size={16} />}
          label="Total hours worked"
          value={`${d.kpis.totalHours.value.toLocaleString()}h`}
          delta={d.kpis.totalHours.deltaPercent}
          deltaLabel="vs prior period"
          accent
        />
        <StatCard
          icon={<Briefcase size={16} />}
          label="Jobs completed"
          value={d.kpis.jobsCompleted.value.toLocaleString()}
          delta={d.kpis.jobsCompleted.deltaPercent}
          deltaLabel="vs prior period"
        />
        <StatCard
          icon={<Users size={16} />}
          label="Active workers"
          value={d.kpis.activeWorkers.value.toLocaleString()}
          delta={d.kpis.activeWorkers.deltaPercent}
          deltaLabel="vs prior period"
        />
        <StatCard
          icon={<CheckCircle size={16} />}
          label="Completion rate"
          value={d.kpis.completionRate.value === null ? '—' : `${d.kpis.completionRate.value}%`}
          delta={d.kpis.completionRate.deltaPercent}
          deltaLabel="vs prior period"
        />
      </div>

      {/* Hours + Job status row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Hours area chart — 2/3 width */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
          <SectionHeader title="Hours worked" subtitle="This period vs prior period" />
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.hoursTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} formatter={(v) => [`${v}h`, '']} />
                <Area type="monotone" dataKey="priorHours" name="Prior period" stroke="#CBD5E1" strokeWidth={1.5} fill="url(#gradPrev)" strokeDasharray="4 3" dot={false} />
                <Area type="monotone" dataKey="hours" name="This period" stroke="#1E3A5F" strokeWidth={2} fill="url(#gradHours)" dot={false} activeDot={{ r: 4, fill: '#1E3A5F' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job status donut — 1/3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <SectionHeader title="Job status breakdown" />
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.jobStatusBreakdown} cx="50%" cy="50%" innerRadius={52} outerRadius={76}
                  dataKey="count" nameKey="label" strokeWidth={2} stroke="white">
                  {d.jobStatusBreakdown.map(s => <Cell key={s.status} fill={STATUS_COLORS[s.status] ?? '#94A3B8'} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v ?? 0} shifts`, '']} contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-1">
            {d.jobStatusBreakdown.map(s => (
              <div key={s.status} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[s.status] ?? '#94A3B8' }} />
                <span className="text-xs text-slate-500">{s.label}</span>
                <span className="text-xs font-bold text-slate-800 ml-auto">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Worker activity + Overtime */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Worker clock-in activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <SectionHeader title="Worker clock-in activity" subtitle="Last 7 days" />
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.workerClockInActivity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={14} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Bar dataKey="onTime" name="On time" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" name="Late" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="noShow" name="No-show" fill="#F87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-3">
            {[
              { label: 'On time', color: '#1E3A5F' },
              { label: 'Late', color: '#F59E0B' },
              { label: 'No-show', color: '#F87171' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span className="text-xs text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Regular vs overtime */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <SectionHeader title="Regular vs overtime hours" subtitle="Last 4 weeks" />
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.regularVsOvertime} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} formatter={(v) => [`${v}h`, '']} />
                <Bar dataKey="regular" name="Regular" stackId="a" fill="#DBEAFE" radius={[0, 0, 0, 0]} />
                <Bar dataKey="overtime" name="Overtime" stackId="a" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-3">
            {[
              { label: 'Regular hours', color: '#DBEAFE' },
              { label: 'Overtime', color: '#1E3A5F' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full border border-slate-300" style={{ background: l.color }} />
                <span className="text-xs text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top workers + Location performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        {/* Top workers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <SectionHeader title="Top workers by hours" subtitle="Current period" />
          {d.topWorkers.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No hours worked in this period yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {d.topWorkers.map((w, i) => {
                const maxHours = d.topWorkers[0].hours || 1
                return (
                  <div key={w.workerId} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                    <span className="text-xs font-bold text-slate-300 w-4 text-right">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center text-[10px] font-bold text-[#1E3A5F] shrink-0">
                      {w.fullname.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{w.fullname}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1E3A5F] rounded-full transition-all"
                            style={{ width: `${(w.hours / maxHours) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900">{w.hours}h</p>
                      <p className="text-xs text-slate-400">{w.jobs} shifts</p>
                    </div>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold ${
                      w.completionRate >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {w.completionRate}%
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Location performance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <SectionHeader title="Location performance" subtitle="Jobs, hours, and completion rate" />
          {d.locationPerformance.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No jobs in this period yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 font-semibold">
                  <th className="text-left pb-3">Location</th>
                  <th className="text-right pb-3">Jobs</th>
                  <th className="text-right pb-3">Hours</th>
                  <th className="text-right pb-3">Complete</th>
                </tr>
              </thead>
              <tbody>
                {d.locationPerformance.map((l, i) => (
                  <tr key={l.location} className={`border-t border-slate-50 ${i === 0 ? 'border-t-slate-100' : ''}`}>
                    <td className="py-3 flex items-center gap-2">
                      <div className="w-1.5 h-4 rounded-full bg-[#1E3A5F]" style={{ opacity: Math.max(0.25, 1 - i * 0.15) }} />
                      <span className="font-medium text-slate-800 truncate">{l.location}</span>
                    </td>
                    <td className="py-3 text-right text-slate-600">{l.jobs}</td>
                    <td className="py-3 text-right text-slate-600">{l.hours}h</td>
                    <td className="py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        l.completionRate === 100 ? 'bg-emerald-50 text-emerald-700'
                        : l.completionRate >= 80 ? 'bg-blue-50 text-[#1E3A5F]'
                        : 'bg-amber-50 text-amber-700'
                      }`}>
                        {l.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Insights strip */}
      <div className="bg-[#0A1628] rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Peak day</p>
          <p className="text-lg font-bold text-white">{d.insights.peakDay ?? '—'}</p>
          <p className="text-sm text-white/45 mt-0.5">Highest total hours this period</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Avg shift length</p>
          <p className="text-lg font-bold text-white">{formatShiftLength(d.insights.avgShiftMinutes)}</p>
          <p className="text-sm text-white/45 mt-0.5">Across completed shifts</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Overtime rate</p>
          <p className="text-lg font-bold text-white">{d.insights.overtimeRatePercent}%</p>
          <p className="text-sm text-white/45 mt-0.5">of total hours this period</p>
        </div>
      </div>
    </div>
  )
}
