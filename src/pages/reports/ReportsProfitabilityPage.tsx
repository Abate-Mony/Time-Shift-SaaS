import { useState } from 'react'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Coins, Wallet } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, StatCard } from '@/components/ui'
import { CustomTooltip } from './shared'
import { useReportsContext } from '@/layouts/ReportLayout'
import { reportsProfitabilityQuery, type RevenueBasis } from '@/utils/reports'
import { clientsQuery } from '@/utils/clients'
import { formatCurrency } from '@/utils/format'
import { Link } from 'react-router'

const BASIS_OPTIONS: { id: RevenueBasis; label: string; hint: string }[] = [
  { id: 'invoiced', label: 'Invoiced', hint: 'Work billed in the period, whether or not it has been paid yet.' },
  { id: 'collected', label: 'Collected', hint: 'Only cash actually received in the period.' },
]

export function ReportsProfitabilityPage() {
  const { dateRange } = useReportsContext()
  const monthLabel = dayjs(dateRange.start).format('MMMM YYYY')
  const [basis, setBasis] = useState<RevenueBasis>('invoiced')
  const [clientId, setClientId] = useState<string>('')

  const { data: clientsData } = useQuery(clientsQuery())
  const { data, isPending, isError } = useQuery(reportsProfitabilityQuery(dateRange, basis, clientId || undefined))

  const clients = clientsData?.clients ?? []

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {BASIS_OPTIONS.map(o => (
            <button
              key={o.id}
              title={o.hint}
              onClick={() => setBasis(o.id)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                basis === o.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <select
          value={clientId}
          onChange={e => setClientId(e.target.value)}
          className="h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-600 bg-white focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All clients</option>
          {clients.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isPending ? (
        <p className="text-sm text-slate-400">Loading profitability…</p>
      ) : isError || !data ? (
        <p className="text-sm text-red-500">Failed to load the profitability report.</p>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Revenue"
              value={formatCurrency(data.summary.revenue)}
              sub={basis === 'invoiced' ? 'Invoiced' : 'Collected'}
              icon={<Coins size={16} />}
            />
            <StatCard
              label="Worker costs"
              value={formatCurrency(data.summary.labourCost)}
              sub="Approved pay"
              icon={<Wallet size={16} />}
            />
            <StatCard
              label="Gross profit"
              value={formatCurrency(data.summary.grossProfit)}
              sub={`${data.summary.marginPercent}% margin`}
              icon={data.summary.grossProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            />
          </div>

          {/* Trend */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Revenue &amp; costs</h3>
                <p className="text-xs text-slate-400 mt-0.5">{monthLabel}</p>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-[#1E3A5F] inline-block" />Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-emerald-500 inline-block" />Profit</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={45} tickFormatter={v => `£${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#1E3A5F" strokeWidth={2} fill="url(#revenueGrad)" />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#10B981" strokeWidth={2} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* By client */}
          <Card>
            <div className="px-5 pt-5 pb-4 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-semibold text-slate-900">Profitability by client</h3>
            </div>
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-2.5 bg-slate-50/60 border-b border-[#F1F5F9]">
              {['Client', 'Revenue', 'Labour', 'Profit', 'Margin'].map(h => (
                <p key={h} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{h}</p>
              ))}
            </div>
            {data.byClient.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">No {basis} revenue in {monthLabel}.</p>
            ) : (
              data.byClient.map(row => (
                <Link to={`/clients/${row.clientId}`} key={row.clientId} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 border-b border-[#F8FAFC] items-center hover:bg-slate-50/50 transition-colors">
                  <p className="text-sm font-medium text-slate-800 truncate">{row.clientName}</p>
                  <p className="text-sm text-slate-700 font-mono">{formatCurrency(row.revenue)}</p>
                  <p className="text-sm text-slate-700 font-mono">{formatCurrency(row.labourCost)}</p>
                  <p className={`text-sm font-semibold font-mono ${row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{formatCurrency(row.profit)}</p>
                  <p className="text-sm text-slate-600 font-mono">{row.marginPercent}%</p>
                </Link >
              ))
            )}
          </Card>
        </>
      )}
    </div>
  )
}
