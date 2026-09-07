import DataTable from '@/components/JobsTable'
import { ActiveFiltersBar } from '@/components/ui/ActiveFiltersBar'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldLabel } from '@/components/ui/field'
import FilterButton from '@/components/ui/FilterButton'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFilter } from '@/hooks/CustomLinkFilterHook'
import { cn } from '@/lib/utils'
import { clientsQuery } from '@/utils/clients'
import { invoiceColumns } from '@/utils/columns'
import customFetch from '@/utils/customFetch'
import { formatDate } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import type { Invoice } from '@/utils/types'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { CalendarIcon, ChevronLeft, ChevronRight, Filter, Plus } from 'lucide-react'
import { useState } from 'react'
import { useLoaderData, useNavigate, type LoaderFunctionArgs, type Params } from 'react-router'

const invoicesQuery = (params: Params) => {
  const { search, sort, page, status, client, start, end, limit } = params

  return {
    queryKey: [
      'invoices',
      {
        search: search ?? '',
        status: status ?? 'all',
        sort: sort ?? 'issueDate_desc',
        page: page ?? 1,
        client: client ?? '',
        start: start ?? '',
        end: end ?? '',
        limit: limit ?? '',
      },
    ],
    // queryFn forwards every URL param as-is — a new filter just needs a UI
    // control setting it via useFilter, no change needed here beyond adding
    // it to the key above (for correct per-filter-combo caching).
    queryFn: async () => {
      const { data } = await customFetch.get<any>('/invoices', { params })
      return data
    },
  }
}

export const loader = (queryClient: QueryClient) => async ({ request }: LoaderFunctionArgs) => {
  const params = Object.fromEntries([
    ...new URL(request.url).searchParams.entries(),
  ])
  await queryClient.ensureQueryData(invoicesQuery(params))
  return { searchValues: { ...params } }
}

export function Invoices() {
  const { searchValues } = useLoaderData() as { searchValues: Params }
  const navigate = useNavigate()
  const { invoices, total, totalPages, page: currentPage } = useQuery(invoicesQuery(searchValues)).data as {
    invoices: Invoice[]
    total: number
    page: number
    limit: number
    totalPages: number
  }

  const [filterOpen, setFilterOpen] = useState(false)
  const { handleFilterChange, handleFiltersChange, searchQuery } = useFilter()

  const clientFilter = searchQuery.get('client') ?? ''
  const startFilter = searchQuery.get('start') ?? ''
  const endFilter = searchQuery.get('end') ?? ''
  const sortValue = searchQuery.get('sort') ?? 'issueDate_desc'
  // Matches the backend's own default (invoiceController.ts's getAllInvoices)
  // when nothing is set, so this control reflects what's actually applied.
  const limitValue = searchQuery.get('limit') ?? '20'

  const activeFilterCount = [clientFilter, startFilter, endFilter].filter(Boolean).length

  // Lazy — only fetched once the filter panel opens, or if a client filter
  // is already active on load (the ActiveFiltersBar below needs the name).
  const { data: filterClients } = useQuery({ ...clientsQuery(), enabled: filterOpen || !!clientFilter })

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'sent', label: 'Sent' },
    { id: 'paid', label: 'Paid' },
    { id: 'overdue', label: 'Overdue' },
  ]

  const outstanding = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.total, 0)

  // Omitting the key entirely for page 1 keeps the URL clean for the common
  // case and matches every other filter here, which also omits its key at
  // its default value.
  const goToPage = (p: number) => {
    handleFilterChange({ key: 'page', value: p > 1 ? String(p) : null })
  }

  const handleLimitChange = (value: string) => {
    handleFiltersChange({ limit: value === '20' ? null : value, page: null })
  }

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Invoices</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {outstanding > 0
              ? `${formatCurrency(outstanding)} outstanding across sent and overdue invoices`
              : 'Bill clients for completed jobs'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/jobs?status=completed')}>
            Bill a single job
          </Button>
          <Button onClick={() => navigate('/invoices/create')}>
            <Plus size={14} /> New Invoice
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 gap-x-0 border-b flex-wrap border-[#E2E8F0]">
        {tabs.map(tab => (
          <FilterButton
            className="hover:bg-black/5 mx-0 rounded-none"
            name="status"
            value={tab.id}
            key={tab.id}
          >
            {tab.label}
          </FilterButton>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 mt-4 mb-5 flex-wrap relative">

        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen(o => !o)}
            className={cn(
              "flex items-center gap-2 h-9 px-3 border rounded-lg text-sm bg-white hover:bg-slate-50 transition-colors",
              activeFilterCount > 0 ? "border-[#1E3A5F] text-[#1E3A5F]" : "border-[#E2E8F0] text-slate-600"
            )}
          >
            <Filter size={13} /> Filter
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#1E3A5F] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute z-20 top-full mt-2 left-0 w-72 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Client</Label>
                <Select
                  value={clientFilter || 'all'}
                  onValueChange={v => handleFilterChange({ key: 'client', value: v === 'all' ? null : v })}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Any client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any client</SelectItem>
                    {filterClients?.clients.map(c => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleFiltersChange({ client: null, start: null, end: null })
                    setFilterOpen(false)
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 self-start"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        <Select value={sortValue} onValueChange={v => handleFilterChange({ key: 'sort', value: v })}>
          <SelectTrigger className="h-9 w-auto text-sm text-slate-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="issueDate_desc">Sort: Issue date ↓</SelectItem>
            <SelectItem value="issueDate_asc">Sort: Issue date ↑</SelectItem>
            <SelectItem value="dueDate_asc">Sort: Due date ↑</SelectItem>
            <SelectItem value="dueDate_desc">Sort: Due date ↓</SelectItem>
            <SelectItem value="total_desc">Sort: Amount ↓</SelectItem>
            <SelectItem value="total_asc">Sort: Amount ↑</SelectItem>
          </SelectContent>
        </Select>

        <Select value={limitValue} onValueChange={handleLimitChange}>
          <SelectTrigger className="h-9 w-auto text-sm text-slate-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="20">20 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
          </SelectContent>
        </Select>

        <Field className="w-auto">
          <FieldLabel htmlFor="invoice-date-range" className="sr-only">Issue date range</FieldLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id="invoice-date-range"
                className="h-9 justify-start px-2.5 font-normal text-sm text-slate-600"
              >
                <CalendarIcon size={14} />
                {startFilter ? (
                  endFilter && endFilter !== startFilter ? (
                    <>
                      {formatDate(startFilter, 'D MMM')} – {formatDate(endFilter, 'D MMM')}
                    </>
                  ) : (
                    formatDate(startFilter, 'D MMM YYYY')
                  )
                ) : (
                  <span>Issue date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                className="rounded-md border w-[min(400px,calc(100vw-2rem))] sm:w-[min(800px,calc(100vw-4rem))]"
                mode="range"
                defaultMonth={startFilter ? new Date(startFilter) : undefined}
                selected={startFilter ? { from: new Date(startFilter), to: new Date(endFilter || startFilter) } : undefined}
                onSelect={(range) => handleFiltersChange({
                  // ISO (hyphens) — the wire value the backend's toUtcDay()
                  // parses (invoiceController.ts's getAllInvoices).
                  start: range?.from ? formatDate(range.from, 'YYYY-MM-DD') : null,
                  end: range?.to ? formatDate(range.to, 'YYYY-MM-DD') : null,
                })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </Field>
      </div>

      <ActiveFiltersBar
        className="mb-4"
        filters={[
          {
            keys: 'status',
            isActive: ([s]) => !!s && s !== 'all',
            format: ([s]) => (s ?? '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          },
          {
            keys: 'client',
            format: ([id]) => filterClients?.clients.find(c => c._id === id)?.name ?? id ?? '',
          },
          {
            keys: ['start', 'end'],
            label: 'Issue date',
            format: ([start, end]) =>
              start && end && end !== start
                ? `${formatDate(start, 'D MMM')} – ${formatDate(end, 'D MMM')}`
                : formatDate(start ?? end ?? undefined, 'D MMM YYYY'),
          },
        ]}
      />

      <DataTable columns={invoiceColumns} data={invoices} />

      {invoices.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-sm mt-4">
          <p className="text-sm font-semibold text-slate-700 mb-1">No invoices yet</p>
          <p className="text-xs text-slate-400">Generate one from a completed job to get started.</p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
        <p>Showing {invoices.length} of {total} invoice{total === 1 ? '' : 's'}</p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-7 px-2.5 rounded-lg border border-[#E2E8F0] text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white flex items-center gap-1"
            >
              <ChevronLeft size={12} /> Previous
            </button>
            <span className="px-2 font-medium text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-7 px-2.5 rounded-lg border border-[#E2E8F0] text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white flex items-center gap-1"
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
