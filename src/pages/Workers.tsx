import { Briefcase, ChevronRight, Clock, Mail, Phone, Plus, Search, Star, X } from 'lucide-react'
import { useState } from 'react'
import { Avatar, Card, StatusBadge } from '../components/ui'
import { jobs, workers } from '../data/mockData'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { useLoaderData, useNavigation, type LoaderFunctionArgs, type Params } from 'react-router'
import customFetch from '@/utils/customFetch'
import SearchComponent from '@/components/Search'
import { cn } from '@/lib/utils'
import { sleep } from '@/utils/sleep'
import { Button } from '@/components/ui/button'
import type { User } from '@/utils/types'

const workersQuery = (params: Params) => {

  const { search,
    sort, page,
    status, date } = params;
  return (
    {


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
        await sleep(3000)
        const { data } = await customFetch.get<any>('/users/users', {
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
  await queryClient.ensureQueryData(workersQuery(params))
  return ({
    searchValues: { ...params }
  })

}
export function Workers() {
  const navigation = useNavigation();

  const isSearching = navigation.state === "loading";
  const { searchValues } = useLoaderData() as any
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.role.toLowerCase().includes(search.toLowerCase())
  )

  const { users, nHits } = useQuery(workersQuery(searchValues)).data as {
    users: User[], nHits: number
  }
  const selectedWorker = users.find(w => w._id === selected)
  const workerJobs = selectedWorker ? jobs.filter(j => j.workers.includes(selectedWorker._id)) : []
  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Workers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{nHits} team members across all locations</p>
        </div>
        <Button size="sm"><Plus size={14} /> Add Worker {selected}</Button>
      </div>

      <div className="flex gap-5">
        {/* List */}
        <div className="flex-1 min-w-0">
          {/* Search */}

          <SearchComponent />
          <div className={cn("grid grid-cols-1 gap-3",

            isSearching && "opacity-60"
          )}>
            {users.map((worker, i) => (
              <Card
                key={worker._id}
                onClick={() => setSelected(selected === worker._id ? null : worker._id)}
                className={`p-4 transition-all ${selected === worker._id ? 'border-blue-300 ring-1 ring-blue-200' : ''}`}
              >
                <div className={cn("flex items-center gap-4",

                )}>
                  <Avatar initials={worker?.fullname.slice(0, 2)} size="lg" index={i} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-slate-900">{worker?.fullname}</p>
                      <StatusBadge status={"active"} />
                    </div>
                    <p className="text-xs text-slate-500">{worker?.role} · {"location"}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={11} />{worker?.isActive}h this week
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Briefcase size={11} />{worker?.isVerified} jobs done
                      </span>
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <Star size={11} fill="currentColor" />{worker?.lastLogin}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                      <Mail size={14} />
                    </button>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                      <Phone size={14} />
                    </button>
                    <ChevronRight size={14} className={`text-slate-300 transition-transform ${selected === worker._id ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Worker detail panel */}
        {selectedWorker && (
          <div className="w-80 shrink-0 animate-slide-in">
            <Card className="p-5 sticky top-19">
              <div className="flex items-start justify-between mb-4">
                <Avatar initials={selectedWorker._id} size="xl" index={users.findIndex(w => w._id === selectedWorker._id)} />
                <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                  <X size={14} />
                </button>
              </div>

              <h2 className="text-base font-semibold text-slate-900">{selectedWorker.fullname}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{selectedWorker.role ?? "role"}</p>
              <div className="mt-2"><StatusBadge status={"status"} /></div>

              <div className="mt-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  {selectedWorker.email}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  {"phone number"}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#F1F5F9] grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-slate-900">{"hours work"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">hrs/week</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{"selectedWorker.jobsCompleted"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">jobs done</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600">{"selectedWorker.rating"}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">rating</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Assigned Jobs</p>
                {workerJobs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">No jobs assigned</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {workerJobs.slice(0, 4).map(job => (
                      <div key={job.id} className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-700 font-medium truncate">{job.name}</p>
                        <StatusBadge status={job.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <Button size="sm" className="w-full">View Full Profile</Button>
                <Button variant="outline" size="sm" className="w-full">Assign to Job</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
