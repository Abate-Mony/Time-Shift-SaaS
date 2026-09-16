export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'cancelled'
export type QuoteChargeType = 'hourly' | 'fixed'

export interface QuoteAddress {
  line1?: string
  line2?: string
  city?: string
  county?: string
  postcode?: string
  country?: string
}

// Frozen at send time — see the backend's quoteModel.ts. Never rewritten by
// a later edit to the live Client/Site record.
export interface QuoteClientSnapshot {
  name: string
  billingEmail?: string
  vatNumber?: string
  phone?: string
  contactName?: string
  address?: QuoteAddress
}

export interface QuoteSiteSnapshot {
  name?: string
  contact?: { name?: string; phone?: string; email?: string }
  address?: QuoteAddress
  accessInstructions?: string
  parkingInstructions?: string
}

export interface QuoteLineItem {
  description: string
  quantity: number
  unitPrice: number
  // Server-computed (quantity × unitPrice) — never sent as part of a
  // create/update payload, see QuoteLineItemInput below.
  amount: number
}

export interface QuotePersonRef {
  name: string
  email: string
}

// Server-side quote: what GET /quotes and GET /quotes/:id return.
export interface Quote {
  _id: string
  quoteNumber: string
  status: QuoteStatus
  // Display name, not an id — the backend's serializeQuote overrides this
  // to clientSnapshot.name, same convention as Invoice.client.
  client: string
  clientSnapshot?: QuoteClientSnapshot
  site?: string | null
  siteSnapshot?: QuoteSiteSnapshot
  title: string
  description?: string
  // The canonical billing basis (mirrors Job's chargeType/chargeRate/
  // chargeAmount) — independent from `items` below, which is only the
  // client-facing breakdown.
  chargeType: QuoteChargeType
  chargeRate?: number
  chargeAmount?: number
  items: QuoteLineItem[]
  subtotal: number
  taxRate?: number
  taxAmount?: number
  total: number
  currency: string
  validUntil: string
  notes?: string
  terms?: string
  // Checkbox set at creation/edit time — whether accepting this quote
  // triggers a thank-you email to the client. thankYouMessage exists on
  // the backend schema too but has no UI yet (future custom-message
  // update), so it's deliberately not exposed here.
  sendThankYouEmailOnAccept?: boolean
  sentAt?: string | null
  viewedAt?: string | null
  acceptedAt?: string | null
  declinedAt?: string | null
  declineReason?: string
  acceptedBy?: QuotePersonRef
  declinedBy?: QuotePersonRef
  cancelledAt?: string | null
  cancellationReason?: string
  createdAt: string
  updatedAt: string
}

export interface QuoteLineItemInput {
  description: string
  quantity: number
  unitPrice: number
}

// Payload shape for POST /quotes and PATCH /quotes/:id — amounts/totals are
// never sent, the backend always computes them from items + taxRate.
export interface QuoteFormInput {
  client: string
  site?: string
  title: string
  description?: string
  chargeType: QuoteChargeType
  chargeRate?: number
  chargeAmount?: number
  items: QuoteLineItemInput[]
  taxRate?: number
  validUntil: string
  notes?: string
  terms?: string
  sendThankYouEmailOnAccept?: boolean
}

export interface QuoteListResponse {
  success: boolean
  quotes: Quote[]
  page: number
  limit: number
  total: number
  totalPages: number
}

// A subset of the InvoiceTemplate fields, frozen onto the quote at send
// time — see the backend's templateSnapshot. Drives the accent color on
// the public document so it matches whatever branded template the company
// actually sent, rather than a hardcoded look.
export interface QuoteTemplateSnapshot {
  name?: string
  baseLayout?: 'modern' | 'classic' | 'minimal'
  accentColor?: string
  font?: string
  logoPosition?: string
  showVatBreakdown?: boolean
  showPaymentTerms?: boolean
  showNotes?: boolean
}

// What GET /quotes/public/:token returns — a deliberately narrow, allow-
// listed view of the quote (no ids, no createdBy, no internal billing
// basis, no cancellationReason). Succeeds for terminal statuses too, so
// the public page can render the real outcome instead of a dead end.
export interface PublicQuote {
  quoteNumber: string
  status: QuoteStatus
  title: string
  description?: string
  client?: QuoteClientSnapshot
  site?: QuoteSiteSnapshot
  items: QuoteLineItem[]
  subtotal: number
  taxRate?: number
  taxAmount?: number
  total: number
  currency: string
  validUntil: string
  notes?: string
  terms?: string
  template?: QuoteTemplateSnapshot
  sentAt?: string | null
  viewedAt?: string | null
  acceptedAt?: string | null
  acceptedBy?: QuotePersonRef
  declinedAt?: string | null
  declinedBy?: QuotePersonRef
  declineReason?: string
}

export interface PublicQuoteResponse {
  success: boolean
  quote: PublicQuote
  company: { name: string; phone?: string } | null
}

export interface PublicQuoteRespondPayload {
  action: 'accept' | 'decline'
  name: string
  email: string
  declineReason?: string
}
