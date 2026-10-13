export type ClientRole = "owner" | "manager" | "booking" | "billing" | "viewer"
export type PortalInvitationStatus = "pending" | "accepted" | "expired" | "revoked"

export interface PortalUser {
  _id: string
  fullname: string
  email: string
  clientRole: ClientRole
  isActive: boolean
  lastLogin?: string | null
  createdAt: string
}

export interface PortalInvitation {
  _id: string
  email: string
  fullname?: string
  clientRole: ClientRole
  status: PortalInvitationStatus
  invitedBy?: { fullname: string } | null
  expiresAt: string
  createdAt: string
}

export const CLIENT_ROLE_LABELS: Record<ClientRole, string> = {
  owner: "Owner",
  manager: "Manager",
  booking: "Booking",
  billing: "Billing",
  viewer: "Viewer",
}
