import { useOutletContext } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Check, Loader2, Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'
import type { iUser } from '@/layouts/dashboardlayout'
import { isAdminRole } from '@/utils/roles'
import { deleteInvoiceTemplate, getInvoiceTemplates, setDefaultInvoiceTemplate } from '@/utils/api-request-functions'
import { TemplatePreviewCard } from '@/components/invoiceTemplates/TemplatePreviewCard'
import { TemplateBuilderDialog } from '@/components/invoiceTemplates/TemplateBuilderDialog'
import { ThumbnailGridSkeleton } from '@/components/ui/skeleton-parts'
import { Button } from '@/components/ui/button'
import type { InvoiceTemplate } from '@/utils/types/invoiceTemplate'
import { companySettingsQuery } from '@/pages/Settings'

export default function InvoicingSettings() {
    const { user } = useOutletContext<{ user: iUser }>()
    const isAdmin = isAdminRole(user?.role)
    const queryClient = useQueryClient()
    const [builderTemplate, setBuilderTemplate] = useState<InvoiceTemplate | null | undefined>(undefined)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const { data: templates, isLoading } = useQuery({
        queryKey: ['invoice-templates'],
        queryFn: getInvoiceTemplates,
        enabled: isAdmin,
    })

    // Same query Settings.tsx's own company-settings page uses — reused
    // here (React Query dedupes by key) rather than re-fetched, so this
    // page works whether it's opened directly or via a click from Settings.
    const { data: companySettingsData } = useQuery({ ...companySettingsQuery, enabled: isAdmin })

    const selectMutation = useMutation({
        mutationFn: setDefaultInvoiceTemplate,
        onSuccess: (defaultInvoiceTemplate) => {
            queryClient.setQueryData(companySettingsQuery.queryKey, (prev: any) =>
                prev ? { ...prev, settings: { ...prev.settings, defaultInvoiceTemplate } } : prev
            )
            toast.success('Default invoice template updated')
        },
        onError: (error) => {
            const message = isAxiosError(error) ? error.response?.data?.msg ?? "Couldn't update the template." : "Couldn't update the template."
            toast.error(message)
        },
    })

    if (!isAdmin) {
        return (
            <div className="p-6 max-w-3xl mx-auto animate-fade-in">
                <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex items-center gap-3 min-w-0">
                    <Lock size={16} className="text-amber-600 shrink-0" />
                    <p className="text-sm text-muted-foreground">You don't have access to this.</p>
                </div>
            </div>
        )
    }

    const currentTemplateId = companySettingsData?.settings?.defaultInvoiceTemplate ?? null

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in flex flex-col gap-4">
            <div className="bg-card rounded-xl border border-[var(--border)] p-6 flex flex-col gap-4 min-w-0">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Invoice Template</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Choose the default look for invoices you send to clients. You can change this any time — invoices you've already sent keep the look they were sent with.
                        </p>
                    </div>
                    <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => setBuilderTemplate(null)}>
                        <Plus size={13} /> New template
                    </Button>
                </div>

                {isLoading ? (
                    <ThumbnailGridSkeleton count={10} />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {templates?.map(template => {
                            const selected = template._id === currentTemplateId
                            const isPending = selectMutation.isPending && selectMutation.variables === template._id
                            const isCustom = !template.isSystemPreset
                            return (
                                <div key={template._id} className="relative group">
                                    <button
                                        type="button"
                                        onClick={() => !selected && selectMutation.mutate(template._id)}
                                        disabled={selectMutation.isPending}
                                        className={`relative w-full flex flex-col gap-1.5 rounded-xl border-2 p-1.5 text-left transition-colors disabled:cursor-not-allowed ${selected
                                            ? 'border-[var(--primary)]'
                                            : 'border-transparent hover:border-border'
                                            }`}
                                    >
                                        <TemplatePreviewCard
                                            baseLayout={template.baseLayout}
                                            accentColor={template.accentColor}
                                            font={template.font}
                                            logoPosition={template.logoPosition}
                                        />
                                        <p className="text-xs font-medium text-foreground truncate px-0.5">{template.name}</p>

                                        {selected && (
                                            <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center shadow-sm">
                                                <Check size={11} className="text-white" />
                                            </span>
                                        )}
                                        {isPending && (
                                            <span className="absolute inset-0 rounded-xl bg-card/70 flex items-center justify-center">
                                                <Loader2 size={16} className="animate-spin text-[var(--primary)]" />
                                            </span>
                                        )}
                                    </button>

                                    {isCustom && (
                                        <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => setBuilderTemplate(template)}
                                                className="w-6 h-6 rounded-full bg-card border border-[var(--border)] flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm"
                                            >
                                                <Pencil size={11} />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={deletingId === template._id}
                                                onClick={async () => {
                                                    if (!window.confirm(`Delete "${template.name}"?`)) return
                                                    setDeletingId(template._id)
                                                    const ok = await deleteInvoiceTemplate(template._id)
                                                    setDeletingId(null)
                                                    if (ok) queryClient.invalidateQueries({ queryKey: ['invoice-templates'] })
                                                }}
                                                className="w-6 h-6 rounded-full bg-card border border-[var(--border)] flex items-center justify-center text-muted-foreground hover:text-red-600 shadow-sm"
                                            >
                                                {deletingId === template._id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {builderTemplate !== undefined && (
                <TemplateBuilderDialog
                    template={builderTemplate}
                    onClose={() => setBuilderTemplate(undefined)}
                    onSaved={() => { setBuilderTemplate(undefined); queryClient.invalidateQueries({ queryKey: ['invoice-templates'] }) }}
                />
            )}
        </div>
    )
}
