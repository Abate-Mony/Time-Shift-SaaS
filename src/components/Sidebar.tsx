import {
  LayoutDashboard, Briefcase, Users, MapPin, Calendar, BarChart3,
  FileText, Bell, Settings, ChevronDown, Building2, HelpCircle,
  LogOut, Zap, CreditCard, MessageSquare
} from 'lucide-react'
import { Avatar } from './ui'
import { Link, useNavigate } from 'react-router'
import CustomNavLink from './ui/link'
import { cn } from '@/lib/utils'
import { logoutUser } from '@/utils/logout'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs', label: 'Jobs', icon: Briefcase, badge: 3 },
  { id: 'workers', label: 'Workers', icon: Users },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'locations', label: 'Locations', icon: MapPin },
  // { id: 'messages', label: 'Messages', icon: MessageSquare, badge: 2 },
]

const secondaryItems = [
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'timesheets', label: 'Timesheets', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: Zap },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

const bottomItems = [
  { id: 'notifications', label: 'Notifications', icon: Bell, badge: 2 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help Centre', icon: HelpCircle },
]

interface SidebarProps {
  active: string

  collapsed?: boolean
}

export function Sidebar({ active, collapsed }: SidebarProps) {
  const navigate = useNavigate()
  const onNavigate = (path: string) => navigate(path)
  return (
    <aside className={`${collapsed ? 'w-16' : 'w-[240px]'} h-screen bg-[#0F172A] border flex flex-col fixed left-0 top-0 z-30 transition-all duration-200`}>
      {/* Logo */}
      <div className="h-[60px] flex items-center px-5 border-b border-white/[0.06] shrink-0">
        {collapsed ? (
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-xs">W</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            <span className="text-white font-semibold text-base tracking-tight">work<span className="text-blue-400">.wrk</span></span>
          </div>
        )}
      </div>

      {/* Company selector */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-white/[0.06]">
          <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.05] transition-colors group">
            <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center shrink-0">
              <Building2 size={12} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-white/90 truncate">SecureGuard Ltd</p>
              <p className="text-[10px] text-white/40">Enterprise</p>
            </div>
            <ChevronDown size={12} className="text-white/30 group-hover:text-white/50 transition-colors" />
          </button>
        </div>
      )}

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-0.5">
        {!collapsed && <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 mb-1 mt-1">Main</p>}
        {navItems.map(item => (
          <CustomNavLink
            to={item.id}
            show
            selectedClassName=''
            animateClassName="inset-0 size-full bg-gray-500/15"
            className={`w-full  text-white/50 hover:text-white/75 hover:bg-white/3 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors relative group`}

          >
            <item.icon size={16} className={cn('text-blue-400 group-[.slide-active]:text-current')} />
            {!collapsed && <span className="flex-1 text-left font-medium">{item.label}</span>}
            {!collapsed && item.badge !== undefined && (
              <span className="bg-blue-500 text-white text-[10px] font-bold w-4 h-4 rounded-sm flex items-center justify-center">{item.badge}</span>
            )}
            {collapsed && item.badge !== undefined && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </CustomNavLink>
        ))}

        {!collapsed && <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 mb-1 mt-4">Reporting</p>}
        {collapsed && <div className="my-2 border-t border-white/[0.06]" />}
        {secondaryItems.map(item => (
          <CustomNavLink
            to={item.id}
            show
            selectedClassName=''
            animateClassName="inset-0 size-full bg-gray-500/15"
            className={`w-full  text-white/50 hover:text-white/75 hover:bg-white/3 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors relative group`}

          >
            <item.icon size={16} className={cn('text-blue-400 group-[.slide-active]:text-current')} />
            {!collapsed && <span className="flex-1 text-left font-medium">{item.label}</span>}


          </CustomNavLink>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-white/6 px-3 py-3 flex flex-col gap-0.5">
        {bottomItems.map(item => (
          <CustomNavLink
            to={item.id}
            show
            selectedClassName=''
            animateClassName="inset-0 size-full bg-gray-500/15"
            className={`w-full  text-white/50 hover:text-white/75 hover:bg-white/3 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors relative group`}

          >
            <item.icon size={16} className={cn('text-blue-400 group-[.slide-active]:text-current')} />
            {!collapsed && <span className="flex-1 text-left font-medium">{item.label}</span>}
            {!collapsed && item.badge !== undefined && (
              <span className="bg-blue-500 text-white text-[10px] font-bold w-4 h-4 rounded-sm flex items-center justify-center">{item.badge}</span>
            )}
            {collapsed && item.badge !== undefined && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </CustomNavLink>
        ))}
      </div>

      {/* User */}
      <div className="border-t border-white/6 p-3">
        <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group">
          <Avatar initials="OW" size="sm" index={0} />
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-white/80 truncate">Owen Wright</p>
                <p className="text-[10px] text-white/35">Owner</p>
              </div>

                <LogOut size={13} className="text-white/25 group-hover:text-white/50 transition-colors shrink-0" 
                onClick={()=>logoutUser()}
                />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

function NavItem({ item, active, onNavigate, collapsed }: { item: { id: string; label: string; icon: React.FC<{ size?: number; className?: string }>; badge?: number }; active: string; onNavigate: (id: string) => void; collapsed?: boolean }) {
  const isActive = active === item.id
  const Icon = item.icon
  return (
    <CustomNavLink
      to={item.id}
      // onClick={() => onNavigate(item.id)}
      title={collapsed ? item.label : undefined}
      show
      selectedClassName=''
      animateClassName="inset-0 size-full bg-white"
      // className='bg-white shadow-sm shadow-primary-color/20 py-2 text-black hover:bg-primary-color/20 group'
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors relative group`}

    >
      <Icon size={16} className={isActive ? 'text-blue-400' : 'text-current'} />
      {!collapsed && <span className="flex-1 text-left font-medium">{item.label}</span>}
      {!collapsed && item.badge !== undefined && (
        <span className="bg-blue-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{item.badge}</span>
      )}
      {collapsed && item.badge !== undefined && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
      )}
    </CustomNavLink>
  )
}
