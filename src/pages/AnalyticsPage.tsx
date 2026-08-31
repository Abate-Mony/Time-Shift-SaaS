import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, Clock, Users, Briefcase, CheckCircle, Calendar, Download, ChevronDown } from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const RANGE_OPTIONS = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This year'] as const
type Range = typeof RANGE_OPTIONS[number]

const hoursData = {
  'Last 7 days': [
    { label: 'Mon', hours: 42, prev: 38 },
    { label: 'Tue', hours: 58, prev: 51 },
    { label: 'Wed', hours: 67, prev: 60 },
    { label: 'Thu', hours: 55, prev: 49 },
    { label: 'Fri', hours: 72, prev: 64 },
    { label: 'Sat', hours: 38, prev: 35 },
    { label: 'Sun', hours: 20, prev: 18 },
  ],
  'Last 30 days': [
    { label: 'W1', hours: 312, prev: 280 }, { label: 'W2', hours: 358, prev: 310 },
    { label: 'W3', hours: 401, prev: 370 }, { label: 'W4', hours: 388, prev: 355 },
  ],
  'Last 90 days': [
    { label: 'Jan', hours: 1240, prev: 1100 }, { label: 'Feb', hours: 1380, prev: 1200 },
    { label: 'Mar', hours: 1520, prev: 1350 },
  ],
  'This year': [
    { label: 'Jan', hours: 1240, prev: 1100 }, { label: 'Feb', hours: 1380, prev: 1200 },
    { label: 'Mar', hours: 1520, prev: 1350 }, { label: 'Apr', hours: 1410, prev: 1280 },
    { label: 'May', hours: 1650, prev: 1480 }, { label: 'Jun', hours: 1720, prev: 1550 },
    { label: 'Jul', hours: 1580, prev: 1490 }, { label: 'Aug', hours: 910, prev: 1380 },
  ],
}

const jobStatusData = [
  { name: 'Completed', value: 148, color: '#10B981' },
  { name: 'In Progress', value: 24,  color: '#1E3A5F' },
  { name: 'Scheduled',  value: 38,  color: '#94A3B8' },
  { name: 'Cancelled',  value: 11,  color: '#F87171' },
]

const workerActivityData = [
  { label: 'Mon', clockIns: 18, lateArrivals: 2, noShows: 0 },
  { label: 'Tue', clockIns: 22, lateArrivals: 1, noShows: 1 },
  { label: 'Wed', clockIns: 25, lateArrivals: 3, noShows: 0 },
  { label: 'Thu', clockIns: 20, lateArrivals: 0, noShows: 2 },
  { label: 'Fri', clockIns: 27, lateArrivals: 2, noShows: 0 },
  { label: 'Sat', clockIns: 14, lateArrivals: 1, noShows: 1 },
  { label: 'Sun', clockIns: 8,  lateArrivals: 0, noShows: 0 },
]

const topWorkers = [
  { name: 'James Carter',   hours: 47.5, jobs: 12, rating: 98 },
  { name: 'Priya Sharma',   hours: 44.0, jobs: 11, rating: 97 },
  { name: 'Tom Reeves',     hours: 41.5, jobs: 10, rating: 95 },
  { name: 'Sara Mitchell',  hours: 39.0, jobs: 9,  rating: 94 },
  { name: 'David Okafor',   hours: 37.5, jobs: 9,  rating: 91 },
]

const locationData = [
  { location: 'Canary Wharf',  jobs: 42, hours: 338, completion: 96 },
  { location: 'Shoreditch',    jobs: 35, hours: 278, completion: 94 },
  { location: 'Victoria',      jobs: 28, hours: 221, completion: 100 },
  { location: 'Brixton',       jobs: 22, hours: 174, completion: 89 },
  { location: 'Hackney',       jobs: 18, hours: 142, completion: 92 },
]

const overtimeData = [
  { label: 'W1', regular: 280, overtime: 32 },
  { label: 'W2', regular: 310, overtime: 48 },
  { label: 'W3', regular: 340, overtime: 61 },
  { label: 'W4', regular: 320, overtime: 68 },
]

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, delta, deltaLabel, accent = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  delta: number
  deltaLabel: string
  accent?: boolean
}) {
  const positive = delta >= 0
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${accent ? 'bg-[#1E3A5F] border-[#1E3A5F]' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? 'bg-white/15 text-white' : 'bg-[#1E3A5F]/8 text-[#1E3A5F]'}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          positive
            ? accent ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-50 text-emerald-600'
            : accent ? 'bg-red-400/20 text-red-300' : 'bg-red-50 text-red-500'
        }`}>
          {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {positive ? '+' : ''}{delta}%
        </div>
      </div>
      <div>
        <p className={`text-2xl font-bold tracking-tight ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</p>
        <p className={`text-sm font-medium mt-0.5 ${accent ? 'text-white/60' : 'text-slate-500'}`}>{label}</p>
      </div>
      <p className={`text-xs ${accent ? 'text-white/35' : 'text-slate-400'}`}>{deltaLabel}</p>
    </div>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-800">{typeof p.value === 'number' && p.value > 100 ? p.value.toLocaleString() : p.value}{p.name.toLowerCase().includes('hour') || p.name === 'This period' || p.name === 'Prior period' ? 'h' : ''}</span>
        </div>
      ))}
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

function RangeSelector({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
      {RANGE_OPTIONS.map(r => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            value === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function Analytics() {
  const [range, setRange] = useState<Range>('Last 7 days')
  const hours = hoursData[range]
  const totalHours = hours.reduce((s, d) => s + d.hours, 0)
  const prevHours = hours.reduce((s, d) => s + d.prev, 0)
  const hoursDelta = Math.round(((totalHours - prevHours) / prevHours) * 100)

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
          <button className="h-9 px-4 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
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
          value={`${totalHours.toLocaleString()}h`}
          delta={hoursDelta}
          deltaLabel="vs prior period"
          accent
        />
        <StatCard
          icon={<Briefcase size={16} />}
          label="Jobs completed"
          value="148"
          delta={12}
          deltaLabel="vs prior period"
        />
        <StatCard
          icon={<Users size={16} />}
          label="Active workers"
          value="34"
          delta={6}
          deltaLabel="vs prior period"
        />
        <StatCard
          icon={<CheckCircle size={16} />}
          label="Completion rate"
          value="94.3%"
          delta={2}
          deltaLabel="vs prior period"
        />
      </div>

      {/* Hours + Job status row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Hours area chart — 2/3 width */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
          <SectionHeader title="Hours worked" subtitle="Scheduled vs prior period" />
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hours} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="prev" name="Prior period" stroke="#CBD5E1" strokeWidth={1.5} fill="url(#gradPrev)" strokeDasharray="4 3" dot={false} />
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
                <Pie data={jobStatusData} cx="50%" cy="50%" innerRadius={52} outerRadius={76}
                  dataKey="value" strokeWidth={2} stroke="white">
                  {jobStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v ?? 0} jobs`, '']} contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-1">
            {jobStatusData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-xs text-slate-500">{d.name}</span>
                <span className="text-xs font-bold text-slate-800 ml-auto">{d.value}</span>
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
              <BarChart data={workerActivityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={14} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Bar dataKey="clockIns" name="On time" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lateArrivals" name="Late" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="noShows" name="No-show" fill="#F87171" radius={[4, 4, 0, 0]} />
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
              <BarChart data={overtimeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
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
          <div className="flex flex-col gap-1">
            {topWorkers.map((w, i) => {
              const maxHours = topWorkers[0].hours
              return (
                <div key={w.name} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-bold text-slate-300 w-4 text-right">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center text-[10px] font-bold text-[#1E3A5F] shrink-0">
                    {w.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{w.name}</p>
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
                    <p className="text-xs text-slate-400">{w.jobs} jobs</p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-bold ${
                    w.rating >= 97 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
                  }`}>
                    {w.rating}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Location performance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <SectionHeader title="Location performance" subtitle="Jobs, hours, and completion rate" />
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
              {locationData.map((l, i) => (
                <tr key={l.location} className={`border-t border-slate-50 ${i === 0 ? 'border-t-slate-100' : ''}`}>
                  <td className="py-3 flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full bg-[#1E3A5F]" style={{ opacity: 1 - i * 0.15 }} />
                    <span className="font-medium text-slate-800">{l.location}</span>
                  </td>
                  <td className="py-3 text-right text-slate-600">{l.jobs}</td>
                  <td className="py-3 text-right text-slate-600">{l.hours}h</td>
                  <td className="py-3 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                      l.completion === 100 ? 'bg-emerald-50 text-emerald-700'
                      : l.completion >= 93 ? 'bg-blue-50 text-[#1E3A5F]'
                      : 'bg-amber-50 text-amber-700'
                    }`}>
                      {l.completion}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights strip */}
      <div className="bg-[#0A1628] rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Peak day</p>
          <p className="text-lg font-bold text-white">Friday</p>
          <p className="text-sm text-white/45 mt-0.5">Highest avg hours per shift</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Avg shift length</p>
          <p className="text-lg font-bold text-white">6h 48m</p>
          <p className="text-sm text-white/45 mt-0.5">Up 14 min vs last period</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Overtime rate</p>
          <p className="text-lg font-bold text-white">16.4%</p>
          <p className="text-sm text-white/45 mt-0.5">of total hours this month</p>
        </div>
      </div>
    </div>
  )
}
