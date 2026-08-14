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
import { useNavigate, useSearchParams, type LoaderFunctionArgs } from 'react-router'
import { Input } from '../components/ui'
import { singleJob } from './EditJobPage'

const FieldError = ({ message }: { message?: string }) => {
    if (!message) return null
    return <p className="text-sm text-red-500 mt-1">{message}</p>
}

export const loader = (queryClient: QueryClient) => async ({ request }: LoaderFunctionArgs) => {
    const jobId = new URL(request.url).searchParams.get('jobId')
    if (jobId) {
        await queryClient.ensureQueryData(singleJob(jobId))
    }
    return { jobId }
}

export function InvoiceForm() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const jobId = searchParams.get('jobId') ?? ''
    const job = useQuery(singleJob(jobId))?.data?.job

    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            job: jobId,
            client: job?.client ?? '',
            issueDate: dayjs().format('YYYY-MM-DD'),
            dueDate: dayjs().add(14, 'day').format('YYYY-MM-DD'),
            notes: '',
            lineItems: job?.workers?.length
                ? job.workers.map(w => ({
                    description: w.fullname,
                    hours: w.hoursWorked || 0,
                    rate: w.payRate || 0,
                }))
                : [{ description: job?.title ?? '', hours: 0, rate: 0 }],
        },
    })

    const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' })
    const lineItems = watch('lineItems')
    const subtotal = lineItems?.reduce((sum, li) => sum + (Number(li.hours) || 0) * (Number(li.rate) || 0), 0) ?? 0

    const onSubmit = async (data: InvoiceFormValues) => {
        try {
            const { data: created } = await customFetch.post('/invoices', data)
            toast.success('Invoice created successfully')
            await queryClient.invalidateQueries({ queryKey: ['invoices'] })
            navigate(`/invoices/${created?.invoice?._id ?? created?._id}`)
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

    return (
        <div className="px-2 pt-2.5 lg:p-6 max-w-3xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-7">
                <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 tracking-tight">New Invoice</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {job?.title ? `For ${job.title}` : 'Bill a client for a completed job'}
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

                    <div className="flex flex-col gap-3">
                        {fields.map((field, index) => {
                            const hours = Number(lineItems?.[index]?.hours) || 0
                            const rate = Number(lineItems?.[index]?.rate) || 0
                            return (
                                <div key={field.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-start">
                                    <div>
                                        <Input
                                            placeholder="Description"
                                            {...register(`lineItems.${index}.description` as const)}
                                            className={cn(errors.lineItems?.[index]?.description && 'border-red-500!')}
                                        />
                                        <FieldError message={errors.lineItems?.[index]?.description?.message} />
                                    </div>
                                    <Input
                                        type="number"
                                        step="0.5"
                                        placeholder="Hours"
                                        {...register(`lineItems.${index}.hours` as const, { valueAsNumber: true })}
                                    />
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
                        {isSubmitting ? 'Creating…' : 'Create Invoice'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
