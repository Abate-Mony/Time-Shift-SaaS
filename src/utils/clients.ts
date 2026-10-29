import customFetch from "@/utils/customFetch"
import type { Client } from "@/utils/types/client"
import type { LeadQuoteRef } from "@/utils/types/lead"
import type { Invoice } from "@/utils/types"

export interface ClientListResponse {
  clients: Client[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ClientStats {
  totalJobs: number
  upcomingJobs: number
  totalInvoiced: number
  outstandingBalance: number
}

export interface ClientRecentJob {
  _id: string
  title: string
  date: string
  status: string
}

export interface ClientDetailResponse {
  client: Client
  stats: ClientStats
  recentJobs: ClientRecentJob[]
  // Same shape the Lead detail page already uses — includes quotes a
  // public-wizard resubmission created for this client, alongside
  // hand-built ones (see time_sheet_server's clientController.ts getClient).
  quotes: LeadQuoteRef[]
}

// The Clients management page fetches a generous single page and
// filters/searches client-side (same pattern as Team/RecurringJobs this
// session) — a company's client list is a small, manageable set.
export const clientsQuery = () => ({
  queryKey: ["clients"],
  queryFn: async (): Promise<ClientListResponse> => {
    const { data } = await customFetch.get<ClientListResponse>("/clients", {
      params: { limit: 100 },
    })
    return data
  },
})

export const clientDetailQuery = (id: string) => ({
  queryKey: ["client", id],
  queryFn: async (): Promise<ClientDetailResponse> => {
    const { data } = await customFetch.get<ClientDetailResponse>(`/clients/${id}`)
    return data
  },
})

export interface ClientInvoicesResponse {
  invoices: Invoice[]
  page: number
  limit: number
  total: number
  totalPages: number
}

// Same /invoices endpoint and response shape the main Invoices page uses,
// just pre-filtered to one client — not folded into clientDetailQuery above
// since it's paginated and the Invoices tab only needs it when visited.
export const clientInvoicesQuery = (clientId: string, page: number) => ({
  queryKey: ["client-invoices", clientId, page],
  queryFn: async (): Promise<ClientInvoicesResponse> => {
    const { data } = await customFetch.get<ClientInvoicesResponse>("/invoices", {
      params: { client: clientId, sort: "issueDate_desc", page, limit: 20 },
    })
    return data
  },
})

// The backend enforces one client name per company but doesn't hand back the
// existing record on conflict — just a message. Re-searching by the exact
// name is the only way to offer "use the existing one" instead of leaving
// the manager stuck rereading a rejected form.
export const findClientByExactName = async (name: string): Promise<Client | null> => {
  try {
    const { data } = await customFetch.get<{ clients: Client[] }>("/clients", {
      params: { search: name, limit: 5 },
    })
    return data.clients.find(c => c.name.toLowerCase() === name.toLowerCase()) ?? null
  } catch {
    return null
  }
}

export const isDuplicateClientError = (msg?: string | null): boolean =>
  !!msg && /already exists/i.test(msg)
