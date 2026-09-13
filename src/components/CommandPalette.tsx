import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search,
  Briefcase,
  Users,
  Building2,
  Receipt,
  Calendar as CalendarIcon,
  BarChart3,
  MapPin,
  Settings,
  Plus,
  Loader2,
  CornerDownLeft,
} from 'lucide-react'

import customFetch from '@/utils/customFetch'
import { Input } from './ui/input'

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

const STATIC_LINKS: ResultItem[] = [
  {
    id: 'nav-jobs',
    title: 'Jobs',
    subtitle: 'View all jobs',
    to: '/jobs',
    icon: <Briefcase size={15} />,
  },
  {
    id: 'nav-create-job',
    title: 'Create job',
    subtitle: 'Start a new shift',
    to: '/create-job',
    icon: <Plus size={15} />,
  },
  {
    id: 'nav-calendar',
    title: 'Calendar',
    subtitle: 'Schedule view',
    to: '/calendar',
    icon: <CalendarIcon size={15} />,
  },
  {
    id: 'nav-workers',
    title: 'Workers',
    subtitle: 'Manage your workforce',
    to: '/workers',
    icon: <Users size={15} />,
  },
  {
    id: 'nav-team',
    title: 'Team',
    subtitle: 'Admins & managers',
    to: '/team',
    icon: <Users size={15} />,
  },
  {
    id: 'nav-clients',
    title: 'Clients',
    subtitle: 'View all clients',
    to: '/clients',
    icon: <Building2 size={15} />,
  },
  {
    id: 'nav-create-client',
    title: 'Add client',
    subtitle: 'Create a new client',
    to: '/clients/create',
    icon: <Plus size={15} />,
  },
  {
    id: 'nav-invoices',
    title: 'Invoices',
    subtitle: 'View all invoices',
    to: '/invoices',
    icon: <Receipt size={15} />,
  },
  {
    id: 'nav-create-invoice',
    title: 'New invoice',
    subtitle: 'Bill a client',
    to: '/invoices/create',
    icon: <Plus size={15} />,
  },
  {
    id: 'nav-sites',
    title: 'Sites',
    subtitle: 'Manage client workplaces',
    to: '/sites',
    icon: <MapPin size={15} />,
  },
  {
    id: 'nav-reports',
    title: 'Reports',
    subtitle: 'Analytics & payroll',
    to: '/reports',
    icon: <BarChart3 size={15} />,
  },
  {
    id: 'nav-settings',
    title: 'Settings',
    subtitle: 'Company & account settings',
    to: '/settings',
    icon: <Settings size={15} />,
  },
]

export function CommandPalette({
  open,
  onClose,
}: CommandPaletteProps) {
  const navigate = useNavigate()

  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const [liveGroups, setLiveGroups] = useState<ResultGroup[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  // Reset the command palette each time it opens
  useEffect(() => {
    if (!open) return

    setQuery('')
    setDebouncedQuery('')
    setLiveGroups([])
    setActiveIndex(0)

    const timeout = setTimeout(() => {
      inputRef.current?.focus()
    }, 30)

    return () => clearTimeout(timeout)
  }, [open])

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 250)

    return () => clearTimeout(timeout)
  }, [query])

  // Live cross-entity search
  useEffect(() => {
    if (!open || debouncedQuery.length < 2) {
      setLiveGroups([])
      setSearching(false)
      return
    }

    let cancelled = false

    setSearching(true)

    Promise.allSettled([
      customFetch.get<{ jobs: any[] }>('/jobs', {
        params: {
          search: debouncedQuery,
          limit: 5,
        },
      }),

      customFetch.get<{ users: any[] }>('/users/users', {
        params: {
          search: debouncedQuery,
          role: 'worker',
          limit: 5,
        },
      }),

      customFetch.get<{ clients: any[] }>('/clients', {
        params: {
          search: debouncedQuery,
          limit: 5,
        },
      }),

      customFetch.get<{ invoices: any[] }>('/invoices', {
        params: {
          search: debouncedQuery,
          limit: 5,
        },
      }),
    ]).then(
      ([jobsRes, workersRes, clientsRes, invoicesRes]) => {
        if (cancelled) return

        const groups: ResultGroup[] = []

        if (
          jobsRes.status === 'fulfilled' &&
          jobsRes.value.data.jobs?.length
        ) {
          groups.push({
            label: 'Jobs',

            items: jobsRes.value.data.jobs.map((job: any) => ({
              id: `job-${job._id}`,

              title: job.title,

              subtitle: [
                job.client?.name,
                job.location,
              ]
                .filter(Boolean)
                .join(' · '),

              to: `/jobs/${job._id}`,

              icon: <Briefcase size={15} />,
            })),
          })
        }

        if (
          workersRes.status === 'fulfilled' &&
          workersRes.value.data.users?.length
        ) {
          groups.push({
            label: 'Workers',

            items: workersRes.value.data.users.map((worker: any) => ({
              id: `worker-${worker._id}`,

              title: worker.fullname || worker.email,

              subtitle: worker.email,

              to: `/workers/${worker._id}/worker-profile`,

              icon: <Users size={15} />,
            })),
          })
        }

        if (
          clientsRes.status === 'fulfilled' &&
          clientsRes.value.data.clients?.length
        ) {
          groups.push({
            label: 'Clients',

            items: clientsRes.value.data.clients.map((client: any) => ({
              id: `client-${client._id}`,

              title: client.name,

              subtitle:
                client.primaryContact?.name ??
                client.formattedAddress,

              to: `/clients/${client._id}`,

              icon: <Building2 size={15} />,
            })),
          })
        }

        if (
          invoicesRes.status === 'fulfilled' &&
          invoicesRes.value.data.invoices?.length
        ) {
          groups.push({
            label: 'Invoices',

            items: invoicesRes.value.data.invoices.map(
              (invoice: any) => ({
                id: `invoice-${invoice._id}`,

                title: invoice.invoiceNumber,

                subtitle:
                  typeof invoice.client === 'string'
                    ? invoice.client
                    : invoice.client?.name,

                to: `/invoices/${invoice._id}`,

                icon: <Receipt size={15} />,
              }),
            ),
          })
        }

        setLiveGroups(groups)
        setSearching(false)
      },
    )

    return () => {
      cancelled = true
    }
  }, [open, debouncedQuery])

  // Local / static navigation filtering
  const navGroup: ResultGroup = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const items = normalizedQuery
      ? STATIC_LINKS.filter((item) => {
          const titleMatch = item.title
            .toLowerCase()
            .includes(normalizedQuery)

          const subtitleMatch = item.subtitle
            ?.toLowerCase()
            .includes(normalizedQuery)

          return titleMatch || subtitleMatch
        })
      : STATIC_LINKS

    return {
      label: 'Go to',
      items,
    }
  }, [query])

  const groups =
    debouncedQuery.length >= 2
      ? [...liveGroups, navGroup]
      : [navGroup]

  const flatItems = groups.flatMap((group) => group.items)

  // Reset keyboard selection when the result set changes
  useEffect(() => {
    setActiveIndex(0)
  }, [groups.length, flatItems.length])

  const go = (item: ResultItem) => {
    navigate(item.to)
    onClose()
  }

  const onKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()

      setActiveIndex((current) =>
        Math.min(
          current + 1,
          Math.max(flatItems.length - 1, 0),
        ),
      )

      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()

      setActiveIndex((current) =>
        Math.max(current - 1, 0),
      )

      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      const item = flatItems[activeIndex]

      if (item) {
        go(item)
      }

      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  let runningIndex = -1

  const hasNoResults = groups.every(
    (group) => group.items.length === 0,
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: 0.15,
          }}
          className="
            fixed inset-0 z-[100]
            flex items-start justify-center
            bg-slate-950/30
            backdrop-blur-[3px]
            px-4
            pt-[10vh]
          "
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onClose()
            }
          }}
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.98,
              y: -12,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.98,
              y: -8,
            }}
            transition={{
              duration: 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
            onKeyDown={onKeyDown}
            className="
              w-full
              max-w-2xl
              overflow-hidden
              rounded-2xl
              border
              border-border
              bg-card
              shadow-[0_24px_80px_-20px_rgba(15,23,42,0.35)]
            "
          >
            {/* Search header */}
            <div
              className="
                flex items-center gap-3
                border-b border-border
                px-5
              "
            >
              <Search
                size={18}
                strokeWidth={1.8}
                className="
                  shrink-0
                  text-muted-foreground
                "
              />

              <Input
                ref={inputRef}
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search INPRN..."
                className="
               h-14
              w-full
              flex-1
              border-0
              bg-transparent
              text-[15px]
              text-foreground
              placeholder:text-muted-foreground
              outline-none
              ring-0!
              
              /* Reset Focus States */
              focus:border-0
              focus:outline-none
              focus:ring-0
                /* Force override the global stylesheet */
              focus-visible:[outline:none]!
              focus-visible:[ring:none]!
              
              /* Reset Browser Accessibility Overrides */
              focus-visible:border-0
              focus-visible:outline-none
              focus-visible:ring-0
              
              /* Reset Hover States */
              hover:border-0
              hover:outline-none
              hover:ring-0
              
              /* Reset Active / Press States */
              active:border-0
              active:outline-none
              active:ring-0


                "
              />

              {searching ? (
                <Loader2
                  size={16}
                  className="
                    shrink-0
                    animate-spin
                    text-primary
                  "
                />
              ) : (
                <kbd
                  className="
                    hidden
                    sm:inline-flex
                    h-6
                    items-center
                    rounded-md
                    border border-border
                    bg-muted
                    px-2
                    text-[10px]
                    font-medium
                    text-muted-foreground
                    shadow-[0_1px_1px_rgba(15,23,42,0.04)]
                  "
                >
                  ESC
                </kbd>
              )}
            </div>

            {/* Results */}
            <div
              className="
                max-h-[55vh]
                overflow-y-auto
                px-2
                py-2
              "
            >
              {hasNoResults ? (
                <div
                  className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    px-6
                    py-14
                    text-center
                  "
                >
                  <div
                    className="
                      mb-3
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      bg-muted
                    "
                  >
                    <Search
                      size={17}
                      className="text-muted-foreground"
                    />
                  </div>

                  <p
                    className="
                      text-sm
                      font-semibold
                      text-foreground
                    "
                  >
                    No results found
                  </p>

                  <p
                    className="
                      mt-1
                      max-w-xs
                      text-xs
                      leading-relaxed
                      text-muted-foreground
                    "
                  >
                    We couldn't find anything matching "
                    {debouncedQuery || query}".
                  </p>
                </div>
              ) : (
                groups.map((group) => {
                  if (group.items.length === 0) {
                    return null
                  }

                  return (
                    <div
                      key={group.label}
                      className="
                        mb-2
                        last:mb-0
                      "
                    >
                      {/* Group label */}
                      <div className="px-3 pb-1.5 pt-2">
                        <p
                          className="
                            text-[10px]
                            font-bold
                            uppercase
                            tracking-[0.08em]
                            text-muted-foreground
                          "
                        >
                          {group.label}
                        </p>
                      </div>

                      {/* Items */}
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          runningIndex += 1

                          const itemIndex = runningIndex

                          const isActive =
                            itemIndex === activeIndex

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onMouseEnter={() =>
                                setActiveIndex(itemIndex)
                              }
                              onClick={() => go(item)}
                              className={`
                                group
                                flex
                                w-full
                                items-center
                                gap-3
                                rounded-xl
                                px-3
                                py-2.5
                                text-left
                                outline-none
                                transition-all
                                duration-100

                                ${
                                  isActive
                                    ? 'bg-primary/[0.07]'
                                    : 'hover:bg-muted'
                                }
                              `}
                            >
                              {/* Item icon */}
                              <div
                                className={`
                                  flex
                                  h-9
                                  w-9
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-xl
                                  transition-colors

                                  ${
                                    isActive
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground group-hover:bg-muted/70 dark:group-hover:bg-slate-700/70'
                                  }
                                `}
                              >
                                {item.icon}
                              </div>

                              {/* Text */}
                              <div
                                className="
                                  min-w-0
                                  flex-1
                                "
                              >
                                <p
                                  className={`
                                    truncate
                                    text-sm
                                    font-semibold

                                    ${
                                      isActive
                                        ? 'text-primary'
                                        : 'text-foreground'
                                    }
                                  `}
                                >
                                  {item.title}
                                </p>

                                {item.subtitle && (
                                  <p
                                    className="
                                      mt-0.5
                                      truncate
                                      text-xs
                                      text-muted-foreground
                                    "
                                  >
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>

                              {/* Enter indicator */}
                              {isActive && (
                                <div
                                  className="
                                    hidden
                                    items-center
                                    gap-1.5
                                    text-[10px]
                                    font-medium
                                    text-muted-foreground
                                    sm:flex
                                  "
                                >
                                  Open

                                  <kbd
                                    className="
                                      flex
                                      h-5
                                      min-w-5
                                      items-center
                                      justify-center
                                      rounded
                                      border
                                      border-border
                                      bg-card
                                      px-1
                                    "
                                  >
                                    <CornerDownLeft size={10} />
                                  </kbd>
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div
              className="
                hidden
                items-center
                justify-between
                border-t
                border-border
                bg-muted/60
                px-5
                py-2.5
                sm:flex
              "
            >
              <p
                className="
                  text-[11px]
                  text-muted-foreground
                "
              >
                Search jobs, workers, clients and invoices
              </p>

              <div
                className="
                  flex
                  items-center
                  gap-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-1.5
                    text-[10px]
                    text-muted-foreground
                  "
                >
                  <div className="flex gap-1">
                    <Key>↑</Key>
                    <Key>↓</Key>
                  </div>

                  Navigate
                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-1.5
                    text-[10px]
                    text-muted-foreground
                  "
                >
                  <Key>
                    <CornerDownLeft size={9} />
                  </Key>

                  Open
                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-1.5
                    text-[10px]
                    text-muted-foreground
                  "
                >
                  <Key>Esc</Key>

                  Close
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Key({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <kbd
      className="
        inline-flex
        h-5
        min-w-5
        items-center
        justify-center
        rounded
        border
        border-border
        bg-card
        px-1
        text-[9px]
        font-medium
        text-muted-foreground
        shadow-sm
      "
    >
      {children}
    </kbd>
  )
}