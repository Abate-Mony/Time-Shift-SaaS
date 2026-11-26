import { Avatar, Badge } from '@/components/ui'
import { getInitials } from '@/utils/getInitials'
import {
    declineBookingRequest,
    bookingRequestsQuery,
    type BookingRequest,
} from '@/utils/bookingRequests'
import {
    declineJobChangeRequest,
    approveCancelJobChangeRequest,
    jobChangeRequestsQuery,
    type JobChangeRequest,
} from '@/utils/jobChangeRequests'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ArrowRight, Calendar, Check, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import toast from 'react-hot-toast'

// Single inbox for everything a client asks for through the portal — was
// two separate pages/sidebar items (Booking Requests, Change Requests)
// until they were merged here so managers check one place instead of two.
export const loader = (queryClient: QueryClient) => async () => {
    await Promise.all([
        queryClient.ensureQueryData(bookingRequestsQuery()),
        queryClient.ensureQueryData(jobChangeRequestsQuery()),
    ])
    return null
}

export type RequestStatus = 'pending' | 'approved' | 'declined' | 'cancelled'
type StatusFilter = 'pending' | 'approved' | 'declined' | 'all'
type TypeFilter = 'all' | 'booking' | 'change'

export type Row =
    | { kind: 'booking'; id: string; status: RequestStatus; createdAt: string; data: BookingRequest }
    | { kind: 'change'; id: string; status: RequestStatus; createdAt: string; data: JobChangeRequest }

export const STATUS_BADGE: Record<RequestStatus, { variant: 'warning' | 'success' | 'danger' | 'neutral'; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    approved: { variant: 'success', label: 'Approved' },
    declined: { variant: 'danger', label: 'Declined' },
    cancelled: { variant: 'neutral', label: 'Cancelled' },
}

// Cancelled isn't a tab of its own — those rows only surface under "All",
// same as the mockup (4 tabs, not 5).
const STATUS_TABS: { id: StatusFilter; label: string }[] = [
    { id: 'pending', label: 'Waiting' },
    { id: 'approved', label: 'Approved' },
    { id: 'declined', label: 'Declined' },
    { id: 'all', label: 'All' },
]

const TYPE_TABS: { id: TypeFilter; label: string }[] = [
    { id: 'all', label: 'All types' },
    { id: 'booking', label: 'New bookings' },
    { id: 'change', label: 'Changes' },
]

// How long a request has been waiting for a reply — turns amber once it's
// been sitting a full day, so a slow reply stands out in the list.
export function formatWaiting(createdAt: string): { label: string; stale: boolean } {
    const minutes = dayjs().diff(dayjs(createdAt), 'minute')
    if (minutes < 60) return { label: `Waiting ${minutes < 1 ? '<1' : minutes} min`, stale: false }
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return { label: `Waiting ${hours} hour${hours === 1 ? '' : 's'}`, stale: false }
    const days = Math.floor(hours / 24)
    return { label: `Waiting ${days} day${days === 1 ? '' : 's'}`, stale: true }
}

export function RequestRow({ row, linkable = true }: { row: Row; linkable?: boolean }) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [declining, setDeclining] = useState(false)
    const [reviewNotes, setReviewNotes] = useState('')

    const isBooking = row.kind === 'booking'
    const booking = row.kind === 'booking' ? row.data : null
    const change = row.kind === 'change' ? row.data : null
    const client = typeof row.data.client === 'string' ? null : row.data.client
    const requestedBy = typeof row.data.requestedBy === 'string' ? null : row.data.requestedBy
    const jobId = change ? (typeof change.job === 'string' ? change.job : change.job._id) : null
    const jobTitle = change ? (typeof change.job === 'string' ? null : change.job.title) : null

    const declineMutation = useMutation<BookingRequest | JobChangeRequest | null, Error, void>({
        mutationFn: () =>
            isBooking
                ? declineBookingRequest(row.id, reviewNotes.trim() || undefined)
                : declineJobChangeRequest(row.id, reviewNotes.trim() || undefined),
        onSuccess: (result) => {
            if (!result) return
            queryClient.invalidateQueries({ queryKey: isBooking ? ['booking-requests'] : ['job-change-requests'] })
            queryClient.invalidateQueries({ queryKey: isBooking ? ['booking-request', row.id] : ['job-change-request', row.id] })
            setDeclining(false)
            setReviewNotes('')
        },
        onError: (err) => {
            const message = err instanceof Error ? err.message : 'Something went wrong.'
            toast.error(message, { position: 'bottom-center' })
        },
    })

    const approveCancelMutation = useMutation({
        mutationFn: () => approveCancelJobChangeRequest(row.id),
        onSuccess: (result) => {
            if (!result) return
            queryClient.invalidateQueries({ queryKey: ['job-change-requests'] })
            queryClient.invalidateQueries({ queryKey: ['job-change-request', row.id] })
        },
        onError: (err) => {
            const message = err instanceof Error ? err.message : 'Something went wrong.'
            toast.error(message, { position: 'bottom-center' })
        },
    })

    const badge = STATUS_BADGE[row.status]
    const waiting = row.status === 'pending' ? formatWaiting(row.createdAt) : null

    return (
        <div className="bg-card border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <Avatar initials={getInitials(client?.name ?? '?')} size="sm" index={0} />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            {linkable ? (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/requests/${row.kind}/${row.id}`)}
                                    className="text-sm font-semibold text-foreground truncate hover:underline hover:text-[var(--primary)] text-left"
                                >
                                    {isBooking ? (client?.name ?? 'Unknown client') : (jobTitle ?? 'Unknown booking')}
                                </button>
                            ) : (
                                <p className="text-sm font-semibold text-foreground truncate">
                                    {isBooking ? (client?.name ?? 'Unknown client') : (jobTitle ?? 'Unknown booking')}
                                </p>
                            )}
                            <span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 ${isBooking ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                {isBooking ? 'New booking' : 'Change'}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {isBooking ? (
                                <>Requested by {requestedBy?.fullname ?? 'a portal user'}{requestedBy?.email ? ` · ${requestedBy.email}` : ''}</>
                            ) : (
                                <>{client?.name ?? 'Unknown client'} · Requested by {requestedBy?.fullname ?? 'a portal user'}</>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {waiting && (
                        <span className={`text-[11px] font-semibold ${waiting.stale ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            {waiting.label}
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
                {booking && (
                    <>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            <Calendar size={13} className="text-muted-foreground" />
                            {dayjs(booking.preferredDate).format('ddd, D MMM YYYY')}{booking.preferredTime ? ` · ${booking.preferredTime}` : ''}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                            {booking.service}
                        </span>
                    </>
                )}
                {change && (
                    <>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            <Calendar size={13} className="text-muted-foreground" />
                            {dayjs(change.originalDate).format('ddd, D MMM YYYY')} · {change.originalStartTime}–{change.originalEndTime}
                        </span>
                        {change.type === 'reschedule' && (
                            <>
                                <ArrowRight size={13} className="text-muted-foreground" />
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                                    {dayjs(change.requestedDate).format('ddd, D MMM YYYY')} · {change.requestedStartTime}–{change.requestedEndTime}
                                </span>
                            </>
                        )}
                        <span className="text-xs font-semibold text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 capitalize">
                            {change.type}
                        </span>
                    </>
                )}
            </div>

            {!!(booking?.notes || change?.reason) && (
                <p className="mt-2 text-sm text-muted-foreground">{booking?.notes || change?.reason}</p>
            )}

            {!!row.data.reviewNotes && (
                <div className="mt-2 bg-muted rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Note: </span>{row.data.reviewNotes}</p>
                </div>
            )}

            {row.status === 'pending' && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    {declining ? (
                        <div className="flex flex-col gap-2">
                            <textarea
                                value={reviewNotes}
                                onChange={e => setReviewNotes(e.target.value)}
                                placeholder="Optional note for the client..."
                                rows={2}
                                className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => declineMutation.mutate()}
                                    disabled={declineMutation.isPending}
                                    className="h-8 px-3 rounded-lg bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors disabled:opacity-50"
                                >
                                    Confirm decline
                                </button>
                                <button
                                    onClick={() => setDeclining(false)}
                                    className="h-8 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {booking && (
                                <button
                                    onClick={() => navigate(`/create-job?bookingRequest=${row.id}`)}
                                    className="h-8 px-3.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                                >
                                    <Check size={13} /> Approve
                                </button>
                            )}
                            {change?.type === 'reschedule' && (
                                <button
                                    onClick={() => navigate(`/jobs/${jobId}/edit?jobChangeRequest=${row.id}`)}
                                    className="h-8 px-3.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                                >
                                    <Check size={13} /> Approve
                                </button>
                            )}
                            {change?.type === 'cancel' && (
                                <button
                                    onClick={() => approveCancelMutation.mutate()}
                                    disabled={approveCancelMutation.isPending}
                                    className="h-8 px-3.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                >
                                    <Check size={13} /> Approve
                                </button>
                            )}
                            <button
                                onClick={() => setDeclining(true)}
                                className="h-8 px-3.5 rounded-lg bg-destructive/10 text-destructive text-xs font-bold flex items-center gap-1.5 hover:bg-destructive/20 transition-colors"
                            >
                                <X size={13} /> Decline
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export function Requests() {
    const { data: bookingRequests } = useQuery(bookingRequestsQuery()) as { data: BookingRequest[] }
    const { data: jobChangeRequests } = useQuery(jobChangeRequestsQuery()) as { data: JobChangeRequest[] }
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

    const rows: Row[] = useMemo(() => [
        ...bookingRequests.map(r => ({ kind: 'booking' as const, id: r._id, status: r.status, createdAt: r.createdAt, data: r })),
        ...jobChangeRequests.map(r => ({ kind: 'change' as const, id: r._id, status: r.status, createdAt: r.createdAt, data: r })),
    ].sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt))), [bookingRequests, jobChangeRequests])

    const pendingCount = rows.filter(r => r.status === 'pending').length
    const byStatus = rows.filter(r => statusFilter === 'all' || r.status === statusFilter)
    const filtered = byStatus.filter(r => typeFilter === 'all' || r.kind === typeFilter)

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-foreground tracking-tight">Requests</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Bookings and changes your clients ask for through the client portal.</p>
            </div>

            <div className="flex items-center gap-1 bg-muted rounded-xl p-1 mb-3 w-fit flex-wrap">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setStatusFilter(tab.id)}
                        className={`h-8 px-3.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${statusFilter === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {tab.label}
                        {tab.id === 'pending' && pendingCount > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-1 bg-muted rounded-xl p-1 mb-5 w-fit flex-wrap">
                {TYPE_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setTypeFilter(tab.id)}
                        className={`h-7 px-3 rounded-lg text-xs font-semibold transition-all ${typeFilter === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="bg-card border border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center py-16 text-center px-6">
                    <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/6 flex items-center justify-center mb-3">
                        <Calendar size={18} className="text-[var(--primary)]" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No requests here</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {statusFilter === 'pending' ? "You're all caught up." : "Nothing in this view yet."}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map(row => (
                        <RequestRow key={`${row.kind}-${row.id}`} row={row} />
                    ))}
                </div>
            )}
        </div>
    )
}
