import customFetch from "@/utils/customFetch"
import type { Site } from "@/utils/types/site"

export interface SiteListResponse {
  sites: Site[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface SiteJobSummary {
  _id: string
  title: string
  date: string
  startTime: string
  endTime: string
  status: string
}

export interface SiteDetailResponse {
  site: Site
  upcomingJobs: SiteJobSummary[]
  recentJobs: SiteJobSummary[]
}

// Mirrors clientsQuery — a company's site list is small enough to fetch
// generously and filter/search client-side isn't required since the
// backend already supports ?search/?client/?status server-side.
export const sitesQuery = (params: { client?: string; status?: string; search?: string } = {}) => ({
  queryKey: ["sites", params],
  queryFn: async (): Promise<SiteListResponse> => {
    const { data } = await customFetch.get<SiteListResponse>("/sites", {
      params: { limit: 100, ...params },
    })
    return data
  },
})

export const siteDetailQuery = (id: string) => ({
  queryKey: ["site", id],
  queryFn: async (): Promise<SiteDetailResponse> => {
    const { data } = await customFetch.get<SiteDetailResponse>(`/sites/${id}`)
    return data
  },
})

export const clientSitesQuery = (clientId: string) => ({
  queryKey: ["client-sites", clientId],
  queryFn: async (): Promise<SiteListResponse> => {
    const { data } = await customFetch.get<SiteListResponse>("/sites", {
      params: { client: clientId, limit: 100 },
    })
    return data
  },
})
