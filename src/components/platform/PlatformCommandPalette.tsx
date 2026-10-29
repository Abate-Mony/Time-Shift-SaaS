import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { AnimatePresence, motion } from "framer-motion"
import {
  Search,
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Timer,
  Activity,
  Mail,
  ShieldCheck,
  Server,
  ArrowLeft,
  Loader2,
  CornerDownLeft,
} from "lucide-react"

import customFetch from "@/utils/customFetch"
import type { PlatformCompanyListItem, PlatformUserListItem } from "@/utils/platform-api"
import { Input } from "@/components/ui/input"

interface PlatformCommandPaletteProps {
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

// Same shape as the regular CommandPalette's STATIC_LINKS, but pointed at
// the platform console's own routes (see NAV_ITEMS in PlatformLayout.tsx)
// instead of the company-scoped app.
const STATIC_LINKS: ResultItem[] = [
  { id: "nav-overview", title: "Overview", subtitle: "Platform dashboard", to: "/platform", icon: <LayoutDashboard size={15} /> },
  { id: "nav-companies", title: "Companies", subtitle: "All companies on OnClockly", to: "/platform/companies", icon: <Building2 size={15} /> },
  { id: "nav-users", title: "Users", subtitle: "All users across every company", to: "/platform/users", icon: <Users size={15} /> },
  { id: "nav-subscriptions", title: "Subscriptions", subtitle: "Plans & billing", to: "/platform/subscriptions", icon: <CreditCard size={15} /> },
  { id: "nav-trials", title: "Trials", subtitle: "Trial accounts", to: "/platform/trials", icon: <Timer size={15} /> },
  { id: "nav-usage", title: "Usage", subtitle: "Platform-wide usage", to: "/platform/usage", icon: <Activity size={15} /> },
  { id: "nav-emails", title: "Email Operations", subtitle: "Domain & delivery status", to: "/platform/emails", icon: <Mail size={15} /> },
  { id: "nav-audit", title: "Audit Logs", subtitle: "Platform admin activity", to: "/platform/audit", icon: <ShieldCheck size={15} /> },
  { id: "nav-system", title: "System", subtitle: "API & database health", to: "/platform/system", icon: <Server size={15} /> },
  { id: "nav-back", title: "Back to app", subtitle: "Leave the platform console", to: "/", icon: <ArrowLeft size={15} /> },
]

export function PlatformCommandPalette({ open, onClose }: PlatformCommandPaletteProps) {
  const navigate = useNavigate()

  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [searching, setSearching] = useState(false)

  const [liveGroups, setLiveGroups] = useState<ResultGroup[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!open) return

    setQuery("")
    setDebouncedQuery("")
    setLiveGroups([])
    setActiveIndex(0)

    const timeout = setTimeout(() => {
      inputRef.current?.focus()
    }, 30)

    return () => clearTimeout(timeout)
  }, [open])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 250)

    return () => clearTimeout(timeout)
  }, [query])

  // Live search across companies and users — the only two /platform/*
  // list endpoints that support a `search` param server-side (see
  // platformController.ts).
  useEffect(() => {
    if (!open || debouncedQuery.length < 2) {
      setLiveGroups([])
      setSearching(false)
      return
    }

    let cancelled = false

    setSearching(true)

    Promise.allSettled([
      customFetch.get<{ data: PlatformCompanyListItem[] }>("/platform/companies", {
        params: { search: debouncedQuery, limit: 5 },
      }),
      customFetch.get<{ data: PlatformUserListItem[] }>("/platform/users", {
        params: { search: debouncedQuery, limit: 5 },
      }),
    ]).then(([companiesRes, usersRes]) => {
      if (cancelled) return

      const groups: ResultGroup[] = []

      if (companiesRes.status === "fulfilled" && companiesRes.value.data.data?.length) {
        groups.push({
          label: "Companies",
          items: companiesRes.value.data.data.map((company) => ({
            id: `company-${company.id}`,
            title: company.name,
            subtitle: company.owner?.email,
            to: `/platform/companies/${company.id}`,
            icon: <Building2 size={15} />,
          })),
        })
      }

      if (usersRes.status === "fulfilled" && usersRes.value.data.data?.length) {
        groups.push({
          label: "Users",
          items: usersRes.value.data.data.map((user) => ({
            id: `user-${user.id}`,
            title: user.name || user.email,
            subtitle: user.email,
            to: `/platform/users/${user.id}`,
            icon: <Users size={15} />,
          })),
        })
      }

      setLiveGroups(groups)
      setSearching(false)
    })

    return () => {
      cancelled = true
    }
  }, [open, debouncedQuery])

  const navGroup: ResultGroup = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const items = normalizedQuery
      ? STATIC_LINKS.filter(
          (item) =>
            item.title.toLowerCase().includes(normalizedQuery) ||
            item.subtitle?.toLowerCase().includes(normalizedQuery)
        )
      : STATIC_LINKS

    return { label: "Go to", items }
  }, [query])

  const groups = debouncedQuery.length >= 2 ? [...liveGroups, navGroup] : [navGroup]

  const flatItems = groups.flatMap((group) => group.items)

  useEffect(() => {
    setActiveIndex(0)
  }, [groups.length, flatItems.length])

  const go = (item: ResultItem) => {
    navigate(item.to)
    onClose()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, Math.max(flatItems.length - 1, 0)))
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      const item = flatItems[activeIndex]
      if (item) go(item)
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      onClose()
    }
  }

  let runningIndex = -1

  const hasNoResults = groups.every((group) => group.items.length === 0)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/30 backdrop-blur-[3px] px-4 pt-[10vh]"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onKeyDown={onKeyDown}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_80px_-20px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-center gap-3 border-b border-border px-5">
              <Search size={18} strokeWidth={1.8} className="shrink-0 text-muted-foreground" />

              <Input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search companies, users…"
                className="h-14 w-full flex-1 border-0 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground outline-none ring-0! focus:border-0 focus:outline-none focus:ring-0 focus-visible:[outline:none]! focus-visible:[ring:none]! focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 hover:border-0 hover:outline-none hover:ring-0 active:border-0 active:outline-none active:ring-0"
              />

              {searching ? (
                <Loader2 size={16} className="shrink-0 animate-spin text-primary" />
              ) : (
                <kbd className="hidden sm:inline-flex h-6 items-center rounded-md border border-border bg-muted px-2 text-[10px] font-medium text-muted-foreground shadow-[0_1px_1px_rgba(15,23,42,0.04)]">
                  ESC
                </kbd>
              )}
            </div>

            <div className="max-h-[55vh] overflow-y-auto px-2 py-2">
              {hasNoResults ? (
                <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                    <Search size={17} className="text-muted-foreground" />
                  </div>

                  <p className="text-sm font-semibold text-foreground">No results found</p>

                  <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                    We couldn't find anything matching "{debouncedQuery || query}".
                  </p>
                </div>
              ) : (
                groups.map((group) => {
                  if (group.items.length === 0) return null

                  return (
                    <div key={group.label} className="mb-2 last:mb-0">
                      <div className="px-3 pb-1.5 pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{group.label}</p>
                      </div>

                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          runningIndex += 1
                          const itemIndex = runningIndex
                          const isActive = itemIndex === activeIndex

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onMouseEnter={() => setActiveIndex(itemIndex)}
                              onClick={() => go(item)}
                              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-all duration-100 ${
                                isActive ? "bg-primary/[0.07]" : "hover:bg-muted"
                              }`}
                            >
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                                  isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground group-hover:bg-muted/70 dark:group-hover:bg-slate-700/70"
                                }`}
                              >
                                {item.icon}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className={`truncate text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                                  {item.title}
                                </p>

                                {item.subtitle && (
                                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.subtitle}</p>
                                )}
                              </div>

                              {isActive && (
                                <div className="hidden items-center gap-1.5 text-[10px] font-medium text-muted-foreground sm:flex">
                                  Open
                                  <kbd className="flex h-5 min-w-5 items-center justify-center rounded border border-border bg-card px-1">
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

            <div className="hidden items-center justify-between border-t border-border bg-muted/60 px-5 py-2.5 sm:flex">
              <p className="text-[11px] text-muted-foreground">Search companies and users</p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="flex gap-1">
                    <Key>↑</Key>
                    <Key>↓</Key>
                  </div>
                  Navigate
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Key>
                    <CornerDownLeft size={9} />
                  </Key>
                  Open
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
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

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-card px-1 text-[9px] font-medium text-muted-foreground shadow-sm">
      {children}
    </kbd>
  )
}
