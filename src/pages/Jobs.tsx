import { Clock, Copy, Edit, Eye, Filter, MapPin, MoreHorizontal, Plus, Search, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { useLoaderData, useNavigate, type LoaderFunctionArgs, type Params } from 'react-router'
import { Avatar, EmptyState, PriorityBadge, StatusBadge } from '../components/ui'
import { workers } from '../data/mockData'
import { Button } from '@/components/ui/button'
import FilterButton from '@/components/ui/FilterButton'
import SearchComponent from '@/components/Search'
import customFetch from '@/utils/customFetch'
import { useQuery, type QueryClient } from '@tanstack/react-query'


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
        const { data } = await customFetch.get<any>('/jobs', {
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
export function Jobs() {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const { searchValues } = useLoaderData() as any
  const navigate = useNavigate()
  const onNavigate = path => navigate(path)
  const { jobs, totalPages, currentPage } = useQuery(jobsQuery(searchValues)).data as any
  const tabs = [
    { id: 'all', label: 'All Jobs', count: jobs.length },
    { id: 'in-progress', label: 'In Progress', count: jobs.filter(j => j.status === 'in-progress').length },
    { id: 'assigned', label: 'Assigned', count: jobs.filter(j => j.status === 'assigned').length },
    { id: 'completed', label: 'Completed', count: jobs.filter(j => j.status === 'completed').length },
    { id: 'draft', label: 'Draft', count: jobs.filter(j => j.status === 'draft').length },
  ]


  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Jobs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and monitor all work assignments</p>
        </div>
        <Button onClick={() => onNavigate('/create-job')}>
          <Plus size={14} /> New Job
        </Button>
      </div>

      {/* Tabs */}
      {/* <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} /> */}

      <div className="flex items-center gap-1 border-b border-[#E2E8F0]">
        {tabs.map(tab => (
          <FilterButton
            name='status'
            value={tab.id}
            key={tab.id}
          // className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${"2" === tab.id ? 'bg-[#1E3A5F]/10 text-[#1E3A5F]' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
            )}
          </FilterButton>
        ))}
      </div>
      {/* Filters row */}
      <div className="flex items-center gap-3 mt-4 mb-5">
        <SearchComponent />
        <button className="flex items-center gap-2 h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-600 bg-white hover:bg-slate-50 transition-colors">
          <Filter size={13} /> Filter
        </button>
        <select className="h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-600 bg-white focus:outline-none appearance-none cursor-pointer">
          <option>Sort: Date ↓</option>
          <option>Sort: Name A–Z</option>
          <option>Sort: Priority</option>
          <option>Sort: Status</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr_0.7fr_0.7fr_40px] gap-4 px-5 py-3 border-b border-[#E2E8F0] bg-slate-50/60">
          {['Job', 'Location', 'Date & Time', 'Workers', 'Status', 'Priority', ''].map((h, i) => (
            <p key={i} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</p>
          ))}
        </div>

        {/* Rows */}
        {jobs.length === 0 ? (
          <EmptyState
            icon={<Users size={20} />}
            title="No jobs found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={<Button size="sm" onClick={() => onNavigate('create-job')}>Create Job</Button>}
          />
        ) : (
          jobs.map(job => {
            const assignedWorkers = workers.filter(w => job.workers.includes(w.id))
            return (
              <div
                key={job._id}
                className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr_0.7fr_0.7fr_40px] gap-4 px-5 py-4 border-b border-[#F1F5F9] hover:bg-slate-50/50 transition-colors items-center group relative"
              >
                {/* Job name */}
                <div>
                  <p className="text-sm font-medium text-slate-900 truncate">{job.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{job.company}</p>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-slate-400 shrink-0" />
                  <p className="text-xs text-slate-600 truncate">{job.location.split(',')[0]}</p>
                </div>

                {/* Date & time */}
                <div>
                  <p className="text-xs text-slate-700 font-medium">{new Date(job.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={10} className="text-slate-400" />
                    <p className="text-xs text-slate-400">{job.startTime} – {job.endTime}</p>
                  </div>
                </div>

                {/* Workers */}
                <div className="flex items-center">
                  {assignedWorkers.length > 0 ? (
                    <div className="flex -space-x-2">
                      {assignedWorkers.slice(0, 3).map((w, i) => (
                        <div key={w.id} className="ring-2 ring-white rounded-full">
                          <Avatar initials={w.avatar} size="sm" index={i} />
                        </div>
                      ))}
                      {assignedWorkers.length > 3 && (
                        <div className="ring-2 ring-white rounded-full w-7 h-7 bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600">
                          +{assignedWorkers.length - 3}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-red-400 font-medium">Unassigned</p>
                  )}
                </div>

                {/* Status */}
                <StatusBadge status={job.status} />

                {/* Priority */}
                <PriorityBadge priority={job.priority} />

                {/* Actions */}
                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === job.id ? null : job.id)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {openMenu === job.id && (
                    <div className="absolute right-0 top-8 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-10 py-1.5 w-44 animate-fade-in">
                      {[
                        { icon: Eye, label: 'View Details' },
                        { icon: Edit, label: 'Edit Job' },
                        { icon: Copy, label: 'Duplicate' },
                        { icon: Trash2, label: 'Delete', danger: true },
                      ].map(item => (
                        <button
                          key={item.label}
                          onClick={() => setOpenMenu(null)}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-slate-50 transition-colors ${item.danger ? 'text-red-500 hover:text-red-600' : 'text-slate-700'}`}
                        >
                          <item.icon size={13} />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
        <p>Showing {jobs.length} of {jobs.length} jobs</p>
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }).map((_, index) => (
            <FilterButton
          animateClassName="bg-black/75 size-full text-white !rounded-xs shadow-sm"
              label="page"
              value={index.toString()}
              key={index}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors !group-[active-slide]:text-white `} name={'page'}            >
              {index + 1}
            </FilterButton >
          ))}
        </div>
      </div>
    </div>
  )
}
