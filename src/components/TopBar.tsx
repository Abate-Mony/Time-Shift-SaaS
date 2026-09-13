import { useEffect, useState } from 'react'
import { Bell, Briefcase, Building2, ChevronDown, Moon, PanelLeft, Plus, Receipt, Search, Sun } from 'lucide-react'
import { Button } from './ui/button'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import type { User } from '@/utils/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logoutUser } from '@/utils/logout'
import { getInitials } from '@/utils/getInitials'
import { getNotifications } from '@/utils/api-request-functions'
import { CommandPalette } from './CommandPalette'
import { useTheme } from '@/providers/ThemeProvider'

interface TopBarProps {
  onNewJob: () => void
  onToggleSidebar: () => void
  onNavigate: (id: string) => void
  user: User
}

const NEW_ITEMS = [
  { label: 'Job', to: '/create-job', icon: Briefcase },
  { label: 'Invoice', to: '/invoices/create', icon: Receipt },
  { label: 'Client', to: '/clients/create', icon: Building2 },
]

export function TopBar({ user, onToggleSidebar, onNavigate, onNewJob }: TopBarProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  // Real unread count, not the decorative static dot this used to be —
  // refetched periodically so it doesn't need a full page reload to update.
  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => getNotifications(1),
    refetchInterval: 60_000,
  })
  const unreadCount = data?.unreadCount ?? 0

  // ⌘K / Ctrl+K opens the command palette from anywhere — matches the
  // shortcut hints already shown in the account menu below.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(o => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const nav_dropdown_items = [
    {
      label: "Profile",
      to: "/settings/profile",
      shortcut: "⇧⌘P",
    },
    {
      label: "Billing",
      to: "/settings/billing",
      shortcut: "⌘B",
    },
    {
      label: "Settings",
      to: "/settings",
      shortcut: "⌘S",
    },
  ]
  return (
    <header className="h-[60px] bg-card border-b border-border flex items-center px-5 gap-4 sticky top-0 z-20">
      <button
        onClick={onToggleSidebar}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <PanelLeft size={16} />
      </button>

      {/* Search — opens the command palette rather than being a live input.
          It used to be SearchComponent, which just writes `?search=` onto
          whatever page you're currently on; that's the right behaviour for
          a page's own filter box, but silently does nothing on any page
          that isn't Jobs/Workers/Clients/Invoices, despite the placeholder
          promising it searches all of those from anywhere. */}
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="flex-1 max-w-md flex items-center gap-2.5 h-9 px-3 rounded-lg border border-border bg-muted text-left text-muted-foreground hover:bg-muted/70 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
      >
        <Search size={14} className="shrink-0" />
        <span className="flex-1 text-sm truncate">Search jobs, workers, clients, invoices…</span>
        <kbd className="hidden sm:inline-flex items-center h-5 px-1.5 rounded border border-border bg-card text-[10px] font-semibold text-muted-foreground shrink-0">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-2 ml-auto">

        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          onClick={() => onNavigate('/notifications')}
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 flex items-center justify-center bg-blue-500 text-white text-[9px] font-bold rounded-full border-2 border-card">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="lg">
              <Plus size={14} />
              New
              <ChevronDown size={12} className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {NEW_ITEMS.map(item => (
              <DropdownMenuItem key={item.to} asChild>
                {item.to === '/create-job' ? (
                  <button type="button" onClick={onNewJob} className="flex w-full items-center gap-2">
                    <item.icon size={13} className="text-muted-foreground" /> {item.label}
                  </button>
                ) : (
                  <Link to={item.to} className="flex w-full items-center gap-2">
                    <item.icon size={13} className="text-muted-foreground" /> {item.label}
                  </Link>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted transition-colors">
              <Avatar className="h-9 w-9">
                {user?.profilePhoto?.url && <AvatarImage src={user.profilePhoto.url} alt={user.fullname} />}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {
                    getInitials(user?.fullname)
                  }
                </AvatarFallback>
              </Avatar>

              <div className="hidden sm:flex flex-col min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight truncate">
                  {
                    user?.fullname
                  }
                </p>

                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {
                    user?.email
                  }
                </p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>

              {nav_dropdown_items.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link
                    to={item.to}
                    className="flex w-full items-center"
                  >
                    <span>{item.label}</span>

                    <DropdownMenuShortcut>
                      {item.shortcut}
                    </DropdownMenuShortcut>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => logoutUser()}
              className="text-red-600 focus:text-red-600"
            >
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>


      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

    </header>
  )
}
