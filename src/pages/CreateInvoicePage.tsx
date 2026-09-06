import { Button } from '@/components/ui/button'
import { Input } from '../components/ui'
import { queryClient } from '@/lib/queryClient'
import { clientsQuery } from '@/utils/clients'
import { createInvoiceDraft, getEligibleWork } from '@/utils/api-request-functions'
import { formatCurrency } from '@/utils/format'
import type { EligibleWorkItem, EligibleWorkResponse } from '@/utils/types'
import { useMutation, useQuery, type QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { ChevronLeft, FileQuestion, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router'

export const loader = (queryClient: QueryClient) => async () => {
    await queryClient.ensureQueryData(clientsQuery())
    return null
}

// A period a manager will actually want most of the time — last full
// calendar month. They can always change it before fetching eligible work.
const defaultPeriod = () => ({
    start: dayjs().startOf('month').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD'),
})

const itemKey = (item: EligibleWorkItem) => item.assignmentId ?? item.jobId

export function CreateInvoicePage() {
    const navigate = useNavigate()
    const { clients } = useQuery(clientsQuery()).data ?? { clients: [] }

    const [clientId, setClientId] = useState('')
    const [period, setPeriod] = useState(defaultPeriod())
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [notes, setNotes] = useState('')
    const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('')

    const {
        data,
        isFetching,
        isError,
    } = useQuery<EligibleWorkResponse>({
        queryKey: ['eligible-work', clientId, period.start, period.end],
        queryFn: () => getEligibleWork({ client: clientId, start: period.start, end: period.end }),
        enabled: !!clientId,
    })

    const items = data?.items ?? []

    // A client switch or period change invalidates whatever was ticked —
    // the ids belonged to the previous query's items.
    const setClient = (id: string) => {
        setClientId(id)
        setSelected(new Set())
    }
    const setPeriodField = (field: 'start' | 'end', value: string) => {
        setPeriod(p => ({ ...p, [field]: value }))
        setSelected(new Set())
    }

    const toggle = (item: EligibleWorkItem) => {
        const key = itemKey(item)
        setSelected(s => {
            const next = new Set(s)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }
    const allSelected = items.length > 0 && selected.size === items.length
    const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map(itemKey)))

    const selectedItems = useMemo(() => items.filter(i => selected.has(itemKey(i))), [items, selected])
    const selectedSubtotal = useMemo(
        () => Math.round(selectedItems.reduce((sum, i) => sum + i.amount, 0) * 100) / 100,
        [selectedItems]
    )

    const createDraft = useMutation({
        mutationFn: async () => {
            const jobIds = selectedItems.filter(i => !i.assignmentId).map(i => i.jobId)
            const assignmentIds = selectedItems.filter(i => i.assignmentId).map(i => i.assignmentId as string)
            return createInvoiceDraft({
                client: clientId,
                servicePeriod: period,
                jobIds,
                assignmentIds,
                notes: notes.trim() || undefined,
                purchaseOrderNumber: purchaseOrderNumber.trim() || undefined,
            })
        },
        onSuccess: async invoice => {
            toast.success(`Draft ${invoice.invoiceNumber} created`)
            await queryClient.invalidateQueries({ queryKey: ['invoices'] })
            navigate(`/invoices/${invoice._id}`)
        },
        onError: err => {
            const message = isAxiosError(err)
                ? err.response?.data?.msg ?? err.response?.data?.message ?? 'Something went wrong.'
                : 'Something went wrong.'
            toast.error(message)
        },
    })

    return (
        <div className="px-2 pt-2.5 lg:p-6 max-w-4xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-7">
                <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Create Invoice</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Pick a client and period — everything ready to bill shows up below</p>
                </div>
            </div>

            <div className="flex flex-col gap-5">
                {/* Client + period */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                    <h2 className="text-sm font-semibold text-slate-800 mb-4">Client & Period</h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Client</label>
                            <select
                                value={clientId}
                                onChange={e => setClient(e.target.value)}
                                className="w-full h-10 px-3 border border-[#E2E8F0] rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
                            >
                                <option value="">Select a client…</option>
                                {clients.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Service period start"
                            type="date"
                            value={period.start}
                            onChange={e => setPeriodField('start', e.target.value)}
                        />
                        <Input
                            label="Service period end"
                            type="date"
                            value={period.end}
                            onChange={e => setPeriodField('end', e.target.value)}
                        />
                    </div>
                </div>

                {/* Eligible work */}
                {clientId && (
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-800">Ready to invoice</h2>
                            {items.length > 0 && (
                                <button
                                    type="button"
                                    onClick={toggleAll}
                                    className="text-xs font-semibold text-[#1E3A5F] hover:underline"
                                >
                                    {allSelected ? 'Deselect all' : 'Select all'}
                                </button>
                            )}
                        </div>

                        {isFetching ? (
                            <div className="py-10 flex items-center justify-center text-slate-400">
                                <Loader2 size={18} className="animate-spin" />
                            </div>
                        ) : isError ? (
                            <p className="text-sm text-red-500 py-6 text-center">Couldn't load eligible work — try again.</p>
                        ) : items.length === 0 ? (
                            <div className="py-10 text-center flex flex-col items-center gap-2">
                                <FileQuestion size={22} className="text-slate-300" />
                                <p className="text-sm font-medium text-slate-600">No work is ready to invoice for this period.</p>
                                <p className="text-xs text-slate-400 max-w-sm">
                                    Jobs must be completed (and, for hourly work, have approved time) before they show up here.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col divide-y divide-[#F1F5F9]">
                                {items.map(item => {
                                    const key = itemKey(item)
                                    const checked = selected.has(key)
                                    return (
                                        <label key={key} className="flex items-center gap-3 py-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggle(item)}
                                                className="w-4 h-4 rounded border-slate-300 accent-[#1E3A5F] cursor-pointer shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-800 truncate">
                                                    {item.title}{item.workerName ? ` — ${item.workerName}` : ''}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {dayjs(item.date).format('D MMM')} · {item.startTime}–{item.endTime}
                                                    {item.chargeType === 'hourly'
                                                        ? ` · ${item.quantity}h × ${formatCurrency(item.rate)}/hr`
                                                        : ' · fixed'}
                                                </p>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-900 tabular-nums shrink-0">
                                                {formatCurrency(item.amount)}
                                            </p>
                                        </label>
                                    )
                                })}
                            </div>
                        )}

                        {items.length > 0 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F1F5F9]">
                                <p className="text-xs text-slate-400">
                                    {selectedItems.length} of {items.length} selected
                                </p>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Subtotal</p>
                                    <p className="text-xl font-bold text-slate-900 mt-0.5">{formatCurrency(selectedSubtotal)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Notes / PO */}
                {clientId && items.length > 0 && (
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <h2 className="text-sm font-semibold text-slate-800 mb-4">Additional details</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Input
                                label="Purchase order number (optional)"
                                value={purchaseOrderNumber}
                                onChange={e => setPurchaseOrderNumber(e.target.value)}
                            />
                            <Input
                                label="Notes (optional)"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 justify-end pb-6">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={selectedItems.length === 0 || createDraft.isPending}
                        onClick={() => createDraft.mutate()}
                    >
                        {createDraft.isPending ? 'Creating…' : `Create draft invoice${selectedItems.length ? ` (${formatCurrency(selectedSubtotal)})` : ''}`}
                    </Button>
                </div>
            </div>
        </div>
    )
}
