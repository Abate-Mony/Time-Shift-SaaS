import { useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { isAxiosError } from "axios"
import { ChevronLeft } from "lucide-react"
import toast from "react-hot-toast"
import dayjs from "dayjs"
import {
  Form,
  redirect,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
  useSubmit,
  type ActionFunctionArgs,
  type Params,
} from "react-router"

import customFetch from "@/utils/customFetch"
import { createJobSchema } from "@/utils/schemas"
import type { User } from "@/utils/types"
import type { ComboboxClient } from "@/components/client/ClientCombobox"
import { defaultRecurring, type RecurringState } from "@/components/RecurringJobSection"

import { CreateJobProvider, type SelectedWorker } from "@/components/create-job/CreateJobContext"
import { CreateJobStepper } from "@/components/create-job/CreateJobStepper"
import { CreateJobHiddenFields } from "@/components/create-job/CreateJobHiddenFields"
import { WizardFooter } from "@/components/create-job/WizardFooter"
import { JobDetailsStep } from "@/components/create-job/steps/JobDetailsStep"
import { ScheduleStaffingStep } from "@/components/create-job/steps/ScheduleStaffingStep"
import { BillingStep } from "@/components/create-job/steps/BillingStep"
import { PoliciesStep } from "@/components/create-job/steps/PoliciesStep"
import { ReviewStep } from "@/components/create-job/steps/ReviewStep"
import {
  ALL_FIELDS,
  DRAFT_REQUIRED_FIELDS,
  FIELD_STEP_MAP,
  STEP_FIELDS,
  TOTAL_STEPS,
  shiftHoursFrom,
} from "@/components/create-job/wizardConfig"
import { clearAutosavedDraft } from "@/components/create-job/useDraftAutosave"

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────

const workersQuery = (params: Params) => ({
  queryKey: [
    "workers",
    {
      search: params.search ?? "",
      status: params.status ?? "all",
      sort: params.sort ?? "asc",
      page: params.page ?? 1,
      role: "worker",
    },
  ],
  queryFn: async () => {
    const { data } = await customFetch.get<any>("/users/users", {
      params: { ...params, role: "worker" },
    })
    return data
  },
})

// ─────────────────────────────────────────────────────────────
// Action — unchanged payload contract
// ─────────────────────────────────────────────────────────────

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const raw = Object.fromEntries(formData) as Record<string, string>

  const payload: Record<string, unknown> = { ...raw }

  // Invoice fields are handled separately below — not job fields
  delete payload.generateInvoice
  delete payload.invoiceDueDate
  delete payload.invoiceLineItems

  // FormData is all strings — restore the real types
  payload.isRecurring = raw.isRecurring === "true"
  payload.openToClaims = raw.openToClaims === "true"
  payload.requiresApproval = raw.requiresApproval === "true"

  const numeric = [
    "interval",
    "payRate",
    "chargeRate",
    "chargeAmount",
    "requiredWorkers",
    "geofenceRadiusMeters",
    "clockInGraceMinutes",
  ]
  numeric.forEach(key => {
    if (raw[key]) payload[key] = Number(raw[key])
    else delete payload[key]
  })

  const json = ["daysOfWeek", "coordinates"]
  json.forEach(key => {
    if (raw[key]) {
      try {
        payload[key] = JSON.parse(raw[key])
      } catch {
        delete payload[key]
      }
    } else {
      delete payload[key]
    }
  })

  if (!raw.endDate) delete payload.endDate
  if (!raw.frequency) delete payload.frequency
  if (!raw.client) delete payload.client
  if (!raw.supervisor) delete payload.supervisor
  if (!raw.geofenceMode) delete payload.geofenceMode

  try {
    const { data } = await customFetch.post("/jobs", payload)

    toast.success(
      raw.status === "draft" ? "Draft saved" : "Job created successfully!"
    )

    if (raw.generateInvoice === "true" && raw.invoiceLineItems) {
      try {
        const lineItems = JSON.parse(raw.invoiceLineItems)
        const jobId = data?.job?._id ?? data?.templateJob?._id ?? data?._id
        await customFetch.post("/invoices", {
          job: jobId,
          client: raw.client,
          issueDate: dayjs().format("YYYY-MM-DD"),
          dueDate: raw.invoiceDueDate,
          lineItems,
          status: "draft",
        })
        toast.success("Draft invoice created")
      } catch {
        toast.error(
          "Job created, but the invoice could not be generated. You can create it from the job page."
        )
      }
    }

    return redirect("/jobs")
  } catch (err) {
    let errorM
    if (isAxiosError(err)) {
      errorM = err.response?.data?.msg ?? err.response?.data ?? null
    }
    errorM = errorM ?? (err instanceof Error ? err.message : "Something went wrong")
    toast.error(errorM, { position: "bottom-center" })
    return errorM
  }
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export function CreateJob() {
  const navigate = useNavigate()
  const navigation = useNavigation()
  const submit = useSubmit()
  const formRef = useRef<HTMLFormElement>(null)

  // The step lives in the URL, so a refresh keeps you where you were and the
  // browser Back button steps backward rather than leaving the form.
  const [searchParams, setSearchParams] = useSearchParams()
  const currentStep = Math.min(
    Math.max(Number(searchParams.get("step")) || 1, 1),
    TOTAL_STEPS
  )
  const [furthestStep, setFurthestStep] = useState(currentStep)
  const [dir, setDir] = useState(1)
  const [submittingAs, setSubmittingAs] = useState<"draft" | "published" | null>(null)
  const submitGuardRef = useRef(false)

  const isFormSubmitting =
    navigation.state === "submitting" || navigation.state === "loading"

  const { searchValues } = useLoaderData() as any
  const { users = [] } = (useQuery(workersQuery(searchValues)).data ?? {}) as { users: User[] }

  // ── Local (non-RHF) state ─────────────────────────────────
  const [selectedWorkers, setSelectedWorkers] = useState<SelectedWorker[]>([])
  const [workerOpen, setWorkerOpen] = useState(false)
  const [recurring, setRecurring] = useState<RecurringState>(defaultRecurring)
  const [selectedClient, setSelectedClient] = useState<ComboboxClient | null>(null)
  const [showApplyRate, setShowApplyRate] = useState(false)
  const [previousChargeRate, setPreviousChargeRate] = useState<number | null>(null)
  const [generateInvoice, setGenerateInvoice] = useState(false)
  const [invoiceDueDate, setInvoiceDueDate] = useState(() =>
    dayjs().add(14, "day").format("YYYY-MM-DD")
  )
  const [invoiceRates, setInvoiceRates] = useState<Record<string, number>>({})

  const form = useForm({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: "",
      description: "",
      client: "",
      priority: "medium",
      date: "",
      startTime: "",
      endTime: "",
      workers: [],
      location: "",
      address: "",
      coordinates: undefined,
      payRate: 0,
      chargeRate: 0,
      chargeAmount: 0,
      chargeType: "hourly",
      requiredWorkers: 1,
      geofenceMode: undefined,
      geofenceRadiusMeters: 150,
      supervisor: undefined,
      instructions: "",
      notes: "",
      openToClaims: false,
      requiresApproval: true,
      clockInGraceMinutes: undefined,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  })

  const { watch, setValue, trigger, getValues } = form

  const startTime = watch("startTime")
  const endTime = watch("endTime")
  const payRate = watch("payRate") ?? 0
  const chargeRate = watch("chargeRate") ?? 0
  const chargeAmount = watch("chargeAmount") ?? 0
  const chargeType = watch("chargeType") ?? "hourly"

  const shiftHours = shiftHoursFrom(startTime, endTime)
  const totalCost = payRate * shiftHours * Math.max(selectedWorkers.length, 1)
  const totalCharge = chargeType === "fixed" ? chargeAmount : chargeRate * shiftHours
  const margin = totalCharge - totalCost

  const invoiceLineItems = useMemo(
    () =>
      selectedWorkers.map(w => ({
        description: w.fullname,
        hours: shiftHours,
        rate: invoiceRates[w.email] ?? chargeRate,
      })),
    [selectedWorkers, shiftHours, invoiceRates, chargeRate]
  )

  // ── Navigation ─────────────────────────────────────────────

  const goToStep = (step: number) => {
    setDir(step > currentStep ? 1 : -1)
    setFurthestStep(f => Math.max(f, step))
    setSearchParams(
      prev => {
        prev.set("step", String(step))
        return prev
      },
      { replace: false }
    )
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const goNext = async () => {
    const fields = STEP_FIELDS[currentStep] ?? []
    const valid = fields.length ? await trigger(fields as any) : true
    if (!valid) {
      toast.error("Please fix the highlighted fields before continuing.")
      return
    }
    goToStep(Math.min(currentStep + 1, TOTAL_STEPS))
  }

  const goBack = () => goToStep(Math.max(currentStep - 1, 1))

  // ── Submission ─────────────────────────────────────────────

  /**
   * Submits programmatically rather than letting <Form> handle it.
   *
   * The previous version did `await handleSubmit(onValid)(); e.preventDefault()`
   * — but after an await the event has already been handled, so preventDefault
   * came too late and the form submitted regardless of whether validation
   * passed. Here nothing submits until validation has actually resolved.
   */
  const doSubmit = async (status: "draft" | "published") => {
    // navigation.state (isFormSubmitting) only flips once submit() below
    // actually runs — it doesn't cover the awaited trigger() call just
    // above it, so a second click during that gap would otherwise fire a
    // fully independent, concurrent submission.
    if (submitGuardRef.current) return
    submitGuardRef.current = true

    try {
      // Explicit field list, not trigger() with no arguments: RHF only
      // validates fields it has actually register()-ed, and a step that
      // was never mounted this session (landed straight on Review via the
      // URL, or jumped ahead with the stepper) never registers its inputs —
      // so an argument-less trigger() checks nothing for it and resolves
      // true even though the schema would reject the values.
      const fields = status === "draft" ? DRAFT_REQUIRED_FIELDS : ALL_FIELDS
      const valid = await trigger(fields as any)

      if (!valid) {
        const errorFields = Object.keys(form.formState.errors)
        const earliest = Math.min(
          ...errorFields.map(f => FIELD_STEP_MAP[f] ?? TOTAL_STEPS)
        )
        toast.error(
          status === "draft"
            ? "Please fix the highlighted fields before saving."
            : "Please fix the highlighted fields before publishing."
        )
        if (Number.isFinite(earliest) && earliest !== currentStep) goToStep(earliest)
        return
      }

      if (!formRef.current) return

      const fd = new FormData(formRef.current)
      fd.set("status", status)

      // Only the currently active step's <input> elements actually exist in
      // the DOM (each step unmounts when you're on another one), so a
      // FormData built from the DOM alone is missing every field owned by
      // an inactive step — which, since submission only ever happens from
      // Review, means everything from steps 1-4. RHF's own state doesn't
      // have that problem, so layer the real values on top from there.
      // "client" is excluded: it isn't a registered field at all (the
      // combobox drives `selectedClient` directly), so RHF's copy is just
      // the untouched default and would stomp the correct hidden input.
      const values = getValues() as Record<string, unknown>
      for (const key of ALL_FIELDS) {
        if (key === "client") continue
        const v = values[key]
        if (v === undefined || v === null || v === "") continue
        fd.set(key, typeof v === "object" ? JSON.stringify(v) : String(v))
      }

      setSubmittingAs(status)
      clearAutosavedDraft()
      submit(fd, { method: "post" })
    } finally {
      submitGuardRef.current = false
    }
  }

  // ── Client rate handling ──────────────────────────────────

  const handleClientSelect = (client: ComboboxClient | null) => {
    setSelectedClient(client)
    setShowApplyRate(false)

    if (!client?.defaultChargeRate) return

    const current = getValues("chargeRate") ?? 0

    if (current && current !== client.defaultChargeRate) {
      // Already has a rate that differs — ask before overwriting
      setPreviousChargeRate(current)
      setShowApplyRate(true)
      return
    }

    applyRateFrom(client)
  }

  /** Writes to RHF, not just local state — the previous version updated only
   *  the prompt's state, so applying a client rate changed nothing. */
  const applyRateFrom = (client: ComboboxClient) => {
    if (client.defaultChargeType) {
      setValue("chargeType", client.defaultChargeType, { shouldValidate: true })
    }
    if (client.defaultChargeType === "fixed") {
      setValue("chargeAmount", client.defaultChargeRate ?? 0, { shouldValidate: true })
    } else {
      setValue("chargeRate", client.defaultChargeRate ?? 0, { shouldValidate: true })
    }
  }

  const applyClientRate = () => {
    if (selectedClient) applyRateFrom(selectedClient)
    setShowApplyRate(false)
  }

  const keepCurrentRate = () => setShowApplyRate(false)

  // ── Workers ────────────────────────────────────────────────

  const toggleWorker = (email: string) => {
    const exists = selectedWorkers.some(w => w.email === email)
    const next = exists
      ? selectedWorkers.filter(w => w.email !== email)
      : (() => {
          const worker = users.find(w => w.email === email)
          return worker
            ? [
                ...selectedWorkers,
                {
                  fullname: worker.fullname,
                  email: worker.email,
                  phone: "",
                  worker: worker._id,
                },
              ]
            : selectedWorkers
        })()

    setSelectedWorkers(next)
    setValue("workers", next as any, { shouldValidate: true })
  }

  // ── Render ─────────────────────────────────────────────────

  const stepVariants = {
    enter: (d: number) => ({ x: d > 0 ? 16 : -16, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -16 : 16, opacity: 0 }),
  }

  const ctx = {
    form,
    users,
    selectedWorkers,
    toggleWorker,
    workerOpen,
    setWorkerOpen,
    recurring,
    setRecurring,
    selectedClient,
    handleClientSelect,
    showApplyRate,
    previousChargeRate,
    applyClientRate,
    keepCurrentRate,
    generateInvoice,
    setGenerateInvoice,
    invoiceDueDate,
    setInvoiceDueDate,
    invoiceRates,
    setInvoiceRates,
    invoiceLineItems,
    shiftHours,
    totalCost,
    totalCharge,
    margin,
    goToStep,
  }

  return (
    <CreateJobProvider value={ctx}>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto animate-fade-in min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/jobs")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight truncate">
              Create new job
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 truncate">
              Fill in the details to assign work to your team
            </p>
          </div>
        </div>

        <CreateJobStepper
          currentStep={currentStep}
          furthestStep={furthestStep}
          onStepClick={goToStep}
        />

        {/* Submission is driven by doSubmit(), not by the browser — see the
            comment there. onSubmit is a belt-and-braces guard against a stray
            Enter keypress submitting a half-filled form. */}
        <Form
          ref={formRef}
          method="post"
          onSubmit={e => e.preventDefault()}
          className="min-w-0"
        >
          {/* Rendered once, outside the steps, so unmounting a step can't
              silently drop values from the submitted FormData */}
          <CreateJobHiddenFields />

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={currentStep}
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="min-w-0"
            >
              {currentStep === 1 && <JobDetailsStep />}
              {currentStep === 2 && <ScheduleStaffingStep />}
              {currentStep === 3 && <BillingStep />}
              {currentStep === 4 && <PoliciesStep />}
              {currentStep === 5 && <ReviewStep />}
            </motion.div>
          </AnimatePresence>

          <WizardFooter
            currentStep={currentStep}
            isSubmitting={isFormSubmitting}
            submittingAs={submittingAs}
            onBack={goBack}
            onNext={goNext}
            onSaveDraft={() => doSubmit("draft")}
            onPublish={() => doSubmit("published")}
            onCancel={() => navigate("/jobs")}
          />
        </Form>
      </div>
    </CreateJobProvider>
  )
}
