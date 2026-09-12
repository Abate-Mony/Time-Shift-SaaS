import { Button } from '@/components/ui/button'
import { queryClient } from '@/lib/queryClient'
import customFetch from '@/utils/customFetch'
import { cancelInvoice, deleteInvoice, markInvoicePaid, sendInvoice } from '@/utils/api-request-functions'
import { formatCurrency } from '@/utils/format'
import type { Invoice, InvoiceCompanyInfo, InvoiceLineItemDisplay } from '@/utils/types'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ChevronLeft, Mail, Pencil, Printer, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams, type LoaderFunctionArgs } from 'react-router'
import { useBackLink } from '@/hooks/useBackLink'

const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-emerald-100 text-emerald-700',
    overdue: 'bg-red-100 text-red-600',
    cancelled: 'bg-amber-100 text-amber-700',
}

// A line item is source-backed (a real shift/job) when it carries a date
// snapshot — adjustments and legacy pre-redesign items don't.
const isShiftItem = (li: InvoiceLineItemDisplay) => li.type !== 'adjustment' && !!li.date
const isAdjustmentItem = (li: InvoiceLineItemDisplay) => li.type === 'adjustment'
const isLegacyItem = (li: InvoiceLineItemDisplay) => !isShiftItem(li) && !isAdjustmentItem(li)

// Exported so InvoiceForm can reuse the exact same query when editing —
// same precedent as InvoiceForm importing `singleJob` from EditJobPage.
export const singleInvoice = (id: string | undefined) => ({
    queryKey: ['invoice', id],
    queryFn: async (): Promise<{ invoice: Invoice; company: InvoiceCompanyInfo | null }> => {
        const { data } = await customFetch.get(`/invoices/${id}`)
        return data
    },
})

export const loader = (queryClient: QueryClient) => async ({ params }: LoaderFunctionArgs) => {
    await queryClient.ensureQueryData(singleInvoice(params.id))
    return null
}

export function InvoiceDetail() {
    const navigate = useNavigate()
    const back = useBackLink({ to: '/invoices', label: 'Invoices' })
    const id = useParams().id
    const data = useQuery(singleInvoice(id)).data
    const invoice = data?.invoice
    const company = data?.company
    const [deleting, setDeleting] = useState(false)
    const [sending, setSending] = useState(false)
    const [markingPaid, setMarkingPaid] = useState(false)
    const [cancelling, setCancelling] = useState(false)

    if (!invoice) return null

    const handleDelete = async () => {
        if (!window.confirm(`Delete invoice ${invoice.invoiceNumber}? This can't be undone.`)) return
        setDeleting(true)
        const ok = await deleteInvoice(invoice._id)
        setDeleting(false)
        if (ok) navigate('/invoices')
    }

    const handleSend = async () => {
        setSending(true)
        await sendInvoice(invoice._id)
        setSending(false)
    }

    const handleMarkPaid = async () => {
        setMarkingPaid(true)
        await markInvoicePaid(invoice._id)
        setMarkingPaid(false)
    }

    const handleCancel = async () => {
        const reason = window.prompt(
            invoice.status === 'draft'
                ? `Cancel draft ${invoice.invoiceNumber}? Its work goes back to eligible-to-invoice. Reason (optional):`
                : `Cancel invoice ${invoice.invoiceNumber}? It was already sent — its billed work stays locked (no auto-rebilling). Reason (optional):`
        )
        if (reason === null) return
        setCancelling(true)
        await cancelInvoice(invoice._id, reason || undefined)
        setCancelling(false)
    }

    const shiftItems = invoice.lineItems.filter(isShiftItem)
    const adjustmentItems = invoice.lineItems.filter(isAdjustmentItem)
    const legacyItems = invoice.lineItems.filter(isLegacyItem)

    // The generic edit form does a full lineItems replace with only
    // {description, hours, rate} — fine for a manual invoice, but it would
    // silently strip the date/location/worker snapshot (and job/assignment
    // linkage) off a draft built from real jobs & shifts. Editing those is
    // Cancel (which unlocks the jobs) + recreate instead.
    const isWorkSourced = !!(invoice.jobs?.length || invoice.assignments?.length)

    const clientName = invoice.clientSnapshot?.name ?? (typeof invoice.client === 'string' ? invoice.client : '—')
    const clientAddress = invoice.clientSnapshot?.address
    const addressLines = clientAddress
        ? [clientAddress.line1, clientAddress.line2, [clientAddress.city, clientAddress.postcode].filter(Boolean).join(' '), clientAddress.country].filter(Boolean)
        : []

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in">
            {/* Print-only styles: hide the app chrome, keep just the invoice card */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #invoice-print, #invoice-print * { visibility: visible; }
                    #invoice-print { position: absolute; inset: 0; box-shadow: none; border: none; }
                    #invoice-no-print { display: none; }
                }
            `}</style>

            <div id="invoice-no-print" className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate(back.to)}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ChevronLeft size={16} /> Back to {back.label}
                </button>
                <div className="flex items-center gap-2">
                    {invoice.status === 'draft' && (
                        <Button variant="outline" size="sm" disabled={sending} onClick={handleSend}>
                            <Mail size={13} /> {sending ? 'Sending…' : 'Send Invoice'}
                        </Button>
                    )}
                    {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <>
                            <Button variant="outline" size="sm" disabled={sending} onClick={handleSend}>
                                <Mail size={13} /> {sending ? 'Sending…' : 'Resend'}
                            </Button>
                            <Button size="sm" disabled={markingPaid} onClick={handleMarkPaid}>
                                {markingPaid ? 'Marking…' : 'Mark as Paid'}
                            </Button>
                        </>
                    )}
                    {invoice.status === 'draft' && !isWorkSourced && (
                        <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/${invoice._id}/edit`)}>
                            <Pencil size={13} /> Edit
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer size={13} /> Print / Download
                    </Button>
                    {(invoice.status === 'draft' || invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={cancelling}
                            className="text-amber-600 hover:text-amber-600 hover:bg-amber-50"
                            onClick={handleCancel}
                        >
                            {cancelling ? 'Cancelling…' : 'Cancel'}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={deleting}
                        className="text-red-600 hover:text-red-600 hover:bg-red-50"
                        onClick={handleDelete}
                    >
                        <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete'}
                    </Button>
                </div>
            </div>

            <div id="invoice-print" className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Invoice {invoice.invoiceNumber}</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Issued {dayjs(invoice.issueDate).format('D MMMM YYYY')} · Due {dayjs(invoice.dueDate).format('D MMMM YYYY')}
                        </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[invoice.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {invoice.status}
                    </span>
                </div>

                {/* Bill To / From */}
                <div className="grid sm:grid-cols-2 gap-8 mb-8">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Bill To</p>
                        <p className="text-sm font-semibold text-slate-800">{clientName}</p>
                        {addressLines.map((line, i) => (
                            <p key={i} className="text-sm text-slate-500">{line}</p>
                        ))}
                        {invoice.clientSnapshot?.contactName && (
                            <p className="text-sm text-slate-500 mt-1">{invoice.clientSnapshot.contactName}</p>
                        )}
                        {invoice.clientSnapshot?.billingEmail && (
                            <p className="text-sm text-slate-500">{invoice.clientSnapshot.billingEmail}</p>
                        )}
                        {invoice.clientSnapshot?.vatNumber && (
                            <p className="text-xs text-slate-400 mt-1">VAT {invoice.clientSnapshot.vatNumber}</p>
                        )}
                    </div>
                    <div className="sm:text-right">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">From</p>
                        <p className="text-sm font-semibold text-slate-800">{company?.name ?? '—'}</p>
                        {company?.phone && <p className="text-sm text-slate-500">{company.phone}</p>}
                        {company?.website && <p className="text-sm text-slate-500">{company.website}</p>}
                        {company?.country && <p className="text-sm text-slate-500">{company.country}</p>}
                    </div>
                </div>

                {(invoice.servicePeriod?.start || invoice.purchaseOrderNumber) && (
                    <div className="flex flex-wrap gap-x-10 gap-y-3 mb-8 pb-6 border-b border-[#F1F5F9]">
                        {invoice.servicePeriod?.start && invoice.servicePeriod?.end && (
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Service Period</p>
                                <p className="text-sm text-slate-600">
                                    {dayjs(invoice.servicePeriod.start).format('D MMM YYYY')} – {dayjs(invoice.servicePeriod.end).format('D MMM YYYY')}
                                </p>
                            </div>
                        )}
                        {invoice.purchaseOrderNumber && (
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Purchase Order</p>
                                <p className="text-sm text-slate-600">{invoice.purchaseOrderNumber}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Work completed */}
                {shiftItems.length > 0 && (
                    <div className="mb-6">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Work Completed</p>
                        <div className="flex flex-col gap-2.5">
                            {shiftItems.map((li, i) => (
                                <div key={i} className="rounded-xl border border-[#E2E8F0] px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm font-semibold text-slate-900">{li.description}</p>
                                        <p className="text-sm font-bold text-slate-900 tabular-nums shrink-0">
                                            {formatCurrency(li.amount ?? li.hours * li.rate)}
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {li.date ? dayjs(li.date).format('D MMM YYYY') : ''}{li.location ? ` · ${li.location}` : ''}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {li.type === 'fixed'
                                            ? 'Fixed job charge'
                                            : `${li.startTime ?? ''}${li.startTime && li.endTime ? '–' : ''}${li.endTime ?? ''} · ${li.hours}h × ${formatCurrency(li.rate)}/hour`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Adjustments */}
                {adjustmentItems.length > 0 && (
                    <div className="mb-6">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Adjustments</p>
                        <div className="flex flex-col divide-y divide-[#F1F5F9] border-t border-b border-[#F1F5F9]">
                            {adjustmentItems.map((li, i) => {
                                const amount = li.amount ?? li.rate
                                return (
                                    <div key={i} className="flex items-center justify-between gap-3 py-2.5">
                                        <p className="text-sm text-slate-700">{li.description}</p>
                                        <p className={`text-sm font-semibold tabular-nums ${amount < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                            {formatCurrency(amount)}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Legacy / other charges fallback — pre-redesign invoices with no shift snapshot */}
                {legacyItems.length > 0 && (
                    <div className="mb-6">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Other Charges</p>
                        <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                <span>Description</span>
                                <span className="text-right">Hours</span>
                                <span className="text-right">Rate</span>
                                <span className="text-right">Amount</span>
                            </div>
                            {legacyItems.map((li, i) => (
                                <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-t border-[#F1F5F9] text-sm">
                                    <span className="text-slate-800">{li.description}</span>
                                    <span className="text-right text-slate-600">{li.type === 'fixed' ? '—' : li.hours}</span>
                                    <span className="text-right text-slate-600">
                                        {formatCurrency(li.rate)}{li.type === 'fixed' ? '' : '/hr'}
                                    </span>
                                    <span className="text-right font-medium text-slate-900">
                                        {formatCurrency(li.amount ?? li.hours * li.rate)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end mb-8">
                    <div className="w-56 flex flex-col gap-1.5">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        {!!invoice.vatRate && (
                            <div className="flex justify-between text-sm text-slate-500">
                                <span>VAT ({invoice.vatRate}%)</span>
                                <span>{formatCurrency(invoice.vatAmount ?? 0)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-[#F1F5F9]">
                            <span>Total</span>
                            <span>{formatCurrency(invoice.total)}</span>
                        </div>
                        {!!invoice.amountPaid && invoice.status !== 'paid' && (
                            <div className="flex justify-between text-xs text-emerald-600">
                                <span>Paid</span>
                                <span>{formatCurrency(invoice.amountPaid)}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-8">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Payment Details</p>
                        <p className="text-sm text-slate-600">Due {dayjs(invoice.dueDate).format('D MMMM YYYY')}</p>
                        {invoice.paymentReference && (
                            <p className="text-sm text-slate-600">Reference: {invoice.paymentReference}</p>
                        )}
                    </div>
                    {invoice.status === 'cancelled' && invoice.cancellationReason && (
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Cancellation Reason</p>
                            <p className="text-sm text-slate-600">{invoice.cancellationReason}</p>
                        </div>
                    )}
                </div>

                {invoice.notes && (
                    <div className="mt-6 pt-6 border-t border-[#F1F5F9]">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.notes}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
