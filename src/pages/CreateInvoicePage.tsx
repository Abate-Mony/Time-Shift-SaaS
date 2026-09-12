import { Button } from '@/components/ui/button'
import { Input } from '../components/ui'
import { queryClient } from '@/lib/queryClient'
import { clientsQuery } from '@/utils/clients'
import { createInvoiceDraft, getClientBillingInfo, getEligibleWork } from '@/utils/api-request-functions'
import { formatCurrency } from '@/utils/format'
import type { BillingFrequency, ClientBillingInfo, EligibleWorkItem, EligibleWorkResponse, InvoiceAdjustmentInput } from '@/utils/types'
import { useMutation, useQuery, type QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { AlertTriangle, ChevronLeft, FileQuestion, Loader2, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router'
import { backLinkState } from '@/hooks/useBackLink'

export const loader = (queryClient: QueryClient) => async () => {
    await queryClient.ensureQueryData(clientsQuery())
    return null
}

// A period a manager will actually want most of the time — last full
// calendar month. Overridden the moment a client's own billing schedule
// gives us a real current period to default to instead.
const defaultPeriod = () => ({
    start: dayjs().startOf('month').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD'),
})

const toRangeStrings = (range: { start: string; end: string }) => ({
    start: dayjs(range.start).format('YYYY-MM-DD'),
    end: dayjs(range.end).format('YYYY-MM-DD'),
})

const itemKey = (item: EligibleWorkItem) => item.assignmentId ?? item.jobId

const FREQUENCY_LABEL: Record<BillingFrequency, string> = {
    per_job: 'Per job',
    weekly: 'Weekly',
    fortnightly: 'Fortnightly',
    monthly: 'Monthly',
    manual: 'Manual',
}

const formatRange = (range: { start: string; end: string }) =>
    `${dayjs(range.start).format('D MMM YYYY')} – ${dayjs(range.end).format('D MMM YYYY')}`

// ─── Adjustment dialog ────────────────────────────────────────────────────

function AddAdjustmentDialog({ onAdd, onClose }: { onAdd: (adj: InvoiceAdjustmentInput) => void; onClose: () => void }) {
    const [description, setDescription] = useState('')
    const [type, setType] = useState<'charge' | 'discount'>('charge')
    const [amount, setAmount] = useState('')

    const numericAmount = Number(amount)
    const canSubmit = description.trim().length > 0 && numericAmount > 0

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
                    <h3 className="text-base font-bold text-slate-900">Add adjustment</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={15} /></button>
                </div>
                <div className="p-5 flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
                        <Input
                            placeholder="e.g. Parking reimbursement"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Type</label>
                        <div className="flex bg-slate-100 rounded-lg p-1">
                            {(['charge', 'discount'] as const).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={`flex-1 h-8 rounded-md text-xs font-semibold capitalize transition-colors ${type === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Amount</label>
                        <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#1E3A5F]/15 focus-within:border-[#1E3A5F]/40 transition-all">
                            <span className="px-3 text-sm text-slate-500 bg-slate-50 h-10 flex items-center border-r border-[#E2E8F0]">£</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="flex-1 h-10 px-3 text-sm text-slate-800 outline-none"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2.5 px-5 pb-5">
                    <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                    <Button
                        type="button"
                        className="flex-1"
                        disabled={!canSubmit}
                        onClick={() => { onAdd({ description: description.trim(), type, amount: numericAmount }); onClose() }}
                    >
                        Add adjustment
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Early-generation confirm dialog ───────────────────────────────────────

function EarlyGenerationDialog({ daysRemaining, onConfirm, onClose }: { daysRemaining: number; onConfirm: () => void; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <h3 className="text-base font-bold text-slate-900">This billing period hasn't ended yet</h3>
                </div>
                <p className="text-sm text-slate-500">
                    {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remain in this client's billing cycle. Jobs completed after this
                    invoice is created will remain ready and can be invoiced separately later — nothing gets missed.
                </p>
                <div className="flex gap-2.5 mt-5">
                    <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                    <Button type="button" className="flex-1" onClick={onConfirm}>Create draft anyway</Button>
                </div>
            </div>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────

export function CreateInvoicePage() {
    const navigate = useNavigate()
    const { clients } = useQuery(clientsQuery()).data ?? { clients: [] }

    const [clientId, setClientId] = useState('')
    const [period, setPeriod] = useState(defaultPeriod())
    const [periodMode, setPeriodMode] = useState<'current' | 'custom'>('custom')
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [adjustments, setAdjustments] = useState<InvoiceAdjustmentInput[]>([])
    const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false)
    const [showEarlyConfirm, setShowEarlyConfirm] = useState(false)
    const [notes, setNotes] = useState('')
    const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('')

    const billingInfoQuery = useQuery<ClientBillingInfo>({
        queryKey: ['client-billing-info', clientId],
        queryFn: () => getClientBillingInfo(clientId),
        enabled: !!clientId,
    })
    const billingInfo = billingInfoQuery.data

    // Seed the period from the client's own billing schedule exactly once
    // per client selection — not on every refetch, or an in-progress manual
    // edit would get silently clobbered by a background refresh.
    const seededForClient = useRef<string | null>(null)
    useEffect(() => {
        if (!clientId) { seededForClient.current = null; return }
        if (!billingInfo || seededForClient.current === clientId) return
        seededForClient.current = clientId
        if (billingInfo.currentPeriod) {
            setPeriod(toRangeStrings(billingInfo.currentPeriod))
            setPeriodMode('current')
        } else {
            setPeriodMode('custom')
        }
    }, [clientId, billingInfo])

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
    const pendingReview = data?.pendingReview ?? []

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
    const useCurrentPeriod = () => {
        if (!billingInfo?.currentPeriod) return
        setPeriod(toRangeStrings(billingInfo.currentPeriod))
        setPeriodMode('current')
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
    const billableHours = useMemo(
        () => Math.round(selectedItems.reduce((sum, i) => sum + (i.chargeType === 'hourly' ? i.quantity : 0), 0) * 100) / 100,
        [selectedItems]
    )
    const workSubtotal = useMemo(
        () => Math.round(selectedItems.reduce((sum, i) => sum + i.amount, 0) * 100) / 100,
        [selectedItems]
    )
    const adjustmentsTotal = useMemo(
        () => Math.round(adjustments.reduce((sum, a) => sum + (a.type === 'discount' ? -a.amount : a.amount), 0) * 100) / 100,
        [adjustments]
    )
    const grandTotal = Math.round((workSubtotal + adjustmentsTotal) * 100) / 100

    // "Early" means: using the client's own open billing period, and that
    // period hasn't closed yet — completed work could still land in it.
    const isEarly = periodMode === 'current' && !!billingInfo?.currentPeriod && dayjs().isBefore(dayjs(billingInfo.currentPeriod.end), 'day')
    const daysRemaining = billingInfo?.currentPeriod ? Math.max(1, dayjs(billingInfo.currentPeriod.end).diff(dayjs(), 'day') + 1) : 0

    const createDraft = useMutation({
        mutationFn: async () => {
            const jobIds = selectedItems.filter(i => !i.assignmentId).map(i => i.jobId)
            const assignmentIds = selectedItems.filter(i => i.assignmentId).map(i => i.assignmentId as string)
            return createInvoiceDraft({
                client: clientId,
                servicePeriod: period,
                jobIds,
                assignmentIds,
                adjustments: adjustments.length ? adjustments : undefined,
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

    const handleCreateClick = () => {
        if (isEarly) {
            setShowEarlyConfirm(true)
            return
        }
        createDraft.mutate()
    }

    return (
        <div className="px-2 pt-2.5 lg:p-6 max-w-4xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-7">
                <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Create Invoice</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Select the client and period — completed, approved work shows up ready to bill</p>
                </div>
            </div>

            <div className="flex flex-col gap-5">
                {/* Client */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                    <h2 className="text-sm font-semibold text-slate-800 mb-4">Client</h2>
                    <select
                        value={clientId}
                        onChange={e => setClient(e.target.value)}
                        className="w-full sm:w-1/3 h-10 px-3 border border-[#E2E8F0] rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
                    >
                        <option value="">Select a client…</option>
                        {clients.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Billing schedule */}
                {clientId && billingInfo && (
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <h2 className="text-sm font-semibold text-slate-800 mb-4">Billing Schedule</h2>
                        <div className="flex flex-wrap gap-x-10 gap-y-3 mb-4">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Billing</p>
                                <p className="text-sm text-slate-700">
                                    {billingInfo.billingFrequency ? FREQUENCY_LABEL[billingInfo.billingFrequency] : 'Manual'} · {billingInfo.paymentTermsDays} day terms
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Last invoice</p>
                                <p className="text-sm text-slate-700">
                                    {billingInfo.lastInvoice?.servicePeriod ? formatRange(billingInfo.lastInvoice.servicePeriod) : 'None yet'}
                                </p>
                            </div>
                            {billingInfo.currentPeriod && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                                        {dayjs().isAfter(dayjs(billingInfo.currentPeriod.end)) ? 'Billing period' : 'Current billing period'}
                                    </p>
                                    <p className="text-sm text-slate-700">{formatRange(billingInfo.currentPeriod)}</p>
                                </div>
                            )}
                        </div>

                        {billingInfo.currentPeriod && (
                            <div className="flex gap-2">
                                <Button type="button" size="sm" variant={periodMode === 'current' ? 'default' : 'outline'} onClick={useCurrentPeriod}>
                                    Use current billing period
                                </Button>
                                <Button type="button" size="sm" variant={periodMode === 'custom' ? 'default' : 'outline'} onClick={() => setPeriodMode('custom')}>
                                    Custom period
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Service period — editable whenever there's no schedule-driven
                    period to default to, or the manager asked for a custom one */}
                {clientId && (!billingInfo?.currentPeriod || periodMode === 'custom') && (
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <h2 className="text-sm font-semibold text-slate-800 mb-4">Service Period</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Input
                                label="Start"
                                type="date"
                                value={period.start}
                                onChange={e => setPeriodField('start', e.target.value)}
                            />
                            <Input
                                label="End"
                                type="date"
                                value={period.end}
                                onChange={e => setPeriodField('end', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {isEarly && (
                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                        <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-800">
                            This billing period hasn't ended yet — {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remain. Work completed
                            after you create this invoice will stay ready for next time.
                        </p>
                    </div>
                )}

                {/* Ready to invoice */}
                {clientId && (
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-800">Ready to invoice{items.length > 0 ? ` (${items.length})` : ''}</h2>
                            {items.length > 0 && (
                                <button
                                    type="button"
                                    onClick={toggleAll}
                                    className="text-xs font-semibold text-[#1E3A5F] hover:underline"
                                >
                                    {allSelected ? 'Clear all' : 'Select all'}
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
                                <p className="text-sm font-semibold text-slate-700">No work is ready to invoice</p>
                                <p className="text-xs text-slate-400 max-w-sm">
                                    There are no completed, approved and uninvoiced jobs for this client in this period.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {items.map(item => {
                                    const key = itemKey(item)
                                    const checked = selected.has(key)
                                    return (
                                        <label
                                            key={key}
                                            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${checked ? 'border-[#1E3A5F]/30 bg-[#1E3A5F]/[0.03]' : 'border-[#E2E8F0] hover:border-slate-300'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggle(item)}
                                                className="w-4 h-4 mt-0.5 rounded border-slate-300 accent-[#1E3A5F] cursor-pointer shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                                                    <p className="text-sm font-bold text-slate-900 tabular-nums shrink-0">
                                                        {formatCurrency(item.amount)}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {dayjs(item.date).format('D MMM YYYY')}{item.location ? ` · ${item.location}` : ''}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {item.chargeType === 'hourly'
                                                        ? `${item.startTime}–${item.endTime} · ${item.quantity}h × ${formatCurrency(item.rate)}/hour${item.workerName ? ` · ${item.workerName}` : ''}`
                                                        : 'Fixed job charge'}
                                                </p>
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                        )}

                        {items.length > 0 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F1F5F9]">
                                <p className="text-xs text-slate-400">
                                    {selectedItems.length} of {items.length} jobs selected{billableHours > 0 ? ` · ${billableHours}h billable` : ''}
                                </p>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Subtotal</p>
                                    <p className="text-xl font-bold text-slate-900 mt-0.5">{formatCurrency(workSubtotal)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Waiting for review — completed work held back until overtime is resolved */}
                {clientId && pendingReview.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-amber-800 mb-2">
                            {pendingReview.length} completed shift{pendingReview.length === 1 ? '' : 's'} not included — overtime awaiting approval.
                        </p>
                        <div className="flex flex-col gap-1.5">
                            {pendingReview.map(p => (
                                <div key={p.assignmentId} className="flex items-center justify-between gap-3 text-xs text-amber-700">
                                    <span className="truncate">{p.title} · {dayjs(p.date).format('D MMM')} · {p.workerName}</span>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/jobs/${p.jobId}`, { state: backLinkState('New Invoice') })}
                                        className="font-semibold underline shrink-0"
                                    >
                                        View job
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Adjustments — secondary to the actual work */}
                {clientId && items.length > 0 && (
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                        <div className="flex items-center justify-between mb-1">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-800">Adjustments{adjustments.length > 0 ? ` (${adjustments.length})` : ''}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Optional extra charges or discounts</p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowAdjustmentDialog(true)}>
                                <Plus size={13} /> Add adjustment
                            </Button>
                        </div>

                        {adjustments.length > 0 && (
                            <div className="flex flex-col divide-y divide-[#F1F5F9] mt-4">
                                {adjustments.map((adj, i) => (
                                    <div key={i} className="flex items-center justify-between gap-3 py-2.5">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Adjustment</p>
                                            <p className="text-sm text-slate-700 truncate">{adj.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <p className={`text-sm font-semibold tabular-nums ${adj.type === 'discount' ? 'text-red-500' : 'text-slate-900'}`}>
                                                {adj.type === 'discount' ? '-' : ''}{formatCurrency(adj.amount)}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setAdjustments(a => a.filter((_, idx) => idx !== i))}
                                                className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
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
                        onClick={handleCreateClick}
                    >
                        {createDraft.isPending ? 'Creating…' : `Create draft invoice${selectedItems.length ? ` (${formatCurrency(grandTotal)})` : ''}`}
                    </Button>
                </div>
            </div>

            {showAdjustmentDialog && (
                <AddAdjustmentDialog
                    onAdd={adj => setAdjustments(a => [...a, adj])}
                    onClose={() => setShowAdjustmentDialog(false)}
                />
            )}

            {showEarlyConfirm && (
                <EarlyGenerationDialog
                    daysRemaining={daysRemaining}
                    onClose={() => setShowEarlyConfirm(false)}
                    onConfirm={() => { setShowEarlyConfirm(false); createDraft.mutate() }}
                />
            )}
        </div>
    )
}
