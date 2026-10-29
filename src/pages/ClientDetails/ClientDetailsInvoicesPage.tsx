import { ChevronLeft, ChevronRight, FileText, Plus } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useClientDetail } from "./ClientDetailContext"
import { clientInvoicesQuery } from "@/utils/clients"
import { InvoiceStatusPill } from "@/utils/columns"
import { formatDate } from "@/utils/date"
import { formatCurrency } from "@/utils/format"

export function ClientDetailsInvoicesPage() {
    const { client } = useClientDetail()
    const navigate = useNavigate()
    const [page, setPage] = useState(1)
    const { data, isLoading } = useQuery(clientInvoicesQuery(client._id, page))
    const invoices = data?.invoices ?? []

    if (!isLoading && invoices.length === 0 && page === 1) {
        return (
            <div className="bg-card border border-[var(--border)] rounded-xl flex flex-col items-center justify-center py-14 text-center">
                <FileText size={20} className="text-slate-300 mb-2.5" />
                <p className="text-sm font-semibold text-muted-foreground mb-1">No invoices yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create an invoice when you're ready to bill {client.name}.</p>
                <Link to="/invoices/create" className="h-8 px-4 bg-[var(--primary)] text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                    <Plus size={12} /> Create Invoice
                </Link>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-xs text-muted-foreground">{data?.total ?? 0} invoice{data?.total === 1 ? '' : 's'}</p>
                <Link to="/invoices/create" className="h-8 px-3.5 bg-[var(--primary)] text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                    <Plus size={12} /> Create Invoice
                </Link>
            </div>
            <div className="bg-card border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-muted/60 border-b border-[var(--border)]">
                            <tr>
                                {['Invoice', 'Status', 'Total', 'Issue Date', 'Due Date'].map(h => (
                                    <th key={h} className="text-left px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {invoices.map(inv => (
                                <tr
                                    key={inv._id}
                                    onClick={() => navigate(`/invoices/${inv._id}`)}
                                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-[var(--border)]">{inv.invoiceNumber}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap"><InvoiceStatusPill value={inv.status} /></td>
                                    <td className="px-4 py-3 text-sm font-bold text-foreground whitespace-nowrap">{formatCurrency(inv.total)}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(inv.issueDate, "D MMM YYYY")}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(inv.dueDate, "D MMM YYYY")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border)]">
                        <p className="text-xs text-muted-foreground">Page {data.page} of {data.totalPages}</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="w-7 h-7 rounded-lg border border-[var(--border)] flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <ChevronLeft size={13} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                disabled={page >= data.totalPages}
                                className="w-7 h-7 rounded-lg border border-[var(--border)] flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            >
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
