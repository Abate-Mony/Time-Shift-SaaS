import { FileText, Loader2, Plus } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { useClientDetail } from "./ClientDetailContext"
import { QuoteStatusBadge } from "../Quotes"
import { singleQuote } from "../CreateQuote"
import { fmtLeadValue } from "@/utils/leads"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
// Same list the Lead detail page's QuotesSection shows — includes quotes a
// public-wizard resubmission created for this client (see
// time_sheet_server's publicQuoteIntakeController.ts createOrSendQuoteForClient)
// alongside ones built by hand, since both are just ordinary Quote documents.
export function ClientDetailsQuotesPage() {
    const { client, quotes } = useClientDetail()
    const navigate = useNavigate()
    const gotoQuote = (quoteId: string) => {
        navigate(`/quotes/${quoteId}`)
    }
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
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-muted/60 border-b border-[var(--border)]">
                            <tr>
                                {['Quote', 'Status', 'Amount', 'Sent', 'Valid Until'].map(h => (
                                    <th key={h} className="text-left px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {quotes.map(q => (
                                <HoverCard key={q._id} openDelay={250} closeDelay={100}>
                                    <HoverCardTrigger asChild>
                                        <tr
                                            onClick={() => gotoQuote(q._id)}
                                            className="hover:bg-muted/40 transition-colors cursor-pointer">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-[var(--border)]">{q.quoteNumber}</span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap"><QuoteStatusBadge status={q.status} /></td>
                                            <td className="px-4 py-3 text-sm font-bold text-foreground whitespace-nowrap">{fmtLeadValue(q.total)}</td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{q.sentAt ? new Date(q.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(q.validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                                        </tr>
                                    </HoverCardTrigger>
                                    <HoverCardContent side="top" align="start" className="w-96 cursor-pointer" 
                                    
                                            onClick={() => gotoQuote(q._id)}
                                    >
                                        <QuotePreviewContent quoteId={q._id} />
                                    </HoverCardContent>
                                </HoverCard>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

// Fetched lazily — only once its HoverCard actually opens, since
// HoverCardContent doesn't mount until then — and cached by React Query, so
// re-hovering the same row again is instant. The quotes list itself only
// carries LeadQuoteRef's summary fields (see ClientDetailContext.tsx), not
// line items/notes/tax, so the real breakdown needs this separate GET.
function QuotePreviewContent({ quoteId }: { quoteId: string }) {
    const { data, isLoading, isError } = useQuery(singleQuote(quoteId))
    const quote = data?.quote

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
        )
    }
    if (isError || !quote) {
        return <p className="text-xs text-muted-foreground py-1">Couldn't load this quote.</p>
    }

    const visibleItems = quote.items.slice(0, 4)
    const hiddenCount = quote.items.length - visibleItems.length

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{quote.title}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{quote.quoteNumber}</p>
                </div>
                <QuoteStatusBadge status={quote.status} />
            </div>

            {quote.items.length > 0 && (
                <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-2">
                    {visibleItems.map((item, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 text-xs">
                            <span className="text-muted-foreground">{item.quantity} × {item.description}</span>
                            <span className="font-semibold text-foreground shrink-0">{fmtLeadValue(item.amount)}</span>
                        </div>
                    ))}
                    {hiddenCount > 0 && (
                        <p className="text-[11px] text-muted-foreground">+{hiddenCount} more item{hiddenCount === 1 ? '' : 's'}</p>
                    )}
                </div>
            )}

            <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{fmtLeadValue(quote.subtotal)}</span>
                </div>
                {!!quote.taxAmount && (
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span>Tax{quote.taxRate ? ` (${quote.taxRate}%)` : ''}</span>
                        <span>{fmtLeadValue(quote.taxAmount)}</span>
                    </div>
                )}
                <div className="flex items-center justify-between font-bold text-foreground">
                    <span>Total</span>
                    <span>{fmtLeadValue(quote.total)}</span>
                </div>
            </div>

            {quote.notes && (
                <p className="text-[11px] text-muted-foreground border-t border-[var(--border)] pt-2 line-clamp-3">{quote.notes}</p>
            )}
        </div>
    )
}
