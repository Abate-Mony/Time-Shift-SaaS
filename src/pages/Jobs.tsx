import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, keepPreviousData, type QueryClient } from '@tanstack/react-query'
import { Link, useLoaderData, useSearchParams, type LoaderFunctionArgs } from 'react-router'
import { AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { AlertTriangle, Briefcase, CalendarDays, CalendarIcon, ChevronLeft, ChevronRight, Download, Plus, Search, X } from 'lucide-react'
import { ActiveFiltersBar } from '@/components/ui/ActiveFiltersBar'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/empty-state'
import { JobRow } from '@/components/jobs/JobRow'
import { JobsFilterPanel } from '@/components/jobs/JobsFilterPanel'
import { JobsBulkBar } from '@/components/jobs/JobsBulkBar'
import { useFilter } from '@/hooks/CustomLinkFilterHook'
import { cn } from '@/lib/utils'
import { clientsQuery } from '@/utils/clients'
import { sitesQuery } from '@/utils/sites'
import { formatDate } from '@/utils/date'
import {
  activePreset, companyWorkersQuery, daySummary, FILTER_PANEL_KEYS, downloadJobsExport, groupByDay, jobsQuery, presetRange,
  type DatePreset, type JobListItem,
} from '@/utils/jobsList'

export const loader = (queryClient: QueryClient) => async ({ request }: LoaderFunctionArgs) => {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries())
  await queryClient.ensureQueryData(jobsQuery(params))
  return { searchValues: params }
}

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Draft' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
] as const

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'any', label: 'Any date' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
]

const SORTS = [
  { value: 'date_asc', label: 'Date ↑' },
  { value: 'date_desc', label: 'Date ↓' },
  { value: 'title_asc', label: 'Name A–Z' },
  { value: 'priority_desc', label: 'Priority' },
  { value: 'status_asc', label: 'Status' },
]

/** Search box: debounced, writes `search` and drops the page number. "/" focuses it. */
function JobSearch({ value, onChange }: { value: string; onChange: (v: string | null) => void }) {
  const [text, setText] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => setText(value), [value])
  useEffect(() => {
    if (text.trim() === value) return
    const t = setTimeout(() => onChange(text.trim() || null), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.key !== '/' || e.metaKey || e.ctrlKey || el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
      e.preventDefault()
      ref.current?.focus()
      ref.current?.select()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div className="relative w-full sm:w-80 lg:w-96">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={ref}
        type="search"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') { setText(''); onChange(null); ref.current?.blur() } }}
        placeholder="Search title, client, site…"
        aria-label="Search jobs"
        className={cn(
          'w-full h-9 pl-9 pr-14 rounded-lg border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 transition',
          value ? 'border-[var(--primary)] font-medium' : 'border-[var(--border)]'
        )}
      />
      {text ? (
        <button type="button" aria-label="Clear search" onClick={() => { setText(''); onChange(null) }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted">
          <X size={13} />
        </button>
      ) : (
        <kbd className="hidden sm:block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] border border-[var(--border)] rounded px-1.5 text-muted-foreground font-sans">/</kbd>
      )}
    </div>
  )
}

export function Jobs() {
  const { searchValues: loaderValues } = useLoaderData() as { searchValues: Record<string, string> }
  const [sp] = useSearchParams()
  const params = useMemo(() => Object.fromEntries(sp.entries()) as Record<string, string>, [sp])
  const { handleFiltersChange } = useFilter()
  const { data } = useQuery({ ...jobsQuery(params ?? loaderValues), placeholderData: keepPreviousData })
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)

  const jobs = data?.jobs ?? []
  const totalJobs = data?.totalJobs ?? 0
  const totalPages = data?.totalPages ?? 1
  const currentPage = data?.currentPage ?? 1
  const counts = data?.statusCounts

  const search = params.search ?? ''
  const status = params.status ?? 'all'
  const sort = params.sort ?? 'date_asc'
  const limit = params.limit ?? '100'
  const start = params.start ?? null
  const end = params.end ?? null
  const preset = activePreset(start, end)
  const byDate = sort === 'date_asc' || sort === 'date_desc'
  const attentionOn = params.attention === 'true'
  const today = dayjs().format('YYYY-MM-DD')

  // Any filter change sends you back to page 1 (page 4 of a different
  // result set is meaningless) and clears the selection.
  const setFilters = (entries: Record<string, string | null>) => {
    handleFiltersChange({ ...entries, page: null })
    setSelectedIds(new Set())
  }
  const goToPage = (p: number) => {
    handleFiltersChange({ page: p > 1 ? String(p) : null })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Selection survives refetches but drops jobs no longer on the page.
  const selected = jobs.filter(j => selectedIds.has(j._id as string))
  const toggle = (id: string, on: boolean) =>
    setSelectedIds(prev => { const next = new Set(prev); if (on) next.add(id); else next.delete(id); return next })
  const allOnPageSelected = jobs.length > 0 && selected.length === jobs.length

  // Names for the filter chips (cached — the panel uses the same queries).
  const { data: clients } = useQuery({ ...clientsQuery(), enabled: !!params.client })
  const { data: sites } = useQuery({ ...sitesQuery(params.client ? { client: params.client } : {}), enabled: !!params.site })
  const { data: workers } = useQuery({ ...companyWorkersQuery, enabled: !!params.worker })

  const exportCsv = async () => {
    setExporting(true)
    try {
      const truncatedAt = await downloadJobsExport(params)
      if (truncatedAt) toast(`Exported the first 5,000 of ${truncatedAt.toLocaleString()} jobs — narrow the filters to get the rest.`)
    } catch {
      toast.error("Couldn't export the jobs. Try again.")
    } finally {
      setExporting(false)
    }
  }

  const groups = byDate ? groupByDay(jobs) : null
  const rangeLabel = preset === 'any' ? 'all dates'
    : preset === 'custom'
      ? `${start ? formatDate(start, 'D MMM YYYY') : 'the start'} – ${end ? formatDate(end, 'D MMM YYYY') : 'onwards'}`
      : DATE_PRESETS.find(p => p.id === preset)!.label.toLowerCase()
  const hasAnyFilter = !!search || status !== 'all' || preset !== 'any' || attentionOn ||
    FILTER_PANEL_KEYS.some(k => params[k])

  const clearEverything = () => setFilters({
    search: null, status: null, start: null, end: null, attention: null,
    ...Object.fromEntries(FILTER_PANEL_KEYS.map(k => [k, null])),
  })

  return (
    <div className="animate-fade-in flex flex-col gap-4 pb-24">
      {/* Header */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="mr-auto">
          <h1 className="text-xl font-bold">Jobs</h1>
          <p className="text-sm text-muted-foreground">Every job, any date. For the week grid, use the Calendar.</p>
        </div>
        <Link to="/calendar" className="h-9 px-3 rounded-lg border border-[var(--border)] bg-card text-sm font-medium inline-flex items-center gap-1.5 hover:bg-muted">
          <CalendarDays size={14} /> <span className="hidden sm:inline">Open in Calendar</span>
        </Link>
        <button type="button" onClick={exportCsv} disabled={exporting || totalJobs === 0}
          className="h-9 px-3 rounded-lg border border-[var(--border)] bg-card text-sm font-medium inline-flex items-center gap-1.5 hover:bg-muted disabled:opacity-50">
          <Download size={14} /> <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export'}</span>
        </button>
        <Link to="/create-job" className="h-9 px-3.5 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold inline-flex items-center gap-1.5">
          <Plus size={15} /> New job
        </Link>
      </div>

      {/* Status tabs + needs attention */}
      <div className="flex items-end gap-2 border-b border-[var(--border)] overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilters({ status: t.id === 'all' ? null : t.id })}
            className={cn(
              'h-10 px-3 text-sm font-medium flex items-center gap-1.5 border-b-2 -mb-px whitespace-nowrap transition-colors',
              status === t.id ? 'border-[var(--primary)] text-[var(--primary)] font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
            {counts && (
              <span className={cn('text-[11px] rounded-full px-1.5 min-w-5 text-center',
                status === t.id ? 'bg-[var(--primary)] text-white' : 'bg-muted text-muted-foreground')}>
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFilters({ attention: attentionOn ? null : 'true' })}
          className={cn(
            'ml-auto mb-1.5 h-8 px-3 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors',
            attentionOn ? 'bg-amber-500 border-amber-500 text-white'
              : (data?.attentionCount ?? 0) > 0 ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                : 'bg-card border-[var(--border)] text-muted-foreground'
          )}
          title="Upcoming jobs with open places, a broken time, or still a draft within 2 days"
        >
          <AlertTriangle size={12} /> Needs attention
          <span className={cn('rounded-full px-1.5 text-[11px]', attentionOn ? 'bg-white/25' : 'bg-white/70')}>{data?.attentionCount ?? 0}</span>
        </button>
      </div>

      {/* Search, dates, filters, sort */}
      <div className="flex items-center gap-2 flex-wrap">
        <JobSearch value={search} onChange={v => setFilters({ search: v })} />
        <div className="flex bg-card border border-[var(--border)] rounded-lg p-0.5 overflow-x-auto max-w-full">
          {DATE_PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                const r = presetRange(p.id as Exclude<DatePreset, 'custom'>)
                // Past reads newest-first; switching away from it puts the default back.
                const nextSort = p.id === 'past' ? 'date_desc' : sort === 'date_desc' && preset === 'past' ? null : undefined
                setFilters({ start: r.start, end: r.end, ...(nextSort !== undefined ? { sort: nextSort } : {}) })
              }}
              className={cn('h-8 px-2.5 rounded-md text-xs font-semibold whitespace-nowrap',
                preset === p.id ? 'bg-[var(--primary)] text-white' : 'text-muted-foreground hover:text-foreground')}
            >
              {p.label}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className={cn('h-8 px-2.5 rounded-md text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1',
                preset === 'custom' ? 'bg-[var(--primary)] text-white' : 'text-muted-foreground hover:text-foreground')}>
                <CalendarIcon size={12} />
                {preset === 'custom' ? rangeLabel : 'Custom…'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                className="rounded-md border w-[min(400px,calc(100vw-2rem))] sm:w-[min(800px,calc(100vw-4rem))]"
                mode="range"
                defaultMonth={start ? new Date(start) : undefined}
                selected={start ? { from: new Date(start), to: new Date(end || start) } : undefined}
                onSelect={range => setFilters({
                  // ISO, not the display format — the backend's toUtcDay() parses it.
                  start: range?.from ? formatDate(range.from, 'YYYY-MM-DD') : null,
                  end: range?.to ? formatDate(range.to, 'YYYY-MM-DD') : null,
                })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <JobsFilterPanel
            open={filterOpen}
            onOpenChange={setFilterOpen}
            values={Object.fromEntries(FILTER_PANEL_KEYS.map(k => [k, params[k] ?? ''])) as any}
            onChange={setFilters}
          />
          <Select value={sort} onValueChange={v => setFilters({ sort: v === 'date_asc' ? null : v })}>
            <SelectTrigger className="h-9 w-auto text-sm"><span className="text-muted-foreground mr-1">Sort:</span><SelectValue /></SelectTrigger>
            <SelectContent>{SORTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={limit} onValueChange={v => setFilters({ limit: v === '100' ? null : v })}>
            <SelectTrigger className="h-9 w-auto text-sm hidden sm:flex"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['10', '25', '50', '100', '200'].map(n => <SelectItem key={n} value={n}>{n} per page</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {search && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm text-blue-900 flex-wrap">
          <Search size={14} className="shrink-0" />
          <span>
            <b>{totalJobs} job{totalJobs === 1 ? '' : 's'}</b> match “{search}” across <b>{rangeLabel}</b>
            {status !== 'all' && <> in <b>{status}</b></>}, searching title, client, site and address.
          </span>
          <button type="button" onClick={() => setFilters({ search: null })} className="ml-auto font-semibold text-blue-700 hover:underline">Clear search</button>
        </div>
      )}

      <ActiveFiltersBar
        filters={[
          { keys: 'search', label: 'Search', format: ([s]) => `“${s}”` },
          { keys: 'status', isActive: ([s]) => !!s && s !== 'all', format: ([s]) => (s ?? '').replace(/\b\w/g, c => c.toUpperCase()) },
          { keys: 'attention', label: 'Showing', format: () => 'Needs attention' },
          { keys: 'client', format: ([id]) => clients?.clients.find(c => c._id === id)?.name ?? 'Selected client' },
          { keys: 'site', format: ([id]) => sites?.sites.find((s: { _id: string }) => s._id === id)?.name ?? 'Selected site' },
          { keys: 'worker', format: ([id]) => workers?.find(w => w._id === id)?.fullname ?? 'Selected worker' },
          'priority',
          { keys: 'unfilled', label: 'Staffing', format: () => 'Has unfilled places' },
          { keys: 'unassigned', label: 'Staffing', format: () => 'No workers assigned' },
          { keys: ['start', 'end'], label: 'Date', format: () => rangeLabel.replace(/^./, c => c.toUpperCase()) },
          { keys: 'sourceQuote', label: 'From quote', format: () => 'This quote' },
        ]}
      />

      {/* List */}
      {jobs.length === 0 ? (
        <div className="bg-card border border-[var(--border)] rounded-xl py-10">
          <EmptyState
            icon={<Briefcase className="w-6 h-6" />}
            title={hasAnyFilter ? 'No jobs match these filters' : 'No jobs yet'}
            description={hasAnyFilter
              ? search ? `Nothing matches “${search}” across ${rangeLabel}. Try a different word, or clear the filters.` : 'Try a wider date range or clear the filters.'
              : 'Create your first job to start scheduling workers.'}
            action={hasAnyFilter ? (
              <button type="button" onClick={clearEverything} className="h-9 px-4 rounded-lg border border-[var(--border)] bg-card text-sm font-semibold hover:bg-muted">Clear all filters</button>
            ) : (
              <Link to="/create-job" className="h-9 px-4 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold inline-flex items-center gap-1.5"><Plus size={14} /> New job</Link>
            )}
          />
        </div>
      ) : (
        <div className="bg-card border border-[var(--border)] rounded-xl overflow-hidden" role="table" aria-label="Jobs">
          <div className="hidden md:flex items-center gap-3 px-4 lg:px-5 py-2 border-b border-[var(--border)] text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
            <label className="flex items-center gap-2 cursor-pointer normal-case tracking-normal text-xs">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[var(--primary)]"
                checked={allOnPageSelected}
                ref={el => { if (el) el.indeterminate = selected.length > 0 && !allOnPageSelected }}
                onChange={e => setSelectedIds(e.target.checked ? new Set(jobs.map(j => j._id as string)) : new Set())}
              />
              Select all on this page
            </label>
          </div>

          {groups ? (
            groups.map((g, gi) => {
              const showMonth = gi === 0 || groups[gi - 1].month !== g.month
              const summary = daySummary(g.jobs as JobListItem[])
              return (
                <Fragment key={`${g.key}-${gi}`}>
                  {showMonth && (
                    <div className="px-4 lg:px-5 pt-4 pb-1.5 text-[11px] font-extrabold tracking-[0.08em] uppercase text-muted-foreground/70">
                      {g.month}
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-4 lg:px-5 py-2 bg-muted/40 border-y border-[var(--border)]/60 text-[13px] sticky top-0 z-[1]">
                    <span className="font-bold">{dayjs(g.key).format('ddd D MMM')}</span>
                    {g.key === today && <span className="bg-[var(--primary)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">TODAY</span>}
                    <span className="text-muted-foreground">· {g.jobs.length} job{g.jobs.length === 1 ? '' : 's'}</span>
                    {summary.text && (
                      <span className={cn('ml-auto text-xs', summary.tone === 'bad' ? 'text-red-600 font-semibold' : 'text-muted-foreground')}>{summary.text}</span>
                    )}
                  </div>
                  {g.jobs.map(job => (
                    <JobRow key={job._id} job={job} search={search} today={today}
                      selected={selectedIds.has(job._id as string)} onSelect={on => toggle(job._id as string, on)} />
                  ))}
                </Fragment>
              )
            })
          ) : (
            jobs.map(job => (
              <JobRow key={job._id} job={job} search={search} today={today}
                selected={selectedIds.has(job._id as string)} onSelect={on => toggle(job._id as string, on)} />
            ))
          )}

          <div className="flex items-center justify-between gap-3 px-4 lg:px-5 py-3 border-t border-[var(--border)] text-xs text-muted-foreground flex-wrap">
            <p>
              Showing {(currentPage - 1) * Number(limit) + 1}–{(currentPage - 1) * Number(limit) + jobs.length} of {totalJobs}
              {byDate ? ' · grouped by day' : ''}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}
                  className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-card hover:bg-muted disabled:opacity-40 flex items-center gap-1">
                  <ChevronLeft size={12} /> Previous
                </button>
                <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
                <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}
                  className="h-8 px-2.5 rounded-lg border border-[var(--border)] bg-card hover:bg-muted disabled:opacity-40 flex items-center gap-1">
                  Next <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selected.length > 0 && <JobsBulkBar selected={selected} onClear={() => setSelectedIds(new Set())} />}
      </AnimatePresence>
    </div>
  )
}
