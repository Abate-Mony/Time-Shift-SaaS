import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, Clock, Briefcase } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Card, StatCard } from '@/components/ui'
import { CustomTooltip } from './shared'
import { useReportsContext } from '@/layouts/ReportLayout'
import { reportsOverviewQuery } from '@/utils/reports'

const STATUS_COLORS: Record<string, string> = {
  completed: '#10B981',
  published: '#3B82F6',
  cancelled: '#EF4444',
}

export function ReportsOverviewPage() {
  const { dateRange } = useReportsContext()
  const monthLabel = dayjs(dateRange.start).format('MMMM YYYY')
  const { data, isPending, isError } = useQuery(reportsOverviewQuery(dateRange))

  if (isPending) return <p className="text-sm text-slate-400">Loading overview…</p>
  if (isError) return <p className="text-sm text-red-500">Failed to load the overview report.</p>

  const pieData = data.jobStatusBreakdown.map(s => ({
    name: s.label,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? '#94A3B8',
  }))

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Hours" value={data.stats.totalHours} sub={monthLabel} icon={<Clock size={16} />} />
        <StatCard label="Jobs Completed" value={data.stats.jobsCompleted} sub="this month" icon={<Briefcase size={16} />} />
        <StatCard label="Active Workers" value={data.stats.activeWorkers} sub="clocked in this month" icon={<Users size={16} />} />
        <StatCard label="Avg Hours/Worker" value={data.stats.avgHoursPerWorker} sub="per active worker" icon={<TrendingUp size={16} />} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Monthly Hours Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="hours" stroke="#1E3A5F" strokeWidth={2.5} dot={{ fill: '#1E3A5F', r: 4 }} name="Hours" />
                <Line type="monotone" dataKey="jobs" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 3" dot={{ fill: '#3B82F6', r: 3 }} name="Jobs" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Job Status Split</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-slate-600">{d.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weekly breakdown */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Daily Hours This Week</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data.dailyHours} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="hours" fill="#1E3A5F" radius={[4, 4, 0, 0]} name="Hours" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
