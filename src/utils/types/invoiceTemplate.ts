export type InvoiceTemplateBaseLayout = 'modern' | 'classic' | 'minimal'
export type InvoiceTemplateFont = 'Helvetica' | 'Times-Roman' | 'Inter'
export type InvoiceTemplateLogoPosition = 'top-left' | 'top-center' | 'top-right'

// Mirrors invoiceTemplateModel.ts's flat fields exactly. Shared by both the
// invoice and quote pickers — same InvoiceTemplate pool on the backend, see
// quoteModel.ts's comment on why.
export interface InvoiceTemplate {
    _id: string
    name: string
    baseLayout: InvoiceTemplateBaseLayout
    accentColor: string
    font: InvoiceTemplateFont
    logoPosition: InvoiceTemplateLogoPosition
    showVatBreakdown: boolean
    showPaymentTerms: boolean
    showNotes: boolean
    isSystemPreset: boolean
    presetKey?: string | null
    company?: string | null
}
