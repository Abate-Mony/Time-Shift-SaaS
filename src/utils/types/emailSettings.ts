export type EmailProvider = 'inprn' | 'custom'
export type DomainStatus = 'not_connected' | 'pending' | 'verified' | 'failed'

// Normalized by the backend from Resend's own DNS record shape — never
// depend on provider-specific fields beyond these, see resendDomain.ts.
export interface DnsRecord {
  type: string
  name: string
  value: string
  priority?: number
  status: 'pending' | 'verified' | 'failed'
}

export interface EmailSettings {
  provider: EmailProvider
  senderName: string
  senderEmail: string
  replyToEmail: string
  sendingDomain: string
  domainStatus: DomainStatus
  verifiedAt: string | null
  lastVerificationCheckAt: string | null
}

export interface EmailSettingsResponse {
  success: boolean
  settings: EmailSettings
  dnsRecords: DnsRecord[]
}

export interface SendTestEmailResult {
  success: boolean
  usingCustomDomain: boolean
  sender: string
}
