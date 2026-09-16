import customFetch from '@/utils/customFetch'
import { formatDate } from '@/utils/date'
import { formatCurrency } from '@/utils/format'
import type { PublicQuote, PublicQuoteResponse } from '@/utils/types/quote'
import { AlertCircle, Check, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router'
import { QuoteStatusBadge } from './Quotes'

const DEFAULT_ACCENT = '#1E3A5F'

const fmtMoney = (amount: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'
    return `${symbol}${amount.toFixed(2)}`
}

// ─── Respond dialog (accept / decline confirmation) ────────────────────────

function RespondDialog({
    mode,
    accent,
    submitting,
    onClose,
    onSubmit,
}: {
    mode: 'accept' | 'decline'
    accent: string
    submitting: boolean
    onClose: () => void
    onSubmit: (v: { name: string; email: string; declineReason?: string }) => void
}) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [reason, setReason] = useState('')
    const canSubmit = name.trim().length > 0 && /\S+@\S+\.\S+/.test(email.trim())

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={e => { if (e.target === e.currentTarget && !submitting) onClose() }}
        >
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">
                        {mode === 'accept' ? 'Accept this quote?' : 'Decline this quote?'}
                    </h3>
                    <button onClick={onClose} disabled={submitting} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors disabled:opacity-40">
                        <X size={15} />
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-3.5">
                    {mode === 'accept' ? (
                        <p className="text-sm text-slate-500 leading-relaxed">By accepting, you confirm you agree to the quoted work and terms.</p>
                    ) : (
                        <p className="text-sm text-slate-500 leading-relaxed">Let us know your details so this can be recorded properly.</p>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Your name <span className="text-red-500">*</span></label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Jane Smith"
                            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="jane@company.com"
                            className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                        />
                    </div>

                    {mode === 'decline' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Reason <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value.slice(0, 500))}
                                rows={3}
                                placeholder="Let us know why, if you'd like…"
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 resize-none transition-colors"
                            />
                            <p className="text-[11px] text-slate-400 mt-1 text-right">{reason.length}/500</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-2.5 px-5 pb-5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 h-10 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        {mode === 'accept' ? 'Cancel' : 'Keep quote'}
                    </button>
                    <button
                        type="button"
                        disabled={!canSubmit || submitting}
                        onClick={() => onSubmit({ name: name.trim(), email: email.trim(), declineReason: reason.trim() || undefined })}
                        className="flex-1 h-10 text-sm font-bold text-white rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                        style={{ backgroundColor: mode === 'accept' ? accent : '#E11D48' }}
                    >
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : mode === 'accept' ? 'Accept quote' : 'Decline quote'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Terminal-state panels ──────────────────────────────────────────────────

function OutcomePanel({ quote }: { quote: PublicQuote }) {
    if (quote.status === 'accepted') {
        return (
            <div className="flex flex-col items-center text-center gap-2 py-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-1">
                    <Check size={22} className="text-emerald-500" />
                </div>
                <p className="text-base font-bold text-slate-900">Quote accepted</p>
                <p className="text-sm text-slate-500">
                    {quote.acceptedBy?.name ? `Accepted by ${quote.acceptedBy.name}` : 'Your acceptance has been recorded'}
                    {quote.acceptedAt ? ` on ${formatDate(quote.acceptedAt, 'D MMM YYYY [at] HH:mm')}` : ''}.
                </p>
            </div>
        )
    }
    if (quote.status === 'declined') {
        return (
            <div className="flex flex-col items-center text-center gap-2 py-2">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-1">
                    <X size={22} className="text-rose-500" />
                </div>
                <p className="text-base font-bold text-slate-900">Quote declined</p>
                <p className="text-sm text-slate-500">
                    Your response has been recorded{quote.declinedAt ? ` on ${formatDate(quote.declinedAt, 'D MMM YYYY')}` : ''}.
                </p>
                {quote.declineReason && (
                    <div className="mt-2 max-w-sm bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reason</p>
                        <p className="text-sm text-slate-600">{quote.declineReason}</p>
                    </div>
                )}
            </div>
        )
    }
    if (quote.status === 'expired') {
        return (
            <div className="flex flex-col items-center text-center gap-2 py-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-1">
                    <AlertCircle size={22} className="text-amber-500" />
                </div>
                <p className="text-base font-bold text-slate-900">This quote has expired</p>
                <p className="text-sm text-slate-500 max-w-xs">Please contact the sender for an updated quote.</p>
            </div>
        )
    }
    // cancelled
    return (
        <div className="flex flex-col items-center text-center gap-2 py-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-1">
                <AlertCircle size={22} className="text-slate-400" />
            </div>
            <p className="text-base font-bold text-slate-900">This quote is no longer available</p>
            <p className="text-sm text-slate-500 max-w-xs">It's been withdrawn by the sender.</p>
        </div>
    )
}

// ─── The document itself ────────────────────────────────────────────────────

function QuoteDocument({
    quote,
    companyName,
    onRespond,
}: {
    quote: PublicQuote
    companyName?: string
    onRespond: (mode: 'accept' | 'decline') => void
}) {
    const accent = quote.template?.accentColor || DEFAULT_ACCENT
    const addr = quote.client?.address
    const addressLine = addr ? [addr.line1, addr.line2, [addr.city, addr.postcode].filter(Boolean).join(' '), addr.country].filter(Boolean).join(', ') : ''
    const isRespondable = quote.status === 'sent' || quote.status === 'viewed'
    const rows = quote.items.filter(li => li.description || li.unitPrice > 0)

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header strip */}
            <div className="px-6 sm:px-10 pt-8 pb-6 border-b border-slate-100">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: accent }}>Quotation</p>
                        <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight mt-1">{quote.quoteNumber}</p>
                        {companyName && <p className="text-sm text-slate-500 mt-1">from {companyName}</p>}
                    </div>
                    <QuoteStatusBadge status={quote.status} />
                </div>
            </div>

            <div className="px-6 sm:px-10 py-8">
                {/* Prepared for / dates */}
                <div className="flex flex-wrap justify-between gap-6 mb-8">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Prepared for</p>
                        <p className="text-sm font-bold text-slate-900">{quote.client?.name ?? '—'}</p>
                        {quote.client?.contactName && <p className="text-xs text-slate-500 mt-0.5">{quote.client.contactName}</p>}
                        {addressLine && <p className="text-xs text-slate-400 mt-0.5">{addressLine}</p>}
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Valid until</p>
                        <p className="text-sm font-semibold text-slate-800">{formatDate(quote.validUntil, 'D MMM YYYY')}</p>
                        {quote.sentAt && <p className="text-xs text-slate-400 mt-2">Issued {formatDate(quote.sentAt, 'D MMM YYYY')}</p>}
                    </div>
                </div>

                <h2 className="text-lg font-bold text-slate-900 mb-1.5">{quote.title}</h2>
                {quote.description && <p className="text-sm text-slate-500 mb-6 leading-relaxed">{quote.description}</p>}

                {/* Items */}
                <div className="border-t border-slate-200">
                    <div className="grid grid-cols-[1fr_52px_88px_84px] gap-2 py-2.5 border-b border-slate-200">
                        {['Description', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                            <p key={h} className={`text-[10px] font-bold text-slate-400 uppercase tracking-wider ${i > 0 ? 'text-right' : ''}`}>{h}</p>
                        ))}
                    </div>
                    {rows.map((li, i) => (
                        <div key={i} className="grid grid-cols-[1fr_52px_88px_84px] gap-2 py-3 border-b border-slate-50">
                            <p className="text-sm text-slate-800">{li.description}</p>
                            <p className="text-sm text-slate-500 text-right tabular-nums">{li.quantity}</p>
                            <p className="text-sm text-slate-500 text-right tabular-nums">{fmtMoney(li.unitPrice, quote.currency)}</p>
                            <p className="text-sm font-semibold text-slate-900 text-right tabular-nums">{fmtMoney(li.amount, quote.currency)}</p>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="flex justify-end mt-5">
                    <div className="w-full sm:w-60">
                        <div className="flex justify-between py-1.5 text-sm text-slate-500">
                            <span>Subtotal</span><span className="tabular-nums">{fmtMoney(quote.subtotal, quote.currency)}</span>
                        </div>
                        {!!quote.taxRate && quote.taxRate > 0 && (
                            <div className="flex justify-between py-1.5 text-sm text-slate-500">
                                <span>VAT ({quote.taxRate}%)</span><span className="tabular-nums">{fmtMoney(quote.taxAmount ?? 0, quote.currency)}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-3 mt-1 border-t-2 border-slate-100">
                            <span className="text-base font-bold text-slate-900">Total</span>
                            <span className="text-xl font-bold tabular-nums" style={{ color: accent }}>{fmtMoney(quote.total, quote.currency)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes & terms */}
                {quote.notes && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{quote.notes}</p>
                    </div>
                )}
                {quote.terms && (
                    <div className="mt-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Terms &amp; conditions</p>
                        <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{quote.terms}</p>
                    </div>
                )}

                {/* Action area */}
                <div className="mt-10 pt-8 border-t border-slate-100">
                    {isRespondable ? (
                        <div className="flex flex-col items-center gap-3">
                            <button
                                type="button"
                                onClick={() => onRespond('accept')}
                                style={{ backgroundColor: accent }}
                                className="w-full max-w-sm h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-sm"
                            >
                                <Check size={15} /> Accept quote
                            </button>
                            <button
                                type="button"
                                onClick={() => onRespond('decline')}
                                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Decline quote
                            </button>
                        </div>
                    ) : (
                        <OutcomePanel quote={quote} />
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PublicQuotePage() {
    const { token } = useParams()
    const [data, setData] = useState<PublicQuoteResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [dialogMode, setDialogMode] = useState<'accept' | 'decline' | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const fetchQuote = useCallback(async () => {
        if (!token) { setErrorMsg('This quote link is invalid or no longer available.'); setLoading(false); return }
        setLoading(true)
        try {
            const { data } = await customFetch.get<PublicQuoteResponse>(`/quotes/public/${token}`)
            setData(data)
            setErrorMsg(null)
        } catch (err: any) {
            setData(null)
            setErrorMsg(err?.response?.data?.msg ?? 'This quote link is invalid or no longer available.')
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => { fetchQuote() }, [fetchQuote])

    async function handleRespond(v: { name: string; email: string; declineReason?: string }) {
        if (!token || !dialogMode) return
        setSubmitting(true)
        try {
            await customFetch.post(`/quotes/public/${token}/respond`, { action: dialogMode, ...v })
            setDialogMode(null)
            await fetchQuote()
        } catch (err: any) {
            toast.error(err?.response?.data?.msg ?? "We couldn't record your response. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    const accent = data?.quote.template?.accentColor || DEFAULT_ACCENT

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-14">
            <div className="max-w-[640px] mx-auto">
                {/* Brand row */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
                        <span className="text-white font-bold text-[11px]">W</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">work<span className="text-slate-400">.wrk</span></span>
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 flex items-center justify-center py-24">
                        <Loader2 size={20} className="animate-spin text-slate-300" />
                    </div>
                ) : errorMsg || !data ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={20} className="text-slate-400" />
                        </div>
                        <p className="text-base font-bold text-slate-900 mb-1">Quote unavailable</p>
                        <p className="text-sm text-slate-500">{errorMsg}</p>
                    </div>
                ) : (
                    <QuoteDocument
                        quote={data.quote}
                        companyName={data.company?.name}
                        onRespond={mode => setDialogMode(mode)}
                    />
                )}

                <p className="text-xs text-slate-400 text-center mt-8">Powered by INPRN</p>
            </div>

            {dialogMode && (
                <RespondDialog
                    mode={dialogMode}
                    accent={accent}
                    submitting={submitting}
                    onClose={() => { if (!submitting) setDialogMode(null) }}
                    onSubmit={handleRespond}
                />
            )}
        </div>
    )
}
