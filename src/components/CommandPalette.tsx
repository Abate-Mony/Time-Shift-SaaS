import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, Briefcase, Users, Building2, Receipt, Calendar as CalendarIcon,
  BarChart3, MapPin, Settings, Plus, Loader2, CornerDownLeft,
} from 'lucide-react'
import customFetch from '@/utils/customFetch'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

interface ResultItem {
  id: string
  title: string
  subtitle?: string
  to: string
  icon: React.ReactNode
}

interface ResultGroup {
  label: string
  items: ResultItem[]
}

// Quick navigation — always available, fuzzy-filtered by title/subtitle as
// you type. Distinct from the live search groups below, which only appear
// once there's something to actually look up.
const STATIC_LINKS: ResultItem[] = [
  { id: 'nav-jobs', title: 'Jobs', subtitle: 'View all jobs', to: '/jobs', icon: <Briefcase size={14} /> },
  { id: 'nav-create-job', title: 'Create job', subtitle: 'Start a new shift', to: '/create-job', icon: <Plus size={14} /> },
  { id: 'nav-calendar', title: 'Calendar', subtitle: 'Schedule view', to: '/calendar', icon: <CalendarIcon size={14} /> },
  { id: 'nav-workers', title: 'Workers', subtitle: 'Manage your workforce', to: '/workers', icon: <Users size={14} /> },
  { id: 'nav-team', title: 'Team', subtitle: 'Admins & managers', to: '/team', icon: <Users size={14} /> },
  { id: 'nav-clients', title: 'Clients', subtitle: 'View all clients', to: '/clients', icon: <Building2 size={14} /> },
  { id: 'nav-create-client', title: 'Add client', subtitle: 'Create a new client', to: '/clients/create', icon: <Plus size={14} /> },
  { id: 'nav-invoices', title: 'Invoices', subtitle: 'View all invoices', to: '/invoices', icon: <Receipt size={14} /> },
  { id: 'nav-create-invoice', title: 'New invoice', subtitle: 'Bill a client', to: '/invoices/create', icon: <Plus size={14} /> },
  { id: 'nav-locations', title: 'Locations', subtitle: 'Manage sites', to: '/locations', icon: <MapPin size={14} /> },
  { id: 'nav-reports', title: 'Reports', subtitle: 'Analytics & payroll', to: '/reports', icon: <BarChart3 size={14} /> },
  { id: 'nav-settings', title: 'Settings', subtitle: 'Company & account settings', to: '/settings', icon: <Settings size={14} /> },
]

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [liveGroups, setLiveGroups] = useState<ResultGroup[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (open) {
      setQuery('')
      setDebouncedQuery('')
      setLiveGroups([])
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  // Real cross-entity search — the same endpoints Jobs/Workers/Clients/
  // Invoices already use for their own list filters, just fanned out in
  // parallel here instead of scoped to whichever single page you're on.
  useEffect(() => {
    if (!open || debouncedQuery.length < 2) {
      setLiveGroups([])
      return
    }
    let cancelled = false
    setSearching(true)

    Promise.allSettled([
      customFetch.get<{ jobs: any[] }>('/jobs', { params: { search: debouncedQuery, limit: 5 } }),
      customFetch.get<{ users: any[] }>('/users/users', { params: { search: debouncedQuery, role: 'worker', limit: 5 } }),
      customFetch.get<{ clients: any[] }>('/clients', { params: { search: debouncedQuery, limit: 5 } }),
      customFetch.get<{ invoices: any[] }>('/invoices', { params: { search: debouncedQuery, limit: 5 } }),
    ]).then(([jobsRes, workersRes, clientsRes, invoicesRes]) => {
      if (cancelled) return

      const groups: ResultGroup[] = []

      if (jobsRes.status === 'fulfilled' && jobsRes.value.data.jobs?.length) {
        groups.push({
          label: 'Jobs',
          items: jobsRes.value.data.jobs.map((j: any) => ({
            id: `job-${j._id}`,
            title: j.title,
            subtitle: [j.client?.name, j.location].filter(Boolean).join(' · '),
            to: `/jobs/${j._id}`,
            icon: <Briefcase size={14} />,
          })),
        })
      }
      if (workersRes.status === 'fulfilled' && workersRes.value.data.users?.length) {
        groups.push({
          label: 'Workers',
          items: workersRes.value.data.users.map((w: any) => ({
            id: `worker-${w._id}`,
            title: w.fullname,
            subtitle: w.email,
            to: `/workers/${w._id}/worker-profile`,
            icon: <Users size={14} />,
          })),
        })
      }
      if (clientsRes.status === 'fulfilled' && clientsRes.value.data.clients?.length) {
        groups.push({
          label: 'Clients',
          items: clientsRes.value.data.clients.map((c: any) => ({
            id: `client-${c._id}`,
            title: c.name,
            subtitle: c.primaryContact?.name ?? c.formattedAddress,
            to: `/clients/${c._id}`,
            icon: <Building2 size={14} />,
          })),
        })
      }
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.data.invoices?.length) {
        groups.push({
          label: 'Invoices',
          items: invoicesRes.value.data.invoices.map((inv: any) => ({
            id: `invoice-${inv._id}`,
            title: inv.invoiceNumber,
            subtitle: inv.client,
            to: `/invoices/${inv._id}`,
            icon: <Receipt size={14} />,
          })),
        })
      }

      setLiveGroups(groups)
      setSearching(false)
    })

    return () => { cancelled = true }
  }, [open, debouncedQuery])

  const navGroup: ResultGroup = useMemo(() => {
    const q = query.trim().toLowerCase()
    const items = q
      ? STATIC_LINKS.filter(l => l.title.toLowerCase().includes(q) || l.subtitle?.toLowerCase().includes(q))
      : STATIC_LINKS
    return { label: 'Go to', items }
  }, [query])

  const groups = debouncedQuery.length >= 2 ? [...liveGroups, navGroup] : [navGroup]
  const flatItems = groups.flatMap(g => g.items)

  useEffect(() => {
    setActiveIndex(0)
  }, [groups.length, flatItems.length])

  const go = (item: ResultItem) => {
    navigate(item.to)
    onClose()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, flatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flatItems[activeIndex]
      if (item) go(item)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  let runningIndex = -1

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[2px] flex items-start justify-center pt-[12vh] px-4"
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-2.5 px-4 border-b border-[#E2E8F0]">
              <Search size={15} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search jobs, workers, clients, invoices…"
                className="flex-1 h-12 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
              {searching && <Loader2 size={14} className="text-slate-400 animate-spin shrink-0" />}
              <kbd className="hidden sm:inline-flex items-center h-5 px-1.5 rounded border border-slate-200 text-[10px] font-semibold text-slate-400 shrink-0">
                Esc
              </kbd>
            </div>

            <div className="max-h-[60vh] overflow-y-auto py-2">
              {groups.every(g => g.items.length === 0) ? (
                <p className="px-4 py-8 text-sm text-slate-400 text-center">
                  No results for "{debouncedQuery}"
                </p>
              ) : (
                groups.map(group => group.items.length > 0 && (
                  <div key={group.label} className="mb-1 last:mb-0">
                    <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {group.label}
                    </p>
                    {group.items.map(item => {
                      runningIndex += 1
                      const isActive = runningIndex === activeIndex
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(runningIndex)}
                          onClick={() => go(item)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isActive ? 'bg-[#1E3A5F]/[0.06]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-[#1E3A5F]/10 text-[#1E3A5F]' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                            {item.subtitle && (
                              <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                            )}
                          </div>
                          {isActive && <CornerDownLeft size={12} className="text-slate-300 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
