import { Button } from '@/components/ui/button'
import FilterButton from '@/components/ui/FilterButton'
import { useFilter } from '@/hooks/CustomLinkFilterHook'
import { backLinkState } from '@/hooks/useBackLink'
import customFetch from '@/utils/customFetch'
import { formatDate } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import type { Quote, QuoteListResponse, QuoteStatus } from '@/utils/types/quote'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { CheckCircle2, Clock, FileText, Plus, Search, TrendingUp, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLoaderData, useNavigate, type LoaderFunctionArgs, type Params } from 'react-router'

// ─── Status badge ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<QuoteStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-indigo-100 text-indigo-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    declined: 'bg-rose-100 text-rose-700',
    expired: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-muted text-muted-foreground',
}

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground'}`}>
            {status}
        </span>
    )
}

// ─── Query ──────────────────────────────────────────────────────────────────

const quotesQuery = (params: Params) => {
    const { search, sort, page, status, limit } = params

    return {
        queryKey: [
            'quotes',
            {
                search: search ?? '',
                status: status ?? 'all',
                sort: sort ?? 'createdAt_desc',
                page: page ?? 1,
                limit: limit ?? '',
            },
        ],
        queryFn: async (): Promise<QuoteListResponse> => {
            const { data } = await customFetch.get<QuoteListResponse>('/quotes', { params })
            return data
        },
    }
}

export const loader = (queryClient: QueryClient) => async ({ request }: LoaderFunctionArgs) => {
    const params = Object.fromEntries([
        ...new URL(request.url).searchParams.entries(),
    ])
    await queryClient.ensureQueryData(quotesQuery(params))
    return { searchValues: { ...params } }
}

// ─── Pipeline summary ───────────────────────────────────────────────────────

function PipelineBar({ quotes, total }: { quotes: Quote[]; total: number }) {
    const sentValue = quotes.filter(q => q.status === 'sent' || q.status === 'viewed').reduce((s, q) => s + q.total, 0)
    const acceptedValue = quotes.filter(q => q.status === 'accepted').reduce((s, q) => s + q.total, 0)
    const declinedCount = quotes.filter(q => q.status === 'declined').length
    const allValue = quotes.reduce((s, q) => s + q.total, 0)

    const stats = [
        { label: 'Pipeline (this page)', value: formatCurrency(allValue), sub: `${total} quote${total !== 1 ? 's' : ''} total`, icon: TrendingUp, iconColor: 'text-[var(--primary)]', bg: 'bg-[var(--primary)]/8' },
        { label: 'Awaiting response', value: formatCurrency(sentValue), sub: `${quotes.filter(q => q.status === 'sent' || q.status === 'viewed').length} sent`, icon: Clock, iconColor: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Accepted', value: formatCurrency(acceptedValue), sub: `${quotes.filter(q => q.status === 'accepted').length} won`, icon: CheckCircle2, iconColor: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Declined', value: `${declinedCount}`, sub: declinedCount === 1 ? 'quote lost' : 'quotes lost', icon: XCircle, iconColor: 'text-rose-400', bg: 'bg-rose-50' },
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {stats.map(s => (
                <div key={s.label} className="bg-card border border-[var(--border)] rounded-xl p-4 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <s.icon size={15} className={s.iconColor} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{s.label}</p>
                        <p className="text-xl font-bold text-foreground tabular-nums leading-tight">{s.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── Main list page ──────────────────────────────────────────────────────────

const STATUS_TABS: Array<{ id: QuoteStatus | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'sent', label: 'Sent' },
    { id: 'viewed', label: 'Viewed' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'declined', label: 'Declined' },
    { id: 'expired', label: 'Expired' },
]

export function Quotes() {
    const { searchValues } = useLoaderData() as { searchValues: Params }
    const navigate = useNavigate()
    const { quotes, total, totalPages, page: currentPage } = useQuery(quotesQuery(searchValues)).data as QuoteListResponse

    const { handleFilterChange, searchQuery } = useFilter()
    const [searchInput, setSearchInput] = useState(searchQuery.get('search') ?? '')

    // Debounced — mirrors the 250ms delay ClientCombobox uses before hitting
    // the search API, so typing doesn't fire a request per keystroke.
    useEffect(() => {
        const t = setTimeout(() => {
            handleFilterChange({ key: 'search', value: searchInput || null })
        }, 300)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput])

    const goToPage = (p: number) => {
        handleFilterChange({ key: 'page', value: p > 1 ? String(p) : null })
    }

    return (
        <div className="p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">Quotes</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Send professional quotes and track client responses</p>
                </div>
                <Button onClick={() => navigate('/quotes/create')}>
                    <Plus size={14} /> New quote
                </Button>
            </div>

            <PipelineBar quotes={quotes} total={total} />

            {/* Toolbar: search + status tabs */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Search by title, client, or number…"
                        className="w-full h-9 pl-8 pr-3 border border-[var(--border)] rounded-lg text-sm text-foreground bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 focus:border-[var(--primary)]/40 transition-all"
                    />
                </div>

                <div className="flex items-center gap-1 gap-x-0 border-b flex-wrap border-[var(--border)]">
                    {STATUS_TABS.map(tab => (
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
            </div>

            {/* Content */}
            {quotes.length === 0 ? (
                <div className="bg-card rounded-2xl border border-[var(--border)] p-10 text-center shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/8 flex items-center justify-center mx-auto mb-4">
                        <FileText size={22} className="text-[var(--primary)]/70" />
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">No quotes yet</p>
                    <p className="text-xs text-muted-foreground mb-5">Create your first quote and send it to a client.</p>
                    <Button onClick={() => navigate('/quotes/create')}>
                        <Plus size={13} /> New quote
                    </Button>
                </div>
            ) : (
                <div className="bg-card border border-[var(--border)] rounded-xl overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[auto_1fr_140px_100px_120px] items-center px-5 py-2.5 border-b border-[var(--border)] bg-muted/40">
                        <span className="w-[88px] mr-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Number</span>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Title / Client</span>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:block">Valid until</span>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Total</span>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden sm:block pl-4">Status</span>
                    </div>

                    <div className="divide-y divide-[var(--border)]">
                        {quotes.map(q => (
                            <Link
                                key={q._id}
                                to={`/quotes/${q._id}`}
                                state={backLinkState('Quotes')}
                                className="grid grid-cols-[auto_1fr_140px_100px_120px] items-center px-5 py-3.5 hover:bg-muted/40 transition-colors"
                            >
                                <div className="w-[88px] mr-4">
                                    <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded border border-[var(--border)]">
                                        {q.quoteNumber}
                                    </span>
                                </div>
                                <div className="min-w-0 pr-4">
                                    <p className="text-sm font-semibold text-foreground truncate">{q.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{q.client}</p>
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-sm text-muted-foreground">{formatDate(q.validUntil, 'D MMM YYYY')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(q.total)}</p>
                                </div>
                                <div className="hidden sm:block pl-4">
                                    <QuoteStatusBadge status={q.status} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <p>Showing {quotes.length} of {total} quote{total === 1 ? '' : 's'}</p>
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="h-7 px-2.5 rounded-lg border border-[var(--border)] text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="px-2 font-medium text-muted-foreground">Page {currentPage} of {totalPages}</span>
                        <button
                            type="button"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="h-7 px-2.5 rounded-lg border border-[var(--border)] text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
