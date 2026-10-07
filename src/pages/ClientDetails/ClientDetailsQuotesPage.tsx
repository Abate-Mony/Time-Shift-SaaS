import { FileText, Plus } from "lucide-react"
import { Link } from "react-router"
import { useClientDetail } from "./ClientDetailContext"
import { QuoteStatusBadge } from "../Quotes"
import { fmtLeadValue } from "@/utils/leads"

// Same list the Lead detail page's QuotesSection shows — includes quotes a
// public-wizard resubmission created for this client (see
// time_sheet_server's publicQuoteIntakeController.ts createOrSendQuoteForClient)
// alongside ones built by hand, since both are just ordinary Quote documents.
export function ClientDetailsQuotesPage() {
    const { client, quotes } = useClientDetail()

    if (quotes.length === 0) {
        return (
            <div className="bg-card border border-[var(--border)] rounded-xl flex flex-col items-center justify-center py-14 text-center">
                <FileText size={20} className="text-slate-300 mb-2.5" />
                <p className="text-sm font-semibold text-muted-foreground mb-1">No quotes yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create a quote when you're ready to send pricing to {client.name}.</p>
                <Link to="/quotes/create" className="h-8 px-4 bg-[var(--primary)] text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                    <Plus size={12} /> Create Quote
                </Link>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-xs text-muted-foreground">{quotes.length} quote{quotes.length === 1 ? '' : 's'}</p>
                <Link to="/quotes/create" className="h-8 px-3.5 bg-[var(--primary)] text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                    <Plus size={12} /> Create Quote
                </Link>
            </div>
            <div className="bg-card border border-[var(--border)] rounded-xl overflow-hidden">
                <table className="w-full border-collapse">
                    <thead className="bg-muted/60 border-b border-[var(--border)]">
                        <tr>
                            {['Quote', 'Status', 'Amount', 'Sent', 'Valid Until'].map(h => (
                                <th key={h} className="text-left px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {quotes.map(q => (
                            <tr key={q._id} className="hover:bg-muted/40 transition-colors">
                                <td className="px-4 py-3">
                                    <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-[var(--border)]">{q.quoteNumber}</span>
                                </td>
                                <td className="px-4 py-3"><QuoteStatusBadge status={q.status} /></td>
                                <td className="px-4 py-3 text-sm font-bold text-foreground">{fmtLeadValue(q.total)}</td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">{q.sentAt ? new Date(q.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(q.validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
