import { Avatar, Badge } from '@/components/ui'
import { getInitials } from '@/utils/getInitials'
import { reviewTimeOffRequest, timeOffRequestsQuery, type TimeOffRequest, type TimeOffStatus } from '@/utils/timeOff'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { CalendarOff, Check, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export const loader = (queryClient: QueryClient) => async () => {
    await queryClient.ensureQueryData(timeOffRequestsQuery())
    return null
}

type FilterType = 'all' | TimeOffStatus

const STATUS_BADGE: Record<TimeOffStatus, { variant: 'warning' | 'success' | 'danger' | 'neutral'; label: string }> = {
    pending: { variant: 'warning', label: 'Pending' },
    approved: { variant: 'success', label: 'Approved' },
    rejected: { variant: 'danger', label: 'Declined' },
    cancelled: { variant: 'neutral', label: 'Cancelled' },
}

const TYPE_LABEL: Record<string, string> = {
    vacation: 'Vacation',
    sick: 'Sick',
    personal: 'Personal',
    other: 'Other',
}

function formatRange(startDate: string, endDate: string): string {
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    if (start.isSame(end, 'day')) return start.format('ddd, D MMM YYYY')
    return `${start.format('D MMM')} – ${end.format('D MMM YYYY')}`
}

function RequestCard({ request }: { request: TimeOffRequest }) {
    const queryClient = useQueryClient()
    const worker = typeof request.worker === 'string' ? null : request.worker
    const [rejecting, setRejecting] = useState(false)
    const [managerNotes, setManagerNotes] = useState('')

    const reviewMutation = useMutation({
        mutationFn: (decision: 'approve' | 'reject') => reviewTimeOffRequest(request._id, decision, managerNotes.trim() || undefined),
        onSuccess: (_, decision) => {
            toast.success(decision === 'approve' ? 'Request approved' : 'Request declined')
            queryClient.invalidateQueries({ queryKey: ['time-off'] })
            setRejecting(false)
            setManagerNotes('')
        },
        onError: (err) => {
            const message = err instanceof Error ? err.message : 'Something went wrong.'
            toast.error(message, { position: 'bottom-center' })
        },
    })

    const badge = STATUS_BADGE[request.status]

    return (
        <div className="bg-card border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                    <Avatar initials={getInitials(worker?.fullname ?? '?')} size="sm" index={0} />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{worker?.fullname ?? 'Unknown worker'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{worker?.email}</p>
                    </div>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <CalendarOff size={13} className="text-muted-foreground" />
                    {formatRange(request.startDate, request.endDate)}
                </span>
                <span className="text-xs font-semibold text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                    {TYPE_LABEL[request.type] ?? request.type}
                </span>
            </div>

            {!!request.reason && (
                <p className="mt-2 text-sm text-muted-foreground">{request.reason}</p>
            )}

            {!!request.managerNotes && (
                <div className="mt-2 bg-muted rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Note: </span>{request.managerNotes}</p>
                </div>
            )}

            {request.status === 'pending' && (
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    {rejecting ? (
                        <div className="flex flex-col gap-2">
                            <textarea
                                value={managerNotes}
                                onChange={e => setManagerNotes(e.target.value)}
                                placeholder="Optional note for the worker..."
                                rows={2}
                                className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => reviewMutation.mutate('reject')}
                                    disabled={reviewMutation.isPending}
                                    className="h-8 px-3 rounded-lg bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors disabled:opacity-50"
                                >
                                    Confirm decline
                                </button>
                                <button
                                    onClick={() => setRejecting(false)}
                                    className="h-8 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => reviewMutation.mutate('approve')}
                                disabled={reviewMutation.isPending}
                                className="h-8 px-3.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            >
                                <Check size={13} /> Approve
                            </button>
                            <button
                                onClick={() => setRejecting(true)}
                                disabled={reviewMutation.isPending}
                                className="h-8 px-3.5 rounded-lg bg-destructive/10 text-destructive text-xs font-bold flex items-center gap-1.5 hover:bg-destructive/20 transition-colors disabled:opacity-50"
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

export function TimeOffRequestsPage() {
    const { data: requests } = useQuery(timeOffRequestsQuery()) as { data: TimeOffRequest[] }
    const [filter, setFilter] = useState<FilterType>('pending')

    const filtered = requests.filter(r => filter === 'all' || r.status === filter)
    const counts = {
        all: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        cancelled: requests.filter(r => r.status === 'cancelled').length,
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-foreground tracking-tight">Time Off Requests</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Review and respond to your team's time-off requests.</p>
            </div>

            <div className="flex items-center gap-1 bg-muted rounded-xl p-1 mb-5 w-fit flex-wrap">
                {(['pending', 'approved', 'rejected', 'cancelled', 'all'] as FilterType[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`h-8 px-3.5 rounded-lg text-sm font-semibold capitalize transition-all ${filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {f} ({counts[f]})
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="bg-card border border-dashed border-[var(--border)] rounded-xl flex flex-col items-center justify-center py-16 text-center px-6">
                    <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/6 flex items-center justify-center mb-3">
                        <CalendarOff size={18} className="text-[var(--primary)]" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No requests here</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {filter === 'pending' ? "You're all caught up." : `No ${filter === 'all' ? '' : filter} requests yet.`}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map(request => (
                        <RequestCard key={request._id} request={request} />
                    ))}
                </div>
            )}
        </div>
    )
}
