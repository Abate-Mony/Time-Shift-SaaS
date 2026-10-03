import type { ChargeType, ClientAddress, ClientContact } from "./client"

export type LeadLifecycle = "lead" | "client" | "lost"
export type LeadStage = "new" | "contacted" | "call_booked" | "quote_sent" | "negotiating"
export type LeadSource = "website_quote" | "phone" | "email" | "referral" | "walk_in" | "other"

export interface LeadAssignee {
  _id: string
  fullname: string
  email: string
}

export interface LeadQuoteRef {
  _id: string
  quoteNumber: string
  title: string
  status: "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired" | "cancelled"
  total: number
  currency: string
  validUntil: string
  sentAt?: string | null
  acceptedAt?: string | null
  declinedAt?: string | null
  createdAt: string
}

export interface LeadLifecycleEvent {
  from?: LeadLifecycle
  to: LeadLifecycle
  reason?: string
  at: string
  by?: LeadAssignee | null
}

export interface Lead {
  _id: string
  name: string
  contacts: ClientContact[]
  primaryContact?: ClientContact | null
  phone?: string
  billingEmail?: string
  vatNumber?: string
  address?: ClientAddress
  formattedAddress?: string
  lifecycle: LeadLifecycle
  leadStage: LeadStage | null
  leadSource?: LeadSource
  nextFollowUpAt?: string | null
  lastContactedAt?: string | null
  assignedTo?: LeadAssignee | null
  estimatedValue: number
  convertedAt?: string | null
  lostAt?: string | null
  lostReason?: string
  lifecycleHistory?: LeadLifecycleEvent[]
  isAutomated?: boolean
  notes?: string
  createdBy?: LeadAssignee | null
  createdAt: string
  updatedAt: string
  // Backend defaults, set by convertLeadToClient — only meaningful once converted.
  defaultChargeType?: ChargeType
  defaultChargeRate?: number
  paymentTermsDays?: number
}

export interface LeadListResponse {
  leads: Lead[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface LeadDetailResponse {
  lead: Lead
  quotes: LeadQuoteRef[]
}

export interface LeadSummary {
  openLeads: number
  overdueFollowUps: number
  quotesSent: number
  negotiating: number
  convertedThisMonth: number
  estimatedPipelineValue: number
}

export const STAGE_CONFIG: Record<LeadStage, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
  contacted: { label: "Contacted", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  call_booked: { label: "Call booked", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  quote_sent: { label: "Quote sent", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  negotiating: { label: "Negotiating", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
}

export const SOURCE_CONFIG: Record<LeadSource, { label: string }> = {
  website_quote: { label: "Website Quote" },
  phone: { label: "Phone" },
  email: { label: "Email" },
  referral: { label: "Referral" },
  walk_in: { label: "Walk-in" },
  other: { label: "Other" },
}

export const LOST_REASONS = [
  "Price",
  "No response",
  "Lost to competitor",
  "Not a good fit",
  "Timing",
  "Client cancelled",
  "Other",
]
