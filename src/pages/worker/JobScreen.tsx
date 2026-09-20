import CompletedJobCard from "@/components/CompletedJobCard"
import JobCard from "@/components/JobCard"
import SearchComponent from "@/components/Search"
import { EmptyState } from "@/components/empty-state"
import FilterButton from "@/components/ui/FilterButton"
import { Scrollable } from "@/components/ui/scrollable"
import { useFilter } from "@/hooks/CustomLinkFilterHook"
import { cn } from "@/lib/utils"
import customFetch from "@/utils/customFetch"
import { formatDate } from "@/utils/date"
import type { CreateJobForm } from "@/utils/types"
import { useQuery, type QueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { AlertCircle, Briefcase, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react"
import { useMemo, useState } from "react"
import { useLoaderData, useSearchParams, type LoaderFunctionArgs, type Params } from "react-router"
import { DAY_LABELS, startOfWeek } from "./ScheduleScreen"
import { ActiveFiltersBar } from "@/components/ui/ActiveFiltersBar"

const jobsQuery = (params: Params) => {

    const { search,
        sort, page,
        status, start, end } = params;
    return (
        {


            queryKey: [
                'jobs',
                {
                    search: search ?? '',
                    status: status ?? 'all',
                    sort: sort ?? 'asc',
                    page: page ?? 1,
                    start: start ?? '',
                    end: end ?? ''
                }
            ],
            queryFn: async () => {
                const { data } = await customFetch.get<any>('/workers', {
                    params
                });
                return data;
            }
        }
    )
}
export const loader = (queryClient: QueryClient) => async ({ request }: LoaderFunctionArgs) => {

    const params = Object.fromEntries([
        ...new URL(request.url).searchParams.entries(),
    ]);
    await queryClient.ensureQueryData(jobsQuery(params))
    return ({
        searchValues: { ...params }
    })

}
export default function JobsScreen() {
    const [searchParams] = useSearchParams()
    const { searchValues } = useLoaderData() as {
        searchValues: Params
    }
    const { handleFilterChange, handleFiltersChange } = useFilter()
    const [weekStart, setWeekStart] = useState(() => {
        const start = searchValues.start
        return startOfWeek(start ? dayjs(start) : dayjs())
    })
    const weekDays = useMemo(() => (
        Array.from({ length: 7 }, (_, i) => {
            const date = weekStart.add(i, 'day')
            return {
                day: DAY_LABELS[i],
                date,
                dateStr: date.format('YYYY-MM-DD'),
                isToday: date.isSame(dayjs(), 'day'),
            }
        })
    ), [weekStart])

    const { jobs, page, limit, total, totalPages } = useQuery(jobsQuery(searchValues)).data as {
        jobs: CreateJobForm[],
        page: number,
        limit: number,
        total: number,
        totalPages: number
    }

    const tabs: { id: CreateJobForm["status"] | "all"; label: string; }[] = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending' },
        { id: 'accepted', label: 'Accepted' },
        { id: 'in-progress', label: 'In Progress' },
        { id: 'completed', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' },
        { id: 'declined', label: 'Declined' },
    ]
    const activeTab = searchParams.get('status') ?? 'all'
    return (
        <div className="flex flex-col gap-4 pb-4">
            <div>
                <h2 className="text-lg font-bold text-foreground">My Jobs</h2>
                <p className="text-xs text-muted-foreground mt-0.5">All your assignments in one place</p>
            </div>


            
                <>
                    <SearchComponent placeholder="Search Jobs" />

                    {/* Date filter — week strip, same UI as the Schedule screen */}
                    <div className="bg-card rounded-2xl border border-[var(--border)] p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-foreground">Week of {weekStart.format('D MMMM')}</p>
                            <div className="flex items-center gap-1">
                                {searchParams.get('start') && (
                                    <button
                                        type="button"
                                        onClick={() => handleFiltersChange({ start: null, end: null })}
                                        className="flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-muted-foreground hover:bg-muted transition-colors mr-1"
                                    >
                                        <X size={11} /> Clear
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setWeekStart(w => w.subtract(7, 'day'))}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWeekStart(w => w.add(7, 'day'))}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5">
                            {weekDays.map((d, i) => {
                                const isSelected = d.dateStr === searchParams.get('start')
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleFiltersChange(
                                            isSelected ? { start: null, end: null } : { start: d.dateStr, end: d.dateStr }
                                        )}
                                        className="flex flex-col items-center gap-1.5"
                                    >
                                        <span className="text-[10px] font-semibold text-muted-foreground">{d.day}</span>
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold relative transition-colors
                                          ${isSelected ? 'bg-[var(--primary)] text-white shadow-sm' : d.isToday ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' : 'text-muted-foreground border border-border'}`}>
                                            {d.date.date()}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Tab pills */}
                    {/* "draft" | "published" | "assigned" | "in-progress" | "completed" | "cancelled"  */}
                    <h2 className="text-sm font-medium text-foreground">Filter Status</h2>

                    <Scrollable>
                        {tabs.map((t, idx) => (
                            <FilterButton
                                layoutId="worker-job-screen-job-status"
                                animateClassName={cn(
                                    t.id === 'assigned' ? 'bg-amber-100 ' : 'bg-blue-100 '
                                    , "h-full opacity-45! backdrop-blur-sm!"
                                )
                                }
                                // animateClassName={`h-full ${tab === t.id ? (t.id === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700') : 'bg-slate-00 text-muted-foreground'}`}
                                className={`w-full max-w-fit flex items-center flex-none   justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-all
                         bg-card group-[.active-slide]:text-foreground shadow-s text-muted-foreground hover:text-foreground`}
                                name='status'
                                value={t.id}
                                key={t.id}
                                show
                            >
                                <div className="flex items-center justify-center gap-x-1.5">
                                    {t.label}
                                </div>
                            </FilterButton>


                        ))}
                    </Scrollable>

                    <ActiveFiltersBar
                        className="mb-1"
                        filters={[
                            {
                                // The "All" tab writes status=all itself (see FilterButton
                                // above), so that value is a real, present param but isn't
                                // actually a filter — must not show a "Status: All" chip that
                                // can never be cleared back to a state the tab bar would
                                // recognize as "All".
                                keys: 'status',
                                isActive: ([s]) => !!s && s !== 'all',
                                format: ([s]) => (s ?? '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                            },
                            {
                                keys: ['start', 'end'],
                                label: 'Date range',
                                format: ([start, end]) =>
                                    start && end && end !== start
                                        ? `${formatDate(start, 'D MMM')} – ${formatDate(end, 'D MMM')}`
                                        : formatDate(start ?? end ?? undefined, 'D MMM YYYY'),
                            },
                        ]}
                    />
                    {/* Job list */}
                    <div className="flex flex-col gap-3">






                        {
                            jobs?.length ? jobs.map(job =>
                                job.status === 'completed'
                                    ? <CompletedJobCard job={job} key={job._id} />
                                    : <JobCard job={job} key={job._id} />
                            ) : <div className="bg-card rounded-2xl border border-[var(--border)] p-10 text-center shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                                    <Briefcase size={20} className="text-blue-400" />
                                </div>
                                <p className="text-sm font-semibold text-foreground mb-1">
                                    No {activeTab === 'all' ? '' : `${tabs.find(t => t.id === activeTab)?.label.toLowerCase()} `}jobs
                                </p>
                                {activeTab === 'all' || activeTab === 'pending' ? (
                                    <p className="text-xs text-muted-foreground">Accept a job from Pending to start working.</p>
                                ) : null}
                            </div>
                        }
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between gap-3 pt-1">
                            <p className="text-xs text-muted-foreground">
                                Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => handleFilterChange({ key: 'page', value: String(page - 1) })}
                                    className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold text-muted-foreground bg-card border border-[var(--border)] hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={14} /> Prev
                                </button>
                                <span className="text-xs text-muted-foreground font-medium tabular-nums">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() => handleFilterChange({ key: 'page', value: String(page + 1) })}
                                    className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold text-muted-foreground bg-card border border-[var(--border)] hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
        </div>
    )
}
