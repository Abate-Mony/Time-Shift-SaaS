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
import { AnimatePresence, motion } from 'framer-motion'
import dayjs from "dayjs"
import { Calendar, Check, ChevronDown, ChevronLeft, Clock, MapPin, Paperclip, Settings2, Users, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from "react-hook-form"
import toast from 'react-hot-toast'
import { Form, redirect, useLoaderData, useNavigate, useParams, useSearchParams, type ActionFunctionArgs, type LoaderFunctionArgs, type Params } from 'react-router'
import { Avatar, Input } from '../components/ui'

type AssignedWorker = CreateJobForm["workers"][number]

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
    const raw = Object.fromEntries(formData) as Record<string, string>
    const payload: Record<string, unknown> = { ...raw }

    // Advanced options — openToClaims/requiresApproval are always present
    // (toggles default to false/true either way); clockInGraceMinutes and
    // geofenceRadiusMeters are real number inputs that are just empty when
    // left blank, meaning "inherit".
    payload.openToClaims = raw.openToClaims === 'true'
    payload.requiresApproval = raw.requiresApproval === 'true'
    if (raw.clockInGraceMinutes) payload.clockInGraceMinutes = Number(raw.clockInGraceMinutes)
    else delete payload.clockInGraceMinutes
    if (raw.geofenceRadiusMeters) payload.geofenceRadiusMeters = Number(raw.geofenceRadiusMeters)
    else delete payload.geofenceRadiusMeters

    // Coordinates arrive as a JSON string from a hidden input — convert back to an object
    if (raw.coordinates) {
        try {
            payload.coordinates = JSON.parse(raw.coordinates)
        } catch {
            delete payload.coordinates
        }
    } else {
        delete payload.coordinates
    }

    try {
        await customFetch.patch(`/jobs/${params.id}`, payload)

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
    const address = watch("address")
    const coordinates = watch("coordinates")
    const [advancedOpen, setAdvancedOpen] = useState(false)
    const supervisor = watch("supervisor")
    const openToClaims = watch("openToClaims") ?? false
    const requiresApproval = watch("requiresApproval") ?? true
    const clockInGraceMinutes = watch("clockInGraceMinutes")
    const geofenceMode = watch("geofenceMode")
    const geofenceRadius = watch("geofenceRadiusMeters") ?? 150

    const supervisorUser = users.find(u => u._id === supervisor)
    const advancedSummaryParts: string[] = []
    if (supervisorUser) advancedSummaryParts.push(`Supervisor: ${supervisorUser.fullname}`)
    if (openToClaims) advancedSummaryParts.push(`Open to claims${requiresApproval ? "" : " (auto-approved)"}`)
    if (clockInGraceMinutes) advancedSummaryParts.push(`Grace: ${clockInGraceMinutes}m`)
    if (geofenceMode) advancedSummaryParts.push(`Clock-in location: ${geofenceMode} · ${geofenceRadius}m`)
    const advancedSummary = advancedSummaryParts.length > 0
        ? advancedSummaryParts.join(" · ")
        : "Using company defaults · No supervisor assigned"

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
                        worker: worker._id,
                        // Remaining AssignedWorker fields (status, job, createdBy, ...)
                        // are zod-defaulted server-side on save — not this component's
                        // job to guess at. (job used to be set to job?.title here,
                        // which is wrong — that field expects the job's ObjectId.)
                    } as AssignedWorker]
                    : selectedWorkers;
            })();

        setSelectedWorkers(next);
        setValue("workers", next, { shouldValidate: true });
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
                                    label="client / Client"
                                    placeholder="e.g. SecureGuard Ltd"
                                    {...register("client")}
                                    className={cn(errors.client && "border-red-500!")}
                                />
                                <FieldError message={errors.client?.message} />
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
                        defaultQuery={job?.location}
                        onSelect={(location) => {
                            setValue("location", location.siteName, { shouldValidate: true })
                            setValue(
                                "address",
                                [location.address, location.city, location.postcode].filter(Boolean).join(", "),
                                { shouldValidate: true }
                            )
                            setValue("coordinates", { lat: location.lat, lng: location.lng }, { shouldValidate: true })
                        }}
                    />
                    <FieldError message={errors.location?.message} />
                    {address && (
                        <>
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                                <MapPin size={12} className="text-slate-400" /> {address}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                                Only the general area above is shown to workers before they're assigned — this exact address is used for directions once someone is.
                            </p>
                        </>
                    )}
                    {/* Coordinates/address ride along as hidden fields — <Form> submits from the
                        DOM, not RHF state, so they need real inputs to reach the action */}
                    <input type="hidden" name="address" value={address ?? ""} />
                    {coordinates && (
                        <input type="hidden" name="coordinates" value={JSON.stringify(coordinates)} />
                    )}

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

                    {/* Single hidden input carrying the whole array as JSON — matching
                        CreateJob.tsx's convention (one-per-worker with the same `name`
                        would just have the last duplicate win, and an empty selection
                        would render no input at all, silently failing to clear workers). */}
                    {selectedWorkers.length > 0 && (
                        <input type="hidden" name="workers" value={JSON.stringify(selectedWorkers)} />
                    )}
                    <FieldError message={errors.workers?.message as string | undefined} />

                    {workerOpen && (
                        <div className="mt-2 border border-[#E2E8F0] rounded-xl overflow-hidden animate-fade-in">
                            {users.map((w, i) => {
                                const selected = selectedWorkers.find(sw => sw.email === w.email)
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

                {/* Advanced — collapsed by default so the common case stays a short form */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setAdvancedOpen(o => !o)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors"
                    >
                        <span className="flex items-center gap-2.5 min-w-0">
                            <Settings2 size={15} className="text-slate-400 shrink-0" />
                            <span className="text-left min-w-0">
                                <span className="block text-sm font-semibold text-slate-800">Advanced options</span>
                                <span className="block text-[11px] text-slate-400 truncate">
                                    {advancedSummary}
                                </span>
                            </span>
                        </span>
                        <ChevronDown
                            size={15}
                            className={cn("text-slate-400 transition-transform shrink-0", advancedOpen && "rotate-180")}
                        />
                    </button>

                    <AnimatePresence initial={false}>
                        {advancedOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                                style={{ overflow: "hidden" }}
                                className="min-w-0"
                            >
                                <div className="px-6 pb-6 pt-1 min-w-0 flex flex-col gap-6">
                                    <div className="h-px bg-[#F1F5F9]" />

                                    {/* Supervisor */}
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                            Supervisor
                                        </p>
                                        <p className="text-[11px] text-slate-400 mb-2">
                                            The person workers should contact on site. Optional.
                                        </p>
                                        <div className="relative max-w-xs min-w-0">
                                            <select
                                                value={supervisor ?? ""}
                                                onChange={e => setValue("supervisor", e.target.value || undefined, { shouldValidate: true })}
                                                className="w-full h-10 pl-3 pr-8 border border-[#E2E8F0] rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] appearance-none cursor-pointer transition-all"
                                            >
                                                <option value="">No supervisor assigned</option>
                                                {users.map(u => (
                                                    <option key={u._id} value={u._id}>{u.fullname}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                        {supervisor && <input type="hidden" name="supervisor" value={supervisor} />}
                                    </div>

                                    {/* Internal notes — manager-only, never shown to workers. Worker-visible
                                        instructions stay in the main form (below) since that's the common
                                        case, not an edge case worth burying here. */}
                                    <div className="min-w-0 pt-6 border-t border-[#F1F5F9]">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                            Internal notes
                                        </p>
                                        <p className="text-[11px] text-slate-400 mb-2">
                                            Internal only — never shown to workers.
                                        </p>
                                        <Textarea
                                            {...register("notes")}
                                            placeholder="Anything the team should know but workers shouldn't see..."
                                            rows={3}
                                        />
                                    </div>

                                    {/* Open shifts */}
                                    <div className="min-w-0 pt-6 border-t border-[#F1F5F9]">
                                        <div className="flex items-center justify-between gap-3 min-w-0">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-800">Open to claims</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Lets any worker claim an unfilled slot on this shift.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={openToClaims}
                                                onClick={() => setValue("openToClaims", !openToClaims, { shouldValidate: true })}
                                                className={cn(
                                                    "relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-1 shrink-0",
                                                    openToClaims ? "bg-[#1E3A5F]" : "bg-slate-200"
                                                )}
                                            >
                                                <motion.span
                                                    layout
                                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                                    className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm", openToClaims ? "left-6" : "left-1")}
                                                />
                                            </button>
                                        </div>

                                        <AnimatePresence initial={false}>
                                            {openToClaims && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -6, height: 0 }}
                                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                                    exit={{ opacity: 0, y: -6, height: 0 }}
                                                    transition={{ duration: 0.18 }}
                                                    style={{ overflow: "hidden" }}
                                                    className="min-w-0"
                                                >
                                                    <div className="flex items-center justify-between gap-3 min-w-0 mt-4 pl-4 border-l-2 border-slate-100">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-slate-700">Require approval</p>
                                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                                You approve each claim before the shift is theirs.
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={requiresApproval}
                                                            onClick={() => setValue("requiresApproval", !requiresApproval, { shouldValidate: true })}
                                                            className={cn(
                                                                "relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-1 shrink-0",
                                                                requiresApproval ? "bg-[#1E3A5F]" : "bg-slate-200"
                                                            )}
                                                        >
                                                            <motion.span
                                                                layout
                                                                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                                                className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm", requiresApproval ? "left-6" : "left-1")}
                                                            />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <input type="hidden" name="openToClaims" value={String(openToClaims)} />
                                        <input type="hidden" name="requiresApproval" value={String(requiresApproval)} />
                                    </div>

                                    {/* Clock-in grace override */}
                                    <div className="min-w-0 pt-6 border-t border-[#F1F5F9]">
                                        <div className="max-w-xs min-w-0">
                                            <Input
                                                label="Clock-in grace period"
                                                type="number"
                                                min="0"
                                                max="240"
                                                placeholder="e.g. 30"
                                                {...register("clockInGraceMinutes", { valueAsNumber: true })}
                                                className={cn(errors.clockInGraceMinutes && "border-red-500!")}
                                            />
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                How early a worker can clock in. Leave blank to use your company setting.
                                            </p>
                                            <FieldError message={errors.clockInGraceMinutes?.message} />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-[#F1F5F9]" />

                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                        Clock-in location check
                                    </p>
                                    <p className="text-[11px] text-slate-400 -mt-4">
                                        Overrides your company setting for this job only. Useful for sites with poor
                                        signal, or where workers move around a large area.
                                    </p>

                                    <div className="flex flex-col gap-2 min-w-0 -mt-2">
                                        {[
                                            {
                                                value: "",
                                                label: "Use company default",
                                                sub: "Whatever's set in Settings — recommended",
                                            },
                                            {
                                                value: "off",
                                                label: "No location check",
                                                sub: "Workers clock in from anywhere, nothing recorded",
                                            },
                                            {
                                                value: "warn",
                                                label: "Record and flag",
                                                sub: "Always lets them clock in, but flags it if they're off site",
                                            },
                                            {
                                                value: "enforce",
                                                label: "Require them on site",
                                                sub: "Blocks clock-in outside the radius — they'll need you to override it",
                                            },
                                        ].map(opt => (
                                            <label
                                                key={opt.value}
                                                className={cn(
                                                    "flex items-start gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all min-w-0",
                                                    (geofenceMode ?? "") === opt.value
                                                        ? "border-[#1E3A5F] bg-[#1E3A5F]/[0.03]"
                                                        : "border-[#E2E8F0] hover:border-slate-300"
                                                )}
                                            >
                                                <Input
                                                    type="radio"
                                                    className="sr-only"
                                                    checked={(geofenceMode ?? "") === opt.value}
                                                    onChange={() =>
                                                        setValue(
                                                            "geofenceMode",
                                                            (opt.value === "" ? undefined : (opt.value as "off" | "warn" | "enforce")),
                                                            { shouldValidate: true }
                                                        )
                                                    }
                                                />
                                                <span
                                                    className={cn(
                                                        "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                                        (geofenceMode ?? "") === opt.value
                                                            ? "border-[#1E3A5F] bg-[#1E3A5F]"
                                                            : "border-slate-300"
                                                    )}
                                                >
                                                    {(geofenceMode ?? "") === opt.value && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                                    )}
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block text-sm font-semibold text-slate-800">{opt.label}</span>
                                                    <span className="block text-[11px] text-slate-400 mt-0.5">{opt.sub}</span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>

                                    <AnimatePresence initial={false}>
                                        {geofenceMode && geofenceMode !== "off" && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -6, height: 0 }}
                                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                                exit={{ opacity: 0, y: -6, height: 0 }}
                                                transition={{ duration: 0.18 }}
                                                className="-mt-4 max-w-xs min-w-0"
                                            >
                                                <Input
                                                    label="Radius"
                                                    type="number"
                                                    min="25"
                                                    max="5000"
                                                    step="25"
                                                    placeholder="150"
                                                    icon={<MapPin size={13} />}
                                                    {...register("geofenceRadiusMeters", { valueAsNumber: true })}
                                                    className={cn(errors.geofenceRadiusMeters && "border-red-500!")}
                                                />
                                                <p className="text-[11px] text-slate-400 mt-1">
                                                    Metres from the site. Phone GPS is often 50–100m out indoors, so anything
                                                    under 100m will flag people who are genuinely there.
                                                </p>
                                                <FieldError message={errors.geofenceRadiusMeters?.message} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {!coordinates && geofenceMode && geofenceMode !== "off" && (
                                        <p className="-mt-4 text-xs text-amber-600">
                                            Pick a location above first — without map coordinates there's nothing to
                                            measure against, so this won't do anything.
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Hidden inputs for geofence — <Form> submits from the DOM, not RHF state */}
                {geofenceMode && <input type="hidden" name="geofenceMode" value={geofenceMode} />}
                {geofenceMode && geofenceMode !== "off" && geofenceRadius && (
                    <input type="hidden" name="geofenceRadiusMeters" value={String(geofenceRadius)} />
                )}

                {/* Instructions & Attachments */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                    <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold">5</span>
                        Instructions & Attachments
                    </h2>
                    <Textarea
                        {...register("instructions")}
                        placeholder="Gate code, where to park, who to ask for..."
                        rows={4}
                        className={cn(errors.instructions && "border-red-500!")}
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Workers assigned to this job will see this.</p>
                    <FieldError message={errors.instructions?.message} />

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
