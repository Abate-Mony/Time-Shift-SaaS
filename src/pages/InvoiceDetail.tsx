import { Button } from '@/components/ui/button'
import { queryClient } from '@/lib/queryClient'
import customFetch from '@/utils/customFetch'
import { updateInvoiceStatus } from '@/utils/api-request-functions'
import { formatCurrency } from '@/utils/format'
import type { Invoice } from '@/utils/types'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ChevronLeft, Printer } from 'lucide-react'
import { useNavigate, useParams, type LoaderFunctionArgs } from 'react-router'

const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-emerald-100 text-emerald-700',
    overdue: 'bg-red-100 text-red-600',
}

const singleInvoice = (id: string | undefined) => ({
    queryKey: ['invoice', id],
    queryFn: async (): Promise<{ invoice: Invoice }> => {
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
    const id = useParams().id
    const invoice = useQuery(singleInvoice(id)).data?.invoice

    if (!invoice) return null

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
                    onClick={() => navigate('/invoices')}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ChevronLeft size={16} /> Back to Invoices
                </button>
                <div className="flex items-center gap-2">
                    {invoice.status === 'draft' && (
                        <Button variant="outline" size="sm" onClick={() => updateInvoiceStatus(invoice._id, 'sent')}>
                            Mark as Sent
                        </Button>
                    )}
                    {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <Button size="sm" onClick={() => updateInvoiceStatus(invoice._id, 'paid')}>
                            Mark as Paid
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer size={13} /> Print / Download
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

                <div className="mb-8">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Bill To</p>
                    <p className="text-sm font-medium text-slate-800">{invoice.client}</p>
                </div>

                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden mb-6">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <span>Description</span>
                        <span className="text-right">Hours</span>
                        <span className="text-right">Rate</span>
                        <span className="text-right">Amount</span>
                    </div>
                    {invoice.lineItems.map((li, i) => (
                        <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-t border-[#F1F5F9] text-sm">
                            <span className="text-slate-800">{li.description}</span>
                            <span className="text-right text-slate-600">{li.hours}</span>
                            <span className="text-right text-slate-600">{formatCurrency(li.rate)}</span>
                            <span className="text-right font-medium text-slate-900">{formatCurrency(li.hours * li.rate)}</span>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end mb-8">
                    <div className="w-56 flex flex-col gap-1.5">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-[#F1F5F9]">
                            <span>Total</span>
                            <span>{formatCurrency(invoice.total)}</span>
                        </div>
                    </div>
                </div>

                {invoice.notes && (
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.notes}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
