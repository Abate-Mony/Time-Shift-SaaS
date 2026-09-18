import { Button } from '@/components/ui/button'
import customFetch from '@/utils/customFetch'
import { getInvoiceTemplates } from '@/utils/api-request-functions'
import { companySettingsQuery } from '@/pages/Settings'
import { TemplatePreviewCard } from './TemplatePreviewCard'
import { useQuery } from '@tanstack/react-query'
import { Check, Download, Loader2, Send, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface SendWithTemplateDialogProps {
    documentType: 'invoice' | 'quote'
    documentId: string
    documentNumber: string
    mode: 'send' | 'resend'
    onClose: () => void
    onConfirm: (templateId: string | undefined) => Promise<boolean>
}

// Shared by Invoice and Quote send/resend — same InvoiceTemplate pool, see
// quoteModel.ts's comment on why. Picking a template here overrides the
// company default for THIS document only, never changes the default itself.
export function SendWithTemplateDialog({ documentType, documentId, documentNumber, mode, onClose, onConfirm }: SendWithTemplateDialogProps) {
    const { data: templates, isLoading } = useQuery({ queryKey: ['invoice-templates'], queryFn: getInvoiceTemplates })
    const { data: companySettingsData } = useQuery(companySettingsQuery)
    const defaultTemplateId = companySettingsData?.settings?.defaultInvoiceTemplate ?? null

    const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
    const [previewing, setPreviewing] = useState(false)
    const [sending, setSending] = useState(false)

    const effectiveId = selectedId ?? defaultTemplateId ?? undefined

    const handlePreview = async () => {
        setPreviewing(true)
        try {
            const url = `/${documentType}s/${documentId}/pdf${effectiveId ? `?template=${effectiveId}` : ''}`
            const response = await customFetch.get(url, { responseType: 'blob' })
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = `${documentNumber}.pdf`
            document.body.appendChild(a)
            a.click()
            a.remove()
            window.URL.revokeObjectURL(blobUrl)
        } catch {
            toast.error("Couldn't download the preview — try again.")
        } finally {
            setPreviewing(false)
        }
    }

    const handleConfirm = async () => {
        setSending(true)
        const ok = await onConfirm(selectedId)
        setSending(false)
        if (ok) onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div className="bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-xl my-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                    <div>
                        <h3 className="text-base font-bold text-foreground">{mode === 'resend' ? 'Resend' : 'Send'} {documentNumber}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Choose a template for this document — the company default stays unchanged.</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors"><X size={15} /></button>
                </div>

                <div className="p-5">
                    {mode === 'resend' && (
                        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
                            <p className="text-xs text-amber-800">Resending invalidates the previous link — only the new email will work.</p>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center py-10 text-muted-foreground"><Loader2 size={20} className="animate-spin" /></div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
                            {templates?.map(template => {
                                const isSelected = effectiveId === template._id
                                const isDefault = !selectedId && template._id === defaultTemplateId
                                return (
                                    <button
                                        key={template._id}
                                        type="button"
                                        onClick={() => setSelectedId(template._id)}
                                        className={`relative flex flex-col gap-1.5 rounded-xl border-2 p-1.5 text-left transition-colors ${isSelected ? 'border-[var(--primary)]' : 'border-transparent hover:border-border'}`}
                                    >
                                        <TemplatePreviewCard baseLayout={template.baseLayout} accentColor={template.accentColor} font={template.font} logoPosition={template.logoPosition} />
                                        <p className="text-[11px] font-medium text-foreground truncate px-0.5">{template.name}</p>
                                        {isDefault && <p className="text-[9px] text-muted-foreground px-0.5">Default</p>}
                                        {isSelected && (
                                            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-sm">
                                                <Check size={11} className="text-white" />
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2.5 px-5 pb-5">
                    <Button type="button" variant="outline" size="sm" disabled={previewing} onClick={handlePreview}>
                        {previewing ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Preview
                    </Button>
                    <div className="flex items-center gap-2.5">
                        <Button type="button" variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
                        <Button type="button" disabled={sending} onClick={handleConfirm}>
                            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />} {mode === 'resend' ? 'Resend' : 'Send'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
