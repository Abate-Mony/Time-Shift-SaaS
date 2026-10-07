// Mirrors time_sheet_server's quoteWorkflowModel.ts plain-data interfaces —
// see that file's module comment for the draft/published split and why
// pricing is additive-only (basePrice + sum(selectedOption.priceDelta),
// always recomputed server-side at submit time).
export type QuoteStepType = 'choice' | 'multiselect' | 'number' | 'text' | 'textarea' | 'date' | 'contact'

export interface QuoteStepOption {
    label: string
    value: string
    priceDelta: number
    order: number
}

export interface QuoteStepNumberConfig {
    min: number
    max: number
    step: number
    // Optional on write (the backend schema defaults it to 0) — always
    // present once hydrated from a saved document.
    pricePerUnit?: number
}

export interface QuoteWorkflowStep {
    id: string
    type: QuoteStepType
    label: string
    subtitle: string
    placeholder: string
    helpText: string
    required: boolean
    order: number
    active: boolean
    options?: QuoteStepOption[]
    numberConfig?: QuoteStepNumberConfig
}

export interface QuoteWorkflowServiceType {
    key: string
    label: string
    description: string
    icon: string
    order: number
    active: boolean
    basePrice: number
    requiresManualQuote: boolean
    // How many of this service's questions the public wizard shows per
    // page — 1 means one question per screen (the original behaviour);
    // higher groups that many consecutive questions onto one page. The
    // contact step is always its own final page regardless of this value.
    questionsPerPage: number
    // What % of the instant estimate to collect as a deposit once a quote
    // for this service is accepted — 0 means no deposit invoice. Only
    // meaningful when requiresManualQuote is false.
    depositPercentage: number
    // Skips the manual "Send quote" review step in the Leads CRM — a
    // submission for this service emails the quote immediately instead.
    autoSendQuoteOnSubmit: boolean
    steps: QuoteWorkflowStep[]
}

export interface QuoteWorkflowState {
    serviceTypes: QuoteWorkflowServiceType[]
}

export interface QuoteWorkflowResponse {
    draft: QuoteWorkflowState
    published: QuoteWorkflowState | null
    publishedAt: string | null
}
