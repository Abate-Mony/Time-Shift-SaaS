import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card } from '@/components/ui'
import { CustomTooltip } from './shared'
import { useReportsContext } from '@/layouts/ReportLayout'
import { reportsPerformanceQuery } from '@/utils/reports'

export function ReportsPerformancePage() {
  const { dateRange } = useReportsContext()
  const { data, isPending, isError } = useQuery(reportsPerformanceQuery(dateRange))

  if (isPending) return <p className="text-sm text-slate-400">Loading performance…</p>
  if (isError) return <p className="text-sm text-red-500">Failed to load the performance report.</p>

  const chartData = data.workers.map(w => ({ name: w.fullname.split(' ')[0], hours: w.hours }))

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Hours per Worker</h3>
      {data.workers.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No activity in this period.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 36)}>
          <BarChart data={chartData} layout="vertical" barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="hours" fill="#1E3A5F" radius={[0, 4, 4, 0]} name="Hours" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
