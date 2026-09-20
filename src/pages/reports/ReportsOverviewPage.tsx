import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, Clock, Briefcase } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Card, StatCard } from '@/components/ui'
import { CustomTooltip } from './shared'
import { useReportsContext } from '@/layouts/ReportLayout'
import { reportsOverviewQuery } from '@/utils/reports'
import { BarsSkeleton, DonutSkeleton, StatCardRowSkeleton } from '@/components/ui/skeleton-parts'
import { Skeleton } from '@/components/ui/skeleton'
import * as React from "react"
// import Image from "next/image"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Scrollbar } from '@radix-ui/react-scroll-area'

export interface Artwork {
  artist: string
  art: string
}

export const works: Artwork[] = [
  {
    artist: "Ornella Binni",
    art: "https://images.unsplash.com/photo-1465869185982-5a1a7522cbcb?auto=format&fit=crop&w=300&q=80",
  },
  {
    artist: "Tom Byrom",
    art: "https://images.unsplash.com/photo-1548516173-3cabfa4607e9?auto=format&fit=crop&w=300&q=80",
  },
  {
    artist: "Vladimir Malyavko",
    art: "https://images.unsplash.com/photo-1494337480532-3725c85fd2ab?auto=format&fit=crop&w=300&q=80",
  },
]



const STATUS_COLORS: Record<string, string> = {
  completed: '#10B981',
  published: '#3B82F6',
  cancelled: '#EF4444',
}

export function ReportsOverviewPage() {
  const { dateRange } = useReportsContext()
  const monthLabel = dayjs(dateRange.start).format('MMMM YYYY')
  const { data, isPending, isError } = useQuery(reportsOverviewQuery(dateRange))

  if (isPending) return (
    <div className="flex flex-col gap-5">
      <StatCardRowSkeleton />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(20rem,calc(100%-0.3rem)),1fr))] gap-5">
        <div className="col-span-2">
          <Card className="p-5">
            <Skeleton className="h-4 w-40 mb-4" />
            <BarsSkeleton count={10} className="h-[200px]" />
          </Card>
        </div>
        <Card className="p-5 flex flex-col items-center">
          <Skeleton className="h-4 w-32 mb-4 self-start" />
          <DonutSkeleton size={140} />
          <div className="flex flex-col gap-2 mt-4 w-full">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-6" />
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="p-5">
        <Skeleton className="h-4 w-44 mb-4" />
        <BarsSkeleton count={7} className="h-[160px]" />
      </Card>
    </div>
  )
  if (isError) return <p className="text-sm text-red-500">Failed to load the overview report.</p>

  const pieData = data.jobStatusBreakdown.map(s => ({
    name: s.label,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? 'var(--muted-foreground)',
  }))

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
    <ScrollArea>
  <div className='flex space-x-4 pb-4 lg:hidden'> {/* Added bottom padding so the scrollbar doesn't overlap text */}
    <StatCard className='w-[250px] max-w-[calc(100%-1rem)] shrink-0' label="Total Hours" value={data.stats.totalHours} sub={monthLabel} icon={<Clock size={16} />} />
    <StatCard className='w-[250px] max-w-[calc(100%-1rem)] shrink-0' label="Jobs Completed" value={data.stats.jobsCompleted} sub="this month" icon={<Briefcase size={16} />} />
    <StatCard className='w-[250px] max-w-[calc(100%-1rem)] shrink-0' label="Active Workers" value={data.stats.activeWorkers} sub="clocked in this month" icon={<Users size={16} />} />
    <StatCard className='w-[250px] max-w-[calc(100%-1rem)] shrink-0' label="Avg Hours/Worker" value={data.stats.avgHoursPerWorker} sub="per active worker" icon={<TrendingUp size={16} />} />
  </div>
  <Scrollbar orientation='horizontal' className='bg-black'/>
</ScrollArea>
      <div className="lg:grid grid-cols-4 gap-4 hidden">
        <StatCard label="Total Hours" value={data.stats.totalHours} sub={monthLabel} icon={<Clock size={16} />} />
        <StatCard label="Jobs Completed" value={data.stats.jobsCompleted} sub="this month" icon={<Briefcase size={16} />} />
        <StatCard label="Active Workers" value={data.stats.activeWorkers} sub="clocked in this month" icon={<Users size={16} />} />
        <StatCard label="Avg Hours/Worker" value={data.stats.avgHoursPerWorker} sub="per active worker" icon={<TrendingUp size={16} />} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(20rem,calc(100%-0.3rem)),1fr))] gap-5">
        <div className="col-span-2">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Hours Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="hours" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill: 'var(--primary)', r: 4 }} name="Hours" />
                <Line type="monotone" dataKey="jobs" stroke="#3B82F6" strokeWidth={2} strokeDasharray="5 3" dot={{ fill: '#3B82F6', r: 3 }} name="Jobs" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Job Status Split</h3>
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
                  <span className="text-xs text-muted-foreground">{d.name}</span>
                </div>
                <span className="text-xs font-semibold text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weekly breakdown */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Daily Hours This Week</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data.dailyHours} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="hours" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Hours" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
