import { Button } from '@/components/ui/button'
import { Input } from '../../components/ui'
import customFetch from '@/utils/customFetch'
import { createInvoiceTemplate, updateInvoiceTemplate } from '@/utils/api-request-functions'
import type { InvoiceTemplate, InvoiceTemplateBaseLayout, InvoiceTemplateFont, InvoiceTemplateLogoPosition } from '@/utils/types/invoiceTemplate'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Download, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { TemplatePreviewCard } from './TemplatePreviewCard'

const BASE_LAYOUTS: { value: InvoiceTemplateBaseLayout; label: string; sub: string }[] = [
    { value: 'modern', label: 'Modern', sub: 'Accent header block, bold totals' },
    { value: 'classic', label: 'Classic', sub: 'Ruled table, restrained branding' },
    { value: 'minimal', label: 'Minimal', sub: 'Whitespace, typography-first' },
]

const FONTS: { value: InvoiceTemplateFont; label: string }[] = [
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times-Roman', label: 'Times Roman' },
    { value: 'Inter', label: 'Inter' },
]

const LOGO_POSITIONS: { value: InvoiceTemplateLogoPosition; label: string }[] = [
    { value: 'top-left', label: 'Top left' },
    { value: 'top-center', label: 'Top center' },
    { value: 'top-right', label: 'Top right' },
]

interface TemplateBuilderDialogProps {
    template?: InvoiceTemplate | null
    onClose: () => void
    onSaved: (template: InvoiceTemplate) => void
}

// Same "themed knobs" the 10 system presets use — baseLayout picks which
// of the 3 structural PDF renderers applies, everything else styles on top
// of it. Not a freeform drag-and-drop designer, see the original scoping
// decision this mirrors (themed knobs, not freeform layout design).
export function TemplateBuilderDialog({ template, onClose, onSaved }: TemplateBuilderDialogProps) {
    const isEditing = !!template
    const [name, setName] = useState(template?.name ?? '')
    const [baseLayout, setBaseLayout] = useState<InvoiceTemplateBaseLayout>(template?.baseLayout ?? 'modern')
    const [accentColor, setAccentColor] = useState(template?.accentColor ?? '#1E3A5F')
    const [font, setFont] = useState<InvoiceTemplateFont>(template?.font ?? 'Helvetica')
    const [logoPosition, setLogoPosition] = useState<InvoiceTemplateLogoPosition>(template?.logoPosition ?? 'top-left')
    const [showVatBreakdown, setShowVatBreakdown] = useState(template?.showVatBreakdown ?? true)
    const [showPaymentTerms, setShowPaymentTerms] = useState(template?.showPaymentTerms ?? true)
    const [showNotes, setShowNotes] = useState(template?.showNotes ?? true)
    const [downloading, setDownloading] = useState(false)

    const saveMutation = useMutation({
        mutationFn: () => {
            const payload = { name: name.trim(), baseLayout, accentColor, font, logoPosition, showVatBreakdown, showPaymentTerms, showNotes }
            return isEditing ? updateInvoiceTemplate(template!._id, payload) : createInvoiceTemplate(payload)
        },
        onSuccess: saved => {
            toast.success(isEditing ? 'Template updated' : 'Template created')
            onSaved(saved)
        },
        onError: err => {
            toast.error(isAxiosError(err) ? err.response?.data?.msg ?? "Couldn't save the template." : "Couldn't save the template.")
        },
    })

    const handleDownloadPreview = async () => {
        setDownloading(true)
        try {
            const response = await customFetch.post(
                '/invoice-templates/preview',
                { baseLayout, accentColor, font, logoPosition, showVatBreakdown, showPaymentTerms, showNotes },
                { responseType: 'blob' }
            )
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const a = document.createElement('a')
            a.href = url
            a.download = 'template-preview.pdf'
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(url)
        } catch {
            toast.error("Couldn't generate a preview — try again.")
        } finally {
            setDownloading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                    <h3 className="text-base font-bold text-foreground">{isEditing ? 'Edit template' : 'Create custom template'}</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors"><X size={15} /></button>
                </div>

                <div className="p-5 grid sm:grid-cols-[1fr_180px] gap-6">
                    <div className="flex flex-col gap-4 min-w-0">
                        <Input label="Template name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Our brand navy" />

                        <div>
                            <p className="text-sm font-medium text-foreground mb-1.5">Layout</p>
                            <div className="grid grid-cols-3 gap-2">
                                {BASE_LAYOUTS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setBaseLayout(opt.value)}
                                        className={`text-left p-2.5 rounded-xl border-2 transition-colors ${baseLayout === opt.value ? 'border-[var(--primary)] bg-[var(--primary)]/[0.03]' : 'border-[var(--border)] hover:border-slate-300'}`}
                                    >
                                        <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{opt.sub}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-sm font-medium text-foreground mb-1.5">Accent color</p>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-9 h-9 rounded-lg border border-[var(--border)] cursor-pointer shrink-0" />
                                    <input
                                        value={accentColor}
                                        onChange={e => setAccentColor(e.target.value)}
                                        className="flex-1 h-9 px-2.5 border border-[var(--border)] rounded-lg text-sm text-foreground bg-card font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15"
                                    />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground mb-1.5">Font</p>
                                <select value={font} onChange={e => setFont(e.target.value as InvoiceTemplateFont)} className="w-full h-9 px-2.5 border border-[var(--border)] rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15">
                                    {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-foreground mb-1.5">Logo position</p>
                            <div className="flex bg-muted rounded-lg p-1">
                                {LOGO_POSITIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setLogoPosition(opt.value)}
                                        className={`flex-1 h-8 rounded-md text-xs font-semibold transition-colors ${logoPosition === opt.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-1">
                            {[
                                { key: 'showVatBreakdown', label: 'Show VAT breakdown', value: showVatBreakdown, set: setShowVatBreakdown },
                                { key: 'showPaymentTerms', label: 'Show payment terms / quote terms', value: showPaymentTerms, set: setShowPaymentTerms },
                                { key: 'showNotes', label: 'Show notes', value: showNotes, set: setShowNotes },
                            ].map(row => (
                                <label key={row.key} className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={row.value}
                                        onChange={e => row.set(e.target.checked)}
                                        className="w-4 h-4 rounded border-[var(--border)] accent-[var(--primary)] cursor-pointer"
                                    />
                                    <span className="text-sm text-foreground">{row.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Live preview</p>
                        <TemplatePreviewCard baseLayout={baseLayout} accentColor={accentColor} font={font} logoPosition={logoPosition} />
                        <Button type="button" variant="outline" size="sm" disabled={downloading} onClick={handleDownloadPreview}>
                            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Sample PDF
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2.5 justify-end px-5 pb-5">
                    <Button type="button" variant="outline" onClick={onClose} disabled={saveMutation.isPending}>Cancel</Button>
                    <Button type="button" disabled={!name.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                        {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : isEditing ? 'Save changes' : 'Create template'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
