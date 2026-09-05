import CompletedJobCard from "@/components/CompletedJobCard"
import JobCard from "@/components/JobCard"
import SearchComponent from "@/components/Search"
import { EmptyState } from "@/components/empty-state"
import FilterButton from "@/components/ui/FilterButton"
import { Scrollable } from "@/components/ui/scrollable"
import { useFilter } from "@/hooks/CustomLinkFilterHook"
import { cn } from "@/lib/utils"
import customFetch from "@/utils/customFetch"
import type { CreateJobForm } from "@/utils/types"
import { useQuery, type QueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { AlertCircle, Briefcase, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react"
import { useMemo, useState } from "react"
import { useLoaderData, useSearchParams, type LoaderFunctionArgs, type Params } from "react-router"
import { DAY_LABELS, startOfWeek } from "./ScheduleScreen"

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
    const activeSlide = searchParams.get("status")
    const [tab, setTab] = useState<any>(activeSlide ?? 'pending')
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

    const tabs: { id: CreateJobForm["status"] | "all"; label: string; count: number }[] = [
        { id: 'all', label: 'All', count: jobs.length },
        { id: 'accepted', label: 'Accepted', count: jobs.filter(job => job.status == "accepted").length },
        { id: 'completed', label: 'Completed', count: jobs.filter(job => job.status == "completed").length },
        { id: 'in-progress', label: 'inprogress', count: jobs.filter(job => job.status == "cancelled").length },
        { id: 'cancelled', label: 'Cancelled', count: jobs.filter(job => job.status == "in-progress").length },
        { id: 'declined', label: 'Decline', count: jobs.filter(job => job.status == "declined").length },
    ]
    return (
        <div className="flex flex-col gap-4 pb-4">
            <div>
                <h2 className="text-lg font-bold text-slate-900">My Jobs</h2>
                <p className="text-xs text-slate-400 mt-0.5">All your assignments in one place</p>
            </div>


            
                <>
                    <SearchComponent placeholder="Search Jobs" />

                    {/* Date filter — week strip, same UI as the Schedule screen */}
                    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-slate-700">Week of {weekStart.format('D MMMM')}</p>
                            <div className="flex items-center gap-1">
                                {searchParams.get('start') && (
                                    <button
                                        type="button"
                                        onClick={() => handleFiltersChange({ start: null, end: null })}
                                        className="flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mr-1"
                                    >
                                        <X size={11} /> Clear
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setWeekStart(w => w.subtract(7, 'day'))}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWeekStart(w => w.add(7, 'day'))}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
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
                                        <span className="text-[10px] font-semibold text-slate-400">{d.day}</span>
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold relative transition-colors
                                          ${isSelected ? 'bg-[#1E3A5F] text-white shadow-sm' : d.isToday ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' : 'text-slate-500 border border-slate-100'}`}>
                                            {d.date.date()}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Tab pills */}
                    {/* "draft" | "published" | "assigned" | "in-progress" | "completed" | "cancelled"  */}
                    <h2 className="text-sm font-medium text-slate-900">Filter Status</h2>

                    <Scrollable>
                        {tabs.map((t, idx) => (
                            <FilterButton
                                layoutId="worker-job-screen-job-status"
                                onClick={() => setTab(t.id)}
                                animateClassName={cn(
                                    t.id === 'assigned' ? 'bg-amber-100 ' : 'bg-blue-100 '
                                    , "h-full opacity-45! backdrop-blur-sm!"
                                )
                                }
                                // animateClassName={`h-full ${tab === t.id ? (t.id === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700') : 'bg-slate-00 text-slate-500'}`}
                                className={`w-full max-w-fit flex items-center flex-none   justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-all
                         bg-white group-[.active-slide]:text-slate-900 shadow-s text-slate-500 hover:text-slate-700`}
                                name='status'
                                value={t.id}
                                key={t.id}
                                show
                            >
                                <div className="flex items-center justify-center gap-x-1.5">
                                    {t.label}
                                    {t.count > 0 && (
                                        <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center
                            ${tab === t.id ? (t.id === 'assigned' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700') : 'bg-slate-00 text-slate-500'}`}>
                                            {t.count}
                                        </span>
                                    )}

                                </div>
                            </FilterButton>


                        ))}
                    </Scrollable>

                    {/* Job list */}
                    <div className="flex flex-col gap-3">






                        {
                            jobs?.length ? jobs.map(job =>
                                job.status === 'completed'
                                    ? <CompletedJobCard job={job} key={job._id} />
                                    : <JobCard job={job} key={job._id} />
                            ) : <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                                    <Briefcase size={20} className="text-blue-400" />
                                </div>
                                <p className="text-sm font-semibold text-slate-700 mb-1">No {""} jobs</p>
                                <p className="text-xs text-slate-400">Accept a job from Pending to start working.</p>
                            </div>
                        }
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between gap-3 pt-1">
                            <p className="text-xs text-slate-400">
                                Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => handleFilterChange({ key: 'page', value: String(page - 1) })}
                                    className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-[#E2E8F0] hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={14} /> Prev
                                </button>
                                <span className="text-xs text-slate-500 font-medium tabular-nums">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() => handleFilterChange({ key: 'page', value: String(page + 1) })}
                                    className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-[#E2E8F0] hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
