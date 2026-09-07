import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import customFetch from '@/utils/customFetch'
import { formatCurrency } from '@/utils/format'
import { invoiceSchema } from '@/utils/schemas'
import type { InvoiceForm as InvoiceFormValues } from '@/utils/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import dayjs from 'dayjs'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useNavigate, useParams, useSearchParams, type LoaderFunctionArgs } from 'react-router'
import { Input } from '../components/ui'
import { singleJob } from './EditJobPage'
import { singleInvoice } from './InvoiceDetail'

const FieldError = ({ message }: { message?: string }) => {
    if (!message) return null
    return <p className="text-sm text-red-500 mt-1">{message}</p>
}

export const loader = (queryClient: QueryClient) => async ({ request, params }: LoaderFunctionArgs) => {
    const jobId = new URL(request.url).searchParams.get('jobId')
    if (params.id) {
        await queryClient.ensureQueryData(singleInvoice(params.id))
    } else if (jobId) {
        await queryClient.ensureQueryData(singleJob(jobId))
    }
    return { jobId }
}

export function InvoiceForm() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const invoiceId = useParams().id
    const isEditing = !!invoiceId

    const jobId = searchParams.get('jobId') ?? ''
    const job = useQuery(singleJob(jobId))?.data?.job
    const invoice = useQuery(singleInvoice(invoiceId)).data?.invoice

    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: isEditing
            ? {
                job: invoice?.job ?? '',
                client: invoice?.client ?? '',
                issueDate: invoice?.issueDate ? dayjs(invoice.issueDate).format('YYYY-MM-DD') : '',
                dueDate: invoice?.dueDate ? dayjs(invoice.dueDate).format('YYYY-MM-DD') : '',
                notes: invoice?.notes ?? '',
                lineItems: invoice?.lineItems?.length
                    ? invoice.lineItems
                    : [{ description: '', hours: 0, rate: 0 }],
            }
            : {
                job: jobId,
                // job.client is now a populated Client ref, not free text — the
                // invoice's own `client` field is still a plain string pending
                // its own Client-picker integration (out of scope here), so
                // just prefill the name rather than passing the object through.
                client: job?.client?.name ?? '',
                issueDate: dayjs().format('YYYY-MM-DD'),
                dueDate: dayjs().add(14, 'day').format('YYYY-MM-DD'),
                notes: '',
                // One line for the job's client-facing charge — never the
                // worker's name or internal pay rate, which is what this
                // used to prefill here and would leak payroll data onto a
                // client-facing invoice.
                lineItems: job?.chargeType === 'fixed'
                    ? [{ description: job.title ?? '', hours: 1, rate: job.chargeAmount || 0 }]
                    : [{
                        description: job?.title ?? '',
                        hours: job?.workers?.reduce((sum, w) => sum + (w.hoursWorked || 0), 0) || 0,
                        rate: job?.chargeRate || 0,
                    }],
            },
    })

    const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' })
    const lineItems = watch('lineItems')
    const subtotal = lineItems?.reduce((sum, li) => sum + (Number(li.hours) || 0) * (Number(li.rate) || 0), 0) ?? 0

    const onSubmit = async (data: InvoiceFormValues) => {
        try {
            if (isEditing) {
                await customFetch.patch(`/invoices/${invoiceId}`, data)
                toast.success('Invoice updated successfully')
                await queryClient.invalidateQueries({ queryKey: ['invoices'] })
                await queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
                navigate(`/invoices/${invoiceId}`)
            } else {
                const { data: created } = await customFetch.post('/invoices', data)
                toast.success('Invoice created successfully')
                await queryClient.invalidateQueries({ queryKey: ['invoices'] })
                navigate(`/invoices/${created?.invoice?._id ?? created?._id}`)
            }
        } catch (err) {
            const message =
                isAxiosError(err)
                    ? err.response?.data?.msg ?? err.response?.data?.message ?? 'Something went wrong.'
                    : err instanceof Error
                        ? err.message
                        : 'Something went wrong.'
            toast.error(message)
        }
    }

    // The backend only allows editing a draft — once sent/paid, rewriting it
    // silently would break the audit trail an invoice is supposed to provide.
    if (isEditing && invoice && invoice.status !== 'draft') {
        return (
            <div className="px-2 pt-2.5 lg:p-6 max-w-3xl mx-auto animate-fade-in">
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
                    <p className="text-sm font-semibold text-slate-700 mb-1">This invoice can no longer be edited</p>
                    <p className="text-xs text-slate-400 mb-4">
                        Only draft invoices can be edited — it's already been {invoice.status}.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/${invoiceId}`)}>
                        Back to Invoice
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="px-2 pt-2.5 lg:p-6 max-w-3xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-7">
                <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                        {isEditing ? `Edit Invoice ${invoice?.invoiceNumber ?? ''}` : 'New Invoice'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {isEditing
                            ? 'Update the details below'
                            : job?.title
                                ? `For ${job.title}`
                                : 'Bill a client for a completed job'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <input type="hidden" {...register('job')} />

                {/* Details */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                    <h2 className="text-sm font-semibold text-slate-800 mb-4">Invoice Details</h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                            <Input
                                label="Client"
                                placeholder="e.g. SecureGuard Ltd"
                                {...register('client')}
                                className={cn(errors.client && 'border-red-500!')}
                            />
                            <FieldError message={errors.client?.message} />
                        </div>
                        <div>
                            <Input
                                label="Issue Date"
                                type="date"
                                {...register('issueDate')}
                                className={cn(errors.issueDate && 'border-red-500!')}
                            />
                            <FieldError message={errors.issueDate?.message} />
                        </div>
                        <div>
                            <Input
                                label="Due Date"
                                type="date"
                                {...register('dueDate')}
                                className={cn(errors.dueDate && 'border-red-500!')}
                            />
                            <FieldError message={errors.dueDate?.message} />
                        </div>
                    </div>
                </div>

                {/* Line items */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-800">Line Items</h2>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', hours: 0, rate: 0 })}>
                            <Plus size={13} /> Add Line
                        </Button>
                    </div>

                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-0.5 mb-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Job</span>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Hours</span>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Client rate</span>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</span>
                        <span />
                    </div>
                    <div className="flex flex-col gap-3">
                        {fields.map((field, index) => {
                            const hours = Number(lineItems?.[index]?.hours) || 0
                            const rate = Number(lineItems?.[index]?.rate) || 0
                            // The first line reflects the job being invoiced — its
                            // description is the job's own title (not free text)
                            // and, for a fixed-price job, hours is locked at 1 (no
                            // meaningful hourly figure to enter). Extra manually
                            // added lines below it stay fully free-form.
                            const isJobRow = !isEditing && !!job && index === 0
                            const isFixedJobRow = isJobRow && job?.chargeType === 'fixed'
                            return (
                                <div key={field.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-start">
                                    <div>
                                        {isJobRow ? (
                                            <>
                                                <p className="h-9 flex items-center px-3 text-sm text-slate-700 bg-slate-50 border border-[#E2E8F0] rounded-lg truncate">
                                                    {job?.title}
                                                </p>
                                                <input type="hidden" {...register(`lineItems.${index}.description` as const)} />
                                            </>
                                        ) : (
                                            <Input
                                                placeholder="Description"
                                                {...register(`lineItems.${index}.description` as const)}
                                                className={cn(errors.lineItems?.[index]?.description && 'border-red-500!')}
                                            />
                                        )}
                                        <FieldError message={errors.lineItems?.[index]?.description?.message} />
                                    </div>
                                    {isFixedJobRow ? (
                                        <>
                                            <p className="h-9 flex items-center px-3 text-sm text-slate-500 bg-slate-50 border border-[#E2E8F0] rounded-lg">Fixed</p>
                                            <input type="hidden" {...register(`lineItems.${index}.hours` as const, { valueAsNumber: true })} />
                                        </>
                                    ) : (
                                        <Input
                                            type="number"
                                            step="0.5"
                                            placeholder="Hours"
                                            {...register(`lineItems.${index}.hours` as const, { valueAsNumber: true })}
                                        />
                                    )}
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Rate"
                                        {...register(`lineItems.${index}.rate` as const, { valueAsNumber: true })}
                                    />
                                    <p className="h-9 flex items-center text-sm font-medium text-slate-700 tabular-nums">
                                        {formatCurrency(hours * rate)}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                        className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                    <FieldError message={errors.lineItems?.message as string | undefined} />

                    <div className="flex justify-end mt-4 pt-4 border-t border-[#F1F5F9]">
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Total</p>
                            <p className="text-xl font-bold text-slate-900 mt-0.5">{formatCurrency(subtotal)}</p>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                    <h2 className="text-sm font-semibold text-slate-800 mb-4">Notes</h2>
                    <Textarea
                        {...register('notes')}
                        placeholder="Payment terms, bank details, or other notes for the client..."
                        rows={3}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 justify-end pt-2 pb-6">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                            ? isEditing ? 'Saving…' : 'Creating…'
                            : isEditing ? 'Save Changes' : 'Create Invoice'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
