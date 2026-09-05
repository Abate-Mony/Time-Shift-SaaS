import customFetch from "@/utils/customFetch"
import { fmtDate } from "@/utils/recurring"
import type { CreateJobForm } from "@/utils/types"
import { useQuery } from "@tanstack/react-query"
import { Briefcase, Calendar, ExternalLink, MapPin, Plus } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import { useClientDetail } from "./ClientDetailContext"

function jobStatusStyle(status?: string) {
    if (status === 'published') return 'bg-blue-50 text-blue-700'
    if (status === 'completed') return 'bg-emerald-50 text-emerald-700'
    if (status === 'cancelled') return 'bg-red-50 text-red-500'
    return 'bg-slate-100 text-slate-500'
}

const clientJobsQuery = (clientId: string) => ({
    queryKey: ['client-jobs', clientId],
    queryFn: async () => {
        const { data } = await customFetch.get<{ jobs: CreateJobForm[] }>('/jobs', {
            params: { client: clientId, limit: 100 },
        })
        return data.jobs
    },
})

export function ClientDetailsaJobsPage() {
    const { client } = useClientDetail()
    const [jobFilter, setJobFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
    const { data } = useQuery({ ...clientJobsQuery(client._id), enabled: !!client._id })
    const jobs = data ?? []

    const today = new Date().toISOString().slice(0, 10)
    const isUpcoming = (j: CreateJobForm) => (j.date ?? '') >= today && j.status !== 'completed' && j.status !== 'cancelled'
    const filtered = jobs.filter(j => {
        if (jobFilter === 'upcoming') return isUpcoming(j)
        if (jobFilter === 'past') return !isUpcoming(j)
        return true
    })

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                    {(['upcoming', 'past', 'all'] as const).map(f => (
                        <button key={f} onClick={() => setJobFilter(f)}
                            className={`h-7 px-3 rounded-lg text-xs font-semibold capitalize transition-all ${jobFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}>
                            {f === 'all' ? `All (${jobs.length})` : f === 'upcoming' ? `Upcoming (${jobs.filter(isUpcoming).length})` : `Past (${jobs.filter(j => !isUpcoming(j)).length})`}
                        </button>
                    ))}
                </div>
                <Link to={"/create-job"}
                    className="h-8 px-3.5 bg-[#1E3A5F] text-white text-xs font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center gap-1.5"
                >
                    <Plus size={12} /> Create job
                </Link>
            </div>

            {filtered.length === 0 ? (
                <div className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center py-12 text-center">
                    <Briefcase size={20} className="text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No {jobFilter} jobs for this client</p>
                </div>
            ) : (
                <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                    {filtered.map((job, i) => (
                        <Link to={`/jobs/${job._id}`}
                            key={job._id}
                            className={`w-full flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/70 transition-colors text-left ${i > 0 ? 'border-t border-[#E2E8F0]' : ''}`}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{job.title}</p>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                                    {job.date && <span className="flex items-center gap-1"><Calendar size={10} /> {fmtDate(job.date)}</span>}
                                    {(job.startTime || job.endTime) && <span>{job.startTime}–{job.endTime}</span>}
                                    {job.location && (
                                        <span className="flex items-center gap-1 min-w-0"><MapPin size={10} className="shrink-0" /><span className="truncate">{job.location}</span></span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${jobStatusStyle(job.status)}`}>
                                    {job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'Unknown'}
                                </span>
                                <ExternalLink size={12} className="text-slate-300" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
