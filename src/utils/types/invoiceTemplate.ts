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

// Payload for POST /invoice-templates and PATCH /invoice-templates/:id —
// everything but `name` optional (the backend defaults the rest on
// create), never includes isSystemPreset/presetKey/company/_id.
export interface InvoiceTemplateInput {
    name?: string
    baseLayout?: InvoiceTemplateBaseLayout
    accentColor?: string
    font?: InvoiceTemplateFont
    logoPosition?: InvoiceTemplateLogoPosition
    showVatBreakdown?: boolean
    showPaymentTerms?: boolean
    showNotes?: boolean
}
