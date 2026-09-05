import customFetch from "@/utils/customFetch"
import type { DateRange } from "@/layouts/ReportLayout"

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
}

export interface ReportsPayrollResponse {
  workers: ReportsPayrollWorker[]
  totalPayout: number
}

export interface ReportsTimesheetRow {
  assignmentId: string
  worker: string
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
