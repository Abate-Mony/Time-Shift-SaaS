export interface ApiKeyInfo {
  _id: string
  name: string
  keyPrefix: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
  revokedAt: string | null
}

export interface CreateApiKeyResponse {
  success: boolean
  apiKey: ApiKeyInfo
  // Only ever present on the create response — shown once, never
  // retrievable again (the backend only stores a hash of it).
  rawKey: string
}
