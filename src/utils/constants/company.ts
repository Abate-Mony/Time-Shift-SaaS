// Mirrors the backend's BUSINESS_TYPES/COMPANY_SIZES exactly
// (time_sheet_server/src/utils/constant.ts) — the Company enum values a
// mismatch here would get silently rejected by companyProfileSchema's
// .strict() z.enum() on save. Shared by the signup form and the Settings >
// Company profile editor so both read from one list.
export const BUSINESS_TYPES = [
  "Cleaning Company", "Security Company", "Care Agency", "Construction",
  "Hospitality", "Warehouse", "Logistics", "Healthcare", "Retail",
  "Manufacturing", "Education", "Other",
] as const

export const COMPANY_SIZES = [
  "1–10 workers", "11–25 workers", "26–50 workers",
  "51–100 workers", "100+",
] as const
