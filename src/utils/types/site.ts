export type SiteStatus = 'active' | 'inactive'

export interface SiteAddress {
  line1?: string
  line2?: string
  city?: string
  county?: string
  postcode?: string
  country?: string
}

export interface SiteContact {
  name?: string
  phone?: string
  email?: string
}

export interface SiteClientRef {
  _id: string
  name: string
  status?: SiteStatus
}

export interface Site {
  _id: string
  company: string
  client: SiteClientRef | string
  name: string
  address?: SiteAddress
  formattedAddress?: string
  coordinates?: { lat: number; lng: number }
  geofenceMode?: 'off' | 'warn' | 'enforce' | null
  geofenceRadiusMeters?: number | null
  contact?: SiteContact
  instructions?: string
  accessInstructions?: string
  parkingInstructions?: string
  status: SiteStatus
  createdAt: string
  updatedAt: string
}

// The slim shape a Job carries once it's site-backed — historical facts as
// they were at scheduling time, never re-synced from the live Site.
export interface JobSiteSnapshot {
  name?: string
  contact?: SiteContact
  accessInstructions?: string
  parkingInstructions?: string
}
