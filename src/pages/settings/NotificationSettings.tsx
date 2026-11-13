import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { queryClient } from '@/lib/queryClient'
import { getNotificationPreferences, updateNotificationPreferences, type UpdateNotificationPreferencesPayload } from '@/utils/api-request-functions'
import type { EventNotificationPreference, NotificationChannel, NotificationEvent, NotificationPreferences } from '@/utils/types'
import { useMutation, useQuery } from '@tanstack/react-query'

// Same query key/fn the worker-facing NotificationPreferences.tsx screen
// uses (React Query dedupes by key) — this is genuinely the same per-user
// document, just a different subset of events shown, since a manager/admin
// has their own preferences row exactly like a worker does (see
// authControler.ts's signup flow / invitationController.ts's accept flow).
const notificationPreferencesQuery = {
    queryKey: ['notification-preferences'],
    queryFn: getNotificationPreferences,
}

// Admin/manager-facing events only — things a worker's own action triggers
// that a manager would want to hear about. The worker-facing screen's own
// SECTIONS deliberately excludes exactly these (its comment says so
// explicitly) because they "belong on an admin notification-preferences
// screen, not here" — this is that screen. Every event below already has a
// full NotificationPreferenceModel schema path and a real trigger
// elsewhere in the backend (see notificationPreferenceService.ts's
// DEFAULT_EVENT_PREFERENCES) — deliberately NOT a 1:1 restore of the old
// mock toggles, since several of those (Unassigned jobs, New worker
// registered, Worker offline/GPS, Overtime alerts, SMS) have no backing
// event or channel at all yet and can't be wired to anything real.
const SECTIONS: {
    title: string
    rows: { event: NotificationEvent; label: string; description: string }[]
}[] = [
    {
        title: 'Job Alerts',
        rows: [
            { event: 'job_accepted', label: 'Job accepted', description: 'When a worker accepts a shift' },
            { event: 'job_declined', label: 'Job rejected', description: 'When a worker rejects an assignment' },
            { event: 'job_completed', label: 'Job completed', description: 'When a worker finishes a job' },
        ],
    },
    {
        title: 'Team Alerts',
        rows: [
            { event: 'worker_checked_in', label: 'Worker checked in', description: 'When a worker clocks in to a shift' },
            { event: 'worker_late', label: 'Worker running late', description: 'When a worker clocks in late' },
            { event: 'worker_checked_out', label: 'Worker checked out', description: 'When a worker clocks out of a shift' },
            { event: 'geofence_warning', label: 'Geofence warning', description: 'When a worker checks in outside the job site' },
        ],
    },
    {
        title: 'Timesheets & Time Off',
        rows: [
            { event: 'timesheet_submitted', label: 'Timesheet submitted', description: 'When a worker submits a timesheet' },
            { event: 'time_off_requested', label: 'Time off requested', description: 'When a worker requests time off' },
        ],
    },
    {
        title: 'Shift Coverage',
        rows: [
            { event: 'shift_unfilled', label: 'Shift unfilled (day before)', description: 'A published shift tomorrow still has nobody confirmed' },
            { event: 'shift_unfilled_urgent', label: 'Shift unfilled (urgent)', description: 'A shift starts in about an hour with nobody confirmed' },
            { event: 'shift_auto_closed', label: 'Shift auto-closed', description: 'A worker forgot to clock out and their shift was closed automatically' },
            { event: 'missed_shift_review_requested', label: 'Missed-shift review requested', description: 'A worker says they worked but couldn’t clock in, and wants it reviewed' },
            { event: 'job_starting_soon', label: 'Job starting soon', description: 'A job you created starts in about an hour' },
        ],
    },
]

function PreferenceRowSkeleton({ switches = 1 }: { switches?: number }) {
    return (
        <div className="flex items-center justify-between gap-3 py-3.5">
            <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-44" />
            </div>
            <div className="flex items-center gap-3 shrink-0">
                {Array.from({ length: switches }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-9 rounded-full" />
                ))}
            </div>
        </div>
    )
}

function ChannelSwitch({ label, checked, disabled, onCheckedChange }: {
    label: string
    checked: boolean
    disabled?: boolean
    onCheckedChange: (value: boolean) => void
}) {
    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
            <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} className="shrink-0 data-[state=checked]:bg-[var(--primary)]" />
        </div>
    )
}

export default function NotificationSettings() {
    const { data, isLoading } = useQuery(notificationPreferencesQuery)
    const prefs = data?.preferences

    // Optimistic update: flips the switch immediately, snaps back to
    // whatever was cached if the save fails — same pattern as the
    // worker-facing screen (updateNotificationPreferences already toasts
    // the error, this only needs the rollback).
    const updateMutation = useMutation({
        mutationFn: (payload: UpdateNotificationPreferencesPayload) => updateNotificationPreferences(payload),
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: notificationPreferencesQuery.queryKey })
            const previous = queryClient.getQueryData<{ preferences: NotificationPreferences }>(notificationPreferencesQuery.queryKey)

            queryClient.setQueryData(
                notificationPreferencesQuery.queryKey,
                (current: { preferences: NotificationPreferences } | undefined) => {
                    if (!current) return current
                    return {
                        ...current,
                        preferences: {
                            ...current.preferences,
                            ...payload,
                            events: payload.events
                                ? {
                                    ...current.preferences.events,
                                    ...Object.fromEntries(
                                        Object.entries(payload.events).map(([event, channels]) => [
                                            event,
                                            { ...current.preferences.events[event as NotificationEvent], ...channels },
                                        ])
                                    ),
                                }
                                : current.preferences.events,
                        },
                    }
                }
            )

            return { previous }
        },
        onError: (_err, _payload, context) => {
            if (context?.previous) queryClient.setQueryData(notificationPreferencesQuery.queryKey, context.previous)
        },
    })

    const setMasterPreference = (key: 'emailEnabled' | 'pushEnabled' | 'inAppEnabled', value: boolean) =>
        updateMutation.mutate({ [key]: value })

    const setEventPreference = (event: NotificationEvent, channel: NotificationChannel, value: boolean) =>
        updateMutation.mutate({ events: { [event]: { [channel]: value } } })

    if (isLoading) {
        return (
            <div className="p-6 max-w-3xl mx-auto animate-fade-in flex flex-col gap-4">
                <div className="bg-card rounded-xl border border-[var(--border)] px-6">
                    <div className="py-4 border-b border-[var(--border)]"><Skeleton className="h-3 w-40" /></div>
                    <div className="divide-y divide-border">
                        {Array.from({ length: 3 }).map((_, i) => <PreferenceRowSkeleton key={i} />)}
                    </div>
                </div>
                {SECTIONS.map(section => (
                    <div key={section.title} className="bg-card rounded-xl border border-[var(--border)] px-6">
                        <div className="py-4 border-b border-[var(--border)]"><Skeleton className="h-3 w-24" /></div>
                        <div className="divide-y divide-border">
                            {section.rows.map((_, i) => <PreferenceRowSkeleton key={i} switches={3} />)}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (!prefs) {
        return (
            <div className="p-6 max-w-3xl mx-auto animate-fade-in">
                <div className="bg-card rounded-xl border border-[var(--border)] p-6">
                    <p className="text-sm text-red-500">Couldn't load your notification preferences.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in flex flex-col gap-4">
            {/* Master channels */}
            <div className="bg-card rounded-xl border border-[var(--border)] px-6 min-w-0">
                <div className="py-4 border-b border-[var(--border)]">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Communication Channels</p>
                </div>
                <div className="divide-y divide-border">
                    <div className="flex items-center justify-between py-3.5 min-w-0">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">Email notifications</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Receive important updates by email</p>
                        </div>
                        <Switch checked={prefs.emailEnabled} onCheckedChange={value => setMasterPreference('emailEnabled', value)} className="shrink-0 data-[state=checked]:bg-[var(--primary)]" />
                    </div>
                    <div className="flex items-center justify-between py-3.5 min-w-0">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">Push notifications</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Receive browser or device notifications</p>
                        </div>
                        <Switch checked={prefs.pushEnabled} onCheckedChange={value => setMasterPreference('pushEnabled', value)} className="shrink-0 data-[state=checked]:bg-[var(--primary)]" />
                    </div>
                    <div className="flex items-center justify-between py-3.5 min-w-0">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">In-app notifications</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Show notifications inside the dashboard</p>
                        </div>
                        <Switch checked={prefs.inAppEnabled} onCheckedChange={value => setMasterPreference('inAppEnabled', value)} className="shrink-0 data-[state=checked]:bg-[var(--primary)]" />
                    </div>
                </div>
            </div>

            {/* Event-specific preferences */}
            {SECTIONS.map(section => (
                <div key={section.title} className="bg-card rounded-xl border border-[var(--border)] px-6 min-w-0">
                    <div className="py-4 border-b border-[var(--border)]">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{section.title}</p>
                    </div>
                    <div className="divide-y divide-border">
                        {section.rows.map(row => {
                            // Falls back to all-off rather than crashing the whole page — an
                            // older cached copy of prefs can be missing an event the backend
                            // added since it was fetched.
                            const eventPrefs: EventNotificationPreference = prefs.events[row.event] ?? { email: false, push: false, inApp: false }
                            return (
                                <div key={row.event} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground">{row.label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{row.description}</p>
                                    </div>
                                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                                        <ChannelSwitch label="Email" checked={eventPrefs.email} disabled={!prefs.emailEnabled} onCheckedChange={value => setEventPreference(row.event, 'email', value)} />
                                        <ChannelSwitch label="Push" checked={eventPrefs.push} disabled={!prefs.pushEnabled} onCheckedChange={value => setEventPreference(row.event, 'push', value)} />
                                        <ChannelSwitch label="In-app" checked={eventPrefs.inApp} disabled={!prefs.inAppEnabled} onCheckedChange={value => setEventPreference(row.event, 'inApp', value)} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}
