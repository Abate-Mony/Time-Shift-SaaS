import { useState } from 'react'
import { Download, TrendingUp, Users, Clock, Briefcase, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Card, StatCard, Button, TabBar, Avatar } from '../components/ui'
import { workers, monthlyStats, weeklyHours } from '../data/mockData'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'timesheets', label: 'Timesheets' },
  { id: 'performance', label: 'Performance' },
]

const workerPerformance = workers.map(w => ({
  name: w.name.split(' ')[0],
  hours: w.hoursThisMonth,
  jobs: w.jobsCompleted,
  rating: w.rating,
}))

const pieData = [
  { name: 'Completed', value: 156, color: '#10B981' },
  { name: 'In Progress', value: 12, color: '#3B82F6' },
  { name: 'Cancelled', value: 8, color: '#EF4444' },
  { name: 'Pending', value: 5, color: '#F59E0B' },
]

const payrollData = workers.map((w, i) => ({
  ...w,
  rate: [18, 16, 22, 15, 14, 20][i],
  overtime: [8, 4, 12, 6, 0, 5][i],
  total: Math.round((w.hoursThisMonth * [18, 16, 22, 15, 14, 20][i]) + ([8, 4, 12, 6, 0, 5][i] * [18, 16, 22, 15, 14, 20][i] * 1.5)),
}))

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export function Reports() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Workforce analytics and payroll data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download size={13} /> Export CSV
          </Button>
          <Button variant="outline" size="sm">
            <FileText size={13} /> Export PDF
          </Button>
          <select className="h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-600 bg-white focus:outline-none appearance-none cursor-pointer">
            <option>July 2025</option>
            <option>June 2025</option>
            <option>May 2025</option>
          </select>
        </div>
      </div>

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-5">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Total Hours" value="980" sub="July 2025" icon={<Clock size={16} />} trend="+18% vs June" trendUp />
              <StatCard label="Jobs Completed" value="49" sub="this month" icon={<Briefcase size={16} />} trend="+12%" trendUp />
              <StatCard label="Active Workers" value="6" sub="all engaged" icon={<Users size={16} />} />
              <StatCard label="Avg Hours/Worker" value="163" sub="per worker/month" icon={<TrendingUp size={16} />} />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2">
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Monthly Hours Trend</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
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
                <BarChart data={weeklyHours} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" fill="#1E3A5F" radius={[4, 4, 0, 0]} name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Download size={14} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Payroll ready for July 2025</p>
                <p className="text-xs text-blue-700">6 workers · Total payout: £{payrollData.reduce((s, w) => s + w.total, 0).toLocaleString()}</p>
              </div>
              <Button size="sm" className="ml-auto">Download Payroll</Button>
            </div>

            <Card>
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-[#E2E8F0] bg-slate-50/60">
                {['Worker', 'Role', 'Hours', 'Rate /hr', 'Overtime', 'Total Pay'].map((h, i) => (
                  <p key={i} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</p>
                ))}
              </div>
              {payrollData.map((w, i) => (
                <div key={w.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 border-b border-[#F1F5F9] items-center hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar initials={w.avatar} size="sm" index={i} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{w.name}</p>
                      <p className="text-xs text-slate-400">{w.email}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{w.role}</p>
                  <p className="text-sm text-slate-700 font-mono">{w.hoursThisMonth}h</p>
                  <p className="text-sm text-slate-700 font-mono">£{w.rate}/hr</p>
                  <p className="text-sm text-slate-700 font-mono">{w.overtime}h</p>
                  <p className="text-sm font-semibold text-slate-900">£{w.total.toLocaleString()}</p>
                </div>
              ))}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-4 bg-slate-50/60">
                <p className="text-sm font-semibold text-slate-700 col-span-5">Total Payroll</p>
                <p className="text-base font-bold text-slate-900">£{payrollData.reduce((s, w) => s + w.total, 0).toLocaleString()}</p>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'timesheets' && (
          <div>
            <Card>
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-[#E2E8F0] bg-slate-50/60">
                {['Worker', 'Job', 'Date', 'Start', 'Finish', 'Hours'].map((h, i) => (
                  <p key={i} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</p>
                ))}
              </div>
              {[
                { worker: 'James Mitchell', avatar: 'JM', job: 'Canary Wharf Security', date: '25 Jul', start: '22:00', finish: '06:00', hours: 8 },
                { worker: 'Sarah Chen', avatar: 'SC', job: 'Excel Centre Event', date: '24 Jul', start: '08:00', finish: '20:00', hours: 12 },
                { worker: 'Marcus Brown', avatar: 'MB', job: 'Excel Centre Event', date: '24 Jul', start: '08:00', finish: '20:00', hours: 12 },
                { worker: 'Priya Patel', avatar: 'PP', job: 'Canary Wharf — Day', date: '24 Jul', start: '06:00', finish: '14:00', hours: 8 },
                { worker: 'Tom O\'Brien', avatar: 'TO', job: 'Westfield Stratford', date: '27 Jul', start: '10:00', finish: '22:00', hours: 12 },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 border-b border-[#F1F5F9] items-center hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={row.avatar} size="sm" index={i} />
                    <p className="text-sm font-medium text-slate-800">{row.worker}</p>
                  </div>
                  <p className="text-xs text-slate-600 truncate">{row.job}</p>
                  <p className="text-xs text-slate-600">{row.date}</p>
                  <p className="text-xs text-slate-600 font-mono">{row.start}</p>
                  <p className="text-xs text-slate-600 font-mono">{row.finish}</p>
                  <p className="text-xs font-semibold text-slate-900 font-mono">{row.hours}h</p>
                </div>
              ))}
            </Card>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="grid grid-cols-2 gap-5">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Hours per Worker</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={workerPerformance} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" fill="#1E3A5F" radius={[0, 4, 4, 0]} name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Worker Ratings</h3>
              <div className="flex flex-col gap-3">
                {workers.map((w, i) => (
                  <div key={w.id} className="flex items-center gap-3">
                    <Avatar initials={w.avatar} size="sm" index={i} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-slate-700">{w.name}</p>
                        <p className="text-xs font-semibold text-amber-600">{w.rating} ★</p>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(w.rating / 5) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
