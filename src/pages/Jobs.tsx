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
import type { CreateJobForm } from '@/utils/types'
import DataTable from '@/components/JobsTable'
import { jobsColumns } from '@/utils/columns'
import AnimatedHeadLessUi from '@/components/animated-headless-ui'


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
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const { searchValues } = useLoaderData() as {
    searchValues: Params
  }
  const navigate = useNavigate()
  const onNavigate = (path: string) => navigate(path)
  const { jobs, totalPages, currentPage } = useQuery(jobsQuery(searchValues)).data as {
    jobs: CreateJobForm[],
    totalPages: number,
    currentPage: number
  }
  const tabs = [
    { id: 'all', label: 'All Jobs', count: jobs.length },
    { id: 'in-progress', label: 'In Progress', count: jobs.filter(job => job.priority == "high").length },
    { id: 'assigned', label: 'Assigned', },
    { id: 'completed', label: 'Completed', },
    { id: 'draft', label: 'Draft', },
  ]
const [hoverIndex,setHoverIndex]=useState<number | null>(0)

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



      <div className="flex items-center gap-1 gap-x-0 border-b flex-wrap border-[#E2E8F0]">
        {tabs.map((tab, idx) => (
          <AnimatedHeadLessUi
          animatedClassName='bg-black/5 p-0 rounded-sm'
          className='flex items-center'
          hoverIndex={hoverIndex}
          setHoverIndex={setHoverIndex}
              layoutId='animated-job-filter-button'
            index={idx} >
            <FilterButton
              className=' mx-0 rounded-none flex justify-between'
              name='status'
              value={tab.id}
              key={tab.id}
              layoutId='job-filter-button'
              show
            >
            <span className='flex items-center justify-center'>
                {tab.label}
              <span className='ml-0.5
             rounded-full bg-black/5 p-2 text-xs size-2.5 flex items-center justify-center'>
                {tab?.count ?? 0}
              </span>
            </span>

            </FilterButton>
          </AnimatedHeadLessUi>
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

      <DataTable
        columns={jobsColumns}
        data={jobs}
        getRowId={(row) => row._id!}
      />



      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
        <p>Showing {jobs.length} of {jobs.length} jobs</p>
        <div className="flex items-center gap-1">

        </div>
      </div>
    </div>
  )
}
