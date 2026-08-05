import SearchLocation from '@/components/locationSearchComponent'
import { Button } from '@/components/ui/button'
import {
    Field,
    FieldContent,
    FieldLabel
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from '@/components/ui/textarea'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import customFetch from '@/utils/customFetch'
import { createJobSchema } from '@/utils/schemas'
import type { CreateJobForm, User } from '@/utils/types'
import { zodResolver } from "@hookform/resolvers/zod"
import { QueryClient, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import dayjs from "dayjs"
import { Calendar, Check, ChevronDown, ChevronLeft, Clock, MapPin, Paperclip, Users, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from "react-hook-form"
import toast from 'react-hot-toast'
import { Form, redirect, useLoaderData, useNavigate, useParams, useSearchParams, type ActionFunctionArgs, type LoaderFunctionArgs, type Params } from 'react-router'
import { Avatar, Input } from '../components/ui'

// Small reusable error renderer so we don't repeat the same JSX everywhere
const FieldError = ({ message }: { message?: string }) => {
    if (!message) return null
    return <p className="text-sm text-red-500 mt-1">{message}</p>
}
export const singleJob = (id: string | undefined) => {
    return ({
        queryKey: ["job", id],
        queryFn: async (): Promise<{ job: CreateJobForm }> => {
            const { data } = await customFetch.get(`/jobs/${id}`)
            return data
        }
    })
}
export const loader = (queryClient: QueryClient) => async ({ params, request }: LoaderFunctionArgs) => {
    const search = Object.fromEntries([
        ...new URL(request.url).searchParams.entries(),
    ]);
    await queryClient.ensureQueryData(singleJob(params.id!))
    return ({
        searchValues: { ...search }
    })


}
const workersQuery = (params: Params) => {
    const { search, sort, page, status, date } = params

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

export const action = async ({ request, params }: ActionFunctionArgs) => {
    const formData = await request.formData()
    const data = Object.fromEntries(formData)
    try {
        await customFetch.patch(`/jobs/${params.id}`, data)

        toast.success('Job edited successfully!')
        queryClient.invalidateQueries({
            queryKey: ["job", params.id],
        });

        queryClient.invalidateQueries({
            queryKey: ["jobs"],
        });
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

export function EditJob() {
    const [searchParams] = useSearchParams()
    const editMode = searchParams.get("edit") == "assigned-workers"
    // alert("editMode : " )
    console.log("this is edit mode : ", searchParams.get("edit"))
    const [workerOpen, setWorkerOpen] = useState(editMode)
    const [saved, setSaved] = useState(false)
    const navigate = useNavigate()
    const onNavigate = (path: string) => navigate(path)

    const { searchValues } = useLoaderData() as any
    const id = useParams().id
    const job = useQuery(singleJob(id))?.data?.job
    const [selectedWorkers, setSelectedWorkers] = useState<CreateJobForm["workers"]>(
        job?.workers ? job.workers : []

    )
    console.log("selectedworkers :", selectedWorkers)
    const { users } = useQuery<{ users: User[] }>(workersQuery(searchValues))?.data || {
        users: []
    } as {
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
    } = useForm<CreateJobForm>({
        resolver: zodResolver(createJobSchema as any),
        defaultValues: {
            ...job,
            date: dayjs(job?.date).format("YYYY-MM-DD")
        },
        mode: "onSubmit",
        reValidateMode: "onChange",
    })

    const startTime = watch("startTime")
    const endTime = watch("endTime")
    const priority = watch("priority")
    const toggleWorker = (id: string) => {
        const exists = selectedWorkers.some((w) => w.email === id);

        const next: CreateJobForm["workers"] = exists
            ? selectedWorkers.filter((w) => w.email !== id)
            : (() => {
                const worker = users.find((w) => w.email === id);
                return worker
                    ? [...selectedWorkers, {
                        fullname: worker.fullname,
                        email: worker.email,
                        phone: worker.phone ?? "",
                        user: worker._id,
                        job: job?.title ?? "",
                        createdBy: job?.createdBy ?? "",
                        status: "pending",
                        cancellationReason: "",
                        workerNotes: "",
                        managerNotes: "",
                        hoursWorked: 0,
                        overtimeHours: 0,
                        payRate: 0,
                        totalPay: 0,
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

    const jobDuration = (startTime: string, endTime: string) => {
        const [sh, sm] = startTime.split(':').map(Number)
        const [eh, em] = endTime.split(':').map(Number)
        let mins = (eh * 60 + em) - (sh * 60 + sm)

        // Overnight shift: end time rolls into the next day
        if (mins <= 0) {
            mins += 24 * 60
        }

        const h = Math.floor(mins / 60)
        const m = mins % 60
        return `${h}h${m > 0 ? ` ${m}m` : ''}`

    }
    if (saved) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <div className="text-center animate-fade-in">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <Check size={24} className="text-emerald-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">Job Created</h2>
                    <p className="text-sm text-slate-500 mt-1">Redirecting to Jobs...</p>
                </div>
            </div>
        )
    }

    return (
        <div className=" px-2 pt-2.5 lg:p-6 max-w-3xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-7">
                <button onClick={() => onNavigate('jobs')} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
                    <ChevronLeft size={16} />
                </button>
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Edit Job</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Fill in the details to edit the job</p>
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

                        <div className="grid sm:grid-cols-2 gap-4">
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
                                <RadioGroup defaultValue={job?.priority || "low"} className="w-fit pl-3 flex  flex-wrap" name='priority'>
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
                                                    {/* <FieldDescription>
                                                        Standard spacing for most use cases.
                                                    </FieldDescription> */}
                                                </FieldLabel>
                                            </FieldContent>
                                        </Field>
                                    ))}
                                </RadioGroup>

                                {/* <FieldError message={errors.priority?.message} /> */}
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
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                            <Input
                                label="Date"
                                type="date"
                                icon={<Calendar size={14} />}
                                {...register("date")}
                                className={cn(errors.date && "border-red-500!",
                                    "max-w-fit w-full"
                                )}
                            />
                            <FieldError message={errors.date?.message} />
                        </div>

                        <div>
                            <Input
                                label="Start Time"
                                type="time"
                                icon={<Clock size={14} />}
                                {...register("startTime")}
                                className={cn(errors.startTime && "border-red-500!",
                                    "max-w-fit w-full"

                                )}
                            />
                            <FieldError message={errors.startTime?.message} />
                        </div>

                        <div>
                            <Input
                                label="End Time"
                                type="time"
                                icon={<Clock size={14} />}
                                {...register("endTime")}
                                className={cn(errors.endTime && "border-red-500!",
                                    "max-w-fit w-full"
                                )}
                            />
                            <FieldError message={errors.endTime?.message} />
                        </div>
                    </div>
                    {startTime && endTime && (
                        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 flex items-center gap-2">
                            <Clock size={14} className="text-blue-500" />
                            <p className="text-sm text-blue-700">
                                <span className="font-semibold">
                                    {
                                        jobDuration(startTime, endTime)
                                    }
                                </span> shift duration
                            </p>
                        </div>
                    )}
                </div>

                {/* Workers */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-6" id="assigned-worker">
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
                    {selectedWorkers.map((id) => (
                        <input key={id.email} type="hidden" name="workers" value={JSON.stringify(selectedWorkers)} />
                    ))}
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

                {/* Notes & Attachments */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                    <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold">5</span>
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
                    <Button type="button" variant="outline" onClick={() => onNavigate('/jobs')}>
                        Cancel
                    </Button>
                    {/* <Button type="submit" name="status-" value="draft" variant="secondary" disabled={isSubmitting}>
                        Save as Draft
                    </Button> */}
                    <Button type="submit" name="status-" value="published" disabled={isSubmitting}>
                        Edit Job
                    </Button>
                </div>
            </Form>
        </div>
    )
}
