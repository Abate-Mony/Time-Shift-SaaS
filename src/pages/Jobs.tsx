import AnimatedHeadLessUi from '@/components/animated-headless-ui'
import DataTable from '@/components/JobsTable'
import SearchComponent from '@/components/Search'
import { Checkbox } from '@/components/ui/checkbox'
import FilterButton from '@/components/ui/FilterButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFilter } from '@/hooks/CustomLinkFilterHook'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import { jobsColumns } from '@/utils/columns'
import { clientsQuery } from '@/utils/clients'
import customFetch from '@/utils/customFetch'
import type { CreateJobForm } from '@/utils/types'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useLoaderData, useNavigate, type LoaderFunctionArgs, type Params } from 'react-router'


const jobsQuery = (params: Params) => {

  const { search,
    sort, page,
    status, date,
    client, priority, unassigned, start, end, limit } = params;
  return (
    {


      queryKey: [
        'jobs',
        {
          search: search ?? '',
          status: status ?? 'all',
          sort: sort ?? 'asc',
          page: page ?? 1,
          date: date ?? '',
          client: client ?? '',
          priority: priority ?? '',
          unassigned: unassigned ?? '',
          start: start ?? '',
          end: end ?? '',
          limit: limit ?? '',
        }
      ],
      // queryFn forwards every URL param as-is, so a new filter just needs a
      // UI control setting it via useFilter — no change needed here beyond
      // adding it to the key above (for correct per-filter-combo caching).
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
  const { searchValues } = useLoaderData() as {
    searchValues: Params
  }
  const navigate = useNavigate()
  const onNavigate = (path: string) => navigate(path)
  const { jobs, totalJobs, totalPages, currentPage } = useQuery(jobsQuery(searchValues)).data as {
    jobs: CreateJobForm[],
    totalJobs: number,
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
  // console.log("jobs obj : ", jobs)
const [hoverIndex,setHoverIndex]=useState<number | null>(0)

  const [filterOpen, setFilterOpen] = useState(false)
  const { handleFilterChange, handleFiltersChange, searchQuery } = useFilter()

  const clientFilter = searchQuery.get('client') ?? ''
  const priorityFilter = searchQuery.get('priority') ?? ''
  const unassignedOnly = searchQuery.get('unassigned') === 'true'
  const startFilter = searchQuery.get('start') ?? ''
  const endFilter = searchQuery.get('end') ?? ''
  const sortValue = searchQuery.get('sort') ?? 'date_desc'
  // Matches the backend's own default (jobController.ts's getAllJobs) when
  // nothing is set, so this control reflects what's actually being applied.
  const limitValue = searchQuery.get('limit') ?? '100'

  const activeFilterCount = [clientFilter, priorityFilter, startFilter, endFilter, unassignedOnly ? 'x' : '']
    .filter(Boolean).length

  // Lazy — only fetched once the filter panel is actually opened, same
  // pattern as other on-demand option lists in this app.
  const { data: filterClients } = useQuery({ ...clientsQuery(), enabled: filterOpen })

  // Omitting the key entirely for page 1 (rather than writing "1") keeps the
  // URL clean for the common case and matches every other filter here, which
  // also omits its key at its default value.
  const goToPage = (p: number) => {
    handleFilterChange({ key: 'page', value: p > 1 ? String(p) : null })
  }

  // Changing how many jobs load per page changes what "page 2" even means,
  // so the current page number is dropped rather than carried forward —
  // otherwise a manager on page 4 of 10-per-page could land on an empty
  // page 4 of 2 after switching to 100-per-page.
  const handleLimitChange = (value: string) => {
    handleFiltersChange({ limit: value === '100' ? null : value, page: null })
  }

  const deleteSelectedJobs = async (selectedJobs: CreateJobForm[]) => {
    try {
      await Promise.all(selectedJobs.map((job) => customFetch.delete(`/jobs/${job._id}`)))
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast.success(`${selectedJobs.length} ${selectedJobs.length === 1 ? 'job' : 'jobs'} deleted successfully`)
    } catch (e) {
      toast.error('Failed to delete some jobs, try again later')
    }
  }

  return (
    <div className=" animate-fade-in">
    


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
      <div className="flex items-center gap-3 mt-4 mb-5 relative">
        <SearchComponent />

        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen(o => !o)}
            className={cn(
              "flex items-center gap-2 h-9 px-3 border rounded-lg text-sm bg-white hover:bg-slate-50 transition-colors",
              activeFilterCount > 0 ? "border-[#1E3A5F] text-[#1E3A5F]" : "border-[#E2E8F0] text-slate-600"
            )}
          >
            <Filter size={13} /> Filter
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#1E3A5F] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute z-20 top-full mt-2 left-0 w-72 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Client</Label>
                {/* The backend now expects a real Client _id here, not a
                    name substring — filtering by free text would just 400. */}
                <Select
                  value={clientFilter || 'all'}
                  onValueChange={v => handleFilterChange({ key: 'client', value: v === 'all' ? null : v })}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Any client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any client</SelectItem>
                    {filterClients?.clients.map(c => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Priority</Label>
                <Select
                  value={priorityFilter || 'all'}
                  onValueChange={v => handleFilterChange({ key: 'priority', value: v === 'all' ? null : v })}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Date range</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={startFilter}
                    onChange={e => handleFilterChange({ key: 'start', value: e.target.value })}
                    className="h-9"
                  />
                  <span className="text-slate-400 text-xs shrink-0">to</span>
                  <Input
                    type="date"
                    value={endFilter}
                    onChange={e => handleFilterChange({ key: 'end', value: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              <Label className="flex items-center gap-2 cursor-pointer font-normal">
                <Checkbox
                  checked={unassignedOnly}
                  onCheckedChange={checked => handleFilterChange({ key: 'unassigned', value: checked ? 'true' : null })}
                />
                <span className="text-sm text-slate-700">No workers assigned</span>
              </Label>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleFiltersChange({ client: null, priority: null, unassigned: null, start: null, end: null })
                    setFilterOpen(false)
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 self-start"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        <Select value={sortValue} onValueChange={v => handleFilterChange({ key: 'sort', value: v })}>
          <SelectTrigger className="h-9 w-auto text-sm text-slate-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Sort: Date ↓</SelectItem>
            <SelectItem value="date_asc">Sort: Date ↑</SelectItem>
            <SelectItem value="title_asc">Sort: Name A–Z</SelectItem>
            <SelectItem value="priority_desc">Sort: Priority</SelectItem>
            <SelectItem value="status_asc">Sort: Status</SelectItem>
          </SelectContent>
        </Select>

        <Select value={limitValue} onValueChange={handleLimitChange}>
          <SelectTrigger className="h-9 w-auto text-sm text-slate-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 per page</SelectItem>
            <SelectItem value="25">25 per page</SelectItem>
            <SelectItem value="50">50 per page</SelectItem>
            <SelectItem value="100">100 per page</SelectItem>
            <SelectItem value="200">200 per page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={jobsColumns}
        data={jobs}
        onDeleteSelected={deleteSelectedJobs}
        onRowClick={(job) => onNavigate(`/jobs/${job._id}`)}
      />



      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
        <p>Showing {jobs.length} of {totalJobs} job{totalJobs === 1 ? '' : 's'}</p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-7 px-2.5 rounded-lg border border-[#E2E8F0] text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white flex items-center gap-1"
            >
              <ChevronLeft size={12} /> Previous
            </button>
            <span className="px-2 font-medium text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-7 px-2.5 rounded-lg border border-[#E2E8F0] text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white flex items-center gap-1"
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
