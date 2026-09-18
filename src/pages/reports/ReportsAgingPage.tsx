import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Clock, Wallet } from 'lucide-react'
import { Link } from 'react-router'
import { Card, StatCard } from '@/components/ui'
import { backLinkState } from '@/hooks/useBackLink'
import { formatCurrency } from '@/utils/format'
import { reportsAgingQuery, type AgingBucket } from '@/utils/reports'

const BUCKETS: { key: AgingBucket; label: string }[] = [
  { key: 'current', label: 'Current' },
  { key: '1-30', label: '1–30 days' },
  { key: '31-60', label: '31–60 days' },
  { key: '61-90', label: '61–90 days' },
  { key: '90+', label: '90+ days' },
]

export function ReportsAgingPage() {
  const { data, isPending, isError } = useQuery(reportsAgingQuery())

  return (
    <div className="flex flex-col gap-5">
      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading aging report…</p>
      ) : isError || !data ? (
        <p className="text-sm text-red-500">Failed to load the aging report.</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground -mb-1">As of {data.asOf}</p>

          {/* Stats */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(12rem,calc(100%-0.3rem)),1fr))] gap-4">
            <StatCard
              label="Outstanding"
              value={formatCurrency(data.totalOutstanding)}
              sub="Total unpaid"
              icon={<Wallet size={16} />}
            />
            {BUCKETS.map(b => (
              <StatCard
                key={b.key}
                label={b.label}
                value={formatCurrency(data.buckets[b.key])}
                sub={b.key === '90+' ? 'Seriously overdue' : b.key === 'current' ? 'Not yet due' : undefined}
                icon={b.key === '90+' ? <AlertTriangle size={16} /> : <Clock size={16} />}
              />
            ))}
          </div>

          {/* By client */}
          <Card>
            <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-foreground">Outstanding by client</h3>
            </div>
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-2.5 bg-muted/60 border-b border-[var(--border)]">
              {['Client', ...BUCKETS.map(b => b.label), 'Total'].map(h => (
                <p key={h} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</p>
              ))}
            </div>
            {data.byClient.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground text-center">Nothing outstanding — every sent invoice is paid up.</p>
            ) : (
              data.byClient.map(row => (
                <Link
                  to={row.clientId ? `/clients/${row.clientId}` : '#'}
                  state={backLinkState('Reports')}
                  key={row.clientId ?? row.clientName}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-3.5 border-b border-border items-center hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{row.clientName}</p>
                    <p className="text-xs text-muted-foreground">{row.invoiceCount} invoice{row.invoiceCount === 1 ? '' : 's'}</p>
                  </div>
                  {BUCKETS.map(b => (
                    <p
                      key={b.key}
                      className={`text-sm font-mono ${row.buckets[b.key] > 0 && (b.key === '61-90' || b.key === '90+') ? 'text-rose-600 font-semibold' : 'text-foreground'}`}
                    >
                      {row.buckets[b.key] > 0 ? formatCurrency(row.buckets[b.key]) : '—'}
                    </p>
                  ))}
                  <p className="text-sm font-semibold font-mono text-foreground">{formatCurrency(row.total)}</p>
                </Link>
              ))
            )}
          </Card>
        </>
      )}
    </div>
  )
}
