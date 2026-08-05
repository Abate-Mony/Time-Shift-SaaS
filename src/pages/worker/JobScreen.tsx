import JobCard from "@/components/JobCard"
import SearchComponent from "@/components/Search"
import FilterButton from "@/components/ui/FilterButton"
import { useFilter } from "@/hooks/CustomLinkFilterHook"
import { cn } from "@/lib/utils"
import customFetch from "@/utils/customFetch"
import type { CreateJobForm } from "@/utils/types"
import { useQuery, type QueryClient } from "@tanstack/react-query"
import { Briefcase, Check, ChevronLeft, ChevronRight, Clock, Star } from "lucide-react"
import { useState } from "react"
import { useLoaderData, useSearchParams, type LoaderFunctionArgs, type Params } from "react-router"
const jobsQuery = (params: Params) => {

    const { search,
        sort, page,
        status, date } = params;
    return (
        {


            queryKey: [
                'jobs',
                {
                    search: search ?? '',
                    status: status ?? 'all',
                    sort: sort ?? 'asc',
                    page: page ?? 1,
                    date: date ?? ''
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
    const { handleFilterChange } = useFilter()

    const { jobs, page, limit, total, totalPages } = useQuery(jobsQuery(searchValues)).data as {
        jobs: CreateJobForm[],
        page: number,
        limit: number,
        total: number,
        totalPages: number
    }
console.log({page, limit, total, totalPages } )
    const completedHistory = [
        { date: '24 Jul', job: 'Excel Centre — Event Staffing', hours: 12, pay: 216, rated: true },
        { date: '23 Jul', job: 'Waterloo — Crowd Management', hours: 8, pay: 144, rated: false },
        { date: '22 Jul', job: 'Heathrow T5 — Security', hours: 8, pay: 144, rated: true },
        { date: '21 Jul', job: 'Canary Wharf — Day Patrol', hours: 8, pay: 144, rated: true },
    ]

    return (
        <div className="flex flex-col gap-4 pb-4">
            <div>
                <h2 className="text-lg font-bold text-slate-900">My Jobs</h2>
                <p className="text-xs text-slate-400 mt-0.5">All your assignments in one place</p>
            </div>
            <SearchComponent placeholder="Search Jobs" />

            {/* Tab pills */}
            {/* "draft" | "published" | "assigned" | "in-progress" | "completed" | "cancelled"  */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                {([
                    { id: 'all', label: 'All', count: jobs.length },
                    { id: 'draft', label: 'Draft', count: jobs.filter(job => job.status == "draft").length },
                    // { id: 'assigned', label: 'assigned', count: jobs.filter(job => job.status == "assigned").length },
                    { id: 'completed', label: 'Completed', count: jobs.filter(job => job.status == "completed").length },
                    { id: 'in-progress', label: 'inprogress', count: jobs.filter(job => job.status == "cancelled").length },
                    { id: 'cancelled', label: 'Cancelled', count: jobs.filter(job => job.status == "in-progress").length },
                ] as { id: CreateJobForm["status"]; label: string; count: number }[]).map((t, idx) => (
                    <FilterButton
                        onClick={() => setTab(t.id)}
                        animateClassName={cn(
                            t.id === 'assigned' ? 'bg-amber-100 ' : 'bg-blue-100 '
                            , "h-full opacity-45! backdrop-blur-sm!"
                        )
                        }
                        // animateClassName={`h-full ${tab === t.id ? (t.id === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700') : 'bg-slate-00 text-slate-500'}`}
                        className={`flex-1 flex items-center   justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-all
                         bg-white group-[.active-slide]:text-slate-900 shadow-s text-slate-500 hover:text-slate-700`}
                        name='status'
                        value={t.id}
                        key={t.id}
                    >
                        {t.label}
                        {t.count > 0 && (
                            <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center
                            ${tab === t.id ? (t.id === 'assigned' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700') : 'bg-slate-00 text-slate-500'}`}>
                                {t.count}
                            </span>
                        )}

                    </FilterButton>


                ))}
            </div>

            {/* Job list */}
            <div className="flex flex-col gap-3">






                {tab === 'completed' && completedHistory.map((h, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
                        <div className="h-1 bg-emerald-500" />
                        <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{h.job}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{h.date}</p>
                                </div>
                                <span className="text-sm font-bold text-emerald-600 shrink-0">£{h.pay}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Clock size={11} className="text-slate-400" />
                                    {h.hours} hours worked
                                </div>
                                {h.rated ? (
                                    <div className="flex items-center gap-1 text-amber-500">
                                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={11} fill="currentColor" />)}
                                    </div>
                                ) : (
                                    <button className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors">
                                        Rate job →
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {
                    jobs.length ? jobs.map(job => <JobCard job={job} key={job._id} />) : <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-sm">
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
        </div>
    )
}
