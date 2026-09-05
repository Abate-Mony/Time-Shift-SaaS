export type ClientStatus = 'active' | 'inactive'
export type ChargeType = 'hourly' | 'fixed'

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
  status: ClientStatus
  notes?: string
  createdAt: string
  updatedAt: string
  jobCount?: number
  activeJobCount?: number
}