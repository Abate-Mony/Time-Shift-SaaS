import { createContext, useContext } from "react"
import type { UseFormReturn } from "react-hook-form"
import type { RecurringState } from "@/components/RecurringJobSection"
import type { ComboboxClient } from "@/components/client/ClientCombobox"
import type { ComboboxSite } from "@/components/site/SiteCombobox"
import type { CreateJobForm, User } from "@/utils/types"

export type SelectedWorker = {
  fullname: string
  email: string
  phone: string
  worker: string
}

/**
 * Context is used here purely to avoid drilling ~15 props through five step
 * components inside a single route. It is NOT a cross-page state store —
 * everything lives in one component tree, so there's nothing to lose on
 * navigation. Durable persistence is the draft record, not this.
 */
export interface CreateJobContextValue {
  form: UseFormReturn<any>

  users: User[]

  selectedWorkers: SelectedWorker[]
  toggleWorker: (email: string) => void
  workerOpen: boolean
  setWorkerOpen: (open: boolean) => void

  recurring: RecurringState
  setRecurring: (next: RecurringState) => void

  selectedClient: ComboboxClient | null
  handleClientSelect: (client: ComboboxClient | null) => void
  showApplyRate: boolean
  previousChargeRate: number | null
  applyClientRate: () => void
  keepCurrentRate: () => void

  // "site" = pick a reusable Site belonging to the selected client; "custom"
  // = the existing one-off address search. Sites are optional — a job never
  // requires one.
  locationMode: "site" | "custom"
  setLocationMode: (mode: "site" | "custom") => void
  selectedSite: ComboboxSite | null
  handleSiteSelect: (site: ComboboxSite | null) => void

  generateInvoice: boolean
  setGenerateInvoice: (on: boolean) => void
  invoiceDueDate: string
  setInvoiceDueDate: (date: string) => void
  invoiceRates: Record<string, number>
  setInvoiceRates: React.Dispatch<React.SetStateAction<Record<string, number>>>
  invoiceLineItems: { description: string; hours: number; rate: number }[]

  // Derived
  shiftHours: number
  totalCost: number
  totalCharge: number
  margin: number

  goToStep: (step: number) => void
}

const CreateJobContext = createContext<CreateJobContextValue | null>(null)

export const CreateJobProvider = CreateJobContext.Provider

export function useCreateJob() {
  const ctx = useContext(CreateJobContext)
  if (!ctx) throw new Error("useCreateJob must be used inside CreateJobProvider")
  return ctx
}
