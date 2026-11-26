import { Avatar, Badge } from '@/components/ui'
import { getInitials } from '@/utils/getInitials'
import customFetch from '@/utils/customFetch'
import { clientDetailQuery } from '@/utils/clients'
import type { CreateJobForm } from '@/utils/types'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { AlertTriangle, Briefcase, Check, ChevronLeft, Mail, Phone, User, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams, type Params } from 'react-router'
import toast from 'react-hot-toast'
import { declineBookingRequest, singleBookingRequest, type BookingRequest } from '@/utils/bookingRequests'
import { singleJobChangeRequest, type JobChangeRequest } from '@/utils/jobChangeRequests'
import { RequestRow, STATUS_BADGE, formatWaiting, type Row } from './Requests'

type Kind = 'booking' | 'change'

// /requests/:kind/:id — a focused view of one request, linked to from the
// combined Requests inbox. Booking requests get the richer layout below
// (client history, contact card, an expired-date warning); change requests
// fall back to the compact card reused from the list (RequestRow) — there's
// no client-history/contact angle for a reschedule of an existing job.
export const loader = (queryClient: QueryClient) => async ({ params }: { params: Params }) => {
    const kind = params.kind as Kind
    const id = params.id as string
    if (kind === 'booking') await queryClient.ensureQueryData(singleBookingRequest(id))
    else await queryClient.ensureQueryData(singleJobChangeRequest(id))
    return null
}

// Same endpoint ClientDetailsaJobsPage uses for a client's job history —
// queried again here (rather than imported) since that query is private to
// that file; same query key, so the two pages share one cache entry.
const clientJobsQuery = (clientId: string) => ({
    queryKey: ['client-jobs', clientId],
    queryFn: async (): Promise<CreateJobForm[]> => {
        const { data } = await customFetch.get<{ jobs: CreateJobForm[] }>('/jobs', {
            params: { client: clientId, limit: 100 },
        })
        return data.jobs
    },
})

function BackLink() {
    const navigate = useNavigate()
    return (
        <button
            type="button"
            onClick={() => navigate('/requests')}
            className="mb-4 h-8 px-3 -ml-3 rounded-lg flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
            <ChevronLeft size={15} /> Back to requests
        </button>
    )
}

function BookingRequestDetail({ request }: { request: BookingRequest }) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [declining, setDeclining] = useState(false)
    const [reviewNotes, setReviewNotes] = useState('')

    const clientId = typeof request.client === 'string' ? request.client : request.client._id
    const clientName = typeof request.client === 'string' ? 'Unknown client' : request.client.name
    const requestedBy = typeof request.requestedBy === 'string' ? null : request.requestedBy

    const { data: clientDetail } = useQuery({ ...clientDetailQuery(clientId), enabled: !!clientId })
    const { data: jobs } = useQuery({ ...clientJobsQuery(clientId), enabled: !!clientId })

    const declineMutation = useMutation({
        mutationFn: () => declineBookingRequest(request._id, reviewNotes.trim() || undefined),
        onSuccess: (result) => {
            if (!result) return
            queryClient.invalidateQueries({ queryKey: ['booking-requests'] })
            queryClient.invalidateQueries({ queryKey: ['booking-request', request._id] })
            setDeclining(false)
            setReviewNotes('')
        },
        onError: (err) => {
            const message = err instanceof Error ? err.message : 'Something went wrong.'
            toast.error(message, { position: 'bottom-center' })
        },
    })

    const isPastDue = request.status === 'pending' && dayjs(request.preferredDate).isBefore(dayjs(), 'day')
    const daysAgo = isPastDue ? dayjs().diff(dayjs(request.preferredDate), 'day') : 0
    const waiting = request.status === 'pending' ? formatWaiting(request.createdAt) : null
    const badge = STATUS_BADGE[request.status]

    // Completed jobs for this client, most recent first — used both to show
    // a short history and to infer a "usual" time/crew to mention before
    // approving (real data only: no slot is shown unless jobs actually share it).
    const completedJobs = (jobs ?? [])
        .filter(j => j.status === 'completed')
        .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))
    const recentJobs = completedJobs.slice(0, 2)

    const slotCounts = new Map<string, number>()
    completedJobs.slice(0, 5).forEach(j => {
        const key = `${j.startTime}-${j.endTime}`
        slotCounts.set(key, (slotCounts.get(key) ?? 0) + 1)
    })
    const bestSlot = Array.from(slotCounts.entries()).reduce<{ key: string; count: number } | null>(
        (best, [key, count]) => (!best || count > best.count ? { key, count } : best),
        null
    )
    const usualSlot: string | null = bestSlot?.key ?? null
    const usualJob = usualSlot ? completedJobs.find(j => `${j.startTime}-${j.endTime}` === usualSlot) : null
    const usualWorkers = usualJob?.workers?.map(w => w.fullname).filter(Boolean).join(', ')

    const client = clientDetail?.client
    const clientPhone = client?.phone || client?.primaryContact?.phone
    const clientEmail = client?.billingEmail || client?.primaryContact?.email || requestedBy?.email
    const jobCount = client?.jobCount ?? clientDetail?.stats.totalJobs

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <BackLink />

            <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-blue-50 text-blue-700">
                    New booking
                </span>
                <Badge variant={badge.variant}>
                    {badge.label}{waiting ? ` · ${waiting.label.toLowerCase()}` : ''}
                </Badge>
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">{request.service}</h1>
            <p className="text-sm text-muted-foreground mt-1">
                For <span className="font-semibold text-foreground">{clientName}</span> · requested by {requestedBy?.fullname ?? 'a portal user'} on {dayjs(request.createdAt).format('ddd D MMM, HH:mm')}
            </p>

            {isPastDue && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">
                        <span className="font-semibold">The requested date has passed.</span> {clientName} asked for {dayjs(request.preferredDate).format('ddd D MMM')}, {daysAgo} day{daysAgo === 1 ? '' : 's'} ago. Approving will open the job form so you can set a new date before publishing — this request alone can't update it automatically.
                    </p>
                </div>
            )}

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 flex flex-col gap-5">
                    <div className="bg-card border border-[var(--border)] rounded-xl p-4">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">What they asked for</p>
                        <dl className="flex flex-col gap-2.5 text-sm">
                            <div className="flex items-center justify-between">
                                <dt className="text-muted-foreground">Service</dt>
                                <dd className="font-semibold text-foreground">{request.service}</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-muted-foreground">Date</dt>
                                <dd className="font-semibold">
                                    {isPastDue ? (
                                        <>
                                            <span className="line-through text-red-500">{dayjs(request.preferredDate).format('ddd D MMM YYYY')}</span>
                                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-red-50 text-red-600 align-middle">Passed</span>
                                        </>
                                    ) : (
                                        <span className="text-foreground">{dayjs(request.preferredDate).format('ddd D MMM YYYY')}</span>
                                    )}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-muted-foreground">Time</dt>
                                <dd className="font-semibold text-foreground">
                                    {request.preferredTime || <span className="text-muted-foreground font-normal">Any time (no time given)</span>}
                                </dd>
                            </div>
                        </dl>
                        {!!request.notes && (
                            <div className="mt-3 bg-muted rounded-lg px-3 py-2.5">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Client's note</p>
                                <p className="text-sm text-foreground">&ldquo;{request.notes}&rdquo;</p>
                            </div>
                        )}
                        {!!request.reviewNotes && (
                            <div className="mt-3 bg-muted rounded-lg px-3 py-2.5">
                                <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Note to client: </span>{request.reviewNotes}</p>
                            </div>
                        )}
                    </div>

                    {recentJobs.length > 0 && (
                        <div className="bg-card border border-[var(--border)] rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{clientName}'s recent jobs</p>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/clients/${clientId}`)}
                                    className="text-xs font-semibold text-[var(--primary)] hover:underline"
                                >
                                    View client →
                                </button>
                            </div>
                            <div className="flex flex-col gap-2">
                                {recentJobs.map(job => (
                                    <div key={job._id} className="flex items-center justify-between gap-2 text-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-xs font-semibold text-muted-foreground shrink-0 w-24">{dayjs(job.date).format('ddd D MMM')}</span>
                                            <span className="font-semibold text-foreground truncate">{job.title}</span>
                                            <span className="text-xs text-muted-foreground shrink-0">· {job.startTime}–{job.endTime}</span>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-emerald-50 text-emerald-700 shrink-0">Completed</span>
                                    </div>
                                ))}
                            </div>
                            {!!usualSlot && !!usualWorkers && (
                                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-[var(--border)]">
                                    Usually {usualSlot.replace('-', '–')} with {usualWorkers}.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-5">
                    {request.status === 'pending' && (
                        <div className="bg-card border border-[var(--border)] rounded-xl p-4">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Decide</p>
                            {declining ? (
                                <div className="flex flex-col gap-2">
                                    <textarea
                                        value={reviewNotes}
                                        onChange={e => setReviewNotes(e.target.value)}
                                        placeholder="Optional note for the client..."
                                        rows={3}
                                        className="w-full text-sm border border-[var(--border)] rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15"
                                    />
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => declineMutation.mutate()}
                                            disabled={declineMutation.isPending}
                                            className="h-9 px-3 rounded-lg bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors disabled:opacity-50"
                                        >
                                            Confirm decline
                                        </button>
                                        <button
                                            onClick={() => setDeclining(false)}
                                            className="h-9 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => navigate(`/create-job?bookingRequest=${request._id}`)}
                                        className="h-9 px-3.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors"
                                    >
                                        <Check size={14} /> Approve & create job
                                    </button>
                                    <button
                                        onClick={() => setDeclining(true)}
                                        className="h-9 px-3.5 rounded-lg bg-destructive/10 text-destructive text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-destructive/20 transition-colors"
                                    >
                                        <X size={14} /> Decline
                                    </button>
                                    <p className="text-xs text-muted-foreground mt-1">Decline asks for an optional reason, which {clientName} sees in the portal.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {request.status !== 'pending' && (
                        <div className="bg-card border border-[var(--border)] rounded-xl p-4">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Status</p>
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                            {!!request.reviewedAt && (
                                <p className="text-xs text-muted-foreground mt-2">Reviewed {dayjs(request.reviewedAt).format('ddd D MMM YYYY · HH:mm')}</p>
                            )}
                            {!!request.convertedJob && (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/jobs/${request.convertedJob}`)}
                                    className="mt-2 h-8 px-3 rounded-lg bg-muted text-xs font-bold text-foreground hover:bg-muted/70 transition-colors flex items-center gap-1.5 w-fit"
                                >
                                    <Briefcase size={13} /> View booked job
                                </button>
                            )}
                        </div>
                    )}

                    <div className="bg-card border border-[var(--border)] rounded-xl p-4">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Client contact</p>
                        <div className="flex items-center gap-2.5 mb-3">
                            <Avatar initials={getInitials(clientName)} size="lg" index={0} />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{clientName}</p>
                                {!!client && (
                                    <p className="text-xs text-muted-foreground">
                                        Client since {dayjs(client.createdAt).format('MMM YYYY')}{jobCount !== undefined ? ` · ${jobCount} job${jobCount === 1 ? '' : 's'}` : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 text-sm">
                            {!!requestedBy && (
                                <p className="flex items-center gap-2 text-muted-foreground"><User size={13} className="shrink-0" /> {requestedBy.fullname} (portal user)</p>
                            )}
                            {!!clientEmail && (
                                <p className="flex items-center gap-2 text-muted-foreground truncate"><Mail size={13} className="shrink-0" /> {clientEmail}</p>
                            )}
                            {!!clientPhone && (
                                <p className="flex items-center gap-2 text-muted-foreground"><Phone size={13} className="shrink-0" /> {clientPhone}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            {!!clientEmail && (
                                <a href={`mailto:${clientEmail}`} className="flex-1 h-8 rounded-lg bg-muted text-xs font-bold text-foreground hover:bg-muted/70 transition-colors flex items-center justify-center">
                                    Email
                                </a>
                            )}
                            {!!clientPhone && (
                                <a href={`tel:${clientPhone}`} className="flex-1 h-8 rounded-lg bg-muted text-xs font-bold text-foreground hover:bg-muted/70 transition-colors flex items-center justify-center">
                                    Call
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ChangeRequestDetail({ request }: { request: JobChangeRequest }) {
    const navigate = useNavigate()
    const row: Row = { kind: 'change', id: request._id, status: request.status, createdAt: request.createdAt, data: request }
    const jobId = typeof request.job === 'string' ? request.job : request.job._id

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <BackLink />
            <RequestRow row={row} linkable={false} />
            <div className="mt-4 bg-card border border-[var(--border)] rounded-xl p-4 flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span className="font-semibold text-foreground">{dayjs(request.createdAt).format('ddd, D MMM YYYY · HH:mm')}</span>
                </div>
                {!!request.reviewedAt && (
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Reviewed</span>
                        <span className="font-semibold text-foreground">{dayjs(request.reviewedAt).format('ddd, D MMM YYYY · HH:mm')}</span>
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => navigate(`/jobs/${jobId}`)}
                    className="mt-1 h-8 px-3 rounded-lg bg-muted text-xs font-bold text-foreground hover:bg-muted/70 transition-colors flex items-center gap-1.5 w-fit"
                >
                    <Briefcase size={13} /> View original booking
                </button>
            </div>
        </div>
    )
}

export function RequestDetail() {
    const { kind, id } = useParams<{ kind: Kind; id: string }>()
    const isBooking = kind === 'booking'

    const { data: booking } = useQuery({ ...singleBookingRequest(id ?? ''), enabled: isBooking }) as { data?: BookingRequest }
    const { data: change } = useQuery({ ...singleJobChangeRequest(id ?? ''), enabled: !isBooking }) as { data?: JobChangeRequest }

    if (isBooking) return booking ? <BookingRequestDetail request={booking} /> : null
    return change ? <ChangeRequestDetail request={change} /> : null
}
