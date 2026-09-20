import { ClientCombobox, type ComboboxClient } from '@/components/client/ClientCombobox'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '../components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { useBackLink } from '@/hooks/useBackLink'
import { queryClient } from '@/lib/queryClient'
import customFetch from '@/utils/customFetch'
import { cancelQuote, createQuote, deleteQuote, sendQuote, updateQuote } from '@/utils/api-request-functions'
import { clientSitesQuery } from '@/utils/sites'
import { formatCurrency } from '@/utils/format'
import { formatDate } from '@/utils/date'
import type { Quote, QuoteLineItemInput } from '@/utils/types/quote'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { Briefcase, ChevronLeft, ChevronRight, Download, Loader2, Lock, Plus, Send, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams, type LoaderFunctionArgs } from 'react-router'
import { QuoteStatusBadge } from './Quotes'
import { SendWithTemplateDialog } from '@/components/invoiceTemplates/SendWithTemplateDialog'

// A job created from this quote — only the fields the "Jobs created from
// this quote" section actually renders, not the full Job shape.
interface QuoteJobSummary {
    _id: string
    title: string
    date: string
    startTime: string
    endTime: string
    status: string
}

// ─── Query ──────────────────────────────────────────────────────────────────

export const singleQuote = (id: string) => ({
    queryKey: ['quote', id],
    queryFn: async (): Promise<{ quote: Quote }> => {
        const { data } = await customFetch.get(`/quotes/${id}`)
        return data
    },
})

export const loader = (queryClient: QueryClient) => async ({ params }: LoaderFunctionArgs) => {
    if (params.id) await queryClient.ensureQueryData(singleQuote(params.id))
    return null
}

// ─── Money / VAT helpers ────────────────────────────────────────────────────

type VatPreset = 'none' | '5' | '20' | 'custom'

const VAT_OPTIONS: { value: VatPreset; label: string }[] = [
    { value: 'none', label: 'No VAT (0%)' },
    { value: '5', label: 'VAT 5%' },
    { value: '20', label: 'VAT 20%' },
    { value: 'custom', label: 'Custom rate' },
]

const presetToRate = (preset: VatPreset, custom: number) => (preset === 'none' ? 0 : preset === 'custom' ? custom : Number(preset))
const rateToPreset = (rate: number): VatPreset => (rate === 0 ? 'none' : rate === 5 ? '5' : rate === 20 ? '20' : 'custom')

interface DraftItem {
    key: string
    description: string
    quantity: number
    unitPrice: number
}
const newItem = (): DraftItem => ({ key: `li-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, description: '', quantity: 1, unitPrice: 0 })

// ─── Small building blocks ──────────────────────────────────────────────────

function Card({ label, sub, aside, children }: { label: string; sub?: string; aside?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-card rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">{label}</h2>
                    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                </div>
                {aside}
            </div>
            <div className="p-6">{children}</div>
        </div>
    )
}

function FieldLabel({ text, required, optional }: { text: string; required?: boolean; optional?: boolean }) {
    return (
        <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-semibold text-foreground">{text}</span>
            {required && <span className="text-red-500 text-xs font-bold">*</span>}
            {optional && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-px rounded font-medium">optional</span>}
        </div>
    )
}

function FieldErr({ msg }: { msg?: string }) {
    return msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null
}

function LineRow({ item, onChange, onDelete, deletable, disabled }: {
    item: DraftItem
    onChange: (v: DraftItem) => void
    onDelete: () => void
    deletable: boolean
    disabled: boolean
}) {
    const amount = item.quantity * item.unitPrice
    return (
        <div className="grid grid-cols-[1fr_72px_112px_96px_28px] gap-1.5 py-2 border-b border-[var(--border)] last:border-0 items-center">
            <input
                value={item.description}
                onChange={e => onChange({ ...item, description: e.target.value })}
                placeholder="Describe this item or service"
                disabled={disabled}
                className="h-8 px-3 border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)]/40 rounded-md text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:bg-card focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/15 transition-all disabled:opacity-70"
            />
            <input
                type="number" min={0} step={0.5}
                value={item.quantity || ''}
                onChange={e => onChange({ ...item, quantity: parseFloat(e.target.value) || 0 })}
                disabled={disabled}
                className="h-8 px-2 border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)]/40 rounded-md text-sm text-foreground text-right tabular-nums bg-transparent focus:bg-card focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/15 transition-all disabled:opacity-70"
            />
            <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">£</span>
                <input
                    type="number" min={0} step={0.01}
                    value={item.unitPrice || ''}
                    onChange={e => onChange({ ...item, unitPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    disabled={disabled}
                    className="h-8 w-full pl-6 pr-2 border border-transparent hover:border-[var(--border)] focus:border-[var(--primary)]/40 rounded-md text-sm text-foreground text-right tabular-nums bg-transparent focus:bg-card focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/15 transition-all disabled:opacity-70"
                />
            </div>
            <p className={`text-sm font-semibold text-right tabular-nums pr-1 ${amount > 0 ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                {amount > 0 ? formatCurrency(amount) : '—'}
            </p>
            <button
                type="button"
                onClick={onDelete}
                disabled={!deletable || disabled}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground/50 hover:text-red-500 disabled:invisible transition-colors"
            >
                <Trash2 size={11} />
            </button>
        </div>
    )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function CreateQuote() {
    const navigate = useNavigate()
    const back = useBackLink({ to: '/quotes', label: 'Quotes' })
    const id = useParams().id
    const { data } = useQuery({ ...singleQuote(id ?? ''), enabled: !!id })
    const quote = data?.quote

    const isEditingExisting = !!quote
    const readOnly = isEditingExisting && quote!.status !== 'draft'

    // ── Form state (create) / seeded state (edit) ──
    const [client, setClient] = useState<ComboboxClient | null>(null)
    const [siteId, setSiteId] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [validUntil, setValidUntil] = useState(dayjs().add(30, 'day').format('YYYY-MM-DD'))
    const [chargeType, setChargeType] = useState<'hourly' | 'fixed'>('fixed')
    const [items, setItems] = useState<DraftItem[]>([newItem()])
    const [vatPreset, setVatPreset] = useState<VatPreset>('20')
    const [customVatRate, setCustomVatRate] = useState(0)
    const [notes, setNotes] = useState('')
    const [terms, setTerms] = useState('This quote is valid for 30 days from the date of issue.')
    const [sendThankYouEmail, setSendThankYouEmail] = useState(true)
    const [thankYouMessage, setThankYouMessage] = useState('')
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [saving, setSaving] = useState(false)
    const [sending, setSending] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [cancelling, setCancelling] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [showSendDialog, setShowSendDialog] = useState(false)

    // Seed local state from the loaded quote exactly once — client/site are
    // deliberately NOT re-editable once a quote exists: the API only ever
    // returns clientSnapshot.name (not the client's id) once a document is
    // created, so there's nothing to re-populate a picker with. Shown as a
    // fixed summary card instead — see the "Client" section below.
    const seeded = useRef(false)
    useEffect(() => {
        if (!quote || seeded.current) return
        seeded.current = true
        setTitle(quote.title)
        setDescription(quote.description ?? '')
        setValidUntil(quote.validUntil ? quote.validUntil.slice(0, 10) : dayjs().add(30, 'day').format('YYYY-MM-DD'))
        setChargeType(quote.chargeType)
        setItems(quote.items.length ? quote.items.map(li => ({ key: `li-${Math.random().toString(36).slice(2, 9)}`, description: li.description, quantity: li.quantity, unitPrice: li.unitPrice })) : [newItem()])
        const rate = quote.taxRate ?? 0
        setVatPreset(rateToPreset(rate))
        if (rateToPreset(rate) === 'custom') setCustomVatRate(rate)
        setNotes(quote.notes ?? '')
        setTerms(quote.terms ?? '')
        setSendThankYouEmail(quote.sendThankYouEmailOnAccept ?? true)
        setThankYouMessage(quote.thankYouMessage ?? '')
    }, [quote])

    const sitesQueryResult = useQuery({ ...clientSitesQuery(client?._id ?? ''), enabled: !!client })
    const sites = sitesQueryResult.data?.sites ?? []

    // "Jobs created from this quote" — one Quote can produce several Jobs
    // (e.g. a recurring contract), so this is never assumed to be at most
    // one. Tenant-scoped server-side same as every other /jobs query.
    const jobsFromQuoteQuery = useQuery({
        queryKey: ['jobs', { sourceQuote: quote?._id }],
        queryFn: async (): Promise<{ jobs: QuoteJobSummary[] }> => {
            const { data } = await customFetch.get('/jobs', { params: { sourceQuote: quote!._id, limit: 50 } })
            return data
        },
        enabled: !!quote && quote.status === 'accepted',
    })
    const jobsFromQuote = jobsFromQuoteQuery.data?.jobs ?? []

    const taxRate = presetToRate(vatPreset, customVatRate)
    const totalQty = items.reduce((s, li) => s + (li.quantity || 0), 0)
    const subtotal = items.reduce((s, li) => s + (li.quantity || 0) * (li.unitPrice || 0), 0)
    const vatAmount = subtotal * (taxRate / 100)
    const total = subtotal + vatAmount

    // Billing type is metadata for a possible later Job conversion — never
    // an extra charge on top of the items above. Deriving it here (instead
    // of asking the manager to type it a second time) is what actually
    // fixes the "£450 fixed + £450 of items = did you mean £900?" confusion:
    // there's only ever one number to enter, the items table.
    const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
    const derivedFixedAmount = round2(subtotal)
    const derivedHourlyRate = totalQty > 0 ? round2(subtotal / totalQty) : 0

    function updateItem(key: string, v: DraftItem) { setItems(p => p.map(li => li.key === key ? v : li)) }
    function removeItem(key: string) { setItems(p => p.filter(li => li.key !== key)) }

    function validate() {
        const e: Record<string, string> = {}
        if (!isEditingExisting && !client) e.client = 'Please select a client'
        if (!title.trim()) e.title = 'Quote title is required'
        const realItems = items.filter(li => li.description.trim() || li.unitPrice > 0)
        if (realItems.length === 0) {
            e.items = 'Add at least one line item'
        } else if (subtotal <= 0) {
            e.items = 'Add at least one item with a price greater than £0'
        } else if (chargeType === 'hourly' && totalQty <= 0) {
            e.items = 'Add a quantity greater than 0 so an hourly rate can be calculated'
        }
        if (!validUntil) e.validUntil = 'Valid-until date is required'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const lineItemsPayload = (): QuoteLineItemInput[] =>
        items
            .filter(li => li.description.trim() || li.unitPrice > 0)
            .map(li => ({ description: li.description.trim() || 'Item', quantity: li.quantity || 1, unitPrice: li.unitPrice }))

    const errorMessage = (err: unknown) =>
        isAxiosError(err) ? err.response?.data?.msg ?? err.response?.data?.message ?? 'Something went wrong.' : 'Something went wrong.'

    async function persist(): Promise<Quote> {
        const common = {
            title: title.trim(),
            description: description.trim() || undefined,
            chargeType,
            chargeRate: chargeType === 'hourly' ? derivedHourlyRate : undefined,
            chargeAmount: chargeType === 'fixed' ? derivedFixedAmount : undefined,
            items: lineItemsPayload(),
            taxRate,
            validUntil,
            notes: notes.trim() || undefined,
            terms: terms.trim() || undefined,
            sendThankYouEmailOnAccept: sendThankYouEmail,
            thankYouMessage: sendThankYouEmail ? (thankYouMessage.trim() || undefined) : undefined,
        }
        if (isEditingExisting) {
            return updateQuote(quote!._id, common)
        }
        return createQuote({ ...common, client: client!._id, site: siteId || undefined })
    }

    async function handleSaveDraft() {
        if (!validate()) return
        setSaving(true)
        try {
            const saved = await persist()
            await queryClient.invalidateQueries({ queryKey: ['quotes'] })
            if (isEditingExisting) {
                await queryClient.invalidateQueries({ queryKey: ['quote', saved._id] })
                toast.success('Draft saved')
            } else {
                toast.success(`Draft ${saved.quoteNumber} created`)
                navigate(`/quotes/${saved._id}`)
            }
        } catch (err) {
            toast.error(errorMessage(err))
        } finally {
            setSaving(false)
        }
    }

    async function handleSend(templateId?: string): Promise<boolean> {
        if (!validate()) return false
        setSending(true)
        try {
            const saved = await persist()
            await queryClient.invalidateQueries({ queryKey: ['quotes'] })
            const ok = await sendQuote(saved._id, templateId)
            if (ok) navigate(`/quotes/${saved._id}`)
            return ok
        } catch (err) {
            toast.error(errorMessage(err))
            return false
        } finally {
            setSending(false)
        }
    }

    // Resending doesn't re-persist form edits — a manager resending a
    // stuck/lost email isn't necessarily mid-edit, and a sent/viewed quote
    // is already readOnly here anyway (nothing to persist).
    async function handleResend(templateId?: string): Promise<boolean> {
        if (!quote) return false
        setSending(true)
        const ok = await sendQuote(quote._id, templateId)
        setSending(false)
        if (ok) await queryClient.invalidateQueries({ queryKey: ['quote', quote._id] })
        return ok
    }

    async function handleDownloadPdf() {
        if (!quote) return
        setDownloading(true)
        try {
            const response = await customFetch.get(`/quotes/${quote._id}/pdf`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const a = document.createElement('a')
            a.href = url
            a.download = `${quote.quoteNumber}.pdf`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch {
            toast.error("Couldn't download the PDF — try again.")
        } finally {
            setDownloading(false)
        }
    }

    async function handleCancelQuote() {
        if (!quote) return
        const reason = window.prompt(`Cancel quote ${quote.quoteNumber}? Reason (optional):`)
        if (reason === null) return
        setCancelling(true)
        const ok = await cancelQuote(quote._id, reason || undefined)
        setCancelling(false)
        if (ok) navigate('/quotes')
    }

    async function handleDeleteDraft() {
        if (!quote) return
        if (!window.confirm(`Delete quote ${quote.quoteNumber}? This can't be undone.`)) return
        setDeleting(true)
        const ok = await deleteQuote(quote._id)
        setDeleting(false)
        if (ok) navigate('/quotes')
    }

    const isCancelable = !!quote && (quote.status === 'draft' || quote.status === 'sent' || quote.status === 'viewed')

    return (
        <div className="px-2 pt-2.5 lg:p-6 max-w-[1200px] mx-auto animate-fade-in">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                <button onClick={() => navigate(back.to)} className="hover:text-foreground flex items-center gap-1 transition-colors">
                    <ChevronLeft size={12} /> {back.label}
                </button>
                <span>/</span>
                <span className="text-foreground font-semibold">{isEditingExisting ? quote!.quoteNumber : 'New quote'}</span>
            </nav>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl font-semibold text-foreground tracking-tight">
                            {isEditingExisting ? quote!.title || 'Quote' : 'Create Quote'}
                        </h1>
                        {isEditingExisting && <QuoteStatusBadge status={quote!.status} />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {readOnly ? 'This quote has already been sent — most fields can no longer be edited.' : 'Build and send a professional quote to your client.'}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" disabled={downloading || !quote} onClick={handleDownloadPdf}>
                        {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Download PDF
                    </Button>
                    {isCancelable && (
                        <Button variant="outline" size="sm" disabled={cancelling} className="text-amber-600 hover:text-amber-600 hover:bg-amber-50" onClick={handleCancelQuote}>
                            {cancelling ? 'Cancelling…' : 'Cancel quote'}
                        </Button>
                    )}
                    {!!quote && quote.status === 'draft' && (
                        <Button variant="outline" size="sm" disabled={deleting} className="text-red-600 hover:text-red-600 hover:bg-red-50" onClick={handleDeleteDraft}>
                            {deleting ? 'Deleting…' : 'Delete'}
                        </Button>
                    )}
                    {!!quote && quote.status === 'accepted' && (
                        <Button size="sm" onClick={() => navigate(`/create-job?quote=${quote._id}`)}>
                            <Briefcase size={13} /> {jobsFromQuote.length > 0 ? 'Create another job' : 'Create job'}
                        </Button>
                    )}
                    {!!quote && (quote.status === 'sent' || quote.status === 'viewed') && (
                        <Button variant="outline" size="sm" disabled={sending} onClick={() => setShowSendDialog(true)}>
                            {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Resend
                        </Button>
                    )}
                    {!readOnly && (
                        <>
                            <Button variant="outline" size="sm" disabled={saving || sending} onClick={handleSaveDraft}>
                                {saving && <Loader2 size={13} className="animate-spin" />} Save draft
                            </Button>
                            <Button
                                size="sm"
                                disabled={saving || sending}
                                onClick={() => (isEditingExisting ? setShowSendDialog(true) : handleSend())}
                            >
                                {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} {sending ? 'Sending…' : 'Send quote'}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {showSendDialog && quote && (
                <SendWithTemplateDialog
                    documentType="quote"
                    documentId={quote._id}
                    documentNumber={quote.quoteNumber}
                    mode={quote.status === 'draft' ? 'send' : 'resend'}
                    onClose={() => setShowSendDialog(false)}
                    onConfirm={templateId => (quote.status === 'draft' ? handleSend(templateId) : handleResend(templateId))}
                />
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
                <div className="flex flex-col gap-4 min-w-0">

                    {/* Quote details */}
                    <Card label="Quote details" sub="Choose the client and define the work being quoted.">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                            <div className="sm:col-span-2">
                                <FieldLabel text="Client" required={!isEditingExisting} />
                                {isEditingExisting ? (
                                    <div className="p-3.5 border border-[var(--border)] rounded-lg bg-muted/30">
                                        <p className="text-sm font-semibold text-foreground">{quote!.clientSnapshot?.name}</p>
                                        {quote!.clientSnapshot?.contactName && <p className="text-xs text-muted-foreground mt-0.5">{quote!.clientSnapshot.contactName}</p>}
                                        {quote!.clientSnapshot?.billingEmail && <p className="text-xs text-muted-foreground">{quote!.clientSnapshot.billingEmail}</p>}
                                    </div>
                                ) : (
                                    <ClientCombobox value={client} onChange={c => { setClient(c); setSiteId('') }} onToast={m => toast.success(m)} />
                                )}
                                <FieldErr msg={errors.client} />
                            </div>

                            <div className="sm:col-span-2">
                                <FieldLabel text="Site" optional />
                                {isEditingExisting ? (
                                    <p className="text-sm text-muted-foreground h-9 flex items-center">{quote!.siteSnapshot?.name ?? '—'}</p>
                                ) : (
                                    <select
                                        value={siteId}
                                        onChange={e => setSiteId(e.target.value)}
                                        disabled={!client || sites.length === 0}
                                        className="w-full h-9 px-3 border border-[var(--border)] rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 focus:border-[var(--primary)]/40 transition-all disabled:opacity-50"
                                    >
                                        <option value="">{!client ? 'Select a client first' : sites.length === 0 ? 'No sites for this client' : 'Select site…'}</option>
                                        {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                )}
                            </div>

                            <div>
                                <FieldLabel text="Quote number" />
                                <div className="relative">
                                    <input
                                        readOnly
                                        value={isEditingExisting ? quote!.quoteNumber : 'Generated on save'}
                                        className="w-full h-9 px-3 pr-9 border border-[var(--border)] rounded-lg text-sm font-mono bg-muted text-muted-foreground cursor-default"
                                    />
                                    <Lock size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                                </div>
                            </div>

                            <div>
                                <Input
                                    label="Valid until"
                                    type="date"
                                    value={validUntil}
                                    onChange={e => setValidUntil(e.target.value)}
                                    disabled={readOnly}
                                />
                                <FieldErr msg={errors.validUntil} />
                            </div>

                            <div className="sm:col-span-2">
                                <Input
                                    label="Quote title"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Weekly office cleaning services"
                                    disabled={readOnly}
                                />
                                <FieldErr msg={errors.title} />
                            </div>

                            <div className="sm:col-span-2">
                                <FieldLabel text="Description" optional />
                                <Textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={2}
                                    placeholder="Short summary of the proposed work…"
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Billing type */}
                    <Card label="Billing type" sub="Internal only — used if this quote is later converted into a job. It's calculated from your quote items below, not an extra charge on top of them.">
                        <div className="flex flex-col gap-4">
                            <div className="inline-flex bg-muted rounded-lg p-0.5 gap-0.5 w-fit">
                                {(['hourly', 'fixed'] as const).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        disabled={readOnly}
                                        onClick={() => setChargeType(t)}
                                        className={`h-8 px-5 rounded-md text-sm font-semibold transition-all disabled:opacity-60 ${chargeType === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t === 'hourly' ? 'Hourly' : 'Fixed price'}
                                    </button>
                                ))}
                            </div>

                            {chargeType === 'hourly' ? (
                                <div className="max-w-[260px]">
                                    <FieldLabel text="Effective hourly rate" />
                                    <p className="text-sm font-semibold text-foreground h-9 flex items-center">
                                        {totalQty > 0 ? `${formatCurrency(derivedHourlyRate)} / hour` : '—'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Quote items total ÷ total quantity. Not shown to the client.</p>
                                </div>
                            ) : (
                                <div className="max-w-[260px]">
                                    <FieldLabel text="Fixed job amount" />
                                    <p className="text-sm font-semibold text-foreground h-9 flex items-center">
                                        {subtotal > 0 ? formatCurrency(derivedFixedAmount) : '—'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Same as your quote items subtotal below. Not shown to the client.</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Line items */}
                    <Card label="Quote items" aside={<span className="text-xs text-muted-foreground">Qty × Unit price = Amount</span>}>
                        <div className="grid grid-cols-[1fr_72px_112px_96px_28px] gap-1.5 mb-1">
                            {['Description', 'Qty', 'Unit price', 'Amount', ''].map((h, i) => (
                                <p key={i} className={`text-[10px] font-bold text-muted-foreground uppercase tracking-wider ${i >= 1 && i <= 3 ? 'text-right' : ''}`}>{h}</p>
                            ))}
                        </div>

                        <div>
                            {items.map(li => (
                                <LineRow
                                    key={li.key}
                                    item={li}
                                    onChange={v => updateItem(li.key, v)}
                                    onDelete={() => removeItem(li.key)}
                                    deletable={items.length > 1}
                                    disabled={readOnly}
                                />
                            ))}
                        </div>
                        <FieldErr msg={errors.items} />

                        {!readOnly && (
                            <button
                                type="button"
                                onClick={() => setItems(p => [...p, newItem()])}
                                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)]/80 hover:text-[var(--primary)] transition-colors"
                            >
                                <Plus size={13} /> Add line item
                            </button>
                        )}

                        <div className="mt-6 pt-5 border-t border-[var(--border)]">
                            <div className="w-64 ml-auto">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs text-muted-foreground font-semibold">Tax</span>
                                    <div className="flex items-center gap-2">
                                        {vatPreset === 'custom' && (
                                            <div className="relative w-16">
                                                <input
                                                    type="number" min={0} max={100}
                                                    value={customVatRate}
                                                    onChange={e => setCustomVatRate(parseFloat(e.target.value) || 0)}
                                                    disabled={readOnly}
                                                    className="w-full h-7 pl-2 pr-5 border border-[var(--border)] rounded-md text-xs text-right text-foreground bg-card focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/15"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                                            </div>
                                        )}
                                        <select
                                            value={vatPreset}
                                            onChange={e => setVatPreset(e.target.value as VatPreset)}
                                            disabled={readOnly}
                                            className="h-7 pl-2.5 pr-3 border border-[var(--border)] rounded-md text-xs text-foreground bg-card focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/15 disabled:opacity-60"
                                        >
                                            {VAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="border border-[var(--border)] rounded-lg overflow-hidden text-sm">
                                    <div className="flex items-center justify-between px-3.5 py-2 bg-muted/50">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="tabular-nums text-foreground font-medium">{formatCurrency(subtotal)}</span>
                                    </div>
                                    {taxRate > 0 && (
                                        <div className="flex items-center justify-between px-3.5 py-2 border-t border-[var(--border)] bg-muted/50">
                                            <span className="text-muted-foreground">VAT {taxRate}%</span>
                                            <span className="tabular-nums text-foreground">{formatCurrency(vatAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between px-3.5 py-3 border-t-2 border-[var(--border)] bg-card">
                                        <span className="text-sm font-bold text-foreground">Total</span>
                                        <span className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Notes & terms */}
                    <Card label="Notes & terms">
                        <div className="flex flex-col gap-4">
                            <div>
                                <FieldLabel text="Note to client" optional />
                                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Thank you for the opportunity to quote for this work…" disabled={readOnly} />
                                <p className="text-xs text-muted-foreground mt-1">Shown on the client-facing quote.</p>
                            </div>
                            <div>
                                <FieldLabel text="Terms & conditions" optional />
                                <Textarea value={terms} onChange={e => setTerms(e.target.value)} rows={3} disabled={readOnly} />
                                <p className="text-xs text-muted-foreground mt-1">Shown below the quote total.</p>
                            </div>
                            <label className="flex items-start gap-2.5 pt-2 border-t border-[var(--border)] cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={sendThankYouEmail}
                                    onChange={e => setSendThankYouEmail(e.target.checked)}
                                    disabled={readOnly}
                                    className="w-4 h-4 mt-0.5 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer shrink-0 disabled:cursor-not-allowed"
                                />
                                <div>
                                    <p className="text-sm font-medium text-foreground">Send a thank-you email to the client after they accept</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Sent automatically the moment they click Accept on the public quote page.</p>
                                </div>
                            </label>
                            {sendThankYouEmail && (
                                <div className="pl-[26px]">
                                    <FieldLabel text="Extra message (optional)" optional />
                                    <Textarea
                                        value={thankYouMessage}
                                        onChange={e => setThankYouMessage(e.target.value)}
                                        rows={3}
                                        maxLength={1000}
                                        placeholder="Add a personal note to include in the thank-you email…"
                                        disabled={readOnly}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Appended below the default thank-you message.</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {quote?.status === 'accepted' && (
                        <Card
                            label="Jobs created from this quote"
                            aside={jobsFromQuote.length > 0 && (
                                <span className="text-xs text-muted-foreground">{jobsFromQuote.length} job{jobsFromQuote.length === 1 ? '' : 's'}</span>
                            )}
                        >
                            {jobsFromQuoteQuery.isLoading ? (
                                <div className="flex flex-col gap-2">
                                    {Array.from({ length: 2 }).map((_, i) => (
                                        <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)]">
                                            <div className="min-w-0 flex flex-col gap-1.5 flex-1">
                                                <Skeleton className="h-3.5 w-2/5" />
                                                <Skeleton className="h-3 w-3/5" />
                                            </div>
                                            <Skeleton className="w-3.5 h-3.5 rounded-sm shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            ) : jobsFromQuote.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-sm text-muted-foreground mb-3">The client has approved this quote. Create a job to schedule and assign the work.</p>
                                    <Button size="sm" onClick={() => navigate(`/create-job?quote=${quote._id}`)}>
                                        <Briefcase size={13} /> Create job
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {jobsFromQuote.map(job => (
                                        <Link
                                            key={job._id}
                                            to={`/jobs/${job._id}`}
                                            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-muted/40 transition-colors"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{job.title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {formatDate(job.date, 'D MMM YYYY')} · {job.startTime}–{job.endTime} · <span className="capitalize">{job.status}</span>
                                                </p>
                                            </div>
                                            <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                                        </Link>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/create-job?quote=${quote._id}`)}
                                        className="flex items-center justify-center gap-1.5 h-9 text-sm font-semibold text-[var(--primary)] border border-dashed border-[var(--border)] rounded-xl hover:bg-muted/40 transition-colors mt-1"
                                    >
                                        <Plus size={13} /> Create another job
                                    </button>
                                </div>
                            )}
                        </Card>
                    )}

                    {quote?.status === 'declined' && quote.declineReason && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                            <p className="text-xs font-semibold text-rose-800 mb-1">Declined by {quote.declinedBy?.name ?? 'the client'}</p>
                            <p className="text-sm text-rose-700">{quote.declineReason}</p>
                        </div>
                    )}
                    {quote?.status === 'cancelled' && quote.cancellationReason && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-xs font-semibold text-amber-800 mb-1">Cancellation reason</p>
                            <p className="text-sm text-amber-700">{quote.cancellationReason}</p>
                        </div>
                    )}
                </div>

                {/* Right panel */}
                <div className="hidden xl:block">
                    <div className="sticky top-6 bg-card border border-[var(--border)] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--primary)]">
                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Quote summary</p>
                            <p className="font-mono text-sm font-bold text-white mt-0.5">{isEditingExisting ? quote!.quoteNumber : 'New quote'}</p>
                        </div>
                        <div className="px-4 py-4 flex flex-col gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Client</p>
                                <p className="text-xs font-semibold text-foreground">
                                    {isEditingExisting ? quote!.clientSnapshot?.name : client ? client.name : <span className="italic text-muted-foreground">Not selected</span>}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                                <QuoteStatusBadge status={quote?.status ?? 'draft'} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Valid until</p>
                                <p className="text-xs font-semibold text-foreground">{validUntil ? formatDate(validUntil, 'D MMM YYYY') : '—'}</p>
                            </div>
                            {quote?.sentAt && (
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Issued</p>
                                    <p className="text-xs font-semibold text-foreground">{formatDate(quote.createdAt, 'D MMM YYYY')}</p>
                                </div>
                            )}
                            <div className="border-t border-[var(--border)] pt-3">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                                <p className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(total)}</p>
                                {taxRate > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">incl. {taxRate}% VAT</p>}
                            </div>
                            <Button variant="outline" size="sm" disabled={downloading || !quote} onClick={handleDownloadPdf} className="w-full">
                                {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Download PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
