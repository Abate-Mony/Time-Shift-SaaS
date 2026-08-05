// @ts-nocheck
import SearchLocation from '@/components/locationSearchComponent'
import { RecurringJobSection, defaultRecurring } from '@/components/RecurringJobSection'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import customFetch from '@/utils/customFetch'
import { createJobSchema } from '@/utils/schemas'
import type { CreateJobForm, User } from '@/utils/types'
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Calendar, Check, ChevronDown, ChevronLeft, Clock, MapPin, Paperclip, Receipt, Users, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from "react-hook-form"
import toast from 'react-hot-toast'
import { Form, redirect, useLoaderData, useNavigate, type ActionFunctionArgs, type Params } from 'react-router'
import { Avatar, Input } from '../components/ui'
// import { RecurringJobSection, RecurEditModal, defaultRecurring } from '../components/RecurringJobSection'
import type { RecurringState } from '@/components/RecurringJobSection'
import { mapRecurringStateToPayload } from '@/utils/mapRecurringStateToPayload'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import dayjs from 'dayjs'
import { formatCurrency } from '@/utils/format'


// Small reusable error renderer so we don't repeat the same JSX everywhere
const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null
  return <p className="text-sm text-red-500 mt-1">{message}</p>
}

const workersQuery = (params: Params) => {
  const { search, sort, page, status, date } = params
  // comment
  return {
    queryKey: [
      'workers',
      {
        search: search ?? '',
        status: status ?? 'all',
        sort: sort ?? 'asc',
        page: page ?? 1,
        date: date ?? ''
      }
    ],
    queryFn: async () => {
      const { data } = await customFetch.get<any>('/users/users', { params })
      return data
    }
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const raw = Object.fromEntries(formData) as Record<string, string>

  const payload: Record<string, unknown> = { ...raw }

  // Invoice fields are handled separately below — don't send them as job fields
  delete payload.generateInvoice
  delete payload.invoiceDueDate
  delete payload.invoiceLineItems

  // Recurring fields arrive as strings from FormData — convert back to real types
  payload.isRecurring = raw.isRecurring === 'true'
  if (raw.interval) payload.interval = Number(raw.interval)
  if (raw.daysOfWeek) {
    try {
      payload.daysOfWeek = JSON.parse(raw.daysOfWeek)
    } catch {
      delete payload.daysOfWeek
    }
  }
  if (!raw.endDate) delete payload.endDate
  if (!raw.frequency) delete payload.frequency

  try {
    const { data } = await customFetch.post("/jobs", payload)
    toast.success('Job created successfully!')

    if (raw.generateInvoice === 'true' && raw.invoiceLineItems) {
      try {
        const lineItems = JSON.parse(raw.invoiceLineItems)
        const jobId = data?.job?._id ?? data?._id
        await customFetch.post("/invoices", {
          job: jobId,
          client: raw.company,
          issueDate: dayjs().format("YYYY-MM-DD"),
          dueDate: raw.invoiceDueDate,
          lineItems,
          status: "draft",
        })
        toast.success('Draft invoice created')
      } catch {
        // Job was created successfully either way — surface the invoice failure separately
        toast.error('Job created, but the invoice could not be generated. You can create it from the job page.')
      }
    }

    return redirect("/jobs")
  } catch (err) {
    let errorM
    if (isAxiosError(err)) {
      errorM = err.response?.data?.msg ?? err.response?.data ?? null
    }
    errorM = errorM ?? (err instanceof Error ? err.message : "Something went wrong")
    toast.error(errorM, { position: 'bottom-center' })
    return errorM
  }
}

export function CreateJob() {
  const [selectedWorkers, setSelectedWorkers] = useState<CreateJobForm["workers"]>([])
  const [workerOpen, setWorkerOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [generateInvoice, setGenerateInvoice] = useState(false)
  const [invoiceDueDate, setInvoiceDueDate] = useState(() => dayjs().add(14, 'day').format('YYYY-MM-DD'))
  const [invoiceRates, setInvoiceRates] = useState<Record<string, number>>({})
  const navigate = useNavigate()
  const onNavigate = (path: string) => navigate(path)
  const isEdit = false
  const [recurring, setRecurring] = useState<RecurringState>(() =>
    isEdit
      ? { ...defaultRecurring(), enabled: false, pattern: 'weekly', weekdays: ['Mon', 'Wed', 'Fri'], endType: 'never' }
      : defaultRecurring()
  )
  const { searchValues } = useLoaderData() as any

  const { users } = useQuery(workersQuery(searchValues)).data as {
    users: User[]
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: "",
      description: "",
      company: "",
      priority: "medium",
      date: "",
      startTime: "",
      endTime: "",
      workers: [],
      additional_notes: "",
      // siteName: "",
      // address: "",
      // city: "",
      // postcode: "",
      // country: "",
      // latitude: 0,
      // longitude: 0,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  })

  const startTime = watch("startTime")
  const endTime = watch("endTime")
  const priority = watch("priority")
  const date = watch("date") // used both for job date and the recurring summary
  const recurringPayload = mapRecurringStateToPayload(recurring)

  const shiftHours = (() => {
    if (!startTime || !endTime) return 0
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    let mins = (eh * 60 + em) - (sh * 60 + sm)
    if (mins <= 0) mins += 24 * 60
    return mins / 60
  })()

  const invoiceLineItems = selectedWorkers.map(w => ({
    description: w.fullname,
    hours: shiftHours,
    rate: invoiceRates[w.email] ?? 0,
  }))
  const invoiceSubtotal = invoiceLineItems.reduce((sum, li) => sum + li.hours * li.rate, 0)
  const toggleWorker = (id: string) => {
    const exists = selectedWorkers.some((w) => w.email === id);

    const next = exists
      ? selectedWorkers.filter((w) => w.email !== id)
      : (() => {
        const worker = users.find((w) => w.email === id);
        return worker
          ? [...selectedWorkers, {
            fullname: worker.fullname,
            email: worker.email,
            phone: "",
            user: ""

          }]
          : selectedWorkers;
      })();

    setSelectedWorkers(next);
    setValue("workers", next, { shouldValidate: true });
    console.log("values", next, exists, id)
  };
  // Runs only when validation passes; React Router's <Form> then submits
  // to the `action` above as normal.
  const onValid = () => {
    // Nothing extra to do here — RHF has already confirmed the data is valid.
  }


  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in ">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => onNavigate('jobs')} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Create New Job</h1>
          <p className="text-sm text-slate-500 mt-0.5">Fill in the details to assign work to your team</p>
        </div>
      </div>

      <Form
        onSubmit={async (e) => {
          await handleSubmit(onValid)();
          e.preventDefault();
        }}
        className="flex flex-col gap-5"
        method="post"
      >
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold">1</span>
            Job Details
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Input
                label="Job Name"
                placeholder="e.g. Canary Wharf Security — Night Shift"
                {...register("title")}
                className={cn(errors.title && "border-red-500!")}
              />
              <FieldError message={errors.title?.message} />
            </div>

            <div>
              <Textarea
                {...register("description")}
                placeholder="Brief description of the work required..."
                className={cn(errors.description && "border-red-500!")}
              />
              <FieldError message={errors.description?.message} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Company / Client"
                  placeholder="e.g. SecureGuard Ltd"
                  {...register("company")}
                  className={cn(errors.company && "border-red-500!")}
                />
                <FieldError message={errors.company?.message} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  Priority
                </h2>
                <RadioGroup defaultValue={"low"} className="w-fit pl-3 flex  flex-wrap" name='priority'>
                  {[
                    { value: 'low', label: 'Low Priority', className: "text-slate-800" },
                    { value: 'medium', label: 'Medium Priority', className: "text-amber-500" },
                    { value: 'high', label: 'High Priority', className: "text-red-500" },
                  ].map((item) => (
                    <Field orientation="horizontal">
                      <RadioGroupItem value={item.value} id={item.value} />
                      <FieldContent>
                        <FieldLabel htmlFor={item.value} className={
                          cn("font-medium flex flex-col justify-start items-start", item.className)
                        }>
                          {item.label}
                
                        </FieldLabel>
                      </FieldContent>
                    </Field>
                  ))}
                </RadioGroup>
                <FieldError message={errors.priority?.message} />
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold">2</span>
            Location
          </h2>
          <SearchLocation
            onSelect={(location) => {

            }}
          />

          {/* Map placeholder */}
          <div className="mt-3 h-36 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
            <div className="text-center">
              <MapPin size={20} className="text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-400">Map preview will appear here</p>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold">3</span>
            Date & Time
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Input
                label="Date"
                min={dayjs().format("YYYY-MM-DD")}
                type="date"
                icon={<Calendar size={14} />}
                {...register("date")}
                className={cn(errors.date && "border-red-500!")}
              />
              <FieldError message={errors.date?.message} />
            </div>

            <div>
              <Input
                label="Start Time"
                type="time"
                icon={<Clock size={14} />}
                {...register("startTime")}
                className={cn(errors.startTime && "border-red-500!")}
              />
              <FieldError message={errors.startTime?.message} />
            </div>

            <div>
              <Input
                label="End Time"
                type="time"
                icon={<Clock size={14} />}
                {...register("endTime")}
                className={cn(errors.endTime && "border-red-500!")}
              />
              <FieldError message={errors.endTime?.message} />
            </div>
          </div>
          {startTime && endTime && (
            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 flex items-center gap-2">
              <Clock size={14} className="text-blue-500" />
              <p className="text-sm text-blue-700">
                <span className="font-semibold">
                  {(() => {
                    const [sh, sm] = startTime.split(':').map(Number)
                    const [eh, em] = endTime.split(':').map(Number)
                    const mins = (eh * 60 + em) - (sh * 60 + sm)
                    const h = Math.floor(Math.abs(mins) / 60)
                    const m = Math.abs(mins) % 60
                    return `${h}h ${m > 0 ? m + 'm' : ''}`
                  })()}
                </span> shift duration
              </p>
            </div>
          )}
        </div>
        {/* RecuuringJob */}
        <RecurringJobSection
          value={recurring}
          onChange={setRecurring}
          startDate={date}
          sectionIndex={4}
        />
        {/* Hidden inputs carrying the recurring config into FormData */}
        <input type="hidden" name="isRecurring" value={String(recurringPayload.isRecurring)} />
        {recurringPayload.frequency && (
          <input type="hidden" name="frequency" value={recurringPayload.frequency} />
        )}
        {recurringPayload.interval !== undefined && (
          <input type="hidden" name="interval" value={String(recurringPayload.interval)} />
        )}
        {recurringPayload.daysOfWeek && (
          <input type="hidden" name="daysOfWeek" value={JSON.stringify(recurringPayload.daysOfWeek)} />
        )}
        {recurringPayload.endDate && (
          <input type="hidden" name="endDate" value={recurringPayload.endDate} />
        )}


        {/* Workers */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold">4</span>
            Assign Workers
          </h2>

          <button
            type="button"
            onClick={() => setWorkerOpen(!workerOpen)}
            className="w-full flex items-center justify-between h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Users size={14} className="text-slate-400" />
              {selectedWorkers.length > 0 ? `${selectedWorkers.length} worker${selectedWorkers.length > 1 ? 's' : ''} selected` : 'Select workers...'}
            </span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${workerOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* One hidden input per selected worker id, so FormData serializes an array correctly */}
          {selectedWorkers.length && (
            <input type="hidden" name="workers" value={JSON.stringify(selectedWorkers)} />
          )}
          <FieldError message={errors.workers?.message as string | undefined} />

          {workerOpen && (
            <div className="mt-2 border border-[#E2E8F0] rounded-xl overflow-hidden animate-fade-in">
              {users.map((w, i) => {
                const selected = selectedWorkers.find(sw => sw.email == w.email)
                return (
                  <button
                    type="button"
                    key={w._id}
                    onClick={() => toggleWorker(w.email)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-[#F1F5F9] last:border-0 ${selected ? 'bg-blue-50/40' : ''}`}
                  >
                    <Avatar initials={w.fullname.slice(0, 2)} size="sm" index={i} />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-slate-800">{w.fullname}</p>
                      <p className="text-xs text-slate-400">{w.role}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-[#1E3A5F] border-[#1E3A5F]' : 'border-slate-300'}`}>
                      {selected && <Check size={11} className="text-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {selectedWorkers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedWorkers.map(id => {
                const w = users.find(w => w.email === id.email)
                if (!w) return null
                return (
                  <div key={id.email} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full pl-1.5 pr-2 py-0.5">
                    <span className="text-xs font-medium text-blue-700">{w.fullname.split(' ')[0]}</span>
                    <button type="button" onClick={() => toggleWorker(id.email)} className="text-blue-400 hover:text-blue-600">
                      <X size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Invoice */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={generateInvoice}
              onChange={e => setGenerateInvoice(e.target.checked)}
              className="w-4 h-4 rounded border-[#E2E8F0] accent-[#1E3A5F]"
            />
            <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold shrink-0">5</span>
            <span className="flex-1">
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Receipt size={14} className="text-slate-400" /> Generate an invoice for this job
              </span>
              <span className="block text-xs text-slate-400 mt-0.5">Creates a draft invoice using the client and workers above — send it once the job's done</span>
            </span>
          </label>

          {generateInvoice && (
            <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex flex-col gap-4 animate-fade-in">
              <div className="max-w-xs">
                <Input
                  label="Invoice Due Date"
                  type="date"
                  value={invoiceDueDate}
                  onChange={e => setInvoiceDueDate(e.target.value)}
                />
              </div>

              {selectedWorkers.length === 0 ? (
                <p className="text-xs text-amber-600">Select workers above to bill for their hours.</p>
              ) : (
                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <span>Worker</span>
                    <span className="text-right">Hours</span>
                    <span className="text-right">Rate</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {selectedWorkers.map(w => {
                    const rate = invoiceRates[w.email] ?? 0
                    return (
                      <div key={w.email} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-t border-[#F1F5F9] items-center">
                        <span className="text-sm text-slate-700 truncate">{w.fullname}</span>
                        <span className="text-sm text-right text-slate-600">{shiftHours}h</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={rate || ''}
                          onChange={e => setInvoiceRates(prev => ({ ...prev, [w.email]: Number(e.target.value) }))}
                          placeholder="0.00"
                          className="h-8 px-2 border border-[#E2E8F0] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all"
                        />
                        <span className="text-sm text-right font-medium text-slate-900">{formatCurrency(shiftHours * rate)}</span>
                      </div>
                    )
                  })}
                  <div className="flex justify-end px-4 py-3 border-t border-[#F1F5F9] bg-slate-50/50">
                    <span className="text-sm font-bold text-slate-900">Total: {formatCurrency(invoiceSubtotal)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden inputs carrying the invoice config into FormData */}
        <input type="hidden" name="generateInvoice" value={String(generateInvoice)} />
        {generateInvoice && (
          <>
            <input type="hidden" name="invoiceDueDate" value={invoiceDueDate} />
            <input type="hidden" name="invoiceLineItems" value={JSON.stringify(invoiceLineItems)} />
          </>
        )}

        {/* Notes & Attachments */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold">6</span>
            Notes & Attachments
          </h2>
          <Textarea
            {...register("additional_notes")}
            placeholder="Access instructions, equipment needed, special requirements..."
            rows={4}
            className={cn(errors.additional_notes && "border-red-500!")}
          />
          <FieldError message={errors.additional_notes?.message} />

          <button type="button" className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 border border-dashed border-slate-300 rounded-lg w-full py-3 px-4 hover:bg-slate-50 transition-colors">
            <Paperclip size={14} />
            Attach files, documents or images
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end pt-2 pb-6">
          <Button type="button" variant="outline" onClick={() => onNavigate('jobs')}>
            Cancel
          </Button>
          <Button type="submit" name="status-" value="draft" variant="secondary" disabled={isSubmitting}>
            Save as Draft
          </Button>
          <Button type="submit" name="status-" value="published" disabled={isSubmitting}>
            Publish Job
          </Button>
        </div>
      </Form>
    </div>
  )
}
