export type ClientStatus = 'active' | 'inactive'
export type ChargeType = 'hourly' | 'fixed'
export type BillingFrequency = 'per_job' | 'weekly' | 'fortnightly' | 'monthly' | 'manual'

export interface ClientContact {
  name?: string
  role?: string
  email?: string
  phone?: string
  isPrimary: boolean
}

export interface ClientAddress {
  line1?: string
  line2?: string
  city?: string
  county?: string
  postcode?: string
  country?: string
}

export interface Client {
  _id: string
  name: string
  contacts: ClientContact[]
  primaryContact?: ClientContact | null
  phone?: string
  billingEmail?: string
  vatNumber?: string
  address?: ClientAddress
  formattedAddress?: string
  defaultChargeType: ChargeType
  defaultChargeRate: number
  paymentTermsDays: number
  // Default cadence for the eligible-work invoice picker — a preference,
  // not a restriction; manual one-off invoices stay possible regardless.
  billingFrequency?: BillingFrequency
  billingDayOfWeek?: number
  billingDayOfMonth?: number
  status: ClientStatus
  notes?: string
  createdAt: string
  updatedAt: string
  jobCount?: number
  activeJobCount?: number
}