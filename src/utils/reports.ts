import customFetch from "@/utils/customFetch"
import type { DateRange } from "@/layouts/ReportLayout"
import type { FileRef } from "@/utils/types"

export interface ReportsOverviewResponse {
  stats: {
    totalHours: number
    jobsCompleted: number
    activeWorkers: number
    avgHoursPerWorker: number
  }
  monthlyTrend: { label: string; hours: number; jobs: number }[]
  jobStatusBreakdown: { status: string; label: string; count: number }[]
  dailyHours: { day: string; hours: number }[]
}

export interface ReportsPayrollWorker {
  workerId: string
  fullname: string
  email: string
  hours: number
  rate: number
  overtimeHours: number
  totalPay: number
  profilePhoto?: FileRef | null
}

export interface ReportsPayrollResponse {
  workers: ReportsPayrollWorker[]
  totalPayout: number
}

export interface ReportsTimesheetRow {
  assignmentId: string
  workerId?: string
  worker: string
  profilePhoto?: FileRef | null
  job: string
  date: string | null
  start: string
  finish: string
  hours: number
}

export interface ReportsTimesheetsResponse {
  rows: ReportsTimesheetRow[]
}

export interface ReportsPerformanceWorker {
  workerId: string
  fullname: string
  hours: number
  jobsCompleted: number
}

export interface ReportsPerformanceResponse {
  workers: ReportsPerformanceWorker[]
}

export const reportsOverviewQuery = (range: DateRange) => ({
  queryKey: ["reports", "overview", range],
  queryFn: async (): Promise<ReportsOverviewResponse> => {
    const { data } = await customFetch.get("/reports/overview", { params: range })
    return data
  },
})

export const reportsPayrollQuery = (range: DateRange) => ({
  queryKey: ["reports", "payroll", range],
  queryFn: async (): Promise<ReportsPayrollResponse> => {
    const { data } = await customFetch.get("/reports/payroll", { params: range })
    return data
  },
})

export const reportsTimesheetsQuery = (range: DateRange) => ({
  queryKey: ["reports", "timesheets", range],
  queryFn: async (): Promise<ReportsTimesheetsResponse> => {
    const { data } = await customFetch.get("/reports/timesheets", { params: range })
    return data
  },
})

export const reportsPerformanceQuery = (range: DateRange) => ({
  queryKey: ["reports", "performance", range],
  queryFn: async (): Promise<ReportsPerformanceResponse> => {
    const { data } = await customFetch.get("/reports/performance", { params: range })
    return data
  },
})

export type RevenueBasis = "invoiced" | "collected"

export interface ReportsProfitabilityClientRow {
  clientId: string
  clientName: string
  revenue: number
  labourCost: number
  profit: number
  marginPercent: number
}

export interface ReportsProfitabilityResponse {
  basis: RevenueBasis
  summary: {
    revenue: number
    labourCost: number
    grossProfit: number
    marginPercent: number
  }
  trend: { label: string; revenue: number; profit: number }[]
  byClient: ReportsProfitabilityClientRow[]
}

export const reportsProfitabilityQuery = (range: DateRange, basis: RevenueBasis, clientId?: string) => ({
  queryKey: ["reports", "profitability", range, basis, clientId ?? "all"],
  queryFn: async (): Promise<ReportsProfitabilityResponse> => {
    const { data } = await customFetch.get("/reports/profitability", {
      params: { ...range, basis, ...(clientId ? { clientId } : {}) },
    })
    return data
  },
})

export type AgingBucket = "current" | "1-30" | "31-60" | "61-90" | "90+"

export interface AgingInvoiceRow {
  invoiceNumber: string
  clientId: string | null
  clientName: string
  dueDate: string | null
  daysOverdue: number
  balanceDue: number
  bucket: AgingBucket
}

export interface AgingClientRow {
  clientId: string | null
  clientName: string
  buckets: Record<AgingBucket, number>
  total: number
  invoiceCount: number
}

export interface ReportsAgingResponse {
  asOf: string
  buckets: Record<AgingBucket, number>
  totalOutstanding: number
  byClient: AgingClientRow[]
  invoices: AgingInvoiceRow[]
}

// Point-in-time snapshot ("as of now") — unlike the other reports, this
// isn't scoped to the Reports page's month picker.
export const reportsAgingQuery = () => ({
  queryKey: ["reports", "aging"],
  queryFn: async (): Promise<ReportsAgingResponse> => {
    const { data } = await customFetch.get("/reports/aging")
    return data
  },
})
