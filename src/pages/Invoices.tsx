import { Filter, Plus } from 'lucide-react'
import { useLoaderData, useNavigate, type LoaderFunctionArgs, type Params } from 'react-router'
import { Button } from '@/components/ui/button'
import FilterButton from '@/components/ui/FilterButton'
import SearchComponent from '@/components/Search'
import customFetch from '@/utils/customFetch'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import type { Invoice } from '@/utils/types'
import DataTable from '@/components/JobsTable'
import { invoiceColumns } from '@/utils/columns'
import { formatCurrency } from '@/utils/format'

const invoicesQuery = (params: Params) => {
  const { search, sort, page, status } = params

  return {
    queryKey: [
      'invoices',
      {
        search: search ?? '',
        status: status ?? 'all',
        sort: sort ?? 'asc',
        page: page ?? 1,
      },
    ],
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
  const { invoices } = useQuery(invoicesQuery(searchValues)).data as {
    invoices: Invoice[]
    total: number
    page: number
    limit: number
    totalPages: number
  }

  const tabs = [
    { id: 'all', label: 'All', count: invoices.length },
    { id: 'draft', label: 'Draft', count: invoices.filter(i => i.status === 'draft').length },
    { id: 'sent', label: 'Sent', count: invoices.filter(i => i.status === 'sent').length },
    { id: 'paid', label: 'Paid', count: invoices.filter(i => i.status === 'paid').length },
    { id: 'overdue', label: 'Overdue', count: invoices.filter(i => i.status === 'overdue').length },
  ]

  const outstanding = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.total, 0)

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
        <Button onClick={() => navigate('/jobs?status=completed')}>
          <Plus size={14} /> New Invoice
        </Button>
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
            <span className="ml-0.5 rounded-full bg-black/5 p-2 text-xs size-2.5 flex items-center justify-center">
              {tab?.count ?? 0}
            </span>
          </FilterButton>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 mt-4 mb-5">
        <SearchComponent />
        <button className="flex items-center gap-2 h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-600 bg-white hover:bg-slate-50 transition-colors">
          <Filter size={13} /> Filter
        </button>
      </div>

      <DataTable columns={invoiceColumns} data={invoices} getRowId={(row) => row._id} />

      {invoices.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-sm mt-4">
          <p className="text-sm font-semibold text-slate-700 mb-1">No invoices yet</p>
          <p className="text-xs text-slate-400">Generate one from a completed job to get started.</p>
        </div>
      )}
    </div>
  )
}
