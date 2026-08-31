import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, type QueryClient } from '@tanstack/react-query'
import { useOutletContext } from 'react-router'
import { isAxiosError } from 'axios'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { AnimatePresence, motion } from 'framer-motion'
import {
    CalendarClock,
    Check,
    Clock,
    Coins,
    Lock,
    MapPin,
    Timer,
} from 'lucide-react'

import customFetch from '@/utils/customFetch'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import type { iUser } from '@/layouts/dashboardlayout'
import type { CompanySettings, Currency, GeofenceMode, WeekStartsOn } from '@/utils/types'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui'

// ── Same pattern as CreateJob.tsx — a plain message under the field ─────────
const FieldError = ({ message }: { message?: string }) => {
    if (!message) return null
    return <p className="text-sm text-red-500 mt-1">{message}</p>
}

// ─── Schema ───────────────────────────────────────────────────────────────
// Mirrors CompanySettings 1:1 except overtime, which the UI edits as hours —
// converted back to minutes on save (see buildPatch).
const settingsFormSchema = z.object({
    clockInGraceMinutes: z.coerce.number({ invalid_type_error: 'Enter a number' }).int('Whole minutes only').min(0, "Can't be negative").max(120, 'Max 120 minutes'),
    lateThresholdMinutes: z.coerce.number({ invalid_type_error: 'Enter a number' }).int('Whole minutes only').min(0, "Can't be negative").max(120, 'Max 120 minutes'),
    autoClockOutEnabled: z.boolean(),
    payFromScheduledStart: z.boolean(),

    geofenceMode: z.enum(['off', 'warn', 'enforce']),
    defaultGeofenceRadiusMeters: z.coerce.number({ invalid_type_error: 'Enter a number' }).int('Whole metres only').min(10, 'Minimum 10m').max(5000, 'Maximum 5000m'),

    breaksArePaid: z.boolean(),
    autoDeductBreakMinutes: z.coerce.number({ invalid_type_error: 'Enter a number' }).int('Whole minutes only').min(0, "Can't be negative").max(120, 'Max 120 minutes'),
    autoDeductAfterMinutes: z.coerce.number({ invalid_type_error: 'Enter a number' }).int('Whole minutes only').min(0, "Can't be negative").max(1440, 'Max 1440 minutes'),

    overtimeThresholdHours: z.coerce.number({ invalid_type_error: 'Enter a number' }).min(0, "Can't be negative").max(24, 'Max 24 hours'),
    overtimeMultiplier: z.coerce.number({ invalid_type_error: 'Enter a number' }).min(1, 'Must be at least 1×').max(5, 'Max 5×'),
    weeklyHoursTarget: z.coerce.number({ invalid_type_error: 'Enter a number' }).min(0, "Can't be negative").max(168, 'Max 168 hours'),
    currency: z.enum(['GBP', 'USD', 'EUR']),
    defaultPayRate: z.coerce.number({ invalid_type_error: 'Enter a number' }).min(0, "Can't be negative"),

    timezone: z.string().min(1, 'Select a timezone'),
    weekStartsOn: z.enum(['monday', 'sunday']),
    generateAheadDays: z.coerce.number({ invalid_type_error: 'Enter a number' }).int('Whole days only').min(1, 'At least 1 day').max(365, 'Max 365 days'),
    openShiftsEnabled: z.boolean(),
    openShiftsRequireApproval: z.boolean(),
})

type FormValues = z.infer<typeof settingsFormSchema>

const DEFAULT_FORM_VALUES: FormValues = {
    clockInGraceMinutes: 15,
    lateThresholdMinutes: 10,
    autoClockOutEnabled: true,
    payFromScheduledStart: true,
    geofenceMode: 'warn',
    defaultGeofenceRadiusMeters: 150,
    breaksArePaid: false,
    autoDeductBreakMinutes: 0,
    autoDeductAfterMinutes: 360,
    overtimeThresholdHours: 8,
    overtimeMultiplier: 1.5,
    weeklyHoursTarget: 40,
    currency: 'GBP',
    defaultPayRate: 12.5,
    timezone: 'Europe/London',
    weekStartsOn: 'monday',
    generateAheadDays: 28,
    openShiftsEnabled: false,
    openShiftsRequireApproval: true,
}

function toFormValues(s: CompanySettings): FormValues {
    const { overtimeThresholdMinutes, ...rest } = s
    return {
        ...rest,
        overtimeThresholdHours: overtimeThresholdMinutes / 60,
    }
}

// Only ever sends what changed, per RHF's dirtyFields — the one unit
// conversion (hours -> minutes) happens here, nowhere else.
function buildPatch(values: FormValues, dirtyFields: Partial<Record<keyof FormValues, unknown>>): Partial<CompanySettings> {
    const patch: Partial<CompanySettings> = {}
    for (const key of Object.keys(dirtyFields) as (keyof FormValues)[]) {
        if (!dirtyFields[key]) continue
        if (key === 'overtimeThresholdHours') {
            patch.overtimeThresholdMinutes = Math.round(values.overtimeThresholdHours * 60)
            continue
        }
        // Every other field name/type matches CompanySettings directly.
        ; (patch as Record<string, unknown>)[key] = values[key]
    }
    return patch
}

function extractErrorMessage(err: unknown): string {
    if (isAxiosError(err)) {
        return err.response?.data?.msg ?? err.response?.data?.message ?? 'Something went wrong.'
    }
    return err instanceof Error ? err.message : 'Something went wrong.'
}

// ─── Query + loader ───────────────────────────────────────────────────────
export const companySettingsQuery = {
    queryKey: ['company-settings'],
    queryFn: async (): Promise<{ settings: CompanySettings }> => {
        const { data } = await customFetch.get('/companies/settings')
        return data
    },
}

export const loader = (queryClient: QueryClient) => async () => {
    await queryClient.ensureQueryData(companySettingsQuery)
    return null
}

// ─── Small local building blocks ────────────────────────────────────────────

function SectionCard({ icon: Icon, title, description, children }: {
    icon: React.ComponentType<{ size?: number; className?: string }>
    title: string
    description: string
    children: React.ReactNode
}) {
    return (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden min-w-0">
            <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-[#F1F5F9] min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-[#1E3A5F]" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                </div>
            </div>
            <div className="p-6 flex flex-col gap-6 min-w-0">
                {children}
            </div>
        </div>
    )
}

function NumberField({ label, description, error, suffix, className, ...props }: {
    label: string
    description: string
    error?: string
    suffix?: string
    className?: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="flex flex-col gap-1 min-w-0">
            <label className="text-sm font-medium text-slate-800">{label}</label>
            <p className="text-xs text-slate-500">{description}</p>
            <div className="relative max-w-[220px] mt-1">
                <Input
                    type="number"
                    className={cn(
                        'w-full h-9 pl-3 pr-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all disabled:opacity-60 disabled:cursor-not-allowed',
                        suffix && 'pr-14',
                        error && 'border-red-400 focus:ring-red-200',
                        className
                    )}
                    {...props}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                        {suffix}
                    </span>
                )}
            </div>
            <FieldError message={error} />
        </div>
    )
}

function ToggleField({ label, description, checked, onChange, disabled }: {
    label: string
    description: string
    checked: boolean
    onChange: (v: boolean) => void
    disabled?: boolean
}) {
    return (
        <div className="flex items-center justify-between gap-4 min-w-0">
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={cn(
                    'w-10 h-6 rounded-full transition-colors relative shrink-0 disabled:opacity-60 disabled:cursor-not-allowed',
                    checked ? 'bg-[#1E3A5F]' : 'bg-slate-200'
                )}
            >
                <span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all', checked ? 'left-5' : 'left-1')} />
            </button>
        </div>
    )
}

function SegmentedControl<T extends string>({ label, description, options, value, onChange, disabled }: {
    label: string
    description: string
    options: { value: T; label: string }[]
    value: T
    onChange: (v: T) => void
    disabled?: boolean
}) {
    return (
        <div className="flex flex-col gap-1 min-w-0">
            <label className="text-sm font-medium text-slate-800">{label}</label>
            <p className="text-xs text-slate-500">{description}</p>
            <div className="inline-flex w-fit p-1 bg-slate-100 rounded-xl gap-1 mt-1 min-w-0 max-w-full overflow-x-auto">
                {options.map(opt => (
                    <button
                        key={opt.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'px-3.5 h-8 rounded-lg text-xs font-semibold transition-all whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed',
                            value === opt.value ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

// Codebase has no combobox/command component yet, so this is a small
// bespoke searchable dropdown (same interaction shape as
// locationSearchComponent.tsx) rather than pulling in a new dependency.
function TimezoneSelect({ value, onChange, disabled, error }: {
    value: string
    onChange: (v: string) => void
    disabled?: boolean
    error?: string
}) {
    const [query, setQuery] = useState(value)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        setQuery(value)
    }, [value])

    const zones = useMemo(() => {
        try {
            return Intl.supportedValuesOf('timeZone')
        } catch {
            // Very old browsers without Intl.supportedValuesOf — fall back to
            // whatever's already selected so the field still works.
            return value ? [value] : []
        }
    }, [value])

    const filtered = useMemo(() => {
        const q = query?.trim().toLowerCase()
        const matches = q ? zones.filter(z => z?.toLowerCase().includes(q)) : zones
        return matches.slice(0, 50)
    }, [zones, query])

    return (
        <div className="flex flex-col gap-1 min-w-0">
            <label className="text-sm font-medium text-slate-800">Timezone</label>
            <p className="text-xs text-slate-500">Used to schedule shifts and generate recurring occurrences.</p>
            <div className="relative max-w-xs mt-1 min-w-0">
                <Input
                    value={query}
                    disabled={disabled}
                    onChange={e => { setQuery(e.target.value); setOpen(true) }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    placeholder="Search timezone..."
                    className={cn(
                        'w-full h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all disabled:opacity-60 disabled:cursor-not-allowed',
                        error && 'border-red-400 focus:ring-red-200'
                    )}
                />
                {open && filtered.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-[#E2E8F0] bg-white shadow-lg">
                        {filtered.map(z => (
                            <button
                                key={z}
                                type="button"
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => { onChange(z); setQuery(z); setOpen(false) }}
                                className={cn(
                                    'flex items-center justify-between gap-2 w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
                                    z === value && 'bg-[#1E3A5F]/5 text-[#1E3A5F] font-medium'
                                )}
                            >
                                <span className="truncate">{z.replace(/_/g, ' ')}</span>
                                {z === value && <Check size={13} className="shrink-0" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <FieldError message={error} />
        </div>
    )
}

const CURRENCY_SYMBOLS: Record<Currency, string> = { GBP: '£', USD: '$', EUR: '€' }

// ─── Page ────────────────────────────────────────────────────────────────
export function Settings() {
    const { user } = useOutletContext<{ user: iUser }>()
    const isAdmin = user?.role === 'admin'

    const { data } = useQuery(companySettingsQuery)
    const settings = data?.settings

    const {
        control,
        register,
        watch,
        handleSubmit,
        reset,
        formState: { errors, isDirty, isSubmitting, dirtyFields },
    } = useForm<FormValues>({
        resolver: zodResolver(settingsFormSchema) as Resolver<FormValues>,
        defaultValues: settings ? toFormValues(settings) : DEFAULT_FORM_VALUES,
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    })

    // Reacts to invalidation from elsewhere — but never clobbers an in-progress
    // edit, so only resyncs while the form is clean.
    useEffect(() => {
        if (settings && !isDirty) {
            reset(toFormValues(settings))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings])

    const saveMutation = useMutation({
        mutationFn: (payload: Partial<CompanySettings>) => customFetch.patch('/companies/settings', payload),
        onSuccess: (_res, _payload, _ctx) => {
            queryClient.invalidateQueries({ queryKey: ['company-settings'] })
            toast.success('Settings saved')
        },
        onError: (err) => {
            toast.error(extractErrorMessage(err))
        },
    })

    const onValid = (values: FormValues) => {
        const payload = buildPatch(values, dirtyFields)
        if (Object.keys(payload).length === 0) return
        saveMutation.mutate(payload, {
            onSuccess: () => reset(values),
        })
    }

    const autoDeductBreakMinutes = watch('autoDeductBreakMinutes')
    const openShiftsEnabled = watch('openShiftsEnabled')
    const currency = watch('currency')

    const disabled = !isAdmin

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in pb-28">
            {!isAdmin && (
                <div className="mb-5 flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <Lock size={14} className="text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-800">You're viewing this in read-only mode — only admins can change company settings.</p>
                </div>
            )}

            <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-5 min-w-0">
                <SectionCard icon={Clock} title="Time & Attendance" description="Clock-in windows and how shifts open and close">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
                        <NumberField
                            label="Clock-in grace period"
                            description="How early a worker may clock in before their shift starts."
                            suffix="min"
                            disabled={disabled}
                            error={errors.clockInGraceMinutes?.message}
                            {...register('clockInGraceMinutes')}
                        />
                        <NumberField
                            label="Late threshold"
                            description="How late a clock-in can be before it's flagged."
                            suffix="min"
                            disabled={disabled}
                            error={errors.lateThresholdMinutes?.message}
                            {...register('lateThresholdMinutes')}
                        />
                    </div>
                    <Controller
                        control={control}
                        name="autoClockOutEnabled"
                        render={({ field }) => (
                            <ToggleField
                                label="Auto clock-out"
                                description="Automatically closes shifts left running past their scheduled end time."
                                checked={field.value}
                                onChange={field.onChange}
                                disabled={disabled}
                            />
                        )}
                    />
                    <Controller
                        control={control}
                        name="payFromScheduledStart"
                        render={({ field }) => (
                            <ToggleField
                                label="Pay from scheduled start"
                                description="When on, arriving early doesn't earn extra pay — billing starts at the scheduled time, not the clock-in time."
                                checked={field.value}
                                onChange={field.onChange}
                                disabled={disabled}
                            />
                        )}
                    />
                </SectionCard>

                <SectionCard icon={MapPin} title="Location" description="GPS verification for clock-ins">
                    <Controller
                        control={control}
                        name="geofenceMode"
                        render={({ field }) => (
                            <SegmentedControl<GeofenceMode>
                                label="Geofence mode"
                                description="Off: no location check. Warn: check-ins outside the radius are recorded and flagged, but always allowed. Enforce: check-ins outside the radius are blocked."
                                value={field.value}
                                onChange={field.onChange}
                                disabled={disabled}
                                options={[
                                    { value: 'off', label: 'Off' },
                                    { value: 'warn', label: 'Warn' },
                                    { value: 'enforce', label: 'Enforce' },
                                ]}
                            />
                        )}
                    />
                    <NumberField
                        label="Default geofence radius"
                        description="Default radius around a job site used for the check above. Can be overridden per site."
                        suffix="m"
                        disabled={disabled}
                        error={errors.defaultGeofenceRadiusMeters?.message}
                        {...register('defaultGeofenceRadiusMeters')}
                    />
                </SectionCard>

                <SectionCard icon={Timer} title="Breaks" description="How break time is tracked and paid">
                    <Controller
                        control={control}
                        name="breaksArePaid"
                        render={({ field }) => (
                            <ToggleField
                                label="Breaks are paid"
                                description="Whether break time counts toward a worker's paid hours."
                                checked={field.value}
                                onChange={field.onChange}
                                disabled={disabled}
                            />
                        )}
                    />
                    <NumberField
                        label="Auto-deduct break time"
                        description="Automatically deducts this many minutes from a shift as an unpaid break. 0 disables it."
                        suffix="min"
                        disabled={disabled}
                        error={errors.autoDeductBreakMinutes?.message}
                        {...register('autoDeductBreakMinutes')}
                    />
                    <AnimatePresenceField show={Number(autoDeductBreakMinutes) > 0}>
                        <NumberField
                            label="Auto-deduct after"
                            description="Only deduct once a shift has run at least this long."
                            suffix="min"
                            disabled={disabled}
                            error={errors.autoDeductAfterMinutes?.message}
                            {...register('autoDeductAfterMinutes')}
                        />
                    </AnimatePresenceField>
                </SectionCard>

                <SectionCard icon={Coins} title="Pay" description="Overtime rules, currency, and default rates">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
                        <NumberField
                            label="Overtime threshold"
                            description="Hours worked in a shift beyond this trigger overtime pay."
                            suffix="hrs"
                            step="0.5"
                            disabled={disabled}
                            error={errors.overtimeThresholdHours?.message}
                            {...register('overtimeThresholdHours')}
                        />
                        <NumberField
                            label="Overtime multiplier"
                            description="Pay multiplier applied to overtime hours, e.g. 1.5 for time-and-a-half."
                            suffix="×"
                            step="0.1"
                            disabled={disabled}
                            error={errors.overtimeMultiplier?.message}
                            {...register('overtimeMultiplier')}
                        />
                        <NumberField
                            label="Weekly hours target"
                            description="Target hours per week per worker — drives the utilisation figure on the dashboard."
                            suffix="hrs"
                            disabled={disabled}
                            error={errors.weeklyHoursTarget?.message}
                            {...register('weeklyHoursTarget')}
                        />
                        <div className="flex flex-col gap-1 min-w-0">
                            <label className="text-sm font-medium text-slate-800">Currency</label>
                            <p className="text-xs text-slate-500">Currency used across invoices and pay rates.</p>
                            <div className="mt-1">
                                <Controller
                                    control={control}
                                    name="currency"
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                                            <SelectTrigger className="w-32 h-9 border-[#E2E8F0]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GBP">GBP (£)</SelectItem>
                                                <SelectItem value="USD">USD ($)</SelectItem>
                                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                    <NumberField
                        label="Default pay rate"
                        description="Prefills the pay rate field when creating a new job."
                        suffix={`${CURRENCY_SYMBOLS[currency] ?? '£'}/hr`}
                        step="0.01"
                        disabled={disabled}
                        error={errors.defaultPayRate?.message}
                        className="pr-16"
                        {...register('defaultPayRate')}
                    />
                </SectionCard>

                <SectionCard icon={CalendarClock} title="Scheduling" description="Timezone, week layout, and recurring shift generation">
                    <Controller
                        control={control}
                        name="timezone"
                        render={({ field }) => (
                            <TimezoneSelect
                                value={field.value}
                                onChange={field.onChange}
                                disabled={disabled}
                                error={errors.timezone?.message}
                            />
                        )}
                    />
                    <Controller
                        control={control}
                        name="weekStartsOn"
                        render={({ field }) => (
                            <SegmentedControl<WeekStartsOn>
                                label="Week starts on"
                                description="First day of the week shown across the calendar and reports."
                                value={field.value}
                                onChange={field.onChange}
                                disabled={disabled}
                                options={[
                                    { value: 'monday', label: 'Monday' },
                                    { value: 'sunday', label: 'Sunday' },
                                ]}
                            />
                        )}
                    />
                    <NumberField
                        label="Generate shifts ahead"
                        description="How far in advance recurring shifts are created."
                        suffix="days"
                        disabled={disabled}
                        error={errors.generateAheadDays?.message}
                        {...register('generateAheadDays')}
                    />
                    <Controller
                        control={control}
                        name="openShiftsEnabled"
                        render={({ field }) => (
                            <ToggleField
                                label="Open shifts"
                                description="Lets workers browse and claim unfilled shifts themselves."
                                checked={field.value}
                                onChange={field.onChange}
                                disabled={disabled}
                            />
                        )}
                    />
                    <AnimatePresenceField show={openShiftsEnabled}>
                        <Controller
                            control={control}
                            name="openShiftsRequireApproval"
                            render={({ field }) => (
                                <ToggleField
                                    label="Require approval"
                                    description="A manager must approve a claim before the worker is confirmed on the shift."
                                    checked={field.value}
                                    onChange={field.onChange}
                                    disabled={disabled}
                                />
                            )}
                        />
                    </AnimatePresenceField>
                </SectionCard>

                {isAdmin && (
                    <div className="sticky bottom-4 flex justify-end">
                        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-lg shadow-slate-900/5 px-4 py-3 flex items-center gap-3">
                            <p className="text-xs text-slate-500">
                                {isDirty ? 'You have unsaved changes' : 'All changes saved'}
                            </p>
                            <button
                                type="submit"
                                disabled={!isDirty || isSubmitting}
                                className="h-9 px-4 rounded-lg bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#162D4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    )
}

// Same animate-in/out shape as RecurringJobSection's conditional fields,
// factored out so every conditional field here doesn't repeat the
// AnimatePresence/motion boilerplate.
function AnimatePresenceField({ show, children }: { show: boolean; children: React.ReactNode }) {
    return (
        <AnimatePresence initial={false}>
            {show && (
                <motion.div
                    key="conditional-field"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ overflow: 'hidden' }}
                    className="min-w-0"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
